import type { LifeOsState, LifeProfile } from "./types";
import { DEFAULT_GAMIFICATION, todayKey } from "./engine";

const KEY = "neural-sync-life-os-v1";

/** Default recipient for the daily report and study-time reminder emails. */
export const DEFAULT_REPORT_EMAIL = "";

export const DEFAULT_STATE: LifeOsState = {
  profile: null,
  routine: [],
  routineDate: "",
  focusSessions: [],
  gamification: DEFAULT_GAMIFICATION,
  retention: [],
  weeklyReports: [],
  coachMessages: [],
  futureSelfMessages: [],
  emergency: null,
  dailyStats: {},
  toolActivity: [],
  onboarded: false,
  dailyReport: { email: DEFAULT_REPORT_EMAIL, time: "20:00", enabled: false, remindersEnabled: false, lastSent: "" },
};

export function loadState(): LifeOsState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE, gamification: { ...DEFAULT_GAMIFICATION } };
    const parsed = JSON.parse(raw) as Partial<LifeOsState>;
    // migration: default to the site's cream/orange light theme unless the
    // student explicitly chose a theme before
    const themeUserSet = parsed.gamification?.themeUserSet ?? false;
    const theme = themeUserSet ? (parsed.gamification?.theme ?? "light") : "light";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      gamification: { ...DEFAULT_GAMIFICATION, ...(parsed.gamification || {}), theme, themeUserSet },
      dailyStats: parsed.dailyStats || {},
      focusSessions: parsed.focusSessions || [],
      retention: parsed.retention || [],
      weeklyReports: parsed.weeklyReports || [],
      coachMessages: parsed.coachMessages || [],
      futureSelfMessages: parsed.futureSelfMessages || [],
      toolActivity: parsed.toolActivity || [],
      routine: parsed.routine || [],
      profile: parsed.profile || null,
      dailyReport: (() => {
        const old = (parsed.dailyReport || {}) as {
          email?: string;
          number?: string;
          time?: string;
          enabled?: boolean;
          remindersEnabled?: boolean;
          lastSent?: string;
        };
        return {
          email: old.email || old.number || DEFAULT_REPORT_EMAIL,
          time: old.time || "20:00",
          enabled: old.enabled ?? false,
          remindersEnabled: old.remindersEnabled ?? false,
          lastSent: old.lastSent || "",
        };
      })(),
    };
  } catch {
    return { ...DEFAULT_STATE, gamification: { ...DEFAULT_GAMIFICATION } };
  }
}

export function saveState(state: LifeOsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — ignore
  }
}

export const STATE_KEY = KEY;
export const ACTIVITY_KEY = "neural-sync-life-os-activity-v1";

/** A brand-new account: everything reset so the user starts from onboarding. */
export function freshState(): LifeOsState {
  return { ...DEFAULT_STATE, gamification: { ...DEFAULT_GAMIFICATION } };
}

export const defaultProfile = (): LifeProfile => ({
  name: "",
  age: 15,
  grade: "10",
  country: "",
  timezone: "",
  schoolStart: "07:30",
  schoolEnd: "14:00",
  hasCoaching: false,
  coachingStart: "16:00",
  coachingEnd: "17:30",
  coachingDays: ["Mon", "Wed", "Fri"],
  hasPrayer: false,
  wakeTime: "06:00",
  sleepTime: "22:00",
  travelMin: 20,
  studyGoal: 90,
  subjects: [],
  learningSpeed: "medium",
  stressLevel: 2,
  energyLevel: 3,
  studyBlockMin: 25,
  breakMin: 5,
  codingDaily: false,
  exerciseDaily: true,
  languageDaily: false,
  readingDaily: true,
  weekendStudy: true,
  screenTimeHrs: 4,
  phoneDistraction: 2,
  hasInternet: true,
  hasLaptop: true,
  learningStyle: "visual",
});

export const today = todayKey;
