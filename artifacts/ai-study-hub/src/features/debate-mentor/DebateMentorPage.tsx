import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, BookOpen, GraduationCap, Briefcase, RotateCcw, Trophy, Sparkles, Mic, X, ChevronDown, Home } from "lucide-react";
import { NeuralAvatar } from "./components/NeuralAvatar";
import { VoiceWaveform } from "./components/VoiceWaveform";
import { ChatInterface } from "./components/ChatInterface";
import { ParticleBackground } from "./components/ParticleBackground";
import { useVoice } from "./hooks/useVoice";
import { sendDebateMessage, generateScore, API_TTS } from "./lib/api";
import type { ChatMessage, DebateMode, DebateScore, InterviewStyle } from "./types";

const MODES: { id: DebateMode; label: string; icon: typeof MessageSquare; desc: string; roleDesc: string; features: string[] }[] = [
  { id: "debate", label: "Debate", icon: MessageSquare, desc: "AI argues the opposite side", roleDesc: "I am your Debate Opponent. I will challenge every argument you make, point out fallacies, and push your reasoning to its limits. State your position and let's begin.", features: ["Opposing arguments", "Fallacy detection", "Score & feedback"] },
  { id: "teacher", label: "Teacher", icon: BookOpen, desc: "Step-by-step interactive learning", roleDesc: "I am your AI Teacher. I will explain concepts step-by-step, use real-world analogies, and check your understanding with mini quizzes. What topic would you like to explore?", features: ["Step-by-step", "Mini quizzes", "Adaptive depth"] },
  { id: "viva", label: "Viva", icon: GraduationCap, desc: "University oral exam simulation", roleDesc: "I am your Viva Examiner. I will ask questions one at a time, evaluate your answers on accuracy and depth, and guide you toward the correct understanding. Be prepared.", features: ["One Q at a time", "Hint system", "Performance report"] },
  { id: "interview", label: "Interview", icon: Briefcase, desc: "HR, technical, or behavioral prep", roleDesc: "I am your Interview Coach. I will simulate a real interview — asking follow-ups, probing weak spots, and giving you detailed feedback. Let's make you interview-ready.", features: ["HR / Technical / Behavioral", "Follow-up probes", "Detailed feedback"] },
];

const INTERVIEW_STYLES: { id: InterviewStyle; label: string }[] = [
  { id: "hr", label: "HR" },
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
];

const TOPIC_PLACEHOLDERS: Record<DebateMode, string> = {
  debate: "e.g. Social media does more harm than good",
  teacher: "e.g. Machine Learning basics",
  viva: "e.g. Data Structures and Algorithms",
  interview: "e.g. Senior Software Engineer at Google",
};

const TOPIC_LABELS: Record<DebateMode, string> = {
  debate: "What should we debate?",
  teacher: "What do you want to learn?",
  viva: "What subject is the viva on?",
  interview: "What role are you interviewing for?",
};

export default function DebateMentorPage() {
  const [mode, setMode] = useState<DebateMode>("debate");
  const [topic, setTopic] = useState("");
  const [topicActive, setTopicActive] = useState("");
  const [interviewStyle, setInterviewStyle] = useState<InterviewStyle | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [score, setScore] = useState<DebateScore | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const isAiTypingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const topicInputRef = useRef<HTMLInputElement>(null);

  const currentMode = MODES.find((m) => m.id === mode)!;

  const voice = useVoice({
    onTranscript: (text) => {
      if (sessionStarted && !isAiTypingRef.current) {
        handleSendRef.current?.(text);
      }
    },
    autoRestart: sessionStarted,
    ttsEndpoint: API_TTS,
  });

  const speakRef = useRef(voice.speak);
  speakRef.current = voice.speak;

  useEffect(() => {
    if (sessionStarted && messages.length === 0) {
      setTimeout(() => voice.startListening(), 800);
    }
  }, [sessionStarted]);

  const startSession = useCallback(() => {
    if (!topicActive.trim()) return;
    setSessionStarted(true);
    setMessages([]);
    setScore(null);
    setShowScore(false);
    messagesRef.current = [];
    isAiTypingRef.current = false;

    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: currentMode.roleDesc,
      timestamp: Date.now(),
    };
    messagesRef.current = [welcomeMsg];
    setMessages([welcomeMsg]);
    if (voice.isSupported) {
      setTimeout(() => voice.speak(currentMode.roleDesc), 500);
    }
  }, [topicActive, currentMode, voice]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isAiTypingRef.current) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    const updated = [...messagesRef.current, userMsg];
    messagesRef.current = updated;
    setMessages(updated);
    isAiTypingRef.current = true;
    setIsAiTyping(true);

    try {
      const reply = await sendDebateMessage(updated, mode, topicActive, interviewStyle ?? undefined);
      const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: Date.now() };
      const final = [...updated, aiMsg];
      messagesRef.current = final;
      setMessages(final);
      await speakRef.current(reply);
    } catch (err) {
      console.error("Debate mentor chat error:", err);
      const errMsg: ChatMessage = { id: `e-${Date.now()}`, role: "assistant", content: "I encountered an error. Please try again.", timestamp: Date.now() };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      isAiTypingRef.current = false;
      setIsAiTyping(false);
    }
  }, [mode, topicActive, interviewStyle]);

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  const handleGetScore = useCallback(async () => {
    voice.stopListening();
    setIsAiTyping(true);
    setShowScore(true);
    try {
      const s = await generateScore(messages, mode, topicActive);
      setScore(s);
    } catch (err) {
      console.error("Debate mentor score error:", err);
      setScore({
        overall: 65, confidence: 60, communication: 70, grammar: 65,
        criticalThinking: 60, debatePerformance: 65,
        feedback: ["Good effort! Keep practicing."],
        strongAreas: ["Engagement"], weakAreas: ["Needs more depth"],
        recommendations: ["Try supporting arguments with evidence"],
      });
    } finally {
      setIsAiTyping(false);
    }
  }, [messages, mode, topicActive, voice]);

  const handleReset = () => {
    voice.stopListening();
    voice.stopSpeaking();
    setMessages([]);
    setScore(null);
    setShowScore(false);
    setSessionStarted(false);
    messagesRef.current = [];
    isAiTypingRef.current = false;
  };

  const switchMode = (newMode: DebateMode) => {
    setMode(newMode);
    setShowModeMenu(false);
    if (sessionStarted) {
      handleReset();
    }
  };

  return (
    <div className="relative h-dvh flex flex-col overflow-hidden" style={{ background: "#FFF8F0" }}>
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full" style={{ width: 500, height: 500, top: "-5%", right: "-10%", background: "rgba(255,159,76,0.06)", filter: "blur(120px)" }} />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute rounded-full" style={{ width: 400, height: 400, bottom: "5%", left: "-8%", background: "rgba(255,212,168,0.05)", filter: "blur(100px)" }} />
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        {/* ═══ Top Bar ═══ */}
        <header className="lg-strong px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0 z-50" style={{ borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", flexWrap: "wrap" }}>
          <Link href="/" aria-label="Back to home"
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 lg-card">
            <Home size={16} style={{ color: "#E8852E" }} />
          </Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,159,76,0.12)", border: "2px solid #2D2D2D" }}>
            <span className="text-base">🤖</span>
          </div>

          {/* Mode tabs */}
          <div className="hidden md:flex overflow-x-auto flex-nowrap items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
            {MODES.map((m) => (
              <button key={m.id} onClick={() => switchMode(m.id)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: mode === m.id ? "linear-gradient(135deg, #FF9F4C, #E8852E)" : "transparent",
                  color: mode === m.id ? "#fff" : "#6B6B6B",
                }}>
                <m.icon size={12} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Mobile mode dropdown */}
          <div className="md:hidden relative">
            <button onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold lg-card">
              <currentMode.icon size={12} style={{ color: "#E8852E" }} />
              <span style={{ color: "#2D2D2D" }}>{currentMode.label}</span>
              <ChevronDown size={10} style={{ color: "#9A9A9A" }} />
            </button>
            <AnimatePresence>
              {showModeMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 mt-1 lg-panel p-1.5 z-50 min-w-[160px]">
                  {MODES.map((m) => (
                    <button key={m.id} onClick={() => switchMode(m.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-left transition-all"
                      style={{ background: mode === m.id ? "rgba(255,159,76,0.1)" : "transparent", color: mode === m.id ? "#E8852E" : "#6B6B6B" }}>
                      <m.icon size={12} /> {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* Topic inline */}
          {sessionStarted ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl lg-card max-w-xs">
              <currentMode.icon size={11} style={{ color: "#E8852E" }} />
              <span className="text-[11px] font-medium truncate" style={{ color: "#2D2D2D" }}>{topicActive}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0" style={{ background: "rgba(255,159,76,0.12)", color: "#E8852E" }}>
                {messages.length} msgs
              </span>
            </div>
          ) : null}

          {sessionStarted && (
            <button onClick={handleGetScore} disabled={isAiTyping || messages.length < 3}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 lg-card disabled:opacity-30">
              <Trophy size={12} style={{ color: "#E8852E" }} />
              <span className="hidden sm:inline" style={{ color: "#E8852E" }}>Score</span>
            </button>
          )}

          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all hover:scale-105 lg-card">
            <RotateCcw size={11} style={{ color: "#6B6B6B" }} />
          </button>
        </header>

        {/* ═══ Main Content ═══ */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left panel — fixed in place, scrolls internally if its content grows */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 overflow-y-auto max-h-[45vh] lg:max-h-none p-4 lg:p-5 flex flex-col items-center min-h-0"
            style={{ borderRight: "1.5px solid rgba(45,45,45,0.08)", borderBottom: "1.5px solid rgba(45,45,45,0.08)", background: "rgba(255,248,240,0.5)", backdropFilter: "blur(12px)" }}>

            {/* Avatar */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <NeuralAvatar isActive={true} isListening={voice.isListening} isSpeaking={voice.isSpeaking} size={110} />
            </motion.div>

            {/* Role label */}
            <div className="mt-4 mb-1 flex items-center gap-2">
              <currentMode.icon size={14} style={{ color: "#E8852E" }} />
              <span className="text-sm font-bold" style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}>
                {currentMode.label} {mode === "interview" && interviewStyle ? `· ${INTERVIEW_STYLES.find((s) => s.id === interviewStyle)?.label}` : ""}
              </span>
            </div>
            <p className="text-[10px] text-center max-w-[200px] leading-relaxed mb-3" style={{ color: "#9A9A9A" }}>
              {currentMode.desc}
            </p>

            {/* Waveform */}
            <VoiceWaveform isActive={voice.isListening || voice.isSpeaking} isListening={voice.isListening} isSpeaking={voice.isSpeaking}
              width={200} height={38} barCount={24} color="#E8852E" />

            {/* Status */}
            <p className="text-[11px] mt-2 font-medium" style={{ color: voice.isListening ? "#4CAF50" : voice.isSpeaking ? "#E8852E" : "#9A9A9A" }}>
              {voice.isListening ? "Listening..." : voice.isSpeaking ? "AI is speaking..." : sessionStarted ? "Mic paused" : "Ready"}
            </p>

            {/* Mode features */}
            <div className="mt-4 w-full">
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2 text-center" style={{ color: "#9A9A9A" }}>Features</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {currentMode.features.map((f) => (
                  <span key={f} className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(255,159,76,0.08)", color: "#E8852E", border: "1px solid rgba(255,159,76,0.15)" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Topic input (always visible) */}
            {!sessionStarted && (
              <div className="mt-4 w-full">
                <label className="text-[10px] font-semibold mb-1.5 block" style={{ color: "#6B6B6B" }}>{TOPIC_LABELS[mode]}</label>
                {mode === "interview" && (
                  <div className="flex gap-1 mb-2">
                    {INTERVIEW_STYLES.map((s) => (
                      <button key={s.id} onClick={() => setInterviewStyle(s.id)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
                        style={{
                          background: interviewStyle === s.id ? "rgba(255,159,76,0.12)" : "rgba(0,0,0,0.03)",
                          color: interviewStyle === s.id ? "#E8852E" : "#6B6B6B",
                          border: `1px solid ${interviewStyle === s.id ? "rgba(232,133,46,0.3)" : "rgba(0,0,0,0.06)"}`,
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <input ref={topicInputRef} value={topicActive} onChange={(e) => setTopicActive(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && topicActive.trim()) startSession(); }}
                  placeholder={TOPIC_PLACEHOLDERS[mode]}
                  className="w-full rounded-xl px-3 py-2.5 text-[11px] outline-none lg-subtle"
                  style={{ color: "#2D2D2D", fontFamily: "'Plus Jakarta Sans', sans-serif" }} autoFocus />
                <button onClick={startSession} disabled={!topicActive.trim()}
                  className="w-full mt-2 py-2.5 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.01] disabled:opacity-30 lg-button">
                  Start Session
                </button>
              </div>
            )}
          </div>

          {/* Chat / Score area — fills remaining space, only this panel scrolls */}
          <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {showScore && score ? (
                <motion.div key="score" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 z-20 overflow-y-auto" style={{ background: "#FFF8F0" }}>
                  <div className="max-w-2xl mx-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Trophy size={18} style={{ color: "#E8852E" }} />
                        <h2 className="text-lg font-bold" style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}>Session Score</h2>
                      </div>
                      <button onClick={() => setShowScore(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 lg-card">
                        <X size={14} style={{ color: "#6B6B6B" }} />
                      </button>
                    </div>

                    <ScoreDisplay score={score} mode={mode} topic={topicActive} />

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowScore(false)}
                        className="flex-1 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] lg-card">
                        <span style={{ color: "#E8852E" }}>Continue Chat</span>
                      </button>
                      <button onClick={handleReset}
                        className="flex-1 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] lg-button">
                        New Session
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <ChatInterface
              messages={messages}
              isAiTyping={isAiTyping}
              isListening={voice.isListening}
              isSpeaking={voice.isSpeaking}
              onSend={handleSend}
              onToggleMic={voice.isListening ? voice.stopListening : voice.startListening}
              onStopSpeaking={voice.stopSpeaking}
              transcript={voice.transcript}
              accentColor="#E8852E"
              placeholder={
                !sessionStarted ? "Start a session first..." :
                mode === "debate" ? "Make your argument..." :
                mode === "teacher" ? "Ask a question..." :
                mode === "viva" ? "Answer the question..." :
                "Respond to the interviewer..."
              }
              disabled={!sessionStarted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Score Display ═══ */
function ScoreDisplay({ score, mode, topic }: { score: DebateScore; mode: string; topic: string }) {
  const bars = [
    { label: "Overall", value: score.overall, color: "#FF9F4C" },
    { label: "Confidence", value: score.confidence, color: "#E8852E" },
    { label: "Communication", value: score.communication, color: "#FFB366" },
    { label: "Grammar", value: score.grammar, color: "#FFD4A8" },
    { label: "Critical Thinking", value: score.criticalThinking, color: "#D4853A" },
    { label: "Performance", value: score.debatePerformance, color: "#C47A2E" },
  ];

  return (
    <div>
      <p className="text-[11px] mb-6" style={{ color: "#9A9A9A" }}>{mode} · {topic}</p>

      <div className="space-y-3 mb-8">
        {bars.map((b, i) => (
          <motion.div key={b.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-medium" style={{ color: "#6B6B6B" }}>{b.label}</span>
              <span className="font-mono font-bold" style={{ color: "#E8852E" }}>{b.value}/100</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f0ebe5" }}>
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${b.color}cc, ${b.color})` }}
                initial={{ width: 0 }} animate={{ width: `${b.value}%` }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { title: "Strengths", items: score.strongAreas, color: "#E8852E", emoji: "✦" },
          { title: "Weak Areas", items: score.weakAreas, color: "#D4853A", emoji: "△" },
          { title: "Tips", items: score.recommendations, color: "#FFB366", emoji: "→" },
        ].map((section, i) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
            className="lg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: section.color }}>{section.emoji}</span>
              <h4 className="text-[11px] font-bold" style={{ color: section.color }}>{section.title}</h4>
            </div>
            <ul className="space-y-1">
              {section.items.map((item, j) => (
                <li key={j} className="text-[10px] leading-relaxed" style={{ color: "#6B6B6B" }}>{item}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {score.feedback.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="rounded-xl p-4" style={{ background: "rgba(255,159,76,0.06)", border: "1.5px solid rgba(255,159,76,0.20)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: "#E8852E" }} />
            <h4 className="text-[11px] font-bold" style={{ color: "#E8852E" }}>AI Feedback</h4>
          </div>
          {score.feedback.map((f, i) => (
            <p key={i} className="text-[11px] leading-relaxed mb-0.5" style={{ color: "#6B6B6B" }}>{f}</p>
          ))}
        </motion.div>
      )}
    </div>
  );
}
