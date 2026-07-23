import { memo } from "react";
import type { CircuitNode } from "./types";
import { GATE_DEFS, getPortPos } from "./gates";
import { cn } from "@/lib/utils";

interface Props {
  node: CircuitNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onPortMouseDown: (nodeId: string, portId: string, side: "left" | "right", e: React.MouseEvent) => void;
  onInputToggle: (nodeId: string, portId: string) => void;
}

const GATE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  input: { fill: "#10b981", stroke: "#059669", text: "#ffffff" },
  output: { fill: "#f59e0b", stroke: "#d97706", text: "#ffffff" },
  not: { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff" },
  and: { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff" },
  or: { fill: "#06b6d4", stroke: "#0891b2", text: "#ffffff" },
  nand: { fill: "#ec4899", stroke: "#db2777", text: "#ffffff" },
  nor: { fill: "#f97316", stroke: "#ea580c", text: "#ffffff" },
  xor: { fill: "#14b8a6", stroke: "#0d9488", text: "#ffffff" },
  xnor: { fill: "#a855f7", stroke: "#9333ea", text: "#ffffff" },
  buffer: { fill: "#6366f1", stroke: "#4f46e5", text: "#ffffff" },
  "half-adder": { fill: "#64748b", stroke: "#475569", text: "#ffffff" },
  "full-adder": { fill: "#64748b", stroke: "#475569", text: "#ffffff" },
  "half-subtractor": { fill: "#78716c", stroke: "#57534e", text: "#ffffff" },
  "full-subtractor": { fill: "#78716c", stroke: "#57534e", text: "#ffffff" },
  mux2: { fill: "#0ea5e9", stroke: "#0284c7", text: "#ffffff" },
  decoder: { fill: "#d946ef", stroke: "#c026d3", text: "#ffffff" },
  "d-latch": { fill: "#eab308", stroke: "#ca8a04", text: "#ffffff" },
  "d-flipflop": { fill: "#f43f5e", stroke: "#e11d48", text: "#ffffff" },
};

function GateShape({ type, w, h }: { type: string; w: number; h: number }) {
  const mid = h / 2;
  switch (type) {
    case "not":
    case "buffer":
      return (
        <polygon
          points={`0,0 ${w - 14},0 ${w},${mid} ${w - 14},${h} 0,${h}`}
          className="fill-current"
        />
      );
    case "and":
      return (
        <path
          d={`M0,0 L${w * 0.5},0 A${w * 0.5},${mid} 0 0,1 ${w * 0.5},${h} L0,${h} Z`}
          className="fill-current"
        />
      );
    case "or":
      return (
        <path
          d={`M0,0 Q${w * 0.3},0 ${w},${mid} Q${w * 0.3},${h} 0,${h} Q${w * 0.15},${mid} 0,0 Z`}
          className="fill-current"
        />
      );
    case "nand":
      return (
        <g>
          <path
            d={`M0,0 L${w * 0.45},0 A${w * 0.45},${mid} 0 0,1 ${w * 0.45},${h} L0,${h} Z`}
            className="fill-current"
          />
          <circle cx={w - 10} cy={mid} r={5} className="fill-current" stroke="white" strokeWidth={1.5} />
        </g>
      );
    case "nor":
      return (
        <g>
          <path
            d={`M0,0 Q${w * 0.25},0 ${w - 10},${mid} Q${w * 0.25},${h} 0,${h} Q${w * 0.12},${mid} 0,0 Z`}
            className="fill-current"
          />
          <circle cx={w - 5} cy={mid} r={5} className="fill-current" stroke="white" strokeWidth={1.5} />
        </g>
      );
    case "xor":
      return (
        <g>
          <path
            d={`M8,0 Q${w * 0.3},0 ${w},${mid} Q${w * 0.3},${h} 8,${h} Q${w * 0.18},${mid} 8,0 Z`}
            className="fill-current"
          />
          <path
            d={`M0,${h} Q${w * 0.12},${mid} 0,0`}
            fill="none"
            stroke="white"
            strokeWidth={2.5}
          />
        </g>
      );
    case "xnor":
      return (
        <g>
          <path
            d={`M10,0 Q${w * 0.3},0 ${w - 6},${mid} Q${w * 0.3},${h} 10,${h} Q${w * 0.18},${mid} 10,0 Z`}
            className="fill-current"
          />
          <path
            d={`M2,${h} Q${w * 0.12},${mid} 2,0`}
            fill="none"
            stroke="white"
            strokeWidth={2.5}
          />
          <circle cx={w - 3} cy={mid} r={5} className="fill-current" stroke="white" strokeWidth={1.5} />
        </g>
      );
    default:
      return (
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={6}
          className="fill-current"
        />
      );
  }
}

function GateNodeInner({ node, isSelected, onMouseDown, onPortMouseDown, onInputToggle }: Props) {
  const def = GATE_DEFS[node.type];
  if (!def) return null;

  const colors = GATE_COLORS[node.type] || { fill: "#64748b", stroke: "#475569", text: "#ffffff" };
  const isInput = node.type === "input";
  const isOutput = node.type === "output";

  const portR = 7;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={onMouseDown}
      className="cursor-grab active:cursor-grabbing"
    >
      <rect
        x={-6}
        y={-6}
        width={def.width + 12}
        height={def.height + 12}
        fill="transparent"
        rx={10}
      />

      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={def.width + 6}
          height={def.height + 6}
          fill="none"
          stroke="#facc15"
          strokeWidth={2.5}
          rx={8}
          strokeDasharray="6 3"
          className="animate-pulse"
        />
      )}

      <g style={{ color: colors.fill }}>
        <GateShape type={node.type} w={def.width} h={def.height} />
      </g>

      <text
        x={def.width / 2}
        y={def.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={colors.text}
        fontSize={isInput || isOutput ? 11 : 12}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
      >
        {isInput ? (node.inputValues._value ? "1" : "0") : isOutput ? (node.inputValues.in ? "1" : "0") : def.label}
      </text>

      {isInput && (
        <g
          onMouseDown={(e) => {
            e.stopPropagation();
            onInputToggle(node.id, "_value");
          }}
          className="cursor-pointer"
        >
          <rect
            x={def.width / 2 - 16}
            y={def.height - 18}
            width={32}
            height={14}
            rx={3}
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={0.5}
          />
          <text
            x={def.width / 2}
            y={def.height - 9}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.8)"
            fontSize={8}
            fontWeight={600}
            pointerEvents="none"
          >
            {node.inputValues._value ? "ON" : "OFF"}
          </text>
        </g>
      )}

      {def.inputs.map((port, i) => {
        const py = (def.height / (def.inputs.length + 1)) * (i + 1);
        const val = !!node.inputValues[port.id];
        return (
          <g key={port.id}>
            <line
              x1={-6}
              y1={py}
              x2={portR + 2}
              y2={py}
              stroke={val ? "#22c55e" : "#64748b"}
              strokeWidth={2.5}
            />
            <circle
              cx={portR + 2}
              cy={py}
              r={portR}
              fill={val ? "#22c55e" : "#1e293b"}
              stroke={val ? "#16a34a" : "#64748b"}
              strokeWidth={2}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(node.id, port.id, "left", e);
              }}
              className="cursor-crosshair hover:stroke-yellow-400 hover:stroke-[3] transition-all"
            />
            <text
              x={portR + 14}
              y={py}
              dominantBaseline="central"
              fill="rgba(255,255,255,0.6)"
              fontSize={9}
              fontWeight={600}
              fontFamily="system-ui"
              pointerEvents="none"
            >
              {port.label}
            </text>
          </g>
        );
      })}

      {def.outputs.map((port, i) => {
        const py = (def.height / (def.outputs.length + 1)) * (i + 1);
        const px = def.width;
        const val = !!node.outputValues[port.id];
        return (
          <g key={port.id}>
            <line
              x1={px - portR - 2}
              y1={py}
              x2={px + 6}
              y2={py}
              stroke={val ? "#22c55e" : "#64748b"}
              strokeWidth={2.5}
            />
            <circle
              cx={px - portR - 2}
              cy={py}
              r={portR}
              fill={val ? "#22c55e" : "#1e293b"}
              stroke={val ? "#16a34a" : "#64748b"}
              strokeWidth={2}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown(node.id, port.id, "right", e);
              }}
              className="cursor-crosshair hover:stroke-yellow-400 hover:stroke-[3] transition-all"
            />
            <text
              x={px - portR - 14}
              y={py}
              textAnchor="end"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.6)"
              fontSize={9}
              fontWeight={600}
              fontFamily="system-ui"
              pointerEvents="none"
            >
              {port.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export const GateNode = memo(GateNodeInner);
