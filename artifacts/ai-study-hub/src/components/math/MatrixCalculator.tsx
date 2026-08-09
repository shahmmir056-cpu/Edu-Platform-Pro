import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Plus, Minus, X as Multiply, ArrowDownToLine } from "lucide-react";
import { Panel } from "@/components/math/shared";
import { fmt, matAdd, matInverse, matDet, matMul, matSub } from "@/components/math/mathEngine";
import { cn } from "@/lib/utils";

type Op = "add" | "sub" | "mul" | "det" | "inv";

const OPS: { id: Op; label: string; needsB: boolean }[] = [
  { id: "add", label: "A + B", needsB: true },
  { id: "sub", label: "A − B", needsB: true },
  { id: "mul", label: "A × B", needsB: true },
  { id: "det", label: "det(A)", needsB: false },
  { id: "inv", label: "A⁻¹", needsB: false },
];

const EXAMPLES: { label: string; size: 2 | 3; a: number[][]; b: number[][] }[] = [
  {
    label: "2×2 demo",
    size: 2,
    a: [[4, 7], [2, 6]],
    b: [[1, 2], [3, 4]],
  },
  {
    label: "Singular 2×2",
    size: 2,
    a: [[1, 2], [2, 4]],
    b: [[0, 0], [0, 0]],
  },
  {
    label: "3×3 demo",
    size: 3,
    a: [[2, -1, 0], [-1, 2, -1], [0, -1, 2]],
    b: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  },
];

function MatrixGrid({
  label,
  n,
  values,
  onChange,
}: {
  label: string;
  n: number;
  values: number[][];
  onChange: (i: number, j: number, v: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B6B6B" }}>
        {label}
      </p>
      <div
        className="inline-grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(52px, auto))` }}
      >
        {values.map((row, i) =>
          row.map((v, j) => (
            <input
              key={`${i}${j}`}
              type="number"
              value={v}
              onChange={(e) => onChange(i, j, Number(e.target.value))}
              className="w-full rounded-lg px-2 py-1.5 font-mono text-sm text-center focus:outline-none input-ring border border-black/10"
              style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function MatrixCalculator() {
  const [size, setSize] = useState<2 | 3>(2);
  const [op, setOp] = useState<Op>("mul");
  const [a, setA] = useState<number[][]>([[4, 7], [2, 6]]);
  const [b, setB] = useState<number[][]>([[1, 2], [3, 4]]);
  const [result, setResult] = useState<number[][] | null>(null);
  const [det, setDet] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const needsB = OPS.find((o) => o.id === op)?.needsB ?? false;

  const resize = (n: 2 | 3) => {
    setSize(n);
    setA((prev) =>
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? (i === j ? 1 : 0))
      )
    );
    setB((prev) =>
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? (i === j ? 1 : 0))
      )
    );
    setResult(null);
    setDet(null);
    setMessage("");
  };

  const loadExample = (ex: { size: 2 | 3; a: number[][]; b: number[][] }) => {
    setSize(ex.size);
    setA(ex.a.map((r) => [...r]));
    setB(ex.b.map((r) => [...r]));
    setResult(null);
    setDet(null);
    setMessage("");
  };

  const setAij = (i: number, j: number, v: number) => {
    setA((prev) => prev.map((row, ri) => (ri === i ? row.map((x, cj) => (cj === j ? v : x)) : row)));
    setResult(null);
    setMessage("");
  };

  const setBij = (i: number, j: number, v: number) => {
    setB((prev) => prev.map((row, ri) => (ri === i ? row.map((x, cj) => (cj === j ? v : x)) : row)));
    setResult(null);
    setMessage("");
  };

  const run = () => {
    setResult(null);
    setDet(null);
    setMessage("");
    switch (op) {
      case "add":
        setResult(matAdd(a, b));
        break;
      case "sub":
        setResult(matSub(a, b));
        break;
      case "mul":
        setResult(matMul(a, b));
        break;
      case "det":
        setDet(matDet(a));
        break;
      case "inv": {
        const inv = matInverse(a);
        if (inv) {
          setResult(inv);
        } else {
          setMessage("A is singular — it has no inverse (det = 0).");
        }
        break;
      }
    }
  };

  const resultDet = result ? matDet(result) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Panel>
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
            Size
          </span>
          {([2, 3] as const).map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => resize(n)}
              className={cn(
                "px-3.5 py-2 rounded-lg font-bold text-sm transition-all duration-300 border-2",
                size === n ? "text-white" : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60"
              )}
              style={size === n ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", borderColor: "rgba(120,90,60,0.3)" } : undefined}
            >
              {n} × {n}
            </button>
          ))}
          <span className="text-xs font-bold uppercase tracking-wider ml-3" style={{ color: "#6B6B6B" }}>
            Operation
          </span>
          {OPS.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => {
                setOp(o.id);
                setResult(null);
                setDet(null);
                setMessage("");
              }}
              className={cn(
                "inline-flex items-center gap-1 px-3.5 py-2 rounded-lg font-bold text-sm transition-all duration-300 border-2",
                op === o.id ? "text-white" : "text-[#6B6B6B] hover:text-primary border-black/10 bg-white/60"
              )}
              style={op === o.id ? { background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", borderColor: "rgba(120,90,60,0.3)" } : undefined}
            >
              {o.id === "add" && <Plus size={14} />}
              {o.id === "sub" && <Minus size={14} />}
              {o.id === "mul" && <Multiply size={13} />}
              {o.label}
            </button>
          ))}
        </div>

        {/* Matrices */}
        <div className="flex flex-wrap items-end gap-6 mt-6">
          <MatrixGrid label="Matrix A" n={size} values={a} onChange={setAij} />
          {needsB && (
            <>
              <span className="pb-4 font-mono text-2xl font-bold" style={{ color: "#FF9F4C" }}>
                {op === "add" ? "+" : op === "sub" ? "−" : "×"}
              </span>
              <MatrixGrid label="Matrix B" n={size} values={b} onChange={setBij} />
            </>
          )}
          <span className="pb-4 font-mono text-2xl font-bold" style={{ color: "#FF9F4C" }}>
            =
          </span>
          <button
            type="button"
            onClick={run}
            className="mb-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
              boxShadow: "0 6px 20px rgba(255,159,76,0.3)",
            }}
          >
            <Play size={15} />
            Compute
          </button>
        </div>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 mt-5">
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 hover:scale-105 border border-black/10"
              style={{ background: "rgba(255,159,76,0.08)", color: "#B45309" }}
            >
              {ex.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setDet(null);
              setMessage("");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 border border-black/10 text-[#6B6B6B] hover:text-primary"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        {/* Result */}
        {message && (
          <p className="mt-5 text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3">{message}</p>
        )}

        {det !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#6B6B6B" }}>
              Determinant of A
            </p>
            <p className="font-mono text-2xl font-bold" style={{ color: "#FF9F4C" }}>
              det(A) = {fmt(det)}
            </p>
            <p className="text-xs mt-1" style={{ color: "#9A9A9A" }}>
              {Math.abs(det) < 1e-12
                ? "A is singular (rows are linearly dependent)."
                : "A is invertible (rows are linearly independent)."}
            </p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={16} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
                Result{op === "inv" ? " (A⁻¹)" : ""}
              </p>
              {resultDet !== null && op === "inv" && (
                <span className="text-[11px] font-mono" style={{ color: "#9A9A9A" }}>
                  det(A⁻¹) = {fmt(resultDet)}
                </span>
              )}
            </div>
            <div
              className="inline-grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(64px, auto))` }}
            >
              {result.map((row, i) =>
                row.map((v, j) => (
                  <div
                    key={`${i}${j}`}
                    className="rounded-lg px-3 py-2 font-mono text-sm font-bold text-center"
                    style={{ background: "rgba(255,159,76,0.08)", color: "#2D2D2D", border: "1px solid rgba(255,159,76,0.15)" }}
                  >
                    {fmt(v)}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        <p className="mt-6 pt-4 border-t border-black/10 text-xs leading-relaxed" style={{ color: "#9A9A9A" }}>
          Supports 2×2 and 3×3 matrices. Addition and subtraction require both matrices; the
          determinant and inverse use only matrix A. The inverse is computed with Gauss–Jordan
          elimination.
        </p>
      </Panel>
    </motion.div>
  );
}
