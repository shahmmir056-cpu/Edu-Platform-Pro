import { useEffect, useMemo, useRef, useCallback } from "react";
import { motion, useAnimationControls } from "framer-motion";

const REACH_DURATION = 3.2;
const TOUCH_TIME = REACH_DURATION * 1000;
const GLOW_TIME = TOUCH_TIME + 400;
const RING_TIME = GLOW_TIME + 200;
const PARTICLE_TIME = RING_TIME + 100;
const COMPLETE_TIME = PARTICLE_TIME + 2200;

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  trail: boolean;
}

function makeParticles(count: number): Particle[] {
  const colors = ["#00ffff", "#ffffff", "#ff3399", "#00ddff", "#ff66cc", "#66ffff"];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const distance = 80 + Math.random() * 220;
    const size = 2 + Math.random() * 7;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = 0.8 + Math.random() * 0.8;
    const delay = Math.random() * 0.2;
    const trail = Math.random() > 0.6;
    return { id: i, angle, distance, size, color, duration, delay, trail };
  });
}

interface HandConnectionProps {
  onComplete?: () => void;
}

export function HandConnection({ onComplete }: HandConnectionProps) {
  const leftHand = useAnimationControls();
  const rightHand = useAnimationControls();
  const glowControls = useAnimationControls();
  const fingertipGlow = useAnimationControls();
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const particles = useMemo(() => makeParticles(60), []);
  const sparks = useMemo(() => makeParticles(30), []);

  const clearTimers = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    clearTimers();
    const timers: ReturnType<typeof setTimeout>[] = [];

    leftHand.start({
      x: 0,
      opacity: 1,
      transition: { duration: REACH_DURATION, ease: [0.25, 0.1, 0.25, 1] },
    });
    rightHand.start({
      x: 0,
      opacity: 1,
      transition: { duration: REACH_DURATION, ease: [0.25, 0.1, 0.25, 1] },
    });

    timers.push(
      setTimeout(() => {
        fingertipGlow.start({
          opacity: [0, 1],
          scale: [0.5, 1.2],
          transition: { duration: 0.6, ease: "easeOut" },
        });
      }, TOUCH_TIME)
    );

    timers.push(
      setTimeout(() => {
        glowControls.start({
          scale: [0, 1.5, 1],
          opacity: [0, 1, 0.9],
          transition: { duration: 0.6, ease: "easeOut" },
        });
      }, GLOW_TIME)
    );

    timers.push(
      setTimeout(() => onComplete?.(), COMPLETE_TIME)
    );

    timeoutRefs.current = timers;
    return clearTimers;
  }, [leftHand, rightHand, glowControls, fingertipGlow, onComplete, clearTimers]);

  return (
    <div className="relative w-full" style={{ height: 400 }}>
      {/* Ambient background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(185 100% 50% / 0.25) 0%, hsl(325 100% 60% / 0.08) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* ─── HUMAN HAND (left, reaching right) ─── */}
      <motion.div
        initial={{ x: -180, opacity: 0 }}
        animate={leftHand}
        className="absolute left-[calc(50%-220px)] top-1/2 -translate-y-1/2 z-10"
      >
        <svg width="280" height="300" viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arm / wrist extending left */}
          <path
            d="M0 145 C20 142 50 138 80 140 C95 141 105 143 110 150 L110 170 C105 177 95 179 80 178 C50 176 20 172 0 169 Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
          />
          {/* Subtle arm lines */}
          <line x1="10" y1="152" x2="70" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <line x1="10" y1="163" x2="70" y2="164" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

          {/* Palm */}
          <path
            d="M105 120 C100 115 95 105 98 95 C100 88 108 85 115 88 L155 100 C165 104 170 115 168 128 L165 160 C163 172 155 180 145 182 L120 182 C110 180 104 172 103 162 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.8"
          />
          {/* Palm creases */}
          <path d="M110 130 C125 126 145 128 160 132" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
          <path d="M108 148 C125 144 148 147 162 150" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />
          <path d="M112 165 C128 162 145 164 158 166" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none" />

          {/* INDEX FINGER — extended, pointing right (the reaching finger) */}
          <path
            d="M155 100 C162 96 180 88 210 82 C230 78 250 76 265 77 C272 77 276 80 276 85 C276 90 272 94 265 95 C250 97 230 100 210 104 C190 108 170 112 162 115"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
          />
          {/* Fingernail */}
          <path
            d="M258 80 C262 79 268 79 272 80 C275 81 276 83 275 86 C274 89 270 91 266 91 C262 91 258 90 257 87 C256 84 257 81 258 80 Z"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          {/* Fingerprint lines on index finger */}
          <path d="M220 84 C222 82 226 81 230 82" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
          <path d="M235 82 C238 80 242 80 245 81" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
          <path d="M248 80 C251 79 255 79 258 80" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />

          {/* MIDDLE FINGER — slightly curled */}
          <path
            d="M148 108 C155 100 162 92 168 88 C172 86 175 88 174 92 C173 96 168 104 160 112 C155 117 148 122 144 124"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />

          {/* RING FINGER — more curled */}
          <path
            d="M140 116 C146 110 150 104 154 100 C157 98 159 100 158 104 C157 108 152 115 146 122 C142 126 138 128 136 129"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.3"
          />

          {/* PINKY — fully curled */}
          <path
            d="M132 124 C136 118 139 114 142 112 C144 111 146 113 145 116 C144 119 140 124 136 130 C133 134 130 135 128 136"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
          />

          {/* THUMB — below palm */}
          <path
            d="M110 150 C104 155 96 164 92 172 C89 178 90 184 95 187 C100 189 106 185 110 178 C114 172 116 164 115 158"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          <path d="M96 174 C98 170 102 168 106 170" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" fill="none" />

          {/* INDEX FINGERTIP — glow point (the touching point) */}
          <circle cx="274" cy="86" r="6" fill="rgba(255,255,255,0.15)">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="274" cy="86" r="3" fill="rgba(255,255,255,0.3)">
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      {/* ─── AI / ROBOTIC HAND (right, reaching left) ─── */}
      <motion.div
        initial={{ x: 180, opacity: 0 }}
        animate={rightHand}
        className="absolute right-[calc(50%-220px)] top-1/2 -translate-y-1/2 z-10"
      >
        <svg width="280" height="300" viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
          {/* Arm / wrist extending left (mirrored = extends right in screen) */}
          <path
            d="M0 145 C20 142 50 138 80 140 C95 141 105 143 110 150 L110 170 C105 177 95 179 80 178 C50 176 20 172 0 169 Z"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="1.5"
          />
          {/* Circuit traces on arm */}
          <line x1="10" y1="152" x2="70" y2="150" stroke="#00ffff" strokeWidth="0.8" opacity="0.3" />
          <line x1="10" y1="163" x2="70" y2="164" stroke="#00ffff" strokeWidth="0.8" opacity="0.2" />
          <circle cx="40" cy="155" r="2" fill="#00ffff" opacity="0.4" />
          <circle cx="60" cy="153" r="1.5" fill="#00ffff" opacity="0.3" />

          {/* Palm — geometric/mechanical */}
          <path
            d="M105 120 C100 115 95 105 98 95 C100 88 108 85 115 88 L155 100 C165 104 170 115 168 128 L165 160 C163 172 155 180 145 182 L120 182 C110 180 104 172 103 162 Z"
            fill="hsl(240 10% 6%)"
            stroke="#00ffff"
            strokeWidth="2"
          />
          {/* Circuit traces on palm */}
          <line x1="112" y1="120" x2="158" y2="120" stroke="#00ffff" strokeWidth="1" opacity="0.35" />
          <line x1="112" y1="135" x2="158" y2="135" stroke="#00ffff" strokeWidth="1" opacity="0.25" />
          <line x1="112" y1="150" x2="158" y2="150" stroke="#00ffff" strokeWidth="1" opacity="0.2" />
          <line x1="112" y1="165" x2="155" y2="165" stroke="#00ffff" strokeWidth="0.8" opacity="0.15" />
          <line x1="135" y1="90" x2="135" y2="175" stroke="#00ffff" strokeWidth="0.8" opacity="0.15" />
          {/* Junction nodes */}
          <circle cx="112" cy="120" r="3" fill="#00ffff" opacity="0.5" />
          <circle cx="158" cy="120" r="3" fill="#00ffff" opacity="0.5" />
          <circle cx="112" cy="150" r="2.5" fill="#00ffff" opacity="0.35" />
          <circle cx="158" cy="150" r="2.5" fill="#00ffff" opacity="0.35" />
          <circle cx="135" cy="135" r="4" fill="#00ffff" opacity="0.2" />
          <circle cx="135" cy="135" r="2" fill="#00ffff" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* INDEX FINGER — extended, pointing right (mirrored = points left on screen) */}
          <path
            d="M155 100 C162 96 180 88 210 82 C230 78 250 76 265 77 C272 77 276 80 276 85 C276 90 272 94 265 95 C250 97 230 100 210 104 C190 108 170 112 162 115"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="2.2"
          />
          {/* Circuit traces on index finger */}
          <line x1="175" y1="94" x2="255" y2="86" stroke="#00ffff" strokeWidth="0.8" opacity="0.3" />
          <line x1="180" y1="102" x2="245" y2="94" stroke="#00ffff" strokeWidth="0.6" opacity="0.2" />
          {/* Joint nodes on index finger */}
          <circle cx="195" cy="90" r="2.5" fill="#00ffff" opacity="0.5" />
          <circle cx="225" cy="86" r="2.5" fill="#00ffff" opacity="0.4" />
          <circle cx="250" cy="83" r="2" fill="#00ffff" opacity="0.4" />
          {/* Fingertip — mechanical cap */}
          <rect x="260" y="78" width="18" height="14" rx="3" fill="hsl(240 10% 8%)" stroke="#00ffff" strokeWidth="1.5" />
          <circle cx="269" cy="85" r="3" fill="#00ffff" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* MIDDLE FINGER — slightly curled, mechanical segments */}
          <path
            d="M148 108 C155 100 162 92 168 88 C172 86 175 88 174 92 C173 96 168 104 160 112 C155 117 148 122 144 124"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle cx="162" cy="97" r="1.5" fill="#00ffff" opacity="0.4" />

          {/* RING FINGER */}
          <path
            d="M140 116 C146 110 150 104 154 100 C157 98 159 100 158 104 C157 108 152 115 146 122 C142 126 138 128 136 129"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="1.3"
            opacity="0.7"
          />

          {/* PINKY */}
          <path
            d="M132 124 C136 118 139 114 142 112 C144 111 146 113 145 116 C144 119 140 124 136 130 C133 134 130 135 128 136"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="1.2"
            opacity="0.6"
          />

          {/* THUMB — mechanical */}
          <path
            d="M110 150 C104 155 96 164 92 172 C89 178 90 184 95 187 C100 189 106 185 110 178 C114 172 116 164 115 158"
            fill="hsl(240 10% 5%)"
            stroke="#00ffff"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle cx="96" cy="175" r="1.5" fill="#00ffff" opacity="0.3" />

          {/* Glow outline */}
          <path
            d="M105 120 C100 115 95 105 98 95 C100 88 108 85 115 88 L155 100 C165 104 170 115 168 128 L165 160 C163 172 155 180 145 182 L120 182 C110 180 104 172 103 162 Z"
            fill="none"
            stroke="#00ffff"
            strokeWidth="2"
            opacity="0.1"
          >
            <animate attributeName="opacity" values="0.05;0.18;0.05" dur="2.5s" repeatCount="indefinite" />
          </path>
        </svg>
      </motion.div>

      {/* ─── FINGERTIP TOUCH GROW ─── */}
      <motion.div
        animate={fingertipGlow}
        initial={{ opacity: 0, scale: 0.5 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-20 pointer-events-none"
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, hsl(185 100% 60% / 0.6) 30%, transparent 70%)",
            boxShadow: "0 0 20px hsl(185 100% 50% / 0.8), 0 0 50px hsl(185 100% 50% / 0.4), 0 0 80px hsl(325 100% 60% / 0.2)",
          }}
        />
      </motion.div>

      {/* ─── MAIN ENERGY GLOW ─── */}
      <motion.div
        animate={glowControls}
        initial={{ scale: 0, opacity: 0 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-20 pointer-events-none"
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(185 100% 60% / 0.9) 0%, hsl(185 100% 50% / 0.4) 35%, transparent 70%)",
            boxShadow: "0 0 40px hsl(185 100% 50% / 0.7), 0 0 80px hsl(185 100% 50% / 0.35), 0 0 120px hsl(325 100% 60% / 0.2)",
          }}
        />
      </motion.div>

      {/* ─── ENERGY RING 1 ─── */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={glowControls}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-19 pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: [0.5, 3.5], opacity: [0.8, 0] }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "2px solid hsl(185 100% 50% / 0.5)",
            boxShadow: "0 0 20px hsl(185 100% 50% / 0.3), inset 0 0 20px hsl(185 100% 50% / 0.1)",
          }}
        />
      </motion.div>

      {/* ─── ENERGY RING 2 (magenta) ─── */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={glowControls}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] z-19 pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.3, opacity: 0.7 }}
          animate={{ scale: [0.3, 2.8], opacity: [0.6, 0] }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "1.5px solid hsl(325 100% 60% / 0.4)",
            boxShadow: "0 0 15px hsl(325 100% 60% / 0.2)",
          }}
        />
      </motion.div>

      {/* ─── PARTICLE BURST ─── */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.2, 1, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: 0.3 + p.delay,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2 z-25 pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 5}px ${p.color}50`,
          }}
        />
      ))}

      {/* ─── TRAIL PARTICLES (lines radiating outward) ─── */}
      {sparks.map((s) => (
        <motion.div
          key={`trail-${s.id}`}
          initial={{ x: 0, y: 0, opacity: 0, scaleX: 0 }}
          animate={{
            x: Math.cos(s.angle) * s.distance * 0.7,
            y: Math.sin(s.angle) * s.distance * 0.7,
            opacity: [0, 0.6, 0],
            scaleX: [0, 1, 0.3],
          }}
          transition={{
            duration: s.duration * 0.7,
            delay: 0.35 + s.delay,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/2 z-24 pointer-events-none"
          style={{
            width: s.size * 4,
            height: 1,
            background: `linear-gradient(90deg, ${s.color}, transparent)`,
            transformOrigin: "0% 50%",
            rotate: `${(s.angle * 180) / Math.PI}deg`,
          }}
        />
      ))}
    </div>
  );
}
