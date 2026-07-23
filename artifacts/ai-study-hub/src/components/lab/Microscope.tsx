import { useRef, useEffect, useState, useCallback } from "react";
import { Search, RotateCcw, ZoomIn, ZoomOut, Focus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

const SLIDES = [
  { id: "onion", name: "Onion Epidermis Cells", description: "Plant cells with visible cell walls and nuclei", cellType: "plant" as const },
  { id: "cheek", name: "Human Cheek Cells", description: "Animal cells stained with methylene blue", cellType: "animal" as const },
  { id: "blood", name: "Human Blood Smear", description: "Red blood cells, white blood cells, and platelets", cellType: "blood" as const },
  { id: "bacteria", name: "Bacteria (E. coli)", description: "Rod-shaped bacteria under high magnification", cellType: "bacteria" as const },
];

const MAGNIFICATIONS = [
  { label: "4× (Scanning)", value: 4, fieldOfView: 400 },
  { label: "10× (Low)", value: 10, fieldOfView: 180 },
  { label: "40× (High)", value: 40, fieldOfView: 45 },
  { label: "100× (Oil)", value: 100, fieldOfView: 18 },
];

const W = 700;
const H = 480;
const LENS_CX = W / 2;
const LENS_CY = H / 2;

function drawCells(
  ctx: CanvasRenderingContext2D,
  slide: typeof SLIDES[0],
  mag: number,
  focusOffset: number,
  panX: number,
  panY: number,
) {
  const fov = 400 / (mag / 4);
  const cellDensity = Math.floor(fov / 8);
  const cellSize = Math.max(3, fov / 12);

  ctx.save();
  ctx.beginPath();
  ctx.arc(LENS_CX, LENS_CY, Math.min(W, H) / 2 - 20, 0, Math.PI * 2);
  ctx.clip();

  const blurAmount = Math.abs(focusOffset) * 2;
  ctx.filter = blurAmount > 0 ? `blur(${blurAmount}px)` : "none";

  if (slide.cellType === "plant") {
    for (let i = -cellDensity; i <= cellDensity; i++) {
      for (let j = -cellDensity; j <= cellDensity; j++) {
        const x = LENS_CX + (i * cellSize * 2.5) + panX % (cellSize * 2.5);
        const y = LENS_CY + (j * cellSize * 1.8) + panY % (cellSize * 1.8);
        if (Math.hypot(x - LENS_CX, y - LENS_CY) > Math.min(W, H) / 2 - 20) continue;

        ctx.strokeStyle = "rgba(34,197,94,0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - cellSize, y - cellSize * 0.8, cellSize * 2, cellSize * 1.6);
        ctx.fillStyle = "rgba(34,197,94,0.08)";
        ctx.fillRect(x - cellSize, y - cellSize * 0.8, cellSize * 2, cellSize * 1.6);

        ctx.fillStyle = "rgba(139,92,246,0.8)";
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (slide.cellType === "animal") {
    for (let i = -cellDensity; i <= cellDensity; i++) {
      for (let j = -cellDensity; j <= cellDensity; j++) {
        const x = LENS_CX + (i * cellSize * 2) + panX % (cellSize * 2) + (j % 2 ? cellSize : 0);
        const y = LENS_CY + (j * cellSize * 2) + panY % (cellSize * 2);
        if (Math.hypot(x - LENS_CX, y - LENS_CY) > Math.min(W, H) / 2 - 20) continue;

        ctx.fillStyle = "rgba(96,165,250,0.15)";
        ctx.beginPath();
        ctx.ellipse(x, y, cellSize * 0.9, cellSize * 0.7, Math.random() * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(96,165,250,0.5)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = "rgba(59,130,246,0.9)";
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (slide.cellType === "blood") {
    for (let i = -cellDensity * 2; i <= cellDensity * 2; i++) {
      for (let j = -cellDensity * 2; j <= cellDensity * 2; j++) {
        const x = LENS_CX + (i * cellSize * 0.8) + panX % (cellSize * 0.8);
        const y = LENS_CY + (j * cellSize * 0.8) + panY % (cellSize * 0.8);
        if (Math.hypot(x - LENS_CX, y - LENS_CY) > Math.min(W, H) / 2 - 20) continue;

        const isWBC = Math.random() < 0.02;
        if (isWBC) {
          ctx.fillStyle = "rgba(168,85,247,0.4)";
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(139,92,246,0.9)";
          ctx.beginPath();
          for (let k = 0; k < 3; k++) {
            ctx.arc(x + Math.cos(k * 2.1) * cellSize * 0.15, y + Math.sin(k * 2.1) * cellSize * 0.15, cellSize * 0.12, 0, Math.PI * 2);
          }
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(239,68,68,0.5)";
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (slide.cellType === "bacteria") {
    for (let i = -cellDensity * 2; i <= cellDensity * 2; i++) {
      for (let j = -cellDensity * 2; j <= cellDensity * 2; j++) {
        const x = LENS_CX + (i * cellSize * 0.6) + panX % (cellSize * 0.6);
        const y = LENS_CY + (j * cellSize * 0.6) + panY % (cellSize * 0.6);
        if (Math.hypot(x - LENS_CX, y - LENS_CY) > Math.min(W, H) / 2 - 20) continue;

        ctx.fillStyle = "rgba(234,179,8,0.4)";
        ctx.beginPath();
        const angle = Math.atan2(y - LENS_CY, x - LENS_CX) + 0.5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-cellSize * 0.4, -cellSize * 0.12, cellSize * 0.8, cellSize * 0.24);
        ctx.restore();
        ctx.fill();
      }
    }
  }

  ctx.filter = "none";
  ctx.restore();

  // Vignette
  const vignette = ctx.createRadialGradient(LENS_CX, LENS_CY, Math.min(W, H) / 3, LENS_CX, LENS_CY, Math.min(W, H) / 2);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

export function MicroscopeSim({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [magIndex, setMagIndex] = useState(0);
  const [focus, setFocus] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isLightOn, setIsLightOn] = useState(true);
  const [score, setScore] = useState(0);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    if (!isLightOn) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#333";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Light source is off", LENS_CX, LENS_CY);
      ctx.textAlign = "start";
      return;
    }

    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, W, H);

    // Microscope field of view circle
    ctx.fillStyle = "rgba(200,220,240,0.03)";
    ctx.beginPath();
    ctx.arc(LENS_CX, LENS_CY, Math.min(W, H) / 2 - 20, 0, Math.PI * 2);
    ctx.fill();

    drawCells(ctx, SLIDES[selectedSlide], MAGNIFICATIONS[magIndex].value, focus, panX, panY);

    // Crosshair
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(LENS_CX - 20, LENS_CY);
    ctx.lineTo(LENS_CX + 20, LENS_CY);
    ctx.moveTo(LENS_CX, LENS_CY - 20);
    ctx.lineTo(LENS_CX, LENS_CY + 20);
    ctx.stroke();
  }, [selectedSlide, magIndex, focus, panX, panY, isLightOn]);

  useEffect(() => { render(); }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setPanX((p) => p + dx);
    setPanY((p) => p + dy);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { dragging.current = false; };

  const handleScore = () => {
    let s = 0;
    if (isLightOn) s += 25;
    if (magIndex >= 2) s += 25;
    if (Math.abs(focus) < 3) s += 25;
    if (selectedSlide >= 0) s += 25;
    setScore(s);
    onComplete?.(s, { slide: SLIDES[selectedSlide].name, magnification: MAGNIFICATIONS[magIndex].label });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="space-y-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full rounded-xl border border-zinc-700 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-zinc-400">
            {SLIDES[selectedSlide].name} | {MAGNIFICATIONS[magIndex].label} | Drag to pan
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-500 w-12">Focus</label>
          <input
            type="range"
            min={-10}
            max={10}
            step={0.5}
            value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-zinc-500 w-16">{focus.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Light Source</h4>
          <button
            onClick={() => setIsLightOn(!isLightOn)}
            className={cn(
              "w-full py-2 rounded-lg text-xs font-bold transition-all",
              isLightOn ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
            )}
          >
            {isLightOn ? "Light ON" : "Light OFF"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Magnification</h4>
          {MAGNIFICATIONS.map((m, i) => (
            <button
              key={m.value}
              onClick={() => setMagIndex(i)}
              className={cn(
                "w-full px-3 py-1.5 rounded-lg text-xs text-left transition-all",
                i === magIndex ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Specimen Slides</h4>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSlide(i); setPanX(0); setPanY(0); }}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-xs text-left transition-all",
                i === selectedSlide ? "bg-primary/20 text-primary border border-primary/30" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent"
              )}
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleScore} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors">
            Check Score
          </button>
          <button onClick={() => { setMagIndex(0); setFocus(0); setPanX(0); setPanY(0); setIsLightOn(true); }}
            className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors">
            <RotateCcw size={14} />
          </button>
        </div>

        {score > 0 && (
          <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{score}%</div>
            <div className="text-[10px] text-zinc-500">Microscopy Score</div>
          </div>
        )}
      </div>
    </div>
  );
}
