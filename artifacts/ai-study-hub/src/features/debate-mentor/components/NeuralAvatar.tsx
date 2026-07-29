import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface NeuralAvatarProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  size?: number;
}

export function NeuralAvatar({ isActive, isListening, isSpeaking, size = 120 }: NeuralAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setPulse((p) => p + 0.08), 50);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = size * 2;
    const h = size * 2;
    canvas.width = w;
    canvas.height = h;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const ringR = size * 0.82;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = isSpeaking
      ? `rgba(232, 133, 46, ${0.5 + Math.sin(pulse * 3) * 0.3})`
      : isListening
      ? `rgba(255, 159, 76, ${0.5 + Math.sin(pulse * 2) * 0.25})`
      : `rgba(255, 159, 76, 0.2)`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 0.88, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = isSpeaking
      ? `rgba(232, 133, 46, ${0.25 + Math.sin(pulse * 2) * 0.15})`
      : isListening
      ? `rgba(255, 179, 102, ${0.3 + Math.sin(pulse * 1.5) * 0.15})`
      : `rgba(255, 159, 76, 0.08)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR);
    const baseR = isSpeaking ? 232 : isListening ? 255 : 255;
    const baseG = isSpeaking ? 133 : isListening ? 179 : 159;
    const baseB = isSpeaking ? 46 : isListening ? 102 : 76;
    glow.addColorStop(0, `rgba(${baseR},${baseG},${baseB}, ${isSpeaking ? 0.12 : isListening ? 0.08 : 0.03})`);
    glow.addColorStop(1, `rgba(${baseR},${baseG},${baseB}, 0)`);
    ctx.fillStyle = glow;
    ctx.fill();

    const nodeCount = 8;
    const nodePositions: { x: number; y: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + pulse * 0.4;
      const r = ringR * 0.52 + Math.sin(pulse + i) * (isSpeaking ? 7 : isListening ? 5 : 3);
      const nx = cx + Math.cos(angle) * r;
      const ny = cy + Math.sin(angle) * r;
      nodePositions.push({ x: nx, y: ny });
      const nodeR = 3.5 + Math.sin(pulse + i * 0.7) * 1.5;

      const nGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeR * 3);
      nGlow.addColorStop(0, `rgba(${baseR},${baseG},${baseB}, ${isSpeaking ? 0.18 : isListening ? 0.12 : 0.05})`);
      nGlow.addColorStop(1, `rgba(${baseR},${baseG},${baseB}, 0)`);
      ctx.fillStyle = nGlow;
      ctx.fillRect(nx - nodeR * 3, ny - nodeR * 3, nodeR * 6, nodeR * 6);

      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseR},${baseG},${baseB}, ${isSpeaking ? 0.75 + Math.sin(pulse + i) * 0.2 : isListening ? 0.65 + Math.sin(pulse + i) * 0.2 : 0.4 + Math.sin(pulse + i) * 0.1})`;
      ctx.fill();
    }

    for (let i = 0; i < nodeCount; i++) {
      const next = (i + 1) % nodeCount;
      ctx.beginPath();
      ctx.moveTo(nodePositions[i].x, nodePositions[i].y);
      ctx.lineTo(nodePositions[next].x, nodePositions[next].y);
      ctx.strokeStyle = `rgba(${baseR},${baseG},${baseB}, ${isSpeaking ? 0.25 : isListening ? 0.18 : 0.07})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i % 2 === 0) {
        const opp = (i + 4) % nodeCount;
        ctx.beginPath();
        ctx.moveTo(nodePositions[i].x, nodePositions[i].y);
        ctx.lineTo(nodePositions[opp].x, nodePositions[opp].y);
        ctx.strokeStyle = `rgba(${baseR},${baseG},${baseB}, ${isSpeaking ? 0.1 : isListening ? 0.07 : 0.03})`;
        ctx.stroke();
      }
    }

    const eyeR = size * 0.17;

    ctx.beginPath();
    ctx.arc(cx, cy + 1, eyeR + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, eyeR, 0, Math.PI * 2);
    const eyeGrad = ctx.createRadialGradient(cx - eyeR * 0.2, cy - eyeR * 0.2, 0, cx, cy, eyeR);
    if (isSpeaking) {
      eyeGrad.addColorStop(0, "#FFB366");
      eyeGrad.addColorStop(1, "#E8852E");
    } else if (isListening) {
      eyeGrad.addColorStop(0, "#FFCA80");
      eyeGrad.addColorStop(1, "#FF9F4C");
    } else {
      eyeGrad.addColorStop(0, "#FFB366");
      eyeGrad.addColorStop(1, "#FF9F4C");
    }
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    const pupilR = eyeR * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, pupilR, 0, Math.PI * 2);
    ctx.fillStyle = "#2D2D2D";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - pupilR * 0.35, cy - pupilR * 0.35, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + pupilR * 0.2, cy + pupilR * 0.25, pupilR * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
  }, [size, isActive, isListening, isSpeaking, pulse]);

  const glowColor = isSpeaking
    ? "rgba(232,133,46,0.12)"
    : isListening
    ? "rgba(255,179,102,0.1)"
    : "rgba(255,159,76,0.06)";

  return (
    <motion.div
      className="relative max-w-full"
      style={{ maxWidth: '100%' }}
      animate={{
        scale: isSpeaking ? [1, 1.04, 1] : isListening ? [1, 1.02, 1] : 1,
      }}
      transition={{ duration: isSpeaking ? 0.8 : 1.5, repeat: isSpeaking || isListening ? Infinity : 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, maxWidth: '100%', maxHeight: '100%' }}
        className="relative z-10"
      />
      {(isSpeaking || isListening) && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: isSpeaking ? 2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
