import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X, Plus, Trash2, Pencil, Wand2, ArrowLeft, ArrowRight, Check, AlertTriangle, CalendarPlus, LayoutGrid,
} from "lucide-react";
import type { BlockType, LifeOsState, LifeProfile, RoutineBlock } from "../types";
import { blockColor, brainLoadOf, computeDailyStats, energyAt, orderedSubjects, todayKey } from "../engine";
import { PanelHeader, useTheme, useNow } from "./ui";

const DAY = 1440;

const TYPE_OPTIONS: { id: BlockType; label: string; study: boolean }[] = [
  { id: "wake", label: "Wake up", study: false },
  { id: "meal", label: "Meal", study: false },
  { id: "school", label: "School", study: false },
  { id: "coaching", label: "Coaching", study: false },
  { id: "travel", label: "Travel", study: false },
  { id: "study", label: "Study", study: true },
  { id: "mission", label: "Mission", study: true },
  { id: "review", label: "Review", study: true },
  { id: "break", label: "Break", study: false },
  { id: "exercise", label: "Exercise", study: false },
  { id: "prayer", label: "Prayer", study: false },
  { id: "leisure", label: "Leisure", study: false },
  { id: "sleep", label: "Sleep", study: false },
];

const REWARDS = ["🍫 Snack", "☕ Tea break", "📱 15 min scroll", "🎧 Music", "🚶 Walk outside", "🕹️ Mini game", "🛏️ Power nap"];

const DEFAULT_OBJECTIVES: Partial<Record<BlockType, string>> = {
  wake: "Wake up + get ready",
  meal: "Meal break",
  school: "School",
  coaching: "Coaching / Tuition",
  travel: "Commute",
  break: "Break — stretch & hydrate",
  exercise: "Exercise / walk",
  prayer: "Prayer",
  leisure: "Wind down",
  sleep: "Sleep",
};

function fmtClock(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const parseTime = (v: string): number => {
  const [h = 0, m = 0] = v.split(":").map(Number);
  return h * 60 + m;
};

const timeOf = (min: number): string => fmtClock(min);

function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

interface FormState {
  type: BlockType;
  subject: string;
  startMin: number;
  endMin: number;
  objective: string;
  focus: "deep" | "light";
}

function makeBlock(
  profile: LifeProfile,
  emergency: LifeOsState["emergency"],
  fields: FormState,
  status: RoutineBlock["status"]
): RoutineBlock {
  const energy = fields.type === "sleep" ? 5 : Math.round(energyAt(profile, fields.startMin));
  const focus: "deep" | "light" =
    fields.type === "study" || fields.type === "mission" || fields.type === "review"
      ? fields.focus
      : "light";
  const subj = profile.subjects.find((s) => s.name === fields.subject);
  const difficulty = subj ? (subj.strength >= 4 ? 2 : subj.strength === 3 ? 3 : 4) : 2;
  const studyLike = fields.type === "study" || fields.type === "mission" || fields.type === "review";
  const priority = fields.type === "mission" ? 5 : fields.type === "study" ? 3 : fields.type === "review" ? 2 : 1;
  const xp = fields.type === "study" || fields.type === "mission"
    ? 15 + difficulty * 6 + (focus === "deep" ? 8 : 3)
    : fields.type === "review"
    ? 10
    : fields.type === "break"
    ? 2
    : 0;

  return {
    id: `draft-${Math.random().toString(36).slice(2, 9)}`,
    startMin: fields.startMin,
    endMin: fields.endMin,
    type: fields.type,
    subject: studyLike && fields.subject ? fields.subject : undefined,
    objective: fields.objective.trim() || (studyLike ? `${fields.subject || "Study"} — focused practice` : DEFAULT_OBJECTIVES[fields.type] ?? fields.type),
    focus,
    retention: studyLike ? 40 + ((subj?.strength ?? 3) * 7 + priority * 4) % 56 : 80,
    priority,
    difficulty,
    reward: studyLike ? REWARDS[(fields.startMin + priority) % REWARDS.length] : "",
    energy,
    brainLoad: brainLoadOf(energy),
    color: blockColor(fields.type, focus, emergency),
    status,
    xp,
  };
}

function computeGaps(draft: RoutineBlock[], wake: number, sleep: number): { start: number; end: number }[] {
  const sorted = [...draft].filter((b) => b.startMin < b.endMin).sort((a, b) => a.startMin - b.startMin);
  const gaps: { start: number; end: number }[] = [];
  let cursor = wake;
  for (const b of sorted) {
    if (b.startMin < cursor) {
      cursor = Math.max(cursor, b.endMin);
      continue;
    }
    if (b.startMin >= sleep) break;
    if (b.startMin > cursor) gaps.push({ start: cursor, end: Math.min(b.startMin, sleep) });
    cursor = Math.max(cursor, b.endMin);
  }
  if (cursor < sleep) gaps.push({ start: cursor, end: sleep });
  return gaps;
}

function findConflicts(draft: RoutineBlock[]): string[] {
  const conflicts: string[] = [];
  const sorted = [...draft].sort((a, b) => a.startMin - b.startMin);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.startMin < b.endMin && b.startMin < a.endMin) {
        conflicts.push(`"${a.objective}" overlaps "${b.objective}"`);
      } else {
        break;
      }
    }
  }
  return conflicts;
}

function smartFill(draft: RoutineBlock[], profile: LifeProfile): RoutineBlock[] {
  const wake = parseTime(profile.wakeTime);
  const sleep = parseTime(profile.sleepTime);
  const result = [...draft];
  const subjects = orderedSubjects(profile, new Date());
  if (!subjects.length) return result;
  const cycle = profile.studyBlockMin || 40;
  const brk = profile.breakMin || 5;
  let subjIdx = 0;
  let guard = 0;

  while (guard++ < 30) {
    const gaps = computeGaps(result, wake, sleep);
    const gap = gaps.find((g) => g.end - g.start >= 30);
    if (!gap) break;
    const dur = Math.max(20, Math.min(cycle, gap.end - gap.start));
    const subj = subjects[subjIdx % subjects.length];
    result.push(
      makeBlock(
        profile,
        null,
        {
          type: "study",
          subject: subj.name,
          startMin: gap.start,
          endMin: gap.start + dur,
          objective: `${subj.name} — focused practice`,
          focus: energyAt(profile, gap.start) >= 60 ? "deep" : "light",
        },
        "pending"
      )
    );
    subjIdx++;
    const rest = gap.end - (gap.start + dur);
    if (rest >= 10) {
      result.push(
        makeBlock(
          profile,
          null,
          {
            type: "break",
            subject: "",
            startMin: gap.start + dur,
            endMin: Math.min(gap.start + dur + brk, gap.end),
            objective: "Break — stretch & hydrate",
            focus: "light",
          },
          "pending"
        )
      );
    }
  }
  return result.sort((a, b) => a.startMin - b.startMin);
}

export function RoutineBuilder({ state, onStateChange, onClose }: { state: LifeOsState; onStateChange: (s: LifeOsState) => void; onClose: () => void }) {
  const { t } = useTheme();
  const profile = state.profile!;
  const now = useNow(1000);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [draft, setDraft] = useState<RoutineBlock[]>(() =>
    [...state.routine].sort((a, b) => a.startMin - b.startMin)
  );
  const [editor, setEditor] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const wake = parseTime(profile.wakeTime);
  const sleep = parseTime(profile.sleepTime);
  const conflicts = useMemo(() => findConflicts(draft), [draft]);
  const freeMin = useMemo(
    () => computeGaps(draft, wake, sleep).reduce((a, g) => a + (g.end - g.start), 0),
    [draft, wake, sleep]
  );
  const studyCount = draft.filter((b) => b.type === "study" || b.type === "mission").length;

  const openAdd = (startMin?: number) => {
    const gaps = computeGaps(draft, wake, sleep);
    const target = startMin ?? gaps[0]?.start ?? Math.min(600, wake);
    setEditingId(null);
    setEditor({
      type: "study",
      subject: profile.subjects[0]?.name ?? "",
      startMin: Math.round(target / 5) * 5,
      endMin: Math.round(target / 5) * 5 + (profile.studyBlockMin || 40),
      objective: profile.subjects[0] ? `${profile.subjects[0].name} — focused practice` : "Focused practice",
      focus: "deep",
    });
  };

  const openEdit = (block: RoutineBlock) => {
    setEditingId(block.id);
    setEditor({
      type: block.type,
      subject: block.subject ?? "",
      startMin: block.startMin,
      endMin: block.endMin,
      objective: block.objective,
      focus: block.focus,
    });
  };

  const closeEditor = () => {
    setEditor(null);
    setEditingId(null);
  };

  const saveEditor = () => {
    if (!editor || editor.endMin <= editor.startMin) return;
    if (editor.type === "sleep" && editor.endMin <= DAY) return;
    const existing = editingId ? draft.find((b) => b.id === editingId) : undefined;
    const block = makeBlock(profile, state.emergency, editor, existing?.status ?? "pending");
    block.id = existing?.id ?? block.id;
    setDraft((prev) => {
      const next = editingId
        ? prev.map((b) => (b.id === editingId ? block : b))
        : [...prev, block];
      return [...next].sort((a, b) => a.startMin - b.startMin);
    });
    closeEditor();
  };

  const removeBlock = (id: string) => setDraft((prev) => prev.filter((b) => b.id !== id));

  const shift = (id: string, delta: number) =>
    setDraft((prev) =>
      prev.map((b) => (b.id === id ? { ...b, startMin: b.startMin + delta, endMin: b.endMin + delta } : b))
    );

  const applySmartFill = () => setDraft((prev) => smartFill(prev, profile));

  const autoFix = () => {
    setDraft((prev) => {
      const sorted = [...prev].sort((a, b) => a.startMin - b.startMin);
      let cursor = 0;
      return sorted.map((b) => {
        if (b.startMin < cursor) {
          const start = cursor;
          return { ...b, startMin: start, endMin: Math.max(start + 1, start + (b.endMin - b.startMin)) };
        }
        cursor = Math.max(cursor, b.endMin);
        return b;
      });
    });
  };

  const save = () => {
    if (conflicts.length) return;
    const sorted = [...draft].sort((a, b) => a.startMin - b.startMin);
    const routine = sorted.map((b, i) => ({ ...b, id: `blk-${i}` }));
    const today = todayKey();
    onStateChange({
      ...state,
      routine,
      routineDate: today,
      dailyStats: { ...state.dailyStats, [today]: computeDailyStats(routine, profile) },
    });
    onClose();
  };

  const studyLike = editor && (editor.type === "study" || editor.type === "mission" || editor.type === "review");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(20,16,12,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto lg-scroll rounded-3xl"
        style={{ background: t.bg, border: `1.5px solid ${t.glassBorder}`, boxShadow: t.shadowStrong }}
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 px-5 md:px-6 py-4 flex items-center justify-between" style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,159,76,0.12)", color: t.primaryDeep, border: `1px solid ${t.border}` }}>
              <LayoutGrid size={16} />
            </span>
            <div>
              <div className="text-sm font-bold" style={{ color: t.text }}>Daily Timetable Builder</div>
              <div className="text-[10px] font-mono" style={{ color: t.muted }}>
                {draft.length} blocks · {durationLabel(freeMin)} free · {studyCount} study
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.muted }}
            aria-label="Close builder"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* interactive timeline */}
          <div>
            <PanelHeader icon={<CalendarPlus size={15} />} title="Timeline — click a slot to add, a block to edit" right={
              <span className="text-[10px] font-mono" style={{ color: t.muted }}>{fmtClock(nowMin)}</span>
            } />
            <div
              className="relative h-14 rounded-xl overflow-hidden cursor-crosshair"
              style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}` }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const min = ((e.clientX - rect.left) / rect.width) * DAY;
                openAdd(min);
              }}
            >
              {draft.map((b) => {
                const left = Math.max(0, (b.startMin / DAY) * 100);
                const width = Math.min(100 - left, ((Math.min(b.endMin, DAY) - Math.max(b.startMin, 0)) / DAY) * 100);
                if (width <= 0) return null;
                const active = b.startMin <= nowMin && nowMin < Math.min(b.endMin, DAY);
                return (
                  <div
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(b);
                    }}
                    title={`${fmtClock(b.startMin)} – ${fmtClock(b.endMin)} · ${b.objective}`}
                    className="absolute top-1 bottom-1 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(1.2, width)}%`,
                      background: b.color,
                      border: active ? "2px solid rgba(45,45,45,0.55)" : `1px solid ${t.inputBorder}`,
                      opacity: b.status === "done" ? 0.65 : 1,
                    }}
                  />
                );
              })}
              {nowMin >= 0 && nowMin <= DAY && (
                <div className="absolute top-0 bottom-0 w-px bg-white/90" style={{ left: `${(nowMin / DAY) * 100}%`, boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
              )}
            </div>
            <div className="flex justify-between mt-1.5 px-1">
              {[0, 360, 720, 1080, 1440].map((m) => (
                <span key={m} className="text-[9px] font-mono" style={{ color: t.muted }}>{fmtClock(m)}</span>
              ))}
            </div>
          </div>

          {/* add / smart fill row */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openAdd()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff" }}
            >
              <Plus size={13} /> Add Block
            </button>
            <button
              onClick={applySmartFill}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "rgba(255,159,76,0.12)", border: `1px solid ${t.inputBorder}`, color: t.primaryDeep }}
            >
              <Wand2 size={13} /> AI Smart-Fill Free Time
            </button>
            <span className="ml-auto text-[10px] font-mono self-center" style={{ color: t.muted }}>
              {durationLabel(freeMin)} free after fill
            </span>
          </div>

          {/* editor form */}
          {editor && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,159,76,0.08)", border: `1.5px solid ${conflicts.length && editingId ? "rgba(217,83,79,0.5)" : t.inputBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.primaryDeep }}>
                  {editingId ? "Edit Block" : "New Block"}
                </span>
                <button onClick={closeEditor} className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg" style={{ color: t.muted }}>Cancel</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Type</label>
                  <select
                    value={editor.type}
                    onChange={(e) => {
                      const type = e.target.value as BlockType;
                      const studyLike2 = type === "study" || type === "mission" || type === "review";
                      setEditor((prev) => ({
                        ...prev!,
                        type,
                        subject: studyLike2 ? (prev!.subject || profile.subjects[0]?.name || "") : "",
                        objective: studyLike2 ? prev!.objective : DEFAULT_OBJECTIVES[type] ?? type,
                        focus: studyLike2 ? prev!.focus : "light",
                      }));
                    }}
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {studyLike && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Subject</label>
                    <select
                      value={editor.subject}
                      onChange={(e) => {
                        const subject = e.target.value;
                        setEditor((prev) => ({ ...prev!, subject, objective: `${subject || "Study"} — focused practice` }));
                      }}
                      className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                      style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
                    >
                      {profile.subjects.length === 0 && <option value="">No subjects — add in profile</option>}
                      {profile.subjects.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Start</label>
                  <input
                    type="time"
                    value={timeOf(editor.startMin)}
                    onChange={(e) => {
                      const v = parseTime(e.target.value);
                      if (Number.isNaN(v)) return;
                      const end = v + (editor.endMin - editor.startMin);
                      setEditor((prev) => ({ ...prev!, startMin: v, endMin: end }));
                    }}
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>End</label>
                  <input
                    type="time"
                    value={timeOf(editor.endMin)}
                    onChange={(e) => {
                      const v = parseTime(e.target.value);
                      if (Number.isNaN(v)) return;
                      setEditor((prev) => ({ ...prev!, endMin: v }));
                    }}
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Objective</label>
                  <input
                    value={editor.objective}
                    onChange={(e) => setEditor((prev) => ({ ...prev!, objective: e.target.value }))}
                    className="w-full rounded-lg px-2.5 py-2 text-sm outline-none"
                    style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text }}
                  />
                </div>

                {studyLike && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.muted }}>Focus</label>
                    <div className="flex gap-1.5">
                      {(["deep", "light"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setEditor((prev) => ({ ...prev!, focus: f }))}
                          className="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all"
                          style={{
                            background: editor.focus === f ? "rgba(255,159,76,0.2)" : t.inputBg,
                            border: `1.5px solid ${editor.focus === f ? "rgba(255,159,76,0.5)" : t.inputBorder}`,
                            color: editor.focus === f ? t.primaryDeep : t.muted,
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="col-span-2 md:col-span-4 flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono" style={{ color: t.muted }}>
                    {durationLabel(editor.endMin - editor.startMin)} · {fmtClock(editor.startMin)} → {fmtClock(editor.endMin)}
                    {editor.endMin <= editor.startMin && <span style={{ color: "#D9534F" }}> · end must be after start</span>}
                  </span>
                  <button
                    onClick={saveEditor}
                    disabled={editor.endMin <= editor.startMin || (editor.type === "sleep" && editor.endMin <= DAY)}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff" }}
                  >
                    <Check size={13} /> {editingId ? "Update Block" : "Add Block"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* conflict warnings */}
          {conflicts.length > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: "rgba(217,83,79,0.1)", border: `1px solid rgba(217,83,79,0.3)` }}>
              <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "#D9534F" }} />
              <div className="text-xs leading-relaxed" style={{ color: "#D9534F" }}>
                <span className="font-bold">Overlapping blocks — fix before saving:</span>
                <ul className="list-disc list-inside mt-1">
                  {conflicts.slice(0, 3).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                  {conflicts.length > 3 && <li>…and {conflicts.length - 3} more</li>}
                </ul>
                <button
                  onClick={autoFix}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: "rgba(217,83,79,0.14)", border: "1px solid rgba(217,83,79,0.3)", color: "#D9534F" }}
                >
                  <Wand2 size={11} /> Auto-fix overlaps (push later)
                </button>
              </div>
            </div>
          )}

          {/* block cards */}
          <div className="space-y-2">
            <PanelHeader icon={<LayoutGrid size={15} />} title="Blocks" right={
              <span className="text-[10px] font-mono" style={{ color: t.muted }}>sorted by time</span>
            } />
            {draft.length === 0 && (
              <p className="text-sm" style={{ color: t.muted }}>
                No blocks yet. Click the timeline to add one, or hit AI Smart-Fill to build a study day around your schedule.
              </p>
            )}
            {draft.map((b, i) => {
              const active = b.startMin <= nowMin && nowMin < Math.min(b.endMin, DAY);
              const isEditing = editingId === b.id;
              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-stretch gap-3 rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    background: isEditing ? "rgba(255,159,76,0.12)" : t.panel,
                    border: `1.5px solid ${isEditing ? "rgba(255,159,76,0.5)" : active ? "rgba(255,159,76,0.55)" : t.inputBorder}`,
                  }}
                >
                  <div className="w-1.5 shrink-0" style={{ background: b.color }} />
                  <div className="flex-1 py-2.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px]" style={{ color: t.muted }}>
                        {fmtClock(b.startMin)} – {fmtClock(b.endMin)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,159,76,0.15)", color: t.primaryDeep }}>
                        {b.type}
                      </span>
                      {b.subject && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: t.inputBg, color: t.muted }}>
                          {b.subject}
                        </span>
                      )}
                      {active && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,159,76,0.16)", color: t.primaryDeep, border: `1px solid ${t.inputBorder}` }}>
                          <span className="w-1.5 h-1.5 rounded-full lg-blip" style={{ background: t.primary }} /> Now
                        </span>
                      )}
                      {b.status === "done" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(78,156,111,0.14)", color: "#4E9C6F" }}>Done</span>
                      )}
                    </div>
                    <p className="text-xs font-medium mt-1 truncate" style={{ color: t.text }}>{b.objective}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] font-mono" style={{ color: t.muted }}>
                      <span>energy {b.energy}</span>
                      <span>{b.brainLoad} load</span>
                      <span>+{b.xp} XP</span>
                    </div>
                  </div>
                  <div className="flex items-center pr-2 gap-1">
                    <IconBtn onClick={() => shift(b.id, -15)} label="Shift earlier"><ArrowLeft size={13} /></IconBtn>
                    <IconBtn onClick={() => shift(b.id, 15)} label="Shift later"><ArrowRight size={13} /></IconBtn>
                    <IconBtn onClick={() => openEdit(b)} label="Edit"><Pencil size={13} /></IconBtn>
                    <IconBtn onClick={() => removeBlock(b.id)} label="Delete" danger><Trash2 size={13} /></IconBtn>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* footer actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <div className="text-[10px] font-mono" style={{ color: t.muted }}>
              {draft.length} blocks · {durationLabel(freeMin)} free · {studyCount} study blocks · {conflicts.length ? `${conflicts.length} conflicts` : "no conflicts"}
            </div>
            <div className="ml-auto flex gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={conflicts.length > 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff" }}
              >
                <Check size={15} /> Save & Apply
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function IconBtn({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{ background: danger ? "rgba(217,83,79,0.12)" : t.inputBg, border: `1px solid ${danger ? "rgba(217,83,79,0.25)" : t.inputBorder}`, color: danger ? "#D9534F" : t.muted }}
    >
      {children}
    </button>
  );
}
