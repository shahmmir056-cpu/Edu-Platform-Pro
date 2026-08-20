import https from "node:https";
import { logger } from "./logger";

export class AiNotConfiguredError extends Error {
  constructor(message?: string) {
    super(message ?? "No AI provider configured. Set GROQ_API_KEY to enable AI generation.");
    this.name = "AiNotConfiguredError";
  }
}

const GROQ_HOST = "api.groq.com";
const GROQ_PATH = "/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_RETRIES = 3;

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; data: any; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          let data: any;
          try {
            data = JSON.parse(raw);
          } catch {
            data = { error: raw };
          }
          resolve({ status: res.statusCode ?? 500, data, headers: res.headers });
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(120_000, () => {
      req.destroy(new Error("Groq request timed out"));
    });
    req.write(body);
    req.end();
  });
}

function getRetryAfterMs(headers: Record<string, string | string[] | undefined>, data: any): number {
  const retryAfter = headers["retry-after"];
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
  }
  const msg = data?.error?.message || "";
  const match = msg.match(/try again in ([\d.]+)s/);
  if (match) return Math.ceil(Number(match[1]) * 1000);
  return 30_000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type ChatMessage = { role: string; content: string };

export async function generateJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  const { system, user, maxTokens = 4000 } = params;
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const body = JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages,
    });

    try {
      const { status, data, headers } = await httpsPost(GROQ_HOST, GROQ_PATH, {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      }, body);

      if (status === 429) {
        const waitMs = getRetryAfterMs(headers, data);
        logger.warn({ attempt, waitMs }, "Rate limited by Groq, waiting");
        lastErr = new Error(data?.error?.message || "Rate limited");
        if (attempt < MAX_RETRIES - 1) {
          await sleep(waitMs);
          continue;
        }
        break;
      }

      if (status !== 200) {
        const errMsg = data?.error?.message || JSON.stringify(data);
        throw new Error(`Groq API error ${status}: ${errMsg}`);
      }

      const content: string = data.choices?.[0]?.message?.content ?? "";

      try {
        return JSON.parse(content) as T;
      } catch {
        logger.warn({ attempt }, "Non-JSON response, asking model to retry");
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content:
            "Your reply was not valid JSON. Reply with ONLY a single valid JSON object. " +
            "No markdown fences, no commentary. Every string value must use \\n for newlines.",
        });
      }
    } catch (err) {
      lastErr = err;
      logger.warn({ attempt, err }, "Groq request failed");
      if (attempt < MAX_RETRIES - 1) {
        messages.push({
          role: "user",
          content: "Your previous reply failed validation. Reply with ONLY a single valid JSON object.",
        });
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Groq API failed after retries");
}
