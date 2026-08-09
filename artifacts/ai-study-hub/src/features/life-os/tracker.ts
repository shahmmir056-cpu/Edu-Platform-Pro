import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import type { ToolActivity } from "./types";

/* ═══════════════════════════════════════════════════
   GLOBAL ACTIVITY TRACKER — real cross-tool tracking
   Every page the student visits is recorded with real
   dwell time, then replayed into Life OS so the whole
   platform feeds the dashboard. Works even while the
   Life OS page is not mounted (persists to localStorage).
   ═══════════════════════════════════════════════════ */

const ACTIVITY_KEY = "neural-sync-life-os-activity-v1";
export const ACTIVITY_EVENT = "lifeos:activity";

export interface ToolMeta {
  name: string;
  icon: string;
  study: boolean;
  subjects: string[]; // subject hints used to auto-match routine blocks
}

/** Registry: route prefix -> tool metadata. */
export const TOOLS: Record<string, ToolMeta> = {
  "/math-solver": { name: "Math Solver", icon: "∑", study: true, subjects: ["math", "maths", "algebra", "calculus", "physics"] },
  "/essay": { name: "Essay Writer", icon: "✍", study: true, subjects: ["english", "essay", "writing", "literature"] },
  "/quiz": { name: "Quiz Generator", icon: "❓", study: true, subjects: [] },
  "/flashcards": { name: "Flashcards", icon: "🃏", study: true, subjects: [] },
  "/study-notes": { name: "Study Notes", icon: "📝", study: true, subjects: [] },
  "/presentation": { name: "Presentation Studio", icon: "📽", study: true, subjects: [] },
  "/text-playground": { name: "Text Playground", icon: "🧩", study: true, subjects: [] },
  "/virtual-lab": { name: "Virtual Lab", icon: "🧪", study: true, subjects: ["bio", "biology", "chemistry", "chem", "science"] },
  "/logic": { name: "Logic Explorer", icon: "🧠", study: true, subjects: ["logic", "computer", "cs", "math"] },
  "/study-games": { name: "Study Games", icon: "🎮", study: true, subjects: [] },
  "/test-conductor": { name: "Test Conductor", icon: "⏱", study: true, subjects: [] },
  "/simulations-v2": { name: "Simulations Lab", icon: "🔬", study: true, subjects: ["bio", "biology", "science"] },
  "/simulations": { name: "Biology Simulations", icon: "🧫", study: true, subjects: ["bio", "biology", "science"] },
  "/debate-mentor": { name: "AI Debate", icon: "🗣", study: true, subjects: ["english", "debate", "social"] },
  "/research": { name: "Deep Research", icon: "🔎", study: true, subjects: [] },
  "/life-os": { name: "Life OS", icon: "🧭", study: false, subjects: [] },
  "/": { name: "Home", icon: "🏠", study: false, subjects: [] },
};

export const isStudyTool = (toolId: string): boolean => TOOLS[toolId]?.study ?? false;

export function matchSubject(toolId: string, subjectName: string): boolean {
  const meta = TOOLS[toolId];
  if (!meta || !meta.subjects.length) return false;
  const s = subjectName.toLowerCase();
  return meta.subjects.some((k) => s.includes(k) || k.includes(s));
}

export interface ActivityEvent {
  id: string;
  tool: string;
  action: string;
  subject?: string;
  /** What the student asked for / typed into the tool. */
  query?: string;
  /** A short summary of what the tool produced back. */
  result?: string;
  durationMin: number;
  startedAt: number;
  xp: number;
}

/** Keep query/result strings compact so the localStorage log stays small. */
const clampText = (s: string | undefined, max: number): string | undefined => {
  if (!s) return undefined;
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

export function readActivityLog(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeActivityLog(log: ActivityEvent[]) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log.slice(-500)));
  } catch {
    // storage unavailable
  }
}

/** Append an event to the log and notify any mounted Life OS. */
export function recordActivity(event: ActivityEvent): void {
  const log = readActivityLog();
  if (log.some((e) => e.id === event.id)) return;
  writeActivityLog([...log, event]);
  window.dispatchEvent(new CustomEvent<ActivityEvent>(ACTIVITY_EVENT, { detail: event }));
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const dateKeyOf = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const xpFor = (durationMin: number): number => Math.min(60, Math.round(durationMin * 1.5));

/** Build a visit event (id/duration/xp) for a tool. */
function makeVisit(tool: string, durationMin: number, startedAt: number): ActivityEvent | null {
  const meta = TOOLS[tool];
  if (!meta || durationMin < 1) return null;
  return {
    id: uid(),
    tool,
    action: "visit",
    durationMin: Math.min(durationMin, 180),
    startedAt,
    xp: meta.study ? xpFor(durationMin) : 0,
  };
}

/** Record a dwell visit (page opened for durationMin minutes). */
export function trackVisit(tool: string, durationMin: number, startedAt: number): void {
  const evt = makeVisit(tool, durationMin, startedAt);
  if (!evt) return;
  recordActivity(evt);
}

/** Record an explicit tool action (solved a quiz, generated an essay, ...). */
export function trackAction(
  tool: string,
  action: string,
  subject?: string,
  durationMin = 1,
  query?: string,
  result?: string
): void {
  const meta = TOOLS[tool];
  if (!meta) return;
  recordActivity({
    id: uid(),
    tool,
    action,
    subject,
    query: clampText(query, 140),
    result: clampText(result, 200),
    durationMin: meta.study ? Math.max(durationMin, 1) : 0,
    startedAt: Date.now(),
    xp: meta.study ? 5 : 0,
  });
}

/** Build a ToolActivity record for a given event (date attached). */
export function toToolActivity(e: ActivityEvent): ToolActivity {
  return {
    id: e.id,
    tool: e.tool,
    toolName: TOOLS[e.tool]?.name ?? e.tool,
    action: e.action,
    subject: e.subject,
    query: e.query,
    result: e.result,
    durationMin: e.durationMin,
    startedAt: e.startedAt,
    date: dateKeyOf(e.startedAt),
    xp: e.xp,
  };
}

/* ═══════════════════════════════════════════════════
   ROUTE TRACKER — React component mounted once in App.
   Records real time spent on each tool route, pausing
   while the tab is hidden and flushing on navigation.
   ═══════════════════════════════════════════════════ */

export function RouteTracker() {
  const [location] = useLocation();
  const current = useRef<{ tool: string; startedAt: number } | null>(null);
  const mounted = useRef(true);

  const flush = () => {
    if (!mounted.current) return;
    const c = current.current;
    if (!c) return;
    const now = Date.now();
    const evt = makeVisit(c.tool, Math.round((now - c.startedAt) / 60000), c.startedAt);
    current.current = null;
    if (evt) recordActivity(evt);
  };

  // flush on navigation
  useEffect(() => {
    flush();
    const tool = Object.keys(TOOLS)
      .filter((t) => t !== "/")
      .sort((a, b) => b.length - a.length)
      .find((t) => location === t || location.startsWith(t + "/"));
    current.current = { tool: tool ?? "/", startedAt: Date.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // pause while hidden, flush on unload
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        flush();
      } else {
        current.current = { tool: current.current?.tool ?? "/", startedAt: Date.now() };
      }
    };
    const onUnload = () => {
      const c = current.current;
      if (!c) return;
      const evt = makeVisit(c.tool, Math.round((Date.now() - c.startedAt) / 60000), c.startedAt);
      if (!evt) return;
      try {
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify([...readActivityLog(), evt].slice(-500)));
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      mounted.current = false;
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  return null;
}
