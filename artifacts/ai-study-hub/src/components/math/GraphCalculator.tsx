import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Panel, MathTextInput } from "@/components/math/shared";
import { compileFunction, safeEval } from "@/components/math/mathEngine";

type GraphRow = { expr: string; color: string };
type GraphPoint = { x: number; f0: number | null; f1: number | null; f2: number | null };

const MAX_FUNCS = 3;
const GRAPH_COLORS = ["#FF9F4C", "#3B82F6", "#10B981"];

const QUICK_FUNCTIONS = [
  { label: "x²", expr: "x^2" },
  { label: "x³ − 3x", expr: "x^3 - 3*x" },
  { label: "sin(x)", expr: "sin(x)" },
  { label: "cos(x)", expr: "cos(x)" },
  { label: "√x", expr: "sqrt(x)" },
  { label: "1/x", expr: "1/x" },
  { label: "eˣ", expr: "e^x" },
  { label: "log(x)", expr: "log(x)" },
];

export default function GraphCalculator() {
  const [funcs, setFuncs] = useState<GraphRow[]>([
    { expr: "x^2 - 4", color: GRAPH_COLORS[0] },
    { expr: "sin(x)", color: GRAPH_COLORS[1] },
    { expr: "", color: GRAPH_COLORS[2] },
  ]);
  const [domain, setDomain] = useState({ min: -10, max: 10 });
  const [errors, setErrors] = useState<string[]>([]);

  const compiled = useMemo(
    () =>
      funcs.map((f) => {
        if (!f.expr.trim()) return null;
        try {
          return compileFunction(f.expr);
        } catch {
          return null;
        }
      }),
    [funcs]
  );

  useEffect(() => {
    setErrors(
      funcs.map((f) => {
        if (!f.expr.trim()) return "";
        try {
          compileFunction(f.expr);
          return "";
        } catch (e) {
          return (e as Error).message;
        }
      })
    );
  }, [funcs]);

  const data: GraphPoint[] = useMemo(() => {
    const POINTS = 500;
    const pts: GraphPoint[] = [];
    for (let i = 0; i <= POINTS; i++) {
      const x = domain.min + ((domain.max - domain.min) * i) / POINTS;
      const row: GraphPoint = {
        x: Number(x.toFixed(4)),
        f0: null,
        f1: null,
        f2: null,
      };
      compiled.forEach((fn, idx) => {
        if (fn) row[`f${idx}` as "f0"] = safeEval(fn, x);
      });
      pts.push(row);
    }
    return pts;
  }, [compiled, domain]);

  const yDomain = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    data.forEach((row) => {
      [row.f0, row.f1, row.f2].forEach((v) => {
        if (v !== null) {
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      });
    });
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return [-10, 10];
    const pad = (mx - mn) * 0.1 || 1;
    return [Math.floor(mn - pad), Math.ceil(mx + pad)];
  }, [data]);

  const setFunc = (idx: number, expr: string) => {
    setFuncs((prev) => prev.map((f, i) => (i === idx ? { ...f, expr } : f)));
  };

  const addFunc = () => {
    setFuncs((prev) =>
      prev.length < MAX_FUNCS
        ? [...prev, { expr: "", color: GRAPH_COLORS[prev.length % GRAPH_COLORS.length] }]
        : prev
    );
  };

  const removeFunc = (idx: number) => {
    setFuncs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const setDomainBound = (key: "min" | "max", value: number) => {
    setDomain((prev) => {
      const next = { ...prev, [key]: value };
      if (next.min >= next.max) {
        if (key === "min") next.min = next.max - 1;
        else next.max = next.min + 1;
      }
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Panel>
        {/* Function inputs */}
        <div className="space-y-3">
          {funcs.map((f, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ background: f.color, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
              />
              <div className="flex-1">
                <MathTextInput
                  value={f.expr}
                  onChange={(v) => setFunc(idx, v)}
                  placeholder={`f${idx + 1}(x) = ${idx === 0 ? "e.g. x^2 - 4" : "enter expression…"}`}
                />
                {errors[idx] && (
                  <p className="text-xs text-red-500 mt-1 pl-1">{errors[idx]}</p>
                )}
              </div>
              {funcs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFunc(idx)}
                  aria-label="Remove function"
                  className="shrink-0 p-2 rounded-lg text-[#9A9A9A] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {funcs.length < MAX_FUNCS && (
          <button
            type="button"
            onClick={addFunc}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors"
          >
            <Plus size={14} />
            Add function
          </button>
        )}

        {/* Domain controls */}
        <div className="flex flex-wrap items-center gap-3 mt-5 text-sm">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
            X range
          </span>
          <label className="flex items-center gap-2">
            <span className="text-[#9A9A9A]">min</span>
            <input
              type="number"
              value={domain.min}
              onChange={(e) => setDomainBound("min", Number(e.target.value))}
              className="w-20 rounded-lg px-2 py-1.5 font-mono text-sm focus:outline-none input-ring border border-black/10"
              style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[#9A9A9A]">max</span>
            <input
              type="number"
              value={domain.max}
              onChange={(e) => setDomainBound("max", Number(e.target.value))}
              className="w-20 rounded-lg px-2 py-1.5 font-mono text-sm focus:outline-none input-ring border border-black/10"
              style={{ background: "rgba(255,255,255,0.8)", color: "#2D2D2D" }}
            />
          </label>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {QUICK_FUNCTIONS.map((qf) => (
              <button
                type="button"
                key={qf.label}
                onClick={() => {
                  const idx = funcs.findIndex((f) => !f.expr.trim());
                  setFunc(idx >= 0 ? idx : 0, qf.expr);
                }}
                className="px-2.5 py-1 rounded-full font-mono text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 border border-black/10"
                style={{ background: "rgba(255,159,76,0.08)", color: "#B45309" }}
              >
                {qf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-5 h-[420px] rounded-xl overflow-hidden border border-black/10" style={{ background: "rgba(255,255,255,0.75)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[domain.min, domain.max]}
                tick={{ fontSize: 11, fill: "#6B6B6B" }}
                stroke="rgba(0,0,0,0.15)"
                tickLine={false}
              />
              <YAxis
                type="number"
                domain={yDomain as [number, number]}
                tick={{ fontSize: 11, fill: "#6B6B6B" }}
                stroke="rgba(0,0,0,0.15)"
                tickLine={false}
                width={46}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1.5px solid rgba(255,255,255,0.72)",
                  borderRadius: 12,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
                formatter={(value: any) =>
                  value === null || value === undefined ? "—" : Number(value).toFixed(3)
                }
                labelFormatter={(v) => `x = ${v}`}
              />
              <ReferenceLine x={0} stroke="rgba(0,0,0,0.2)" />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.2)" />
              {funcs.map((f, idx) =>
                f.expr.trim() ? (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={`f${idx}`}
                    stroke={f.color}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-3 text-xs leading-relaxed" style={{ color: "#9A9A9A" }}>
          Supported: +, −, ×, ÷, ^, parentheses · sin, cos, tan, asin, acos, atan, sinh, cosh,
          tanh, sqrt, cbrt, log (base 10), ln, abs, exp, floor, ceil, round, sign · constants x,
          pi, e. Implicit multiplication works, e.g. <span className="font-mono">2x</span>,{" "}
          <span className="font-mono">x(x+1)</span>, <span className="font-mono">3sin(x)</span>.
        </p>
      </Panel>
    </motion.div>
  );
}
