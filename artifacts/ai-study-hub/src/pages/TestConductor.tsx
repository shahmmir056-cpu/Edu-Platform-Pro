import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Timer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Send,
  Brain,
  Star,
  Sparkles,
  Bot,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { validatePromptText } from "@workspace/api-client-react";
import { trackAction } from "@/features/life-os/tracker";
import { cn } from "@/lib/utils";

type TestPhase = "chat" | "taking" | "results";
type TestCategory = "mcq" | "true-false" | "fill-blank" | "short-answer" | "essay" | "speed";
type Difficulty = "Easy" | "Medium" | "Hard";

interface QuestionResult {
  questionIndex: number;
  userAnswer: string | number | boolean | null;
  correct: boolean;
  points: number;
}

interface TestConfig {
  type: TestCategory;
  classNumber: number;
  subject: string;
  topic: string;
  numQuestions: number;
  difficulty: Difficulty;
  timerMinutes: number;
}

type DraftConfig = Partial<Pick<TestConfig, "classNumber" | "subject" | "topic" | "type" | "numQuestions" | "difficulty">>;

interface ChatMsg {
  id: string;
  role: "bot" | "user";
  text: string;
}

type ThinkingState = "idle" | "typing" | "generating";

const SUGGESTED_PROMPTS = [
  "Class 10 Physics, Electricity, MCQ test",
  "Class 5 Science, plants, true or false",
  "Class 7 English, grammar, 10 short answer questions",
  "Class 12 Chemistry, organic chemistry, hard MCQ",
  "Class 8 History, the Mughal Empire, essay test",
];

let _id = 0;
const uid = () => `tc${Date.now()}_${_id++}`;

function mergeDraft(draft: DraftConfig, incoming: DraftConfig): DraftConfig {
  const out: DraftConfig = { ...draft };
  if (incoming.classNumber != null) out.classNumber = incoming.classNumber;
  if (incoming.subject != null && incoming.subject.trim()) out.subject = incoming.subject.trim();
  if (incoming.topic != null && incoming.topic.trim()) out.topic = incoming.topic.trim();
  if (incoming.type != null) out.type = incoming.type;
  if (incoming.numQuestions != null) out.numQuestions = incoming.numQuestions;
  if (incoming.difficulty != null) out.difficulty = incoming.difficulty;
  return out;
}

function getGrade(pct: number): string {
  if (pct >= 95) return "A+";
  if (pct >= 90) return "A";
  if (pct >= 85) return "B+";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C+";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };

export default function TestConductor() {
  const [phase, setPhase] = useState<TestPhase>("chat");
  const [config, setConfig] = useState<TestConfig>({
    type: "mcq",
    classNumber: 10,
    subject: "Physics",
    topic: "Electricity",
    numQuestions: 10,
    difficulty: "Medium",
    timerMinutes: 0,
  });
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(string | number | boolean | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (phase !== "taking" || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "taking" && config.timerMinutes > 0 && timeLeft === 0 && questions.length > 0) {
      handleSubmit();
    }
  }, [timeLeft, phase]);

  const beginTest = (cfg: TestConfig, gen: { title?: string; questions: any[] }) => {
    const qs = Array.isArray(gen.questions) ? gen.questions : [];
    setConfig(cfg);
    setTestTitle(gen.title || `${cfg.subject} — ${cfg.topic}`);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIdx(0);
    setResults([]);
    setScore(0);
    setTimeLeft(0);
    setPhase("taking");
  };

  const generateTest = async (cfg: TestConfig) => {
    const res = await fetch("/api/test-conductor/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: cfg }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `Request failed (HTTP ${res.status})`);
    }
    beginTest(cfg, data as { title?: string; questions: any[] });
  };

  const handleSubmit = () => {
    const res: QuestionResult[] = questions.map((q, i) => {
      const ans = answers[i];
      let correct = false;
      let points = 0;

      if (config.type === "mcq" || config.type === "speed") {
        correct = ans === q.correct;
        points = correct ? 10 : 0;
      } else if (config.type === "true-false") {
        correct = ans === q.c;
        points = correct ? 10 : 0;
      } else if (config.type === "fill-blank") {
        const userAns = String(ans || "").toLowerCase().trim();
        correct = userAns.length > 0 && q.kw.some((k: string) => userAns.includes(k.toLowerCase()));
        points = correct ? 10 : 0;
      } else if (config.type === "short-answer") {
        const userAns = String(ans || "").toLowerCase().trim();
        correct = userAns.length > 0 && q.kw.some((k: string) => userAns.includes(k.toLowerCase()));
        points = correct ? 10 : 0;
      } else {
        const userAns = String(ans || "").trim();
        const hasKw = (q.kw || []).some((k: string) => userAns.toLowerCase().includes(k.toLowerCase()));
        correct = userAns.length >= 40 || hasKw;
        points = correct ? 10 : 0;
      }
      return { questionIndex: i, userAnswer: ans, correct, points };
    });
    setResults(res);
    setScore(res.reduce((s, r) => s + r.points, 0));
    setPhase("results");
    const correctCount = res.filter((r) => r.correct).length;
    trackAction("/test-conductor", "test-done", config.topic, 1, config.subject, `${correctCount}/${questions.length} correct`);
  };

  const setAnswer = (ans: string | number | boolean | null) => {
    setAnswers((prev) => { const n = [...prev]; n[currentIdx] = ans; return n; });
  };

  const pct = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 min-h-[calc(100vh-4rem)]">
      <ToolHeader title="Test Conductor" description="Chat with the AI and it will build you a personalized test in seconds." icon={ClipboardCheck} />
      <AnimatePresence mode="wait">
        {phase === "chat" && (
          <ChatPanel key="chat" onGenerate={generateTest} />
        )}
        {phase === "taking" && (
          <Taking key="taking" config={config} title={testTitle} questions={questions} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}
            answers={answers} setAnswer={setAnswer} timeLeft={timeLeft} onSubmit={handleSubmit} />
        )}
        {phase === "results" && (
          <Results key="results" score={score} total={questions.length} results={results} questions={questions}
            config={config} title={testTitle} pct={pct}
            onRetake={() => generateTest(config)}
            onHub={() => { setPhase("chat"); setResults([]); setScore(0); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatPanel({ onGenerate }: {
  onGenerate: (cfg: TestConfig) => Promise<void>;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: uid(),
      role: "bot",
      text:
        "Hi! I'm your AI Test Conductor. Tell me your class, subject, topic, and what kind of test you'd like — for example: " +
        "\u201CClass 10 Physics, Electricity, MCQ test\u201D.",
    },
  ]);
  const [draft, setDraft] = useState<DraftConfig>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<ThinkingState>("idle");
  const [showChips, setShowChips] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || thinking !== "idle") return;
    const gibberish = validatePromptText(text);
    if (gibberish) {
      setThinking("idle");
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", text: gibberish },
      ]);
      return;
    }
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
    setShowChips(false);
    setInput("");
    setThinking("typing");

    try {
      const planRes = await fetch("/api/test-conductor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, collected: draft }),
      });
      const plan = await planRes.json().catch(() => ({}));
      if (!planRes.ok) {
        throw new Error((plan as { error?: string }).error ?? `Request failed (HTTP ${planRes.status})`);
      }

      const planConfig = (plan as any).config ?? {};
      const merged = mergeDraft(draft, {
        classNumber: planConfig.classNumber,
        subject: planConfig.subject,
        topic: planConfig.topic,
        type: planConfig.testType,
        numQuestions: planConfig.numQuestions,
        difficulty: planConfig.difficulty,
      });
      setDraft(merged);
      setMessages((prev) => [...prev, { id: uid(), role: "bot", text: (plan as any).reply || "Got it." }]);

      if ((plan as any).status === "ready" && (plan as any).ready) {
        const cfg: TestConfig = {
          type: merged.type ?? "mcq",
          classNumber: merged.classNumber ?? 10,
          subject: merged.subject ?? "",
          topic: merged.topic ?? "",
          numQuestions: merged.numQuestions ?? 10,
          difficulty: merged.difficulty ?? "Medium",
          timerMinutes: 0,
        };
        setThinking("generating");
        const gen = await onGenerate(cfg);
        return gen;
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text:
            "Sorry, something went wrong. " +
            (err instanceof Error ? err.message : "Please try again."),
        },
      ]);
    } finally {
      setThinking("idle");
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp}
      className="mt-4 rounded-3xl overflow-hidden flex flex-col"
      style={{ background: "rgba(255,255,255,0.55)", border: "2px solid rgba(0,0,0,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 8px 32px rgba(0,0,0,0.06)" }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.12), rgba(255,159,76,0.04))", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
          <Bot size={20} />
        </div>
        <div className="min-w-0">
          <p className="font-serif font-bold text-foreground text-sm leading-tight">AI Test Conductor</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#6B6B6B" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Online · Generates personalized tests
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>
          <Sparkles size={14} /> AI Powered
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" style={{ minHeight: 380, maxHeight: "calc(100vh - 26rem)" }}>
        {messages.map((m) => (
          <div key={m.id} className={cn("flex items-end gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "bot" && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
                <Brain size={16} />
              </div>
            )}
            <div className={cn("max-w-[80%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed rounded-2xl",
              m.role === "user"
                ? "text-white rounded-br-sm shadow-md"
                : "text-foreground rounded-bl-sm")
            }
              style={m.role === "user" ? { background: "linear-gradient(135deg, #FF9F4C, #E8852E)" } : { background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              {m.text}
            </div>
          </div>
        ))}

        {thinking === "typing" && (
          <div className="flex items-end gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
              <Brain size={16} />
            </div>
            <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="w-2 h-2 rounded-full" style={{ background: "#FF9F4C" }}
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </div>
          </div>
        )}

        {thinking === "generating" && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl rounded-bl-sm w-fit"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
            <motion.div className="w-4 h-4 rounded-full border-2 border-transparent" style={{ borderTopColor: "#FF9F4C" }}
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
            <span className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Writing your test...</span>
          </div>
        )}
      </div>

      {/* Suggested chips */}
      {showChips && thinking === "idle" && (
        <div className="px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} onClick={() => sendMessage(p)}
              className="shrink-0 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "rgba(255,159,76,0.08)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.25)" }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 sm:px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-end gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder='e.g. "Class 8 Math, algebra, 10 MCQs"'
            className="flex-1 border-2 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all focus:border-[#FF9F4C]"
            style={{ background: "#FFFFFF", color: "#2D2D2D", borderColor: "rgba(0,0,0,0.08)" }}
            disabled={thinking !== "idle"}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || thinking !== "idle"}
            className="px-4 py-3.5 rounded-2xl text-white shadow-md flex items-center gap-2 font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
            <Send size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Taking({ config, title, questions, currentIdx, setCurrentIdx, answers, setAnswer, timeLeft, onSubmit }: {
  config: TestConfig; title: string; questions: any[]; currentIdx: number; setCurrentIdx: (n: number) => void;
  answers: (string | number | boolean | null)[]; setAnswer: (a: string | number | boolean | null) => void;
  timeLeft: number; onSubmit: () => void;
}) {
  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const answered = answers.filter((a) => a !== null).length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>{title}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>Class {config.classNumber}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>{config.subject} · {config.topic}</span>
            <span className="text-sm font-bold text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {config.timerMinutes > 0 && (
              <span className={cn("flex items-center gap-1.5 text-sm font-mono font-bold", timeLeft < 60 ? "text-destructive" : "text-muted-foreground")}>
                <Timer size={14} /> {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-sm" style={{ color: "#6B6B6B" }}>{answered}/{questions.length} answered</span>
          </div>
        </div>
        <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: "#FF9F4C" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl p-4 sm:p-6 md:p-8 mb-6" style={{ background: "rgba(255,255,255,0.5)", border: "2px solid rgba(0,0,0,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <p className="text-xl font-serif font-bold text-foreground mb-8">
            {(config.type === "mcq" || config.type === "speed") && q.q}
            {config.type === "true-false" && q.s}
            {config.type === "fill-blank" && q.s}
            {config.type === "short-answer" && (q.q || q.s)}
            {config.type === "essay" && q.q}
          </p>

          {(config.type === "mcq" || config.type === "speed") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.opts.map((opt: string, i: number) => (
                <button key={i} onClick={() => setAnswer(i)}
                  className={cn("p-4 rounded-xl border-2 text-left font-medium transition-all duration-200",
                    answers[currentIdx] === i ? "shadow-md" : "bg-white/[0.5] hover:border-black/[0.15]")}
                  style={answers[currentIdx] === i ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C", color: "#2D2D2D" } : { borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
                  <span className="font-mono text-sm mr-2" style={{ color: "#6B6B6B" }}>{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          )}

          {config.type === "true-false" && (
            <div className="flex flex-col sm:flex-row gap-4">
              {[true, false].map((val) => (
                <button key={String(val)} onClick={() => setAnswer(val)}
                  className={cn("flex-1 py-5 rounded-xl border-2 text-lg font-bold transition-all duration-200",
                    answers[currentIdx] === val ? "shadow-md" : "bg-white/[0.5] hover:border-black/[0.15]")}
                  style={answers[currentIdx] === val ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C", color: "#2D2D2D" } : { borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
                  {val ? "True" : "False"}
                </button>
              ))}
            </div>
          )}

          {(config.type === "fill-blank" || config.type === "short-answer") && (
            <input type="text" value={String(answers[currentIdx] || "")} onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full border-2 rounded-xl p-4 text-lg outline-none transition-all"
              style={{ background: "#FFFFFF", color: "#2D2D2D", borderColor: "rgba(0,0,0,0.08)" }} />
          )}

          {config.type === "essay" && (
            <textarea value={String(answers[currentIdx] || "")} onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your essay response here..."
              className="w-full border-2 rounded-xl p-4 min-h-[200px] text-lg outline-none transition-all resize-none"
              style={{ background: "#FFFFFF", color: "#2D2D2D", borderColor: "rgba(0,0,0,0.08)" }} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
          className="px-5 py-2.5 border-2 bg-white/[0.5] hover:bg-white/[0.7] rounded-xl font-bold disabled:opacity-30 transition-all flex items-center gap-1"
          style={{ borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-1.5 overflow-x-auto max-w-[80vw] sm:max-w-none py-1">
          {questions.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={cn("w-2.5 h-2.5 rounded-full transition-all shrink-0",
                i === currentIdx ? "scale-125" : answers[i] !== null ? "opacity-60" : "")}
              style={i === currentIdx ? { background: "#FF9F4C" } : answers[i] !== null ? { background: "#FF9F4C", opacity: 0.4 } : { background: "#D1D5DB" }} />
          ))}
        </div>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-5 py-2.5 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-md"
            style={{ background: "#FF9F4C" }}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={onSubmit} className="px-6 py-2.5 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-md"
            style={{ background: "#FF9F4C" }}>
            Submit <Send size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Results({ score, total, results, questions, config, title, pct, onRetake, onHub }: {
  score: number; total: number; results: QuestionResult[]; questions: any[]; config: TestConfig;
  title: string; pct: number; onRetake: () => void; onHub: () => void;
}) {
  const grade = getGrade(pct);
  const correct = results.filter((r) => r.correct).length;
  const wrong = total - correct;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="text-center mb-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(255,159,76,0.1)" }}>
          <Trophy size={48} style={{ color: "#FF9F4C" }} />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-4xl font-serif font-bold text-foreground mb-2">Test Complete!</motion.h2>
        <p className="text-sm font-bold" style={{ color: "#FF9F4C" }}>{title} · Class {config.classNumber} · {config.subject}</p>

        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="flex items-center justify-center gap-6 my-8">
          <div className="text-center">
            <p className="text-5xl font-mono font-bold" style={{ color: "#FF9F4C" }}>{pct}%</p>
            <p className="text-sm uppercase tracking-wider mt-1" style={{ color: "#6B6B6B" }}>Score</p>
          </div>
          <div className="w-px h-16" style={{ background: "rgba(0,0,0,0.1)" }} />
          <div className="text-center">
            <p className="text-5xl font-serif font-bold" style={{ color: "#FF9F4C" }}>{grade}</p>
            <p className="text-sm uppercase tracking-wider mt-1" style={{ color: "#6B6B6B" }}>Grade</p>
          </div>
        </motion.div>

        <div className="flex justify-center gap-4 sm:gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18} /> {correct} Correct</div>
          <div className="flex items-center gap-2 text-destructive"><XCircle size={18} /> {wrong} Wrong</div>
          <div className="flex items-center gap-1" style={{ color: "#6B6B6B" }}><Star size={16} /> {score}/{total * 10} pts</div>
        </div>
      </div>

      <div className="space-y-3 mb-10">
        <h3 className="font-serif font-bold text-lg text-foreground mb-4">Question Review</h3>
        {results.map((r, i) => {
          const q = questions[i];
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={cn("p-4 rounded-xl border-2", r.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
              <div className="flex items-start gap-3">
                {r.correct ? <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" /> : <XCircle size={18} className="text-destructive mt-0.5 shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {q.q || q.s || q.question}
                  </p>
                  {(config.type === "mcq" || config.type === "speed") && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {r.userAnswer !== null ? q.opts[r.userAnswer as number] : "Unanswered"} {r.correct ? "" : `— Correct: ${q.opts[q.correct]}`}
                    </p>
                  )}
                  {config.type === "true-false" && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {r.userAnswer !== null ? String(r.userAnswer) : "Unanswered"} {r.correct ? "" : `— Correct: ${q.c}`}
                    </p>
                  )}
                  {(config.type === "fill-blank" || config.type === "short-answer") && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {String(r.userAnswer || "Unanswered")} — Expected: {q.a}
                    </p>
                  )}
                  {q.exp && <p className="text-xs mt-1 italic" style={{ color: "#6B6B6B" }}>{q.exp}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pb-16">
        <button onClick={onRetake} className="px-6 py-3 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
          <RotateCcw size={16} /> New Test
        </button>
        <button onClick={onHub} className="px-6 py-3 border-2 bg-white/[0.5] hover:bg-white/[0.7] font-bold text-foreground rounded-2xl transition-colors"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          Back to Chat
        </button>
      </div>
    </motion.div>
  );
}
