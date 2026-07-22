import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform, type TargetAndTransition } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── SCROLL REVEAL ──────────────────────────────────────────────────────────

type RevealDir = "up" | "down" | "left" | "right" | "scale" | "fade";

const dirMap: Record<RevealDir, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  up:    { initial: { opacity: 0, y: 40 },  animate: { opacity: 1, y: 0 } },
  down:  { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 } },
  left:  { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 } },
  right: { initial: { opacity: 0, x: 50 },  animate: { opacity: 1, x: 0 } },
  scale: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
  fade:  { initial: { opacity: 0 },        animate: { opacity: 1 } },
};

export function ScrollReveal({
  children,
  dir = "up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: {
  children: ReactNode;
  dir?: RevealDir;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const { initial, animate } = dirMap[dir];

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── STAGGER CONTAINER ──────────────────────────────────────────────────────

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── TEXT REVEAL (word-by-word) ─────────────────────────────────────────────

export function TextReveal({
  text,
  className,
  delay = 0,
  tag: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const words = text.split(" ");

  return (
    <Tag className={cn("overflow-hidden", className)} aria-label={text}>
      <motion.div ref={ref} className="flex flex-wrap gap-x-[0.3em]">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20, rotateX: -40 }}
            animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    </Tag>
  );
}

// ─── PARALLAX SECTION ───────────────────────────────────────────────────────

export function ParallaxSection({
  children,
  speed = 0.3,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// ─── GLASS CARD ─────────────────────────────────────────────────────────────

export function GlassCard({
  children,
  className,
  hoverScale = true,
}: {
  children: ReactNode;
  className?: string;
  hoverScale?: boolean;
}) {
  return (
    <motion.div
      whileHover={hoverScale ? { y: -6, scale: 1.02 } : {}}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/5",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ─── FLOATING ORB (decorative) ──────────────────────────────────────────────

export function FloatingOrb({
  size = 200,
  color = "hsl(var(--primary))",
  blur = 80,
  className,
}: {
  size?: number;
  color?: string;
  blur?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.12,
      }}
    />
  );
}

// ─── MAGNETIC BUTTON ────────────────────────────────────────────────────────

export function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("transition-transform duration-200 ease-out", className)}
    >
      {children}
    </button>
  );
}

// ─── GLOW PULSE ─────────────────────────────────────────────────────────────

export function GlowPulse({
  className,
  color = "hsl(var(--primary))",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className={cn("absolute inset-0 rounded-2xl pointer-events-none", className)}
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.15 }}
    />
  );
}

// ─── LINE DRAW SVG ──────────────────────────────────────────────────────────

export function LineDrawSVG({
  d,
  className,
  duration = 2,
  delay = 0,
  strokeColor,
}: {
  d: string;
  className?: string;
  duration?: number;
  delay?: number;
  strokeColor?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <svg ref={ref} viewBox="0 0 200 200" className={cn("w-full h-full", className)}>
      <motion.path
        d={d}
        fill="none"
        stroke={strokeColor || "hsl(var(--primary))"}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration, delay, ease: "easeInOut" }}
      />
    </svg>
  );
}

// ─── COUNTER ANIMATION ──────────────────────────────────────────────────────

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  suffix = "",
  prefix = "",
  className,
}: {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        {prefix}
      </motion.span>
      {inView ? (
        <CountUp from={from} to={to} duration={duration} />
      ) : (
        from
      )}
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
      >
        {suffix}
      </motion.span>
    </motion.span>
  );
}

function CountUp({ from, to, duration }: { from: number; to: number; duration: number }) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, to, duration]);

  return <span ref={ref}>{value}</span>;
}
