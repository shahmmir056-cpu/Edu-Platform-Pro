export type DebateMode = "debate" | "teacher" | "viva" | "interview";

export type InterviewStyle = "hr" | "technical" | "behavioral";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface DebateState {
  mode: DebateMode;
  topic: string;
  messages: ChatMessage[];
  isAiTyping: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  score: DebateScore | null;
  currentQuestionIndex: number;
  interviewStyle?: InterviewStyle;
}

export interface DebateScore {
  overall: number;
  confidence: number;
  communication: number;
  grammar: number;
  criticalThinking: number;
  debatePerformance: number;
  feedback: string[];
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
}

export interface DashboardData {
  overallScore: number;
  speakingConfidence: number;
  communicationScore: number;
  grammarScore: number;
  criticalThinkingScore: number;
  debatePerformance: number;
  learningProgress: number;
  dailyStreak: number;
  totalSessions: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
  recentActivity: { date: string; mode: string; score: number }[];
}
