import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, SlidersHorizontal, Bot, Rocket, CalendarClock } from "lucide-react";
import type { LifeOsState, RoutineBlock } from "../types";
import { adaptRoutine, analyze } from "../engine";
import { suggestToolsForSubject } from "../toolSuggestions";
import { Glass, PanelHeader, useTheme } from "./ui";
import { RoutineBuilder } from "./RoutineBuilder";

export function Timetable({ state, onStateChange, onRegenerate }: { state: LifeOsState; onStateChange: (s: LifeOsState) => void; onRegenerate: () => void }) {
  const { t } = useTheme();
  const profile = state.profile!;
  const [builderOpen, setBuilderOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const analysis = useMemo(() => analyze(profile), [profile]);
  const nextExam = analysis.nextExam;

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const mark = (id: string, status: "done" | "skipped") => {
    const routine = state.routine.map((b) => (b.id === id ? { ...b, status } : b));
    const gamification = { ...state.gamification };
    if (status === "done") {
      const blk = state.routine.find((b) => b.id === id);
      if (blk && (blk.type === "study" || blk.type === "mission")) gamification.xp = gamification.xp + blk.xp;
    }
    if (status === "skipped") {
      const next = adaptRoutine(routine, id, profile);
      if (next.some((b) => b.id !== id && b.status === "adapted")) {
        flash("AI adapted: the missed block was rescheduled into a free gap.");
      }
      onStateChange({ ...state, routine: next, gamification });
      return;
    }
    onStateChange({ ...state, routine, gamification });
  };

  return (
    <>
      <Glass strong glow className="lg-scroll-y">
        <PanelHeader
          icon={<CalendarClock size={15} />}
          title="Today's Timetable"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuilderOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,159,76,0.14)", border: `1px solid ${t.inputBorder}`, color: t.primaryDeep }}
              >
                <SlidersHorizontal size={12} /> Build Timetable
              </button>
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.primary }}
              >
                <RefreshCw size={12} /> Regenerate
              </button>
            </div>
          }
        />

        {nextExam && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5" style={{ background: "rgba(255,159,76,0.1)", border: `1px solid ${t.inputBorder}` }}>
            <Rocket size={15} className="shrink-0" style={{ color: t.primary }} />
            <span className="text-xs" style={{ color: t.text }}>
              <span className="font-bold" style={{ color: t.primaryDeep }}>{nextExam.subject}</span> exam in{" "}
              <span className="font-mono font-bold" style={{ color: t.primaryDeep }}>{nextExam.days}d</span> — study blocks for this subject are prioritized.
            </span>
          </div>
        )}

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: "rgba(78,156,111,0.12)", border: "1px solid rgba(78,156,111,0.25)", color: "#4E9C6F" }}
            >
              <Bot size={13} /> {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <AnimatePresence>
            {[...state.routine].sort((a, b) => a.startMin - b.startMin).map((block) => (
              <PlanRow key={block.id} block={block} onMark={mark} />
            ))}
          </AnimatePresence>
        </div>

        {state.routine.length === 0 && (
          <p className="text-sm" style={{ color: t.muted }}>
            No timetable yet. Hit <span className="font-bold" style={{ color: t.primaryDeep }}>Build Timetable</span> to create your study day, or press Regenerate for an AI-planned day.
          </p>
        )}
      </Glass>

      {builderOpen && (
        <RoutineBuilder state={state} onStateChange={onStateChange} onClose={() => setBuilderOpen(false)} />
      )}
    </>
  );
}

function fmtClock(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function PlanRow({ block, onMark }: { block: RoutineBlock; onMark: (id: string, status: "done" | "skipped") => void }) {
  const { t } = useTheme();
  const isStudy = block.type === "study" || block.type === "mission";
  const tools = useMemo(() => (isStudy && block.subject ? suggestToolsForSubject(block.subject) : []), [isStudy, block.subject]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-stretch gap-3 rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: block.status === "done" ? t.inputBg : t.panel,
        border: `1px solid ${block.status === "done" ? t.inputBorder : "rgba(255,159,76,0.22)"}`,
        opacity: block.status === "skipped" ? 0.5 : 1,
      }}
    >
      <div className="w-1.5 shrink-0" style={{ background: block.color }} />
      <div className="flex-1 py-2.5 pr-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px]" style={{ color: t.muted }}>
            {fmtClock(block.startMin)} – {fmtClock(block.endMin)}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: isStudy ? "rgba(255,159,76,0.15)" : t.inputBg, color: isStudy ? t.primary : t.muted }}>
            {block.type}
          </span>
          {block.subject && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: t.inputBg, color: t.muted }}>
              {block.subject}
            </span>
          )}
          {block.status === "adapted" && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(78,156,111,0.14)", color: "#4E9C6F" }}>
              Rescheduled
            </span>
          )}
        </div>
        <p className="text-xs font-medium mt-1 truncate" style={{ color: block.status === "done" ? t.muted : t.text }}>
          {block.objective}
        </p>
        {tools.length > 0 && (
          <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>
              Prepare with:
            </span>
            {tools.map((tl) => (
              <Link
                key={tl.route}
                href={tl.route}
                title={tl.reason}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 hover:scale-105"
                style={{ background: "rgba(255,159,76,0.12)", border: `1px solid ${t.inputBorder}`, color: t.primaryDeep }}
              >
                {tl.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      {block.status === "pending" && (
        <div className="flex items-center pr-2.5 gap-1.5">
          <button
            onClick={() => onMark(block.id, "done")}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(78,156,111,0.14)", color: "#4E9C6F", border: "1px solid rgba(78,156,111,0.3)" }}
            aria-label="Mark done"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => onMark(block.id, "skipped")}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(217,83,79,0.12)", color: "#D9534F", border: "1px solid rgba(217,83,79,0.25)" }}
            aria-label="Skip"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {block.status === "done" && (
        <div className="flex items-center pr-3 text-[10px] font-bold uppercase" style={{ color: "#4E9C6F" }}>
          +{block.xp} XP
        </div>
      )}
    </motion.div>
  );
}
