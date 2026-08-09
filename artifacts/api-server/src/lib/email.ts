import https from "node:https";
import { logger } from "./logger";

export class EmailNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Email is not configured. Set RESEND_API_KEY to enable real email sending.",
    );
    this.name = "EmailNotConfiguredError";
  }
}

const API_HOST = "api.resend.com";
const DEFAULT_FROM = "onboarding@resend.dev";

function httpsPost(
  hostname: string,
  path: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; data: any }> {
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
          resolve({ status: res.statusCode ?? 500, data });
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy(new Error("Email request timed out"));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Send a real email through the Resend API.
 * Throws EmailNotConfiguredError when credentials are missing and an Error
 * when the provider rejects the message.
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new EmailNotConfiguredError();

  const toEmail = to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;

  const body = JSON.stringify({
    from,
    to: [toEmail],
    subject: subject.slice(0, 200),
    text: text.slice(0, 10_000),
  });

  const { status, data } = await httpsPost(
    API_HOST,
    "/emails",
    {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  );

  if (status === 401 || status === 403) {
    logger.error({ status, error: data?.message }, "Resend auth failed");
    throw new Error("Email authorization failed. Check RESEND_API_KEY.");
  }

  if (status !== 200 && status !== 201) {
    logger.error({ status, error: data }, "Resend API error");
    const detail = data?.message || JSON.stringify(data);
    throw new Error(`Email API error ${status}: ${detail}`);
  }

  const id = data?.id;
  logger.info({ id, to: toEmail }, "Email sent");
  return { id: id ?? "" };
}
