import { useEffect, useRef } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  color?: string;
}

export function VoiceWaveform({
  isActive,
  isListening,
  isSpeaking,
  width = 300,
  height = 60,
  barCount = 32,
  color = "#FF8A3D",
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Idle state — flat line
        ctx.strokeStyle = `rgba(255, 138, 61, 0.2)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += isSpeaking ? 0.08 : isListening ? 0.05 : 0.02;
      const t = timeRef.current;
      const barW = width / barCount;
      const maxBarH = height * 0.8;

      for (let i = 0; i < barCount; i++) {
        const x = i * barW;
        const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);

        let amplitude: number;
        if (isSpeaking) {
          amplitude = (Math.sin(t * 3 + i * 0.5) * 0.5 + 0.5) * (1 - centerDist * 0.3)
            + Math.sin(t * 7 + i * 0.8) * 0.15;
        } else if (isListening) {
          amplitude = (Math.sin(t * 2 + i * 0.3) * 0.5 + 0.5) * 0.4
            + Math.sin(t * 5 + i * 1.2) * 0.08;
        } else {
          amplitude = (Math.sin(t + i * 0.2) * 0.5 + 0.5) * 0.15;
        }

        const barH = Math.max(2, amplitude * maxBarH);
        const y = (height - barH) / 2;

        const alpha = isSpeaking ? 0.8 : isListening ? 0.5 : 0.2;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW - 2, barH, 1);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, barCount, isActive, isListening, isSpeaking, color]);

  return (
    <div style={{ width: '100%', maxWidth: width }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
        className="rounded-xl"
      />
    </div>
  );
}
