import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabSimProps } from "./types";

interface Organelle {
  id: string;
  name: string;
  description: string;
  function: string;
  color: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  plant?: boolean;
}

const ANIMAL_ORGANELLES: Organelle[] = [
  { id: "nucleus", name: "Nucleus", description: "Control center of the cell", function: "Stores DNA and controls cell activities", color: "#8b5cf6", x: 0, y: 0, rx: 45, ry: 40 },
  { id: "membrane", name: "Cell Membrane", description: "Semi-permeable outer boundary", function: "Controls what enters and exits the cell", color: "#f59e0b", x: 0, y: 0, rx: 160, ry: 140 },
  { id: "mito", name: "Mitochondria", description: "Powerhouse of the cell", function: "Generates ATP through cellular respiration", color: "#ef4444", x: 60, y: -50, rx: 28, ry: 14 },
  { id: "er", name: "Endoplasmic Reticulum", description: "Network of membranes", function: "Protein and lipid synthesis", color: "#06b6d4", x: -55, y: 30, rx: 40, ry: 12 },
  { id: "golgi", name: "Golgi Apparatus", description: "Packaging center", function: "Modifies, packages, and ships proteins", color: "#22c55e", x: 80, y: 40, rx: 30, ry: 18 },
  { id: "ribo", name: "Ribosomes", description: "Protein factories", function: "Translate mRNA into proteins", color: "#ec4899", x: -40, y: -60, rx: 6, ry: 6 },
  { id: "lyso", name: "Lysosomes", description: "Digestive system", function: "Break down waste and cellular debris", color: "#f97316", x: 70, y: -70, rx: 14, ry: 14 },
  { id: "centriole", name: "Centrioles", description: "Cell division structures", function: "Organize microtubules during mitosis", color: "#64748b", x: -70, y: -20, rx: 8, ry: 16 },
];

const PLANT_ORGANELLES: Organelle[] = [
  ...ANIMAL_ORGANELLES.filter((o) => o.id !== "centriole" && o.id !== "lyso"),
  { id: "vacuole", name: "Central Vacuole", description: "Large storage sac", function: "Stores water, maintains turgor pressure", color: "#38bdf8", x: 0, y: 0, rx: 70, ry: 60 },
  { id: "chloroplast", name: "Chloroplasts", description: "Photosynthesis organelles", function: "Convert light energy into glucose", color: "#16a34a", x: 80, y: 60, rx: 22, ry: 12 },
  { id: "cellwall", name: "Cell Wall", description: "Rigid outer layer", function: "Provides structural support and protection", color: "#a3e635", x: 0, y: 0, rx: 175, ry: 155 },
];

const W = 700;
const H = 480;
const CX = W / 2;
const CY = H / 2;

export function CellExplorer({ onComplete }: LabSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellType, setCellType] = useState<"animal" | "plant">("animal");
  const [selectedOrganelle, setSelectedOrganelle] = useState<string | null>(null);
  const [foundOrganelles, setFoundOrganelles] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(true);

  const organelles = cellType === "animal" ? ANIMAL_ORGANELLES : PLANT_ORGANELLES;

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

    // Draw organelles (back to front)
    const drawOrder = ["cellwall", "membrane", "vacuole", "er", "golgi", "nucleus", "mito", "chloroplast", "ribo", "lyso", "centriole"];
    const sorted = [...organelles].sort((a, b) => drawOrder.indexOf(a.id) - drawOrder.indexOf(b.id));

    sorted.forEach((org) => {
      const isSelected = selectedOrganelle === org.id;
      const found = foundOrganelles.has(org.id);

      ctx.save();
      ctx.translate(CX + org.x, CY + org.y);

      if (org.id === "membrane" || org.id === "cellwall") {
        ctx.strokeStyle = org.color + (isSelected ? "ff" : "88");
        ctx.lineWidth = org.id === "cellwall" ? 4 : 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, org.rx, org.ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (org.id === "membrane") {
          ctx.fillStyle = org.color + "08";
          ctx.fill();
        }
        if (org.id === "cellwall") {
          ctx.fillStyle = org.color + "05";
          ctx.fill();
        }
      } else if (org.id === "nucleus") {
        ctx.fillStyle = org.color + (isSelected ? "55" : "30");
        ctx.strokeStyle = org.color + (isSelected ? "ff" : "88");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, org.rx, org.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = org.color + "66";
        ctx.beginPath();
        ctx.arc(8, -5, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (org.id === "er") {
        ctx.strokeStyle = org.color + (isSelected ? "dd" : "66");
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-org.rx, i * 8);
          ctx.bezierCurveTo(-org.rx / 2, i * 8 - 10, org.rx / 2, i * 8 + 10, org.rx, i * 8);
          ctx.stroke();
        }
      } else if (org.id === "golgi") {
        ctx.strokeStyle = org.color + (isSelected ? "dd" : "88");
        ctx.lineWidth = 2.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-org.rx + 5, i * 6);
          ctx.bezierCurveTo(-org.rx / 2, i * 6 - 6, org.rx / 2, i * 6 + 6, org.rx - 5, i * 6);
          ctx.stroke();
        }
      } else if (org.id === "vacuole") {
        ctx.fillStyle = org.color + (isSelected ? "20" : "10");
        ctx.strokeStyle = org.color + (isSelected ? "dd" : "44");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, org.rx, org.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (org.id === "chloroplast") {
        ctx.fillStyle = org.color + (isSelected ? "88" : "55");
        ctx.strokeStyle = org.color + (isSelected ? "ff" : "aa");
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, org.rx, org.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-org.rx + 5, i * 4);
          ctx.lineTo(org.rx - 5, i * 4);
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = org.color + (isSelected ? "cc" : "88");
        ctx.strokeStyle = org.color + (isSelected ? "ff" : "aa");
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, org.rx, org.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (showLabels) {
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        const labelY = org.id === "membrane" || org.id === "cellwall" ? -org.ry - 10 : org.ry + 14;
        ctx.fillText(org.name, 0, labelY);
        if (found) {
          ctx.fillStyle = "#22c55e";
          ctx.fillText("✓", 0, labelY + 12);
        }
      }

      ctx.restore();
    });

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "start";
    ctx.fillText(cellType === "animal" ? "Animal Cell" : "Plant Cell", 20, 25);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${foundOrganelles.size}/${organelles.length} organelles identified`, 20, 42);
  }, [organelles, selectedOrganelle, foundOrganelles, showLabels, cellType]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    for (const org of organelles) {
      const ox = CX + org.x;
      const oy = CY + org.y;
      const dx = (mx - ox) / org.rx;
      const dy = (my - oy) / org.ry;
      if (dx * dx + dy * dy <= 1.5) {
        setSelectedOrganelle(org.id);
        setFoundOrganelles((prev) => new Set([...prev, org.id]));
        return;
      }
    }
    setSelectedOrganelle(null);
  };

  const selected = organelles.find((o) => o.id === selectedOrganelle);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="space-y-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full rounded-xl border border-zinc-700 cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCellType("animal"); setSelectedOrganelle(null); setFoundOrganelles(new Set()); }}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all",
              cellType === "animal" ? "bg-primary/20 text-primary border border-primary/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}
          >Animal Cell</button>
          <button
            onClick={() => { setCellType("plant"); setSelectedOrganelle(null); setFoundOrganelles(new Set()); }}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all",
              cellType === "plant" ? "bg-primary/20 text-primary border border-primary/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}
          >Plant Cell</button>
          <div className="flex-1" />
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-xs hover:bg-zinc-700 transition-colors"
          >
            {showLabels ? "Hide Labels" : "Show Labels"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Organelles</h4>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {organelles.map((org) => (
              <button
                key={org.id}
                onClick={() => { setSelectedOrganelle(org.id); setFoundOrganelles((prev) => new Set([...prev, org.id])); }}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs text-left transition-all flex items-center gap-2",
                  selectedOrganelle === org.id ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                )}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                <span>{org.name}</span>
                {foundOrganelles.has(org.id) && <span className="ml-auto text-emerald-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selected.color }} />
              <h4 className="text-sm font-bold text-zinc-200">{selected.name}</h4>
            </div>
            <p className="text-xs text-zinc-400 mb-1">{selected.description}</p>
            <p className="text-xs text-primary">{selected.function}</p>
          </div>
        )}

        {foundOrganelles.size === organelles.length && (
          <button onClick={() => onComplete?.(100, { cellType, found: foundOrganelles.size })}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors">
            All Organelles Found! Complete
          </button>
        )}
      </div>
    </div>
  );
}
