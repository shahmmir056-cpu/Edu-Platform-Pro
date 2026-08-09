import { Router, type IRouter } from "express";
import { sendWhatsAppMessage, WhatsAppNotConfiguredError } from "../lib/whatsapp";

const router: IRouter = Router();

/**
 * GET /api/whatsapp/status
 * Reports whether real WhatsApp sending is configured and which env vars are missing.
 */
router.get("/whatsapp/status", (_req, res) => {
  const missing: string[] = [];
  if (!process.env.WHATSAPP_TOKEN) missing.push("WHATSAPP_TOKEN");
  if (!process.env.WHATSAPP_PHONE_ID) missing.push("WHATSAPP_PHONE_ID");
  res.json({ configured: missing.length === 0, missing });
});

/**
 * POST /api/whatsapp/send
 * Body: { to: string, message: string }
 * Sends a REAL WhatsApp text message via the Meta Cloud API.
 */
router.post("/whatsapp/send", async (req, res) => {
  const { to, message } = (req.body ?? {}) as { to?: string; message?: string };

  if (!to || typeof to !== "string") {
    res.status(400).json({ error: "Missing required field: to" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  try {
    const { messageId } = await sendWhatsAppMessage(to, message.trim());
    res.json({ ok: true, messageId, to: to.replace(/\D/g, "") });
  } catch (err) {
    if (err instanceof WhatsAppNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: err instanceof Error ? err.message : "WhatsApp send failed" });
  }
});

export default router;
