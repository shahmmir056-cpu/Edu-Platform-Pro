import { Router } from "express";
import https from "node:https";
import http from "node:http";

const router = Router();

const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://localhost:8080";

function proxyAudio(text: string, voice?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL("/tts", KOKORO_TTS_URL);
    const body = JSON.stringify({ text, voice: voice || undefined });
    const transport = urlObj.protocol === "https:" ? https : http;

    const req = transport.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
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
            return reject(new Error(`Kokoro TTS error ${res.statusCode}: ${errMsg}`));
          }
          resolve(buf);
        });
        res.on("error", reject);
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Kokoro TTS request timed out"));
    });

    req.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.message.includes("timed out")) {
        reject(new Error("TTS_SERVICE_UNAVAILABLE"));
      } else {
        reject(err);
      }
    });

    req.write(body);
    req.end();
  });
}

router.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "Text is required" });
      return;
    }
    if (text.length > 5000) {
      res.status(400).json({ error: "Text exceeds 5000 character limit" });
      return;
    }

    const audio = await proxyAudio(text.trim(), voice);

    res.set("Content-Type", "audio/wav");
    res.set("Content-Length", audio.length.toString());
    res.status(200);
    res.end(audio);
  } catch (err: any) {
    if (err.message === "TTS_SERVICE_UNAVAILABLE") {
      res.status(503).json({ error: "TTS service unavailable" });
      return;
    }
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

router.get("/tts/health", async (_req, res) => {
  try {
    const urlObj = new URL("/health", KOKORO_TTS_URL);
    const transport = urlObj.protocol === "https:" ? https : http;
    const proxyReq = transport.get(urlObj, (proxyRes) => {
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
    proxyReq.setTimeout(5000, () => {
      proxyReq.destroy();
      res.json({ status: "unreachable" });
    });
  } catch {
    res.json({ status: "unreachable" });
  }
});

export default router;
