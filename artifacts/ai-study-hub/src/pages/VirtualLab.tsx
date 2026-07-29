import { useMemo, useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  X,
  Search,
  Maximize2,
  Atom,
  TestTube2,
  Thermometer,
  Magnet,
  Waves,
  Orbit,
  Weight,
  CircuitBoard,
  LineChart,
  Ruler,
  Shapes,
  Calculator,
  Dna,
  Rabbit,
  Percent,
  FunctionSquare,
  Beaker,
  Zap,
  FlaskRound,
  ExternalLink,
  ArrowLeft,
  Clock,
  Rocket,
  Microscope,
  Leaf,
  Flower2,
  Scissors,
  Heart,
  Sun,
  BarChart3,
  Bug,
  type LucideIcon,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { SIMULATIONS, SIM_SUBJECTS, simEmbedUrl, type SimSubject } from "@/lib/simulations";
import { SIMS_V2, getSimV2 } from "@/features/simulations/simulations-v2";
import type { SimV2 } from "@/features/simulations/simulations-v2";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS: Record<SimSubject, string> = {
  Physics: "bg-[#FF9F4C]/10 text-[#E8852E]",
  Chemistry: "bg-[#FFB366]/10 text-[#D4761A]",
  Math: "bg-[#E8852E]/10 text-[#C46A10]",
  Biology: "bg-[#FFD4A8]/20 text-[#E8852E]",
  Biotechnology: "bg-[#FF9F4C]/15 text-[#C46A10]",
};

const SUBJECT_GRADIENTS: Record<SimSubject, string> = {
  Physics: "from-[#FF9F4C]/10 via-[#FF9F4C]/3 to-transparent",
  Chemistry: "from-[#FFB366]/10 via-[#FFB366]/3 to-transparent",
  Math: "from-[#E8852E]/10 via-[#E8852E]/3 to-transparent",
  Biology: "from-[#FFD4A8]/15 via-[#FFD4A8]/3 to-transparent",
  Biotechnology: "from-[#FF9F4C]/12 via-[#FF9F4C]/3 to-transparent",
};

const SUBJECT_ICON_COLORS: Record<SimSubject, string> = {
  Physics: "text-[#FF9F4C]",
  Chemistry: "text-[#FFB366]",
  Math: "text-[#E8852E]",
  Biology: "text-[#D4761A]",
  Biotechnology: "text-[#C46A10]",
};

const SIM_ICONS: Record<string, LucideIcon> = {
  "build-an-atom": Atom,
  "ph-scale": TestTube2,
  "ph-scale-basics": TestTube2,
  "states-of-matter": Thermometer,
  "states-of-matter-basics": Thermometer,
  "balancing-chemical-equations": Beaker,
  concentration: TestTube2,
  "molecule-shapes": Atom,
  "molecule-shapes-basics": Atom,
  "gas-properties": Beaker,
  molarity: Beaker,
  "reactants-products-and-leftovers": Beaker,
  "acid-base-solutions": TestTube2,
  solutions: Beaker,
  density: Weight,
  "beers-law-lab": FlaskRound,
  "molecule-polarity": Atom,
  "ionic-bonds": Atom,
  "covalent-bonds": Atom,
  "electron-domain": Atom,
  "forces-and-motion-basics": Weight,
  "energy-skate-park-basics": Zap,
  "energy-skate-park": Zap,
  "projectile-motion": Orbit,
  "pendulum-lab": Waves,
  "circuit-construction-kit-dc": CircuitBoard,
  "circuit-construction-kit-ac": CircuitBoard,
  "wave-on-a-string": Waves,
  "wave-interference": Waves,
  "gravity-and-orbits": Orbit,
  "energy-forms-and-changes": Thermometer,
  "masses-and-springs": Magnet,
  "masses-and-springs-basics": Magnet,
  "color-vision": Waves,
  "coulombs-law": Zap,
  "my-solar-system": Orbit,
  "ohms-law": CircuitBoard,
  "faradays-law": Magnet,
  "blackbody-spectrum": Waves,
  "geometric-optics": Waves,
  "natural-selection": Rabbit,
  "gene-expression-essentials": Dna,
  neuron: Zap,
  "graphing-lines": LineChart,
  "function-builder": FunctionSquare,
  "area-model-multiplication": Shapes,
  "fraction-matcher": Percent,
  "fractions-intro": Percent,
  arithmetic: Calculator,
  "trig-tour": LineChart,
  "area-builder": Ruler,
  "plinko-probability": Shapes,
};

const SUBJECT_FALLBACK_ICON: Record<SimSubject, LucideIcon> = {
  Physics: Magnet,
  Chemistry: TestTube2,
  Math: Calculator,
  Biology: Dna,
  Biotechnology: FlaskConical,
};

const V2_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Microscopy: Microscope,
  "Plant Biology": Leaf,
  "Cell Biology": FlaskRound,
  Genetics: Dna,
  Chemistry: TestTube2,
  Biochemistry: FlaskRound,
  "Medical Science": Heart,
  Epidemiology: Bug,
};

const V2_CATEGORY_GRADIENTS: Record<string, string> = {
  Microscopy: "from-[#FF9F4C]/15 via-[#FF9F4C]/5 to-transparent",
  "Plant Biology": "from-[#D4761A]/15 via-[#D4761A]/5 to-transparent",
  "Cell Biology": "from-[#FFB366]/15 via-[#FFB366]/5 to-transparent",
  Genetics: "from-[#E8852E]/15 via-[#E8852E]/5 to-transparent",
  Chemistry: "from-[#FF9F4C]/15 via-[#FF9F4C]/5 to-transparent",
  Biochemistry: "from-[#C46A10]/15 via-[#C46A10]/5 to-transparent",
  "Medical Science": "from-[#E8852E]/15 via-[#E8852E]/5 to-transparent",
  Epidemiology: "from-[#D4761A]/15 via-[#D4761A]/5 to-transparent",
};

type Tab = "phet" | "interactive";

export default function VirtualLab() {
  const [tab, setTab] = useState<Tab>("phet");
  const [activeSubject, setActiveSubject] = useState<SimSubject | "All">("All");
  const [v2Filter, setV2Filter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [activeV2Id, setActiveV2Id] = useState<string | null>(null);
  const [iframeFailed, setIframeFailed] = useState(false);

  const filtered = useMemo(() => {
    return SIMULATIONS.filter((sim) => {
      const matchesSubject = activeSubject === "All" || sim.subject === activeSubject;
      const matchesQuery = query.trim().length === 0 || sim.name.toLowerCase().includes(query.toLowerCase()) || sim.description.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesQuery;
    });
  }, [activeSubject, query]);

  const v2Categories = ["All", ...Array.from(new Set(SIMS_V2.map((s) => s.category)))];
  const filteredV2 = v2Filter === "All" ? SIMS_V2 : SIMS_V2.filter((s) => s.category === v2Filter);

  const activeSim = SIMULATIONS.find((s) => s.id === activeSimId) ?? null;
  const activeV2Sim = activeV2Id ? getSimV2(activeV2Id) : null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <ToolHeader
        title="Virtual Science Lab"
        description="PhET simulations + 12 interactive biology, chemistry & genetics experiments"
        icon={FlaskConical}
      />

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "phet" as Tab, label: "PhET Simulations", count: SIMULATIONS.length, icon: Atom },
          { id: "interactive" as Tab, label: "Interactive Labs", count: SIMS_V2.length, icon: Rocket },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === t.id ? {
              background: "linear-gradient(135deg, #FF9F4C, #E8852E)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(255,159,76,0.3)",
            } : {
              background: "rgba(255,255,255,0.5)",
              border: "2px solid #2D2D2D",
              color: "#6B6B6B",
            }}
          >
            <t.icon size={16} />
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ PhET Tab ═══ */}
      {tab === "phet" && (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,159,76,0.08)", border: "2px solid #2D2D2D", color: "#E8852E" }}
            >
              {SIMULATIONS.length} PhET Simulations
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "#9A9A9A" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search PhET simulations..."
                className="w-full rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "#2D2D2D",
                  ["--tw-ring-color" as string]: "rgba(255,159,76,0.4)",
                }}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["All", ...SIM_SUBJECTS] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSubject(s)}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  style={activeSubject === s ? {
                    background: "#FF9F4C",
                    color: "#FFFFFF",
                    boxShadow: "0 0 10px rgba(255,159,76,0.25)",
                  } : {
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    color: "#6B6B6B",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20"
          >
            {filtered.map((sim) => {
              const SimIcon = SIM_ICONS[sim.id] ?? SUBJECT_FALLBACK_ICON[sim.subject];
              return (
                <motion.button
                  key={sim.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  onClick={() => { setIframeFailed(false); setActiveSimId(sim.id); }}
                  className="group text-left rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "2px solid #2D2D2D",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                    backdropFilter: "blur(20px) saturate(180%)",
                  }}
                >
                  <div
                    className={cn(
                      "relative h-32 flex items-center justify-center bg-gradient-to-br overflow-hidden",
                      SUBJECT_GRADIENTS[sim.subject]
                    )}
                  >
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`sim-grid-${sim.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M0 24L24 0H12L0 12M24 24V12L12 24" stroke="currentColor" strokeWidth="1" fill="none" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#sim-grid-${sim.id})`} />
                      </svg>
                    </div>
                    <SimIcon
                      size={48}
                      className={cn(
                        "stroke-[1.25] relative z-10 transition-transform duration-300 group-hover:scale-110",
                        SUBJECT_ICON_COLORS[sim.subject]
                      )}
                    />
                    <span
                      aria-hidden
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(255,255,255,0.7)" }}
                    >
                      <Maximize2 size={12} style={{ color: "#FF9F4C" }} />
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", SUBJECT_COLORS[sim.subject])}>
                        {sim.subject}
                      </span>
                      {sim.difficulty && (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          sim.difficulty === "Beginner" && "bg-[#FFB366]/10 text-[#D4761A]",
                          sim.difficulty === "Intermediate" && "bg-[#FF9F4C]/15 text-[#E8852E]",
                          sim.difficulty === "Advanced" && "bg-[#E8852E]/10 text-[#C46A10]",
                        )}>
                          {sim.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-sm font-medium mb-1 group-hover:text-[#E8852E] transition-colors line-clamp-1"
                      style={{ color: "#2D2D2D" }}
                    >
                      {sim.name}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B6B6B" }}>{sim.description}</p>
                    <div className="mt-3 flex items-center text-xs font-bold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      style={{ color: "#FF9F4C" }}
                    >
                      Launch Simulation
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <Search size={24} style={{ color: "#9A9A9A" }} />
                </div>
                <p className="font-medium text-lg mb-1" style={{ color: "#6B6B6B" }}>No simulations found</p>
                <p className="text-sm" style={{ color: "#9A9A9A" }}>Try a different keyword or subject filter</p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ═══ Interactive Labs Tab ═══ */}
      {tab === "interactive" && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {v2Categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setV2Filter(cat)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                style={{
                  background: v2Filter === cat
                    ? "linear-gradient(135deg, #FF9F4C, #E8852E)"
                    : "rgba(0,0,0,0.04)",
                  color: v2Filter === cat ? "#fff" : "#6B6B6B",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {filteredV2.map((sim, i) => (
              <motion.button
                key={sim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveV2Id(sim.id)}
                className="group text-left rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "2px solid #2D2D2D",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  cursor: "pointer",
                }}
              >
                <div
                  className={cn(
                    "relative h-28 flex items-center justify-center bg-gradient-to-br overflow-hidden",
                    V2_CATEGORY_GRADIENTS[sim.category] ?? "from-[#FF9F4C]/12 via-[#FF9F4C]/3 to-transparent"
                  )}
                >
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`v2-grid-${sim.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                          <path d="M0 24L24 0H12L0 12M24 24V12L12 24" stroke="currentColor" strokeWidth="1" fill="none" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#v2-grid-${sim.id})`} />
                    </svg>
                  </div>
                  {(() => {
                    const V2Icon = V2_CATEGORY_ICONS[sim.category] ?? FlaskRound;
                    return (
                      <V2Icon
                        size={48}
                        strokeWidth={1.25}
                        className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: sim.categoryColor }}
                      />
                    );
                  })()}
                  <span
                    className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.8)", color: sim.categoryColor }}
                  >
                    {sim.difficulty}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold mb-1 line-clamp-1"
                    style={{ color: "#2D2D2D", fontFamily: "'Fraunces', serif" }}
                  >
                    {sim.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: "#6B6B6B" }}>
                    {sim.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} style={{ color: "#9A9A9A" }} />
                      <span className="text-[10px]" style={{ color: "#9A9A9A" }}>{sim.duration}</span>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: "#E8852E" }}>
                      Open Lab →
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sim.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{ background: `${sim.categoryColor}15`, color: sim.categoryColor, border: `1px solid ${sim.categoryColor}30` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* ═══ PhET Lightbox ═══ */}
      <AnimatePresence>
        {activeSim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setActiveSimId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white overflow-clip w-full flex flex-col shadow-2xl border-2 border-[#2D2D2D] rounded-2xl h-[100dvh]"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#2D2D2D] shrink-0" style={{ background: "rgba(255,159,76,0.06)" }}>
                <div className="flex items-center gap-3">
                  <p className="font-serif text-lg leading-none text-[#FF9F4C]">{activeSim.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSimId(null)}
                    className="w-9 h-9 rounded-lg bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} className="text-[#6B6B6B]" />
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                {iframeFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center">
                      <ExternalLink size={28} className="text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 font-medium text-center max-w-sm">
                      This simulation cannot be embedded. PhET blocks iframe loading.
                    </p>
                    <button
                      onClick={() => window.open(simEmbedUrl(activeSim.slug), "_blank", "noopener,noreferrer")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink size={15} /> Open on PhET Website
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={simEmbedUrl(activeSim.slug)}
                    title={activeSim.name}
                    className="absolute inset-0 w-full h-full border-0 bg-white"
                    allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                    referrerPolicy="no-referrer"
                    onError={() => setIframeFailed(true)}
                  />
                )}
              </div>
            </motion.div>
            <div
              className="fixed bottom-0 left-0 w-full z-[9999] bg-white/80 backdrop-blur-xl"
              style={{ height: "56px", borderTop: "2px solid #2D2D2D" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Interactive Sim Lightbox ═══ */}
      <AnimatePresence>
        {activeV2Sim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setActiveV2Id(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white overflow-clip w-full flex flex-col shadow-2xl border-2 border-[#2D2D2D] rounded-2xl h-[100dvh]"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#2D2D2D] shrink-0" style={{ background: "rgba(255,159,76,0.06)" }}>
                <div className="flex items-center gap-3">
                  {(() => {
                    const LbIcon = V2_CATEGORY_ICONS[activeV2Sim.category] ?? FlaskRound;
                    return <LbIcon size={20} strokeWidth={1.5} style={{ color: activeV2Sim.categoryColor }} />;
                  })()}
                  <div>
                    <p className="font-serif text-lg leading-none text-[#FF9F4C]">{activeV2Sim.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${activeV2Sim.categoryColor}20`, color: activeV2Sim.categoryColor }}>
                        {activeV2Sim.category}
                      </span>
                      <span className="text-[10px]" style={{ color: "#9A9A9A" }}>{activeV2Sim.duration}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveV2Id(null)}
                  className="w-9 h-9 rounded-lg bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X size={18} className="text-[#6B6B6B]" />
                </button>
              </div>
              <div className="flex-1 relative overflow-auto p-4" style={{ background: "#FFF8F0" }}>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mx-auto mb-3"
                          style={{ borderColor: "#E8852E", borderTopColor: "transparent" }} />
                        <p className="text-xs" style={{ color: "#9A9A9A" }}>Loading simulation...</p>
                      </div>
                    </div>
                  }
                >
                  <activeV2Sim.component />
                </Suspense>
              </div>
            </motion.div>
            <div
              className="fixed bottom-0 left-0 w-full z-[9999] bg-white/80 backdrop-blur-xl"
              style={{ height: "56px", borderTop: "2px solid #2D2D2D" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
