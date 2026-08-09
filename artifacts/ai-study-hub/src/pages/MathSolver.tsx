import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSolveMath } from "@workspace/api-client-react";
import {
  Sigma,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  LineChart as LineChartIcon,
  Variable,
  Calculator,
  Table2,
  Grid3x3,
  BookOpen,
  History,
  Trash2,
  Eraser,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { LoadingState, ErrorState } from "@/components/ui/LoadingState";
import { CopyButton } from "@/components/math/shared";
import GraphCalculator from "@/components/math/GraphCalculator";
import EquationSolver from "@/components/math/EquationSolver";
import ScientificCalculator from "@/components/math/ScientificCalculator";
import StatisticsAnalyzer from "@/components/math/StatisticsAnalyzer";
import MatrixCalculator from "@/components/math/MatrixCalculator";
import FormulaReference from "@/components/math/FormulaReference";
import { trackAction } from "@/features/life-os/tracker";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Solve for x: 3x + 7 = 22",
  "Find the derivative of 4x^3 - 2x + 5",
  "Simplify: (2x^2y)(3xy^3)",
  "What is the area of a circle with radius 7?",
  "Solve the system: x + y = 10, x - y = 4",
];

const EXAMPLE_TINTS = [
  "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-500/20",
  "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 border border-indigo-500/20",
  "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 border border-cyan-500/20",
  "bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 border border-orange-500/20",
  "bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 border border-sky-500/20",
];

const FLOATING_SYMBOLS: { char: string; top?: string; left?: string; right?: string; bottom?: string; size: string; delay: number }[] = [
  { char: "Σ", top: "8%", left: "5%", size: "text-5xl", delay: 0 },
  { char: "π", top: "20%", right: "8%", size: "text-4xl", delay: 1.5 },
  { char: "∫", bottom: "15%", left: "10%", size: "text-6xl", delay: 0.8 },
  { char: "√", bottom: "25%", right: "12%", size: "text-4xl", delay: 2 },
  { char: "∞", top: "50%", left: "3%", size: "text-3xl", delay: 3 },
  { char: "Δ", top: "35%", right: "4%", size: "text-5xl", delay: 1 },
];

const SYMBOL_KEYS: { label: string; insert: string }[] = [
  { label: "x²", insert: "^2" },
  { label: "x³", insert: "^3" },
  { label: "xⁿ", insert: "^n" },
  { label: "√", insert: "sqrt(" },
  { label: "π", insert: "pi" },
  { label: "e", insert: "e" },
  { label: "^", insert: "^" },
  { label: "±", insert: "+-" },
  { label: "÷", insert: "/" },
  { label: "×", insert: "*" },
  { label: "|x|", insert: "abs(" },
  { label: "≤", insert: "<=" },
  { label: "≥", insert: ">=" },
  { label: "≠", insert: "!=" },
  { label: "%", insert: "%" },
  { label: "∫", insert: "integrate " },
  { label: "Σ", insert: "sum of " },
  { label: "Δ", insert: "delta" },
  { label: "∞", insert: "infinity" },
  { label: "θ", insert: "theta" },
  { label: "sin(", insert: "sin(" },
  { label: "cos(", insert: "cos(" },
  { label: "tan(", insert: "tan(" },
  { label: "log(", insert: "log(" },
  { label: "ln(", insert: "ln(" },
];

const HISTORY_KEY = "math-solver-history";

interface HistoryEntry {
  problem: string;
  topic: string;
  finalAnswer: string;
  ts: number;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persistHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 12)));
  } catch {
    /* ignore quota errors */
  }
}

function SymbolKeyboard({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
      {SYMBOL_KEYS.map((key) => (
        <button
          type="button"
          key={key.label}
          onClick={() => onInsert(key.insert)}
          className="px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 border border-black/10"
          style={{
            background: "rgba(255,159,76,0.08)",
            color: "#B45309",
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

function HistoryPanel({
  entries,
  onOpen,
  onDelete,
  onClear,
}: {
  entries: HistoryEntry[];
  onOpen: (problem: string) => void;
  onDelete: (ts: number) => void;
  onClear: () => void;
}) {
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-5 backdrop-blur-xl mt-6"
      style={{
        background: "rgba(255,255,255,0.5)",
        border: "1.5px solid rgba(255,255,255,0.72)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: "#2D2D2D" }}>
            Recent Problems
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
        >
          <Eraser size={14} />
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.ts}
            className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-primary/10 border border-black/10"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <button
              type="button"
              onClick={() => onOpen(entry.problem)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="font-mono text-sm truncate" style={{ color: "#2D2D2D" }}>
                {entry.problem}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9A9A9A" }}>
                {entry.topic} · {new Date(entry.ts).toLocaleDateString()}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onOpen(entry.problem)}
              className="hidden sm:inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Solve again
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry.ts)}
              aria-label="Delete"
              className="shrink-0 p-1.5 rounded-lg text-[#9A9A9A] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

type Tab = "solver" | "graph" | "equations" | "calc" | "stats" | "matrix" | "formulas";

const TABS: { id: Tab; label: string; icon: typeof Sigma }[] = [
  { id: "solver", label: "AI Solver", icon: Sigma },
  { id: "graph", label: "Graphing", icon: LineChartIcon },
  { id: "equations", label: "Equations", icon: Variable },
  { id: "calc", label: "Calculator", icon: Calculator },
  { id: "stats", label: "Statistics", icon: Table2 },
  { id: "matrix", label: "Matrices", icon: Grid3x3 },
  { id: "formulas", label: "Formulas", icon: BookOpen },
];

export default function MathSolver() {
  const [problem, setProblem] = useState("");
  const [tab, setTab] = useState<Tab>("solver");
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const solveMath = useSolveMath();
  const solution = solveMath.data;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (solution) {
      const entry: HistoryEntry = {
        problem,
        topic: solution.topic,
        finalAnswer: solution.finalAnswer,
        ts: Date.now(),
      };
      const next = [entry, ...loadHistory().filter((h) => h.problem !== problem)].slice(0, 12);
      persistHistory(next);
      setHistory(next);
      trackAction("/math-solver", "solve", undefined, 1, problem.trim(), solution.finalAnswer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solution]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!problem.trim()) return;
    solveMath.mutate({ data: { problem } });
  };

  const reset = () => {
    solveMath.reset();
    setProblem("");
  };

  const insertSymbol = (text: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? problem.length;
    const end = el?.selectionEnd ?? problem.length;
    const next = problem.slice(0, start) + text + problem.slice(end);
    setProblem(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + text.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const openFromHistory = (prob: string) => {
    setTab("solver");
    setProblem(prob);
    solveMath.reset();
    setTimeout(() => solveMath.mutate({ data: { problem: prob } }), 50);
  };

  const deleteFromHistory = (ts: number) => {
    const next = loadHistory().filter((h) => h.ts !== ts);
    persistHistory(next);
    setHistory(next);
  };

  const clearHistory = () => {
    persistHistory([]);
    setHistory([]);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <style>{`
        @keyframes floatSymbol {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-18px) rotate(8deg); opacity: 0.22; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,159,76,0.15), 0 0 60px rgba(255,212,168,0.06); }
          50% { box-shadow: 0 0 30px rgba(255,159,76,0.2), 0 0 80px rgba(255,212,168,0.1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,159,76,0.3); }
          70% { box-shadow: 0 0 0 10px rgba(255,159,76,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,159,76,0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .float-symbol {
          animation: floatSymbol 6s ease-in-out infinite;
          pointer-events: none;
          user-select: none;
        }
        .form-glow {
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .shimmer-hover:hover {
          background-image: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255,255,255,0.25) 40%,
            rgba(255,255,255,0.35) 50%,
            rgba(255,255,255,0.25) 60%,
            transparent 80%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .grid-pattern {
          background-image:
            linear-gradient(rgba(255,159,76,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,159,76,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 12s linear infinite;
        }
        .input-ring:focus {
          animation: ringPulse 1.2s ease-out;
          box-shadow: 0 0 0 3px rgba(255,159,76,0.3);
        }
        .answer-glow {
          animation: glowPulse 3s ease-in-out infinite;
        }
      `}</style>

      <ToolHeader
        title="Math Step-by-Step Solver"
        description="Type any equation, expression, or word problem and get a full, numbered walkthrough."
        icon={Sigma}
      />

      {/* Tab bar */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border-2",
              tab === t.id
                ? "text-white shadow-lg"
                : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60 backdrop-blur-xl"
            )}
            style={
              tab === t.id
                ? {
                    background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                    borderColor: "rgba(120,90,60,0.3)",
                    boxShadow: "0 6px 24px rgba(255,159,76,0.3)",
                  }
                : undefined
            }
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab !== "solver" && (
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "graph" && <GraphCalculator />}
            {tab === "equations" && <EquationSolver />}
            {tab === "calc" && <ScientificCalculator />}
            {tab === "stats" && <StatisticsAnalyzer />}
            {tab === "matrix" && <MatrixCalculator />}
            {tab === "formulas" && <FormulaReference />}
          </motion.div>
        )}

        {tab === "solver" && (
          <motion.div
            key="solver"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!solveMath.isPending && !solution && !solveMath.isError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="relative max-w-2xl mx-auto mt-4"
              >
                {FLOATING_SYMBOLS.map((sym, i) => (
                  <span
                    key={i}
                    className={`absolute ${sym.size} font-bold text-primary/30 float-symbol select-none hidden sm:block`}
                    style={{
                      top: sym.top,
                      left: sym.left,
                      right: sym.right,
                      bottom: sym.bottom,
                      animationDelay: `${sym.delay}s`,
                    }}
                  >
                    {sym.char}
                  </span>
                ))}

                <div className="absolute inset-0 -z-10 rounded-2xl grid-pattern opacity-30" />

                <div className="relative rounded-2xl p-[2px] form-glow"
                     style={{ background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)" }}>
                  <motion.form
                    onSubmit={handleSubmit}
                    className="relative rounded-2xl p-4 sm:p-6 lg:p-8 overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.72)" }}
                  >
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                    <label
                      htmlFor="problem"
                      className="block text-sm font-bold uppercase tracking-wider mb-3"
                      style={{ color: "#6B6B6B" }}
                    >
                      Your Math Problem
                    </label>
                    <textarea
                      id="problem"
                      ref={inputRef}
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="e.g., Solve for x: 2x + 5 = 17"
                      className="w-full rounded-2xl p-5 min-h-[130px] font-mono text-base placeholder:text-[#9A9A9A] focus:outline-none transition-all duration-500 resize-none input-ring"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        color: "#2D2D2D",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                      }}
                      required
                    />

                    <SymbolKeyboard onInsert={insertSymbol} />

                    <div className="flex flex-wrap gap-2 mt-4 mb-8">
                      {EXAMPLES.map((ex, i) => (
                        <motion.button
                          type="button"
                          key={ex}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => setProblem(ex)}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-500 ${EXAMPLE_TINTS[i]}`}
                        >
                          {ex}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={!problem.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full py-5 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 disabled:opacity-40 transition-all duration-500 mt-4 overflow-hidden shimmer-hover"
                      style={{
                        background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                        boxShadow: "0 8px 32px rgba(255,159,76,0.25), 0 0 60px rgba(255,159,76,0.08)",
                      }}
                    >
                      <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-4 ring-white/20 transition-all duration-500 pointer-events-none" />
                      <Sigma size={22} />
                      <span>Solve Step by Step</span>
                      <ArrowRight
                        size={20}
                        className="transition-transform duration-500 group-hover:translate-x-2"
                      />
                    </motion.button>
                  </motion.form>
                </div>

                <HistoryPanel
                  entries={history}
                  onOpen={openFromHistory}
                  onDelete={deleteFromHistory}
                  onClear={clearHistory}
                />
              </motion.div>
            )}

            {solveMath.isPending && (
              <LoadingState
                title="Working through the math..."
                messages={[
                  "Reading the problem...",
                  "Choosing a strategy...",
                  "Working the algebra...",
                  "Double-checking the answer...",
                  "Formatting the steps...",
                ]}
              />
            )}

            {solveMath.isError && (
              <ErrorState
                onRetry={() => handleSubmit()}
                message="Couldn't solve that one. Try rephrasing the problem and try again."
              />
            )}

            {solution && !solveMath.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="mt-4"
              >
                <div className="rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl"
                     style={{
                       background: "rgba(255,255,255,0.5)",
                       backdropFilter: "blur(20px) saturate(180%)",
                       border: "1.5px solid rgba(255,255,255,0.72)",
                       boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                     }}>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/15 px-2.5 py-1 rounded-full mb-3">
                      {solution.topic}
                    </span>
                    <p className="font-mono text-lg break-words" style={{ color: "#FF9F4C" }}>
                      {solution.restatedProblem}
                    </p>
                  </div>
                  <CopyButton text={`${solution.restatedProblem}\n\n${solution.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.explanation}\n${s.expression}`).join("\n\n")}\n\nFinal Answer: ${solution.finalAnswer}${solution.checkNote ? `\n\nCheck: ${solution.checkNote}` : ""}`} />
                </div>

                <div className="relative pl-8 md:pl-10 space-y-6 mb-10">
                  <div className="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-primary/30" />
                  {solution.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: idx * 0.12,
                        duration: 0.7,
                        ease: "easeOut",
                      }}
                      className="relative"
                    >
                      <div
                        className="absolute -left-8 md:-left-10 top-0 w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-lg"
                        style={{
                          background:
                            "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="rounded-xl p-5 relative overflow-hidden backdrop-blur-xl"
                           style={{
                             background: "rgba(255,255,255,0.5)",
                             backdropFilter: "blur(20px) saturate(180%)",
                             border: "1.5px solid rgba(255,255,255,0.72)",
                             boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                           }}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary/30 rounded-l-xl" />
                        <h3 className="font-serif font-medium mb-2 pl-2" style={{ color: "#FF9F4C" }}>
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed mb-3 pl-2" style={{ color: "#6B6B6B" }}>
                          {step.explanation}
                        </p>
                        <div className="rounded-xl px-4 py-3 font-mono font-semibold text-base overflow-x-auto ml-2 text-primary"
                             style={{ background: "rgba(255,159,76,0.06)", border: "1px solid rgba(255,159,76,0.12)" }}>
                          {step.expression}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="relative rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 mb-6 text-white overflow-hidden answer-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                    boxShadow: "0 8px 40px rgba(255,159,76,0.35), 0 0 80px rgba(255,212,168,0.15)",
                  }}
                >
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                    <CheckCircle2 size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Final Answer
                    </p>
                    <p className="font-mono text-2xl md:text-3xl font-bold break-words overflow-x-auto max-w-full">
                      {solution.finalAnswer}
                    </p>
                  </div>
                  <CopyButton text={solution.finalAnswer} className="text-white bg-white/20 hover:bg-white/30 border border-white/30" />
                </motion.div>

                {solution.checkNote && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="flex gap-3 rounded-xl p-5 mb-10 backdrop-blur-xl"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Lightbulb
                      size={20}
                      className="text-yellow-500 shrink-0 mt-0.5"
                    />
                    <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>
                      <span className="font-bold" style={{ color: "#FF9F4C" }}>Check your work:</span>{" "}
                      {solution.checkNote}
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-center pb-16">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all duration-500 lg-button-outline backdrop-blur-xl"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#FF9F4C",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <RotateCcw size={18} />
                    Solve Another Problem
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
