import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Play, RotateCcw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Panel, SectionLabel } from "@/components/math/shared";
import { computeStats, fmt, parseNumbers } from "@/components/math/mathEngine";

const EXAMPLES = [
  "78, 85, 92, 88, 79, 90, 84, 95, 87, 81",
  "5 3 8 2 9 4 7 1 6 5 3 8",
  "160, 172, 168, 175, 180, 165, 158, 190, 176, 169, 173, 171",
];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 transition-all duration-300 hover:shadow-md"
      style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#9A9A9A" }}>
        {label}
      </p>
      <p className="mt-1 font-mono font-bold text-base" style={{ color: "#2D2D2D" }}>
        {value}
      </p>
    </div>
  );
}

export default function StatisticsAnalyzer() {
  const [raw, setRaw] = useState("");
  const [ran, setRan] = useState(false);

  const data = useMemo(() => parseNumbers(raw), [raw]);
  const stats = useMemo(() => (data.length > 0 ? computeStats(data) : null), [data]);

  const frequency = useMemo(() => {
    if (!stats || data.length === 0 || data.length > 30) return [];
    const map = new Map<number, number>();
    data.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, count]) => ({ value: fmt(value), count }));
  }, [data, stats]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Panel>
        <div>
          <SectionLabel>Enter your data set</SectionLabel>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setRan(false);
            }}
            placeholder="Numbers separated by commas, spaces, or semicolons — e.g. 78, 85, 92, 88"
            rows={3}
            spellCheck={false}
            className="w-full rounded-2xl px-4 py-3 font-mono text-sm focus:outline-none input-ring transition-all duration-300 resize-none"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.08)", color: "#2D2D2D" }}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => setRaw(ex)}
                className="px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold transition-all duration-200 hover:scale-105 border border-black/10"
                style={{ background: "rgba(255,159,76,0.08)", color: "#B45309" }}
              >
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => setRan(true)}
              disabled={data.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                boxShadow: "0 6px 20px rgba(255,159,76,0.3)",
              }}
            >
              <Play size={15} />
              Analyze
            </button>
            {ran && (
              <button
                type="button"
                onClick={() => {
                  setRaw("");
                  setRan(false);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6B6B6B] hover:text-primary transition-colors"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
          {ran && data.length === 0 && (
            <p className="mt-3 text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3">
              No valid numbers found. Separate values with commas, spaces, or semicolons.
            </p>
          )}
        </div>

        {ran && stats && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatTile label="Count (n)" value={String(stats.count)} />
              <StatTile label="Sum" value={fmt(stats.sum)} />
              <StatTile label="Mean" value={fmt(stats.mean)} />
              <StatTile label="Median" value={fmt(stats.median)} />
              <StatTile
                label="Mode(s)"
                value={stats.modes.length ? stats.modes.map((m) => fmt(m)).join(", ") : "none"}
              />
              <StatTile label="Range" value={fmt(stats.range)} />
              <StatTile label="Min" value={fmt(stats.min)} />
              <StatTile label="Max" value={fmt(stats.max)} />
              <StatTile label="Variance (σ²)" value={fmt(stats.variancePop)} />
              <StatTile label="Std Dev (σ)" value={fmt(stats.stdDevPop)} />
              <StatTile label="Sample σ" value={fmt(stats.stdDevSample)} />
              <StatTile label="Q1 / Q3" value={`${fmt(stats.q1)} / ${fmt(stats.q3)}`} />
              <StatTile label="IQR" value={fmt(stats.iqr)} />
            </div>

            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>
                  Frequency Distribution
                </p>
                {frequency.length === 0 && (
                  <span className="text-[11px]" style={{ color: "#9A9A9A" }}>
                    (chart shown for up to 30 distinct values)
                  </span>
                )}
              </div>
              {frequency.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={frequency} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#6B6B6B" }} tickLine={false} stroke="rgba(0,0,0,0.15)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6B6B" }} tickLine={false} stroke="rgba(0,0,0,0.15)" />
                      <Tooltip
                        cursor={{ fill: "rgba(255,159,76,0.08)" }}
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1.5px solid rgba(255,255,255,0.72)",
                          borderRadius: 12,
                          fontSize: 12,
                          fontFamily: "monospace",
                        }}
                      />
                      <Bar dataKey="count" fill="#FF9F4C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#9A9A9A" }}>
                  Too many distinct values to chart.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </Panel>
    </motion.div>
  );
}
