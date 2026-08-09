import https from "node:https";
import { logger } from "./logger";

export class WhatsAppNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "WhatsApp is not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to enable real WhatsApp sending.",
    );
    this.name = "WhatsAppNotConfiguredError";
  }
}

const GRAPH_HOST = "graph.facebook.com";
const GRAPH_VERSION = "v21.0";

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
      req.destroy(new Error("WhatsApp request timed out"));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Send a real WhatsApp text message through the Meta WhatsApp Cloud API.
 * Throws WhatsAppNotConfiguredError when credentials are missing and a
 * WhatsAppSendError when the provider rejects the message.
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
): Promise<{ messageId: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) throw new WhatsAppNotConfiguredError();

  const toNumber = to.replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(toNumber)) {
    throw new Error(`Invalid WhatsApp number: ${to}`);
  }

  const body = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toNumber,
    type: "text",
    text: { body: text.slice(0, 4096) },
  });

  const { status, data } = await httpsPost(
    GRAPH_HOST,
    `/${GRAPH_VERSION}/${phoneId}/messages`,
    {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  );

  if (status === 401 || status === 403) {
    logger.error({ status, error: data?.error }, "WhatsApp auth failed");
    throw new Error("WhatsApp authorization failed. Check WHATSAPP_TOKEN and WHATSAPP_PHONE_ID.");
  }

  if (status !== 200 && status !== 201) {
    logger.error({ status, error: data?.error }, "WhatsApp API error");
    const detail = data?.error?.message || JSON.stringify(data);
    throw new Error(`WhatsApp API error ${status}: ${detail}`);
  }

  const messageId = data?.messages?.[0]?.id;
  logger.info({ messageId, to: toNumber }, "WhatsApp message sent");
  return { messageId: messageId ?? "" };
}
