import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, useScroll, useSpring } from "framer-motion";
import {
  BookOpen, PenTool, HelpCircle, Layers, ClipboardList,
  ArrowRight, Sigma, FlaskConical, Infinity as InfinityIcon,
  Gamepad2, ClipboardCheck, Zap, Brain, Eye, Lightbulb, Cpu, Rocket, Image as ImageIcon,
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

/* ─── Canvas Particle Network ─── */
function ParticleNetwork({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0; let h = 0;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
    const PARTICLE_COUNT = 65;
    const CONNECTION_DIST = 130;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 1,
        color: i % 3 === 0 ? "#FF9F4C" : i % 3 === 1 ? "#E8852E" : "#2D2D2D",
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = 0.5;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = "#FF9F4C";
            ctx!.globalAlpha = alpha;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Mouse interaction - draw extra connections near cursor
      const mx = mousePos.x * w;
      const my = mousePos.y * h;
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const alpha = (1 - dist / 200) * 0.25;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx!.fillStyle = "#FF9F4C";
          ctx!.globalAlpha = alpha;
          ctx!.fill();
        }
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [mousePos]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
  );
}

/* ─── Animated Grid Background ─── */
function GridBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.04]">
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(45,45,45,1) 1px, transparent 1px), linear-gradient(90deg, rgba(45,45,45,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,159,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,159,76,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ─── AI Holographic Visual ─── */
function AIVisual() {
  const cards = [
    { label: "AI Tutors", value: "10+", x: "-15%", y: "-25%", delay: 0 },
    { label: "Virtual Labs", value: "50+", x: "20%", y: "-30%", delay: 0.3 },
    { label: "Smart Notes", value: "AI", x: "-20%", y: "20%", delay: 0.6 },
    { label: "Exams", value: "Prep", x: "18%", y: "22%", delay: 0.9 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow orbs */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{ width: "50%", height: "50%", background: "rgba(255,159,76,0.15)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[80px]"
        style={{ width: "35%", height: "35%", background: "rgba(232,133,46,0.1)" }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Glowing orange rings */}
      <motion.svg className="absolute w-[80%] h-[80%]" viewBox="0 0 300 300"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="150" cy="150" r="100" fill="none" stroke="#FF9F4C" strokeWidth="1" opacity="0.15"
          strokeDasharray="8 6" />
        <circle cx="150" cy="150" r="130" fill="none" stroke="#FF9F4C" strokeWidth="0.5" opacity="0.1"
          strokeDasharray="4 8" />
      </motion.svg>
      <motion.svg className="absolute w-[80%] h-[80%]" viewBox="0 0 300 300"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="150" cy="150" r="115" fill="none" stroke="#E8852E" strokeWidth="0.8" opacity="0.12"
          strokeDasharray="6 10" />
      </motion.svg>

      {/* Central AI brain / neural core */}
      <motion.div
        className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(255,159,76,0.15) 0%, rgba(255,212,168,0.05) 50%, transparent 70%)",
          border: "1px solid rgba(255,159,76,0.15)",
          boxShadow: "0 0 60px rgba(255,159,76,0.1), inset 0 0 60px rgba(255,159,76,0.05)",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, rgba(255,159,76,0.2) 0%, rgba(255,159,76,0.05) 60%, transparent 100%)",
            border: "1px solid rgba(255,159,76,0.2)",
            boxShadow: "0 0 40px rgba(255,159,76,0.15)",
          }}
        >
          <Brain size={40} className="sm:w-[48px] sm:h-[48px]" style={{ color: "#FF9F4C", opacity: 0.9 }} />
        </div>
        {/* Neural dots orbiting */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: i % 2 === 0 ? "#FF9F4C" : "#E8852E" }}
            animate={{
              x: [0, Math.cos((i / 8) * Math.PI * 2) * 70, 0],
              y: [0, Math.sin((i / 8) * Math.PI * 2) * 70, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{ duration: 3 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
      </motion.div>

      {/* Floating glass cards */}
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="absolute rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-center backdrop-blur-xl"
          style={{
            left: `calc(50% + ${card.x})`,
            top: `calc(50% + ${card.y})`,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: [0, -4, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: card.delay, opacity: { duration: 0.8, delay: 1 + card.delay } }}
        >
          <p className="text-[10px] sm:text-xs font-semibold" style={{ color: "#FF9F4C" }}>{card.value}</p>
          <p className="text-[8px] sm:text-[10px]" style={{ color: "rgba(107,107,107,0.9)" }}>{card.label}</p>
        </motion.div>
      ))}

      {/* Tech dots decorating the right side */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 90 + Math.sin(i * 1.5) * 15;
        return (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px - 2px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px - 1px)`,
              background: i % 3 === 0 ? "#FF9F4C" : i % 3 === 1 ? "#E8852E" : "rgba(45,45,45,0.3)",
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          />
        );
      })}
    </div>
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
  const visionImgParallax = useTransform(smoothScroll, [0.15, 0.45], [0, -60]);
  const visionImgScale = useTransform(smoothScroll, [0.15, 0.45], [1, 1.08]);

  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  return (
    <>
    <div className="sm:hidden"><MobileHome /></div>
    <div className="hidden sm:block pb-0 overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section ref={heroRef} onMouseMove={handleHeroMouseMove}
        className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100dvh", background: "#FFF8F0" }}>
        <GridBackground />
        <ParticleNetwork mousePos={mousePos} />

        {/* Ambient glow orbs */}
        <motion.div
          className="absolute rounded-full blur-[180px] pointer-events-none z-[1]"
          style={{ width: "50vw", height: "50vw", maxWidth: 700, maxHeight: 700, top: "-20%", left: "-10%", background: "rgba(255,159,76,0.06)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full blur-[180px] pointer-events-none z-[1]"
          style={{ width: "40vw", height: "40vw", maxWidth: 500, maxHeight: 500, bottom: "-10%", right: "20%", background: "rgba(232,133,46,0.05)" }}
          animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        {/* Mouse-follow radial glow */}
        <motion.div
          className="absolute z-[1] pointer-events-none rounded-full blur-[150px]"
          style={{
            width: 400, height: 400,
            left: `calc(${mousePos.x * 100}% - 200px)`,
            top: `calc(${mousePos.y * 100}% - 200px)`,
            background: "radial-gradient(circle, rgba(255,159,76,0.06) 0%, transparent 70%)",
            transition: "left 0.8s ease, top 0.8s ease",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
          <div className="w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center pt-24 pb-12">
            {/* ═══ LEFT: Content ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{
                  background: "rgba(255,159,76,0.08)",
                  border: "1px solid rgba(255,159,76,0.15)",
                  color: "#FF9F4C",
                }}
              >
                <Zap size={12} />
                AI-Powered Smart Learning Platform
              </motion.div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-7xl font-serif leading-[1.05] tracking-tight mb-4" style={{ color: "#2D2D2D" }}>
                Learn Smarter{" "}
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent" style={{
                    backgroundImage: "linear-gradient(135deg, #FF9F4C 0%, #E8852E 50%, #FFB366 100%)",
                  }}>with AI.</span>
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-1 rounded-full"
                    style={{ background: "linear-gradient(90deg, #FF9F4C, transparent)" }}
                    initial={{ scaleX: 0, transformOrigin: "left" }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif leading-tight mb-6" style={{ color: "#6B6B6B" }}>
                The Future of Education is Here.
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg leading-relaxed max-w-lg mb-8" style={{ color: "#6B6B6B" }}>
                Neural Sync is an AI-powered smart education platform that helps students learn through{" "}
                <strong style={{ color: "#FF9F4C" }}>AI tutors, virtual labs, smart notes, exam preparation,</strong>{" "}
                adaptive learning, and interactive educational tools — all in one place, completely free.
              </p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/quiz"
                  className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold overflow-hidden transition-all duration-500 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #FF9F4C 0%, #E8852E 100%)",
                    color: "#ffffff",
                    boxShadow: "0 4px 24px rgba(255,159,76,0.25), 0 2px 8px rgba(255,159,76,0.15)",
                  }}
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10">Get Started</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: "0 0 40px rgba(255,159,76,0.3)" }}
                  />
                </Link>

                <Link
                  href="/virtual-lab"
                  className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold overflow-hidden transition-all duration-500 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(45,45,45,0.1)",
                    color: "#2D2D2D",
                    backdropFilter: "blur(16px) saturate(180%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(255,159,76,0.08), rgba(232,133,46,0.04))" }} />
                  <FlaskConical size={16} className="relative z-10" />
                  <span className="relative z-10">Explore Features</span>
                </Link>
              </motion.div>

              {/* Trust / stats row */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="flex flex-wrap items-center gap-6 mt-10 pt-8"
                style={{ borderTop: "1px solid rgba(45,45,45,0.06)" }}
              >
                {[
                  { value: "10+", label: "AI Tools" },
                  { value: "50+", label: "Virtual Labs" },
                  { value: "0$", label: "Always Free" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-lg font-bold font-serif" style={{ color: "#FF9F4C" }}>{s.value}</span>
                    <span className="text-xs" style={{ color: "#9A9A9A" }}>{s.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ═══ RIGHT: AI Holographic Visual ═══ */}
            <motion.div
              className="relative h-[400px] sm:h-[480px] lg:h-[560px]"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <AIVisual />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#9A9A9A" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Scroll
          </motion.span>
          <motion.div
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(45,45,45,0.15)" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 rounded-full"
              style={{ background: "#FF9F4C" }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
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
                  <motion.img src="https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=800&q=85" alt="Student exploring"
                    className="rounded-2xl object-cover h-72 w-full" loading="lazy"
                    style={{ scale: visionImgScale, y: visionImgParallax }}
                    whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=85" alt="Science lab"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.1 }} transition={{ duration: 0.8 }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "2px solid #2D2D2D", boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.1), inset 0 0 20px rgba(255,159,76,0.03)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=85" alt="AI logic"
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
