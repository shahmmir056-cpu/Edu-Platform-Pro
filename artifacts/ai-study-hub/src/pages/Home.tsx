import React, { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useScroll, useSpring } from "framer-motion";
import {
  BookOpen, PenTool, HelpCircle, Layers, ClipboardList,
  ArrowRight, Sigma, FlaskConical, Shield,
  Gamepad2, ClipboardCheck, Zap, Brain, Eye, Lightbulb, Cpu, Rocket,
  ChevronLeft, ChevronRight, Star, Quote, MessageSquareHeart, CalendarClock,
} from "lucide-react";
import MobileHome from "./MobileHome";
import { Footer } from "@/components/layout/Footer";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const C = {
  orange: "#FF9F4C", cyan: "#FFD4A8", indigo: "#E8852E",
  sky: "#FFB366", blueLight: "#FFCA80", ice: "#FFF3E0",
  darkSlate: "#FF9F4C", coolGray: "#6B6B6B",
  primary: "#FF9F4C", primaryDark: "#E8852E",
};

const SHOWCASE_TOOLS = [
  { name: "Life OS", path: "/life-os", icon: CalendarClock, desc: "Your AI Routine Architect — minute-level schedules, live adaptation, mission mode & a Future Self that never lets you quit.", iconColor: C.primary, tag: "Flagship" },
  { name: "Deep Research Assistant", path: "/research", icon: BookOpen, desc: "Generate structured, academic-grade research reports on any topic.", iconColor: C.orange, tag: "Research" },
  { name: "Essay Writer", path: "/essay", icon: PenTool, desc: "Draft complete essays with outlines, tailored to specific styles and word counts.", iconColor: C.indigo, tag: "Writing" },
  { name: "Math Solver", path: "/math-solver", icon: Sigma, desc: "Type any equation or word problem and get a clean, numbered step-by-step solution.", iconColor: C.sky, tag: "Popular" },
  { name: "Virtual Lab", path: "/virtual-lab", icon: FlaskConical, desc: "49 PhET simulations + 12 interactive biology, chemistry & genetics experiments.", iconColor: C.cyan, tag: "Explore" },
  { name: "Quiz Generator", path: "/quiz", icon: HelpCircle, desc: "Test your knowledge with interactive multiple-choice quizzes and explanations.", iconColor: C.blueLight, tag: "Study" },
  { name: "Flashcard Deck", path: "/flashcards", icon: Layers, desc: "Instantly create flippable flashcards for rapid memorization and recall.", iconColor: C.sky, tag: "Study" },
  { name: "Study Notes", path: "/study-notes", icon: ClipboardList, desc: "Turn complex topics into structured notes with key terms and bullet points.", iconColor: C.orange, tag: "Study" },
  { name: "Study Games", path: "/study-games", icon: Gamepad2, desc: "Gamified learning with vocabulary matching, flashcard challenges, and timed quizzes.", iconColor: C.indigo, tag: "Fun" },
  { name: "Test Conductor", path: "/test-conductor", icon: ClipboardCheck, desc: "Practice exams with MCQ, true/false, fill-in-the-blank, and essay questions.", iconColor: C.cyan, tag: "New" },
  { name: "AI Debate Mentor", path: "/debate-mentor", icon: Brain, desc: "Speak with an AI that challenges your thinking, debates ideas, and builds critical thinking.", iconColor: C.indigo, tag: "New" },
];

interface FeedbackEntry {
  id: string;
  name: string;
  rating: number;
  category: string;
  message: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  ux: "UX / Design",
  "ai-quality": "AI Quality",
  general: "General",
};

const API_BASE = import.meta.env.VITE_API_URL || "";

function FeedbackSection() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/feedback`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load feedback");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setEntries(Array.isArray(data.entries) ? data.entries.slice(0, 6) : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="px-4 sm:px-6 py-24 md:py-32 max-w-7xl mx-auto">
      <motion.div className="mb-14 text-center max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <motion.p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.orange }}
          animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          Feedback
        </motion.p>
        <h2 className="text-3xl md:text-5xl font-serif mb-4" style={{ color: C.darkSlate }}>What Students Say</h2>
        <p style={{ color: "#6B6B6B" }} className="text-base sm:text-lg">
          Real feedback from the Neural Sync community — submitted right from our Feedback page.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-[#FF9F4C]/20 border-t-[#FF9F4C] rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center rounded-2xl p-10"
          style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,159,76,0.1)", color: C.primary }}>
            <MessageSquareHeart size={26} />
          </div>
          <h3 className="font-serif text-xl mb-2" style={{ color: C.darkSlate }}>No feedback yet</h3>
          <p className="text-sm mb-6" style={{ color: "#6B6B6B" }}>
            Be the first to tell us what you think of Neural Sync.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
            Share Your Feedback <ArrowRight size={15} />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((entry, i) => (
            <motion.div key={entry.id}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1"
              style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.04), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
              <Quote size={22} className="mb-3" style={{ color: "rgba(255,159,76,0.5)" }} />
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14}
                    className={star <= entry.rating ? "fill-current" : "text-[#D8D8D8]"}
                    style={star <= entry.rating ? { color: "#FF9F4C" } : undefined} />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#4B4B4B" }}>
                "{entry.message}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
                    {(entry.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: C.darkSlate }}>
                    {entry.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: `${C.orange}08`, color: C.primary, border: `1px solid ${C.orange}15` }}>
                  {CATEGORY_LABELS[entry.category] || entry.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

/* ─── Interactive Card with enhanced 3D tilt ─── */
function InteractiveCard({ children, className, style, intensity = 4 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; intensity?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0); mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div ref={cardRef} className={className} style={{ ...style, rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </motion.div>
  );
}

/* ─── Magnetic button wrapper ─── */
function MagneticButton({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 20 });
  const x = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const y = useTransform(springY, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

  return (
    <motion.div ref={ref} className={className} style={{ ...style, x, y, transition: "none" } as any}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
    </motion.div>
  );
}



/* ─── Shimmer overlay ─── */
function ShimmerOverlay({ color = "rgba(255,159,76,0.04)" }) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]"
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.6 }}>
      <motion.div className="absolute inset-0" style={{ background: `linear-gradient(105deg, transparent 30%, ${color} 50%, transparent 70%)` }}
        animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
    </motion.div>
  );
}

/* ─── Animated gradient border ─── */
function AnimatedBorder() {
  return (
    <motion.div className="absolute inset-0 rounded-[inherit] pointer-events-none"
      style={{ padding: "2px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }}
      animate={{ background: ["linear-gradient(135deg, #FF9F4C, #FFD4A8, #E8852E, #FF9F4C)", "linear-gradient(135deg, #E8852E, #FF9F4C, #FFD4A8, #E8852E)", "linear-gradient(135deg, #FF9F4C, #FFD4A8, #E8852E, #FF9F4C)"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

export default function Home() {
  const shouldAnimate = !isMobile;
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: shouldAnimate ? 100 : 0, damping: shouldAnimate ? 30 : 0 });
  const visionImgParallax = useTransform(smoothScroll, [0.15, 0.45], [0, shouldAnimate ? -60 : 0]);
  const visionImgScale = useTransform(smoothScroll, [0.15, 0.45], [1, shouldAnimate ? 1.08 : 1]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const maxIdx = Math.max(0, SHOWCASE_TOOLS.length - 3);

  return (
    <>
    <div className="sm:hidden"><MobileHome /></div>
    <div className="hidden sm:block pb-0 overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ minHeight: "100dvh", background: "#F5EDE4" }}>
        {/* Ambient glow behind headline */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{ background: "radial-gradient(circle, rgba(255,159,76,0.08) 0%, rgba(255,212,168,0.04) 40%, transparent 70%)" }} />

        {/* Pulsing glow ring */}
        <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{ border: "1px solid rgba(255,159,76,0.06)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0"
          style={{ border: "1px solid rgba(255,159,76,0.04)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.08, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Floating glass feature cards — left */}
        {[
          { label: "AI Tutor", icon: Brain, top: "18%", left: "6%", delay: 2.6 },
          { label: "Virtual Labs", icon: FlaskConical, top: "55%", left: "3%", delay: 3.0 },
        ].map(({ label, icon: Icon, top, left, delay }, i) => (
          <motion.div key={i}
            className="absolute z-[2] hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-xl pointer-events-none"
            style={{ top, left, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 8px 32px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)" }}
            initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{ opacity: { duration: 0.6, delay }, y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay } }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>
              <Icon size={15} />
            </div>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: "#5A5A5A" }}>{label}</span>
          </motion.div>
        ))}

        {/* Floating glass feature cards — right */}
        {[
          { label: "Smart Notes", icon: PenTool, top: "22%", right: "5%", delay: 2.8 },
          { label: "Exam Prep", icon: ClipboardCheck, top: "60%", right: "3%", delay: 3.2 },
        ].map(({ label, icon: Icon, top, right, delay }, i) => (
          <motion.div key={i}
            className="absolute z-[2] hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-xl pointer-events-none"
            style={{ top, right, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 8px 32px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)" }}
            initial={{ opacity: 0, x: 20, y: 10 }} animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{ opacity: { duration: 0.6, delay }, y: { duration: 4.5 + i, repeat: Infinity, ease: "easeInOut", delay } }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>
              <Icon size={15} />
            </div>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: "#5A5A5A" }}>{label}</span>
          </motion.div>
        ))}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex-1 flex items-center">
          <div className="w-full max-w-3xl mx-auto pt-24 pb-16 text-center">
            {/* ═══ Editorial Content ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}>
              {/* Premium badge */}
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] mb-8"
                style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.1), rgba(232,133,46,0.05))", border: "1px solid rgba(255,159,76,0.12)", color: "#FF9F4C" }}
                initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF9F4C" }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                AI-Powered Smart Learning Platform
              </motion.div>

              {/* Cinematic headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif leading-[0.95] tracking-[-0.03em] mb-5 overflow-hidden" style={{ color: "#1A1A1A" }}>
                {"Learn".split("").map((ch, i) => (
                  <motion.span key={`l-${i}`} className="inline-block"
                    initial={{ opacity: 0, y: 80, rotateZ: -3 }} animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                    transition={{ duration: 0.9, delay: 0.4 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}>
                    {ch}
                  </motion.span>
                ))}
                <span className="inline-block mx-[0.08em]">
                  <motion.span className="inline-block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #FF9F4C 0%, #E8852E 50%, #FFB366 100%)" }}
                    initial={{ opacity: 0, y: 80, rotateZ: -3 }} animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                    transition={{ duration: 0.9, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}>
                    Smarter
                  </motion.span>
                </span>
                <span className="inline-block mx-[0.08em]">
                  <motion.span className="inline-block"
                    initial={{ opacity: 0, y: 80, rotateZ: -3 }} animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                    transition={{ duration: 0.9, delay: 0.88, ease: [0.16, 1, 0.3, 1] }}>
                    with
                  </motion.span>
                </span>
                <span className="inline-block">
                  <motion.span className="inline-block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #FF9F4C 0%, #E8852E 50%, #FFD4A8 100%)" }}
                    initial={{ opacity: 0, y: 80, rotateZ: -3 }} animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                    transition={{ duration: 0.9, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}>
                    AI.
                  </motion.span>
                  <motion.span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#FF9F4C]/30"
                    initial={{ scaleX: 0, transformOrigin: "left" }} animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, delay: 1.4, ease: [0.16, 1, 0.3, 1] }} />
                </span>
              </h1>

              {/* Subheadline */}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-serif leading-tight mb-6 overflow-hidden" style={{ color: "#5A5A5A" }}>
                {"The Future of Education is Here".split(" ").map((word, i) => (
                  <motion.span key={`sh-${i}`} className="inline-block mr-[0.3em]"
                    initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>
                    {word}
                  </motion.span>
                ))}
              </h2>

              {/* Description */}
              <motion.p className="text-base lg:text-lg leading-relaxed max-w-lg mx-auto mb-10" style={{ color: "#6B6B6B" }}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.9 }}>
                Neural Sync is an AI-powered smart education platform that helps students learn through{" "}
                <span style={{ color: "#FF9F4C", fontWeight: 600 }}>AI tutors, virtual labs, smart notes, exam preparation,</span>{" "}
                adaptive learning, and interactive educational tools — all in one place, completely free.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div className="flex flex-wrap items-center justify-center gap-4"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 2.2 }}>
                <Link href="/quiz"
                  className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-xl text-sm font-bold overflow-hidden transition-all duration-500 hover:-translate-y-1"
                  style={{ color: "#fff" }}>
                  <motion.div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #E8852E 100%)" }}
                    animate={{ background: ["linear-gradient(135deg, #FF9F4C 0%, #E8852E 100%)", "linear-gradient(135deg, #E8852E 0%, #D97726 100%)", "linear-gradient(135deg, #FF9F4C 0%, #E8852E 100%)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                  <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                    style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)" }}
                    animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
                  <motion.div className="absolute inset-0 rounded-xl"
                    animate={{ boxShadow: ["0 0 24px rgba(255,159,76,0.25)", "0 0 48px rgba(255,159,76,0.4)", "0 0 24px rgba(255,159,76,0.25)"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                  <span className="relative z-10">Get Started</span>
                  <motion.span className="relative z-10" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <ArrowRight size={16} />
                  </motion.span>
                </Link>

                <Link href="/virtual-lab"
                  className="group relative inline-flex items-center gap-2.5 px-9 py-4 rounded-xl text-sm font-semibold overflow-hidden transition-all duration-500 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(45,45,45,0.06)", color: "#2D2D2D", backdropFilter: "blur(20px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 20px rgba(0,0,0,0.02)" }}>
                  <motion.span className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.05), rgba(232,133,46,0.02))" }}
                    initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.4 }} />
                  <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: "0 0 30px rgba(255,159,76,0.04)" }} />
                  <FlaskConical size={16} className="relative z-10 group-hover:rotate-[-12deg] transition-transform duration-500" />
                  <span className="relative z-10">Explore Features</span>
                </Link>
              </motion.div>

              {/* Animated stat counters */}
              <motion.div className="flex flex-wrap items-center justify-center gap-8 mt-12"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 2.6 }}>
                {[
                  { value: "50+", label: "AI Tools", icon: Zap },
                  { value: "100%", label: "Free Forever", icon: Shield },
                  { value: "0", label: "Sign-ups", icon: Brain },
                ].map(({ value, label, icon: Icon }, i) => (
                  <motion.div key={label} className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 2.8 + i * 0.12 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,159,76,0.08)", border: "1px solid rgba(255,159,76,0.1)" }}>
                      <Icon size={16} style={{ color: "#FF9F4C" }} />
                    </div>
                    <div>
                      <div className="text-lg font-serif font-bold leading-none" style={{ color: "#1A1A1A" }}>{value}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#9A9A9A" }}>{label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

            </motion.div>

          </div>
        </div>

        {/* futuristic icons row */}
        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-8"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.2, duration: 0.8 }}>
          {[Brain, Zap, FlaskConical, Sigma, Rocket].map((Icon, i) => (
            <motion.div key={i}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,159,76,0.15)", boxShadow: "0 0 16px rgba(255,159,76,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 3.4 + i * 0.12, duration: 0.5 }}
              whileHover={{ scale: 1.15, boxShadow: "0 0 24px rgba(255,159,76,0.15)" }}>
              <Icon size={14} style={{ color: "rgba(255,159,76,0.5)" }} />
            </motion.div>
          ))}
          <motion.div className="w-1 h-10 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(255,159,76,0.2), rgba(255,159,76,0.05))" }} />
        </motion.div>
      </section>

      {/* ═══ IMMERSIVE VISION ═══ */}
      <section className="relative px-6 py-28 lg:py-36 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Image mosaic */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <div className="relative">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 relative overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(45,45,45,0.04)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}>
                  <motion.img src="https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=800&q=85&fit=crop" alt="Student"
                    className="rounded-2xl object-cover h-80 w-full" loading="lazy"
                    style={{ scale: visionImgScale, y: visionImgParallax }}
                    whileHover={{ scale: 1.06 }} transition={{ duration: 0.8 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "1px solid rgba(45,45,45,0.04)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=85&fit=crop" alt="Science"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "1px solid rgba(45,45,45,0.04)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=85&fit=crop" alt="AI"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <motion.div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-7 py-4 text-center w-44 shadow-lg"
                style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)", color: "#fff", boxShadow: "0 8px 32px rgba(255,159,76,0.2)" }}
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}>
                <motion.p className="text-3xl font-serif font-bold leading-none" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>100%</motion.p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1.5 opacity-90">Free Access</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Vision copy */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.35 }}>
            <div className="lg:pl-4">
              <motion.div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] mb-8"
                style={{ background: "rgba(255,159,76,0.06)", border: "1px solid rgba(255,159,76,0.1)", color: "#FF9F4C" }}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <Eye size={14} /> Our Vision
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-[1.1] mb-6" style={{ color: "#1A1A1A" }}>
                {"The future of education".split(" ").map((word, i) => (
                  <motion.span key={i} className="inline-block mr-[0.25em]"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}>
                    {word}
                  </motion.span>
                ))}
                <br />
                <span style={{ color: "#FF9F4C" }}>
                  {"is not inside textbooks.".split(" ").map((word, i) => (
                    <motion.span key={`v-${i}`} className="inline-block mr-[0.25em]"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}>
                      {word}
                    </motion.span>
                  ))}
                </span>
              </h2>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(255,159,76,0.3), transparent)" }} />
                <motion.div className="w-2 h-2 rounded-full" style={{ background: "#FF9F4C" }}
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, rgba(255,159,76,0.3), transparent)" }} />
              </div>
              <p className="text-base lg:text-lg leading-relaxed mb-10" style={{ color: "#6B6B6B" }}>
                We believe it exists in experiences. Instead of asking students to memorize facts, we help them
                <span style={{ color: "#FF9F4C", fontWeight: 600 }}> see, explore, and understand</span> through realistic simulations,
                interactive AI, circuit building, and practical examples — because when learning feels real, curiosity grows
                and knowledge stays.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                {[
                  { icon: Lightbulb, title: "See It, Don't Memorize It", desc: "We turn abstract concepts into visual, interactive experiences.", accent: "#FF9F4C" },
                  { icon: FlaskConical, title: "Real Simulations", desc: "Official PhET labs for physics, chemistry & biology.", accent: "#E8852E" },
                  { icon: Cpu, title: "Build Real Circuits", desc: "A full logic simulator with 60+ components, truth tables & Verilog.", accent: "#D4761A" },
                ].map((item) => (
                  <motion.div key={item.title} className="flex flex-col items-center text-center gap-3 group"
                    whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
                    <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]"
                      style={{ background: `${item.accent}08`, border: `1px solid ${item.accent}12` }}>
                      <item.icon size={20} style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="font-bold mb-1.5 text-sm" style={{ color: "#2D2D2D" }}>{item.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Link href="/about"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-500 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)", color: "#fff", boxShadow: "0 8px 24px rgba(255,159,76,0.15)" }}>
                Discover Our Vision
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-500" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="relative px-4 sm:px-6 py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <motion.p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.orange }}>Why Neural Sync</motion.p>
            <h2 className="text-2xl md:text-4xl font-serif mb-4" style={{ color: "#1A1A1A" }}>Built for the way you learn</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#6B6B6B" }}>AI tools that adapt to you — no accounts, no paywalls, just open and start.</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            {[
              { icon: Brain, title: "AI That Explains", desc: "Get step-by-step reasoning, not just answers. The AI checks your understanding in real time.", accent: C.orange, glow: "rgba(255,159,76,0.06)" },
              { icon: FlaskConical, title: "Hands-on Labs", desc: "49 PhET simulations across biology, chemistry, and physics — drag, click, explore.", accent: C.sky, glow: "rgba(255,179,102,0.06)" },
              { icon: Shield, title: "Always Free", desc: "No account required. No paywalls. No limits. Just open a tool and start learning.", accent: C.cyan, glow: "rgba(152,212,255,0.06)" },
              { icon: Rocket, title: "Instant Results", desc: "Math solver, essay writer, quizzes — everything builds on your browser in seconds.", accent: C.blueLight, glow: "rgba(255,202,128,0.06)" },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <div className="rounded-2xl p-6 h-full relative overflow-hidden group transition-all duration-500 hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(45,45,45,0.08)", backdropFilter: "blur(12px)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${f.glow}, transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                      style={{ background: `${f.accent}10`, border: `1px solid ${f.accent}20` }}>
                      <f.icon size={22} style={{ color: f.accent }} />
                    </div>
                    <h3 className="font-serif text-base font-medium mb-2.5" style={{ color: "#1A1A1A" }}>{f.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TOOLS GRID ═══ */}
      <section id="tools" className="px-4 sm:pl-8 sm:pr-6 py-24 md:py-32 max-w-7xl mx-auto scroll-mt-8">
        <motion.div className="mb-14 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <motion.p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.orange }}
            animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>Our Toolkit</motion.p>
          <h2 className="text-3xl md:text-5xl font-serif mb-4" style={{ color: C.darkSlate }}>Eleven Tools. One Tutor.</h2>
          <p style={{ color: "#6B6B6B" }} className="text-base sm:text-lg">Pick a tool below — everything runs instantly, right in your browser.</p>
        </motion.div>

        <div className="relative" style={{ perspective: 1200 }}>
          {/* Left arrow */}
          <button onClick={() => setCarouselIdx((p) => Math.max(p - 1, 0))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", color: "#2D2D2D" }}>
            <ChevronLeft size={18} />
          </button>

          {/* Carousel track */}
          <div className="overflow-hidden">
            <motion.div className="flex gap-5"
              drag="x"
              dragConstraints={{ left: -maxIdx * 360, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                const threshold = 60;
                if (info.offset.x < -threshold) setCarouselIdx((p) => Math.min(p + 1, maxIdx));
                if (info.offset.x > threshold) setCarouselIdx((p) => Math.max(p - 1, 0));
              }}
              animate={{ x: -carouselIdx * 360 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}>
              {SHOWCASE_TOOLS.map((tool, idx) => {
                const isFocused = idx >= carouselIdx && idx < carouselIdx + 3;
                return (
                  <motion.div key={tool.path} layout
                    animate={{ scale: isFocused ? 1 : 0.92, opacity: isFocused ? 1 : 0.35 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="min-w-[340px]">
                    <InteractiveCard intensity={3}
                      className="lg-card group relative flex flex-col h-full rounded-2xl transition-all duration-500 overflow-hidden text-center"
                      style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "inset 0 0 20px rgba(255,159,76,0.04), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                      <Link href={tool.path} className="flex flex-col flex-1 h-full p-6 relative z-10">
                        <ShimmerOverlay color="rgba(255,255,255,0.05)" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 30% 20%, ${tool.iconColor}04 0%, transparent 60%)` }} />
                        <div className="flex justify-center mb-5">
                          <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: `${tool.iconColor}08`, border: `1px solid ${tool.iconColor}15` }}
                            whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }} transition={{ duration: 0.4 }}>
                            <tool.icon size={24} style={{ color: tool.iconColor }} />
                          </motion.div>
                        </div>
                        <span className="inline-flex self-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
                          style={{ background: `${C.orange}08`, color: C.primary, border: `1px solid ${C.orange}15` }}>{tool.tag}</span>
                        <h3 className="text-base sm:text-lg font-serif font-medium mb-2" style={{ color: C.darkSlate }}>{tool.name}</h3>
                        <p className="text-sm leading-relaxed flex-1" style={{ color: "#6B6B6B" }}>{tool.desc}</p>
                        <div className="mt-5 flex items-center justify-center text-sm font-bold"
                          style={{ color: tool.iconColor }}>
                          Launch Tool <ArrowRight size={14} className="ml-1" />
                        </div>
                      </Link>
                    </InteractiveCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right arrow */}
          <button onClick={() => setCarouselIdx((p) => Math.min(p + 1, maxIdx))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(255,255,255,0.72)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", color: "#2D2D2D" }}>
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-8">
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <motion.button key={i} onClick={() => setCarouselIdx(i)}
                className="rounded-full transition-all duration-300"
                animate={{ width: i === carouselIdx ? 24 : 6, height: 6, background: i === carouselIdx ? C.orange : "rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.8 }} />
            ))}
          </div>
        </div>
      </section>

      <FeedbackSection />

      {/* ═══ CTA ═══ */}
      <section className="px-4 sm:px-6 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
          <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden px-8 md:px-16 py-16 md:py-20 text-center isolate"
            style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.04) 0%, rgba(255,255,255,0.5) 30%, rgba(6,182,212,0.04) 100%)", border: "1.5px solid rgba(255,255,255,0.72)" }}>
            <AnimatedBorder />
            <motion.div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(rgba(255,159,76,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <h2 className="text-3xl md:text-5xl font-serif mb-5 relative z-10" style={{ color: C.darkSlate }}>
              Ready to{" "}
              <motion.span style={{ color: "#FF9F4C", display: "inline-block" }}
                animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                outsmart
              </motion.span>{" "}
              homework?
            </h2>
            <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 relative z-10" style={{ color: "#6B6B6B" }}>
              Jump into the math solver, fire up a virtual lab, or let the AI draft your next essay — all for free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <MagneticButton>
                <Link href="/virtual-lab"
                  className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all duration-500 hover:-translate-y-0.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFB366 100%)", color: "#ffffff", boxShadow: "0 4px 16px rgba(255,159,76,0.2)" }}>
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <FlaskConical size={20} className="relative z-10" />
                  <span className="relative z-10">Open Virtual Lab</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-500" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/math-solver"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-medium transition-all duration-500 hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
                  <Sigma size={20} /> Solve Math Now
                </Link>
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
    <Footer />
    </>
  );
}
