export type LearningStyle = "visual" | "audio" | "practical" | "reading-writing";

export interface Subject {
  name: string;
  strength: number; // 1 = weak, 5 = strong
  examDate?: string; // ISO yyyy-mm-dd
}

export interface LifeProfile {
  name: string;
  age: number;
  grade: string;
  country: string;
  timezone: string;
  avatarUrl?: string;
  schoolStart: string; // "07:30"
  schoolEnd: string;
  hasCoaching: boolean;
  coachingStart?: string;
  coachingEnd?: string;
  coachingDays?: string[]; // weekday names e.g. ["Mon","Wed"]
  hasPrayer: boolean;
  wakeTime: string;
  sleepTime: string;
  travelMin: number;
  studyGoal: number; // target percentage 0-100
  subjects: Subject[];
  learningSpeed: "slow" | "medium" | "fast";
  stressLevel: number; // 1-5
  energyLevel: number; // 1-5
  studyBlockMin: number; // focus session length
  breakMin: number;
  codingDaily: boolean;
  exerciseDaily: boolean;
  languageDaily: boolean;
  readingDaily: boolean;
  weekendStudy: boolean;
  screenTimeHrs: number;
  phoneDistraction: number; // 1-5
  hasInternet: boolean;
  hasLaptop: boolean;
  learningStyle: LearningStyle;
}

export type BlockType =
  | "wake"
  | "meal"
  | "school"
  | "coaching"
  | "travel"
  | "study"
  | "break"
  | "review"
  | "mission"
  | "exercise"
  | "prayer"
  | "leisure"
  | "sleep";

export type BlockStatus = "pending" | "done" | "skipped" | "adapted";

export type BrainLoad = "high" | "medium" | "low";

export interface RoutineBlock {
  id: string;
  startMin: number; // minutes from midnight
  endMin: number;
  type: BlockType;
  subject?: string;
  objective: string;
  focus: "deep" | "light";
  retention: number; // 0-100
  priority: number; // 1-5
  difficulty: number; // 1-5
  reward: string;
  energy: number; // 0-100 predicted energy at start
  brainLoad: BrainLoad;
  color: string;
  status: BlockStatus;
  xp: number;
}

export interface FocusSession {
  id: string;
  date: string; // yyyy-mm-dd
  subject?: string;
  start: number; // epoch ms
  end?: number;
  plannedMin: number;
  focusScore: number; // 0-100
  deepWorkMin: number;
  consistency: number; // 0-100
  distractions: number; // tab switches / idle events
  completed: boolean;
}

export type EmergencyPreset =
  | "exam-tomorrow"
  | "exam-3days"
  | "2-hours"
  | "tired"
  | "sick"
  | "no-internet"
  | "travel";

export type BadgeId =
  | "first-routine"
  | "streak-3"
  | "streak-7"
  | "focus-80"
  | "focus-95"
  | "exam-mode"
  | "retention-1"
  | "retention-master"
  | "perfect-day"
  | "coach-confidant"
  | "future-self"
  | "emergency-survivor"
  | "level-5"
  | "level-10"
  | "week-3"
  | "early-bird";

export interface Badge {
  id: BadgeId;
  name: string;
  desc: string;
  icon: string;
  earnedAt?: string;
}

export type TrophyId =
  | "first-sync"
  | "perfect-day"
  | "streak-3"
  | "streak-7"
  | "streak-30"
  | "level-5"
  | "level-10"
  | "study-10h"
  | "study-50h"
  | "study-100h"
  | "mission-clear"
  | "memory-master"
  | "zen-focus";

export interface Trophy {
  id: TrophyId;
  earnedAt?: string; // ISO timestamp when earned (real achievement proof)
}

export interface Gamification {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string;
  badges: Badge[];
  trophies: Trophy[];
  theme: "dark" | "light";
  themeUserSet?: boolean;
}

export interface RetentionCard {
  id: string;
  subject: string;
  question: string;
  hint: string;
  nextReview: string; // yyyy-mm-dd
  interval: number; // days
  box: number; // 0-5 SM-2 box
  lastScore: number; // 0-100
  source: "quiz" | "analysis";
}

export interface WeeklyReport {
  weekStart: string; // yyyy-mm-dd
  weekEnd: string;
  completion: number; // 0-100
  focus: number; // 0-100
  xp: number;
  streak: number;
  topSubject: string;
  notes: string;
}

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  at: number;
}

export interface FutureSelfMessage {
  id: string;
  date: string; // yyyy-mm-dd
  text: string;
  fromAge: number;
  tag: string;
}

export interface DayStats {
  completion: number; // 0-100
  focus: number; // 0-100
  xp: number;
  studyMin: number;
}

/** A real activity event captured from any learning tool across the app. */
export interface ToolActivity {
  id: string;
  tool: string; // tool id, e.g. "math-solver"
  toolName: string;
  action: string; // "visit" | "solve" | "quiz-done" | "flashcard-reveal" | ...
  subject?: string;
  query?: string; // what the student asked for in the tool
  result?: string; // short summary of what the tool produced
  durationMin: number; // minutes spent (0 for instant actions)
  startedAt: number; // epoch ms
  date: string; // yyyy-mm-dd
  xp: number;
}

/** Daily report + reminder delivery settings (email). */
export interface DailyReportConfig {
  email: string; // recipient email, e.g. "student@example.com"
  time: string; // "HH:MM" — when the report fires each day
  enabled: boolean;
  remindersEnabled: boolean; // send a real motivational email when a study block starts
  lastSent: string; // yyyy-mm-dd of the last auto-fired report
}

export interface LifeOsState {
  profile: LifeProfile | null;
  routine: RoutineBlock[];
  routineDate: string; // yyyy-mm-dd routine was generated for
  focusSessions: FocusSession[];
  gamification: Gamification;
  retention: RetentionCard[];
  weeklyReports: WeeklyReport[];
  coachMessages: CoachMessage[];
  futureSelfMessages: FutureSelfMessage[];
  emergency: EmergencyPreset | null;
  dailyStats: Record<string, DayStats>;
  toolActivity: ToolActivity[];
  onboarded: boolean;
  dailyReport: DailyReportConfig;
}
