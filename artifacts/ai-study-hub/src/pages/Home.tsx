import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useScroll, useSpring } from "framer-motion";
import {
  BookOpen, PenTool, HelpCircle, Layers, ClipboardList,
  ArrowRight, Sigma, FlaskConical, Infinity as InfinityIcon,
  Gamepad2, ClipboardCheck, Zap, Brain, Eye, Lightbulb, Cpu, Rocket,
} from "lucide-react";
import MobileHome from "./MobileHome";

const C = {
  orange: "#FF9F4C", cyan: "#FFD4A8", indigo: "#E8852E",
  sky: "#FFB366", blueLight: "#FFCA80", ice: "#FFF3E0",
  darkSlate: "#FF9F4C", coolGray: "#6B6B6B",
  primary: "#FF9F4C", primaryDark: "#E8852E",
};

const SHOWCASE_TOOLS = [
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

const FEATURE_STRIP = [
  { icon: Brain, title: "AI Study Tools", desc: "Six writing & research tools that draft, explain, and quiz you instantly.", accent: C.orange },
  { icon: Sigma, title: "Step-by-Step Solver", desc: "Every math answer comes with the reasoning shown, not just the result.", accent: C.sky },
  { icon: FlaskConical, title: "Virtual Science Labs", desc: "Real PhET simulations you can touch, drag, and experiment with.", accent: C.cyan },
  { icon: InfinityIcon, title: "Free, Forever", desc: "No account, no paywall, no limits. Just open a tool and start learning.", accent: C.blueLight },
];

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, accent }: { value: string; accent: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const num = parseInt(value) || 0;
  useEffect(() => {
    if (!inView) return;
    if (num === 0) { setDisplay("0"); return; }
    const steps = 50;
    const t = setInterval(() => {
      setDisplay((prev) => {
        const next = parseInt(prev) + 1;
        if (next >= steps) { clearInterval(t); return String(num); }
        return String(Math.floor((num / steps) * next));
      });
    }, 20);
    return () => clearInterval(t);
  }, [inView, num]);
  return <span ref={ref} className={`text-4xl md:text-5xl font-serif font-bold mb-2`} style={{ color: accent }}>{display}</span>;
}

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

/* ─── Floating Particles enhanced ─── */
function FloatingParticles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 5 + 1, duration: Math.random() * 8 + 6,
    delay: Math.random() * 5, opacity: Math.random() * 0.12 + 0.03,
    driftX: (Math.random() - 0.5) * 40,
  }));
  return (
    <>
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
            background: p.id % 4 === 0 ? "rgba(255,159,76,0.25)" : p.id % 4 === 1 ? "rgba(255,212,168,0.2)" : p.id % 4 === 2 ? "rgba(232,133,46,0.15)" : "rgba(45,45,45,0.06)",
            filter: p.size > 3 ? "blur(0.5px)" : "none",
          }}
          animate={{ y: [0, -30 - Math.random() * 40, 0], x: [0, p.driftX, 0], opacity: [p.opacity, p.opacity * 3, p.opacity], scale: [1, 1.2 + Math.random() * 0.5, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </>
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

/* ─── Character split heading ─── */
function SplitHeading({ text, accent, className }: { text: string; accent?: string; className?: string }) {
  const [lines, ...rest] = text.split("\n");
  return (
    <h1 className={className}>
      {lines.split(" ").map((word, wi) => (
        <span key={wi} className="inline-block mr-[0.3em]">
          {word.split("").map((char, ci) => (
            <motion.span key={`${wi}-${ci}`} className="inline-block"
              initial={{ opacity: 0, y: 60, rotateX: -40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + (wi * word.length + ci) * 0.025, ease: [0.16, 1, 0.3, 1] }}>
              {char}
            </motion.span>
          ))}
        </span>
      ))}
      {rest.length > 0 && <><br />{rest.join("\n")}</>}
    </h1>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const visionImgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroParallax = useTransform(smoothScroll, [0, 0.15], [0, 40]);
  const visionImgParallax = useTransform(smoothScroll, [0.15, 0.45], [0, -60]);
  const visionImgScale = useTransform(smoothScroll, [0.15, 0.45], [1, 1.08]);

  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <>
    <div className="sm:hidden"><MobileHome /></div>
    <div className="hidden sm:block pb-0 overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section ref={heroRef} onMouseMove={handleHeroMouseMove}
        className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100dvh" }}>
        <div className="absolute inset-0 z-0">
          <div className="hidden md:block absolute inset-0"
            style={{ background: "#FFF8F0", backgroundImage: "url(/images/hero-bg.jpeg)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          <div className="md:hidden absolute inset-0"
            style={{ background: "#FFF8F0", backgroundImage: "url(/images/hero-bg.jpeg)", backgroundSize: "contain", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }} />
          <div className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 60% 50% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,159,76,0.06) 0%, transparent 70%)`, transition: "background 0.3s ease" }} />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.1, 0.04] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full blur-[160px]" style={{ width: 600, height: 600, top: "5%", left: "10%", background: "rgba(255,159,76,0.07)" }} />
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute rounded-full blur-[140px]" style={{ width: 500, height: 500, bottom: "10%", right: "5%", background: "rgba(255,212,168,0.06)" }} />
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: "radial-gradient(rgba(255,159,76,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <FloatingParticles />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="-mt-12 sm:-mt-20 md:-mt-24 ml-0 sm:ml-1 md:ml-2 lg:ml-0 max-w-3xl" style={{ y: heroParallax }}>
            <h1 className="text-left text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif leading-[0.95] tracking-tight mb-0" style={{ color: "#2D2D2D" }}>
              <span style={{ color: C.orange }}>Learn</span> smarter,{"\n"}
            </h1>
            <motion.h1 className="text-left text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif leading-[0.95] tracking-tight mt-1">
              <span style={{ color: "#2D2D2D" }}>not </span>
              {"harder.".split("").map((char, i) => (
                <motion.span key={i} className="inline-block"
                  initial={{ opacity: 0, y: 50, rotateX: -40 }}
                  animate={loaded ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.8 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
                  style={{ color: C.orange }}>{char === " " ? "\u00A0" : char}</motion.span>
              ))}
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 mt-4 sm:mt-8">
              {[
                { num: "01", label: "AI Tutors", color: "#FFD4A8" },
                { num: "02", label: "Step Solver", color: "#FF9F4C" },
                { num: "03", label: "Virtual Labs", color: "#E8852E" },
                { num: "04", label: "100% Free", color: "#FF9F4C" },
              ].map((feat, i) => (
                <motion.div key={feat.label} initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.7 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full"
                  style={{ background: "rgba(255,255,255,0.5)", border: "2px solid #2D2D2D", backdropFilter: "blur(8px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)" }}>
                  <span className="font-mono text-xs font-bold" style={{ color: feat.color }}>{feat.num}</span>
                  <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>{feat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-10">
              <MagneticButton>
                <Link href="/math-solver"
                  className="group relative inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-semibold overflow-hidden transition-all duration-500 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))", border: "2px solid #2D2D2D", color: "#2D2D2D", backdropFilter: "blur(16px) saturate(180%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.04)" }}>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.12), rgba(232,133,46,0.06))" }} />
                  <svg className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  <span className="relative z-10">Get Started</span>
                  <svg className="relative z-10 w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/virtual-lab"
                  className="group relative inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-semibold overflow-hidden transition-all duration-500 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)", border: "2px solid #2D2D2D", color: "#FFFFFF", backdropFilter: "blur(16px) saturate(180%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(255,159,76,0.2)" }}>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))" }} />
                  <svg className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M8 9.31A6.48 6.48 0 005.5 9c-2 0-3.5 1-3.5 2.5S3.5 14 5.5 14c1.2 0 2.2-.5 2.8-1.2" /><path d="M18.5 2h-7M16 9.31c1.3.3 2.3.95 2.8 1.69.7.9 1.2 2 1.2 3.5 0 1.5-.5 2.6-1.2 3.5-.6.7-1.5 1.2-2.8 1.69" /><circle cx="12" cy="16" r="6" /></svg>
                  <span className="relative z-10">Explore</span>
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURE STRIP ═══ */}
      <section className="px-4 sm:pl-8 sm:pr-6 -mt-12 md:-mt-16 relative z-20">
        <motion.div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {FEATURE_STRIP.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <InteractiveCard intensity={3}
                className="lg-card group relative rounded-2xl p-6 transition-all duration-700 h-full overflow-hidden text-center"
                style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03), inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.03)" }}>
                <ShimmerOverlay color="rgba(255,255,255,0.06)" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.accent}06 0%, transparent 70%)` }} />
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]"
                    style={{ background: `${f.accent}10`, border: `1px solid ${f.accent}18` }}>
                    <f.icon size={22} style={{ color: f.accent }} />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-medium mb-2" style={{ color: C.darkSlate }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{f.desc}</p>
              </InteractiveCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ OUR VISION ═══ */}
      <section className="px-4 sm:px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                 <div className="col-span-3 relative overflow-hidden rounded-2xl" style={{ border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03)" }}>
                  <motion.img src="/images/kid-tablet.jpg" alt="Student exploring"
                    className="rounded-2xl object-cover h-72 w-full" loading="lazy"
                    style={{ scale: visionImgScale, y: visionImgParallax }}
                    whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03)" }}>
                    <motion.img src="/images/lab-colorful.jpg" alt="Science lab"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.1 }} transition={{ duration: 0.8 }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03)" }}>
                    <motion.img src="/images/robot-tutor-3.jpg" alt="AI logic"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.1 }} transition={{ duration: 0.8 }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-2xl shadow-xl px-6 py-4 text-center w-48"
                style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)", color: "#ffffff", boxShadow: "0 4px 20px rgba(255,159,76,0.2)" }}>
                <motion.p className="text-3xl font-serif font-bold leading-none"
                  animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>100%</motion.p>
                <p className="text-xs font-bold uppercase tracking-wider mt-1">Free Access</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.35 }}>
            <div className="lg:pl-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6"
                style={{ background: "rgba(255,159,76,0.08)", border: "1px solid rgba(255,159,76,0.15)", color: "#FF9F4C" }}>
                <Eye size={15} /> Our Vision
              </div>
              <div className="relative mb-6">
                <h2 className="text-3xl md:text-4xl font-serif leading-tight" style={{ color: "#2D2D2D" }}>
                  {"The future of education".split(" ").map((word, i) => (
                    <motion.span key={i} className="inline-block mr-[0.25em]"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}>
                      {word}
                    </motion.span>
                  ))}
                  <br />
                  {"is".split(" ").map((word, i) => (
                    <motion.span key={i} className="inline-block mr-[0.25em]"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}>
                      {word}
                    </motion.span>
                  ))}{" "}
                  <motion.span style={{ color: "#FF9F4C" }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}>
                    not inside
                  </motion.span>
                  <br />
                  <motion.span style={{ color: "#FF9F4C" }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.7 }}>
                    textbooks.
                  </motion.span>
                </h2>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-px w-8" style={{ background: "rgba(255,159,76,0.3)" }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF9F4C" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <div className="h-px w-8" style={{ background: "rgba(255,159,76,0.3)" }} />
                </div>
              </div>
              <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#6B6B6B" }}>
                We believe it exists in experiences. Instead of asking students to memorize facts, we help them
                <strong style={{ color: "#FF9F4C" }}> see, explore, and understand</strong> through realistic simulations,
                interactive AI, circuit building, and practical examples — because when learning feels real, curiosity grows
                and knowledge stays.
              </p>
              <div className="grid sm:grid-cols-3 gap-5 mb-10">
                {[
                  { icon: Lightbulb, title: "See It, Don't Memorize It", desc: "We turn abstract concepts into visual, interactive experiences.", accent: "#FF9F4C" },
                  { icon: FlaskConical, title: "Real Simulations", desc: "Official PhET labs for physics, chemistry & biology.", accent: "#E8852E" },
                  { icon: Cpu, title: "Build Real Circuits", desc: "A full logic simulator with 60+ components, truth tables & Verilog.", accent: "#D4761A" },
                ].map((item) => (
                  <motion.div key={item.title} className="flex flex-col items-center text-center gap-3 group"
                    whileHover={{ y: -3 }} transition={{ duration: 0.3 }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]"
                      style={{ background: `${item.accent}10`, border: `1px solid ${item.accent}18` }}>
                      <item.icon size={18} style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="font-bold mb-1" style={{ color: "#2D2D2D" }}>{item.title}</p>
                      <p className="text-sm" style={{ color: "#6B6B6B" }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-center">
                <Link href="/about"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold transition-all duration-500 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #FF9F4C 0%, #FFD4A8 100%)", color: "#ffffff", boxShadow: "0 4px 16px rgba(255,159,76,0.2)" }}>
                  Discover Our Vision
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-500" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative px-4 sm:px-6 py-20 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FFF8F0 0%, rgba(255,159,76,0.02) 50%, #FFF8F0 100%)" }}>
        <motion.div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 text-center"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          {[{ value: "10", label: "AI-Powered Tools", accent: C.orange },
            { value: "50+", label: "Virtual Lab Simulations", accent: C.sky },
            { value: "0", label: "Sign-ups Required", accent: C.cyan },
            { value: "24/7", label: "Always Available", accent: C.blueLight },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <motion.div className="rounded-2xl px-6 py-6 group"
                whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.3 }}
                style={{ background: "rgba(255,255,255,0.5)", border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03), inset 0 1px 0 rgba(255,255,255,0.6)", backdropFilter: "blur(16px)" }}>
                <AnimatedCounter value={s.value} accent={s.accent} />
                <motion.p className="text-sm uppercase tracking-wide font-medium" style={{ color: "#9A9A9A" }}
                  whileHover={{ color: s.accent }} transition={{ duration: 0.3 }}>{s.label}</motion.p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ TOOLS GRID ═══ */}
      <section id="tools" className="px-4 sm:pl-8 sm:pr-6 py-24 md:py-32 max-w-7xl mx-auto scroll-mt-8">
        <motion.div className="mb-14 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <motion.p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: C.orange }}
            animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>Our Toolkit</motion.p>
          <h2 className="text-3xl md:text-5xl font-serif mb-4" style={{ color: C.darkSlate }}>Ten Tools. One Tutor.</h2>
          <p style={{ color: "#6B6B6B" }} className="text-base sm:text-lg">Pick a tool below — everything runs instantly, right in your browser.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
          {SHOWCASE_TOOLS.map((tool, idx) => (
            <motion.div key={tool.path}
              initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 800, transformOrigin: "center bottom" }}>
              <InteractiveCard intensity={3}
                className="lg-card group relative flex flex-col h-full p-6 rounded-2xl transition-all duration-500 overflow-hidden text-center"
                style={{ background: "rgba(255,255,255,0.5)", border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.12), inset 0 0 20px rgba(255,159,76,0.04), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                <Link href={tool.path} className="absolute inset-0 z-10" />
                <ShimmerOverlay color="rgba(255,255,255,0.05)" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 20%, ${tool.iconColor}04 0%, transparent 60%)` }} />
                <div className="flex justify-center mb-5 relative z-20">
                  <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${tool.iconColor}08`, border: `1px solid ${tool.iconColor}15` }}
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }} transition={{ duration: 0.4 }}>
                    <tool.icon size={24} style={{ color: tool.iconColor }} />
                  </motion.div>
                </div>
                <span className="inline-flex self-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 relative z-20"
                  style={{ background: `${C.orange}08`, color: C.primary, border: `1px solid ${C.orange}15` }}>{tool.tag}</span>
                <h3 className="text-base sm:text-lg font-serif font-medium mb-2 relative z-20" style={{ color: C.darkSlate }}>{tool.name}</h3>
                <p className="text-sm leading-relaxed flex-1 relative z-20" style={{ color: "#6B6B6B" }}>{tool.desc}</p>
                <motion.div className="mt-5 flex items-center justify-center text-sm font-bold relative z-20"
                  style={{ color: tool.iconColor }}
                  initial={{ opacity: 0, x: -8 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}>
                  Launch Tool <ArrowRight size={14} className="ml-1" />
                </motion.div>
              </InteractiveCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-4 sm:px-6 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}>
          <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden px-8 md:px-16 py-16 md:py-20 text-center isolate"
            style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.04) 0%, rgba(255,255,255,0.5) 30%, rgba(6,182,212,0.04) 100%)", border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1)" }}>
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
    </>
  );
}
