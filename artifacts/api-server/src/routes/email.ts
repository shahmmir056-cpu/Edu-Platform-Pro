import { Router, type IRouter } from "express";
import { sendEmail, EmailNotConfiguredError } from "../lib/email";

const router: IRouter = Router();

/**
 * GET /api/email/status
 * Reports whether real email sending is configured and which env vars are missing.
 */
router.get("/email/status", (_req, res) => {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  res.json({ configured: missing.length === 0, missing });
});

/**
 * POST /api/email/send
 * Body: { to: string, subject: string, message: string }
 * Sends a REAL email via the Resend API.
 */
router.post("/email/send", async (req, res) => {
  const { to, subject, message } = (req.body ?? {}) as {
    to?: string;
    subject?: string;
    message?: string;
  };

  if (!to || typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    res.status(400).json({ error: "Missing or invalid required field: to" });
    return;
  }
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: subject" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  try {
    const { id } = await sendEmail(to.trim(), subject.trim(), message.trim());
    res.json({ ok: true, id, to: to.trim() });
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: err instanceof Error ? err.message : "Email send failed" });
  }
});

export default router;
