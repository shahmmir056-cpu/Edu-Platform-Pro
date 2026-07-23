import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

const STAGES = [
  { id: "interphase", name: "Interphase", description: "DNA replicates, cell prepares for division. Chromatin is diffuse." },
  { id: "prophase", name: "Prophase", description: "Chromatin condenses into visible chromosomes. Nuclear envelope begins to break down." },
  { id: "prometaphase", name: "Prometaphase", description: "Nuclear envelope dissolves. Spindle fibers attach to chromosomes at kinetochores." },
  { id: "metaphase", name: "Metaphase", description: "Chromosomes align at the cell's equator (metaphase plate)." },
  { id: "anaphase", name: "Anaphase", description: "Sister chromatids separate and move to opposite poles of the cell." },
  { id: "telophase", name: "Telophase", description: "Nuclear envelopes reform around each set of chromosomes. Chromosomes begin to decondense." },
  { id: "cytokinesis", name: "Cytokinesis", description: "Cytoplasm divides. Two identical daughter cells are formed." },
];

const W = 700;
const H = 400;
const CX = W / 2;
const CY = H / 2;

export function MitosisSim({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    const bgGrad = ctx.createRadialGradient(CX, CY, 20, CX, CY, 300);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const stage = STAGES[currentStage];
    const t = progress;

    // Draw cell
    ctx.strokeStyle = "rgba(234,179,8,0.6)";
    ctx.lineWidth = 2;

    if (currentStage < 5) {
      // Single cell
      const stretch = currentStage >= 4 ? 1 + t * 0.3 : 1;
      const pinch = currentStage >= 4 ? 1 - t * 0.4 : 1;
      ctx.beginPath();
      ctx.ellipse(CX, CY, 120 * stretch, 100 * pinch, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(234,179,8,0.03)";
      ctx.fill();
    } else {
      // Two cells forming
      const sep = 30 + t * 60;
      const pinch = 1 - t * 0.8;
      ctx.beginPath();
      ctx.ellipse(CX - sep, CY, 65, 90 * Math.max(0.3, pinch), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(CX + sep, CY, 65, 90 * Math.max(0.3, pinch), 0, 0, Math.PI * 2);
      ctx.stroke();

      if (currentStage === 6 && t > 0.5) {
        ctx.strokeStyle = "rgba(234,179,8,0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(CX, CY - 100);
        ctx.lineTo(CX, CY + 100);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw chromosomes
    const chromCount = 6;
    const chromColor = "#8b5cf6";

    if (currentStage === 0) {
      // Interphase — diffuse chromatin
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 30 + Math.sin(i * 2.5) * 15;
        ctx.strokeStyle = chromColor + "44";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const sx = CX + Math.cos(angle) * r;
        const sy = CY + Math.sin(angle) * r;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + 10, sy - 10, sx - 10, sy + 10, sx + 5, sy + 5);
        ctx.stroke();
      }
      // Nucleus
      ctx.strokeStyle = "rgba(139,92,246,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CX, CY, 50, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentStage <= 2) {
      // Prophase / Prometaphase — condensed chromosomes
      for (let i = 0; i < chromCount; i++) {
        const angle = (i / chromCount) * Math.PI * 2;
        const r = 30 + i * 3;
        const x = CX + Math.cos(angle) * r;
        const y = CY + Math.sin(angle) * r;
        // X shape
        ctx.strokeStyle = chromColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 8);
        ctx.lineTo(x + 5, y + 8);
        ctx.moveTo(x + 5, y - 8);
        ctx.lineTo(x - 5, y + 8);
        ctx.stroke();
        // Centromere
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (currentStage === 1) {
        // Breaking nuclear envelope
        ctx.strokeStyle = "rgba(139,92,246,0.2)";
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(CX, CY, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (currentStage === 3) {
      // Metaphase — aligned at center
      for (let i = 0; i < chromCount; i++) {
        const y = CY - 40 + i * 16;
        ctx.strokeStyle = chromColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(CX - 5, y - 8);
        ctx.lineTo(CX + 5, y + 8);
        ctx.moveTo(CX + 5, y - 8);
        ctx.lineTo(CX - 5, y + 8);
        ctx.stroke();
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(CX, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Spindle fibers
        ctx.strokeStyle = "rgba(34,197,94,0.2)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(CX - 120, CY);
        ctx.lineTo(CX, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CX + 120, CY);
        ctx.lineTo(CX, y);
        ctx.stroke();
      }
      // Centrosomes
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(CX - 120, CY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CX + 120, CY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentStage === 4) {
      // Anaphase — separating
      const sep = 10 + t * 40;
      for (let i = 0; i < chromCount / 2; i++) {
        const y = CY - 25 + i * 20;
        ctx.strokeStyle = chromColor;
        ctx.lineWidth = 3;
        // Left set
        ctx.beginPath();
        ctx.moveTo(CX - sep - 3, y - 6);
        ctx.lineTo(CX - sep + 3, y + 6);
        ctx.stroke();
        // Right set
        ctx.beginPath();
        ctx.moveTo(CX + sep - 3, y - 6);
        ctx.lineTo(CX + sep + 3, y + 6);
        ctx.stroke();
      }
    } else {
      // Telophase / Cytokinesis
      const sep = 60 + (currentStage === 6 ? t * 40 : 0);
      for (let set = 0; set < 2; set++) {
        const sx = CX + (set === 0 ? -sep : sep);
        for (let i = 0; i < chromCount / 2; i++) {
          const y = CY - 15 + i * 12;
          ctx.strokeStyle = currentStage === 6 ? chromColor + "66" : chromColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - 3, y - 5);
          ctx.lineTo(sx + 3, y + 5);
          ctx.stroke();
        }
        // Reforming nucleus
        ctx.strokeStyle = "rgba(139,92,246,0.3)";
        ctx.setLineDash(currentStage === 6 ? [] : [3, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, CY, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Stage label
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(stage.name, CX, 30);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(stage.description, CX, 48);
    ctx.textAlign = "start";
  }, [currentStage, progress]);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      draw();
      if (isPlaying) {
        setProgress((p) => {
          if (p >= 1) {
            if (currentStage < STAGES.length - 1) {
              setCurrentStage((s) => s + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 1;
            }
          }
          return p + 0.005;
        });
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [draw, isPlaying, currentStage]);

  const handleQuiz = () => {
    if (quizAnswer === currentStage) {
      setScore((s) => s + 1);
    }
    setQuizMode(false);
    setQuizAnswer(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-zinc-700" />
      </div>

      {/* Stage navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setCurrentStage(i); setProgress(0); setIsPlaying(false); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
              i === currentStage ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setIsPlaying(!isPlaying); if (currentStage === STAGES.length - 1 && progress >= 1) { setCurrentStage(0); setProgress(0); } }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? "Pause" : currentStage === STAGES.length - 1 && progress >= 1 ? "Restart" : "Play"}
        </button>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentStage + progress) / STAGES.length) * 100}%` }} />
        </div>
        <span className="text-xs text-zinc-500">{currentStage + 1}/{STAGES.length}</span>
      </div>

      {/* Quiz */}
      <div className="flex gap-2">
        <button
          onClick={() => setQuizMode(!quizMode)}
          className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors"
        >
          {quizMode ? "Close Quiz" : "Test Knowledge"}
        </button>
        {score > 0 && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> {score} correct
          </span>
        )}
      </div>

      {quizMode && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
          <p className="text-sm text-zinc-300 mb-3">Which stage of mitosis is shown above?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setQuizAnswer(i)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                  quizAnswer === i ? "bg-primary/20 text-primary border-primary/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleQuiz}
            disabled={quizAnswer === null}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            Submit Answer
          </button>
        </div>
      )}

      {currentStage === STAGES.length - 1 && progress >= 1 && (
        <button onClick={() => onComplete?.(100, { score })}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors">
          Complete Mitosis Lab
        </button>
      )}
    </div>
  );
}
