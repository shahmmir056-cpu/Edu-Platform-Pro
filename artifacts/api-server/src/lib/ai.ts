import OpenAI from "openai";
import { logger } from "./logger";

/**
 * Thrown when no AI provider key is configured. Routes catch this and return
 * a clear 503 instead of a generic 500 so the frontend can show a helpful message.
 */
export class AiNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "No AI provider is configured. Set GROQ_API_KEY or GLM_API_KEY to enable AI generation.",
    );
    this.name = "AiNotConfiguredError";
  }
}

type TextProvider = {
  name: string;
  apiKey: string | undefined;
  baseURL: string;
  model: string;
};

function textProviders(): TextProvider[] {
  return [
    {
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
    },
    {
      name: "glm",
      apiKey: process.env.GLM_API_KEY,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-4.6",
    },
  ];
}

const clientCache = new Map<string, OpenAI>();

function clientFor(provider: TextProvider): OpenAI {
  const cached = clientCache.get(provider.name);
  if (cached) return cached;
  const created = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    fetch: globalThis.fetch,
  });
  clientCache.set(provider.name, created);
  return created;
}

/**
 * Calls the model with a system + user prompt and parses the response as JSON.
 * Tries each configured text provider in order (Groq, then GLM), retrying once
 * per provider on JSON parse failure, and falling through to the next provider
 * if a provider errors out (e.g. rate limit, outage).
 */
export async function generateJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const configured = textProviders().filter((p) => p.apiKey);
  if (configured.length === 0) {
    throw new AiNotConfiguredError();
  }

  const { system, user, maxTokens = 8192 } = params;
  let lastErr: unknown;

  for (const provider of configured) {
    const openai = clientFor(provider);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];

    const maxAttempts = 3;
    let providerFailed = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: provider.model,
          max_tokens: maxTokens,
          messages,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content ?? "";
        try {
          return JSON.parse(content) as T;
        } catch (err) {
          logger.warn(
            { attempt, provider: provider.name, err },
            "Failed to parse AI JSON response, retrying",
          );
          messages.push({ role: "assistant", content });
          messages.push({
            role: "user",
            content:
              "That was not valid JSON. Reply with ONLY a single valid JSON object, no markdown fences, no commentary. " +
              "Every string value -- including any multi-line text -- must be a properly quoted JSON string with newlines encoded as \\n escape sequences, never literal line breaks.",
          });
        }
      } catch (err) {
        // The provider's own JSON-mode validation rejected the generation (e.g. Groq's
        // json_validate_failed for malformed strings). Retry with a corrective nudge
        // rather than immediately abandoning this provider.
        lastErr = err;
        logger.warn(
          { attempt, provider: provider.name, err },
          "Provider rejected JSON generation, retrying",
        );
        if (attempt === maxAttempts - 1) {
          providerFailed = true;
          break;
        }
        messages.push({
          role: "user",
          content:
            "Your previous reply failed JSON validation. Reply again with ONLY a single valid JSON object: " +
            "every string value must be properly quoted with newlines encoded as \\n escape sequences, no literal line breaks inside strings, no markdown fences, no commentary.",
        });
      }
    }

    if (!providerFailed) {
      lastErr = new Error(`${provider.name} did not return valid JSON after retries`);
    }
    logger.warn({ provider: provider.name, err: lastErr }, "Text provider failed, trying next provider");
  }

  throw lastErr instanceof Error ? lastErr : new Error("All text providers failed");
}
