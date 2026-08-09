export interface EmailSendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a REAL email through the backend (Resend API).
 * Returns ok:false with a readable error instead of throwing.
 */
export async function sendEmail(to: string, subject: string, message: string): Promise<EmailSendResult> {
  const address = to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, error: "No valid email address set." };
  }

  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: address, subject, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error ?? `Request failed (HTTP ${res.status})` };
    }
    return { ok: true, id: (data as { id?: string }).id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export interface EmailStatus {
  configured: boolean;
  missing: string[];
}

/**
 * Ask the backend whether real email sending is configured.
 * Falls back to null when the API is unreachable.
 */
export async function getEmailStatus(): Promise<EmailStatus | null> {
  try {
    const res = await fetch("/api/email/status", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as Partial<EmailStatus> | null;
    if (!data || typeof data.configured !== "boolean") return null;
    return { configured: data.configured, missing: Array.isArray(data.missing) ? data.missing : [] };
  } catch {
    return null;
  }
}
