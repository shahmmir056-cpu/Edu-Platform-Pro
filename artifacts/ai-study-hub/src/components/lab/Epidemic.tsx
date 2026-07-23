import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

interface Person {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "susceptible" | "infected" | "recovered" | "dead";
  infectionTime: number;
}

const W = 700;
const H = 400;
const POPULATION = 150;
const INFECTION_RADIUS = 12;
const MORTALITY_RATE = 0.02;
const RECOVERY_TIME = 200;

export function EpidemicSim({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState({ susceptible: 0, infected: 0, recovered: 0, dead: 0 });
  const [time, setTime] = useState(0);
  const [r0, setR0] = useState(2.5);
  const [socialDistancing, setSocialDistancing] = useState(false);
  const [vaccinationRate, setVaccinationRate] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animRef = useRef<number>(0);

  const initPopulation = useCallback(() => {
    const p: Person[] = [];
    for (let i = 0; i < POPULATION; i++) {
      const vaccinated = Math.random() < vaccinationRate / 100;
      p.push({
        x: Math.random() * (W - 40) + 20,
        y: Math.random() * (H - 40) + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        state: vaccinated ? "recovered" : "susceptible",
        infectionTime: 0,
      });
    }
    // Patient zero
    const idx = Math.floor(Math.random() * POPULATION);
    p[idx].state = "infected";
    p[idx].infectionTime = 0;
    setPeople(p);
    setTime(0);
    setIsComplete(false);
  }, [vaccinationRate]);

  useEffect(() => { initPopulation(); }, [initPopulation]);

  const simulate = useCallback(() => {
    setPeople((prev) => {
      const next = prev.map((p) => ({ ...p }));

      for (let i = 0; i < next.length; i++) {
        const p = next[i];
        if (p.state === "dead") continue;

        // Movement
        const speed = socialDistancing ? 0.3 : 1;
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Bounce
        if (p.x < 10 || p.x > W - 10) p.vx *= -1;
        if (p.y < 10 || p.y > H - 10) p.vy *= -1;
        p.x = Math.max(10, Math.min(W - 10, p.x));
        p.y = Math.max(10, Math.min(H - 10, p.y));

        // Random direction change
        if (Math.random() < 0.02) {
          p.vx += (Math.random() - 0.5) * 0.5;
          p.vy += (Math.random() - 0.5) * 0.5;
          const mag = Math.hypot(p.vx, p.vy);
          if (mag > 2) { p.vx = (p.vx / mag) * 2; p.vy = (p.vy / mag) * 2; }
        }

        // Infection spread
        if (p.state === "infected") {
          p.infectionTime++;
          for (let j = 0; j < next.length; j++) {
            if (i === j) continue;
            const q = next[j];
            if (q.state !== "susceptible") continue;
            const dist = Math.hypot(p.x - q.x, p.y - q.y);
            if (dist < INFECTION_RADIUS && Math.random() < 0.1 * (r0 / 2.5)) {
              q.state = "infected";
              q.infectionTime = 0;
            }
          }
          if (p.infectionTime > RECOVERY_TIME) {
            p.state = Math.random() < MORTALITY_RATE ? "dead" : "recovered";
          }
        }
      }
      return next;
    });
    setTime((t) => t + 1);
  }, [socialDistancing, r0]);

  useEffect(() => {
    const counts = { susceptible: 0, infected: 0, recovered: 0, dead: 0 };
    people.forEach((p) => counts[p.state]++);
    setStats(counts);
    if (counts.infected === 0 && time > 10) {
      setIsRunning(false);
      setIsComplete(true);
    }
  }, [people, time]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(simulate, 30);
    return () => clearInterval(interval);
  }, [isRunning, simulate]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(100,116,139,0.08)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const colors = {
      susceptible: "#3b82f6",
      infected: "#ef4444",
      recovered: "#22c55e",
      dead: "#6b7280",
    };

    people.forEach((p) => {
      ctx.fillStyle = colors[p.state];
      ctx.globalAlpha = p.state === "dead" ? 0.4 : 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.state === "infected" ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (p.state === "infected") {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, INFECTION_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Legend
    const legendY = H - 25;
    const legends = [
      { label: "Susceptible", color: colors.susceptible },
      { label: "Infected", color: colors.infected },
      { label: "Recovered", color: colors.recovered },
      { label: "Dead", color: colors.dead },
    ];
    let lx = 20;
    legends.forEach((l) => {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(lx + 5, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px system-ui";
      ctx.textAlign = "start";
      ctx.fillText(l.label, lx + 14, legendY + 3);
      lx += ctx.measureText(l.label).width + 30;
    });

    // Time
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "end";
    ctx.fillText(`Day: ${Math.floor(time / 10)}`, W - 20, 25);
  }, [people, time]);

  useEffect(() => { draw(); }, [draw]);

  const handleReset = () => {
    setIsRunning(false);
    initPopulation();
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Transmission Rate (R₀): {r0.toFixed(1)}</label>
            <input type="range" min={0.5} max={6} step={0.1} value={r0} onChange={(e) => setR0(Number(e.target.value))} className="w-full accent-primary" disabled={isRunning} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Social Distancing</label>
            <button
              onClick={() => setSocialDistancing(!socialDistancing)}
              disabled={isRunning}
              className={cn("w-full py-1.5 rounded-lg text-xs font-bold border transition-all",
                socialDistancing ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {socialDistancing ? "ON" : "OFF"}
            </button>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Vaccination: {vaccinationRate}%</label>
            <input type="range" min={0} max={100} value={vaccinationRate} onChange={(e) => setVaccinationRate(Number(e.target.value))} className="w-full accent-primary" disabled={isRunning} />
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-zinc-700" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Susceptible", value: stats.susceptible, color: "text-blue-400" },
          { label: "Infected", value: stats.infected, color: "text-red-400" },
          { label: "Recovered", value: stats.recovered, color: "text-emerald-400" },
          { label: "Dead", value: stats.dead, color: "text-zinc-400" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
            <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? "Pause" : "Start Simulation"}
        </button>
        <button onClick={handleReset} className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors">
          <RotateCcw size={14} />
        </button>
      </div>

      {isComplete && (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Epidemic Over</span>
          </div>
          <p className="text-xs text-zinc-400">
            {stats.dead} deaths, {stats.recovered} recovered out of {POPULATION} total population.
            R₀ was {r0.toFixed(1)}. {socialDistancing ? "Social distancing was enabled." : ""} {vaccinationRate > 0 ? `${vaccinationRate}% were vaccinated.` : ""}
          </p>
          <button onClick={() => onComplete?.(100, { deaths: stats.dead, recovered: stats.recovered, r0 })}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 transition-colors">
            <CheckCircle2 size={14} /> Mark as Complete
          </button>
        </div>
      )}
    </div>
  );
}
