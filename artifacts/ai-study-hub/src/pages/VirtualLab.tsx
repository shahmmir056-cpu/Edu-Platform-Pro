import { useMemo, useState } from "react";
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
  Microscope,
  DnaIcon,
  Bug,
  Heart,
  FlaskRound,
  Binary,
  type LucideIcon,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { SIMULATIONS, SIM_SUBJECTS, simEmbedUrl, type SimSubject, type Simulation } from "@/lib/simulations";
import { getCustomSim, CUSTOM_SIM_IDS } from "@/components/lab";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS: Record<SimSubject, string> = {
  Physics: "bg-blue-500/10 text-blue-700",
  Chemistry: "bg-emerald-500/10 text-emerald-700",
  Math: "bg-orange-500/10 text-orange-700",
  Biology: "bg-purple-500/10 text-purple-700",
  Biotechnology: "bg-rose-500/10 text-rose-700",
};

const SUBJECT_GRADIENTS: Record<SimSubject, string> = {
  Physics: "from-blue-500/15 via-blue-500/5 to-transparent",
  Chemistry: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  Math: "from-orange-500/15 via-orange-500/5 to-transparent",
  Biology: "from-purple-500/15 via-purple-500/5 to-transparent",
  Biotechnology: "from-rose-500/15 via-rose-500/5 to-transparent",
};

const SUBJECT_ICON_COLORS: Record<SimSubject, string> = {
  Physics: "text-blue-600",
  Chemistry: "text-emerald-600",
  Math: "text-orange-600",
  Biology: "text-purple-600",
  Biotechnology: "text-rose-600",
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
  "coulomb-and-charge": Zap,
  "ohms-law": CircuitBoard,
  "faradays-law": Magnet,
  "radioactive-date-finding": Thermometer,
  "nuclear-physics": Atom,
  "blackbody-spectrum": Waves,
  "geometric-optics": Waves,
  lasers: Zap,
  "sun-and-spectra": Waves,
  "natural-selection": Rabbit,
  "gene-expression-essentials": Dna,
  "bacterial-growth": Bug,
  "natural-selection-lab": Rabbit,
  "evolution-natural-and-artificial": Rabbit,
  "dna-replication": DnaIcon,
  neuron: Zap,
  "membrane-channels": Dna,
  "gel-electrophoresis": DnaIcon,
  "light-microscope": Microscope,
  "osmosis-sim": Heart,
  "cell-structure": Dna,
  "mitosis-sim": DnaIcon,
  "photosynthesis-sim": Leaf,
  "hardy-weinberg": Rabbit,
  "epidemic-sim": Bug,
  spectrophotometer: FlaskRound,
  "plant-dissection": Leaf,
  "mendelian-genetics": Dna,
  "enzyme-kinetics": FlaskRound,
  "graphing-lines": LineChart,
  "function-builder": FunctionSquare,
  "area-model-multiplication": Shapes,
  "fraction-matcher": Percent,
  "fractions-intro": Percent,
  arithmetic: Calculator,
  "trig-tour": LineChart,
  "area-builder": Ruler,
  radians: Shapes,
  "plinko-probability": Shapes,
  "factor-building": Shapes,
  "unit-circle": LineChart,
};

function Leaf(props: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 2 20 2s-1.5 5-5 7A7 7 0 0 1 11 20Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

const SUBJECT_FALLBACK_ICON: Record<SimSubject, LucideIcon> = {
  Physics: Magnet,
  Chemistry: TestTube2,
  Math: Calculator,
  Biology: Dna,
  Biotechnology: FlaskConical,
};

export default function VirtualLab() {
  const [activeSubject, setActiveSubject] = useState<SimSubject | "All">("All");
  const [query, setQuery] = useState("");
  const [activeSimId, setActiveSimId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SIMULATIONS.filter((sim) => {
      const matchesSubject = activeSubject === "All" || sim.subject === activeSubject;
      const matchesQuery = query.trim().length === 0 || sim.name.toLowerCase().includes(query.toLowerCase()) || sim.description.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesQuery;
    });
  }, [activeSubject, query]);

  const activeSim = SIMULATIONS.find((s) => s.id === activeSimId) ?? null;
  const isCustom = activeSim ? CUSTOM_SIM_IDS.includes(activeSim.id) : false;
  const CustomSimComponent = activeSim ? getCustomSim(activeSim.id) : null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <ToolHeader
        title="Virtual Science Lab"
        description="Interactive PhET simulations, custom lab experiments, and biology interactives — all free in your browser."
        icon={FlaskConical}
      />

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {SIMULATIONS.length} Simulations
        </div>
        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {SIMULATIONS.filter((s) => s.type === "custom").length} Custom Lab Experiments
        </div>
        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {SIMULATIONS.filter((s) => s.type === "phet").length} PhET Simulations
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search simulations (e.g. osmosis, electrophoresis, circuits)..."
            className="w-full bg-card border border-card-border rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["All", ...SIM_SUBJECTS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border",
                activeSubject === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/70 border-card-border hover:border-primary/30"
              )}
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
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20"
      >
        {filtered.map((sim) => {
          const SimIcon = SIM_ICONS[sim.id] ?? SUBJECT_FALLBACK_ICON[sim.subject];
          const isCustomSim = sim.type === "custom";
          return (
            <motion.button
              key={sim.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              onClick={() => setActiveSimId(sim.id)}
              className="group text-left bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
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
                {isCustomSim && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                    Interactive Lab
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 size={12} className="text-foreground" />
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
                      sim.difficulty === "Beginner" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
                      sim.difficulty === "Intermediate" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
                      sim.difficulty === "Advanced" && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
                    )}>
                      {sim.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {sim.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{sim.description}</p>
                <div className="mt-3 flex items-center text-xs font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  {isCustomSim ? "Open Lab" : "Launch Simulation"}
                </div>
              </div>
            </motion.button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Search size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium text-lg mb-1">No simulations found</p>
            <p className="text-sm text-muted-foreground/50">Try a different keyword or subject filter</p>
          </div>
        )}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeSim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveSimId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "bg-card overflow-hidden w-full flex flex-col shadow-2xl border border-card-border",
                isCustom
                  ? "rounded-2xl max-w-5xl mx-auto mt-[5vh] h-[90vh]"
                  : "md:rounded-2xl rounded-t-2xl max-w-5xl absolute inset-x-3 md:inset-x-8 top-3 bottom-0"
              )}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-sidebar text-sidebar-foreground shrink-0">
                <div className="flex items-center gap-3">
                  <p className="font-serif text-lg leading-none">{activeSim.name}</p>
                  {isCustom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full">
                      Interactive Lab
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveSimId(null)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                {isCustom && CustomSimComponent ? (
                  <div className="absolute inset-0 overflow-y-auto p-6">
                    <CustomSimComponent />
                  </div>
                ) : (
                  <iframe
                    src={simEmbedUrl(activeSim.slug)}
                    title={activeSim.name}
                    className="absolute inset-0 w-full h-full border-0 bg-white"
                    allow="fullscreen"
                  />
                )}
              </div>
            </motion.div>

            {!isCustom && (
              <div
                className="fixed bottom-0 left-0 w-full z-[9999] bg-sidebar"
                style={{ height: "56px" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
