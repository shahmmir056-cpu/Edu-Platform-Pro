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
  type LucideIcon,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { SIMULATIONS, SIM_SUBJECTS, simEmbedUrl, type SimSubject } from "@/lib/simulations";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS: Record<SimSubject, string> = {
  Physics: "bg-blue-500/10 text-blue-700",
  Chemistry: "bg-emerald-500/10 text-emerald-700",
  Math: "bg-orange-500/10 text-orange-700",
  Biology: "bg-purple-500/10 text-purple-700",
};

const SUBJECT_GRADIENTS: Record<SimSubject, string> = {
  Physics: "from-blue-500/15 via-blue-500/5 to-transparent",
  Chemistry: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  Math: "from-orange-500/15 via-orange-500/5 to-transparent",
  Biology: "from-purple-500/15 via-purple-500/5 to-transparent",
};

const SUBJECT_ICON_COLORS: Record<SimSubject, string> = {
  Physics: "text-blue-600",
  Chemistry: "text-emerald-600",
  Math: "text-orange-600",
  Biology: "text-purple-600",
};

const SIM_ICONS: Record<string, LucideIcon> = {
  "build-an-atom": Atom,
  "ph-scale": TestTube2,
  "states-of-matter": Thermometer,
  "balancing-chemical-equations": Beaker,
  concentration: TestTube2,
  "molecule-shapes": Atom,
  "forces-and-motion-basics": Weight,
  "energy-skate-park-basics": Zap,
  "projectile-motion": Orbit,
  "pendulum-lab": Waves,
  "circuit-construction-kit-dc": CircuitBoard,
  "wave-on-a-string": Waves,
  "wave-interference": Waves,
  "gravity-and-orbits": Orbit,
  "energy-forms-and-changes": Thermometer,
  "masses-and-springs": Magnet,
  "gas-properties": Beaker,
  "graphing-lines": LineChart,
  "function-builder": FunctionSquare,
  "area-model-multiplication": Shapes,
  "fraction-matcher": Percent,
  "fractions-intro": Percent,
  arithmetic: Calculator,
  "trig-tour": LineChart,
  "area-builder": Ruler,
  "natural-selection": Rabbit,
  "gene-expression-essentials": Dna,
};

const SUBJECT_FALLBACK_ICON: Record<SimSubject, LucideIcon> = {
  Physics: Magnet,
  Chemistry: TestTube2,
  Math: Calculator,
  Biology: Dna,
};

export default function VirtualLab() {
  const [activeSubject, setActiveSubject] = useState<SimSubject | "All">("All");
  const [query, setQuery] = useState("");
  const [activeSimId, setActiveSimId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SIMULATIONS.filter((sim) => {
      const matchesSubject = activeSubject === "All" || sim.subject === activeSubject;
      const matchesQuery = query.trim().length === 0 || sim.name.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesQuery;
    });
  }, [activeSubject, query]);

  const activeSim = SIMULATIONS.find((s) => s.id === activeSimId) ?? null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <ToolHeader
        title="Virtual Science Lab"
        description="Real, interactive PhET simulations for physics, chemistry, biology, and math — right in your browser."
        icon={FlaskConical}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search simulations (e.g. pendulum, atom, fractions)..."
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
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
      >
        {filtered.map((sim) => {
          const SimIcon = SIM_ICONS[sim.id] ?? SUBJECT_FALLBACK_ICON[sim.subject];
          return (
            <motion.button
              key={sim.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              onClick={() => setActiveSimId(sim.id)}
              className="group text-left bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
            >
              <div
                className={cn(
                  "relative h-36 flex items-center justify-center bg-gradient-to-br overflow-hidden",
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
                  size={56}
                  className={cn(
                    "stroke-[1.25] relative z-10 transition-transform duration-300 group-hover:scale-110",
                    SUBJECT_ICON_COLORS[sim.subject]
                  )}
                />
                <span
                  aria-hidden
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 size={14} className="text-foreground" />
                </span>
              </div>
              <div className="p-6">
                <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", SUBJECT_COLORS[sim.subject])}>
                  {sim.subject}
                </span>
                <h3 className="font-serif text-lg font-medium text-foreground mt-3 mb-2 group-hover:text-primary transition-colors">
                  {sim.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{sim.description}</p>
                <div className="mt-5 flex items-center text-sm font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  Launch Simulation
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-8"
            onClick={() => setActiveSimId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-card-border"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-sidebar text-sidebar-foreground">
                <div>
                  <p className="font-serif text-lg leading-none">{activeSim.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSimId(null)}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <iframe
                  src={simEmbedUrl(activeSim.slug)}
                  title={activeSim.name}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  style={{ height: "calc(100% + 60px)", marginTop: "-60px" }}
                  allow="fullscreen"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
