import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Search, Grid3x3 } from "lucide-react";
import { Panel, SectionLabel, MathTextInput } from "@/components/math/shared";
import {
  compileFunction,
  findRoots,
  fmt,
  solveLinearSystem,
  type RootResult,
} from "@/components/math/mathEngine";
import { cn } from "@/lib/utils";

type Mode = "roots" | "system";

const SYSTEM_EXAMPLES: { label: string; a: number[][]; b: number[] }[] = [
  { label: "x + y = 6, x − y = 2", a: [[1, 1], [1, -1]], b: [6, 2] },
  { label: "2x + 3y = 12, x − y = 1", a: [[2, 3], [1, -1]], b: [12, 1] },
  { label: "x + y + z = 6, y + z = 5, x + z = 4", a: [[1, 1, 1], [0, 1, 1], [1, 0, 1]], b: [6, 5, 4] },
  { label: "Parallel lines (no solution)", a: [[1, 1], [2, 2]], b: [5, 9] },
];

function RootFinder() {
  const [expr, setExpr] = useState("x^2 - 4");
  const [min, setMin] = useState(-10);
  const [max, setMax] = useState(10);
  const [error, setError] = useState("");
  const [roots, setRoots] = useState<RootResult[] | null>(null);

  const run = () => {
    setError("");
    setRoots(null);
    let fn: (x: number) => number;
    try {
      fn = compileFunction(expr);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    if (min >= max) {
      setError("The search range minimum must be smaller than the maximum.");
      return;
    }
    setRoots(findRoots(fn, min, max));
  };

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>f(x) = 0 — enter the expression</SectionLabel>
        <MathTextInput value={expr} onChange={setExpr} placeholder="e.g. x^2 - 4 or sin(x) - 0.5" />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
          Search range
        </span>
        <label className="flex items-center gap-2">
          <span className="text-[#9A9A9A]">min</span>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-20 rounded-lg px-2 py-1.5 font-mono text-sm focus:outline-none input-ring border border-black/10"
            style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[#9A9A9A]">max</span>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-20 rounded-lg px-2 py-1.5 font-mono text-sm focus:outline-none input-ring border border-black/10"
            style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
          />
        </label>
        <button
          type="button"
          onClick={run}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
            boxShadow: "0 6px 20px rgba(255,159,76,0.3)",
          }}
        >
          <Search size={15} />
          Find Roots
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "x² − 4", expr: "x^2 - 4" },
          { label: "x³ − 6x", expr: "x^3 - 6*x" },
          { label: "sin(x) − 0.5", expr: "sin(x) - 0.5" },
          { label: "x² − x − 6", expr: "x^2 - x - 6" },
          { label: "eˣ − 3", expr: "e^x - 3" },
        ].map((p) => (
          <button
            type="button"
            key={p.label}
            onClick={() => setExpr(p.expr)}
            className="px-3 py-1.5 rounded-full font-mono text-xs font-semibold transition-all duration-200 hover:scale-105 border border-black/10"
            style={{ background: "rgba(255,159,76,0.08)", color: "#B45309" }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {roots && !error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {roots.length === 0 ? (
            <p className="text-sm" style={{ color: "#6B6B6B" }}>
              No sign changes found in [{min}, {max}]. Try a wider range — note that roots with
              even multiplicity (touching the axis without crossing) are not detected.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>
                {roots.length} root{roots.length > 1 ? "s" : ""} found
              </p>
              {roots.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <span className="font-mono font-bold text-primary">x ≈ {fmt(r.root)}</span>
                  <span className="text-xs font-mono" style={{ color: "#9A9A9A" }}>
                    f(x) = {fmt(r.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function LinearSystemSolver() {
  const [size, setSize] = useState<2 | 3>(2);
  const [a, setA] = useState<number[][]>([
    [1, 1],
    [1, -1],
  ]);
  const [b, setB] = useState<number[]>([6, 2]);
  const [result, setResult] = useState<ReturnType<typeof solveLinearSystem> | null>(null);

  const resize = (n: 2 | 3) => {
    setSize(n);
    setA((prev) => {
      const next = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? 0)
      );
      return next;
    });
    setB((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? 0));
    setResult(null);
  };

  const loadExample = (ex: { a: number[][]; b: number[] }) => {
    setSize(ex.a.length as 2 | 3);
    setA(ex.a.map((row) => [...row]));
    setB([...ex.b]);
    setResult(null);
  };

  const setAij = (i: number, j: number, v: number) => {
    setA((prev) => prev.map((row, ri) => (ri === i ? row.map((x, cj) => (cj === j ? v : x)) : row)));
    setResult(null);
  };

  const setBi = (i: number, v: number) => {
    setB((prev) => prev.map((x, ci) => (ci === i ? v : x)));
    setResult(null);
  };

  const run = () => {
    setResult(solveLinearSystem(a, b));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
          Size
        </span>
        {([2, 3] as const).map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => resize(n)}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 border-2",
              size === n
                ? "text-white"
                : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60"
            )}
            style={
              size === n
                ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", borderColor: "rgba(120,90,60,0.3)" }
                : undefined
            }
          >
            {n} × {n}
          </button>
        ))}
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {SYSTEM_EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 hover:scale-105 border border-black/10"
              style={{ background: "rgba(255,159,76,0.08)", color: "#B45309" }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_auto_1fr] sm:items-start">
        {/* Coefficient matrix A */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
            A · x =
          </p>
          <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(56px, auto))` }}>
            {a.map((row, i) =>
              row.map((v, j) => (
                <input
                  key={`a${i}${j}`}
                  type="number"
                  value={v}
                  onChange={(e) => setAij(i, j, Number(e.target.value))}
                  className="w-full rounded-lg px-2 py-1.5 font-mono text-sm text-center focus:outline-none input-ring border border-black/10"
                  style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
                />
              ))
            )}
          </div>
        </div>

        {/* Constants b */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
            b
          </p>
          <div className="space-y-1.5">
            {b.map((v, i) => (
              <input
                key={`b${i}`}
                type="number"
                value={v}
                onChange={(e) => setBi(i, Number(e.target.value))}
                className="w-16 rounded-lg px-2 py-1.5 font-mono text-sm text-center focus:outline-none input-ring border border-black/10"
                style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
              />
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
              boxShadow: "0 6px 20px rgba(255,159,76,0.3)",
            }}
          >
            <Play size={15} />
            Solve System
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 rounded-xl px-4 py-3"
               style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
              det(A) =
            </span>
            <span className="font-mono font-bold" style={{ color: "#FF9F4C" }}>{fmt(result.determinant)}</span>
            <span className="text-xs" style={{ color: "#9A9A9A" }}>
              {Math.abs(result.determinant) < 1e-9 ? "(singular — the matrix has no inverse)" : "(non-zero — unique solution)"}
            </span>
          </div>

          {result.solution ? (
            <div className="rounded-xl p-4"
                 style={{ background: "rgba(255,159,76,0.06)", border: "1px solid rgba(255,159,76,0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
                Solution
              </p>
              <div className="flex flex-wrap gap-4">
                {result.solution.map((v, i) => (
                  <span key={i} className="font-mono font-bold text-primary">
                    x<sub>{i + 1}</sub> = {fmt(v)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3">
              {Math.abs(result.determinant) < 1e-9 && result.rank < size
                ? "This system has either no solution or infinitely many solutions (the rows are not linearly independent)."
                : "No unique solution exists for this system."}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function EquationSolver() {
  const [mode, setMode] = useState<Mode>("roots");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Panel>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("roots")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2",
              mode === "roots" ? "text-white" : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60"
            )}
            style={mode === "roots" ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", borderColor: "rgba(120,90,60,0.3)" } : undefined}
          >
            <Search size={15} />
            Find Roots f(x) = 0
          </button>
          <button
            type="button"
            onClick={() => setMode("system")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2",
              mode === "system" ? "text-white" : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60"
            )}
            style={mode === "system" ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", borderColor: "rgba(120,90,60,0.3)" } : undefined}
          >
            <Grid3x3 size={15} />
            Linear Systems
          </button>
        </div>

        {mode === "roots" ? <RootFinder /> : <LinearSystemSolver />}

        <div className="mt-6 pt-4 border-t border-black/10">
          <p className="text-xs leading-relaxed" style={{ color: "#9A9A9A" }}>
            <RotateCcw size={12} className="inline mr-1" />
            The root finder samples the function and refines every sign change with bisection.
            Linear systems use Gaussian elimination with partial pivoting and report the
            determinant to show whether a unique solution exists.
          </p>
        </div>
      </Panel>
    </motion.div>
  );
}
