import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Flame, Target, Award, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import type { LifeOsState, DayStats, WeeklyReport as WeeklyReportType } from "../types";
import { addDays, buildWeeklyReport, computeDailyStats, todayKey, toolMinutesOn, orderedSubjects, grantBadge } from "../engine";
import { Glass, PanelHeader, Ring, StatCard, useTheme } from "./ui";

function WeekBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const { t } = useTheme();
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className="w-full h-24 rounded-lg overflow-hidden relative" style={{ background: t.inputBg }}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-t-lg"
          style={{ background: color }}
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        />
      </div>
      <span className="text-[10px] font-semibold truncate w-full text-center" style={{ color: t.muted }}>{label}</span>
    </div>
  );
}

export function WeeklyEvolution({ state, onStateChange }: { state: LifeOsState; onStateChange: (s: LifeOsState) => void }) {
  const { t } = useTheme();
  const profile = state.profile!;
  const [weekOffset, setWeekOffset] = useState(0);

  const today = todayKey();
  const todayStr = today;
  const weekStart = addDays(todayStr, -6 - weekOffset * 7);
  const weekEnd = addDays(todayStr, -weekOffset * 7);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weekDays = useMemo(() => {
    const days: { label: string; key: string; stats: DayStats }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const live = state.routineDate === d ? computeDailyStats(state.routine, profile) : null;
      const stored = state.dailyStats[d];
      const toolMin = toolMinutesOn(state, d);
      const stats: DayStats = {
        completion: Math.max(live?.completion ?? 0, stored?.completion ?? 0),
        focus: Math.max(live?.focus ?? 0, stored?.focus ?? 0),
        xp: Math.max(live?.xp ?? 0, stored?.xp ?? 0),
        studyMin: Math.max(live?.studyMin ?? 0, stored?.studyMin ?? 0, toolMin),
      };
      const dt = new Date(d + "T00:00:00");
      days.push({ label: dayLabels[dt.getDay() === 0 ? 6 : dt.getDay() - 1], key: d, stats });
    }
    return days;
  }, [weekStart, state.routineDate, state.routine, state.dailyStats, state.toolActivity, profile]);

  const report = useMemo((): WeeklyReportType => {
    return buildWeeklyReport(
      weekDays.map((d) => d.stats),
      profile,
      state.gamification.streak,
      weekStart,
    );
  }, [weekDays, profile, state.gamification.streak, weekStart]);

  const totalXp = weekDays.reduce((a, d) => a + d.stats.xp, 0);
  const totalMin = weekDays.reduce((a, d) => a + d.stats.studyMin, 0);
  const avgCompletion = report.completion;
  const avgFocus = report.focus;
  const subjects = orderedSubjects(profile, new Date());
  const weakest = subjects[0]?.name ?? "—";

  const completionColor = avgCompletion >= 80 ? "#22C55E" : avgCompletion >= 50 ? "#F59E0B" : "#EF4444";
  const focusColor = avgFocus >= 80 ? "#22C55E" : avgFocus >= 50 ? "#F59E0B" : "#EF4444";

  const handleGenerate = () => {
    const today2 = todayKey();
    const newWeeklyReports = [...state.weeklyReports.filter((r) => r.weekStart !== report.weekStart), report];
    const newGamification = grantBadge(state.gamification, "week-3");
    onStateChange({ ...state, weeklyReports: newWeeklyReports, gamification: newGamification });
  };

  const isCurrentWeek = weekOffset === 0;

  return (
    <Glass className="overflow-hidden">
      <PanelHeader
        icon={<BarChart3 size={18} style={{ color: t.primary }} />}
        title="Weekly Evolution"
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.muted }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-bold px-2" style={{ color: t.muted }}>
              {isCurrentWeek ? "This Week" : `Week of ${weekStart.slice(5)}`}
            </span>
            <button
              onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
              disabled={weekOffset === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-30"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.muted }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      />

      <div className="px-5 py-5 space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Target size={16} />}
            label="Avg Completion"
            value={`${avgCompletion}%`}
            sub={avgCompletion >= 80 ? "Excellent" : avgCompletion >= 50 ? "Good" : "Building"}
            color={completionColor}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            label="Avg Focus"
            value={`${avgFocus}`}
            sub={avgFocus >= 80 ? "Elite" : avgFocus >= 50 ? "Solid" : "Room to grow"}
            color={focusColor}
          />
          <StatCard
            icon={<Award size={16} />}
            label="Total XP"
            value={`+${totalXp}`}
            sub={`Level ${state.gamification.level}`}
            color={t.primary}
          />
          <StatCard
            icon={<Flame size={16} />}
            label="Study Time"
            value={`${Math.round(totalMin / 60)}h ${totalMin % 60}m`}
            sub={`${totalMin} minutes total`}
            color={t.peach}
          />
        </div>

        {/* 7-day bar chart */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: t.muted }}>7-Day Completion</div>
          <div className="flex items-end gap-2">
            {weekDays.map((d, i) => (
              <WeekBar
                key={d.key}
                value={d.stats.completion}
                max={100}
                label={d.label}
                color={d.key === todayStr ? t.primary : `${t.primary}80`}
              />
            ))}
          </div>
        </div>

        {/* rings row */}
        <div className="flex items-center justify-around">
          <Ring value={avgCompletion} size={80} stroke={7} label="Completion" color={completionColor} />
          <Ring value={avgFocus} size={80} stroke={7} label="Focus" color={focusColor} />
          <Ring value={Math.min(100, Math.round((totalMin / (7 * 180)) * 100))} size={80} stroke={7} label="Study Goal" color={t.primary} />
        </div>

        {/* per-day detail */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Daily Breakdown</div>
          {weekDays.map((d) => (
            <div
              key={d.key}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs"
              style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
            >
              <span className="font-bold w-8" style={{ color: d.key === todayStr ? t.primary : t.text }}>{d.label}</span>
              <span className="flex-1 truncate" style={{ color: t.muted }}>
                {d.stats.studyMin > 0 ? `${d.stats.studyMin}m study · ${d.stats.completion}% done · +${d.stats.xp} XP` : "No activity"}
              </span>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: d.stats.completion >= 80 ? "#22C55E" : d.stats.completion >= 50 ? "#F59E0B" : d.stats.completion > 0 ? "#EF4444" : t.inputBorder }}
              />
            </div>
          ))}
        </div>

        {/* AI notes */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{ background: `${t.primary}08`, border: `1px solid ${t.primary}20` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} style={{ color: t.primary }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.primary }}>AI Weekly Insight</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: t.text }}>{report.notes}</p>
          {weakest !== "—" && (
            <p className="text-xs mt-2" style={{ color: t.muted }}>
              Priority subject next week: <span className="font-bold" style={{ color: t.primary }}>{weakest}</span>
            </p>
          )}
        </div>

        {/* generate button */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: t.primary, color: "#fff" }}
        >
          Save This Week's Report
        </button>
      </div>
    </Glass>
  );
}
