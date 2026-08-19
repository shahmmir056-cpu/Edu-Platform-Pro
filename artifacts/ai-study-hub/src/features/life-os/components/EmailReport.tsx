import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, Clock3, Bell, BellRing, Check, Copy, Eye, EyeOff, Zap, FileDown, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { LifeOsState } from "../types";
import { buildDailyReport, todayKey } from "../engine";
import { downloadDailyReportPdf } from "../pdf";
import { sendEmail, getEmailStatus, type EmailStatus } from "../emailClient";
import { Glass, PanelHeader, TimeInput, useTheme } from "./ui";

export function EmailReport({ state, onStateChange }: { state: LifeOsState; onStateChange: (s: LifeOsState | ((prev: LifeOsState) => LifeOsState)) => void }) {
  const { t } = useTheme();
  const cfg = state.dailyReport;
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [summaryState, setSummaryState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEmailStatus().then((s) => {
      if (!cancelled) setEmailStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const email = cfg.email.trim().toLowerCase();

  const sendTest = async () => {
    if (!email) return;
    setTestState("sending");
    setTestError(null);
    const res = await sendEmail(email, "StudyOS | Test message", "StudyOS test message: your email reminders and daily reports are connected and working.");
    if (res.ok) {
      setTestState("sent");
    } else {
      setTestState("error");
      setTestError(res.error ?? "Unknown error");
    }
  };

  const report = useMemo(() => buildDailyReport(state), [state]);
  const today = todayKey();

  const update = (patch: Partial<typeof cfg>) => onStateChange({ ...state, dailyReport: { ...cfg, ...patch } });

  const sendNow = async () => {
    if (!email) return;
    setSummaryState("sending");
    setSummaryError(null);
    const res = await sendEmail(email, `StudyOS Daily Report — ${today}`, report);
    if (res.ok) {
      setSummaryState("sent");
    } else {
      setSummaryState("error");
      setSummaryError(res.error ?? "Unknown error");
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  // automatic daily report: when enabled and the clock reaches the target time,
  // generate the PDF (once per day) and mark the report ready so the student
  // can also fire the summary by email.
  useEffect(() => {
    if (!cfg.enabled) return;
    const check = () => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [h = 20, m = 0] = cfg.time.split(":").map(Number);
      if (nowMin >= h * 60 + m && cfg.lastSent !== todayKey()) {
        downloadDailyReportPdf(state);
        setReady(true);
        onStateChange((prev) => ({
          ...prev,
          dailyReport: { ...prev.dailyReport, lastSent: todayKey() },
        }));
      }
    };
    check();
    const id = window.setInterval(check, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.enabled, cfg.time, cfg.lastSent, state]);

  return (
    <Glass strong glow className="lg-scroll-y">
      <PanelHeader icon={<FileDown size={15} />} title="PDF + Email" right={
        cfg.enabled && email ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(78,156,111,0.14)", border: `1px solid ${t.inputBorder}`, color: "#4E9C6F" }}>
            <Bell size={11} /> Auto at {cfg.time}
          </span>
        ) : undefined
      } />

      <p className="text-sm leading-relaxed mb-5" style={{ color: t.muted }}>
        Every evening a professional PDF report of your day — blocks completed, study time, XP, every tool you used, what you searched and the results you got — is generated and downloaded automatically. When study time arrives, a real motivational email is sent to you with the tools you should use. A matching text summary is emailed at your chosen time.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>Email Address</label>
          <input
            type="email"
            value={cfg.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="your-email@example.com"
            inputMode="email"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2"
            style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${t.glow}`)}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
          />
          <p className="text-[10px] mt-1.5" style={{ color: t.muted }}>The address your report and study-time reminders are sent to.</p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>Send Time</label>
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
              <div className="pl-9">
                <TimeInput value={cfg.time} onChange={(v) => update({ time: v })} />
              </div>
            </div>
            <button
              onClick={() => update({ enabled: !cfg.enabled })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: cfg.enabled ? "rgba(78,156,111,0.14)" : t.inputBg,
                border: `1.5px solid ${cfg.enabled ? "rgba(78,156,111,0.4)" : t.inputBorder}`,
                color: cfg.enabled ? "#4E9C6F" : t.muted,
              }}
            >
              {cfg.enabled ? <Bell size={13} /> : <Bell size={13} className="opacity-50" />}
              {cfg.enabled ? "Auto On" : "Auto Off"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}` }}>
        <BellRing size={16} className="shrink-0" style={{ color: cfg.remindersEnabled ? "#4E9C6F" : t.muted }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: t.text }}>Study Time Email Reminders</p>
          <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
            When a study block starts, a real motivational email with your suggested tools is sent to this address.
          </p>
        </div>
        <button
          onClick={() => update({ remindersEnabled: !cfg.remindersEnabled })}
          className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300"
          style={{ background: cfg.remindersEnabled ? "#4E9C6F" : t.inputBorder }}
          aria-label="Toggle study time reminders"
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
            style={{ left: cfg.remindersEnabled ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: emailStatus && !emailStatus.configured ? "rgba(217,83,79,0.08)" : t.inputBg, border: `1.5px solid ${emailStatus && !emailStatus.configured ? "rgba(217,83,79,0.35)" : t.inputBorder}` }}>
        <AlertTriangle size={16} className="shrink-0" style={{ color: emailStatus && !emailStatus.configured ? "#D9534F" : "#4E9C6F" }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: emailStatus && !emailStatus.configured ? "#B0453F" : t.text }}>
            {emailStatus === null ? "Checking email connection..." : emailStatus.configured ? "Email sending is connected and ready" : "Email sending is not configured yet"}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
            {emailStatus === null
              ? "Contacting the server..."
              : emailStatus.configured
                ? "Real emails will be delivered through the Resend API."
                : `Add ${emailStatus.missing.join(" and ")} to api-server/.env (or your host's environment variables), then restart the server. Real sending is disabled until then.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 mt-5">
        <button
          onClick={() => downloadDailyReportPdf(state)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff" }}
        >
          <FileDown size={15} /> Download PDF Report
        </button>
        <button
          onClick={sendNow}
          disabled={!email || summaryState === "sending"}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #4285F4, #1a56db)", color: "#fff" }}
        >
          {summaryState === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {summaryState === "sending" ? "Sending..." : "Email Report to Me"}
        </button>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
        >
          {showPreview ? <EyeOff size={15} /> : <Eye size={15} />} {showPreview ? "Hide" : "Preview"} Report
        </button>
        <button
          onClick={copyReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
        >
          {copied ? <Check size={15} style={{ color: "#4E9C6F" }} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={sendTest}
          disabled={!email || testState === "sending"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "rgba(66,133,244,0.1)", border: `1px solid rgba(66,133,244,0.35)`, color: "#1a56db" }}
        >
          {testState === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          {testState === "sending" ? "Sending..." : "Send Real Test Email"}
        </button>
      </div>

      <AnimatePresence>
        {testState === "sent" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
            style={{ background: "rgba(78,156,111,0.12)", border: `1px solid rgba(78,156,111,0.3)` }}
          >
            <CheckCircle2 size={15} className="shrink-0" style={{ color: "#4E9C6F" }} />
            <span className="text-xs font-medium" style={{ color: "#2F8A60" }}>
              Real email delivered. Check your inbox!
            </span>
          </motion.div>
        )}
        {testState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
            style={{ background: "rgba(217,83,79,0.1)", border: `1px solid rgba(217,83,79,0.3)` }}
          >
            <AlertTriangle size={15} className="shrink-0" style={{ color: "#D9534F" }} />
            <span className="text-xs font-medium" style={{ color: "#B0453F" }}>
              Not sent: {testError}{emailStatus && !emailStatus.configured ? ` The server needs ${emailStatus.missing.join(" and ")} configured to enable real email sending.` : ""}
            </span>
          </motion.div>
        )}
        {summaryState === "sent" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
            style={{ background: "rgba(78,156,111,0.12)", border: `1px solid rgba(78,156,111,0.3)` }}
          >
            <CheckCircle2 size={15} className="shrink-0" style={{ color: "#4E9C6F" }} />
            <span className="text-xs font-medium" style={{ color: "#2F8A60" }}>
              Daily report emailed. Check your inbox!
            </span>
          </motion.div>
        )}
        {summaryState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
            style={{ background: "rgba(217,83,79,0.1)", border: `1px solid rgba(217,83,79,0.3)` }}
          >
            <AlertTriangle size={15} className="shrink-0" style={{ color: "#D9534F" }} />
            <span className="text-xs font-medium" style={{ color: "#B0453F" }}>
              Not sent: {summaryError}.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
            style={{ background: "rgba(78,156,111,0.12)", border: `1px solid rgba(78,156,111,0.3)` }}
          >
            <Zap size={15} className="shrink-0" style={{ color: "#4E9C6F" }} />
            <span className="text-xs font-medium flex-1" style={{ color: "#2F8A60" }}>
              It's report time! Today's PDF has been downloaded. You can also tap <span className="font-bold">Email Report to Me</span> to deliver the text summary.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <pre
              className="mt-4 rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-72 overflow-y-auto lg-scroll"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            >
              {report}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </Glass>
  );
}
