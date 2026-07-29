import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
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

/* ─── 3D Scene: Rotating Globe + Particle Field ─── */
function ThreeDScene({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    // ─── 3D Math helpers ───
    function project(x: number, y: number, z: number, camDist: number): [number, number, number] {
      const scale = camDist / (camDist + z);
      return [x * scale + w / 2, -y * scale + h / 2, scale];
    }

    function rotateX(x: number, y: number, z: number, angle: number): [number, number, number] {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [x, y * c - z * s, y * s + z * c];
    }
    function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [x * c + z * s, y, -x * s + z * c];
    }

    // ─── Icosahedron ───
    const phi = (1 + Math.sqrt(5)) / 2;
    const icoVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ];
    const icoEdges = [
      [0,1],[0,4],[0,5],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
      [4,5],[4,11],[5,9],[6,7],[6,10],[7,8],[8,9],[10,11],
      [5,11],[7,10],[6,8],[9,11],
    ];
    const icoSize = 180;
    const icoVerts3D = icoVerts.map(([x, y, z]) => [x * icoSize, y * icoSize, z * icoSize] as [number, number, number]);

    // ─── Secondary inner icosahedron ───
    const innerSize = 120;
    const innerVerts = icoVerts.map(([x, y, z]) => [x * innerSize, y * innerSize, z * innerSize] as [number, number, number]);

    // ─── 3D Particles ───
    const PARTICLE_COUNT = 800;
    const particles: {
      x: number; y: number; z: number;
      vx: number; vy: number; vz: number;
      size: number; color: string; glow: boolean; pulse: number; pulseSpeed: number;
    }[] = [];

    const orangeShades = ["#FF9F4C", "#FFB366", "#E8852E", "#FF8C2E"];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isBlack = i % 3 === 2;
      const isGlow = !isBlack && i % 5 === 0;
      const c = isBlack ? `rgba(45,45,45,${0.25 + Math.random() * 0.4})` : orangeShades[Math.floor(Math.random() * orangeShades.length)];
      const range = 500;
      particles.push({
        x: (Math.random() - 0.5) * range * 2,
        y: (Math.random() - 0.5) * range * 2,
        z: (Math.random() - 0.5) * range * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: (Math.random() - 0.5) * 0.15,
        size: isGlow ? 2 + Math.random() * 3 : isBlack ? 1.2 + Math.random() * 2 : 0.8 + Math.random() * 1.8,
        color: c, glow: isGlow,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.03,
      });
    }

    let time = 0;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      time += 0.005;
      ctx!.clearRect(0, 0, w, h);

      // Mouse-driven camera rotation
      const camRotX = (mousePos.y - 0.5) * 0.4;
      const camRotY = (mousePos.x - 0.5) * 0.4;
      const camDist = 550;

      // ─── Draw particles ───
      // First compute all projected positions
      const pData: { sx: number; sy: number; scale: number; size: number; color: string; glow: boolean; pulse: number; px: number; py: number; pz: number }[] = [];

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (Math.abs(p.x) > 500) p.vx *= -1;
        if (Math.abs(p.y) > 500) p.vy *= -1;
        if (Math.abs(p.z) > 500) p.vz *= -1;
        p.pulse += p.pulseSpeed;

        let [rx, ry, rz] = rotateX(p.x, p.y, p.z, camRotX);
        [rx, ry, rz] = rotateY(rx, ry, rz, camRotY);
        const [sx, sy, sc] = project(rx, ry, rz, camDist);
        const ds = p.size * (0.6 + sc * 0.4) * (1 + Math.sin(p.pulse) * 0.15);
        const alpha = 0.2 + sc * 0.6;
        pData.push({ sx, sy, scale: sc, size: ds, color: p.color, glow: p.glow, pulse: p.pulse, px: rx, py: ry, pz: rz });
      }

      // Sort by depth (far first)
      pData.sort((a, b) => a.scale - b.scale);

      // Draw connections between close particles
      for (let i = 0; i < pData.length; i += 2) {
        for (let j = i + 1; j < Math.min(i + 20, pData.length); j += 2) {
          const dx = pData[i].sx - pData[j].sx;
          const dy = pData[i].sy - pData[j].sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.06 * pData[i].scale;
            ctx!.beginPath();
            ctx!.moveTo(pData[i].sx, pData[i].sy);
            ctx!.lineTo(pData[j].sx, pData[j].sy);
            ctx!.strokeStyle = "#FF9F4C";
            ctx!.globalAlpha = alpha;
            ctx!.lineWidth = 0.3;
            ctx!.stroke();
          }
        }
      }

      // Draw particles
      for (const d of pData) {
        if (d.sx < -100 || d.sx > w + 100 || d.sy < -100 || d.sy > h + 100) continue;

        if (d.glow) {
          const g = ctx!.createRadialGradient(d.sx, d.sy, 0, d.sx, d.sy, d.size * 6);
          g.addColorStop(0, "#FF9F4C");
          g.addColorStop(0.15, "rgba(255,159,76,0.2)");
          g.addColorStop(1, "transparent");
          ctx!.fillStyle = g;
          ctx!.globalAlpha = d.scale * 0.3;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(d.sx, d.sy, d.size, 0, Math.PI * 2);
        ctx!.fillStyle = d.color;
        ctx!.globalAlpha = 0.3 + d.scale * 0.5;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // ─── Draw rotating icosahedron ───
      const globeAngle = time * 0.4;
      const counterAngle = -time * 0.25;
      const innerAngle = time * 0.6;

      // Inner glow behind globe
      const glowGrad = ctx!.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 250);
      glowGrad.addColorStop(0, "rgba(255,159,76,0.03)");
      glowGrad.addColorStop(1, "transparent");
      ctx!.fillStyle = glowGrad;
      ctx!.beginPath();
      ctx!.arc(w / 2, h / 2, 250, 0, Math.PI * 2);
      ctx!.fill();

      function drawIcosahedron(verts: [number, number, number][], edges: number[][], angle: number, strokeColor: string, lineWidth: number, opacity: number, dash?: string) {
        const transformed = verts.map(([x, y, z]) => {
          let [rx, ry, rz] = rotateX(x, y, z, angle);
          [rx, ry, rz] = rotateY(rx, ry, rz, angle * 0.7);
          [rx, ry, rz] = rotateX(rx, ry, rz, camRotX);
          [rx, ry, rz] = rotateY(rx, ry, rz, camRotY);
          return project(rx, ry, rz, camDist);
        });

        ctx!.strokeStyle = strokeColor;
        ctx!.globalAlpha = opacity;
        ctx!.lineWidth = lineWidth;
        if (dash) ctx!.setLineDash([parseFloat(dash.split(" ")[0]), parseFloat(dash.split(" ")[1])]);

        for (const [i, j] of edges) {
          ctx!.beginPath();
          ctx!.moveTo(transformed[i][0], transformed[i][1]);
          ctx!.lineTo(transformed[j][0], transformed[j][1]);
          ctx!.stroke();
        }
        ctx!.setLineDash([]);
        ctx!.globalAlpha = 1;
      }

      // Outer wireframe (pulsing opacity)
      const outerOp = 0.06 + Math.sin(time * 0.5) * 0.03;
      drawIcosahedron(icoVerts3D, icoEdges, globeAngle, "#FF9F4C", 0.6, outerOp);
      drawIcosahedron(icoVerts3D, icoEdges, counterAngle, "#E8852E", 0.4, outerOp * 0.7);

      // Inner solid wireframe
      drawIcosahedron(innerVerts, icoEdges, innerAngle, "#FF9F4C", 0.3, 0.08, "3 5");
      drawIcosahedron(innerVerts, icoEdges, -innerAngle, "#E8852E", 0.2, 0.05, "2 6");

      // ─── Ring around globe ───
      ctx!.globalAlpha = 0.04;
      ctx!.strokeStyle = "#FF9F4C";
      ctx!.lineWidth = 0.5;
      ctx!.setLineDash([4, 8]);
      const ringPoints = 40;
      const ringRadius = 240;
      for (let i = 0; i < ringPoints; i++) {
        const a1 = (i / ringPoints) * Math.PI * 2;
        const a2 = ((i + 1) / ringPoints) * Math.PI * 2;
        let [x1, y1, z1] = [Math.cos(a1) * ringRadius, Math.sin(a1) * ringRadius * 0.3, Math.sin(a1) * ringRadius * 0.3];
        [x1, y1, z1] = rotateX(x1, y1, z1, globeAngle * 0.5);
        [x1, y1, z1] = rotateY(x1, y1, z1, globeAngle * 0.3);
        [x1, y1, z1] = rotateX(x1, y1, z1, camRotX);
        [x1, y1, z1] = rotateY(x1, y1, z1, camRotY);
        const [sx1, sy1] = project(x1, y1, z1, camDist);

        let [x2, y2, z2] = [Math.cos(a2) * ringRadius, Math.sin(a2) * ringRadius * 0.3, Math.sin(a2) * ringRadius * 0.3];
        [x2, y2, z2] = rotateX(x2, y2, z2, globeAngle * 0.5);
        [x2, y2, z2] = rotateY(x2, y2, z2, globeAngle * 0.3);
        [x2, y2, z2] = rotateX(x2, y2, z2, camRotX);
        [x2, y2, z2] = rotateY(x2, y2, z2, camRotY);
        const [sx2, sy2] = project(x2, y2, z2, camDist);

        ctx!.beginPath();
        ctx!.moveTo(sx1, sy1);
        ctx!.lineTo(sx2, sy2);
        ctx!.stroke();
      }
      ctx!.setLineDash([]);
      ctx!.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [mousePos]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

/* ─── Cinematic AI Holographic Display ─── */
function AIVisual() {
  const cards = [
    { label: "AI Tutors", value: "10+", x: "-20%", y: "-28%", delay: 0 },
    { label: "Virtual Labs", value: "50+", x: "24%", y: "-34%", delay: 0.3 },
    { label: "Smart Notes", value: "AI", x: "-24%", y: "24%", delay: 0.6 },
    { label: "Exams", value: "Prep", x: "22%", y: "26%", delay: 0.9 },
  ];

  const dataStreams = useMemo(() => [...Array(25)].map((_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 5,
    dur: 2.5 + Math.random() * 4, h: 2 + Math.random() * 4, o: 0.15 + Math.random() * 0.35,
  })), []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Deep ambient glow */}
      <motion.div className="absolute rounded-full blur-[150px]" style={{ width: "65%", height: "65%", background: "rgba(255,159,76,0.08)" }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full blur-[120px]" style={{ width: "45%", height: "45%", background: "rgba(232,133,46,0.06)" }}
        animate={{ scale: [1.3, 0.7, 1.3], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

      {/* Large rotating wireframe globe */}
      <motion.svg className="absolute w-[80%] h-[80%]" viewBox="0 0 300 300"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
        {[...Array(10)].map((_, i) => (
          <ellipse key={`gl-${i}`} cx="150" cy="150" rx={i % 2 === 0 ? 95 : 65} ry={95}
            fill="none" stroke={i % 2 === 0 ? "#FF9F4C" : "#E8852E"}
            strokeWidth={i % 2 === 0 ? 0.35 : 0.25} opacity={i % 2 === 0 ? 0.1 : 0.06}
            transform={`rotate(${(i / 10) * 180}, 150, 150)`}
            strokeDasharray={i % 2 === 0 ? "4 7" : "2 9"} />
        ))}
        {[...Array(5)].map((_, i) => (
          <ellipse key={`gl-lat-${i}`} cx="150" cy="150" rx={95 - i * 16} ry={38 - i * 7}
            fill="none" stroke="#FF9F4C" strokeWidth="0.25" opacity={0.06 + i * 0.01} strokeDasharray="3 6" />
        ))}
        <ellipse cx="150" cy="150" rx="95" ry="22" fill="none" stroke="#FF9F4C" strokeWidth="0.5" opacity="0.12" />
      </motion.svg>

      {/* Counter-rotating ring */}
      <motion.svg className="absolute w-[90%] h-[90%]" viewBox="0 0 300 300"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        <circle cx="150" cy="150" r="120" fill="none" stroke="#2D2D2D" strokeWidth="0.4" opacity="0.06" strokeDasharray="2 12" />
        <circle cx="150" cy="150" r="135" fill="none" stroke="#FF9F4C" strokeWidth="0.2" opacity="0.04" strokeDasharray="1 15" />
      </motion.svg>

      {/* Energy pulse rings */}
      {[...Array(4)].map((_, i) => (
        <motion.div key={`pr-${i}`} className="absolute rounded-full"
          style={{ width: 50 + i * 35, height: 50 + i * 35, border: "1px solid rgba(255,159,76,0.12)" }}
          animate={{ scale: [0.4, 2.2 + i * 0.4], opacity: [0.5, 0] }}
          transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeOut", delay: i * 1.0 }} />
      ))}

      {/* Orbiting nodes */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 80 + (i % 3) * 12;
        return (
          <React.Fragment key={`on-${i}`}>
            <motion.div className="absolute w-[5px] h-[5px] rounded-full z-10"
              style={{ background: i % 3 === 0 ? "#FF9F4C" : i % 3 === 1 ? "#E8852E" : "#FFB366", boxShadow: `0 0 8px ${i % 3 === 0 ? "#FF9F4C" : "#E8852E"}` }}
              animate={{
                left: [`calc(50% + ${Math.cos(angle) * r}px)`, `calc(50% + ${Math.cos(angle + Math.PI) * r}px)`],
                top: [`calc(50% + ${Math.sin(angle) * r}px)`, `calc(50% + ${Math.sin(angle + Math.PI) * r}px)`],
                opacity: [0.9, 0.1, 0.9], scale: [1, 0.4, 1],
              }}
              transition={{ duration: 5 + i * 0.25, repeat: Infinity, ease: "linear", delay: i * 0.15 }} />
            <motion.div className="absolute w-[2px] h-[2px] rounded-full" style={{ background: "#FF9F4C" }}
              animate={{
                left: [`calc(50% + ${Math.cos(angle) * (r + 8)}px)`, `calc(50% + ${Math.cos(angle + Math.PI) * (r + 8)}px)`],
                top: [`calc(50% + ${Math.sin(angle) * (r + 8)}px)`, `calc(50% + ${Math.sin(angle + Math.PI) * (r + 8)}px)`],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{ duration: 5 + i * 0.25, repeat: Infinity, ease: "linear", delay: i * 0.15 + 0.6 }} />
          </React.Fragment>
        );
      })}

      {/* Data stream particles */}
      {dataStreams.map((p) => (
        <motion.div key={`ds-${p.id}`} className="absolute" style={{ width: 1.5, height: p.h * 3, background: `linear-gradient(to top, transparent, #FF9F4C)`, left: `${p.x}%`, filter: "blur(0.3px)" }}
          animate={{ top: ["110%", "-10%"], opacity: [0, p.o, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "linear", delay: p.delay }} />
      ))}

      {/* Central core */}
      <motion.div className="relative z-10 w-[140px] h-[140px] lg:w-[170px] lg:h-[170px] rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(255,159,76,0.18) 0%, rgba(255,159,76,0.06) 35%, rgba(255,212,168,0.02) 65%, transparent 85%)",
          border: "1.5px solid rgba(255,159,76,0.1)", boxShadow: "0 0 100px rgba(255,159,76,0.06), inset 0 0 100px rgba(255,159,76,0.03)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <motion.div className="absolute inset-[18%] rounded-full"
          style={{ border: "1px solid rgba(255,159,76,0.12)", background: "radial-gradient(circle, rgba(255,159,76,0.12) 0%, transparent 70%)" }}
          animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
        <div className="w-[64px] h-[64px] lg:w-[76px] lg:h-[76px] rounded-full flex items-center justify-center"
          style={{ background: "radial-gradient(circle, rgba(255,159,76,0.2) 0%, rgba(255,159,76,0.05) 60%, transparent 100%)", border: "1px solid rgba(255,159,76,0.12)", boxShadow: "0 0 40px rgba(255,159,76,0.1)" }}>
          <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
            <Brain size={32} className="lg:w-[40px] lg:h-[40px]" style={{ color: "#FF9F4C", opacity: 0.85 }} />
          </motion.div>
        </div>
        {[...Array(12)].map((_, i) => (
          <motion.div key={`ns-${i}`} className="absolute w-[3px] h-[3px] rounded-full"
            style={{ background: i % 3 === 0 ? "#FF9F4C" : i % 3 === 1 ? "#E8852E" : "#FFB366", boxShadow: `0 0 5px ${i % 3 === 0 ? "#FF9F4C" : "#E8852E"}` }}
            animate={{
              x: [0, Math.cos((i / 12) * Math.PI * 2) * 50, 0],
              y: [0, Math.sin((i / 12) * Math.PI * 2) * 50, 0],
              opacity: [0, 1, 0], scale: [0, 1.8, 0],
            }}
            transition={{ duration: 2.8 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }} />
        ))}
      </motion.div>

      {/* Floating glass cards */}
      {cards.map((card, i) => (
        <motion.div key={card.label} className="absolute rounded-xl px-3 py-2 lg:px-4 lg:py-2.5 text-center backdrop-blur-2xl"
          style={{
            left: `calc(50% + ${card.x})`, top: `calc(50% + ${card.y})`,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: card.delay, opacity: { duration: 0.8, delay: 1.2 + card.delay } }}>
          <motion.p className="text-[11px] lg:text-xs font-bold" style={{ color: "#FF9F4C" }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: card.delay }}>
            {card.value}
          </motion.p>
          <p className="text-[9px] lg:text-[10px]" style={{ color: "rgba(107,107,107,0.85)" }}>{card.label}</p>
        </motion.div>
      ))}

      {/* Helix tech dots */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 110 + Math.sin(i * 2.5) * 18;
        return (
          <motion.div key={`ht-${i}`} className="absolute w-[3px] h-[3px] rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px - 1.5px)`, top: `calc(50% + ${Math.sin(angle) * r}px - 1.5px)`,
              background: i % 4 === 0 ? "#FF9F4C" : i % 4 === 1 ? "#E8852E" : i % 4 === 2 ? "#FFB366" : "rgba(45,45,45,0.15)",
            }}
            animate={{ opacity: [0.08, 1, 0.08], scale: [0.2, 1.5, 0.2] }}
            transition={{ duration: 1.8 + i * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }} />
        );
      })}

      {/* Ambient shapes */}
      <motion.div className="absolute w-[18px] h-[18px] border border-[#FF9F4C]/15 rounded-sm" style={{ top: "8%", left: "6%" }}
        animate={{ rotate: 360, opacity: [0.08, 0.25, 0.08] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute w-[12px] h-[12px] border border-[#E8852E]/10 rounded-full" style={{ top: "12%", right: "8%" }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.08, 0.2, 0.08] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[14px] h-[14px] border border-[#FF9F4C]/10" style={{ bottom: "15%", right: "6%", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
        animate={{ rotate: [0, 360], opacity: [0.06, 0.18, 0.06] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute w-[8px] h-[8px] bg-[#FF9F4C]/10 rounded-full" style={{ bottom: "25%", left: "10%" }}
        animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
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
      {/* ═══ CINEMATIC HERO ═══ */}
      <section ref={heroRef} onMouseMove={handleHeroMouseMove}
        className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "100dvh", background: "#F5EDE4" }}>
        <ThreeDScene mousePos={mousePos} />

        {/* Deep ambient glow orbs */}
        <motion.div className="absolute rounded-full blur-[200px] pointer-events-none z-[1]" style={{ width: "55vw", height: "55vw", maxWidth: 800, maxHeight: 800, top: "-25%", left: "-15%", background: "rgba(255,159,76,0.05)" }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full blur-[200px] pointer-events-none z-[1]" style={{ width: "45vw", height: "45vw", maxWidth: 600, maxHeight: 600, bottom: "-15%", right: "15%", background: "rgba(232,133,46,0.04)" }}
          animate={{ scale: [1.3, 0.8, 1.3], opacity: [0.04, 0.08, 0.04] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
        <motion.div className="absolute rounded-full blur-[160px] pointer-events-none z-[1]" style={{ width: "35vw", height: "35vw", maxWidth: 450, maxHeight: 450, top: "35%", right: "3%", background: "rgba(255,179,102,0.03)" }}
          animate={{ scale: [0.7, 1.5, 0.7], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }} />

        {/* Floating geometric elements */}
        <motion.div className="absolute z-[1] pointer-events-none" style={{ top: "12%", left: "4%", width: 24, height: 24, border: "1px solid rgba(255,159,76,0.07)", borderRadius: 4 }}
          animate={{ rotate: 360, y: [-12, 12, -12] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute z-[1] pointer-events-none" style={{ top: "55%", left: "2%", width: 10, height: 10, background: "rgba(255,159,76,0.03)", borderRadius: "50%" }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute z-[1] pointer-events-none" style={{ top: "20%", right: "5%", width: 18, height: 18, border: "1px solid rgba(232,133,46,0.05)", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
          animate={{ rotate: [0, 360], y: [-10, 10, -10] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute z-[1] pointer-events-none" style={{ bottom: "18%", right: "12%", width: 7, height: 7, background: "rgba(255,159,76,0.04)", borderRadius: "50%" }}
          animate={{ scale: [1, 2.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />

        {/* Mouse-follow glow */}
        <motion.div className="absolute z-[1] pointer-events-none rounded-full blur-[180px]"
          style={{ width: 450, height: 450, left: `calc(${mousePos.x * 100}% - 225px)`, top: `calc(${mousePos.y * 100}% - 225px)`, background: "radial-gradient(circle, rgba(255,159,76,0.04) 0%, transparent 70%)", transition: "left 0.8s ease, top 0.8s ease" }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex-1 flex items-center">
          <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-24 pb-16">
            {/* ═══ LEFT: Editorial Content (3D tilt) ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ perspective: 800 }}
              className="origin-center">
              <motion.div
                animate={{
                  rotateX: (mousePos.y - 0.5) * -3,
                  rotateY: (mousePos.x - 0.5) * 3,
                }}
                transition={{ type: "spring", stiffness: 20, damping: 12 }}>
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
              <motion.p className="text-base lg:text-lg leading-relaxed max-w-lg mb-10" style={{ color: "#6B6B6B" }}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.9 }}>
                Neural Sync is an AI-powered smart education platform that helps students learn through{" "}
                <span style={{ color: "#FF9F4C", fontWeight: 600 }}>AI tutors, virtual labs, smart notes, exam preparation,</span>{" "}
                adaptive learning, and interactive educational tools — all in one place, completely free.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div className="flex flex-wrap items-center gap-4"
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
                    style={{ boxShadow: "inset 0 0 0 1px rgba(255,159,76,0.12), 0 0 30px rgba(255,159,76,0.04)" }} />
                  <FlaskConical size={16} className="relative z-10 group-hover:rotate-[-12deg] transition-transform duration-500" />
                  <span className="relative z-10">Explore Features</span>
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div className="flex flex-wrap items-center gap-10 mt-12 pt-8"
                style={{ borderTop: "1px solid rgba(45,45,45,0.05)" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 2.6 }}>
                {[
                  { value: "10+", label: "AI Tools" },
                  { value: "50+", label: "Virtual Labs" },
                  { value: "0$", label: "Always Free" },
                ].map((s, i) => (
                  <motion.div key={s.label} className="flex items-center gap-3 group"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 2.7 + i * 0.12 }}>
                    <span className="text-xl font-bold font-serif group-hover:scale-110 transition-transform duration-300" style={{ color: "#FF9F4C" }}>{s.value}</span>
                    <span className="text-xs tracking-wide" style={{ color: "#9A9A9A" }}>{s.label}</span>
                  </motion.div>
                ))}
              </motion.div>
              {/* close inner tilt motion.div */}
            </motion.div>
            {/* close outer perspective motion.div */}
            </motion.div>

            {/* ═══ RIGHT: Hero Image ═══ */}
            <motion.div className="relative h-[320px] sm:h-[420px] lg:h-[580px] rounded-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ boxShadow: "0 8px 40px rgba(255,159,76,0.15)" }}>
              <img
                src="/images/hero-orange-gradient.jpg"
                alt="Neural Sync AI Learning Platform"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center" }}
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, rgba(255,159,76,0.15) 0%, rgba(255,212,168,0.05) 50%, transparent 100%)",
              }} />
              {/* Floating badge */}
              <motion.div className="absolute top-4 right-4 lg:top-6 lg:right-6 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.15)" }}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                AI Powered
              </motion.div>
              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3"
                style={{ background: "linear-gradient(to top, rgba(245,237,228,0.4), transparent)" }} />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 0.8 }}>
          <motion.span className="text-[9px] font-semibold uppercase tracking-[0.25em]" style={{ color: "#9A9A9A" }}
            animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}>
            Scroll
          </motion.span>
          <motion.div className="flex flex-col items-center gap-[3px]" animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <motion.div className="w-[14px] h-[1.5px] rounded-full" style={{ background: "#FF9F4C" }}
              animate={{ opacity: [0.3, 1, 0.3], width: ["10px", "14px", "10px"] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="w-[10px] h-[1.5px] rounded-full" style={{ background: "#FF9F4C" }}
              animate={{ opacity: [0.15, 0.5, 0.15], width: ["7px", "10px", "7px"] }} transition={{ duration: 2, repeat: Infinity, delay: 0.35 }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ PREMIUM FEATURE STRIP ═══ */}
      <section className="relative px-6 -mt-16 md:-mt-20 z-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            {FEATURE_STRIP.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <InteractiveCard intensity={4}
                  className="group relative rounded-2xl p-7 transition-all duration-700 h-full overflow-hidden text-center"
                  style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px)", border: "1px solid rgba(45,45,45,0.05)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.02)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${f.accent}06 0%, transparent 70%)` }} />
                  <div className="flex justify-center mb-5">
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]"
                      style={{ background: `${f.accent}08`, border: `1px solid ${f.accent}12` }}>
                      <f.icon size={24} style={{ color: f.accent }} />
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2.5" style={{ color: "#2D2D2D" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>{f.desc}</p>
                  <motion.div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />
                </InteractiveCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ IMMERSIVE VISION ═══ */}
      <section className="relative px-6 py-28 lg:py-36 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Image mosaic */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
            <div className="relative">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 relative overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(45,45,45,0.04)", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}>
                  <motion.img src="https://images.unsplash.com/photo-1509062526246-a8fbbc2e7c5a?w=800&q=85" alt="Student"
                    className="rounded-2xl object-cover h-80 w-full" loading="lazy"
                    style={{ scale: visionImgScale, y: visionImgParallax }}
                    whileHover={{ scale: 1.06 }} transition={{ duration: 0.8 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "1px solid rgba(45,45,45,0.04)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=85" alt="Science"
                      className="rounded-2xl object-cover h-full w-full" loading="lazy"
                      whileHover={{ scale: 1.08 }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl flex-1" style={{ border: "1px solid rgba(45,45,45,0.04)" }}>
                    <motion.img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=85" alt="AI"
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
