/**
 * Gemini API Client — ISOLATED from the Groq-based ai.ts.
 * Uses native node:https. No shared state, no shared keys.
 */
import https from "node:https";
import { logger } from "./logger";

const GEMINI_HOST = "generativelanguage.googleapis.com";
const GEMINI_MODEL = "gemini-2.0-flash";

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          let data: any;
          try { data = JSON.parse(raw); } catch { data = { error: raw }; }
          resolve({ status: res.statusCode ?? 500, data });
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(60_000, () => req.destroy(new Error("Gemini request timed out")));
    req.write(body);
    req.end();
  });
}

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("No Gemini API key configured. Set GEMINI_API_KEY to enable AI analysis.");
    this.name = "GeminiNotConfiguredError";
  }
}

export async function geminiGenerate(params: {
  systemInstruction: string;
  contents: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiNotConfiguredError();

  const { systemInstruction, contents, maxTokens = 4096, temperature = 0.7 } = params;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: contents }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });

  const path = `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { status, data } = await httpsPost(GEMINI_HOST, path, {
        "Content-Type": "application/json",
      }, body);

      if (status === 429) {
        const wait = 30_000 * (attempt + 1);
        logger.warn({ attempt, wait }, "Gemini rate limited, waiting");
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (status !== 200) {
        throw new Error(`Gemini API error ${status}: ${JSON.stringify(data?.error || data)}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return text;
    } catch (err) {
      logger.warn({ attempt, err }, "Gemini request failed");
      if (attempt < 2) await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
      else throw err;
    }
  }

  throw new Error("Gemini API failed after retries");
}

export async function geminiGenerateJson<T>(params: {
  systemInstruction: string;
  contents: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const text = await geminiGenerate(params);
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    throw new Error("Gemini returned non-JSON response");
  }
}
