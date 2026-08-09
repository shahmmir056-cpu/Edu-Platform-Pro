import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen, PenTool, HelpCircle, Layers, ClipboardList,
  FlaskConical, Sigma, Gamepad2, ClipboardCheck, Brain,
  ArrowRight, Zap, Sparkles, Rocket, ChevronRight,
  GraduationCap, Star, MessageSquareHeart, Quote,
} from "lucide-react";

const C = {
  bg: "#FFF8F0",
  orange: "#FF9F4C",
  orangeDark: "#E8852E",
  cream: "#FFD4A8",
  text: "#2D2D2D",
  muted: "#6B6B6B",
  faint: "#9A9A9A",
};

const TOOLS = [
  { name: "Deep Research", path: "/research", icon: BookOpen, color: C.orange, tag: "Research" },
  { name: "Essay Writer", path: "/essay", icon: PenTool, color: C.orangeDark, tag: "Writing" },
  { name: "Math Solver", path: "/math-solver", icon: Sigma, color: C.orange, tag: "Popular" },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical, color: C.cream, tag: "Explore" },
  { name: "Quiz Generator", path: "/quiz", icon: HelpCircle, color: C.orange, tag: "Study" },
  { name: "Flashcards", path: "/flashcards", icon: Layers, color: C.orange, tag: "Study" },
  { name: "Study Notes", path: "/study-notes", icon: ClipboardList, color: C.orange, tag: "Study" },
  { name: "Study Games", path: "/study-games", icon: Gamepad2, color: C.orangeDark, tag: "Fun" },
  { name: "Test Conductor", path: "/test-conductor", icon: ClipboardCheck, color: C.cream, tag: "New" },
  { name: "AI Debate", path: "/debate-mentor", icon: Brain, color: C.orangeDark, tag: "New" },
];

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.88 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } } };

function useInView(ref: React.RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 30% 20%, rgba(255,159,76,0.04), transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 100% at 80% 80%, rgba(255,212,168,0.04), transparent 60%)" }} />
    </div>
  );
}

function AnimatedGradientText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className} style={{ background: "linear-gradient(135deg, #FF9F4C, #FFD4A8, #E8852E, #FF9F4C)", backgroundSize: "300% 300%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {text}
    </span>
  );
}

function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref);
  const num = parseInt(value) || 0;
  useEffect(() => {
    if (!inView) return;
    if (num === 0) { setDisplay("0"); return; }
    const steps = 40;
    const interval = 1200 / steps;
    let current = 0;
    const t = setInterval(() => {
      current++;
      setDisplay(current >= steps ? String(num) : String(Math.floor((num / steps) * current)));
      if (current >= steps) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
  }, [inView, num]);
  return <span ref={ref}>{display}{suffix}</span>;
}

interface FeedbackEntry {
  id: string;
  name: string;
  rating: number;
  category: string;
  message: string;
}

const MOBILE_CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  ux: "UX / Design",
  "ai-quality": "AI Quality",
  general: "General",
};

const MOBILE_API_BASE = import.meta.env.VITE_API_URL || "https://acceptable-charm-production-2ace.up.railway.app";

function MobileFeedbackSection() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${MOBILE_API_BASE}/api/feedback`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load feedback");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setEntries(Array.isArray(data.entries) ? data.entries.slice(0, 4) : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="relative py-10 px-5 overflow-hidden">
      <AnimatedBackground />
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="max-w-sm mx-auto">
        <motion.h2 variants={fadeUp} className="text-lg font-serif font-medium mb-1 flex items-center gap-2.5" style={{ color: C.text }}>
          <motion.div className="w-1 h-5 rounded-full" style={{ background: C.orange }} />
          What Students Say
        </motion.h2>
        <motion.p variants={fadeUp} className="text-xs mb-5" style={{ color: C.muted }}>
          Real feedback from the Neural Sync community.
        </motion.p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#FF9F4C]/20 border-t-[#FF9F4C] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <motion.div variants={fadeUp} className="rounded-2xl p-5 text-center"
            style={{ background: "rgba(255,255,255,0.45)", border: "1.5px solid rgba(45,45,45,0.1)" }}>
            <p className="text-xs mb-4" style={{ color: C.muted }}>Be the first to share your thoughts on Neural Sync.</p>
            <Link href="/contact" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
              <MessageSquareHeart size={13} /> Share Feedback
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <motion.div key={entry.id} variants={fadeUp}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.45)", border: "1.5px solid rgba(45,45,45,0.1)" }}>
                <Quote size={15} className="mb-2" style={{ color: "rgba(255,159,76,0.5)" }} />
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.text }}>
                  "{entry.message}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
                      {(entry.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={11}
                        className={star <= entry.rating ? "fill-current" : "text-[#D8D8D8]"}
                        style={star <= entry.rating ? { color: "#FF9F4C" } : undefined} />
                    ))}
                  </div>
                </div>
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${C.orange}10`, color: C.orangeDark, border: `1px solid ${C.orange}20` }}>
                  {MOBILE_CATEGORY_LABELS[entry.category] || entry.category}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

export default function MobileHome() {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100); }, []);

  return (
    <div className="pb-0 overflow-x-hidden" style={{ background: C.bg }}>

      {/* ═══ HERO ═══ */}
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh] overflow-hidden pt-16 pb-8" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFF0E0 100%)" }}>
        <AnimatedBackground />

        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(255,248,240,0.5) 70%, rgba(255,248,240,1) 95%)" }} />

        <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={heroLoaded ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center w-full max-w-sm mt-auto px-6 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(45,45,45,0.15)" }}>
            <Sparkles size={12} style={{ color: C.orange }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: C.orange }}>AI-Powered Learning</span>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 15 }} animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: C.muted }}>
            <span>10 AI tools</span> · 50+ virtual labs ·{" "}
            <span>100% free</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 w-full max-w-[280px]">
            <Link href="/math-solver"
              className="group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold overflow-hidden transition-all duration-300 active:scale-95"
              style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "0 4px 20px rgba(255,159,76,0.3)" }}>
              <Zap size={16} className="relative z-10" />
              <span className="relative z-10">Get Started Free</span>
              <ArrowRight size={14} className="relative z-10" />
            </Link>
            <Link href="/virtual-lab"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95"
              style={{ background: "rgba(255,255,255,0.5)", color: C.text, border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
              <FlaskConical size={16} style={{ color: C.orange }} /> Explore Virtual Lab
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ TOOL CAROUSEL ═══ */}
      <section className="relative py-8 px-5 overflow-hidden">
        <AnimatedBackground />
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full" style={{ background: C.orange }} />
              <h2 className="text-lg font-serif font-medium" style={{ color: C.text }}>Your tools</h2>
            </div>
            <Link href="/virtual-lab" className="flex items-center gap-0.5 text-xs font-semibold group" style={{ color: C.orange }}>
              <span>See all</span>
              <ChevronRight size={12} />
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="relative">
            <motion.div className="flex gap-3" drag="x"
              dragConstraints={{ left: -(TOOLS.length - 2.5) * 175, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x < -threshold) setCarouselIdx((p) => Math.min(p + 1, TOOLS.length - 3));
                if (info.offset.x > threshold) setCarouselIdx((p) => Math.max(p - 1, 0));
              }}
              animate={{ x: -carouselIdx * 175 }}
              transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}>
              {TOOLS.map((tool, i) => {
                const isFocused = i >= carouselIdx && i < carouselIdx + 2.5;
                return (
                  <motion.div key={tool.path}
                    animate={{ scale: isFocused ? 1 : 0.92, opacity: isFocused ? 1 : 0.4 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={tool.path}
                      className="block w-[160px] rounded-2xl p-4 transition-all duration-300"
                      style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.03)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${tool.color}12`, border: `1px solid ${tool.color}20` }}>
                        <tool.icon size={18} style={{ color: tool.color }} />
                      </div>
                      <span className="block text-[11px] font-bold mb-1.5 leading-tight" style={{ color: C.text }}>{tool.name}</span>
                      <span className="inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.orange}10`, color: C.orange }}>{tool.tag}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: TOOLS.length - 2 }).map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === carouselIdx ? 20 : 6, height: 6, background: i === carouselIdx ? C.orange : "rgba(0,0,0,0.08)" }} />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative py-10 px-5 overflow-hidden">
        <AnimatedBackground />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {[
            { value: "10", label: "AI Tools", icon: Brain, color: C.orange },
            { value: "50+", label: "Simulations", icon: FlaskConical, color: C.orangeDark },
            { value: "0", label: "Sign-ups Needed", icon: Star, color: C.orange },
            { value: "24/7", label: "Free Access", icon: Rocket, color: C.cream },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-5 text-center relative overflow-hidden group"
              style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
              <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}06, transparent 70%)` }} />
              <div className="relative z-10 mx-auto mb-2 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}15` }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <p className="relative z-10 text-2xl font-serif font-bold mb-0.5" style={{ color: s.color }}>
                <CountUp value={s.value} />
              </p>
              <p className="relative z-10 text-xs font-medium" style={{ color: C.muted }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="relative py-6 px-5 overflow-hidden">
        <AnimatedBackground />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="space-y-3 max-w-sm mx-auto">
          <motion.h2 variants={fadeUp} className="text-lg font-serif font-medium mb-4 flex items-center gap-2.5" style={{ color: C.text }}>
            <div className="w-1 h-5 rounded-full" style={{ background: C.orange }} />
            Why Neural Sync?
          </motion.h2>
          {[
            { icon: Brain, title: "AI That Teaches Back", desc: "Explain any topic in your own words — the AI checks your understanding in real time.", color: C.orange },
            { icon: Sigma, title: "Step-by-Step Math", desc: "Every answer comes with full reasoning shown, not just the final result.", color: C.orangeDark },
            { icon: FlaskConical, title: "60+ Hands-on Labs", desc: "Drag, click, and explore real biology, chemistry & physics simulations instantly.", color: C.cream },
          ].map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} whileTap={{ scale: 0.98 }}
              className="flex items-start gap-4 rounded-2xl p-4 relative overflow-hidden group cursor-pointer transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.45)", border: "1.5px solid rgba(45,45,45,0.1)" }}>
              <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 0% 50%, ${f.color}06, transparent 70%)` }} />
              <div className="relative z-10 w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-0.5" style={{ color: C.text }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{f.desc}</p>
              </div>
              <div className="relative z-10 self-center shrink-0" style={{ color: C.faint }}>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <section className="relative py-10 px-5 overflow-hidden">
        <AnimatedBackground />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm mx-auto rounded-[1.5rem] p-7 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,248,240,0.8), rgba(255,255,255,0.5))", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <div className="relative z-10">
            <div className="mx-auto mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${C.orange}10`, border: `1px solid ${C.orange}20` }}>
              <GraduationCap size={20} style={{ color: C.orange }} />
            </div>
          </div>
          <p className="relative z-10 text-sm leading-relaxed mb-5 italic" style={{ color: C.muted }}>
            "Learning happens when you <strong style={{ color: C.orange }}>see, explore, and build</strong> — not when you memorize."
          </p>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link href="/about" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)", color: "#fff", boxShadow: "0 2px 12px rgba(255,159,76,0.2)" }}>
              Read Our Story <ArrowRight size={12} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <MobileFeedbackSection />

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-10 px-5 pb-28 overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm mx-auto rounded-[1.5rem] p-7 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "0 8px 40px rgba(255,159,76,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="relative z-10">
            <div className="mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Rocket size={24} style={{ color: "#fff" }} />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2" style={{ color: "#fff" }}>Ready to begin?</h2>
            <p className="text-sm leading-relaxed mb-6 max-w-[240px] mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
              No sign-ups, no paywalls. Just pick a tool and start learning right now.
            </p>
            <Link href="/math-solver" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300"
              style={{ background: "#fff", color: C.orangeDark, border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <Zap size={16} /> Start Learning Free
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
