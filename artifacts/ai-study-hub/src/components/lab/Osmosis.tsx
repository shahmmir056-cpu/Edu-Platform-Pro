import { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Droplets, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

const SOLUTIONS = [
  { id: "distilled", name: "Distilled Water (0% NaCl)", concentration: 0, type: "hypotonic", color: "#60a5fa" },
  { id: "saline-045", name: "0.45% NaCl (Hypotonic)", concentration: 0.45, type: "hypotonic", color: "#34d399" },
  { id: "saline-09", name: "0.9% NaCl (Isotonic)", concentration: 0.9, type: "isotonic", color: "#a78bfa" },
  { id: "saline-30", name: "3% NaCl (Hypertonic)", concentration: 3.0, type: "hypertonic", color: "#f97316" },
  { id: "saline-10", name: "10% NaCl (Very Hypertonic)", concentration: 10.0, type: "hypertonic", color: "#ef4444" },
];

const W = 700;
const H = 400;
const CELL_X = W / 2;
const CELL_Y = H / 2;

export function OsmosisSim({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSolution, setSelectedSolution] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cellRadius, setCellRadius] = useState(80);
  const [targetRadius, setTargetRadius] = useState(80);
  const [time, setTime] = useState(0);
  const [waterParticles, setWaterParticles] = useState<{ x: number; y: number; vx: number; vy: number; inside: boolean }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [finalVolume, setFinalVolume] = useState(100);
  const animRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initParticles = useCallback(() => {
    const particles: typeof waterParticles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 200 + 100;
      particles.push({
        x: CELL_X + Math.cos(angle) * dist,
        y: CELL_Y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        inside: false,
      });
    }
    setWaterParticles(particles);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sol = SOLUTIONS[selectedSolution];

    ctx.clearRect(0, 0, W, H);

    // Background — solution
    const bgGrad = ctx.createRadialGradient(CELL_X, CELL_Y, 50, CELL_X, CELL_Y, 350);
    bgGrad.addColorStop(0, sol.color + "15");
    bgGrad.addColorStop(1, sol.color + "08");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Water particles
    waterParticles.forEach((p) => {
      const dist = Math.hypot(p.x - CELL_X, p.y - CELL_Y);
      const isInside = dist < cellRadius;
      p.inside = isInside;

      ctx.fillStyle = isInside ? "rgba(96,165,250,0.6)" : "rgba(96,165,250,0.25)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cell membrane
    ctx.strokeStyle = "rgba(234,179,8,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CELL_X, CELL_Y, cellRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Cell fill
    const cellGrad = ctx.createRadialGradient(CELL_X, CELL_Y - 20, 10, CELL_X, CELL_Y, cellRadius);
    cellGrad.addColorStop(0, "rgba(251,191,36,0.15)");
    cellGrad.addColorStop(1, "rgba(217,119,6,0.08)");
    ctx.fillStyle = cellGrad;
    ctx.beginPath();
    ctx.arc(CELL_X, CELL_Y, cellRadius, 0, Math.PI * 2);
    ctx.fill();

    // Nucleus
    ctx.fillStyle = "rgba(139,92,246,0.4)";
    ctx.beginPath();
    ctx.arc(CELL_X, CELL_Y, cellRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(139,92,246,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Animal Cell", CELL_X, CELL_Y + 4);

    ctx.font = "11px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Volume: ${((cellRadius / 80) * 100).toFixed(0)}%`, CELL_X, CELL_Y + 20);

    // Solution label
    ctx.fillStyle = sol.color;
    ctx.font = "bold 12px system-ui";
    ctx.fillText(sol.name, CELL_X, 25);

    // Arrows showing water movement
    if (isRunning) {
      const arrowCount = 5;
      for (let i = 0; i < arrowCount; i++) {
        const angle = (i / arrowCount) * Math.PI * 2;
        const arrowDist = cellRadius + 40;
        const ax = CELL_X + Math.cos(angle) * arrowDist;
        const ay = CELL_Y + Math.sin(angle) * arrowDist;

        const pointsInward = sol.type === "hypotonic";
        const dx = Math.cos(angle) * (pointsInward ? -15 : 15);
        const dy = Math.sin(angle) * (pointsInward ? -15 : 15);

        ctx.strokeStyle = sol.color + "88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - dx, ay - dy);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        const headAngle = pointsInward ? angle : angle + Math.PI;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(headAngle + 0.5) * 8, ay + Math.sin(headAngle + 0.5) * 8);
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(headAngle - 0.5) * 8, ay + Math.sin(headAngle - 0.5) * 8);
        ctx.stroke();
      }
    }

    // Info panel
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(10, H - 70, 250, 60);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(10, H - 70, 250, 60);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui";
    ctx.textAlign = "start";
    ctx.fillText(`Solution: ${sol.concentration}% NaCl`, 18, H - 52);
    ctx.fillText(`Type: ${sol.type}`, 18, H - 38);
    ctx.fillText(`Water ${sol.type === "hypotonic" ? "enters" : sol.type === "hypertonic" ? "leaves" : "flows equally"} the cell`, 18, H - 24);

    ctx.textAlign = "start";
  }, [selectedSolution, cellRadius, waterParticles, isRunning]);

  useEffect(() => { initParticles(); }, [initParticles]);

  useEffect(() => {
    if (!isRunning) return;
    const sol = SOLUTIONS[selectedSolution];
    const target = sol.type === "hypotonic" ? 120 : sol.type === "hypertonic" ? 40 : 80;
    setTargetRadius(target);

    timerRef.current = setInterval(() => {
      setTime((t) => t + 0.1);
      setCellRadius((r) => {
        const diff = target - r;
        return r + diff * 0.02;
      });

      setWaterParticles((prev) =>
        prev.map((p) => {
          const angle = Math.atan2(p.y - CELL_Y, p.x - CELL_X);
          const dist = Math.hypot(p.x - CELL_X, p.y - CELL_Y);
          let vx = p.vx + (Math.random() - 0.5) * 0.5;
          let vy = p.vy + (Math.random() - 0.5) * 0.5;

          if (sol.type === "hypotonic") {
            vx += Math.cos(angle) * -0.15;
            vy += Math.sin(angle) * -0.15;
          } else if (sol.type === "hypertonic") {
            vx += Math.cos(angle) * 0.15;
            vy += Math.sin(angle) * 0.15;
          }

          vx *= 0.95;
          vy *= 0.95;
          let nx = p.x + vx;
          let ny = p.y + vy;

          if (nx < 10 || nx > W - 10) vx *= -1;
          if (ny < 10 || ny > H - 10) vy *= -1;
          nx = Math.max(10, Math.min(W - 10, nx));
          ny = Math.max(10, Math.min(H - 10, ny));

          return { ...p, x: nx, y: ny, vx, vy };
        })
      );
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, selectedSolution]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (isRunning && time > 5) {
      setIsComplete(true);
      setIsRunning(false);
      setFinalVolume(Math.round((cellRadius / 80) * 100));
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [time, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setCellRadius(80);
    setTargetRadius(80);
    setTime(0);
    setIsComplete(false);
    initParticles();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Select Solution</h4>
        <div className="flex flex-wrap gap-2">
          {SOLUTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { if (!isRunning) { setSelectedSolution(i); handleReset(); } }}
              disabled={isRunning}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                i === selectedSolution
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700",
                isRunning && "opacity-50 cursor-not-allowed"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-zinc-700" />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => { setIsRunning(true); setTime(0); }}
          disabled={isRunning || isComplete}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Play size={14} /> {isComplete ? "Complete" : isRunning ? "Running..." : "Start Osmosis"}
        </button>
        <button onClick={handleReset} className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors">
          <RotateCcw size={14} />
        </button>
        {isRunning && (
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Droplets size={12} className="text-blue-400 animate-pulse" />
            Time: {time.toFixed(1)}s
          </span>
        )}
      </div>

      {isComplete && (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Experiment Complete</span>
          </div>
          <p className="text-xs text-zinc-400">
            In {SOLUTIONS[selectedSolution].name}, the cell {finalVolume > 100 ? "swelled" : finalVolume < 100 ? "shrank" : "maintained its size"}.
            Final volume: {finalVolume}%.
            {SOLUTIONS[selectedSolution].type === "hypotonic" && " Water moved into the cell by osmosis (from low to high solute concentration)."}
            {SOLUTIONS[selectedSolution].type === "hypertonic" && " Water moved out of the cell by osmosis (from low to high solute concentration)."}
            {SOLUTIONS[selectedSolution].type === "isotonic" && " Water moved equally in both directions, maintaining equilibrium."}
          </p>
          <button onClick={() => onComplete?.(100, { solution: SOLUTIONS[selectedSolution].name, volume: finalVolume })}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 transition-colors">
            <CheckCircle2 size={14} /> Mark as Complete
          </button>
        </div>
      )}
    </div>
  );
}
