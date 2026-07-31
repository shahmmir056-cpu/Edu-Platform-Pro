import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  ArrowLeft,
  Clock,
  BarChart3,
  ExternalLink,
  Rocket,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { Footer } from "@/components/layout/Footer";
import { CUSTOM_SIMULATIONS } from "./simulations";
import { SIMULATIONS as PHET_SIMS } from "@/lib/simulations";
import SimView from "./SimView";
import type { Simulation } from "./engine/types";

const CATEGORY_COLORS: Record<string, string> = {
  Biology: "#FF9F4C",
  Chemistry: "#E8852E",
  Physics: "#D4761A",
  Math: "#C46A10",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#FF9F4C",
  Intermediate: "#E8852E",
  Advanced: "#C46A10",
};

type ViewMode = "grid" | "custom-sim" | "phet-grid";

export default function SimulationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeSim, setActiveSim] = useState<Simulation | null>(null);
  const [activePhetSlug, setActivePhetSlug] = useState<string | null>(null);
  const [simFooterH, setSimFooterH] = useState(0);
  const simFooterRef = useRef<HTMLDivElement | null>(null);

  // Measure the sim-viewer footer so the PhET sim's bottom strip is tucked behind it
  useEffect(() => {
    const el = simFooterRef.current;
    if (!el) {
      setSimFooterH(0);
      return;
    }
    const update = () => setSimFooterH(el.offsetHeight);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [activePhetSlug]);

  // Close the sim viewer if the user navigates via a footer link
  const [location] = useLocation();
  useEffect(() => {
    setActivePhetSlug(null);
    setActiveSim(null);
    setViewMode("grid");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const openCustomSim = (sim: Simulation) => {
    setActiveSim(sim);
    setViewMode("custom-sim");
  };

  const openPhetSim = (slug: string) => {
    setActivePhetSlug(slug);
  };

  const goBack = () => {
    setActiveSim(null);
    setActivePhetSlug(null);
    setViewMode("grid");
  };

  // Fullscreen simulation view
  if (viewMode === "custom-sim" && activeSim) {
    return <SimView simulation={activeSim} onBack={goBack} />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FFF8F0" }}>
      <ToolHeader
        title="Interactive Simulations"
        subtitle="Lab-quality virtual experiments — build intuition through hands-on exploration"
        icon={FlaskConical}
      />

      <div className="max-w-7xl mx-auto px-4">
        {/* Custom simulations section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,159,76,0.1)" }}>
              <Rocket size={16} style={{ color: "#FF9F4C" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: "'Fraunces', serif", color: "#2D2D2D" }}>
                Virtual Lab Experiments
              </h2>
              <p className="text-xs" style={{ color: "#9A9A9A" }}>
                Step-by-step protocol simulations — drag equipment, follow procedures, collect results
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CUSTOM_SIMULATIONS.map((sim, i) => {
              const catColor = CATEGORY_COLORS[sim.category] ?? "#FF9F4C";
              return (
                <motion.button
                  key={sim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => openCustomSim(sim)}
                  className="text-left rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "2px solid #2D2D2D",
                  }}
                >
                  {/* Header */}
                  <div
                    className="h-28 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${catColor}08, ${catColor}15)` }}
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform">{sim.icon}</span>
                    <span
                      className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${catColor}20`, color: catColor }}
                    >
                      {sim.category}
                    </span>
                    <span
                      className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${DIFFICULTY_COLORS[sim.difficulty]}15`, color: DIFFICULTY_COLORS[sim.difficulty] }}
                    >
                      {sim.difficulty}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 group-hover:text-[#E8852E] transition-colors" style={{ color: "#2D2D2D" }}>
                      {sim.title}
                    </h3>
                    <p className="text-[11px] font-medium mb-1" style={{ color: catColor }}>
                      {sim.subtitle}
                    </p>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B6B6B" }}>
                      {sim.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px]" style={{ color: "#9A9A9A" }}>
                      <span className="flex items-center gap-1">
                        <BarChart3 size={10} />
                        {sim.steps.length} steps
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        ~{sim.estimatedMinutes} min
                      </span>
                    </div>

                    <div className="mt-3 flex items-center text-xs font-bold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: catColor }}>
                      Start Experiment →
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* PhET simulations section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(76,175,80,0.1)" }}>
              <FlaskConical size={16} style={{ color: "#4CAF50" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: "'Fraunces', serif", color: "#2D2D2D" }}>
                PhET Simulations
              </h2>
              <p className="text-xs" style={{ color: "#9A9A9A" }}>
                {PHET_SIMS.length} interactive simulations from the University of Colorado Boulder
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {PHET_SIMS.slice(0, 20).map((sim, i) => (
              <motion.button
                key={sim.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                onClick={() => openPhetSim(sim.slug)}
                className="text-left rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-md group"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "2px solid #2D2D2D",
                }}
              >
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-1.5"
                  style={{
                    background: CATEGORY_COLORS[sim.subject] + "15",
                    color: CATEGORY_COLORS[sim.subject],
                  }}
                >
                  {sim.subject}
                </span>
                <h4 className="text-xs font-semibold leading-tight group-hover:text-[#E8852E] transition-colors" style={{ color: "#2D2D2D" }}>
                  {sim.name}
                </h4>
                <p className="text-[10px] mt-1 leading-snug line-clamp-2" style={{ color: "#9A9A9A" }}>
                  {sim.description}
                </p>
              </motion.button>
            ))}
          </div>

          {PHET_SIMS.length > 20 && (
            <button
              onClick={() => setViewMode("phet-grid")}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.5)", color: "#FF9F4C", border: "2px solid #2D2D2D" }}
            >
              View All {PHET_SIMS.length} PhET Simulations →
            </button>
          )}
        </section>

        {/* Full PhET grid view */}
        {viewMode === "phet-grid" && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: "#2D2D2D" }}>All PhET Simulations</h2>
              <button
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "#FF9F4C" }}
              >
                <ArrowLeft size={12} />
                Back to overview
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {PHET_SIMS.map((sim, i) => (
                <motion.button
                  key={sim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openPhetSim(sim.slug)}
                  className="text-left rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.5)", border: "2px solid #2D2D2D" }}
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-1.5"
                    style={{ background: CATEGORY_COLORS[sim.subject] + "15", color: CATEGORY_COLORS[sim.subject] }}
                  >
                    {sim.subject}
                  </span>
                  <h4 className="text-xs font-semibold leading-tight" style={{ color: "#2D2D2D" }}>
                    {sim.name}
                  </h4>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* PhET iframe lightbox */}
      <AnimatePresence>
        {activePhetSlug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setActivePhetSlug(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white overflow-clip w-full flex flex-col shadow-2xl border-2 border-[#2D2D2D] rounded-2xl h-[100dvh] mx-2 sm:mx-4"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#2D2D2D] shrink-0" style={{ background: "rgba(255,159,76,0.06)" }}>
                <p className="font-serif text-lg leading-none text-[#FF9F4C]">
                  {PHET_SIMS.find((s) => s.slug === activePhetSlug)?.name}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://phet.colorado.edu/sims/html/${activePhetSlug}/latest/${activePhetSlug}_en.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(255,255,255,0.7)", color: "#6B6B6B", border: "1px solid rgba(45,45,45,0.1)" }}
                  >
                    <ExternalLink size={12} />
                    PhET Site
                  </a>
                  <button
                    onClick={() => setActivePhetSlug(null)}
                    className="w-9 h-9 rounded-lg bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] flex items-center justify-center transition-colors text-[#6B6B6B]"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden min-h-[35dvh] lg:min-h-0">
                <iframe
                  src={`https://phet.colorado.edu/sims/html/${activePhetSlug}/latest/${activePhetSlug}_en.html?hideHeader=true&showResetButton=false&showInfoButton=false`}
                  title={PHET_SIMS.find((s) => s.slug === activePhetSlug)?.name}
                  className="absolute top-0 left-0 w-full border-0 bg-white"
                  style={{ height: `calc(100% + ${simFooterH}px)` }}
                  allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div
                ref={simFooterRef}
                className="shrink-0 overflow-y-auto max-h-[calc(100dvh-35dvh-4rem)] lg:max-h-none border-t-2 border-[#2D2D2D]"
              >
                <Footer />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
