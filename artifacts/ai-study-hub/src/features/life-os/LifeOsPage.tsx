import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, LogOut, Sun, Moon, Home, Clock, Flame, Bot,
} from "lucide-react";
import type { LifeOsState } from "./types";
import { ACTIVITY_KEY, STATE_KEY, freshState, loadState, saveState } from "./storage";
import { applyActivity, computeDailyStats, fmtDuration, generateRoutine, grantBadge, toClock, todayKey, toolMinutesOn } from "./engine";
import { ACTIVITY_EVENT, readActivityLog, type ActivityEvent } from "./tracker";
import { toolListForSubject } from "./toolSuggestions";
import { sendEmail } from "./emailClient";
import { ThemeProvider, ParticleField, SectionTitle, useTheme, type LifeOsTheme } from "./components/ui";

import { Onboarding } from "./components/Onboarding";
import { Timetable } from "./components/Timetable";
import { UsageAnalysis } from "./components/UsageAnalysis";
import { EmailReport } from "./components/EmailReport";

function Logo() {
  const { t } = useTheme();
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.peach})`, color: "#fff" }}
      >
        <GraduationCap size={17} />
      </div>
      <div className="leading-tight">
        <div className="font-bold text-sm tracking-tight" style={{ color: t.text }}>
          StudyOS
        </div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.muted }}>
          Timetable · Analytics · Report
        </div>
      </div>
    </Link>
  );
}

function Hub({ state, setState }: { state: LifeOsState; setState: React.Dispatch<React.SetStateAction<LifeOsState>> }) {
  const { t, theme, toggleTheme } = useTheme();
  const profile = state.profile!;
  const stateRef = useRef(state);
  stateRef.current = state;

  const [notice, setNotice] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ── real study-time motivation email reminders ──
  const REMINDER_KEY = "studyos-reminders-sent-v1";
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMINDER_KEY);
      if (raw) notifiedRef.current = new Set(JSON.parse(raw) as string[]);
    } catch {
      // storage unavailable — ignore
    }
  }, []);

  useEffect(() => {
    const cfg = state.dailyReport;
    const email = cfg.email.trim().toLowerCase();
    if (!cfg.remindersEnabled || !email || !state.profile) return;
    const check = () => {
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      for (const b of state.routine) {
        if (b.type !== "study" && b.type !== "mission") continue;
        if (b.status !== "pending") continue;
        if (nowMin < b.startMin || nowMin >= b.endMin) continue;
        if (notifiedRef.current.has(b.id)) continue;
        const tools = b.subject ? toolListForSubject(b.subject) : "";
        const message = [
          "StudyOS | Time to study",
          `Subject: ${b.subject ?? "your plan"}`,
          `Time: ${toClock(b.startMin)} - ${toClock(b.endMin)}`,
          `Plan: ${b.objective}`,
          tools ? `Suggested tools: ${tools}` : "",
          "",
          "Start with a focused block now. One step at a time — you've got this!",
        ]
          .filter((l) => l.length > 0)
          .join("\n");
        notifiedRef.current.add(b.id);
        try {
          localStorage.setItem(REMINDER_KEY, JSON.stringify([...notifiedRef.current]));
        } catch {
          // storage unavailable — ignore
        }
        sendEmail(email, "StudyOS | Time to study", message).then((res) => {
          if (res.ok) {
            setNotice(`Study time for ${b.subject ?? "your plan"}! Motivational email sent to ${email}.`);
          } else {
            setNotice(`Couldn't send study reminder email: ${res.error}`);
          }
        });
      }
    };
    check();
    const id = window.setInterval(check, 30000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.routine, state.dailyReport, state.profile]);

  // live activity feed from every website tool
  const queueRef = useRef<ActivityEvent[]>([]);
  const timerRef = useRef<number | null>(null);

  const flushQueue = () => {
    if (!queueRef.current.length) return;
    const batch = queueRef.current;
    queueRef.current = [];
    const prev = stateRef.current;
    if (!prev.profile) return;
    const res = applyActivity(prev, batch);
    const notes: string[] = [];
    if (res.autoCompleted.length) {
      const names = [...new Set(res.autoCompleted.map((b) => b.subject ?? b.type))].join(", ");
      notes.push(`AI detected your real work and marked blocks complete: ${names}`);
    }
    if (res.newXp > 0) notes.push(`+${res.newXp} XP earned from tool usage`);
    if (notes.length) setNotice(notes.join(" · "));
    setState(res.state);
  };

  const enqueueActivity = (events: ActivityEvent[]) => {
    if (!events.length) return;
    queueRef.current.push(...events);
    if (timerRef.current == null) {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        flushQueue();
      }, 60);
    }
  };

  useEffect(() => {
    enqueueActivity(readActivityLog());
    const onEvt = (e: Event) => enqueueActivity([(e as CustomEvent<ActivityEvent>).detail]);
    window.addEventListener(ACTIVITY_EVENT, onEvt);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, onEvt);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshRoutine = () => {
    setState((prev) => {
      if (!prev.profile) return prev;
      const routine = generateRoutine(prev.profile, {});
      const today = todayKey();
      const dailyStats = prev.dailyStats[today]
        ? prev.dailyStats
        : { ...prev.dailyStats, [today]: computeDailyStats(routine, prev.profile) };
      return { ...prev, routine, routineDate: today, dailyStats };
    });
  };

  // regenerate the timetable on a new day / first login
  useEffect(() => {
    if (!state.profile) return;
    if (state.routineDate !== todayKey() || state.routine.length === 0) {
      refreshRoutine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profile, state.routineDate]);

  // persist
  useEffect(() => {
    if (state.profile || state.onboarded) saveState(state);
  }, [state]);

  const logout = () => {
    try {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(ACTIVITY_KEY);
    } catch {
      // storage unavailable — ignore
    }
    setState(freshState());
    setConfirmLogout(false);
  };

  const today = todayKey();
  const todayStats = useMemo(() => {
    const live = computeDailyStats(state.routine, profile);
    const stored = state.dailyStats[today];
    return {
      studyMin: Math.max(live.studyMin, stored?.studyMin ?? 0, toolMinutesOn(state, today)),
      completion: Math.max(live.completion, stored?.completion ?? 0),
    };
  }, [state.routine, state.dailyStats, state.toolActivity, profile, today]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative h-dvh flex flex-col overflow-hidden" style={{ background: t.bg, color: t.text }}>
      {/* warm liquid-glass orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{ width: 620, height: 620, top: "-12%", left: "-8%", background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, filter: "blur(70px)", animation: "lg-orb-1 22s ease-in-out infinite" }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 560, height: 560, bottom: "-14%", right: "-8%", background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, filter: "blur(70px)", animation: "lg-orb-2 24s ease-in-out infinite" }}
        />
      </div>
      <ParticleField />

      {/* top bar */}
      <header
        className="relative z-40 flex items-center justify-between px-4 md:px-6 py-3 shrink-0"
        style={{
          background: `color-mix(in srgb, ${t.bg} 78%, transparent)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.primary }}
          >
            <Clock size={13} /> {fmtDuration(todayStats.studyMin)} today
          </span>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.primary }}
          >
            <Flame size={13} /> {state.gamification.streak}d streak
          </span>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            href="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            aria-label="Back to home"
          >
            <Home size={16} />
          </Link>
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: "#D9534F" }}
            aria-label="Log out and start fresh"
            title="Log out and start fresh"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* content */}
      <main className="relative z-10 flex-1 overflow-y-auto lg-scroll max-w-5xl w-full mx-auto px-4 md:px-6 py-8">
        {/* greeting */}
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: t.muted }}>{greeting}</div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight mt-0.5" style={{ color: t.text }}>
            {profile.name}
          </h1>
          <div className="text-xs mt-1" style={{ color: t.muted }}>{dateLabel} · {todayStats.completion}% of today's plan done</div>
        </div>

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2.5"
              style={{ background: "rgba(58,156,111,0.1)", border: "1px solid rgba(58,156,111,0.28)", color: "#2F8A60" }}
            >
              <Bot size={16} className="shrink-0" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          <section>
            <SectionTitle eyebrow="Step 1 — Plan" title="Your Study Timetable" desc="Create your daily timetable interactively, or let the AI plan your study blocks around school, meals and travel." />
            <Timetable state={state} onStateChange={(s) => setState(s)} onRegenerate={refreshRoutine} />
          </section>

          <section>
            <SectionTitle eyebrow="Step 2 — Track" title="How You Use Every Tool" desc="Every minute spent in any learning tool on this platform is recorded automatically and shown here." />
            <UsageAnalysis state={state} />
          </section>

          <section>
            <SectionTitle eyebrow="Step 3 — Report" title="Daily Report — PDF + Email" desc="Every evening, a professional PDF report of your day is generated automatically — covering your timetable, every tool you used, what you searched and the results you got." />
            <EmailReport state={state} onStateChange={(s) => setState(s)} />
          </section>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-[11px] shrink-0" style={{ color: t.muted }}>
        StudyOS — Plan · Track · Report
      </footer>

      {/* ── logout confirmation ── */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(20,16,12,0.55)", backdropFilter: "blur(8px)" }}
            onClick={() => setConfirmLogout(false)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-3xl p-7 text-center"
              style={{ background: t.panelStrong, border: `1.5px solid ${t.border}`, boxShadow: t.shadowStrong, WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }}
              initial={{ scale: 0.7, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(217,83,79,0.12)", border: "1px solid rgba(217,83,79,0.25)", color: "#D9534F" }}
              >
                <LogOut size={22} />
              </div>
              <h3 className="text-xl font-serif font-semibold" style={{ color: t.text }}>
                Log out and start fresh?
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: t.muted }}>
                Your profile, timetable and all progress will be reset so you can start again from the beginning.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "#D9534F", color: "#fff" }}
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LifeOsPage() {
  const [state, setState] = useState<LifeOsState>(() => loadState());
  const theme: LifeOsTheme = state.gamification.theme;

  const completeOnboarding = (p: LifeOsState["profile"]) => {
    if (!p) return;
    setState((prev) => {
      const routine = generateRoutine(p, {});
      const today = todayKey();
      return {
        ...prev,
        profile: p,
        onboarded: true,
        routine,
        routineDate: today,
        gamification: grantBadge(prev.gamification, "first-routine"),
        dailyStats: { ...prev.dailyStats, [today]: computeDailyStats(routine, p) },
      };
    });
  };

  return (
    <ThemeProvider theme={theme} setTheme={(th) => setState((prev) => ({ ...prev, gamification: { ...prev.gamification, theme: th, themeUserSet: true } }))}>
      {state.profile && state.onboarded ? (
        <Hub state={state} setState={setState} />
      ) : (
        <div className="relative h-dvh flex flex-col overflow-hidden" style={{ background: theme === "dark" ? "#191512" : "#FFF8F0" }}>
          <ParticleField />
          <header className="relative z-10 flex shrink-0 items-center justify-between px-4 md:px-6 py-3">
            <Logo />
            <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(45,45,45,0.16)"}`, color: theme === "dark" ? "#F5EDE3" : "#2D2D2D" }} aria-label="Back to home">
              <Home size={16} />
            </Link>
          </header>
          <main className="relative z-10 flex-1 overflow-y-auto lg-scroll py-10 px-4">
            <Onboarding initial={state.profile} onComplete={completeOnboarding} />
          </main>
        </div>
      )}
    </ThemeProvider>
  );
}
