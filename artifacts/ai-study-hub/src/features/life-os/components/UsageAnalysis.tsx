import { useMemo } from "react";
import { motion } from "framer-motion";
import { Cpu, Clock, Zap, Flame, Activity, TrendingUp, BarChart3, Search, ArrowRight } from "lucide-react";
import type { LifeOsState } from "../types";
import { activityBreakdown, analyze, computeDailyStats, fmtDuration, todayKey, toolInteractions, toolMinutesOn } from "../engine";
import { Glass, PanelHeader, useTheme } from "./ui";

const actionLabel = (a: string): string =>
  a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function UsageAnalysis({ state }: { state: LifeOsState }) {
  const { t } = useTheme();
  const profile = state.profile!;
  const today = todayKey();

  const live = useMemo(() => computeDailyStats(state.routine, profile), [state.routine, profile]);
  const stored = state.dailyStats[today];
  const studyMin = Math.max(live.studyMin, stored?.studyMin ?? 0, toolMinutesOn(state, today));
  const xp = Math.max(live.xp, stored?.xp ?? 0);
  const focus = Math.max(live.focus, stored?.focus ?? 0);
  const analysis = useMemo(() => analyze(profile), [profile]);
  const breakdown = useMemo(() => activityBreakdown(state), [state.toolActivity]);
  const interactions = useMemo(() => toolInteractions(state, today), [state.toolActivity, today]);

  const tools = breakdown.today.slice(0, 8);
  const maxMin = Math.max(...tools.map((x) => x.minutes), 1);

  const tiles = [
    { label: "Study Today", value: fmtDuration(studyMin), icon: <Clock size={14} /> },
    { label: "XP Earned", value: `+${xp}`, icon: <Zap size={14} /> },
    { label: "Focus Score", value: `${focus}/100`, icon: <Activity size={14} /> },
    { label: "Streak", value: `${state.gamification.streak}d`, icon: <Flame size={14} /> },
    { label: "Tools Used", value: `${breakdown.today.length}`, icon: <Cpu size={14} /> },
    { label: "Predicted Score", value: `${analysis.predictedScore}%`, icon: <TrendingUp size={14} /> },
  ];

  return (
    <Glass strong glow className="lg-scroll-y">
      <PanelHeader icon={<BarChart3 size={15} />} title="Today Across All Tools" right={
        <span className="text-xs font-mono" style={{ color: t.muted }}>
          {breakdown.today.length} tools · {fmtDuration(breakdown.totalMin)} total
        </span>
      } />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl px-3 py-2.5" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: t.primaryDeep }}>
              {tile.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>{tile.label}</span>
            </div>
            <div className="font-mono text-sm font-bold leading-none" style={{ color: t.text }}>{tile.value}</div>
          </div>
        ))}
      </div>

      {tools.length === 0 ? (
        <div className="rounded-xl p-5 text-center" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <BarChart3 size={22} className="mx-auto mb-2" style={{ color: t.muted }} />
          <p className="text-sm" style={{ color: t.text }}>No tool activity recorded yet today.</p>
          <p className="text-xs mt-1" style={{ color: t.muted }}>
            Use any learning tool on the platform — Math Solver, Quiz, Flashcards, Virtual Lab, Deep Research and more — and every minute is tracked here automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {tools.map((tool, idx) => (
              <div key={tool.tool} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(255,159,76,0.12)", border: `1px solid ${t.inputBorder}`, color: t.primaryDeep }}
                >
                  {tool.toolName.slice(0, 1)}
                </span>
                <span className="text-xs font-semibold w-32 sm:w-40 shrink-0 truncate" style={{ color: t.text }}>{tool.toolName}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: t.inputBorder }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #FF9F4C, #FFB366)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, (tool.minutes / maxMin) * 100)}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="font-mono text-xs font-bold w-16 text-right" style={{ color: t.primaryDeep }}>
                  {fmtDuration(tool.minutes)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: t.muted }}>
            Tracked from real usage across the platform. Study minutes and XP are earned automatically whenever you work in any learning tool — this data feeds your PDF daily report.
          </p>
        </>
      )}

      <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Search size={14} style={{ color: t.primaryDeep }} />
          <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.text }}>What You Searched & What You Got</h4>
        </div>

        {interactions.length === 0 ? (
          <p className="text-xs" style={{ color: t.muted }}>
            No searches or results recorded yet today. Solve a problem, generate a quiz, or run a lab experiment and it will appear here.
          </p>
        ) : (
          <div className="space-y-2.5">
            {interactions.slice(0, 10).map((it) => (
              <div key={`${it.startedAt}-${it.tool}`} className="rounded-xl px-3.5 py-3" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.primaryDeep }}>{it.toolName}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.muted }}>{actionLabel(it.action)}</span>
                </div>
                {it.query && (
                  <div className="flex items-start gap-1.5 text-xs mb-1" style={{ color: t.text }}>
                    <ArrowRight size={11} className="shrink-0 mt-0.5" style={{ color: t.muted }} />
                    <span className="font-semibold">{it.query}</span>
                  </div>
                )}
                {it.result && (
                  <div className="flex items-start gap-1.5 text-xs" style={{ color: t.muted }}>
                    <span className="shrink-0 mt-0.5 font-mono text-[9px]">OUT</span>
                    <span>{it.result}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Glass>
  );
}
