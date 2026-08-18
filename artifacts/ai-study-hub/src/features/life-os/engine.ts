import type {
  LifeProfile,
  RoutineBlock,
  BlockType,
  RetentionCard,
  Gamification,
  BadgeId,
  Badge,
  TrophyId,
  Trophy,
  EmergencyPreset,
  Subject,
  DayStats,
  WeeklyReport,
  FocusSession,
  LearningStyle,
  ToolActivity,
  LifeOsState,
} from "./types";
import { isStudyTool, matchSubject, toToolActivity, type ActivityEvent } from "./tracker";

/* ═══════════════════════════════════════════════════
   TIME HELPERS
   ═══════════════════════════════════════════════════ */

export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const toClock = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
};

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const dateKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const daysBetween = (a: string, b: string): number => {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
};

export const addDays = (key: string, n: number): string => {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

/* ═══════════════════════════════════════════════════
   GAMIFICATION PRESETS
   ═══════════════════════════════════════════════════ */

export const BADGE_DEFS: Record<BadgeId, { name: string; desc: string; icon: string }> = {
  "first-routine": { name: "First Sync", desc: "Generate your first AI routine", icon: "🌅" },
  "streak-3": { name: "Momentum", desc: "3 day streak", icon: "🔥" },
  "streak-7": { name: "Unstoppable", desc: "7 day streak", icon: "⚡" },
  "focus-80": { name: "Deep Focus", desc: "Hit an 80+ focus score", icon: "🎯" },
  "focus-95": { name: "Zen State", desc: "Hit a 95+ focus score", icon: "🧘" },
  "exam-mode": { name: "Mission Ready", desc: "Activate MISSION MODE", icon: "🛰️" },
  "retention-1": { name: "Memory Spark", desc: "Complete a retention review", icon: "🧠" },
  "retention-master": { name: "Memory Architect", desc: "Score 90+ on a retention review", icon: "🏆" },
  "perfect-day": { name: "Perfect Day", desc: "Complete 100% of today's routine", icon: "💎" },
  "coach-confidant": { name: "Coach Confidant", desc: "Chat with your AI Coach", icon: "💬" },
  "future-self": { name: "Time Traveler", desc: "Read your Future Self message", icon: "⏳" },
  "emergency-survivor": { name: "Crisis Captain", desc: "Survive an emergency mode day", icon: "🚨" },
  "level-5": { name: "Ascendant", desc: "Reach Level 5", icon: "🌙" },
  "level-10": { name: "Enlightened", desc: "Reach Level 10", icon: "✨" },
  "week-3": { name: "Evolution", desc: "3 weekly evolution reports", icon: "📈" },
  "early-bird": { name: "Early Bird", desc: "Study before 7 AM", icon: "🐦" },
};

export const DEFAULT_GAMIFICATION: Gamification = {
  xp: 0,
  coins: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: "",
  badges: [],
  trophies: [],
  theme: "light",
};

export type TrophyTier = "gold" | "silver" | "bronze";

export const TROPHY_DEFS: Record<TrophyId, { name: string; desc: string; goal: string; tier: TrophyTier }> = {
  "first-sync": { name: "First Sync", desc: "Your life was wired into the system", goal: "Complete onboarding", tier: "bronze" },
  "perfect-day": { name: "Perfect Day", desc: "100% of today's routine completed", goal: "100% routine", tier: "gold" },
  "streak-3": { name: "Momentum", desc: "Three days of showing up, back to back", goal: "3 day streak", tier: "bronze" },
  "streak-7": { name: "Unstoppable", desc: "A full week without breaking stride", goal: "7 day streak", tier: "silver" },
  "streak-30": { name: "Legendary", desc: "A month of relentless consistency", goal: "30 day streak", tier: "gold" },
  "level-5": { name: "Ascendant", desc: "Rose to level 5 through real work", goal: "Reach Level 5", tier: "silver" },
  "level-10": { name: "Enlightened", desc: "Reached the summit at level 10", goal: "Reach Level 10", tier: "gold" },
  "study-10h": { name: "10-Hour Scholar", desc: "10 real hours inside learning tools", goal: "10h real study", tier: "bronze" },
  "study-50h": { name: "Half-Century", desc: "50 real hours of deep learning", goal: "50h real study", tier: "silver" },
  "study-100h": { name: "Centurion", desc: "A hundred real hours mastered", goal: "100h real study", tier: "gold" },
  "mission-clear": { name: "Mission Clear", desc: "Crushed an exam mission block", goal: "Finish a mission", tier: "silver" },
  "memory-master": { name: "Memory Architect", desc: "Scored 90+ on a retention review", goal: "90+ review score", tier: "silver" },
  "zen-focus": { name: "Zen State", desc: "Hit a 95+ focus score", goal: "95+ focus score", tier: "gold" },
};

export const TROPHY_ORDER: TrophyId[] = [
  "first-sync", "perfect-day", "streak-3", "streak-7", "streak-30",
  "level-5", "level-10", "study-10h", "study-50h", "study-100h",
  "mission-clear", "memory-master", "zen-focus",
];

export const xpForLevel = (level: number) => Math.round(400 * Math.pow(level, 1.4));
export const levelFromXp = (xp: number): number => {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
};

export const awardXp = (g: Gamification, amount: number): Gamification => {
  const xp = g.xp + amount;
  return { ...g, xp, level: levelFromXp(xp) };
};

export const grantBadge = (g: Gamification, id: BadgeId): Gamification => {
  if (g.badges.some((b) => b.id === id)) return g;
  const def = BADGE_DEFS[id];
  const badge: Badge = { id, name: def.name, desc: def.desc, icon: def.icon, earnedAt: new Date().toISOString() };
  return { ...g, badges: [...g.badges, badge], coins: g.coins + 25 };
};

export const grantTrophy = (g: Gamification, id: TrophyId): Gamification => {
  if (g.trophies.some((tr) => tr.id === id)) return g;
  const trophy: Trophy = { id, earnedAt: new Date().toISOString() };
  return { ...g, trophies: [...g.trophies, trophy], coins: g.coins + 50 };
};

/** Total real study minutes recorded across every tool, all time. */
export function totalToolMinutes(state: LifeOsState): number {
  return state.toolActivity
    .filter((a) => isStudyTool(a.tool) && a.action === "visit")
    .reduce((s, a) => s + a.durationMin, 0);
}

/**
 * Check every real signal in state and grant any newly earned trophies.
 * Pure + idempotent: only trophies not already owned are granted, so it can
 * safely run on every state change / activity merge without duplicates.
 */
export function evaluateTrophies(state: LifeOsState): { gamification: Gamification; newTrophies: Trophy[] } {
  const g = state.gamification;
  const owned = new Set(g.trophies.map((tr) => tr.id));
  const earned: TrophyId[] = [];

  const completion = computeCompletion(state.routine);
  const totalMin = totalToolMinutes(state);
  const today = todayKey();

  if (state.onboarded && state.profile) earned.push("first-sync");
  if (state.routine.length > 0 && completion >= 100) earned.push("perfect-day");
  if (g.streak >= 3) earned.push("streak-3");
  if (g.streak >= 7) earned.push("streak-7");
  if (g.streak >= 30) earned.push("streak-30");
  if (g.level >= 5) earned.push("level-5");
  if (g.level >= 10) earned.push("level-10");
  if (totalMin >= 600) earned.push("study-10h");
  if (totalMin >= 3000) earned.push("study-50h");
  if (totalMin >= 6000) earned.push("study-100h");
  if (state.routine.some((b) => b.type === "mission" && (b.status === "done" || b.status === "adapted"))) earned.push("mission-clear");
  if (state.retention.some((c) => c.lastScore >= 90)) earned.push("memory-master");
  if (state.focusSessions.some((f) => f.focusScore >= 95) || state.dailyStats[today]?.focus >= 95) earned.push("zen-focus");

  const fresh = earned.filter((id) => !owned.has(id));
  if (!fresh.length) return { gamification: g, newTrophies: [] };

  let gamification = g;
  const newTrophies: Trophy[] = [];
  for (const id of fresh) {
    const trophy: Trophy = { id, earnedAt: new Date().toISOString() };
    gamification = { ...gamification, trophies: [...gamification.trophies, trophy], coins: gamification.coins + 50 };
    newTrophies.push(trophy);
  }
  return { gamification, newTrophies };
}

/* ═══════════════════════════════════════════════════
   BRAIN ENERGY ENGINE  (M7)
   ═══════════════════════════════════════════════════ */

// Predicts energy 0-100 across the waking day based on wake/sleep + energy level.
export function energyCurve(profile: LifeProfile): Map<number, number> {
  const map = new Map<number, number>();
  const wake = toMin(profile.wakeTime);
  const sleep = toMin(profile.sleepTime);
  const dayLen = ((sleep - wake + 1440) % 1440) || 720;
  const energyMult = 0.55 + profile.energyLevel * 0.13;
  const stressPenalty = (profile.stressLevel - 1) * 5;

  for (let i = 0; i < dayLen; i++) {
    const t = i / dayLen; // 0..1 across waking day
    // Two peaks: mid-morning (t≈0.2) and late-afternoon (t≈0.7), dip at t≈0.45
    const morning = Math.exp(-Math.pow((t - 0.22) / 0.16, 2)) * 34;
    const afternoon = Math.exp(-Math.pow((t - 0.68) / 0.17, 2)) * 26;
    const dip = Math.exp(-Math.pow((t - 0.5) / 0.09, 2)) * 18;
    const base = 46 + morning + afternoon - dip;
    const val = Math.max(8, Math.min(97, base * energyMult - stressPenalty));
    map.set(wake + i, val);
  }
  return map;
}

export const energyAt = (profile: LifeProfile, min: number): number => {
  const curve = energyCurve(profile);
  const wake = toMin(profile.wakeTime);
  const sleep = toMin(profile.sleepTime);
  if (min < wake || min >= sleep) return 6;
  return curve.get(min) ?? 46;
};

export const brainLoadOf = (energy: number): "high" | "medium" | "low" =>
  energy >= 62 ? "high" : energy >= 40 ? "medium" : "low";

/* ═══════════════════════════════════════════════════
   ROUTINE ENGINE  (M3) + BRAIN-ENERGY SCHEDULING (M7)
   ═══════════════════════════════════════════════════ */

export interface RoutineOptions {
  emergency?: EmergencyPreset | null;
  forcedSubject?: string | null; // mission mode target
  date?: Date;
}

export const blockColor = (type: BlockType, focus: "deep" | "light", emergency?: EmergencyPreset | null): string => {
  switch (type) {
    case "study":
      return focus === "deep" ? "#FF9F4C" : "#FFD4A8";
    case "mission":
      return emergency === "exam-tomorrow" ? "#E8852E" : "#FFB366";
    case "review":
      return "#FFCA80";
    case "break":
      return "#FFE9D0";
    case "meal":
      return "#FFE3C8";
    case "sleep":
      return "#FFE9D6";
    case "wake":
      return "#FFD4A8";
    case "school":
      return "#FFF0E0";
    case "coaching":
      return "#FFE0C0";
    case "travel":
      return "#F5E0CC";
    case "exercise":
      return "#E8852E";
    case "prayer":
      return "#FFF5E8";
    case "leisure":
      return "#F7E6D2";
  }
};

const REWARDS = ["🍫 Snack", "☕ Tea break", "📱 15 min scroll", "🎧 Music", "🚶 Walk outside", "🕹️ Mini game", "🛏️ Power nap"];

const OBJECTIVES: Record<LearningStyle, string[]> = {
  visual: [
    "Watch a summary video → draw a mind-map of {s}",
    "Sketch diagrams of key processes in {s}",
    "Create color-coded flashcards for {s} formulas",
  ],
  audio: [
    "Record your voice explaining the {s} concept out loud",
    "Listen to notes and repeat key definitions of {s}",
    "Explain {s} topic to an imaginary classmate",
  ],
  practical: [
    "Solve 5 practice problems from {s}",
    "Do a quick hands-on experiment / real example of {s}",
    "Apply {s} rules to a real-life scenario",
  ],
  "reading-writing": [
    "Summarize 2 pages of {s} in your own words",
    "Rewrite the {s} chapter as bullet notes",
    "Answer past paper questions from {s}",
  ],
};

const FOCUS_MIX: Record<"deep" | "light", string[]> = {
  deep: ["Grind {s} — high focus", "Master {s} core concepts", "Crack the hard problems in {s}"],
  light: ["Refresh {s} basics", "Quick recall drill on {s}", "Review {s} weak points"],
};

const pickObjective = (subject: string, style: LearningStyle, seed: number, focus: "deep" | "light"): string => {
  const pool = focus === "deep" ? OBJECTIVES[style] : FOCUS_MIX[focus];
  const arr = pool.map((t) => t.replace("{s}", subject));
  return arr[seed % arr.length];
};

// subjects rotated by priority: weak + exams first
export function orderedSubjects(profile: LifeProfile, date: Date): Subject[] {
  const today = dateKey(date);
  return [...profile.subjects].sort((a, b) => {
    const score = (s: Subject) => {
      let p = (6 - s.strength) * 2; // weaker = higher priority
      if (s.examDate) {
        const d = daysBetween(today, s.examDate);
        if (d >= 0 && d <= 30) p += (30 - d) / 2;
      }
      return p;
    };
    return score(b) - score(a);
  });
}

export function generateRoutine(profile: LifeProfile, opts: RoutineOptions = {}): RoutineBlock[] {
  const date = opts.date ?? new Date();
  const emergency = opts.emergency ?? null;
  const target = opts.forcedSubject ?? null;
  const wake = toMin(profile.wakeTime);
  const sleep = toMin(profile.sleepTime);
  const weekday = date.getDay(); // 0=Sun
  const isWeekend = weekday === 0 || weekday === 6;

  // day plan of fixed blocks
  const plan: { start: number; end: number; type: BlockType; label: string; subject?: string }[] = [];

  plan.push({ start: wake, end: wake + 25, type: "wake", label: "Wake up + get ready" });
  plan.push({ start: wake + 25, end: wake + 55, type: "meal", label: "Breakfast" });

  // travel to school
  const schoolStart = toMin(profile.schoolStart);
  const schoolEnd = toMin(profile.schoolEnd);
  if (!isWeekend && schoolStart > 0 && schoolEnd > 0) {
    if (profile.travelMin > 0) {
      plan.push({ start: schoolStart - profile.travelMin, end: schoolStart, type: "travel", label: "Commute to school" });
    }
    plan.push({ start: schoolStart, end: schoolEnd, type: "school", label: "School", subject: "School" });
    if (profile.travelMin > 0) {
      plan.push({ start: schoolEnd, end: schoolEnd + profile.travelMin, type: "travel", label: "Commute home" });
    }
  }

  // coaching
  const hasCoaching = profile.hasCoaching && profile.coachingStart && profile.coachingEnd;
  if (hasCoaching) {
    const days = (profile.coachingDays || ["Mon", "Wed", "Fri"]);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (days.includes(dayNames[weekday])) {
      plan.push({
        start: toMin(profile.coachingStart!),
        end: toMin(profile.coachingEnd!),
        type: "coaching",
        label: "Coaching / Tuition",
      });
    }
  }

  // lunch
  const lunchStart = Math.max(toMin("12:30"), schoolEnd + (profile.travelMin || 0) + 15);
  if (lunchStart < toMin("14:30")) {
    plan.push({ start: lunchStart, end: lunchStart + 40, type: "meal", label: "Lunch" });
  }

  // afternoon exercise
  if (profile.exerciseDaily && !isWeekend) {
    plan.push({ start: toMin("16:15"), end: toMin("16:45"), type: "exercise", label: "Exercise / walk" });
  }

  // prayer
  if (profile.hasPrayer) {
    plan.push({ start: toMin("18:45"), end: toMin("19:00"), type: "prayer", label: "Prayer" });
  }

  // dinner
  plan.push({ start: toMin("20:15"), end: toMin("20:50"), type: "meal", label: "Dinner" });

  // wind down / sleep
  plan.push({ start: sleep - 25, end: sleep, type: "leisure", label: "Wind down" });
  plan.push({ start: sleep, end: sleep + 420, type: "sleep", label: "Sleep" });

  const fixed = plan
    .filter((p) => p.end > p.start)
    .sort((a, b) => a.start - b.start);

  // merge overlaps, then collect free windows
  const merged: { start: number; end: number; type: BlockType; label: string; subject?: string }[] = [];
  for (const b of fixed) {
    const last = merged[merged.length - 1];
    if (last && b.start < last.end) {
      last.end = Math.max(last.end, b.end);
    } else {
      merged.push({ ...b });
    }
  }

  const blocks: RoutineBlock[] = [];
  const dayLen = ((sleep - wake + 1440) % 1440) || 720;

  // mission mode: target subject dominates
  const subjects = orderedSubjects(profile, date);
  let rotation: Subject[] = subjects;
  if (target) {
    const found = profile.subjects.find((s) => s.name === target) ?? profile.subjects[0];
    rotation = [found, ...subjects.filter((s) => s.name !== found.name)];
  }

  // how many study cycles fit
  const cycleLen = profile.studyBlockMin + profile.breakMin;
  const maxCycles = Math.floor(dayLen / cycleLen);
  const targetCycles = emergency === "exam-tomorrow" ? Math.min(maxCycles, 8)
    : emergency === "2-hours" ? Math.min(maxCycles, 4)
    : emergency === "exam-3days" ? Math.min(maxCycles, 6)
    : emergency === "tired" || emergency === "sick" ? Math.min(maxCycles, 3)
    : Math.min(maxCycles, isWeekend && profile.weekendStudy ? 6 : 5);

  // build study windows from free gaps (excluding sleep)
  const freeWindows: { start: number; end: number }[] = [];
  let cursor = wake;
  const allBlocks = [...merged];
  for (const b of allBlocks) {
    if (b.type === "sleep") continue;
    if (b.start > cursor) freeWindows.push({ start: cursor, end: Math.min(b.start, sleep) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < sleep) freeWindows.push({ start: cursor, end: sleep });

  // long windows first so deep work happens in big chunks
  const bigWindows = freeWindows.filter((w) => w.end - w.start >= cycleLen);
  const smallWindows = freeWindows.filter((w) => w.end - w.start < cycleLen);

  let subjIdx = 0;
  let cycleCount = 0;
  let emergencyDone = false;

  const pushStudy = (window: { start: number; end: number }, isEvening: boolean, overrideSubject?: Subject) => {
    if (cycleCount >= targetCycles) return;
    const dur = Math.min(profile.studyBlockMin, window.end - window.start);
    if (dur < 20) return;
    const subj = overrideSubject ?? rotation[subjIdx % rotation.length];
    const energy = energyAt(profile, window.start);
    const brainLoad = brainLoadOf(energy);
    const focus: "deep" | "light" = energy >= 60 ? "deep" : "light";
    const difficulty = subj.strength >= 4 ? 2 : subj.strength === 3 ? 3 : 4;
    const priority = subj.examDate ? (daysBetween(todayKey(), subj.examDate) <= 10 ? 5 : 3) : subj.strength <= 2 ? 4 : 2;
    const emergencyBoost = emergency === "exam-tomorrow" || emergency === "2-hours" || emergency === "exam-3days";

    const type: BlockType = emergencyBoost && subj.name === target ? "mission" : "study";

    blocks.push({
      id: `b-${Date.now()}-${blocks.length}-${Math.floor(Math.random() * 1e6)}`,
      startMin: window.start,
      endMin: window.start + dur,
      type,
      subject: subj.name,
      objective: pickObjective(subj.name, profile.learningStyle, cycleCount + subjIdx + priority, focus),
      focus,
      retention: 40 + ((subj.strength * 7 + cycleCount * 3 + priority * 4) % 56),
      priority: Math.min(5, priority + (emergencyBoost ? 1 : 0)),
      difficulty,
      reward: REWARDS[(cycleCount + subjIdx + Date.now()) % REWARDS.length],
      energy: Math.round(energy),
      brainLoad,
      color: blockColor(type, focus, emergency),
      status: "pending",
      xp: 15 + difficulty * 6 + (focus === "deep" ? 8 : 3),
    });
    cycleCount++;
    if (!overrideSubject && cycleCount % 2 === 1) subjIdx++;
    else if (overrideSubject) emergencyDone = true;
  };

  // place studies in big windows (morning peak, then evening)
  const morning = bigWindows.filter((w) => w.start < toMin("12:00"));
  const evening = bigWindows.filter((w) => w.start >= toMin("12:00"));

  for (const w of morning) pushStudy(w, false);
  for (const w of evening) pushStudy(w, true);
  for (const w of smallWindows) pushStudy(w, true);

  // mission mode: guarantee target subject blocks
  if (target && !emergencyDone) {
    const targetSubj = profile.subjects.find((s) => s.name === target) ?? rotation[0];
    const lastWin = bigWindows[bigWindows.length - 1] ?? freeWindows[freeWindows.length - 1];
    if (lastWin && cycleCount < maxCycles) pushStudy(lastWin, true, targetSubj);
  }

  const all: RoutineBlock[] = [];
  let idx = 0;

  for (const b of merged) {
    if (b.type === "sleep") {
      all.push({
        id: `f-${idx++}`,
        startMin: b.start,
        endMin: b.end,
        type: "sleep",
        objective: b.label,
        focus: "light",
        retention: 100,
        priority: 1,
        difficulty: 1,
        reward: "",
        energy: 5,
        brainLoad: "low",
        color: blockColor("sleep", "light"),
        status: "done",
        xp: 0,
      });
      continue;
    }
    all.push({
      id: `f-${idx++}`,
      startMin: b.start,
      endMin: b.end,
      type: b.type,
      subject: b.subject,
      objective: b.label,
      focus: "light",
      retention: 80,
      priority: 1,
      difficulty: 1,
      reward: "",
      energy: 30,
      brainLoad: "low",
      color: blockColor(b.type, "light", emergency),
      status: "done",
      xp: 0,
    });
  }

  // insert study blocks into the timeline, avoiding overlap
  const studyBlocks = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const timeline: RoutineBlock[] = [];
  for (const s of studyBlocks) {
    timeline.push(s);
    if (s.endMin < sleep && s.type !== "mission" && !(emergency === "exam-tomorrow" || emergency === "2-hours")) {
      const breakEnd = Math.min(s.endMin + profile.breakMin, sleep);
      timeline.push({
        id: `br-${Date.now()}-${timeline.length}-${Math.floor(Math.random() * 1e6)}`,
        startMin: s.endMin,
        endMin: breakEnd,
        type: "break",
        objective: `Break — ${s.reward || "stretch & hydrate"}`,
        focus: "light",
        retention: 0,
        priority: 1,
        difficulty: 1,
        reward: "",
        energy: Math.round(energyAt(profile, s.endMin)),
        brainLoad: "low",
        color: blockColor("break", "light"),
        status: "pending",
        xp: 2,
      });
    }
  }

  const combined = [...all, ...timeline].sort((a, b) => a.startMin - b.startMin);

  // renumber ids deterministically
  return combined.map((b, i) => ({ ...b, id: `blk-${i}` }));
}

/* ═══════════════════════════════════════════════════
   LIVE AI ADAPTATION  (M4)
   ═══════════════════════════════════════════════════ */

// When a study block is missed, reschedule it into a later free gap and
// shorten the nearest break to keep the day moving.
export function adaptRoutine(routine: RoutineBlock[], missedId: string, profile: LifeProfile): RoutineBlock[] {
  const idx = routine.findIndex((b) => b.id === missedId);
  if (idx === -1) return routine;
  const missed = routine[idx];
  const duration = missed.endMin - missed.startMin;
  const updated = [...routine];
  updated[idx] = { ...missed, status: "skipped" };

  // find a free gap later today between a pending block and its next
  for (let i = idx + 1; i < updated.length; i++) {
    const b = updated[i];
    if (b.type === "break" && b.status === "pending" && b.endMin - b.startMin >= 10) {
      const next = updated.find((x) => x.startMin >= b.endMin && x.type === "study" && x.status === "pending");
      if (next) {
        // merge missed into the break + gap
        const gapEnd = next.startMin;
        const available = gapEnd - b.startMin;
        if (available >= duration) {
          const replacement: RoutineBlock = {
            ...missed,
            id: `ad-${Date.now()}-${Math.random()}`,
            startMin: b.startMin,
            endMin: b.startMin + duration,
            status: "adapted",
          };
          updated[i] = replacement;
          // shift subsequent blocks forward? simpler: mark next as is
          return updated;
        }
      }
    }
  }

  // fallback: append at end of day before sleep
  const lastStudy = [...updated].reverse().find((b) => b.type === "sleep");
  if (lastStudy) {
    const start = Math.min(lastStudy.startMin - duration, toMin(profile.sleepTime) - duration);
    updated.push({ ...missed, id: `ad-${Date.now()}-${Math.random()}`, startMin: start, endMin: start + duration, status: "adapted" });
  }
  return updated;
}

/* ═══════════════════════════════════════════════════
   AI LIFE ANALYSIS  (M2)
   ═══════════════════════════════════════════════════ */

export interface AnalysisResult {
  totalScore: number; // 0-100 life balance
  studyHoursPerDay: number;
  sleepHours: number;
  freeHours: number;
  weakestSubject: string;
  strongestSubject: string;
  nextExam: { subject: string; days: number } | null;
  predictedScore: number; // predicted exam %
  focusPotential: number;
  energyProfile: "morning" | "balanced" | "evening";
  risks: string[];
  recommendations: string[];
  subjectBreakdown: { subject: string; strength: number; priority: number }[];
}

export function analyze(profile: LifeProfile): AnalysisResult {
  const wake = toMin(profile.wakeTime);
  const sleep = toMin(profile.sleepTime);
  const sleepHrs = ((sleep - wake + 1440) % 1440) / 60;
  const today = todayKey();

  let nextExam: AnalysisResult["nextExam"] = null;
  for (const s of profile.subjects) {
    if (!s.examDate) continue;
    const d = daysBetween(today, s.examDate);
    if (d >= 0 && (nextExam === null || d < nextExam.days)) {
      nextExam = { subject: s.name, days: d };
    }
  }

  const ordered = orderedSubjects(profile, new Date());
  const weakest = ordered[0];
  const strongest = [...profile.subjects].sort((a, b) => b.strength - a.strength)[0];

  // free hours = waking hours minus school minus coaching minus meals
  const schoolHrs = profile.schoolStart && profile.schoolEnd ? (toMin(profile.schoolEnd) - toMin(profile.schoolStart)) / 60 : 0;
  const coachingHrs = profile.hasCoaching && profile.coachingStart && profile.coachingEnd
    ? (toMin(profile.coachingEnd) - toMin(profile.coachingStart)) / 60
    : 0;
  const mealsHrs = 1.6;
  const freeHrs = Math.max(0, sleepHrs - schoolHrs - coachingHrs - mealsHrs - 1.5);
  const studyHrs = Math.min(freeHrs, profile.weekendStudy ? 6 : 5);

  // predicted score: base from strength, speed, +study time, -stress/distractions
  const speedBonus = profile.learningSpeed === "fast" ? 6 : profile.learningSpeed === "medium" ? 2 : -4;
  const studyBonus = Math.min(18, studyHrs * 3.4);
  const stressPenalty = (profile.stressLevel - 1) * 4;
  const distractionPenalty = (profile.phoneDistraction - 1) * 3.2;
  const sleepPenalty = sleepHrs < 7 ? (7 - sleepHrs) * 5 : 0;
  const predicted = Math.max(35, Math.min(99, Math.round(58 + speedBonus + studyBonus - stressPenalty - distractionPenalty - sleepPenalty)));

  const energyProfile: AnalysisResult["energyProfile"] =
    profile.energyLevel >= 4 ? "morning" : profile.energyLevel <= 2 ? "evening" : "balanced";

  const focusPotential = Math.round(
    Math.max(15, 100 - (profile.phoneDistraction - 1) * 14 - (profile.screenTimeHrs > 6 ? 12 : 0) - (profile.stressLevel - 1) * 5 + profile.energyLevel * 3)
  );

  const risks: string[] = [];
  const recommendations: string[] = [];
  if (sleepHrs < 7) risks.push(`Only ${sleepHrs.toFixed(1)}h of sleep — below the recommended 8h.`);
  if (profile.stressLevel >= 4) risks.push("High stress level detected — this will hurt memory and focus.");
  if (profile.phoneDistraction >= 4) risks.push("Heavy phone distraction will fragment deep work.");
  if (profile.screenTimeHrs > 6) risks.push(`High screen time (${profile.screenTimeHrs}h) outside study — consider a digital curfew.`);
  if (!profile.weekendStudy && nextExam && nextExam.days < 10) risks.push("Exam approaching but weekends are free — add weekend prep.");
  if (weakest.strength <= 2) risks.push(`"${weakest.name}" is your weakest subject and needs daily attention.`);
  if (profile.learningSpeed === "slow" && profile.studyBlockMin > 30) risks.push("Long blocks may hurt a slower learner — shorter cycles work better.");

  if (sleepHrs < 7) recommendations.push(`Move sleep time earlier to reach ${8 - sleepHrs > 0 ? "at least 8h" : "8h"} of sleep.`);
  recommendations.push(`Schedule "${weakest.name}" in your morning energy peak.`);
  if (profile.phoneDistraction >= 3) recommendations.push("Put the phone in another room during deep blocks.");
  if (profile.stressLevel >= 3) recommendations.push("Add a 15-min wind-down + exercise — it boosts retention.");
  if (profile.energyLevel <= 2) recommendations.push("Consider light exercise in the morning to lift energy levels.");
  recommendations.push(`Target ${profile.studyGoal}% — with predicted ${predicted}%, focus on past papers for the last 2 weeks.`);
  if (profile.readingDaily === false) recommendations.push("Add 15 min of reading daily — it compounds into faster learning.");
  if (profile.codingDaily === false && profile.subjects.some((s) => s.name.toLowerCase().includes("cs") || s.name.toLowerCase().includes("computer")))
    recommendations.push("Practice coding daily — it is the strongest form of active recall.");

  const totalScore = Math.round(
    Math.max(
      20,
      Math.min(
        98,
        predicted * 0.5 + focusPotential * 0.3 + (profile.energyLevel / 5) * 100 * 0.2 - (profile.stressLevel - 1) * 2
      )
    )
  );

  return {
    totalScore,
    studyHoursPerDay: Math.round(studyHrs * 10) / 10,
    sleepHours: Math.round(sleepHrs * 10) / 10,
    freeHours: Math.round(freeHrs * 10) / 10,
    weakestSubject: weakest.name,
    strongestSubject: strongest.name,
    nextExam,
    predictedScore: predicted,
    focusPotential,
    energyProfile,
    risks,
    recommendations,
    subjectBreakdown: profile.subjects.map((s) => ({
      subject: s.name,
      strength: s.strength,
      priority: s.strength >= 4 ? 2 : s.strength === 3 ? 3 : 4,
    })),
  };
}

/* ═══════════════════════════════════════════════════
   RETENTION ENGINE  (M6) — spaced repetition
   ═══════════════════════════════════════════════════ */

const REVIEW_QUESTIONS = [
  "What was the #1 formula or concept you just studied?",
  "Explain the last topic to yourself in 2 sentences — out loud.",
  "What are 3 keywords you'd use to remember this topic?",
  "Where does this concept connect to something you already know?",
  "What question would you ask on an exam about this topic?",
];

export const SM2_INTERVALS = [0, 1, 3, 7, 14, 30];

export function buildRetentionCards(subjects: Subject[], todayKeyStr: string): RetentionCard[] {
  const cards: RetentionCard[] = [];
  for (const s of subjects) {
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: `rt-${s.name.replace(/\s+/g, "-").toLowerCase()}-${i}`,
        subject: s.name,
        question: REVIEW_QUESTIONS[Math.min(i, REVIEW_QUESTIONS.length - 1)],
        hint: `Recall from your recent ${s.name} study session.`,
        nextReview: todayKeyStr,
        interval: 0,
        box: 0,
        lastScore: 0,
        source: "analysis",
      });
    }
  }
  return cards;
}

export function reviewDueCards(cards: RetentionCard[], todayKeyStr: string): RetentionCard[] {
  return cards.filter((c) => c.nextReview <= todayKeyStr);
}

// SM-2: quality 0-5. Returns updated card.
export function gradeCard(card: RetentionCard, quality: number, todayKeyStr: string): RetentionCard {
  const q = Math.max(0, Math.min(5, quality));
  let box = q >= 3 ? card.box + 1 : 0;
  box = Math.min(5, box);
  let interval: number;
  if (box === 0) interval = 0;
  else if (box === 1) interval = 1;
  else if (box === 2) interval = 3;
  else if (box === 3) interval = 7;
  else if (box === 4) interval = 14;
  else interval = 30;
  const lastScore = (q / 5) * 100;
  return { ...card, box, interval, lastScore, nextReview: addDays(todayKeyStr, interval) };
}

/* ═══════════════════════════════════════════════════
   AI COACH  (M11) — supportive but strict mentor
   ═══════════════════════════════════════════════════ */

export interface CoachContext {
  profile: LifeProfile;
  completion: number;
  streak: number;
  xp: number;
  level: number;
  nextExam: string | null;
  emergency: EmergencyPreset | null;
  hour: number;
}

export const COACH_PERSONA = "Sage — your AI mentor. Encouraging but never lets you coast. Warm, direct, a little witty.";

const coachingResponses = [
  (c: CoachContext) => `You're at ${c.completion}% completion today, ${c.profile.name}. ${c.completion >= 80 ? "That's the discipline I'm talking about — now protect the lead." : c.completion >= 50 ? "Solid momentum. The last stretch is where winners pull away — let's finish strong." : "Slow start. I'm not mad, I'm invested. Let's win back the next block together."} Remember: consistency beats intensity.`,
  (c: CoachContext) => `${c.streak} day streak. ${c.streak >= 7 ? "You're in flow state territory — this is where real change compounds." : "Streaks break when you skip 'just one day'. Guard it like it's your future — because it is."}`,
  (c: CoachContext) => `${c.nextExam ? `Your next exam (${c.nextExam}) is the mission. Every block either moves you toward it or away from it. No neutral days.` : "No exam on the horizon — this is the golden window to build habits before the pressure arrives."}`,
  (c: CoachContext) => `Level ${c.level}, ${c.xp} XP. ${c.xp > 1000 ? "You've earned your rest — but earned rest is for the evening. Right now, there's work to claim." : "Small daily deposits compound into a fortune of skill. Keep stacking."}`,
  (c: CoachContext) => `I see ${c.profile.stressLevel}/5 stress. ${c.profile.stressLevel >= 4 ? "We're going to dial today down 20% — but not to zero. A lighter routine still counts. Show up reduced, don't disappear." : "Stress is manageable right now. Use it — a little pressure sharpens focus."}`,
];

export function coachReply(input: string, ctx: CoachContext): string {
  const q = input.toLowerCase();
  if (q.includes("tired") || q.includes("exhaust") || q.includes("burn")) {
    return `${ctx.profile.name}, tiredness is a signal, not a failure. Cut today's routine to light blocks only, drink water, take a real 20-min rest. But promise me one 25-minute deep block tonight. A doctor's rest + a soldier's comeback.`;
  }
  if (q.includes("motivat") || q.includes("give up") || q.includes("hard")) {
    return `Here's your truth, ${ctx.profile.name}: every expert was once a beginner who refused to quit. ${ctx.nextExam ? `The ${ctx.nextExam} exam doesn't need you to be perfect — it needs you to be prepared.` : ""} You've built ${ctx.streak}-day momentum. Momentum doesn't lie. Break the next block into 5-minute steps and start the first one right now. I'll be right here.`;
  }
  if (q.includes("hello") || q.includes("hi ") || q.includes("hey")) {
    return `Hey ${ctx.profile.name}. ${ctx.emergency ? "Emergency mode is active — I see you, and we're handling it. What's the immediate blocker?" : `You're at ${ctx.completion}% today. Ready to make it ${Math.min(100, ctx.completion + 25)}?`}`;
  }
  if (q.includes("plan") || q.includes("schedule") || q.includes("routine")) {
    return `Your routine is already adaptive — it shifted blocks when you needed it. Your best move right now: pick the highest-priority pending block and lock it in. I've arranged subjects by exam proximity and energy curve. Trust the plan, ${ctx.profile.name}.`;
  }
  if (q.includes("exam") || q.includes("test") || q.includes("paper")) {
    return ctx.nextExam
      ? `${ctx.nextExam} is your priority target. Shift extra blocks to it, use active recall + past papers, and keep sleep at 8h — memory consolidates while you sleep. You'll walk in calm because you walked in prepared.`
      : "No exam on the board — perfect time to build the habit engine so when exams arrive, you're unstoppable.";
  }
  if (q.includes("focus") || q.includes("distract") || q.includes("phone")) {
    return `Phone in another room. Notifications off. One subject. ${ctx.profile.studyBlockMin} minutes. That's the whole ritual — simplicity beats willpower. Your focus potential is ${ctx.profile.phoneDistraction >= 4 ? "being drained by the phone. Cut it loose for 90 minutes." : "strong right now. Protect it."}`;
  }
  if (q.includes("stress") || q.includes("anxious") || q.includes("worried")) {
    return `Breathe. You're at ${ctx.completion}% — proof you're moving. Stress shrinks when you shrink the task: finish ONE block, then reassess. ${ctx.profile.stressLevel >= 4 ? "And I mean it — take the lighter routine today. Rest is part of the strategy, not the enemy." : "Your stress is in a healthy range. Ride the focus while it's cheap."}`;
  }
  const base = coachingResponses[Math.floor(Math.random() * coachingResponses.length)];
  return base(ctx);
}

/* ═══════════════════════════════════════════════════
   FUTURE SELF  (M12) — cinematic, never repeats
   ═══════════════════════════════════════════════════ */

const FUTURE_TEXTS: { tag: string; text: string }[] = [
  { tag: "Legacy", text: "One morning, years from now, you'll walk into a room you earned — and remember today's small grind with gratitude." },
  { tag: "Strength", text: "You don't need to be perfect today. You need to be present. Perfection is built from thousands of present days just like this one." },
  { tag: "Vision", text: "The version of you reading this message later is already proud. Don't betray her by skipping the block that built her." },
  { tag: "Patience", text: "Skill is just patience with a schedule. Every review, every problem, every sleepy morning — it's all stacking." },
  { tag: "Courage", text: "Courage isn't loud. It's opening the book on the day you didn't want to. That's the move that separates the story." },
  { tag: "Compassion", text: "Be kind to today's you. Progress with softness beats perfection with exhaustion — every single time." },
  { tag: "Clarity", text: "Clarity comes from action, not thinking. Take one step now, and the fog will start to lift." },
  { tag: "Power", text: "Your future self didn't get lucky. She out-scheduled her doubts. Start the block. Become her." },
  { tag: "Stillness", text: "Between two study blocks, the future waits patiently. Use the break to breathe — then return stronger." },
  { tag: "Potential", text: "You are not behind. You are exactly where the story needed you. What you do today writes the next chapter." },
];

export function futureSelfMessage(profile: LifeProfile, used: string[]): { text: string; tag: string; fromAge: number } {
  const day = Math.floor(Date.now() / 86400000);
  const unused = FUTURE_TEXTS.filter((t) => !used.includes(t.text));
  const pool = unused.length ? unused : FUTURE_TEXTS;
  const pick = pool[day % pool.length];
  return { text: pick.text, tag: pick.tag, fromAge: profile.age + 5 };
}

/* ═══════════════════════════════════════════════════
   WEEKLY EVOLUTION  (M10)
   ═══════════════════════════════════════════════════ */

export function computeDailyStats(routine: RoutineBlock[], profile: LifeProfile): DayStats {
  const study = routine.filter((b) => b.type === "study" || b.type === "mission");
  const total = study.length;
  const done = study.filter((b) => b.status === "done" || b.status === "adapted").length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);
  const focus = study.length === 0 ? 0 : Math.round(study.reduce((a, b) => a + (b.status === "done" ? b.energy : b.energy * 0.4), 0) / study.length);
  const xp = routine.filter((b) => b.status === "done").reduce((a, b) => a + b.xp, 0);
  const studyMin = study.filter((b) => b.status === "done").reduce((a, b) => a + (b.endMin - b.startMin), 0);
  return { completion, focus, xp, studyMin };
}

export const fmtDuration = (min: number): string => {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? (r ? `${h}h ${r}m` : `${h}h`) : `${m}m`;
};

const fmtClock = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const actionLabel = (a: string): string =>
  a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Build the professional daily report (PDF content + email summary text). No emojis. */
export function buildDailyReport(state: LifeOsState): string {
  const profile = state.profile;
  const today = todayKey();
  if (!profile) return "Open StudyOS and complete onboarding to get your daily report.";
  const live = computeDailyStats(state.routine, profile);
  const stored = state.dailyStats[today];
  const studyMin = Math.max(live.studyMin, stored?.studyMin ?? 0, toolMinutesOn(state, today));
  const completion = Math.max(live.completion, stored?.completion ?? 0);
  const xp = Math.max(live.xp, stored?.xp ?? 0);
  const focus = Math.max(live.focus, stored?.focus ?? 0);
  const analysis = analyze(profile);
  const breakdown = activityBreakdown(state);
  const interactions = toolInteractions(state, today);
  const study = state.routine.filter((b) => b.type === "study" || b.type === "mission");
  const done = study.filter((b) => b.status === "done").length;
  const firstUp = [...state.routine]
    .filter((b) => (b.type === "study" || b.type === "mission") && b.status === "pending")
    .sort((a, b) => a.startMin - b.startMin)[0];
  const top = breakdown.today.slice(0, 6);

  const divider = "─".repeat(40);
  const lines: string[] = [];
  lines.push(`STUDYOS DAILY REPORT — ${today}`);
  lines.push(divider);
  lines.push(`Student: ${profile.name} (Grade ${profile.grade})`);
  lines.push("");
  lines.push("STUDY SUMMARY");
  lines.push(`  Blocks completed: ${done}/${study.length} (${completion}%)`);
  lines.push(`  Study time: ${fmtDuration(studyMin)}`);
  lines.push(`  XP earned today: +${xp}`);
  lines.push(`  Focus score: ${focus}/100`);
  lines.push(`  Streak: ${state.gamification.streak} day${state.gamification.streak === 1 ? "" : "s"}`);
  lines.push("");
  lines.push("TOOL USAGE (today)");
  if (top.length) {
    top.forEach((t) => lines.push(`  ${t.toolName}: ${fmtDuration(t.minutes)}`));
  } else {
    lines.push("  No tool usage recorded yet today.");
  }
  lines.push("");
  lines.push("SEARCHES AND RESULTS (today)");
  if (interactions.length) {
    interactions.slice(0, 8).forEach((it) => {
      lines.push(`  ${it.toolName} — ${actionLabel(it.action)}`);
      if (it.query) lines.push(`    Input: ${it.query}`);
      if (it.result) lines.push(`    Output: ${it.result}`);
    });
  } else {
    lines.push("  No searches recorded yet today.");
  }
  lines.push("");
  lines.push("ACADEMIC OUTLOOK");
  lines.push(`  Predicted exam score: ${analysis.predictedScore}%`);
  lines.push(`  Weakest subject: ${analysis.weakestSubject}`);
  if (analysis.nextExam) {
    lines.push(`  Next exam: ${analysis.nextExam.subject} in ${analysis.nextExam.days} day${analysis.nextExam.days === 1 ? "" : "s"}`);
  }
  if (firstUp) {
    lines.push(`  Next study block: ${firstUp.subject} at ${fmtClock(firstUp.startMin)}`);
  }
  lines.push("");
  lines.push(divider);
  lines.push(
    completion >= 80
      ? "Outstanding day. Maintain this momentum tomorrow."
      : completion >= 40
      ? "Solid progress. A few more blocks will complete the day."
      : "Every session counts. Start small, one block at a time."
  );
  return lines.join("\n");
}

export function buildWeeklyReport(days: DayStats[], profile: LifeProfile, streak: number, weekStart: string): WeeklyReport {
  const n = days.length || 1;
  const completion = Math.round(days.reduce((a, d) => a + d.completion, 0) / n);
  const focus = Math.round(days.reduce((a, d) => a + d.focus, 0) / n);
  const xp = days.reduce((a, d) => a + d.xp, 0);
  const topSubject = orderedSubjects(profile, new Date())[0]?.name ?? "—";
  const notes =
    completion >= 85
      ? `Exceptional week. You operated like a machine. Protect the momentum — next week is a launchpad.`
      : completion >= 60
      ? `Strong week with room to sharpen. ${focus >= 70 ? "Your focus is elite — now raise volume slightly." : "Focus dipped; tighten distraction controls next week."}`
      : `A building week. Small wins still compound. We'll aim for 3 solid days next week, then expand.`;
  return { weekStart, weekEnd: addDays(weekStart, 6), completion, focus, xp, streak, topSubject, notes };
}

/* ═══════════════════════════════════════════════════
   EMERGENCY MODE  (M13)
   ═══════════════════════════════════════════════════ */

export const EMERGENCY_PRESETS: { id: EmergencyPreset; label: string; desc: string; icon: string; color: string }[] = [
  { id: "exam-tomorrow", label: "Exam Tomorrow", desc: "Maximum intensity on the target subject — minimal breaks.", icon: "🚨", color: "#E8852E" },
  { id: "exam-3days", label: "Exam in 3 Days", desc: "Heavy target-subject load with review blocks.", icon: "🎯", color: "#FF9F4C" },
  { id: "2-hours", label: "Only 2 Hours", desc: "A compressed ultra-focus sprint, zero breaks.", icon: "⏱️", color: "#FFB366" },
  { id: "tired", label: "Feeling Tired", desc: "Lighter blocks, extra breaks, lower brain load.", icon: "😴", color: "#FFCA80" },
  { id: "sick", label: "Feeling Sick", desc: "Gentle review-only day. Rest is the priority.", icon: "🤒", color: "#FFF0E0" },
  { id: "no-internet", label: "No Internet", desc: "Offline-friendly tasks — notes, recall, past papers.", icon: "📡", color: "#F5E0CC" },
  { id: "travel", label: "Travel Day", desc: "Compact audio/practical review you can do on the move.", icon: "✈️", color: "#FFE0C0" },
];

/* ═══════════════════════════════════════════════════
   FOCUS ENGINE  (M8)
   ═══════════════════════════════════════════════════ */

export interface FocusStats {
  activeSec: number;
  idleSec: number;
  tabSwitches: number;
  interruptions: number;
  focusScore: number;
  deepWorkMin: number;
  consistency: number;
}

export function computeFocus(stats: FocusStats, plannedMin: number): FocusStats {
  const total = stats.activeSec + stats.idleSec || 1;
  const focus = Math.round((stats.activeSec / total) * 100);
  const idlePenalty = Math.min(30, stats.idleSec / 60);
  const switchPenalty = Math.min(25, stats.tabSwitches * 5);
  const focusScore = Math.max(0, Math.min(100, Math.round(focus - idlePenalty - switchPenalty)));
  const deepWorkMin = Math.round(stats.activeSec / 60 - stats.interruptions * 1.5);
  const consistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, stats.idleSec / (plannedMin * 60))) * 100)));
  return { ...stats, focusScore: Math.max(0, Math.min(100, focusScore)), deepWorkMin: Math.max(0, deepWorkMin), consistency };
}

export const placeholderFocusSession = (): FocusSession => ({
  id: `fs-${Date.now()}`,
  date: todayKey(),
  start: Date.now(),
  plannedMin: 25,
  focusScore: 0,
  deepWorkMin: 0,
  consistency: 0,
  distractions: 0,
  completed: false,
});

/* ═══════════════════════════════════════════════════
   REAL CROSS-TOOL ACTIVITY  (M16) — live platform feed
   Replays recorded events from every learning tool into
   the Life OS state: XP, study minutes, focus, and
   auto-completing routine blocks the student actually did.
   ═══════════════════════════════════════════════════ */

export interface ActivityMergeResult {
  state: LifeOsState;
  autoCompleted: RoutineBlock[];
  newXp: number;
  newTrophies: Trophy[];
}

export function applyActivity(state: LifeOsState, events: ActivityEvent[]): ActivityMergeResult {
  if (!events.length) return { state, autoCompleted: [], newXp: 0, newTrophies: [] };

  const existingIds = new Set(state.toolActivity.map((a) => a.id));
  const fresh = events.filter((e) => !existingIds.has(e.id));
  if (!fresh.length) return { state, autoCompleted: [], newXp: 0, newTrophies: [] };

  const today = todayKey();
  const autoCompleted: RoutineBlock[] = [];
  let newXp = 0;
  let addedStudyMin = 0;

  const records: ToolActivity[] = [...state.toolActivity];
  let daily = state.dailyStats[today] ?? { completion: 0, focus: 0, xp: 0, studyMin: 0 };
  let gamification = state.gamification;
  let routine = state.routine;

  const autoComplete = (toolId: string) => {
    const pending = routine.find((b) =>
      (b.type === "study" || b.type === "mission") &&
      b.status === "pending" &&
      (b.subject === undefined || matchSubject(toolId, b.subject))
    );
    if (pending) return pending;
    return routine.find((b) => (b.type === "study" || b.type === "mission") && b.status === "pending");
  };

  for (const e of fresh) {
    const rec = toToolActivity(e);
    records.push(rec);
    if (e.action !== "visit") {
      newXp += e.xp;
      gamification = awardXp(gamification, e.xp);
      continue;
    }
    if (!isStudyTool(e.tool)) continue;

    const dur = Math.max(0, e.durationMin);
    addedStudyMin += dur;
    daily.studyMin += dur;
    newXp += e.xp;
    gamification = awardXp(gamification, e.xp);

    // real work auto-completes a matching pending block
    if (dur >= 15) {
      const target = autoComplete(e.tool);
      if (target) {
        const done = { ...target, status: "done" as const };
        routine = routine.map((b) => (b.id === target.id ? done : b));
        autoCompleted.push(done);
        daily.completion = computeCompletion(routine);
        daily.xp += target.xp;
        gamification = awardXp(gamification, target.xp);
      }
    }
  }

  // focus score = share of today's study minutes in deep tools (Math/Lab/Logic)
  daily.focus = Math.round(Math.min(100, daily.focus + addedStudyMin * 0.4));

  // real achievement check: any trophy unlocked by this real work?
  const merged: LifeOsState = {
    ...state,
    toolActivity: records.slice(-400),
    gamification,
    routine,
    dailyStats: { ...state.dailyStats, [today]: daily },
  };
  const trophyRes = evaluateTrophies(merged);

  return {
    state: { ...merged, gamification: trophyRes.gamification },
    autoCompleted,
    newXp,
    newTrophies: trophyRes.newTrophies,
  };
}

function computeCompletion(routine: RoutineBlock[]): number {
  const study = routine.filter((b) => b.type === "study" || b.type === "mission");
  const done = study.filter((b) => b.status === "done" || b.status === "adapted").length;
  return study.length ? Math.round((done / study.length) * 100) : 0;
}

export interface ToolStat {
  tool: string;
  toolName: string;
  minutes: number;
  visits: number;
  xp: number;
}

/** Aggregate real tool usage (study tools only) from recorded activity. */
export function activityBreakdown(state: LifeOsState, sinceKey?: string): { today: ToolStat[]; week: ToolStat[]; totalMin: number } {
  const today = todayKey();
  const weekAgo = addDays(today, -6);
  const by = (pred: (a: ToolActivity) => boolean): Map<string, ToolStat> => {
    const map = new Map<string, ToolStat>();
    for (const a of state.toolActivity) {
      if (!pred(a)) continue;
      const cur = map.get(a.tool) ?? { tool: a.tool, toolName: a.toolName, minutes: 0, visits: 0, xp: 0 };
      cur.minutes += a.durationMin;
      cur.visits += 1;
      cur.xp += a.xp;
      map.set(a.tool, cur);
    }
    return map;
  };
  const sort = (m: Map<string, ToolStat>): ToolStat[] =>
    [...m.values()].sort((a, b) => b.minutes - a.minutes);
  const todayMap = by((a) => a.date === today && isStudyTool(a.tool) && a.action === "visit");
  const weekMap = by((a) => a.date >= weekAgo && a.date <= today && isStudyTool(a.tool) && a.action === "visit");
  const totalMin = weekMap.size
    ? [...weekMap.values()].reduce((s, t) => s + t.minutes, 0)
    : [...by((a) => isStudyTool(a.tool) && a.action === "visit").values()].reduce((s, t) => s + t.minutes, 0);
  return { today: sort(todayMap), week: sort(weekMap), totalMin };
}

/** Total real study minutes recorded for a given day. */
export function toolMinutesOn(state: LifeOsState, day: string): number {
  return state.toolActivity
    .filter((a) => a.date === day && isStudyTool(a.tool) && a.action === "visit")
    .reduce((s, a) => s + a.durationMin, 0);
}

export interface ToolInteraction {
  tool: string;
  toolName: string;
  action: string;
  subject?: string;
  query?: string;
  result?: string;
  startedAt: number;
}

/**
 * Every recorded "what the student asked for → what the tool returned"
 * interaction, newest first. Only events that carry a real query or result
 * are included so the report shows genuine tool work, not passive visits.
 */
export function toolInteractions(state: LifeOsState, day?: string): ToolInteraction[] {
  return state.toolActivity
    .filter((a) => {
      if (!isStudyTool(a.tool)) return false;
      if (a.action === "visit") return false;
      if (!a.query && !a.result) return false;
      if (day && a.date !== day) return false;
      return true;
    })
    .map((a) => ({
      tool: a.tool,
      toolName: a.toolName,
      action: a.action,
      subject: a.subject,
      query: a.query,
      result: a.result,
      startedAt: a.startedAt,
    }))
    .sort((a, b) => b.startedAt - a.startedAt);
}
