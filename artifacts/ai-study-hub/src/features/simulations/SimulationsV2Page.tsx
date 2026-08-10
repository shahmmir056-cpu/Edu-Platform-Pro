import { useState, Suspense, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, FlaskConical, ChevronRight } from "lucide-react";
import { SIMS_V2, getSimV2 } from "./simulations-v2";
import type { SimV2 } from "./simulations-v2";
import { LabControlsProvider, LabToolbar } from "./simulations-v2/labControls";
import { setSimFullscreen } from "./simFullscreen";
import { trackAction } from "@/features/life-os/tracker";

const CATEGORY_ICONS: Record<string, string> = {
  Microscopy: "🔬",
  "Plant Biology": "🌿",
  "Cell Biology": "🧫",
  Genetics: "🧬",
  Chemistry: "⚗️",
  Biochemistry: "🧪",
  "Medical Science": "🏥",
  Epidemiology: "🦠",
};

function SimCard({ sim, onClick }: { sim: SimV2; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="lg-card text-left w-full overflow-hidden transition-all"
      style={{ cursor: "pointer" }}
    >
      <div
        className="h-28 flex items-center justify-center relative overflow-hidden rounded-t-xl"
        style={{
          background: `linear-gradient(135deg, ${sim.categoryColor}22, ${sim.categoryColor}44)`,
        }}
      >
        <span className="text-4xl">{CATEGORY_ICONS[sim.category] || "🧪"}</span>
        <span
          className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.8)",
            color: sim.categoryColor,
          }}
        >
          {sim.difficulty}
        </span>
      </div>
      <div className="p-4">
        <h3
          className="text-sm font-bold mb-1"
          style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}
        >
          {sim.title}
        </h3>
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: "#6B6B6B" }}>
          {sim.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock size={10} style={{ color: "#9A9A9A" }} />
            <span className="text-[10px]" style={{ color: "#9A9A9A" }}>
              {sim.duration}
            </span>
          </div>
          <span
            className="text-[10px] font-semibold flex items-center gap-1"
            style={{ color: "#E8852E" }}
          >
            Open Lab <ChevronRight size={10} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {sim.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[8px] px-1.5 py-0.5 rounded-full"
              style={{
                background: `${sim.categoryColor}15`,
                color: sim.categoryColor,
                border: `1px solid ${sim.categoryColor}30`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

function SimViewer({ sim, onBack }: { sim: SimV2; onBack: () => void }) {
  const SimComponent = sim.component;

  const SimPanel = useMemo(
    () =>
      function SimPanel() {
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div
                    className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-3"
                    style={{ borderColor: "#E8852E", borderTopColor: "transparent" }}
                  />
                  <p className="text-xs" style={{ color: "#9A9A9A" }}>
                    Loading simulation...
                  </p>
                </div>
              </div>
            }
          >
            <SimComponent />
          </Suspense>
        );
      },
    [SimComponent],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{
          background: `linear-gradient(135deg, ${sim.categoryColor}15, ${sim.categoryColor}30)`,
          border: `1.5px solid ${sim.categoryColor}30`,
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium mb-3 transition-all hover:gap-2.5"
          style={{ color: "#6B6B6B" }}
        >
          <ArrowLeft size={12} /> Back to Simulations
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${sim.categoryColor}20`, color: sim.categoryColor }}
              >
                {sim.category}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background:
                    sim.difficulty === "Beginner"
                      ? "rgba(255,159,76,0.12)"
                      : sim.difficulty === "Intermediate"
                      ? "rgba(232,133,46,0.15)"
                      : "rgba(196,106,16,0.15)",
                  color:
                    sim.difficulty === "Beginner"
                      ? "#FF9F4C"
                      : sim.difficulty === "Intermediate"
                      ? "#E8852E"
                      : "#C46A10",
                }}
              >
                {sim.difficulty}
              </span>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}
            >
              {sim.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
              {sim.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock size={12} style={{ color: "#9A9A9A" }} />
            <span className="text-[11px]" style={{ color: "#9A9A9A" }}>
              {sim.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Simulation */}
      <LabControlsProvider key={sim.id}>
        <LabToolbar title={sim.title}>
          <div className="p-4">
            <SimPanel />
          </div>
        </LabToolbar>
      </LabControlsProvider>
    </motion.div>
  );
}

export default function SimulationsV2Page() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const activeSim = activeId ? getSimV2(activeId) : null;

  useEffect(() => {
    setSimFullscreen(!!activeSim);
    return () => setSimFullscreen(false);
  }, [activeSim]);

  const openSim = (sim: SimV2) => {
    setActiveId(sim.id);
    trackAction("/simulations-v2", "simulation-run", undefined, 1, sim.title, sim.description);
  };

  const categories = ["All", ...Array.from(new Set(SIMS_V2.map((s) => s.category)))];

  const filtered = filter === "All" ? SIMS_V2 : SIMS_V2.filter((s) => s.category === filter);

  if (activeSim) {
    return (
      <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <SimViewer sim={activeSim} onBack={() => setActiveId(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,159,76,0.12)", border: "1.5px solid rgba(255,255,255,0.72)" }}
            >
              <FlaskConical size={18} style={{ color: "#E8852E" }} />
            </div>
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}
              >
                Interactive Lab Simulations
              </h1>
              <p className="text-xs" style={{ color: "#9A9A9A" }}>
                12 fully interactive biology, chemistry & genetics experiments
              </p>
            </div>
          </div>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
              style={{
                background:
                  filter === cat
                    ? "linear-gradient(135deg, #FF9F4C, #E8852E)"
                    : "rgba(0,0,0,0.04)",
                color: filter === cat ? "#fff" : "#6B6B6B",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((sim, i) => (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SimCard sim={sim} onClick={() => openSim(sim)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
