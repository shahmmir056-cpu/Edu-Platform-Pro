import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import type { LifeOsState } from "../types";
import { coachReply, grantBadge, todayKey, computeDailyStats, toolMinutesOn, analyze } from "../engine";
import { Glass, PanelHeader, useTheme } from "./ui";

const QUICK_PROMPTS = [
  { label: "I'm tired", icon: "😩" },
  { label: "How am I doing?", icon: "📊" },
  { label: "Help me focus", icon: "🎯" },
  { label: "Exam tips", icon: "📝" },
  { label: "I'm stressed", icon: "😰" },
  { label: "What should I do now?", icon: "🧭" },
];

export function CoachChat({ state, onStateChange }: { state: LifeOsState; onStateChange: (s: LifeOsState) => void }) {
  const { t } = useTheme();
  const profile = state.profile!;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = todayKey();
  const todayStats = computeDailyStats(state.routine, profile);
  const studyMin = Math.max(todayStats.studyMin, state.dailyStats[today]?.studyMin ?? 0, toolMinutesOn(state, today));
  const analysis = analyze(profile);

  const completion = Math.max(todayStats.completion, state.dailyStats[today]?.completion ?? 0);
  const streak = state.gamification.streak;
  const nextExam = analysis.nextExam;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.coachMessages.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");

    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, text: trimmed, at: Date.now() };
    const ctx = {
      profile,
      completion,
      streak,
      level: state.gamification.level,
      xp: state.gamification.xp,
      studyMin,
      nextExam: nextExam ? `${nextExam.subject} in ${nextExam.days}d` : undefined,
      emergency: state.emergency,
    };
    const reply = coachReply(trimmed, ctx);
    const coachMsg = { id: `coach-${Date.now()}`, role: "coach" as const, text: reply, at: Date.now() };

    const newMessages = [...state.coachMessages, userMsg, coachMsg];
    const newGamification = grantBadge(state.gamification, "coach-confidant");
    onStateChange({ ...state, coachMessages: newMessages, gamification: newGamification });
  };

  const bubbleCls = (role: string) =>
    role === "user"
      ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md px-4 py-3"
      : "mr-auto max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3";

  return (
    <Glass className="flex flex-col overflow-hidden" style={{ height: "480px" }}>
      <PanelHeader
        icon={<Bot size={18} style={{ color: t.primary }} />}
        title="Sage — AI Mentor"
        right={
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(58,156,111,0.12)", color: "#2F8A60" }}>
            Online
          </span>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto lg-scroll px-4 py-4 space-y-4">
        {state.coachMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(135deg, ${t.primary}20, ${t.peach}20)`, border: `1.5px solid ${t.primary}30` }}
            >
              <Sparkles size={28} style={{ color: t.primary }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: t.text }}>Hey {profile.name} 👋</p>
            <p className="text-xs leading-relaxed max-w-[260px]" style={{ color: t.muted }}>
              I'm <span className="font-bold" style={{ color: t.primary }}>Sage</span>, your AI study mentor. Ask me anything about your routine, focus, stress, or exams.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {state.coachMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div
                className={bubbleCls(msg.role)}
                style={{
                  background: msg.role === "user" ? t.primary : t.inputBg,
                  color: msg.role === "user" ? "#fff" : t.text,
                  border: msg.role === "coach" ? `1px solid ${t.inputBorder}` : "none",
                  whiteSpace: "pre-line",
                }}
              >
                {msg.role === "coach" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.peach})`, color: "#fff" }}
                    >
                      <Bot size={13} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.primary }}>Sage</span>
                  </div>
                )}
                <span className="text-sm leading-relaxed">{msg.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {state.coachMessages.length === 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => send(p.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-4 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Sage anything..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: t.inputBg,
              border: `1.5px solid ${t.inputBorder}`,
              color: t.text,
              // @ts-expect-error CSS custom property
              "--tw-ring-color": t.primary,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: t.primary, color: "#fff" }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </Glass>
  );
}
