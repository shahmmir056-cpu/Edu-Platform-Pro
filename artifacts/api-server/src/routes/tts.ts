import { Router } from "express";
import https from "node:https";
import http from "node:http";

const router = Router();

const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://localhost:8080";

function proxyAudio(text: string, voice?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL("/tts", KOKORO_TTS_URL);
    const body = JSON.stringify({ text, voice: voice || undefined });
    const isHttps = urlObj.protocol === "https:";
    const mod = isHttps ? https : http;

    const req = mod.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 60_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            const errMsg = buf.toString("utf-8").slice(0, 200);
            reject(new Error(`Kokoro TTS error ${res.statusCode}: ${errMsg}`));
          } else {
            resolve(buf);
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

router.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: "Text exceeds 5000 character limit" });
    }
    const audio = await proxyAudio(text.trim(), voice);
    res.set("Content-Type", "audio/wav");
    res.set("Content-Length", audio.length.toString());
    res.send(audio);
  } catch (err: any) {
    if (err.message?.includes("connect")) {
      return res.status(503).json({ error: "TTS service unavailable" });
    }
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

router.get("/tts/health", async (_req, res) => {
  try {
    const urlObj = new URL("/health", KOKORO_TTS_URL);
    const mod = urlObj.protocol === "https:" ? https : http;
    const proxyReq = mod.get(urlObj, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (c: string) => (data += c));
      proxyRes.on("end", () => {
        try {
          res.json(JSON.parse(data));
        } catch {
          res.json({ status: "unknown" });
        }
      });
    });
    proxyReq.on("error", () => res.json({ status: "unreachable" }));
    proxyReq.setTimeout(5000);
  } catch {
    res.json({ status: "unreachable" });
  }
});

export default router;
