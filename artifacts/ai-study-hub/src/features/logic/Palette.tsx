import { useState } from "react";
import type { GateType } from "./types";
import { GATE_DEFS } from "./gates";
import { cn } from "@/lib/utils";
import {
  ToggleLeft,
  Lightbulb,
  CircleOff,
  Plus,
  Minus,
  Zap,
  Binary,
  GitBranch,
  GitMerge,
  ArrowRightLeft,
  Split,
  Combine,
  Columns3,
  Box,
  Clock,
  Activity,
} from "lucide-react";

const GATE_ICONS: Record<string, React.ReactNode> = {
  input: <ToggleLeft size={16} />,
  output: <Lightbulb size={16} />,
  not: <CircleOff size={16} />,
  and: <Plus size={16} />,
  or: <Plus size={16} />,
  nand: <Zap size={16} />,
  nor: <Zap size={16} />,
  xor: <GitBranch size={16} />,
  xnor: <GitMerge size={16} />,
  buffer: <ArrowRightLeft size={16} />,
  "half-adder": <Plus size={16} />,
  "full-adder": <Plus size={16} />,
  "half-subtractor": <Minus size={16} />,
  "full-subtractor": <Minus size={16} />,
  mux2: <Columns3 size={16} />,
  decoder: <Split size={16} />,
  "d-latch": <Box size={16} />,
  "d-flipflop": <Clock size={16} />,
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Input / Output": <ToggleLeft size={14} />,
  "Logic Gates": <Binary size={14} />,
  Combinational: <Combine size={14} />,
  Sequential: <Activity size={14} />,
};

const CATEGORIES = ["Input / Output", "Logic Gates", "Combinational", "Sequential"] as const;

const GATE_COLORS: Record<string, string> = {
  input: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  output: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  not: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  and: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  or: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  nand: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  nor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  xor: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  xnor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  buffer: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "half-adder": "bg-slate-500/15 text-slate-400 border-slate-500/30",
  "full-adder": "bg-slate-500/15 text-slate-400 border-slate-500/30",
  "half-subtractor": "bg-stone-500/15 text-stone-400 border-stone-500/30",
  "full-subtractor": "bg-stone-500/15 text-stone-400 border-stone-500/30",
  mux2: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  decoder: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  "d-latch": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "d-flipflop": "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

interface Props {
  placingType: string | null;
  onSelectType: (type: GateType | null) => void;
}

export function Palette({ placingType, onSelectType }: Props) {
  const [expanded, setExpanded] = useState<string | null>("Logic Gates");

  return (
    <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Components
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {CATEGORIES.map((cat) => {
          const gates = Object.values(GATE_DEFS).filter((g) => g.category === cat);
          const isOpen = expanded === cat;

          return (
            <div key={cat}>
              <button
                onClick={() => setExpanded(isOpen ? null : cat)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  isOpen
                    ? "text-emerald-400 bg-emerald-500/5"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <span className="text-zinc-600">{CATEGORY_ICONS[cat]}</span>
                {cat}
                <svg
                  className={cn("ml-auto w-3 h-3 transition-transform", isOpen && "rotate-90")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-2 pb-2 space-y-0.5">
                  {gates.map((gate) => {
                    const isActive = placingType === gate.type;
                    return (
                      <button
                        key={gate.type}
                        onClick={() => onSelectType(isActive ? null : (gate.type as GateType))}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all border",
                          isActive
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                            : cn(
                                "border-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
                                GATE_COLORS[gate.type]
                              )
                        )}
                      >
                        <span className={cn("shrink-0", isActive ? "text-emerald-400" : "")}>
                          {GATE_ICONS[gate.type]}
                        </span>
                        <span className="truncate">{gate.label}</span>
                        {isActive && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            PLACING
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
