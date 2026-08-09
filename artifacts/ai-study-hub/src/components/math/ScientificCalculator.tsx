import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Eraser, Equal } from "lucide-react";
import { Panel } from "@/components/math/shared";
import { compileFunction, fmt } from "@/components/math/mathEngine";
import { cn } from "@/lib/utils";

interface CalcHistoryEntry {
  expr: string;
  result: number;
  ts: number;
}

const FN_KEYS: { label: string; insert: string }[] = [
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "ln", insert: "ln(" },
  { label: "log", insert: "log(" },
  { label: "√", insert: "sqrt(" },
  { label: "x²", insert: "^2" },
  { label: "x³", insert: "^3" },
  { label: "1/x", insert: "1/(" },
  { label: "|x|", insert: "abs(" },
  { label: "π", insert: "pi" },
  { label: "e", insert: "e" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
];

const PAD_KEYS: { label: string; kind: "num" | "op" | "act" | "eq"; insert?: string; span?: 2 }[] = [
  { label: "AC", kind: "act" },
  { label: "DEL", kind: "act" },
  { label: "%", kind: "op", insert: "%" },
  { label: "÷", kind: "op", insert: "/" },
  { label: "7", kind: "num", insert: "7" },
  { label: "8", kind: "num", insert: "8" },
  { label: "9", kind: "num", insert: "9" },
  { label: "×", kind: "op", insert: "*" },
  { label: "4", kind: "num", insert: "4" },
  { label: "5", kind: "num", insert: "5" },
  { label: "6", kind: "num", insert: "6" },
  { label: "−", kind: "op", insert: "-" },
  { label: "1", kind: "num", insert: "1" },
  { label: "2", kind: "num", insert: "2" },
  { label: "3", kind: "num", insert: "3" },
  { label: "+", kind: "op", insert: "+" },
  { label: "0", kind: "num", insert: "0", span: 2 },
  { label: ".", kind: "num", insert: "." },
  { label: "±", kind: "act" },
  { label: "=", kind: "eq" },
];

const isOperator = (ch: string) => "+-*/^".includes(ch);

export default function ScientificCalculator() {
  const [expr, setExpr] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [history, setHistory] = useState<CalcHistoryEntry[]>([]);

  const preview = (() => {
    if (!expr.trim()) return "";
    try {
      const fn = compileFunction(expr);
      const v = fn(0);
      return Number.isFinite(v) ? `= ${fmt(v)}` : "";
    } catch {
      return "";
    }
  })();

  const insert = (text: string) => {
    setExpr((prev) => {
      if (text === "(" && prev && /[\d.)]/.test(prev[prev.length - 1])) {
        return prev + "*(";
      }
      if (
        isOperator(text) &&
        prev &&
        isOperator(prev[prev.length - 1])
      ) {
        return prev.slice(0, -1) + text;
      }
      return prev + text;
    });
    setError("");
  };

  const del = () => {
    setExpr((prev) => {
      const m = prev.match(/(sin|cos|tan|ln|log|sqrt|abs|exp|asin|acos|atan|floor|ceil|round|sign)\($/);
      if (m && m.index !== undefined) return prev.slice(0, m.index);
      return prev.slice(0, -1);
    });
    setError("");
  };

  const clearAll = () => {
    setExpr("");
    setError("");
  };

  const toggleSign = () => {
    setExpr((prev) => {
      const m = prev.match(/[\d.]+$/);
      if (!m || m.index === undefined) return prev;
      const before = prev.slice(0, m.index);
      if (before.endsWith("-")) return before.slice(0, -1) + m[0];
      return before + "-" + m[0];
    });
    setError("");
  };

  const insertAns = () => {
    if (lastResult === null) return;
    insert(String(lastResult));
  };

  const evaluate = () => {
    if (!expr.trim()) return;
    try {
      const fn = compileFunction(expr);
      const result = fn(0);
      if (!Number.isFinite(result)) throw new Error("Result is not a finite number");
      setLastResult(result);
      setHistory((h) => [{ expr, result, ts: Date.now() }, ...h].slice(0, 20));
      setError("");
      setExpr(fmt(result));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const press = (key: (typeof PAD_KEYS)[number]) => {
    if (key.kind === "act") {
      if (key.label === "AC") clearAll();
      else if (key.label === "DEL") del();
      else if (key.label === "±") toggleSign();
      return;
    }
    if (key.kind === "eq") {
      evaluate();
      return;
    }
    insert(key.insert ?? key.label);
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[0-9.]$/.test(k)) insert(k);
      else if (k === "+" || k === "-" || k === "*" || k === "/" || k === "^") insert(k);
      else if (k === "(" || k === ")") insert(k);
      else if (k === "%") insert("%");
      else if (k === "Enter") evaluate();
      else if (k === "Backspace") del();
      else if (k === "Escape") clearAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr, lastResult]);

  const padBtn = (key: (typeof PAD_KEYS)[number]) => {
    const base =
      "h-14 rounded-xl font-bold text-lg transition-all duration-150 active:scale-90 hover:scale-[1.03] border-2 border-black/10 select-none";
    const style =
      key.kind === "op"
        ? { background: "rgba(255,159,76,0.12)", color: "#B45309" }
        : key.kind === "act"
          ? { background: "rgba(0,0,0,0.04)", color: "#6B6B6B" }
          : key.kind === "eq"
            ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", color: "#fff", borderColor: "rgba(120,90,60,0.3)" }
            : { background: "rgba(255,255,255,0.9)", color: "#2D2D2D" };

    return (
      <button
        type="button"
        key={key.label}
        onClick={() => press(key)}
        className={cn(base, key.span === 2 && "col-span-2")}
        style={style}
      >
        {key.kind === "eq" ? <Equal size={22} className="mx-auto" /> : key.label}
      </button>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Panel className="max-w-lg mx-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "rgba(255,159,76,0.12)", color: "#B45309" }}>
            {lastResult !== null ? <>Ans = {fmt(lastResult)}</> : "Scientific"}
          </span>
          <span className="text-[11px] text-[#9A9A9A]">Keyboard supported</span>
        </div>

        {/* Display */}
        <div
          className="rounded-xl px-4 py-3 mb-4 text-right overflow-x-auto"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)",
          }}
        >
          <div className="min-h-[22px] font-mono text-sm whitespace-pre-wrap break-all" style={{ color: "#6B6B6B" }}>
            {expr || "0"}
          </div>
          <div className="min-h-[28px] font-mono text-2xl font-bold break-all" style={{ color: "#FF9F4C" }}>
            {error ? <span className="text-red-500 text-base">{error}</span> : preview}
          </div>
        </div>

        {/* Function strip */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {FN_KEYS.map((k) => (
            <button
              type="button"
              key={k.label}
              onClick={() => insert(k.insert)}
              className="px-3 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-150 active:scale-90 hover:scale-105 border border-black/10"
              style={{ background: "rgba(255,255,255,0.85)", color: "#B45309" }}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Pad */}
        <div className="grid grid-cols-4 gap-2">
          {PAD_KEYS.map(padBtn)}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-5 pt-4 border-t border-black/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
                History
              </p>
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                <Eraser size={13} />
                Clear
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.ts}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExpr(h.expr);
                      setError("");
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="font-mono text-xs truncate" style={{ color: "#6B6B6B" }}>
                      {h.expr}
                    </p>
                    <p className="font-mono text-sm font-bold" style={{ color: "#FF9F4C" }}>
                      = {fmt(h.result)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={insertAns}
                    className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold border border-black/10 hover:bg-primary/15 hover:text-primary transition-colors"
                    style={{ background: "rgba(255,255,255,0.7)", color: "#6B6B6B" }}
                  >
                    Ans
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistory((h2) => h2.filter((x) => x.ts !== h.ts))}
                    aria-label="Delete"
                    className="shrink-0 p-1.5 rounded-lg text-[#9A9A9A] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </motion.div>
  );
}
