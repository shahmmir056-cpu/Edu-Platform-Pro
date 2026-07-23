import { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Timer, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

const DNA_SAMPLES = [
  { name: "Sample A (100bp + 500bp)", bands: [100, 500], color: "#ef4444" },
  { name: "Sample B (200bp + 800bp)", bands: [200, 800], color: "#3b82f6" },
  { name: "Sample C (100bp + 300bp + 700bp)", bands: [100, 300, 700], color: "#22c55e" },
  { name: "Marker (100-1000bp)", bands: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], color: "#a855f7" },
];

type Stage = "setup" | "loading" | "running" | "results";

export function GelElectrophoresisSim({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage>("setup");
  const [selectedSamples, setSelectedSamples] = useState<number[]>([0, 3]);
  const [voltage, setVoltage] = useState(100);
  const [runTime, setRunTime] = useState(0);
  const [maxTime] = useState(30);
  const [gelProgress, setGelProgress] = useState(0);
  const [showBands, setShowBands] = useState(false);
  const animRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const W = 700;
  const H = 480;
  const GEL_TOP = 100;
  const GEL_BOTTOM = 420;
  const GEL_LEFT = 100;
  const GEL_RIGHT = 600;
  const WELL_WIDTH = 50;

  const drawGel = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0c1222");
    bg.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px system-ui";
    ctx.fillText("Agarose Gel Electrophoresis", 20, 25);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Voltage: ${voltage}V | Migration: ${(progress * 100).toFixed(0)}%`, 20, 42);

    // Gel box
    ctx.fillStyle = "#1e3a5f";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.fillRect(GEL_LEFT - 10, GEL_TOP - 10, GEL_RIGHT - GEL_LEFT + 20, GEL_BOTTOM - GEL_TOP + 40);
    ctx.strokeRect(GEL_LEFT - 10, GEL_TOP - 10, GEL_RIGHT - GEL_LEFT + 20, GEL_BOTTOM - GEL_TOP + 40);

    // Gel slab
    const gelGrad = ctx.createLinearGradient(GEL_LEFT, GEL_TOP, GEL_LEFT, GEL_BOTTOM);
    gelGrad.addColorStop(0, "rgba(200,220,255,0.15)");
    gelGrad.addColorStop(1, "rgba(100,150,200,0.1)");
    ctx.fillStyle = gelGrad;
    ctx.fillRect(GEL_LEFT, GEL_TOP, GEL_RIGHT - GEL_LEFT, GEL_BOTTOM - GEL_TOP);

    // Wells
    const numSamples = selectedSamples.length;
    const laneWidth = (GEL_RIGHT - GEL_LEFT) / numSamples;

    selectedSamples.forEach((sampleIdx, i) => {
      const sample = DNA_SAMPLES[sampleIdx];
      const cx = GEL_LEFT + laneWidth * i + laneWidth / 2;

      // Well
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(cx - WELL_WIDTH / 2, GEL_TOP, WELL_WIDTH, 12);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(cx - WELL_WIDTH / 2, GEL_TOP, WELL_WIDTH, 12);

      // Lane label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(sample.name.split(" ")[0], cx, GEL_TOP - 5);

      // DNA bands migrating
      const bandHeight = 6;
      sample.bands.forEach((bp) => {
        const maxMigration = GEL_BOTTOM - GEL_TOP - 40;
        const migrationRate = Math.log10(bp + 1) / Math.log10(1001);
        const bandY = GEL_TOP + 20 + maxMigration * migrationRate * progress;

        const bandGrad = ctx.createRadialGradient(cx, bandY, 0, cx, bandY, WELL_WIDTH / 2);
        bandGrad.addColorStop(0, sample.color + "cc");
        bandGrad.addColorStop(0.6, sample.color + "88");
        bandGrad.addColorStop(1, sample.color + "00");
        ctx.fillStyle = bandGrad;
        ctx.fillRect(cx - WELL_WIDTH / 2, bandY - bandHeight / 2, WELL_WIDTH, bandHeight);
      });
    });

    ctx.textAlign = "start";

    // Electrons animation when running
    if (stage === "running") {
      for (let i = 0; i < 8; i++) {
        const ex = GEL_LEFT + Math.random() * (GEL_RIGHT - GEL_LEFT);
        const ey = GEL_TOP + Math.random() * (GEL_BOTTOM - GEL_TOP);
        ctx.fillStyle = "rgba(147,197,253,0.3)";
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // +/- labels
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 16px system-ui";
    ctx.fillText("+ (anode)", GEL_LEFT, GEL_BOTTOM + 30);
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("− (cathode)", GEL_LEFT, GEL_TOP - 20);

    // Scale
    if (progress > 0.5) {
      ctx.fillStyle = "#64748b";
      ctx.font = "9px system-ui";
      [100, 300, 500, 700, 1000].forEach((bp) => {
        const y = GEL_TOP + 20 + (GEL_BOTTOM - GEL_TOP - 40) * (Math.log10(bp + 1) / Math.log10(1001)) * progress;
        ctx.fillText(`${bp}bp`, GEL_RIGHT + 5, y + 3);
        ctx.beginPath();
        ctx.moveTo(GEL_LEFT, y);
        ctx.lineTo(GEL_RIGHT, y);
        ctx.strokeStyle = "rgba(100,116,139,0.15)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    }
  }, [selectedSamples, voltage, stage]);

  useEffect(() => {
    if (stage !== "running") return;
    timerRef.current = setInterval(() => {
      setRunTime((t) => {
        const next = t + 0.1;
        if (next >= maxTime) {
          setStage("results");
          setShowBands(true);
          return maxTime;
        }
        setGelProgress(next / maxTime);
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage, maxTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGel(ctx, gelProgress);
  }, [gelProgress, drawGel]);

  const handleStart = () => {
    setStage("running");
    setRunTime(0);
    setGelProgress(0);
    setShowBands(false);
  };

  const handleReset = () => {
    setStage("setup");
    setRunTime(0);
    setGelProgress(0);
    setShowBands(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="space-y-4">
      {stage === "setup" && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-zinc-300">Setup Experiment</h4>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Select DNA Samples</label>
            <div className="flex flex-wrap gap-2">
              {DNA_SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSamples((prev) =>
                    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                  )}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    selectedSamples.includes(i)
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Voltage: {voltage}V</label>
            <input
              type="range"
              min={50}
              max={200}
              value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <button
            onClick={handleStart}
            disabled={selectedSamples.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Play size={14} /> Start Electrophoresis
          </button>
        </div>
      )}

      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-zinc-700" />
        {stage === "running" && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
            <Timer size={14} className="text-primary animate-pulse" />
            <span className="text-xs font-mono text-zinc-300">{runTime.toFixed(1)}s / {maxTime}s</span>
          </div>
        )}
      </div>

      {stage === "running" && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(runTime / maxTime) * 100}%` }} />
          </div>
          <span className="text-xs text-zinc-500">{((runTime / maxTime) * 100).toFixed(0)}%</span>
        </div>
      )}

      {stage === "results" && (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Electrophoresis Complete</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            DNA fragments have separated by size. Smaller fragments migrate faster through the gel matrix.
            The voltage ({voltage}V) created an electric field that pulled the negatively charged DNA toward the positive electrode.
          </p>
          <button onClick={() => { onComplete?.(100, {}); handleReset(); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 transition-colors">
            <RotateCcw size={14} /> Run Again
          </button>
        </div>
      )}
    </div>
  );
}
