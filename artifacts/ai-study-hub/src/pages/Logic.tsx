import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import type { CircuitNode, Wire, GateType, Circuit, Settings, ThemeId, AppTheme } from "@/features/logic/types";
import { GATE_DEFS, CATEGORIES, portPos } from "@/features/logic/gates";
import { simulate, generateTruthTable } from "@/features/logic/engine";
import { getTheme, THEMES } from "@/features/logic/themes";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/features/logic/templates";
import { generateVerilog, generateVHDL } from "@/features/logic/verilog";
import { realSensors, SENSOR_TYPE_MAP, SENSOR_CHANNELS, type SensorChannel } from "@/features/logic/realSensors";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

let _id = 1;
const uid = () => `n${_id++}`;

const GATE_COLORS: Record<string, string> = {
  "Input Controls": "#FF9F4C", "Output Controls": "#FF9F4C",
  "Logic Gates": "#2D2D2D", Combinational: "#2D2D2D", Sequential: "#2D2D2D",
};

function GateSVG({ type, w, h }: { type: GateType; w: number; h: number }) {
  const m = h / 2;
  const strokeC = "#2D2D2D";
  const fillC = "rgba(45,45,45,0.05)";
  const fillLight = "rgba(45,45,45,0.1)";
  switch (type) {
    case "const-0":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="rgba(45,45,45,0.5)" fontSize={16} fontWeight={900} fontFamily="monospace" pointerEvents="none">0</text>
        </g>
      );
    case "const-1":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={16} fontWeight={900} fontFamily="monospace" pointerEvents="none">1</text>
        </g>
      );
    case "toggle":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m} r={m - 8} fill="#2D2D2D" opacity={0.8} />
        </g>
      );
    case "button":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m} r={m - 8} fill="#2D2D2D" stroke={strokeC} strokeWidth={1} />
        </g>
      );
    case "clock":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <polyline points={`10,${m} 18,${m} 18,${m - 10} 30,${m - 10} 30,${m} 38,${m} 38,${m + 10} 50,${m + 10} 50,${m}`}
            fill="none" stroke="#2D2D2D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "bulb":
      return (
        <g>
          <circle cx={w / 2} cy={m - 2} r={m - 6} fill="#2D2D2D" opacity={0.15} />
          <circle cx={w / 2} cy={m - 2} r={m - 10} fill="#2D2D2D" stroke={strokeC} strokeWidth={1.5} />
          <rect x={w / 2 - 6} y={m + 6} width={12} height={6} rx={1} fill="rgba(45,45,45,0.2)" stroke={strokeC} strokeWidth={1} />
        </g>
      );
    case "hex-display":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={3} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.1)" strokeWidth={1} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={22} fontWeight={900} fontFamily="monospace" pointerEvents="none">8</text>
        </g>
      );
    case "led":
      return (
        <g>
          <circle cx={w / 2} cy={m} r={m - 4} fill="rgba(45,45,45,0.06)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w / 2} cy={m} r={m - 8} fill="#2D2D2D" opacity={0.6} />
        </g>
      );
    case "buffer":
      return (
        <g>
          <polygon points={`6,3 ${w - 3},${m} 6,${h - 3}`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m - 2} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={700} fontFamily="system-ui" pointerEvents="none">1</text>
        </g>
      );
    case "not":
      return (
        <g>
          <polygon points={`6,3 ${w - 12},${m} 6,${h - 3}`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 8} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m - 4} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={700} fontFamily="system-ui" pointerEvents="none">1</text>
        </g>
      );
    case "and":
      return (
        <g>
          <path d={`M 6 3 L ${w * 0.45} 3 A ${m - 3} ${m - 3} 0 0 1 ${w * 0.45} ${h - 3} L 6 ${h - 3} Z`}
            fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.35} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={700} fontFamily="system-ui" pointerEvents="none">&amp;</text>
        </g>
      );
    case "nand":
      return (
        <g>
          <path d={`M 6 3 L ${w * 0.4} 3 A ${m - 3} ${m - 3} 0 0 1 ${w * 0.4} ${h - 3} L 6 ${h - 3} Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 8} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.3} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={9} fontWeight={700} fontFamily="system-ui" pointerEvents="none">&amp;</text>
        </g>
      );
    case "or":
      return (
        <g>
          <path d={`M 6 3 Q ${w * 0.2} 3 ${w - 3} ${m} Q ${w * 0.2} ${h - 3} 6 ${h - 3} Q ${w * 0.15} ${m} 6 3 Z`}
            fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.38} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={700} fontFamily="system-ui" pointerEvents="none">≥1</text>
        </g>
      );
    case "nor":
      return (
        <g>
          <path d={`M 6 3 Q ${w * 0.2} 3 ${w - 10} ${m} Q ${w * 0.2} ${h - 3} 6 ${h - 3} Q ${w * 0.15} ${m} 6 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 6} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.3} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={9} fontWeight={700} fontFamily="system-ui" pointerEvents="none">≥1</text>
        </g>
      );
    case "xor":
      return (
        <g>
          <path d={`M 12 3 Q ${w * 0.28} 3 ${w - 3} ${m} Q ${w * 0.28} ${h - 3} 12 ${h - 3} Q ${w * 0.2} ${m} 12 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 6 ${h - 3} Q ${w * 0.1} ${m} 6 3`} fill="none" stroke={strokeC} strokeWidth={2.5} />
          <text x={w * 0.42} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={9} fontWeight={700} fontFamily="system-ui" pointerEvents="none">=1</text>
        </g>
      );
    case "xnor":
      return (
        <g>
          <path d={`M 14 3 Q ${w * 0.28} 3 ${w - 10} ${m} Q ${w * 0.28} ${h - 3} 14 ${h - 3} Q ${w * 0.2} ${m} 14 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 8 ${h - 3} Q ${w * 0.1} ${m} 8 3`} fill="none" stroke={strokeC} strokeWidth={2.5} />
          <circle cx={w - 6} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.38} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">=1</text>
        </g>
      );
    // === 3-Input Logic Gates ===
    case "xor3":
      return (
        <g>
          <path d={`M 14 3 Q ${w * 0.28} 3 ${w - 3} ${m} Q ${w * 0.28} ${h - 3} 14 ${h - 3} Q ${w * 0.2} ${m} 14 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 6 ${h - 3} Q ${w * 0.1} ${m} 6 3`} fill="none" stroke={strokeC} strokeWidth={2.5} />
          <text x={w * 0.42} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">3XOR</text>
        </g>
      );
    case "xnor3":
      return (
        <g>
          <path d={`M 14 3 Q ${w * 0.28} 3 ${w - 10} ${m} Q ${w * 0.28} ${h - 3} 14 ${h - 3} Q ${w * 0.2} ${m} 14 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 8 ${h - 3} Q ${w * 0.1} ${m} 8 3`} fill="none" stroke={strokeC} strokeWidth={2.5} />
          <circle cx={w - 6} cy={m} r={4} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.35} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">3XNOR</text>
        </g>
      );
    case "nand3":
      return (
        <g>
          <path d={`M 6 3 L ${w * 0.4} 3 A ${m - 3} ${m - 3} 0 0 1 ${w * 0.4} ${h - 3} L 6 ${h - 3} Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 8} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.28} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">3&amp;</text>
        </g>
      );
    case "nor3":
      return (
        <g>
          <path d={`M 6 3 Q ${w * 0.2} 3 ${w - 10} ${m} Q ${w * 0.2} ${h - 3} 6 ${h - 3} Q ${w * 0.15} ${m} 6 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 6} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.28} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">3≥1</text>
        </g>
      );
    case "or3":
      return (
        <g>
          <path d={`M 6 3 Q ${w * 0.2} 3 ${w - 3} ${m} Q ${w * 0.2} ${h - 3} 6 ${h - 3} Q ${w * 0.15} ${m} 6 3 Z`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w * 0.38} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">3≥1</text>
        </g>
      );
    // === Compound Gates ===
    case "aoi":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m - 2} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">AOI</text>
          <text x={m} y={m + 10} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontFamily="system-ui" pointerEvents="none" opacity={0.7}>AB+CD</text>
        </g>
      );
    case "oai":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m - 2} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">OAI</text>
          <text x={m} y={m + 10} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontFamily="system-ui" pointerEvents="none" opacity={0.7}>(A+B)(C+D)</text>
        </g>
      );
    case "ao":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m - 2} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">A-O</text>
          <text x={m} y={m + 10} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontFamily="system-ui" pointerEvents="none" opacity={0.7}>AB+CD</text>
        </g>
      );
    case "buffer-inv":
      return (
        <g>
          <polygon points={`6,3 ${w * 0.45},${m} 6,${h - 3}`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 8} cy={m} r={4.5} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m - 4} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">±1</text>
        </g>
      );
    case "mux2-inv":
      return (
        <g>
          <polygon points={`6,3 ${w - 3},${m} 6,${h - 3}`} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={w - 6} cy={m - 4} r={3.5} fill={fillC} stroke={strokeC} strokeWidth={1} />
          <text x={m - 4} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">MUX</text>
        </g>
      );
    // === Combinational ===
    case "dec-2to4":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">DEC</text>
        </g>
      );
    case "prio-enc-4to2":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">PENC</text>
        </g>
      );
    case "full-comp":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">CMP</text>
        </g>
      );
    case "cla-unit":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">CLA</text>
        </g>
      );
    // === Sequential ===
    case "t-flipflop":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w / 2} y={m - 4} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={12} fontWeight={900} fontFamily="monospace" pointerEvents="none">T</text>
          <text x={w / 2} y={m + 10} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontFamily="system-ui" pointerEvents="none" opacity={0.7}>FF</text>
        </g>
      );
    case "sr-latch":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={900} fontFamily="monospace" pointerEvents="none">SR</text>
        </g>
      );
    case "jk-flipflop":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={w / 2} y={m - 4} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={900} fontFamily="monospace" pointerEvents="none">JK</text>
          <text x={w / 2} y={m + 10} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontFamily="system-ui" pointerEvents="none" opacity={0.7}>FF</text>
        </g>
      );
    case "reg-4bit":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m - 6} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={9} fontWeight={700} fontFamily="system-ui" pointerEvents="none">4-bit</text>
          <text x={m} y={m + 8} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="system-ui" pointerEvents="none">REG</text>
        </g>
      );
    // === New Input Controls ===
    case "dip-switch":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={8} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">DIP</text>
          {[0,1,2,3,4,5,6,7].map((idx) => {
            const sx = 8 + (idx % 4) * 18;
            const sy = 14 + Math.floor(idx / 4) * 32;
            return (
              <g key={idx}>
                <rect x={sx} y={sy} width={14} height={22} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                <text x={sx + 7} y={sy - 2} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontFamily="monospace" pointerEvents="none">{idx}</text>
              </g>
            );
          })}
        </g>
      );
    case "keypad":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={8} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">KEYPAD</text>
          {[1,2,3,4,5,6,7,8,9,0].map((num, idx) => {
            const kx = 10 + (idx % 3) * 20;
            const ky = 14 + Math.floor(idx / 3) * 18;
            return (
              <g key={idx}>
                <rect x={kx} y={ky} width={16} height={14} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                <text x={kx + 8} y={ky + 7.5} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={600} fontFamily="monospace" pointerEvents="none">{num}</text>
              </g>
            );
          })}
        </g>
      );
    case "analog-in":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={8} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">ANALOG</text>
          <rect x={12} y={14} width={6} height={42} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <rect x={12} y={14} width={6} height={0} rx={2} fill="#2D2D2D" opacity={0.4} />
          <text x={30} y={35} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={9} fontWeight={700} fontFamily="monospace" pointerEvents="none">0-15</text>
        </g>
      );
    case "random":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={14} fontWeight={900} fontFamily="serif" pointerEvents="none">?</text>
        </g>
      );
    case "push-button":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill={fillC} stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m} r={m - 10} fill="#2D2D2D" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m} y1={6} x2={m} y2={10} stroke={strokeC} strokeWidth={1.5} />
          <line x1={m - 3} y1={6} x2={m + 3} y2={6} stroke={strokeC} strokeWidth={1.5} />
        </g>
      );
    // === New Output Controls ===
    case "7-segment":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={600} pointerEvents="none">7-SEG</text>
        </g>
      );
    case "buzzer":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 20 ${m} L 28 ${m - 12} L 28 ${m + 12} Z`} fill="rgba(45,45,45,0.18)" />
          <circle cx={38} cy={m} r={8} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1.2} />
          <path d={`M 46 ${m - 5} Q 52 ${m} 46 ${m + 5}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
        </g>
      );
    case "bar-graph":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={8} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="system-ui" pointerEvents="none">BAR</text>
          {[0,1,2,3,4,5,6,7].map((idx) => (
            <rect key={idx} x={6 + idx * 9} y={14} width={7} height={44} rx={1.5} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
          ))}
        </g>
      );
    case "tri-led":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m} r={m - 6} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <circle cx={m - 6} cy={m - 4} r={3} fill="#ff4444" opacity={0.7} />
          <circle cx={m + 6} cy={m - 4} r={3} fill="#44ff44" opacity={0.7} />
          <circle cx={m} cy={m + 4} r={3} fill="#4444ff" opacity={0.7} />
        </g>
      );
    case "traffic-light":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={w / 2 - 8} y={4} width={16} height={h - 8} rx={3} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <circle cx={m} cy={16} r={5} fill="#ff4444" opacity={0.5} />
          <circle cx={m} cy={m} r={5} fill="#ffaa44" opacity={0.5} />
          <circle cx={m} cy={h - 16} r={5} fill="#44ff44" opacity={0.5} />
        </g>
      );
    case "digit-display":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={18} fontWeight={900} fontFamily="monospace" pointerEvents="none">0</text>
        </g>
      );
    case "dot-matrix":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {Array.from({length: 5}, (_, r) => Array.from({length: 5}, (_, c) => (
            <circle key={`${r}-${c}`} cx={14 + c * 14} cy={14 + r * 14} r={3} fill="rgba(45,45,45,0.1)" />
          )))}
        </g>
      );
    case "ascii-display":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={3} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.06)" strokeWidth={0.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={18} fontWeight={900} fontFamily="monospace" pointerEvents="none">A</text>
        </g>
      );
    case "lcd-display":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={3} y={3} width={w - 6} height={h - 6} rx={3} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.5} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">LCD</text>
        </g>
      );
    case "indicator-panel":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {[0,1,2,3,4,5,6,7].map((idx) => (
            <circle key={idx} cx={8 + (idx % 4) * 20} cy={18 + Math.floor(idx / 4) * 24} r={5} fill="rgba(45,45,45,0.1)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
          ))}
        </g>
      );
    case "scope-output":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={6} y1={m} x2={w - 6} y2={m} stroke="rgba(45,45,45,0.06)" strokeWidth={0.5} />
          <line x1={m} y1={6} x2={m} y2={h - 6} stroke="rgba(45,45,45,0.06)" strokeWidth={0.5} />
          <polyline points={`6,${m} 20,${m} 20,${m - 14} 40,${m - 14} 40,${m} 60,${m} 60,${m - 14} 80,${m - 14} 80,${m} 100,${m} 114,${m}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
        </g>
      );
    case "servo-motor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 4} r={m - 12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <circle cx={m} cy={m - 4} r={3} fill="#2D2D2D" opacity={0.5} />
          <line x1={m} y1={m - 4} x2={m + 10} y2={m - 14} stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">SERVO</text>
        </g>
      );
    case "stepper-motor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={m - 12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={6} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <line x1={m} y1={m - 2} x2={m} y2={m - 12} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">STEPPER</text>
        </g>
      );
    // === Sensor thumbnails ===
    case "temp-sensor":
      return (
        <g>
          {/* Thermometer bulb shape */}
          <line x1={m} y1={4} x2={m} y2={m + 6} stroke={strokeC} strokeWidth={3} strokeLinecap="round" />
          <circle cx={m} cy={m + 10} r={7} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m + 10} r={4} fill="rgba(45,45,45,0.2)" />
          <line x1={m - 4} y1={m - 6} x2={m + 4} y2={m - 6} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 4} y1={m - 2} x2={m + 4} y2={m - 2} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">TEMP</text>
        </g>
      );
    case "humidity-sensor":
      return (
        <g>
          {/* Water droplet / teardrop shape */}
          <path d={`M ${m} 4 Q ${m + 14} ${m + 2} ${m} ${m + 14} Q ${m - 14} ${m + 2} ${m} 4 Z`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${m - 4} ${m + 6} Q ${m} ${m + 10} ${m + 4} ${m + 6}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <circle cx={m} cy={m - 4} r={2} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">HUMID</text>
        </g>
      );
    case "light-sensor":
      return (
        <g>
          {/* Sun/star shape: hexagonal star with radiating points */}
          <polygon points={`${m},${m - 12} ${m + 4},${m - 4} ${m + 12},${m - 4} ${m + 6},${m + 2} ${m + 8},${m + 10} ${m},${m + 6} ${m - 8},${m + 10} ${m - 6},${m + 2} ${m - 12},${m - 4} ${m - 4},${m - 4}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {[0,45,90,135,180,225,270,315].map((a) => {
            const rad = a * Math.PI / 180;
            return <line key={a} x1={m + Math.cos(rad) * 15} y1={m + Math.sin(rad) * 15} x2={m + Math.cos(rad) * 19} y2={m + Math.sin(rad) * 19} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />;
          })}
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">LDR</text>
        </g>
      );
    case "ir-sensor":
      return (
        <g>
          {/* Triangle (diode symbol): filled triangle with bar */}
          <polygon points={`${m - 10},${m - 10} ${m - 10},${m + 8} ${m + 8},${m - 1}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} strokeLinejoin="round" />
          <line x1={m + 8} y1={m - 12} x2={m + 8} y2={m + 10} stroke={strokeC} strokeWidth={2} />
          <line x1={m - 10} y1={m + 14} x2={m + 10} y2={m + 14} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <polygon points={`${m + 14},${m - 4} ${m + 10},${m - 1} ${m + 14},${m + 2}`} fill="rgba(45,45,45,0.3)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">IR</text>
        </g>
      );
    case "ultrasonic-sensor":
      return (
        <g>
          {/* Rounded rect HC-SR04 module with dual circles */}
          <rect x={8} y={8} width={w - 16} height={h - 16} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 8} cy={m - 2} r={7} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <circle cx={m + 8} cy={m - 2} r={7} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <circle cx={m - 8} cy={m - 2} r={3} fill="rgba(45,45,45,0.1)" />
          <circle cx={m + 8} cy={m - 2} r={3} fill="rgba(45,45,45,0.1)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">SONIC</text>
        </g>
      );
    case "motion-sensor":
      return (
        <g>
          {/* Dome shape: arc on top of flat base */}
          <path d={`M ${m - 14} ${m + 4} L ${m - 14} ${m + 8} L ${m + 14} ${m + 8} L ${m + 14} ${m + 4}`} fill="none" stroke={strokeC} strokeWidth={1.5} strokeLinecap="round" />
          <path d={`M ${m - 14} ${m + 4} A 14 14 0 0 1 ${m + 14} ${m + 4}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${m - 8} ${m + 4} A 8 8 0 0 1 ${m + 8} ${m + 4}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
          <circle cx={m} cy={m - 2} r={3} fill="rgba(45,45,45,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PIR</text>
        </g>
      );
    case "pressure-sensor":
      return (
        <g>
          {/* Circular gauge: full circle with dial needle */}
          <circle cx={m} cy={m - 2} r={14} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={11} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a) => {
            const rad = a * Math.PI / 180;
            const cx2 = m, cy2 = m - 2;
            return <line key={a} x1={cx2 + Math.cos(rad) * 11} y1={cy2 + Math.sin(rad) * 11} x2={cx2 + Math.cos(rad) * 14} y2={cy2 + Math.sin(rad) * 14} stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />;
          })}
          <line x1={m} y1={m - 2} x2={m + 6} y2={m - 10} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={m} cy={m - 2} r={2} fill="rgba(45,45,45,0.3)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PRESS</text>
        </g>
      );
    case "accelerometer-sensor":
      return (
        <g>
          {/* Diamond/lozenge: rotated square */}
          <polygon points={`${m},${m - 14} ${m + 14},${m} ${m},${m + 14} ${m - 14},${m}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} strokeLinejoin="round" />
          <polygon points={`${m},${m - 8} ${m + 8},${m} ${m},${m + 8} ${m - 8},${m}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
          <line x1={m} y1={m + 2} x2={m} y2={m - 6} stroke="rgba(45,45,45,0.5)" strokeWidth={1} />
          <polygon points={`${m},${m - 8} ${m - 2},${m - 5} ${m + 2},${m - 5}`} fill="rgba(45,45,45,0.5)" />
          <line x1={m - 6} y1={m + 6} x2={m + 6} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <polygon points={`${m + 8},${m + 6} ${m + 5},${m + 4} ${m + 5},${m + 8}`} fill="rgba(45,45,45,0.3)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ACCEL</text>
        </g>
      );
    case "gyro-sensor":
      return (
        <g>
          {/* Hexagonal outline */}
          <polygon points={`${m},${m - 14} ${m + 12},${m - 7} ${m + 12},${m + 7} ${m},${m + 14} ${m - 12},${m + 7} ${m - 12},${m - 7}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} strokeLinejoin="round" />
          <path d={`M ${m - 6} ${m} A 6 6 0 1 1 ${m + 6} ${m}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <polygon points={`${m + 8},${m + 2} ${m + 6},${m - 1} ${m + 9},${m}`} fill="rgba(45,45,45,0.3)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">GYRO</text>
        </g>
      );
    case "magnetic-sensor":
      return (
        <g>
          {/* Horseshoe magnet: U-shape with N/S poles */}
          <path d={`M ${m - 10} ${m - 12} L ${m - 10} ${m + 4} A 10 10 0 0 0 ${m + 10} ${m + 4} L ${m + 10} ${m - 12}`} fill="none" stroke={strokeC} strokeWidth={3} strokeLinecap="round" />
          <rect x={m - 12} y={m - 14} width={5} height={6} rx={1} fill="rgba(255,100,100,0.3)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.5} />
          <rect x={m + 7} y={m - 14} width={5} height={6} rx={1} fill="rgba(100,150,255,0.3)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.5} />
          <text x={m - 10} y={m - 8} textAnchor="middle" fill="rgba(45,45,45,0.5)" fontSize={6} fontWeight={700} pointerEvents="none">N</text>
          <text x={m + 10} y={m - 8} textAnchor="middle" fill="rgba(45,45,45,0.5)" fontSize={6} fontWeight={700} pointerEvents="none">S</text>
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">MAG</text>
        </g>
      );
    case "force-sensor":
      return (
        <g>
          {/* Piston: rectangular body with downward arrow */}
          <rect x={m - 10} y={8} width={20} height={22} rx={2} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m} y1={4} x2={m} y2={16} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <polygon points={`${m},${m - 2} ${m - 3},${m - 6} ${m + 3},${m - 6}`} fill="rgba(45,45,45,0.5)" />
          <rect x={m - 6} y={m + 2} width={12} height={3} rx={1} fill="rgba(45,45,45,0.2)" />
          <rect x={m - 8} y={m + 7} width={16} height={3} rx={1} fill="rgba(45,45,45,0.1)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">FORCE</text>
        </g>
      );
    case "proximity-sensor":
      return (
        <g>
          {/* Pill/capsule with emission waves */}
          <rect x={m - 12} y={m - 6} width={16} height={14} rx={7} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 4} cy={m + 1} r={3} fill="rgba(45,45,45,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m + 8} ${m - 2} Q ${m + 14} ${m + 1} ${m + 8} ${m + 4}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <path d={`M ${m + 12} ${m - 6} Q ${m + 20} ${m + 1} ${m + 12} ${m + 8}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <path d={`M ${m + 16} ${m - 10} Q ${m + 26} ${m + 1} ${m + 16} ${m + 12}`} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PROX</text>
        </g>
      );
    case "hall-sensor":
      return (
        <g>
          {/* Small 3-pin IC with N/S */}
          <rect x={m - 8} y={m - 10} width={16} height={20} rx={2} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 3} cy={m - 7} r={1.5} fill="rgba(45,45,45,0.18)" />
          {[0,1,2].map(i => <rect key={`hp${i}`} x={-3} y={m - 6 + i * 6} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" />)}
          {[0,1,2].map(i => <rect key={`hp2${i}`} x={w - 3} y={m - 6 + i * 6} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" />)}
          <text x={m} y={m + 2} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={700} pointerEvents="none">HALL</text>
          <text x={m - 12} y={m - 10} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={700} pointerEvents="none">N</text>
          <text x={m + 12} y={m + 14} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={700} pointerEvents="none">S</text>
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">HALL</text>
        </g>
      );
    case "gas-sensor":
      return (
        <g>
          {/* Chimney/cylinder with smoke wisps */}
          <rect x={m - 8} y={m - 4} width={16} height={20} rx={2} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 10} y={m - 6} width={20} height={4} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m - 3} ${m - 8} Q ${m - 4} ${m - 12} ${m - 2} ${m - 14}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m + 1} ${m - 10} Q ${m} ${m - 14} ${m + 2} ${m - 16}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
          <path d={`M ${m + 4} ${m - 7} Q ${m + 5} ${m - 11} ${m + 3} ${m - 13}`} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">GAS</text>
        </g>
      );
    case "camera-sensor":
      return (
        <g>
          {/* Circular lens ring (circle within circle) */}
          <circle cx={m} cy={m - 2} r={14} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={10} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <circle cx={m} cy={m - 2} r={6} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <circle cx={m} cy={m - 2} r={3} fill="rgba(45,45,45,0.18)" />
          <circle cx={m - 2} cy={m - 4} r={1} fill="rgba(45,45,45,0.2)" />
          <rect x={m - 4} y={m + 10} width={8} height={4} rx={1} fill="rgba(0,0,0,0.15)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">CAM</text>
        </g>
      );
    case "microphone-sensor":
      return (
        <g>
          {/* Pill/capsule with stand */}
          <rect x={m - 6} y={4} width={12} height={18} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m - 4} y1={10} x2={m + 4} y2={10} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 4} y1={13} x2={m + 4} y2={13} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 4} y1={16} x2={m + 4} y2={16} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m - 10} ${m + 4} Q ${m - 10} ${m + 12} ${m} ${m + 12} Q ${m + 10} ${m + 12} ${m + 10} ${m + 4}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <line x1={m} y1={m + 12} x2={m} y2={h - 8} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <line x1={m - 5} y1={h - 8} x2={m + 5} y2={h - 8} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">MIC</text>
        </g>
      );
    case "gps-module":
      return (
        <g>
          {/* Trapezoid dish shape */}
          <polygon points={`${m - 6},${8} ${m + 6},${8} ${m + 14},${m + 4} ${m - 14},${m + 4}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} strokeLinejoin="round" />
          <line x1={m} y1={8} x2={m} y2={m - 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <circle cx={m} cy={m - 8} r={2} fill="rgba(45,45,45,0.3)" />
          <path d={`M ${m - 10} ${m + 4} L ${m - 10} ${m + 10} L ${m + 10} ${m + 10} L ${m + 10} ${m + 4}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">GPS</text>
        </g>
      );
    case "rfid-reader":
      return (
        <g>
          {/* Concentric circles (coil) */}
          <circle cx={m} cy={m - 2} r={14} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={11} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={1.2} />
          <circle cx={m} cy={m - 2} r={8} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <circle cx={m} cy={m - 2} r={5} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
          <circle cx={m} cy={m - 2} r={2} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">RFID</text>
        </g>
      );
    case "nfc-reader":
      return (
        <g>
          {/* Rounded square with waves */}
          <rect x={m - 12} y={m - 12} width={24} height={24} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 7} y={m - 7} width={14} height={14} rx={3} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m + 14} ${m - 4} Q ${m + 18} ${m} ${m + 14} ${m + 4}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <path d={`M ${m + 18} ${m - 7} Q ${m + 24} ${m} ${m + 18} ${m + 7}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <path d={`M ${m + 22} ${m - 10} Q ${m + 30} ${m} ${m + 22} ${m + 10}`} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">NFC</text>
        </g>
      );
    case "barcode-scanner":
      return (
        <g>
          {/* Tall thin rectangle with bars */}
          <rect x={m - 10} y={4} width={20} height={h - 12} rx={3} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m - 5} y1={10} x2={m - 5} y2={m + 4} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 1} y1={10} x2={m - 1} y2={m + 4} stroke="rgba(45,45,45,0.5)" strokeWidth={1} />
          <line x1={m + 2} y1={10} x2={m + 2} y2={m + 4} stroke="rgba(45,45,45,0.5)" strokeWidth={2.5} />
          <line x1={m + 6} y1={10} x2={m + 6} y2={m + 4} stroke="rgba(45,45,45,0.5)" strokeWidth={1} />
          <circle cx={m} cy={m + 8} r={2} fill="rgba(255,100,100,0.4)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BAR</text>
        </g>
      );
    case "fingerprint-sensor":
      return (
        <g>
          {/* Oval with ridge lines */}
          <ellipse cx={m} cy={m - 2} rx={13} ry={15} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${m - 8} ${m - 10} Q ${m} ${m - 14} ${m + 8} ${m - 10}`} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />
          <path d={`M ${m - 10} ${m - 5} Q ${m} ${m - 9} ${m + 10} ${m - 5}`} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />
          <path d={`M ${m - 11} ${m} Q ${m} ${m - 3} ${m + 11} ${m}`} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />
          <path d={`M ${m - 10} ${m + 5} Q ${m} ${m + 2} ${m + 10} ${m + 5}`} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />
          <path d={`M ${m - 7} ${m + 9} Q ${m} ${m + 6} ${m + 7} ${m + 9}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">FPRINT</text>
        </g>
      );
    case "face-recog-cam":
      return (
        <g>
          {/* Face outline (oval + camera) */}
          <ellipse cx={m} cy={m + 4} rx={10} ry={12} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 4} cy={m + 1} r={1.5} fill="rgba(45,45,45,0.3)" />
          <circle cx={m + 4} cy={m + 1} r={1.5} fill="rgba(45,45,45,0.3)" />
          <path d={`M ${m - 2} ${m + 6} L ${m} ${m + 7} L ${m + 2} ${m + 6}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.6} />
          <path d={`M ${m - 3} ${m + 10} Q ${m} ${m + 13} ${m + 3} ${m + 10}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <rect x={m - 7} y={4} width={14} height={10} rx={2} fill="rgba(0,0,0,0.15)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <circle cx={m} cy={9} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <circle cx={m} cy={9} r={1.5} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">FACE</text>
        </g>
      );
    // === Processor thumbnails ===
    case "microcontroller":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3].map(i => <g key={`l${i}`}><rect x={-3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">MCU</text>
        </g>
      );
    case "cpu-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3,4].map(i => <g key={`l${i}`}><rect x={-3} y={12 + i * 16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={12 + i * 16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={10} fontWeight={800} fontFamily="monospace" pointerEvents="none">CPU</text>
        </g>
      );
    case "fpga-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {Array.from({length:4}, (_, i) => <g key={`l${i}`}><rect x={-3} y={12 + i * 16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={12 + i * 16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">FPGA</text>
        </g>
      );
    case "dsp-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3].map(i => <g key={`dl${i}`}><rect x={-3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <path d={`M 14 ${m} Q 20 ${m - 8} 28 ${m} Q 36 ${m + 8} 44 ${m} Q 50 ${m - 8} 58 ${m}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">DSP</text>
        </g>
      );
    case "npu-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3].map(i => <g key={`nl${i}`}><rect x={-3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <circle cx={m - 10} cy={m - 4} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <circle cx={m} cy={m - 6} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <circle cx={m + 10} cy={m - 4} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <circle cx={m - 6} cy={m + 6} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <circle cx={m + 6} cy={m + 6} r={3} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <line x1={m - 10} y1={m - 4} x2={m} y2={m - 6} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <line x1={m} y1={m - 6} x2={m + 10} y2={m - 4} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <line x1={m - 10} y1={m - 4} x2={m - 6} y2={m + 6} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <line x1={m} y1={m - 6} x2={m - 6} y2={m + 6} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <line x1={m} y1={m - 6} x2={m + 6} y2={m + 6} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <line x1={m + 10} y1={m - 4} x2={m + 6} y2={m + 6} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">NPU</text>
        </g>
      );
    // === Memory thumbnails ===
    case "ram-block": case "rom-block": case "eeprom-block": case "flash-block": case "sram-block": case "cache-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {Array.from({length:3}, (_, i) => <rect key={i} x={8} y={10 + i * 16} width={w - 16} height={12} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.5} />)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">{GATE_DEFS[type]?.label || "?"}</text>
        </g>
      );
    // === Communication thumbnails ===
    case "uart-block": case "spi-block": case "i2c-block": case "can-bus": case "usb-block":
    case "ethernet-block": case "wifi-block": case "bluetooth-block": case "zigbee-block": case "lora-block":
    case "gsm-module": case "mqtt-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${12} ${m} L ${20} ${m - 6} L ${28} ${m + 6} L ${36} ${m - 6} L ${44} ${m + 6} L ${52} ${m - 6} L ${60} ${m}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} fontFamily="monospace" pointerEvents="none">{GATE_DEFS[type]?.label || "?"}</text>
        </g>
      );
    // === Power thumbnails ===
    case "battery":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 12} y={10} width={24} height={h - 20} rx={2} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <line x1={m - 5} y1={14} x2={m + 5} y2={14} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 8} y1={20} x2={m + 8} y2={20} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 5} y1={26} x2={m + 5} y2={26} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">BAT</text>
        </g>
      );
    case "voltage-regulator": case "buck-converter": case "boost-converter":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={8} y1={m} x2={w - 8} y2={m} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <rect x={m - 10} y={8} width={20} height={h - 16} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontWeight={600} fontFamily="monospace" pointerEvents="none">{GATE_DEFS[type]?.label}</text>
        </g>
      );
    case "adapter":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 14} y={10} width={28} height={h - 22} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 4} y1={10} x2={m - 4} y2={6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m + 4} y1={10} x2={m + 4} y2={6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <text x={m} y={m - 2} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">AC</text>
          <text x={m} y={m + 6} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">DC</text>
          <line x1={m - 6} y1={m + 10} x2={m + 6} y2={m + 10} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ADAPT</text>
        </g>
      );
    case "fuse":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={12} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <rect x={12} y={m - 5} width={w - 24} height={10} rx={5} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={14} y1={m} x2={18} y2={m - 2} stroke="rgba(45,45,45,0.5)" strokeWidth={0.8} />
          <line x1={18} y1={m - 2} x2={22} y2={m + 2} stroke="rgba(45,45,45,0.5)" strokeWidth={0.8} />
          <line x1={22} y1={m + 2} x2={26} y2={m - 1} stroke="rgba(45,45,45,0.5)" strokeWidth={0.8} />
          <line x1={26} y1={m - 1} x2={w - 14} y2={m} stroke="rgba(45,45,45,0.5)" strokeWidth={0.8} />
          <line x1={w - 12} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">FUSE</text>
        </g>
      );
    case "bms":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 10} y={6} width={20} height={14} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={16} textAnchor="middle" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">BMS</text>
          <rect x={m - 10} y={m + 4} width={20} height={h - 16} rx={2} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 3} y1={m + 8} x2={m + 3} y2={m + 8} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 6} y1={m + 13} x2={m + 6} y2={m + 13} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 3} y1={m + 18} x2={m + 3} y2={m + 18} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PROTECT</text>
        </g>
      );
    case "power-switch":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={14} cy={m} r={3} fill="rgba(45,45,45,0.3)" />
          <circle cx={w - 14} cy={m} r={3} fill="rgba(45,45,45,0.3)" />
          <line x1={14} y1={m} x2={w - 14} y2={m - 10} stroke="rgba(45,45,45,0.5)" strokeWidth={2} strokeLinecap="round" />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">SW</text>
        </g>
      );
    // === Electronic thumbnails ===
    case "resistor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={14} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <polyline points={`14,${m} 18,${m - 6} 24,${m + 6} 30,${m - 6} 36,${m + 6} 42,${m - 6} 48,${m + 6} 52,${m}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.2} />
          <line x1={52} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
        </g>
      );
    case "capacitor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={m - 3} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <line x1={m - 3} y1={m - 10} x2={m - 3} y2={m + 10} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m + 3} y1={m - 10} x2={m + 3} y2={m + 10} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m + 3} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
        </g>
      );
    case "inductor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={14} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <path d={`M 14 ${m} Q 20 ${m - 10} 26 ${m} Q 32 ${m - 10} 38 ${m} Q 44 ${m - 10} 50 ${m} Q 56 ${m - 10} 58 ${m}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.2} />
          <line x1={58} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
        </g>
      );
    case "diode": case "zener-diode":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={m - 8} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <polygon points={`${m - 8},${m - 8} ${m - 8},${m + 8} ${m + 8},${m}`} fill="rgba(45,45,45,0.18)" stroke="rgba(45,45,45,0.5)" strokeWidth={1} />
          <line x1={m + 8} y1={m - 8} x2={m + 8} y2={m + 8} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <line x1={m + 8} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
        </g>
      );
    case "transistor-bjt": case "transistor-mosfet":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m} r={12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={4} y1={m} x2={m - 12} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 12} y1={m - 6} x2={m - 12} y2={m + 6} stroke="rgba(45,45,45,0.5)" strokeWidth={2} />
          <line x1={m - 12} y1={m - 6} x2={m - 4} y2={m - 12} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 12} y1={m + 6} x2={m - 4} y2={m + 12} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 4} y1={m - 12} x2={w - 4} y2={m - 12} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 4} y1={m + 12} x2={w - 4} y2={m + 12} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
        </g>
      );
    case "op-amp":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <polygon points={`8,8 8,${h - 8} ${w - 8},${m}`} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <text x={16} y={20} fill="rgba(45,45,45,0.5)" fontSize={7} fontWeight={700} pointerEvents="none">+</text>
          <text x={16} y={h - 12} fill="rgba(45,45,45,0.5)" fontSize={7} fontWeight={700} pointerEvents="none">-</text>
        </g>
      );
    case "crystal-osc":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={4} y1={m} x2={m - 8} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <rect x={m - 8} y={m - 8} width={16} height={16} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 4} y1={m - 6} x2={m - 4} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <line x1={m + 4} y1={m - 6} x2={m + 4} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <line x1={m + 8} y1={m} x2={w - 4} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">XTAL</text>
        </g>
      );
    case "transformer":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${m - 12} ${m - 10} Q ${m - 6} ${m - 10} ${m - 6} ${m - 5} Q ${m - 6} ${m} ${m - 12} ${m} Q ${m - 6} ${m} ${m - 6} ${m + 5} Q ${m - 6} ${m + 10} ${m - 12} ${m + 10}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <path d={`M ${m + 12} ${m - 10} Q ${m + 6} ${m - 10} ${m + 6} ${m - 5} Q ${m + 6} ${m} ${m + 12} ${m} Q ${m + 6} ${m} ${m + 6} ${m + 5} Q ${m + 6} ${m + 10} ${m + 12} ${m + 10}`} fill="none" stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <line x1={m - 3} y1={m - 10} x2={m - 3} y2={m + 10} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m} y1={m - 10} x2={m} y2={m + 10} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m + 3} y1={m - 10} x2={m + 3} y2={m + 10} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">XFRM</text>
        </g>
      );
    // === Actuator thumbnails ===
    case "dc-motor":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <text x={m} y={m - 1} textAnchor="middle" dominantBaseline="central" fill="rgba(45,45,45,0.5)" fontSize={6} fontWeight={700} pointerEvents="none">M</text>
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">DC</text>
        </g>
      );
    case "relay":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 14} y={8} width={28} height={h - 16} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 6} y1={m - 4} x2={m + 6} y2={m - 4} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <circle cx={m - 6} cy={m - 4} r={2} fill="rgba(45,45,45,0.3)" />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">RELAY</text>
        </g>
      );
    case "speaker":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 6} cy={m} r={6} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <path d={`M ${m} ${m - 8} L ${m + 10} ${m - 14} L ${m + 10} ${m + 14} L ${m} ${m + 8}`} fill="rgba(45,45,45,0.2)" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">SPK</text>
        </g>
      );
    case "oled-display":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={3} fill="rgba(0,0,0,0.4)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">OLED</text>
        </g>
      );
    // === Board thumbnails ===
    case "arduino-uno": case "arduino-nano":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3].map(i => <g key={`p${i}`}><rect x={-3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={14 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m - 4} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">{type === "arduino-uno" ? "UNO" : "NANO"}</text>
          <rect x={m - 8} y={m + 6} width={16} height={6} rx={2} fill="rgba(45,45,45,0.1)" />
        </g>
      );
    case "raspberry-pi":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <circle cx={m - 12} cy={m + 12} r={4} fill="rgba(45,45,45,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m - 6} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">RPi 4</text>
          <rect x={m - 10} y={m + 4} width={20} height={4} rx={1} fill="rgba(45,45,45,0.1)" />
        </g>
      );
    case "raspberry-pi-pico":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {Array.from({length:5}, (_, i) => <g key={`p${i}`}><rect x={-3} y={10 + i * 12} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={10 + i * 12} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">PICO</text>
        </g>
      );
    case "esp32":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <rect x={m - 14} y={8} width={28} height={12} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
          <text x={m} y={m + 2} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">ESP32</text>
        </g>
      );
    case "stm32":
      return (
        <g>
          <rect width={w} height={h} rx={6} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          <circle cx={m - 6} cy={m - 8} r={3} fill="rgba(45,45,45,0.1)" />
          <text x={m} y={m + 4} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">STM32</text>
        </g>
      );
    case "gpu-block":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {Array.from({length:4}, (_, i) => <rect key={i} x={12 + i * 16} y={12} width={12} height={h - 24} rx={1} fill="rgba(45,45,45,0.05)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.5} />)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">GPU</text>
        </g>
      );
    // === Advanced Sensor thumbnails ===
    case "bme280":
      return (
        <g>
          {/* IC chip with pins on both sides */}
          <rect x={m - 10} y={8} width={20} height={h - 16} rx={2} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 5} cy={11} r={1.5} fill="rgba(45,45,45,0.18)" />
          {[0,1,2,3].map(i => <g key={`bp${i}`}><rect x={-3} y={12 + i * 6} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" /><rect x={w - 3} y={12 + i * 6} width={6} height={3} rx={1} fill="rgba(45,45,45,0.18)" /></g>)}
          <text x={m} y={m - 2} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">BME</text>
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BME280</text>
        </g>
      );
    case "pir-sensor":
      return (
        <g>
          {/* Dome on rectangular base (HC-SR501 style) */}
          <rect x={8} y={m + 2} width={w - 16} height={12} rx={2} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M 8 ${m + 2} A ${m - 8} ${m - 6} 0 0 1 ${w - 8} ${m + 2}`} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <path d={`M ${m - 6} ${m + 2} A 6 4 0 0 1 ${m + 6} ${m + 2}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
          <circle cx={m} cy={m - 4} r={3} fill="rgba(45,45,45,0.1)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.6} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PIR</text>
        </g>
      );
    case "current-sensor":
      return (
        <g>
          {/* Toroid ring (thick circle with hole) */}
          <circle cx={m} cy={m - 2} r={14} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={6} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <path d={`M ${m} ${m - 16} A 2 2 0 0 1 ${m + 2} ${m - 14}`} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m} y1={m + 12} x2={m} y2={m + 16} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">INA219</text>
        </g>
      );
    case "color-sensor":
      return (
        <g>
          {/* Circle divided into quadrants */}
          <circle cx={m} cy={m - 2} r={14} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m} y1={m - 16} x2={m} y2={m + 12} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m - 14} y1={m - 2} x2={m + 14} y2={m - 2} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <circle cx={m - 5} cy={m - 6} r={2} fill="rgba(255,100,100,0.3)" />
          <circle cx={m + 5} cy={m - 6} r={2} fill="rgba(100,255,100,0.3)" />
          <circle cx={m - 5} cy={m + 2} r={2} fill="rgba(100,100,255,0.3)" />
          <circle cx={m + 5} cy={m + 2} r={2} fill="rgba(255,255,100,0.3)" />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">RGB</text>
        </g>
      );
    case "strain-gauge":
      return (
        <g>
          {/* I-beam shape */}
          <rect x={10} y={m - 12} width={w - 20} height={4} rx={1} fill="rgba(45,45,45,0.06)" stroke={strokeC} strokeWidth={1.2} />
          <rect x={m - 3} y={m - 8} width={6} height={16} rx={0} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.2} />
          <rect x={10} y={m + 8} width={w - 20} height={4} rx={1} fill="rgba(45,45,45,0.06)" stroke={strokeC} strokeWidth={1.2} />
          <polyline points={`14,${m} 18,${m - 3} 22,${m + 3} 26,${m - 3} 30,${m + 3} 34,${m - 3} 38,${m + 3} 42,${m}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">STRAIN</text>
        </g>
      );
    case "tilt-sensor":
      return (
        <g>
          {/* Glass tube with pendulum ball */}
          <rect x={m - 4} y={6} width={8} height={22} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m} y1={10} x2={m - 2} y2={m + 4} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <circle cx={m - 2} cy={m + 4} r={3} fill="rgba(45,45,45,0.18)" stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
          <line x1={m - 6} y1={8} x2={m + 6} y2={8} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">TILT</text>
        </g>
      );
    case "reed-sensor":
      return (
        <g>
          {/* Glass tube with two contacts */}
          <rect x={m - 4} y={6} width={8} height={22} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m - 1} y1={10} x2={m - 1} y2={m + 4} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m + 1} y1={m + 4} x2={m + 1} y2={28} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <circle cx={m - 1} cy={m + 4} r={1.5} fill="rgba(45,45,45,0.3)" />
          <circle cx={m + 1} cy={m + 4} r={1.5} fill="rgba(45,45,45,0.3)" />
          <line x1={m - 6} y1={8} x2={m + 6} y2={8} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">REED</text>
        </g>
      );
    // === Advanced Actuator thumbnails ===
    case "esc":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 10} y={8} width={20} height={h - 16} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">ESC</text>
        </g>
      );
    case "motor-driver":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 14} y={6} width={28} height={h - 12} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m - 4} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">L298N</text>
          <text x={m} y={m + 8} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} pointerEvents="none">DRIVER</text>
        </g>
      );
    case "robotic-arm-6dof":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 16} cy={m + 8} r={4} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 12} y1={m + 8} x2={m} y2={m - 4} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <line x1={m} y1={m - 4} x2={m + 12} y2={m - 8} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <circle cx={m + 12} cy={m - 8} r={3} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">6DOF</text>
        </g>
      );
    case "pneumatic-cylinder":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={10} y={m - 6} width={w - 20} height={12} rx={2} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m} y1={m - 3} x2={m} y2={m + 3} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PNEUM</text>
        </g>
      );
    // === Advanced Electronic thumbnails ===
    case "mosfet-driver":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 10} y={8} width={20} height={h - 16} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">GATE</text>
        </g>
      );
    case "relay-module":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {[0,1,2,3].map(i => <rect key={i} x={8 + i * 20} y={8} width={16} height={h - 16} rx={2} fill="rgba(0,0,0,0.15)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />)}
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">4CH RELAY</text>
        </g>
      );
    // === Robotics thumbnails ===
    case "wheel-mecanum":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          {[-30, -10, 10, 30].map(a => <line key={a} x1={m + Math.cos(a * Math.PI / 180) * 8} y1={m - 2 + Math.sin(a * Math.PI / 180) * 8} x2={m + Math.cos(a * Math.PI / 180) * 12} y2={m - 2 + Math.sin(a * Math.PI / 180) * 12} stroke="rgba(45,45,45,0.18)" strokeWidth={1} />)}
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">MECANUM</text>
        </g>
      );
    case "wheel-omni":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m} cy={m - 2} r={12} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          {[0, 90, 180, 270].map(a => <circle key={a} cx={m + Math.cos(a * Math.PI / 180) * 12} cy={m - 2 + Math.sin(a * Math.PI / 180) * 12} r={2} fill="rgba(45,45,45,0.18)" />)}
          <text x={m} y={h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">OMNI</text>
        </g>
      );
    case "chassis-frame":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={10} y={10} width={w - 20} height={h - 20} rx={2} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1.5} />
          <circle cx={14} cy={14} r={3} fill="rgba(45,45,45,0.2)" />
          <circle cx={w - 14} cy={14} r={3} fill="rgba(45,45,45,0.2)" />
          <circle cx={14} cy={h - 14} r={3} fill="rgba(45,45,45,0.2)" />
          <circle cx={w - 14} cy={h - 14} r={3} fill="rgba(45,45,45,0.2)" />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={600} pointerEvents="none">CHASSIS</text>
        </g>
      );
    case "industrial-6axis":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 10} cy={m + 10} r={5} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 5} y1={m + 10} x2={m + 5} y2={m} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <line x1={m + 5} y1={m} x2={m + 14} y2={m - 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
          <circle cx={m + 14} cy={m - 6} r={3} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">6-AXIS</text>
        </g>
      );
    case "scara-arm":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 12} cy={m} r={4} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m - 8} y1={m} x2={m + 8} y2={m - 4} stroke="rgba(45,45,45,0.3)" strokeWidth={2} />
          <line x1={m + 8} y1={m - 4} x2={m + 16} y2={m + 2} stroke="rgba(45,45,45,0.3)" strokeWidth={2} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">SCARA</text>
        </g>
      );
    case "delta-robot":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <line x1={m - 16} y1={8} x2={m} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m} y1={8} x2={m} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m + 16} y1={8} x2={m} y2={m + 6} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <circle cx={m} cy={m + 6} r={3} fill="rgba(45,45,45,0.18)" />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">DELTA</text>
        </g>
      );
    // === Industrial thumbnails ===
    case "plc-controller":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={6} y={6} width={w - 12} height={h - 12} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
          {[0,1,2,3].map(i => <rect key={`i${i}`} x={-3} y={12 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.18)" />)}
          {[0,1,2,3].map(i => <rect key={`o${i}`} x={w - 3} y={12 + i * 14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.2)" />)}
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">PLC</text>
        </g>
      );
    case "plc-io-module":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          {[0,1,2,3].map(i => <rect key={i} x={6} y={8 + i * 14} width={w - 12} height={10} rx={1} fill="rgba(0,0,0,0.15)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />)}
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">I/O</text>
        </g>
      );
    case "vfd-drive":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 12} y={8} width={24} height={h - 16} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m - 2} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">VFD</text>
          <text x={m} y={m + 8} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} pointerEvents="none">U V W</text>
        </g>
      );
    case "servo-drive":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <rect x={m - 12} y={8} width={24} height={h - 16} rx={2} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={m} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">SRVO</text>
        </g>
      );
    case "proximity-switch":
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.04)" stroke={strokeC} strokeWidth={1.5} />
          <circle cx={m - 4} cy={m} r={6} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
          <line x1={m + 4} y1={m - 4} x2={m + 10} y2={m - 8} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m + 4} y1={m} x2={m + 10} y2={m} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <line x1={m + 4} y1={m + 4} x2={m + 10} y2={m + 8} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PROX</text>
        </g>
      );
    default: {
      const gate = GATE_DEFS[type];
      const ins = gate?.inputs || [];
      const outs = gate?.outputs || [];
      return (
        <g>
          <rect width={w} height={h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={2} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.6} />
          {ins.length > 0 && Array.from({length: Math.min(ins.length, 6)}, (_, i) => (
            <g key={`fl${i}`}>
              <rect x={-3} y={10 + i * Math.max(8, (h - 20) / (ins.length + 1))} width={6} height={3.5} rx={1} fill="rgba(45,45,45,0.22)" />
              <rect x={w - 3} y={10 + i * Math.max(8, (h - 20) / (outs.length + 1))} width={6} height={3.5} rx={1} fill="rgba(45,45,45,0.22)" />
            </g>
          ))}
          <circle cx={12} cy={10} r={1.8} fill="rgba(45,45,45,0.15)" />
          <text x={m} y={m - 2} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={Math.min(9, w / 8)} fontWeight={800} fontFamily="monospace" pointerEvents="none">
            {gate?.label || "?"}
          </text>
          <text x={m} y={h - 5} textAnchor="middle" fill="rgba(45,45,45,0.15)" fontSize={5} fontWeight={600} fontFamily="monospace" pointerEvents="none">
            {gate?.category || ""}
          </text>
        </g>
      );
    }
  }
}

function NodePorts({ node, onPortDown }: { node: CircuitNode; onPortDown: (nid: string, pid: string, side: "left" | "right", e: React.MouseEvent) => void }) {
  const def = GATE_DEFS[node.type];
  if (!def) return null;
  return (
    <g>
      {def.inputs.map((p, i) => {
        const py = (def.h / (def.inputs.length + 1)) * (i + 1);
        const val = !!node.inputs[p.id];
        return (
          <g key={p.id}>
            <circle cx={0} cy={py} r={5} fill={val ? "#FF9F4C" : "rgba(255,159,76,0.15)"}
              stroke={val ? "#FF9F4C" : "rgba(255,159,76,0.4)"} strokeWidth={1.5}
              onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, p.id, "left", e); }}
              className="cursor-crosshair hover:stroke-yellow-400 transition-colors" />
            <text x={9} y={py + 1} dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={600} fontFamily="monospace" pointerEvents="none">{p.label}</text>
          </g>
        );
      })}
      {def.outputs.map((p, i) => {
        const py = (def.h / (def.outputs.length + 1)) * (i + 1);
        const px = def.w;
        const val = !!node.outputs[p.id];
        return (
          <g key={p.id}>
            <circle cx={px} cy={py} r={5} fill={val ? "#FF9F4C" : "rgba(255,159,76,0.15)"}
              stroke={val ? "#FF9F4C" : "rgba(255,159,76,0.4)"} strokeWidth={1.5}
              onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, p.id, "right", e); }}
              className="cursor-crosshair hover:stroke-yellow-400 transition-colors" />
            <text x={px - 9} y={py + 1} textAnchor="end" dominantBaseline="central" fill="#2D2D2D" fontSize={8} fontWeight={600} fontFamily="monospace" pointerEvents="none">{p.label}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function Logic() {
  const [, navigate] = useLocation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [circuit, setCircuit] = useState<Circuit>({ nodes: [], wires: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<GateType | null>(null);
  const [wireFrom, setWireFrom] = useState<{ nodeId: string; portId: string; side: "left" | "right" } | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ nodeId: string; ox: number; oy: number } | null>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [panning, setPanning] = useState<boolean>(false);
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number }>({ sx: 0, sy: 0, px: 0, py: 0 });
  const [settings, setSettings] = useState<Settings>({ showGrid: true, theme: "dark" });
  const [showTruthTable, setShowTruthTable] = useState(true);
  const [showKMap, setShowKMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerilog, setShowVerilog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSensorConnect, setShowSensorConnect] = useState(false);
  const [sensorConnectNode, setSensorConnectNode] = useState<string | null>(null);
  const [realSensorTick, setRealSensorTick] = useState(0);
  const [templateCategory, setTemplateCategory] = useState<string>("All");
  const [verilogCode, setVerilogCode] = useState("");
  const [vhdlCode, setVhdlCode] = useState("");
  const [verilogLang, setVerilogLang] = useState<"verilog" | "vhdl">("verilog");
  const [showBooleanExpr, setShowBooleanExpr] = useState(false);
  const [saved, setSaved] = useState(true);
  const [componentSearch, setComponentSearch] = useState("");
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [history, setHistory] = useState<Circuit[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistory = useRef<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const theme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  const simulated = useMemo(() => simulate(circuit), [circuit]);
  const tt = useMemo(() => generateTruthTable(circuit), [circuit]);

  // Auto-generate Verilog when circuit changes
  useEffect(() => {
    if (circuit.nodes.length > 0) {
      setVerilogCode(generateVerilog(circuit));
      setVhdlCode(generateVHDL(circuit));
    }
  }, [circuit]);

  // Undo/redo history tracking
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; return; }
    setHistory((h) => {
      const trimmed = h.slice(0, historyIndex + 1);
      const next = [...trimmed, JSON.parse(JSON.stringify(circuit))];
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex((i) => Math.min(i + 1, 49));
  }, [circuit]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const prev = history[prevIdx];
    if (prev) { skipHistory.current = true; setCircuit(JSON.parse(JSON.stringify(prev))); setHistoryIndex(prevIdx); }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const next = history[nextIdx];
    if (next) { skipHistory.current = true; setCircuit(JSON.parse(JSON.stringify(next))); setHistoryIndex(nextIdx); }
  }, [history, historyIndex]);

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setCircuit(template.build());
      setSelected(null);
      setWireFrom(null);
      setPlacing(null);
      setShowTemplates(false);
      setSaved(false);
    }
  }, []);

  const inputNodes = simulated.nodes.filter((n) => ["toggle", "const-0", "const-1", "button", "dip-switch", "keypad", "analog-in", "push-button"].includes(n.type));
  const outputNodes = simulated.nodes.filter((n) => ["bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph"].includes(n.type));

  const svgCoord = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
  }, [pan, zoom]);

  const placeNode = useCallback((type: GateType, x: number, y: number) => {
    const def = GATE_DEFS[type];
    if (!def) return;
    const id = uid();
    const inputs: Record<string, boolean> = {};
    const outputs: Record<string, boolean> = {};
    def.inputs.forEach((p) => { inputs[p.id] = false; });
    def.outputs.forEach((p) => { outputs[p.id] = false; });
    if (type === "const-1") outputs.out = true;
    if (type === "toggle") outputs.out = false;
    setCircuit((c) => ({ ...c, nodes: [...c.nodes, { id, type, x, y, inputs, outputs }] }));
    setSelected(id);
    setSaved(false);
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setCircuit((c) => ({ ...c, nodes: c.nodes.map((n) => n.id === id ? { ...n, x, y } : n) }));
  }, []);

  const toggleInput = useCallback((id: string) => {
    setCircuit((c) => ({
      ...c,
      nodes: c.nodes.map((n) => n.id === id ? { ...n, outputs: { ...n.outputs, out: !n.outputs.out } } : n),
    }));
    setSaved(false);
  }, []);

  const handlePortDown = useCallback((nid: string, pid: string, side: "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    if (wireFrom) {
      if (wireFrom.side !== side && wireFrom.nodeId !== nid) {
        const fromNode = wireFrom.side === "right" ? wireFrom.nodeId : nid;
        const fromPort = wireFrom.side === "right" ? wireFrom.portId : pid;
        const toNode = wireFrom.side === "right" ? nid : wireFrom.nodeId;
        const toPort = wireFrom.side === "right" ? pid : wireFrom.portId;
        const exists = circuit.wires.some((w) => w.toNode === toNode && w.toPort === toPort);
        if (!exists) {
          setCircuit((c) => ({ ...c, wires: [...c.wires, { id: uid(), fromNode, fromPort, toNode, toPort }] }));
          setSaved(false);
        }
      }
      setWireFrom(null);
    } else {
      setWireFrom({ nodeId: nid, portId: pid, side });
    }
  }, [wireFrom, circuit.wires]);

  const deleteNode = useCallback((id: string) => {
    setCircuit((c) => ({
      nodes: c.nodes.filter((n) => n.id !== id),
      wires: c.wires.filter((w) => w.fromNode !== id && w.toNode !== id),
    }));
    setSelected(null);
    setSaved(false);
  }, []);

  const duplicateNode = useCallback(() => {
    if (!selected) return;
    const node = circuit.nodes.find((n) => n.id === selected);
    if (!node) return;
    const newId = uid();
    setCircuit((c) => ({
      ...c,
      nodes: [...c.nodes, { ...node, id: newId, x: node.x + 30, y: node.y + 30 }],
    }));
    setSelected(newId);
  }, [selected, circuit.nodes]);

  const clearAll = useCallback(() => {
    setCircuit({ nodes: [], wires: [] });
    setSelected(null);
    setPlacing(null);
    setWireFrom(null);
    setSaved(false);
  }, []);

  const autoArrange = useCallback(() => {
    setCircuit((c) => {
      const inputs = c.nodes.filter((n) => ["toggle", "const-0", "const-1", "button", "clock", "dip-switch", "keypad", "analog-in", "random", "push-button"].includes(n.type));
      const gates = c.nodes.filter((n) => !["toggle", "const-0", "const-1", "button", "clock", "dip-switch", "keypad", "analog-in", "random", "push-button", "bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph"].includes(n.type));
      const outputs = c.nodes.filter((n) => ["bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph"].includes(n.type));
      const updated = [...c.nodes];
      let x = 60;
      inputs.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 40 + i * 70 };
      });
      x += 160;
      gates.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 30 + i * 80 };
      });
      x += 180;
      outputs.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 40 + i * 70 };
      });
      return { ...c, nodes: updated };
    });
  }, []);

  const exportCircuit = useCallback(() => {
    const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "circuit.json";
    a.click();
  }, [circuit]);

  const importCircuit = useCallback(() => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.wires) { setCircuit(data); setSelected(null); }
        } catch { /* */ }
      };
      reader.readAsText(f);
    };
    inp.click();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") deleteNode(selected);
      }
      if (e.key === "Escape") { setPlacing(null); setWireFrom(null); setSelected(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") { e.preventDefault(); autoArrange(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); exportCircuit(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateNode(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) { setShowShortcuts((s) => !s); }
      if (selected && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 10;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          moveNode(selected, circuit.nodes.find((n) => n.id === selected)!.x + dx, circuit.nodes.find((n) => n.id === selected)!.y + dy);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, deleteNode, autoArrange, undo, redo, exportCircuit, duplicateNode, moveNode, circuit.nodes]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "#FFF8F0" }}>
      <style>{`
        .logic-palette { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; scroll-behavior: smooth; }
        .logic-palette::-webkit-scrollbar { width: 5px; }
        .logic-palette::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .logic-palette::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; border: 1px solid transparent; background-clip: padding-box; }
        .logic-palette::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
        .logic-palette::-webkit-scrollbar-corner { background: transparent; }
        .logic-panel { scrollbar-width: auto; scrollbar-color: rgba(0,0,0,0.1) rgba(0,0,0,0.03); }
        .logic-panel::-webkit-scrollbar { width: 5px; }
        .logic-panel::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .logic-panel::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
        .logic-panel::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
        .logic-palette-item { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .logic-palette-item:hover { transform: translateX(2px); background: rgba(0,0,0,0.04); }
        .logic-palette-item:active { transform: scale(0.97); }
        .logic-cat-header { transition: all 0.2s ease; }
        .logic-cat-header:hover { background: rgba(0,0,0,0.03); }
        .logic-toolbar-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(0,0,0,0.08); }
        .logic-toolbar-btn:hover { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.12); }
        .logic-toolbar-btn:active { transform: scale(0.95); }
        .logic-scroll-area { overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
      `}</style>

      {/* Toolbar */}
      <div className="h-auto min-h-12 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 flex-wrap shrink-0 border-b relative" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(255,159,76,0.15), transparent)" }} />
        {/* Close button */}
        <button onClick={() => navigate("/")}
          className="logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0"
          style={{ color: "#fff", background: "linear-gradient(135deg, #e74c3c, #c0392b)", border: "1px solid rgba(231,76,60,0.3)", boxShadow: "0 2px 8px rgba(231,76,60,0.2)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          Close
        </button>

        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* File actions */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
          {[
            { label: "New", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", action: clearAll },
            { label: "Save", icon: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", action: exportCircuit },
            { label: "Load", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3", action: importCircuit },
          ].map((b) => (
            <button key={b.label} onClick={b.action}
              className="logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
              style={{ color: "#6B6B6B" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
              {b.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* Templates */}
        <button onClick={() => setShowTemplates(!showTemplates)}
          className={cn("logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium", showTemplates && "text-white")}
          style={showTemplates ? {
            background: "linear-gradient(135deg, rgba(255,159,76,0.2), rgba(255,159,76,0.06))",
            color: "#FF9F4C",
            boxShadow: "0 0 16px rgba(255,159,76,0.1), inset 0 1px 0 rgba(255,159,76,0.15)",
            border: "1px solid rgba(255,159,76,0.25)",
          } : { color: "#6B6B6B" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Templates
        </button>

        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* Panel toggles */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
          {[
            { label: "Truth Table", show: showTruthTable, set: setShowTruthTable, icon: "M3 3h18v18H3zM3 9h18M9 21V9" },
            { label: "K-Map", show: showKMap, set: setShowKMap, icon: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" },
            { label: "Verilog", show: showVerilog, set: setShowVerilog, icon: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
          ].map((p) => (
            <button key={p.label} onClick={() => p.set(!p.show)}
              className="logic-toolbar-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
              style={{
                background: p.show ? "linear-gradient(135deg, rgba(255,179,102,0.18), rgba(255,179,102,0.04))" : "transparent",
                color: p.show ? "#FFB366" : "#6B6B6B",
                boxShadow: p.show ? "0 0 10px rgba(255,179,102,0.08)" : undefined,
                borderColor: p.show ? "rgba(255,179,102,0.2)" : undefined,
              }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
              {p.label}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
          <button onClick={undo} disabled={historyIndex <= 0}
            className="logic-toolbar-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-30"
            style={{ color: "#6B6B6B" }} title="Undo (Ctrl+Z)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}
            className="logic-toolbar-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-30"
            style={{ color: "#6B6B6B" }} title="Redo (Ctrl+Shift+Z)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Redo
          </button>
        </div>

        <div className="w-px h-6 mx-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* Export as Image */}
        <button onClick={() => {
          const svg = svgRef.current;
          if (!svg) return;
          const clone = svg.cloneNode(true) as SVGSVGElement;
          const w = svg.clientWidth || 800;
          const h = svg.clientHeight || 600;
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(clone);
          const canvas = document.createElement("canvas");
          canvas.width = w * 2; canvas.height = h * 2;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const img = new Image();
          const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            ctx.scale(2, 2);
            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            canvas.toBlob((b) => {
              if (!b) return;
              const a = document.createElement("a");
              a.href = URL.createObjectURL(b);
              a.download = "circuit.png"; a.click();
            }, "image/png");
          };
          img.src = url;
        }}
          className="logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
          style={{ color: "#6B6B6B" }} title="Export as PNG">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PNG
        </button>

        {/* Keyboard Shortcuts toggle */}
        <button onClick={() => setShowShortcuts(!showShortcuts)}
          className={cn("logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium", showShortcuts && "text-white")}
          style={showShortcuts ? {
            background: "linear-gradient(135deg, rgba(255,159,76,0.2), rgba(255,159,76,0.06))",
            color: "#FF9F4C", boxShadow: "0 0 16px rgba(255,159,76,0.1), inset 0 1px 0 rgba(255,159,76,0.15)",
            border: "1px solid rgba(255,159,76,0.25)",
          } : { color: "#6B6B6B" }} title="Keyboard Shortcuts (?)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
          Shortcuts
        </button>

        <div className="flex-1" />

        {/* Settings */}
        <button onClick={() => setShowSettings(true)}
          className="logic-toolbar-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
          style={{ color: "#6B6B6B" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Settings
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Palette */}
        <div className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col border-r relative" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "1px 0 0 rgba(0,0,0,0.06)", height: "calc(100dvh - 48px)" }}>
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-0" style={{ background: "linear-gradient(to bottom, rgba(255,159,76,0.06), transparent)" }} />
          {/* Sticky header: search + title */}
          <div className="px-4 pt-3.5 pb-3 border-b shrink-0 relative z-10" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full" style={{ background: "#FF9F4C" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#FF9F4C" }}>Components</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,159,76,0.12)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.2)" }}>
                {Object.keys(GATE_DEFS).length}
              </span>
            </div>
            <div className="relative group">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors group-focus-within:opacity-100 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "#6B6B6B" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search components..."
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-[11px] outline-none border transition-all duration-200 focus:ring-1"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(0,0,0,0.1)",
                  color: "#2D2D2D",
                  ["--tw-ring-color" as string]: "rgba(255,159,76,0.3)",
                }}
              />
              {componentSearch && (
                <button onClick={() => setComponentSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>
          {/* Scrollable component list */}
          <div className="flex-1 min-h-0 py-1.5 px-0.5 logic-palette logic-scroll-area">
            {CATEGORIES.map((cat) => {
              const gates = Object.values(GATE_DEFS).filter((g) => g.category === cat);
              const filtered = componentSearch
                ? gates.filter((g) => g.label.toLowerCase().includes(componentSearch.toLowerCase()) || g.type.toLowerCase().includes(componentSearch.toLowerCase()))
                : gates;
              if (filtered.length === 0 && componentSearch) return null;
              return (
                <PaletteCategory key={cat} category={cat} gates={filtered} placing={placing} onSelect={(t) => setPlacing(placing === t ? null : t)} theme={theme} defaultOpen={!!componentSearch} />
              );
            })}
          </div>
        </div>

        {/* Mobile palette FAB + Sheet */}
        <div className="md:hidden fixed bottom-6 left-4 z-30 flex flex-col gap-2">
          <Sheet open={showMobilePalette} onOpenChange={setShowMobilePalette}>
            <SheetTrigger asChild>
              <button
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
                style={{
                  background: "linear-gradient(135deg, #FF9F4C, #E8852E)",
                  color: "#FFF",
                  border: "2px solid #2D2D2D",
                  boxShadow: "0 4px 16px rgba(255,159,76,0.3)",
                }}
                aria-label="Open components"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 water-sheet" style={{ background: "#FFF8F0", borderRight: "2px solid #2D2D2D" }}>
              <SheetTitle className="sr-only">Components</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 rounded-full" style={{ background: "#FF9F4C" }} />
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#FF9F4C" }}>Components</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,159,76,0.12)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.2)" }}>
                      {Object.keys(GATE_DEFS).length}
                    </span>
                  </div>
                  <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors group-focus-within:opacity-100 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "#6B6B6B" }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search components..." value={componentSearch} onChange={(e) => setComponentSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-[11px] outline-none border transition-all duration-200 focus:ring-1"
                      style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.1)", color: "#2D2D2D", ["--tw-ring-color" as string]: "rgba(255,159,76,0.3)" }} />
                    {componentSearch && (
                      <button onClick={() => setComponentSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0 py-1.5 px-0.5 logic-palette logic-scroll-area">
                  {CATEGORIES.map((cat) => {
                    const gates = Object.values(GATE_DEFS).filter((g) => g.category === cat);
                    const filtered = componentSearch ? gates.filter((g) => g.label.toLowerCase().includes(componentSearch.toLowerCase()) || g.type.toLowerCase().includes(componentSearch.toLowerCase())) : gates;
                    if (filtered.length === 0 && componentSearch) return null;
                    return (
                      <PaletteCategory key={cat} category={cat} gates={filtered} placing={placing}
                        onSelect={(t) => {
                          setPlacing(placing === t ? null : t);
                          setShowMobilePalette(false);
                        }}
                        theme={theme} defaultOpen={!!componentSearch} />
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Canvas + Panels */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 48px)" }}>
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 relative" style={{ background: "#FFFFFF" }}>
              <svg ref={svgRef} className="w-full h-full"
                style={{ cursor: placing ? "crosshair" : panning ? "grabbing" : "default" }}
                onMouseDown={(e) => {
                  if (e.button === 1 || (e.button === 0 && e.altKey)) {
                    setPanning(true);
                    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
                    return;
                  }
                  if (placing) {
                    const pt = svgCoord(e.clientX, e.clientY);
                    const def = GATE_DEFS[placing];
                    placeNode(placing, pt.x - def.w / 2, pt.y - def.h / 2);
                    return;
                  }
                  setSelected(null);
                  setWireFrom(null);
                }}
                onMouseMove={(e) => {
                  const pt = svgCoord(e.clientX, e.clientY);
                  setMouse(pt);
                  if (panning) {
                    setPan({ x: panRef.current.px + (e.clientX - panRef.current.sx), y: panRef.current.py + (e.clientY - panRef.current.sy) });
                    return;
                  }
                  if (dragging) moveNode(dragging.nodeId, pt.x - dragging.ox, pt.y - dragging.oy);
                }}
                onMouseUp={() => { setPanning(false); setDragging(null); }}
                onMouseLeave={() => { setPanning(false); setDragging(null); }}
                onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.min(Math.max(z * (e.deltaY > 0 ? 0.92 : 1.08), 0.15), 4)); }}
              >
                {settings.showGrid && (
                  <defs>
                    <pattern id="grid-dots" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                      <circle cx={1} cy={1} r={0.8} fill={theme.gridDot} />
                    </pattern>
                  </defs>
                )}
                {settings.showGrid && <rect width="100%" height="100%" fill="url(#grid-dots)" />}

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Wires */}
                  {simulated.wires.map((w) => {
                    const src = simulated.nodes.find((n) => n.id === w.fromNode);
                    const dst = simulated.nodes.find((n) => n.id === w.toNode);
                    if (!src || !dst) return null;
                    const from = portPos(src.x, src.y, src.type, w.fromPort, "right");
                    const to = portPos(dst.x, dst.y, dst.type, w.toPort, "left");
                    const val = !!src.outputs[w.fromPort];
                    const dx = Math.abs(to.x - from.x) * 0.5;
                    return (
                      <g key={w.id}>
                        <path d={`M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`}
                          fill="none" stroke="#2D2D2D" strokeWidth={4} strokeLinecap="round" opacity={val ? 0.15 : 0.08} />
                        <path d={`M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`}
                          fill="none" stroke="#2D2D2D" strokeWidth={2} strokeLinecap="round" opacity={val ? 0.85 : 0.25} />
                      </g>
                    );
                  })}

                  {/* Temp wire */}
                  {wireFrom && (() => {
                    const src = simulated.nodes.find((n) => n.id === wireFrom.nodeId);
                    if (!src) return null;
                    const from = portPos(src.x, src.y, src.type, wireFrom.portId, wireFrom.side);
                    const dx = Math.abs(mouse.x - from.x) * 0.4;
                    const d = wireFrom.side === "right"
                      ? `M${from.x},${from.y} C${from.x + dx},${from.y} ${mouse.x - dx},${mouse.y} ${mouse.x},${mouse.y}`
                      : `M${from.x},${from.y} C${from.x - dx},${from.y} ${mouse.x + dx},${mouse.y} ${mouse.x},${mouse.y}`;
                    return <path d={d} fill="none" stroke={theme.accent} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7} />;
                  })()}

                  {/* Nodes */}
                  {simulated.nodes.map((node) => {
                    const def = GATE_DEFS[node.type];
                    if (!def) return null;
                    const isSel = node.id === selected;
                    const isInput = ["toggle", "const-0", "const-1", "button", "clock", "dip-switch", "keypad", "analog-in", "random", "push-button"].includes(node.type);
                    const isOutput = ["bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph", "tri-led", "traffic-light", "digit-display", "dot-matrix", "ascii-display", "lcd-display", "indicator-panel", "scope-output", "servo-motor", "stepper-motor", "seven-seg-4", "status-led", "voltmeter", "ammeter", "clock-display", "thermometer-out", "tachometer", "power-meter", "data-latch-disp", "signal-analyzer", "dc-motor", "relay", "solenoid", "oled-display", "speaker", "linear-actuator", "robotic-arm", "printer-out", "esc", "motor-driver", "robotic-arm-6dof", "pneumatic-cylinder", "wheel-mecanum", "wheel-omni", "chassis-frame", "industrial-6axis", "scara-arm", "delta-robot", "vfd-drive", "servo-drive", "proximity-switch"].includes(node.type);
                    const isOn = isOutput && (node.inputs.in || node.inputs.r || node.inputs.g || node.inputs.b || node.inputs.y || node.inputs.a || node.inputs.c || node.inputs.d || node.inputs.e || node.inputs.f || node.inputs.i0 || node.inputs.p0 || node.inputs.v || node.inputs.i || node.inputs.trig || node.inputs.in1 || node.inputs.coil);
                    const hexVal = node.type === "hex-display"
                      ? ((node.inputs.d ? 8 : 0) + (node.inputs.c ? 4 : 0) + (node.inputs.b ? 2 : 0) + (node.inputs.a ? 1 : 0))
                      : 0;

                    return (
                      <g key={node.id} transform={`translate(${node.x},${node.y})`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (node.type === "toggle") { toggleInput(node.id); return; }
                          if (node.type === "const-0" || node.type === "const-1") return;
                          if (node.type === "push-button") {
                            setCircuit((c) => ({
                              ...c,
                              nodes: c.nodes.map((n) => n.id === node.id ? { ...n, outputs: { ...n.outputs, out: true } } : n),
                            }));
                            const upHandler = () => {
                              setCircuit((c) => ({
                                ...c,
                                nodes: c.nodes.map((n) => n.id === node.id ? { ...n, outputs: { ...n.outputs, out: false } } : n),
                              }));
                              window.removeEventListener("mouseup", upHandler);
                            };
                            window.addEventListener("mouseup", upHandler);
                            setSaved(false);
                            return;
                          }
                          if (node.type === "dip-switch") {
                            const pt = svgCoord(e.clientX, e.clientY);
                            const lx = pt.x - node.x;
                            const ly = pt.y - node.y;
                            const idx = Math.floor(lx / 18) + Math.floor((ly - 14) / 32) * 4;
                            if (idx >= 0 && idx <= 7) {
                              const key = `o${idx}`;
                              setCircuit((c) => ({
                                ...c,
                                nodes: c.nodes.map((n) => n.id === node.id ? { ...n, outputs: { ...n.outputs, [key]: !n.outputs[key] } } : n),
                              }));
                              setSaved(false);
                            }
                            return;
                          }
                          if (node.type === "keypad") {
                            const pt = svgCoord(e.clientX, e.clientY);
                            const lx = pt.x - node.x;
                            const ly = pt.y - node.y;
                            const col = Math.floor((lx - 10) / 20);
                            const row = Math.floor((ly - 14) / 18);
                            if (col >= 0 && col < 3 && row >= 0 && row < 4) {
                              const keys = [1,2,3,4,5,6,7,8,9,0];
                              const keyIdx = row * 3 + col;
                              if (keyIdx < keys.length) {
                                const val = keys[keyIdx];
                                setCircuit((c) => ({
                                  ...c,
                                  nodes: c.nodes.map((n) => n.id === node.id ? {
                                    ...n,
                                    outputs: {
                                      d0: !!(val & 1), d1: !!(val & 2), d2: !!(val & 4), d3: !!(val & 8), valid: true,
                                    },
                                  } : n),
                                }));
                                setSaved(false);
                              }
                            }
                            return;
                          }
                          if (node.type === "analog-in") {
                            const pt = svgCoord(e.clientX, e.clientY);
                            const ly = pt.y - node.y;
                            const val = Math.max(0, Math.min(15, Math.round(((ly - 14) / 42) * 15)));
                            setCircuit((c) => ({
                              ...c,
                              nodes: c.nodes.map((n) => n.id === node.id ? {
                                ...n,
                                outputs: {
                                  d0: !!(val & 1), d1: !!(val & 2), d2: !!(val & 4), d3: !!(val & 8),
                                },
                              } : n),
                            }));
                            setSaved(false);
                            return;
                          }
                          const pt = svgCoord(e.clientX, e.clientY);
                          setDragging({ nodeId: node.id, ox: pt.x - node.x, oy: pt.y - node.y });
                          setSelected(node.id);
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        {isSel && (
                          <>
                            <rect x={-4} y={-4} width={def.w + 8} height={def.h + 8} rx={7}
                              fill="none" stroke={theme.accent} strokeWidth={1} opacity={0.2} />
                            <rect x={-3} y={-3} width={def.w + 6} height={def.h + 6} rx={6}
                              fill="none" stroke={theme.accent} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
                          </>
                        )}

                        {/* Real output rendering */}
                        {node.type === "bulb" && (() => {
                          const cx = def.w / 2, cy = def.h / 2 - 6;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={6} fill={isOn ? "rgba(255,159,76,0.04)" : "rgba(45,45,45,0.02)"} stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              {isOn ? (
                                <>
                                  <circle cx={cx} cy={cy} r={14} fill="#FF9F4C" opacity={0.12} />
                                  <circle cx={cx} cy={cy} r={11} fill="#FF9F4C" stroke="#2D2D2D" strokeWidth={1.2} opacity={0.3} />
                                  <circle cx={cx} cy={cy} r={7} fill="#FF9F4C" opacity={0.85} />
                                  <circle cx={cx} cy={cy} r={3} fill="#FFF8F0" opacity={0.6} />
                                </>
                              ) : (
                                <>
                                  <circle cx={cx} cy={cy} r={11} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={1.2} />
                                  <circle cx={cx} cy={cy} r={5} fill="rgba(45,45,45,0.04)" opacity={0.5} />
                                </>
                              )}
                              <line x1={cx - 2} y1={cy + 12} x2={cx - 2} y2={cy + 18} stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} strokeWidth={1} strokeLinecap="round" />
                              <line x1={cx + 2} y1={cy + 12} x2={cx + 2} y2={cy + 18} stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} strokeWidth={1} strokeLinecap="round" />
                              <line x1={cx - 4} y1={cy + 18} x2={cx + 4} y2={cy + 18} stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} strokeWidth={1.5} strokeLinecap="round" />
                            </g>
                          );
                        })()}

                        {node.type === "led" && (() => {
                          const cx = def.w / 2, cy = def.h / 2;
                          const r = Math.min(def.w, def.h) / 2 - 4;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.12)" strokeWidth={1} />
                              <circle cx={cx} cy={cy + 2} r={r + 1} fill={isOn ? "rgba(255,159,76,0.15)" : "rgba(45,45,45,0.05)"} />
                              <circle cx={cx} cy={cy} r={r} fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.08)"} stroke="#2D2D2D" strokeWidth={1.2} />
                              <ellipse cx={cx - r * 0.25} cy={cy - r * 0.25} rx={r * 0.35} ry={r * 0.2} fill="rgba(255,255,255,0.35)" transform={`rotate(-30 ${cx} ${cy})`} />
                              {isOn && <circle cx={cx} cy={cy} r={r + 5} fill="#FF9F4C" opacity={0.08} />}
                            </g>
                          );
                        })()}

                        {node.type === "hex-display" && (() => {
                          const cx = def.w / 2, cy = def.h / 2 - 3;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={5} fill="rgba(45,45,45,0.04)" stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.18)"} strokeWidth={1.5} />
                              <rect x={2} y={2} width={def.w - 4} height={def.h - 10} rx={3} fill="rgba(0,0,0,0.35)" stroke="rgba(45,45,45,0.08)" strokeWidth={0.5} />
                              {[0.25, 0.5, 0.75].map(f => (
                                <line key={f} x1={5} y1={4 + (def.h - 12) * f} x2={def.w - 5} y2={4 + (def.h - 12) * f} stroke="rgba(45,45,45,0.06)" strokeWidth={0.3} />
                              ))}
                              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.1)"} fontSize={24} fontWeight={900} fontFamily="monospace" pointerEvents="none">
                                {hexVal.toString(16).toUpperCase()}
                              </text>
                              <circle cx={6} cy={def.h - 4} r={1.5} fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} />
                              <circle cx={12} cy={def.h - 4} r={1.5} fill="rgba(45,45,45,0.15)" />
                              <text x={def.w - 6} y={def.h - 3} textAnchor="end" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">HEX</text>
                            </g>
                          );
                        })()}

                        {node.type === "7-segment" && (() => {
                          const segs = { a: !!node.inputs.a, b: !!node.inputs.b, c: !!node.inputs.c, d: !!node.inputs.d, e: !!node.inputs.e, f: !!node.inputs.f, g: !!node.inputs.g };
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          const sw = 3, sh = 16, gap = 2;
                          const segStyle = (on: boolean) => ({ stroke: on ? "#FF9F4C" : "rgba(45,45,45,0.1)", strokeWidth: sw, strokeLinecap: "round" } as React.SVGProps<SVGLineElement>);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <line x1={cx - sh/2 + gap} y1={cy - sh - gap} x2={cx + sh/2 - gap} y2={cy - sh - gap} {...segStyle(segs.a)} />
                              <line x1={cx + sh/2} y1={cy - sh + gap} x2={cx + sh/2} y2={cy - gap} {...segStyle(segs.b)} />
                              <line x1={cx + sh/2} y1={cy + gap} x2={cx + sh/2} y2={cy + sh - gap} {...segStyle(segs.c)} />
                              <line x1={cx - sh/2 + gap} y1={cy + sh + gap} x2={cx + sh/2 - gap} y2={cy + sh + gap} {...segStyle(segs.d)} />
                              <line x1={cx - sh/2} y1={cy + gap} x2={cx - sh/2} y2={cy + sh - gap} {...segStyle(segs.e)} />
                              <line x1={cx - sh/2} y1={cy - sh + gap} x2={cx - sh/2} y2={cy - gap} {...segStyle(segs.f)} />
                              <line x1={cx - sh/2 + gap} y1={cy} x2={cx + sh/2 - gap} y2={cy} {...segStyle(segs.g)} />
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">7-SEG</text>
                            </g>
                          );
                        })()}

                        {node.type === "buzzer" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill={isOn ? "rgba(255,159,76,0.1)" : "rgba(45,45,45,0.04)"} stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={1.5} />
                            <path d={`M 18 ${def.h / 2} L 26 ${def.h / 2 - 10} L 26 ${def.h / 2 + 10} Z`} fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.18)"} />
                            <circle cx={34} cy={def.h / 2} r={7} fill="none" stroke={isOn ? "#FF9F4C" : "rgba(45,45,45,0.18)"} strokeWidth={1.2} />
                            {isOn && <path d={`M 42 ${def.h / 2 - 4} Q 47 ${def.h / 2} 42 ${def.h / 2 + 4}`} fill="none" stroke="#FF9F4C" strokeWidth={1} />}
                            <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={6} fontWeight={600} pointerEvents="none">{isOn ? "ON" : "OFF"}</text>
                          </g>
                        )}

                        {node.type === "bar-graph" && (() => {
                          const vals = [0,1,2,3,4,5,6,7].map((idx) => !!node.inputs[`i${idx}`]);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <text x={def.w / 2} y={8} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="system-ui" pointerEvents="none">BAR</text>
                              {[0,1,2,3,4,5,6,7].map((idx) => {
                                const bx = 6 + idx * 9;
                                const on = vals[idx];
                                return (
                                  <g key={idx}>
                                    <rect x={bx} y={14} width={7} height={44} rx={1.5} fill={on ? "#FF9F4C" : "rgba(0,0,0,0.3)"} stroke={on ? "#2D2D2D" : "rgba(45,45,45,0.1)"} strokeWidth={0.5} opacity={on ? 0.85 : 1} />
                                    {on && <rect x={bx + 1} y={15} width={5} height={42} rx={1} fill="#FF9F4C" opacity={0.3} />}
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}

                        {node.type === "tri-led" && (() => {
                          const rOn = !!node.inputs.r, gOn = !!node.inputs.g, bOn = !!node.inputs.b;
                          const cx = def.w / 2, cy = def.h / 2;
                          const mixColor = `rgb(${rOn ? 220 : 30},${gOn ? 220 : 30},${bOn ? 220 : 30})`;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <circle cx={cx} cy={cy - 2} r={def.h / 2 - 6} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <circle cx={cx - 8} cy={cy - 8} r={6} fill={rOn ? "#ff4444" : "rgba(255,68,68,0.2)"} stroke={rOn ? "#ff8888" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              <circle cx={cx + 8} cy={cy - 8} r={6} fill={gOn ? "#44ff44" : "rgba(68,255,68,0.2)"} stroke={gOn ? "#88ff88" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              <circle cx={cx} cy={cy + 6} r={6} fill={bOn ? "#4488ff" : "rgba(68,136,255,0.2)"} stroke={bOn ? "#88bbff" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">RGB</text>
                            </g>
                          );
                        })()}

                        {node.type === "traffic-light" && (() => {
                          const rOn = !!node.inputs.r, yOn = !!node.inputs.y, gOn = !!node.inputs.g;
                          const cx = def.w / 2;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={cx - 10} y={4} width={20} height={def.h - 8} rx={4} fill="rgba(0,0,0,0.4)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <circle cx={cx} cy={16} r={6} fill={rOn ? "#ff2222" : "rgba(255,34,34,0.15)"} stroke={rOn ? "#ff8888" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              {rOn && <circle cx={cx} cy={16} r={10} fill="#ff2222" opacity={0.2} />}
                              <circle cx={cx} cy={def.h / 2} r={6} fill={yOn ? "#ffaa00" : "rgba(255,170,0,0.15)"} stroke={yOn ? "#ffcc44" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              {yOn && <circle cx={cx} cy={def.h / 2} r={10} fill="#ffaa00" opacity={0.2} />}
                              <circle cx={cx} cy={def.h - 16} r={6} fill={gOn ? "#22ff22" : "rgba(34,255,34,0.15)"} stroke={gOn ? "#88ff88" : "rgba(45,45,45,0.06)"} strokeWidth={1} />
                              {gOn && <circle cx={cx} cy={def.h - 16} r={10} fill="#22ff22" opacity={0.2} />}
                            </g>
                          );
                        })()}

                        {node.type === "digit-display" && (() => {
                          const val = (node.inputs.d3 ? 8 : 0) + (node.inputs.d2 ? 4 : 0) + (node.inputs.d1 ? 2 : 0) + (node.inputs.d0 ? 1 : 0);
                          const anyOn = Object.values(node.inputs).some(Boolean);
                          const segMap: Record<number, boolean[]> = {
                            0: [true,true,true,true,true,true,false], 1: [false,true,true,false,false,false,false], 2: [true,true,false,true,true,false,true], 3: [true,true,true,true,false,false,true],
                            4: [false,true,true,false,false,true,true], 5: [true,false,true,true,false,true,true], 6: [true,false,true,true,true,true,true], 7: [true,true,true,false,false,false,false],
                            8: [true,true,true,true,true,true,true], 9: [true,true,true,true,false,true,true],
                          };
                          const segs = segMap[val] || segMap[0];
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          const sh = 14, sw = 2.5, gap = 2;
                          const seg = (on: boolean) => ({ stroke: on ? "#FF9F4C" : "rgba(45,45,45,0.08)", strokeWidth: sw, strokeLinecap: "round" } as React.SVGProps<SVGLineElement>);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={5} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.18)" strokeWidth={1.5} />
                              <rect x={3} y={3} width={def.w - 6} height={def.h - 10} rx={3} fill="rgba(0,0,0,0.25)" />
                              <line x1={cx - sh/2 + gap} y1={cy - sh - gap} x2={cx + sh/2 - gap} y2={cy - sh - gap} {...seg(segs[0])} />
                              <line x1={cx + sh/2} y1={cy - sh + gap} x2={cx + sh/2} y2={cy - gap} {...seg(segs[1])} />
                              <line x1={cx + sh/2} y1={cy + gap} x2={cx + sh/2} y2={cy + sh - gap} {...seg(segs[2])} />
                              <line x1={cx - sh/2 + gap} y1={cy + sh + gap} x2={cx + sh/2 - gap} y2={cy + sh + gap} {...seg(segs[3])} />
                              <line x1={cx - sh/2} y1={cy + gap} x2={cx - sh/2} y2={cy + sh - gap} {...seg(segs[4])} />
                              <line x1={cx - sh/2} y1={cy - sh + gap} x2={cx - sh/2} y2={cy - gap} {...seg(segs[5])} />
                              <line x1={cx - sh/2 + gap} y1={cy} x2={cx + sh/2 - gap} y2={cy} {...seg(segs[6])} />
                              <circle cx={def.w - 8} cy={def.h - 4} r={2} fill="rgba(45,45,45,0.15)" />
                              <text x={6} y={def.h - 3} fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BCD</text>
                            </g>
                          );
                        })()}

                        {node.type === "dot-matrix" && (() => {
                          const bits: boolean[][] = [];
                          for (let r = 0; r < 5; r++) {
                            bits[r] = [];
                            for (let c = 0; c < 5; c++) {
                              bits[r][c] = !!node.inputs[`p${r * 5 + c}`];
                            }
                          }
                          const anyOn = Object.values(node.inputs).some(Boolean);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              {bits.map((row, r) => row.map((on, c) => (
                                <circle key={`${r}-${c}`} cx={16 + c * 14} cy={16 + r * 14} r={5}
                                  fill={on ? "#FF9F4C" : "rgba(0,0,0,0.2)"}
                                  stroke={on ? "#2D2D2D" : "rgba(45,45,45,0.06)"}
                                  strokeWidth={0.5} opacity={on ? 0.9 : 0.5} />
                              )))}
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">MATRIX</text>
                            </g>
                          );
                        })()}

                        {node.type === "ascii-display" && (() => {
                          const bits = [0,1,2,3,4,5,6].map(i => !!node.inputs[`b${i}`]);
                          const charCode = bits.reduce((acc, b, i) => acc + (b ? (1 << i) : 0), 0);
                          const ch = charCode >= 32 && charCode < 127 ? String.fromCharCode(charCode) : "?";
                          const anyOn = Object.values(node.inputs).some(Boolean);
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={5} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.18)" strokeWidth={1.5} />
                              <rect x={cx - 14} y={6} width={28} height={22} rx={3} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                              <rect x={cx - 12} y={8} width={24} height={18} rx={2} fill={anyOn ? "rgba(255,159,76,0.06)" : "rgba(0,0,0,0.15)"} />
                              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={anyOn ? "#FF9F4C" : "rgba(45,45,45,0.12)"} fontSize={18} fontWeight={900} fontFamily="monospace" pointerEvents="none">{ch}</text>
                              <rect x={cx - 18} y={30} width={36} height={3} rx={1.5} fill="rgba(45,45,45,0.06)" />
                              <rect x={cx - 12} y={34} width={24} height={2} rx={1} fill="rgba(45,45,45,0.04)" />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ASCII #{charCode}</text>
                            </g>
                          );
                        })()}

                        {node.type === "lcd-display" && (() => {
                          const bits = [0,1,2,3,4,5,6,7].map(i => !!node.inputs[`d${i}`]);
                          const charCode = bits.reduce((acc, b, i) => acc + (b ? (1 << i) : 0), 0);
                          const ch = charCode >= 32 && charCode < 127 ? String.fromCharCode(charCode) : " ";
                          const anyOn = Object.values(node.inputs).some(Boolean);
                          const px = 3, py = 3, pw = 3, ph = 3, cols = 7, rows = 5;
                          const ox = def.w / 2 - (cols * (pw + 1)) / 2;
                          const oy = 6;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={3} fill={anyOn ? "rgba(220,220,180,0.15)" : "rgba(45,45,45,0.04)"} stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={2} y={2} width={def.w - 4} height={def.h - 10} rx={2} fill="rgba(0,0,0,0.08)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.5} />
                              {Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((_, c) => {
                                const isOn = anyOn && ((r + c) % 2 === 0 || (r * 3 + c * 7) % 5 < 2);
                                return (
                                <rect key={`${r}-${c}`} x={ox + c * (pw + 1)} y={oy + r * (ph + 1)} width={pw} height={ph} rx={0.5}
                                  fill={isOn ? "rgba(255,159,76,0.6)" : "rgba(45,45,45,0.06)"} />
                              );}))}
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">LCD</text>
                            </g>
                          );
                        })()}

                        {node.type === "indicator-panel" && (() => {
                          const vals = [0,1,2,3,4,5,6,7].map(idx => !!node.inputs[`i${idx}`]);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <text x={def.w / 2} y={8} textAnchor="middle" fill="rgba(45,45,45,0.5)" fontSize={6} fontWeight={700} fontFamily="system-ui" pointerEvents="none">INDICATORS</text>
                              {vals.map((on, idx) => {
                                const ix = 8 + (idx % 4) * 20;
                                const iy = 16 + Math.floor(idx / 4) * 24;
                                return (
                                  <g key={idx}>
                                    <circle cx={ix} cy={iy} r={6} fill={on ? "#FF9F4C" : "rgba(0,0,0,0.3)"} stroke={on ? "#2D2D2D" : "rgba(45,45,45,0.1)"} strokeWidth={0.8} opacity={on ? 0.9 : 0.6} />
                                    {on && <circle cx={ix} cy={iy} r={9} fill="#FF9F4C" opacity={0.15} />}
                                    <text x={ix} y={iy + 14} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontFamily="monospace" pointerEvents="none">{idx}</text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}

                        {node.type === "scope-output" && (() => {
                          const anyOn = !!node.inputs.in;
                          const trigOn = !!node.inputs.trig;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              {[0.25, 0.5, 0.75].map(f => <line key={f} x1={4} y1={def.h * f} x2={def.w - 4} y2={def.h * f} stroke="rgba(45,45,45,0.05)" strokeWidth={0.5} />)}
                              {[0.25, 0.5, 0.75].map(f => <line key={f} x1={def.w * f} y1={4} x2={def.w * f} y2={def.h - 4} stroke="rgba(45,45,45,0.05)" strokeWidth={0.5} />)}
                              <polyline
                                points={anyOn
                                  ? `4,${def.h * 0.75} 20,${def.h * 0.75} 20,${def.h * 0.25} 40,${def.h * 0.25} 40,${def.h * 0.75} 60,${def.h * 0.75} 60,${def.h * 0.25} 80,${def.h * 0.25} 80,${def.h * 0.75} 100,${def.h * 0.75} 116,${def.h * 0.75}`
                                  : `4,${def.h / 2} ${def.w - 4},${def.h / 2}`}
                                fill="none" stroke="#2D2D2D" strokeWidth={1.5} opacity={0.8} />
                              {trigOn && <polygon points={`${def.w - 12},${def.h - 10} ${def.w - 6},${def.h - 16} ${def.w - 16},${def.h - 16}`} fill="#44ff44" opacity={0.7} />}
                              <text x={6} y={10} textAnchor="start" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={600} fontFamily="monospace" pointerEvents="none">{anyOn ? "HIGH" : "LOW"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "servo-motor" && (() => {
                          const inOn = !!node.inputs.in;
                          const enOn = !!node.inputs.en;
                          const angle = inOn ? (enOn ? 90 : 45) : 0;
                          const rad = (angle - 90) * Math.PI / 180;
                          const cx = def.w / 2, cy = def.h / 2 - 6;
                          const armLen = 16;
                          const ex = cx + Math.cos(rad) * armLen;
                          const ey = cy + Math.sin(rad) * armLen;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <circle cx={cx} cy={cy} r={14} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <path d={`M ${cx - 14} ${cy} A 14 14 0 0 1 ${cx + 14} ${cy}`} fill="none" stroke="rgba(45,45,45,0.06)" strokeWidth={0.5} strokeDasharray="2 2" />
                              <circle cx={cx} cy={cy} r={3} fill={enOn ? "#FF9F4C" : "rgba(45,45,45,0.3)"} />
                              <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={enOn ? "#FF9F4C" : "rgba(45,45,45,0.5)"} strokeWidth={2} strokeLinecap="round" />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill={enOn ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={6} fontWeight={600} pointerEvents="none">{angle}°</text>
                            </g>
                          );
                        })()}

                        {node.type === "stepper-motor" && (() => {
                          const vals = [0,1,2,3].map(i => !!node.inputs[`abcd`[i]]);
                          const activeCount = vals.filter(Boolean).length;
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          const outerR = 16, innerR = 6, teeth = 12;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <circle cx={cx} cy={cy} r={outerR} fill="rgba(45,45,45,0.05)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.2} />
                              {Array.from({ length: teeth }).map((_, i) => {
                                const a = (i / teeth) * 360 * Math.PI / 180;
                                const x1 = cx + Math.cos(a) * (outerR - 2);
                                const y1 = cy + Math.sin(a) * (outerR - 2);
                                const x2 = cx + Math.cos(a) * (outerR + 2);
                                const y2 = cy + Math.sin(a) * (outerR + 2);
                                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,45,45,0.15)" strokeWidth={1.5} strokeLinecap="round" />;
                              })}
                              <circle cx={cx} cy={cy} r={innerR} fill={activeCount > 0 ? "#FF9F4C" : "rgba(45,45,45,0.08)"} stroke="#2D2D2D" strokeWidth={0.8} opacity={activeCount > 0 ? 0.7 : 0.5} />
                              <circle cx={cx} cy={cy} r={2} fill="#2D2D2D" opacity={0.3} />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{activeCount}/4 STEP</text>
                            </g>
                          );
                        })()}

                        {node.type === "seven-seg-4" && (() => {
                          const segs = { a: !!node.inputs.a, b: !!node.inputs.b, c: !!node.inputs.c, d: !!node.inputs.d, e: !!node.inputs.e, f: !!node.inputs.f, g: !!node.inputs.g };
                          const digs = [0,1,2,3].map(i => !!node.inputs[`d${i}`]);
                          const segStyle = (on: boolean) => ({ stroke: on ? "#FF9F4C" : "rgba(45,45,45,0.08)", strokeWidth: 2, strokeLinecap: "round" } as React.SVGProps<SVGLineElement>);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              {[0,1,2,3].map((di) => {
                                const ox = 8 + di * 22;
                                const oy = 12;
                                const sw = 2, sh = 10, gap = 1;
                                return (
                                  <g key={di} opacity={digs[di] ? 1 : 0.3}>
                                    <line x1={ox + gap} y1={oy} x2={ox + sh - gap} y2={oy} {...segStyle(segs.a)} />
                                    <line x1={ox + sh} y1={oy + gap} x2={ox + sh} y2={oy + sh - gap} {...segStyle(segs.b)} />
                                    <line x1={ox + sh} y1={oy + sh + gap} x2={ox + sh} y2={oy + 2 * sh - gap} {...segStyle(segs.c)} />
                                    <line x1={ox + gap} y1={oy + 2 * sh} x2={ox + sh - gap} y2={oy + 2 * sh} {...segStyle(segs.d)} />
                                    <line x1={ox} y1={oy + sh + gap} x2={ox} y2={oy + 2 * sh - gap} {...segStyle(segs.e)} />
                                    <line x1={ox} y1={oy + gap} x2={ox} y2={oy + sh - gap} {...segStyle(segs.f)} />
                                    <line x1={ox + gap} y1={oy + sh} x2={ox + sh - gap} y2={oy + sh} {...segStyle(segs.g)} />
                                  </g>
                                );
                              })}
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontWeight={600} pointerEvents="none">4-DIGIT</text>
                            </g>
                          );
                        })()}

                        {node.type === "status-led" && (() => {
                          const inOn = !!node.inputs.in;
                          const enOn = !!node.inputs.en;
                          const active = inOn && enOn;
                          const cx = def.w / 2, cy = def.h / 2 - 5;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <rect x={cx - 12} y={cy - 3} width={24} height={6} rx={1} fill={active ? "#FF9F4C" : "rgba(45,45,45,0.08)"} stroke="#2D2D2D" strokeWidth={0.8} />
                              <line x1={cx - 16} y1={cy} x2={cx - 12} y2={cy} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
                              <line x1={cx + 12} y1={cy} x2={cx + 16} y2={cy} stroke="rgba(45,45,45,0.3)" strokeWidth={1.2} />
                              {active && <rect x={cx - 10} y={cy - 2} width={20} height={4} rx={0.5} fill="#FF9F4C" opacity={0.5} />}
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill={active ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={5} fontWeight={600} pointerEvents="none">{active ? "ON" : enOn ? "OFF" : "DIS"}</text>
                            </g>
                          );
                        })()}

                        {["voltmeter", "ammeter"].includes(node.type) && (() => {
                          const anyOn = !!node.inputs.in;
                          const unit = node.type === "voltmeter" ? "V" : "A";
                          const cx = def.w / 2, cy = def.h / 2 + 2;
                          const r = 16;
                          const needleAngle = anyOn ? -30 : 120;
                          const rad = needleAngle * Math.PI / 180;
                          const nx = cx + Math.cos(rad) * (r - 3);
                          const ny = cy + Math.sin(rad) * (r - 3);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <path d={`M ${cx - r + 2} ${cy} A ${r - 2} ${r - 2} 0 1 1 ${cx + r - 2} ${cy}`} fill="none" stroke="rgba(45,45,45,0.12)" strokeWidth={1.5} />
                              {[-120, -80, -40, 0, 40, 80, 120].map((a, i) => {
                                const ar = a * Math.PI / 180;
                                return <line key={i} x1={cx + Math.cos(ar) * (r - 5)} y1={cy + Math.sin(ar) * (r - 5)} x2={cx + Math.cos(ar) * (r - 2)} y2={cy + Math.sin(ar) * (r - 2)} stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />;
                              })}
                              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={anyOn ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={1.5} strokeLinecap="round" />
                              <circle cx={cx} cy={cy} r={2} fill={anyOn ? "#FF9F4C" : "rgba(45,45,45,0.2)"} />
                              <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={700} pointerEvents="none">{unit}</text>
                            </g>
                          );
                        })()}

                        {node.type === "clock-display" && (() => {
                          const bits = (prefix: string) => [0,1].map(i => !!node.inputs[`${prefix}${i}`]);
                          const hOn = bits("h"), mOn = bits("m"), sOn = bits("s");
                          const hVal = (hOn[1] ? 2 : 0) + (hOn[0] ? 1 : 0);
                          const mVal = (mOn[1] ? 2 : 0) + (mOn[0] ? 1 : 0);
                          const sVal = (sOn[1] ? 2 : 0) + (sOn[0] ? 1 : 0);
                          const anyOn = [...hOn, ...mOn, ...sOn].some(Boolean);
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          const r = 18;
                          const hAngle = ((hVal % 12) / 12) * 360 - 90;
                          const mAngle = (mVal / 3) * 360 - 90;
                          const hRad = hAngle * Math.PI / 180;
                          const mRad = mAngle * Math.PI / 180;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.18)" strokeWidth={1.5} />
                              <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.15)" stroke={anyOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} strokeWidth={1.2} />
                              {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => {
                                const ar = (a - 90) * Math.PI / 180;
                                const inner = a % 90 === 0 ? r - 6 : r - 4;
                                return <line key={i} x1={cx + Math.cos(ar) * inner} y1={cy + Math.sin(ar) * inner} x2={cx + Math.cos(ar) * (r - 1)} y2={cy + Math.sin(ar) * (r - 1)} stroke="rgba(45,45,45,0.2)" strokeWidth={a % 90 === 0 ? 1 : 0.5} />;
                              })}
                              <line x1={cx} y1={cy} x2={cx + Math.cos(hRad) * 10} y2={cy + Math.sin(hRad) * 10} stroke="#2D2D2D" strokeWidth={2} strokeLinecap="round" />
                              <line x1={cx} y1={cy} x2={cx + Math.cos(mRad) * 14} y2={cy + Math.sin(mRad) * 14} stroke={anyOn ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={1.2} strokeLinecap="round" />
                              <circle cx={cx} cy={cy} r={1.5} fill="#2D2D2D" />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{`${hVal}:${mVal}:${sVal}`}</text>
                            </g>
                          );
                        })()}

                        {node.type === "thermometer-out" && (() => {
                          const on = !!node.inputs.in;
                          const barH = on ? 40 : 0;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={def.w / 2 - 4} y={8} width={8} height={def.h - 18} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <rect x={def.w / 2 - 4} y={8 + (def.h - 18) - barH} width={8} height={barH} rx={2} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.1)"} opacity={on ? 0.8 : 0.5} />
                              <circle cx={def.w / 2} cy={def.h - 8} r={5} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.2)"} stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} opacity={on ? 0.9 : 0.5} />
                            </g>
                          );
                        })()}

                        {["tachometer", "power-meter"].includes(node.type) && (() => {
                          const on = !!node.inputs.in;
                          const cx = def.w / 2, cy = def.h / 2 + 4;
                          const r = 18;
                          const startAngle = -210, endAngle = 30;
                          const sweep = endAngle - startAngle;
                          const needleAngle = on ? startAngle + sweep * 0.7 : startAngle + sweep * 0.05;
                          const needleRad = needleAngle * Math.PI / 180;
                          const nx = cx + Math.cos(needleRad) * (r - 4);
                          const ny = cy + Math.sin(needleRad) * (r - 4);
                          const ticks = 7;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <path d={`M ${cx + Math.cos(startAngle * Math.PI / 180) * r} ${cy + Math.sin(startAngle * Math.PI / 180) * r} A ${r} ${r} 0 1 1 ${cx + Math.cos(endAngle * Math.PI / 180) * r} ${cy + Math.sin(endAngle * Math.PI / 180) * r}`} fill="none" stroke="rgba(45,45,45,0.12)" strokeWidth={2} strokeLinecap="round" />
                              {Array.from({ length: ticks }).map((_, i) => {
                                const a = (startAngle + (sweep / (ticks - 1)) * i) * Math.PI / 180;
                                const inner = i >= ticks - 2 ? r - 8 : r - 5;
                                return <line key={i} x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner} x2={cx + Math.cos(a) * (r - 1)} y2={cy + Math.sin(a) * (r - 1)} stroke={i >= ticks - 2 ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={i % 2 === 0 ? 1 : 0.5} />;
                              })}
                              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.25)"} strokeWidth={1.5} strokeLinecap="round" />
                              <circle cx={cx} cy={cy} r={2.5} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.2)"} stroke="#2D2D2D" strokeWidth={0.5} />
                              <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={700} pointerEvents="none">{node.type === "tachometer" ? "RPM" : "WATT"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "data-latch-disp" && (() => {
                          const vals = [0,1,2,3,4,5,6,7].map(idx => !!node.inputs[`d${idx}`]);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <text x={6} y={10} textAnchor="start" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} pointerEvents="none">SHIFT REG</text>
                              {vals.map((on, idx) => (
                                <g key={idx}>
                                  <rect x={6 + idx * 10} y={18} width={8} height={8} rx={1}
                                    fill={on ? "#FF9F4C" : "rgba(45,45,45,0.06)"}
                                    stroke={on ? "#2D2D2D" : "rgba(45,45,45,0.12)"}
                                    strokeWidth={0.5} opacity={on ? 0.85 : 0.7} />
                                  <text x={10 + idx * 10} y={34} textAnchor="middle" fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">{idx}</text>
                                  {idx < 7 && <path d={`M ${14 + idx * 10} ${22} L ${17 + idx * 10} ${22}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} markerEnd="url(#latchArrow)" />}
                                </g>
                              ))}
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">LATCH</text>
                            </g>
                          );
                        })()}

                        {node.type === "signal-analyzer" && (() => {
                          const inOn = !!node.inputs.in;
                          const clkOn = !!node.inputs.clk;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              {[0.25, 0.5, 0.75].map(f => <line key={f} x1={4} y1={def.h * f} x2={def.w - 4} y2={def.h * f} stroke="rgba(45,45,45,0.05)" strokeWidth={0.5} />)}
                              <polyline
                                points={inOn && clkOn
                                  ? `4,${def.h * 0.7} 14,${def.h * 0.7} 14,${def.h * 0.3} 28,${def.h * 0.3} 28,${def.h * 0.7} 42,${def.h * 0.7} 42,${def.h * 0.3} 56,${def.h * 0.3} 56,${def.h * 0.7} 70,${def.h * 0.7} 70,${def.h * 0.3} 84,${def.h * 0.3} 84,${def.h * 0.7} 98,${def.h * 0.7} 98,${def.h * 0.3} 112,${def.h * 0.3}`
                                  : inOn
                                  ? `4,${def.h * 0.6} 20,${def.h * 0.4} 40,${def.h * 0.6} 60,${def.h * 0.4} 80,${def.h * 0.6} 100,${def.h * 0.4} 116,${def.h * 0.6}`
                                  : `4,${def.h / 2} ${def.w - 4},${def.h / 2}`}
                                fill="none" stroke="#2D2D2D" strokeWidth={1.5} opacity={0.7} />
                              <text x={6} y={10} textAnchor="start" fill="rgba(45,45,45,0.3)" fontSize={6} fontWeight={600} fontFamily="monospace" pointerEvents="none">{inOn ? (clkOn ? "DIGITAL" : "ANALOG") : "IDLE"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "dc-motor" && (() => {
                          const in1 = !!node.inputs.in1, in2 = !!node.inputs.in2;
                          const spinning = in1 !== in2;
                          const dir = in1 && !in2 ? 1 : -1;
                          const cx = def.w / 2, cy = def.h / 2 - 4;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.18)" strokeWidth={1.2} />
                              <rect x={cx - 18} y={cy - 12} width={36} height={24} rx={3} fill={spinning ? "rgba(255,159,76,0.06)" : "rgba(45,45,45,0.04)"} stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                              <circle cx={cx - 6} cy={cy} r={7} fill="none" stroke={spinning ? "#FF9F4C" : "rgba(45,45,45,0.12)"} strokeWidth={1} />
                              <circle cx={cx + 6} cy={cy} r={7} fill="none" stroke={spinning ? "#FF9F4C" : "rgba(45,45,45,0.12)"} strokeWidth={1} />
                              {spinning && <>
                                <path d={`M ${cx - 6} ${cy - 3} Q ${cx - 9} ${cy} ${cx - 6} ${cy + 3}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} />
                                <path d={`M ${cx + 6} ${cy - 3} Q ${cx + 3} ${cy} ${cx + 6} ${cy + 3}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} />
                              </>}
                              <rect x={cx + 18} y={cy - 3} width={6} height={6} rx={1} fill="rgba(45,45,45,0.1)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill={spinning ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={5} fontWeight={600} pointerEvents="none">{spinning ? (dir > 0 ? "CW" : "CCW") : "STOP"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "relay" && (() => {
                          const coil = !!node.inputs.coil;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={6} y={6} width={def.w / 2 - 8} height={def.h - 12} rx={3} fill="rgba(0,0,0,0.2)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
                              <text x={def.w / 4} y={12} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} pointerEvents="none">COIL</text>
                              <circle cx={def.w / 4} cy={def.h / 2} r={6} fill={coil ? "#FF9F4C" : "rgba(45,45,45,0.1)"} opacity={coil ? 0.5 : 0.3} />
                              <line x1={def.w / 2 + 2} y1={14} x2={def.w - 10} y2={coil ? 14 : 20} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
                              <circle cx={def.w - 10} cy={14} r={2} fill="rgba(45,45,45,0.3)" />
                              <text x={def.w * 3 / 4} y={def.h - 8} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} pointerEvents="none">COM</text>
                              <text x={def.w - 8} y={8} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} pointerEvents="none">{coil ? "NO" : "NC"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "solenoid" && (() => {
                          const on = !!node.inputs.in;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={def.w / 2 - 12} y={10} width={24} height={def.h - 20} rx={3} fill="none" stroke="rgba(45,45,45,0.18)" strokeWidth={1} />
                              <line x1={def.w / 2} y1={on ? 16 : 10} x2={def.w / 2} y2={on ? def.h - 14 : def.h - 20} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.3)"} strokeWidth={2} strokeLinecap="round" />
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={6} fontWeight={600} pointerEvents="none">{on ? "ACT" : "IDL"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "oled-display" && (() => {
                          const anyOn = Object.values(node.inputs).some(Boolean);
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <rect x={4} y={4} width={def.w - 8} height={def.h - 8} rx={3} fill="rgba(0,0,0,0.5)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.8} />
                              <text x={def.w / 2} y={def.h / 2 - 6} textAnchor="middle" fill={anyOn ? "rgba(45,45,45,0.9)" : "rgba(45,45,45,0.18)"} fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">OLED</text>
                              <text x={def.w / 2} y={def.h / 2 + 8} textAnchor="middle" fill={anyOn ? "#2D2D2D" : "rgba(45,45,45,0.2)"} fontSize={6} fontFamily="monospace" pointerEvents="none">128x64</text>
                            </g>
                          );
                        })()}

                        {node.type === "speaker" && (() => {
                          const on = !!node.inputs.in;
                          const cx = def.w / 2 - 6, cy = def.h / 2;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill={on ? "rgba(45,45,45,0.06)" : "rgba(45,45,45,0.04)"} stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <circle cx={cx} cy={cy} r={6} fill="none" stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} strokeWidth={1.2} />
                              <circle cx={cx} cy={cy} r={2} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} />
                              <path d={`M ${cx + 6} ${cy - 8} L ${cx + 16} ${cy - 14} L ${cx + 16} ${cy + 14} L ${cx + 6} ${cy + 8}`} fill={on ? "rgba(45,45,45,0.18)" : "rgba(45,45,45,0.06)"} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} strokeWidth={1} />
                              {on && <>
                                <path d={`M ${def.w - 10} ${cy - 8} Q ${def.w - 4} ${cy} ${def.w - 10} ${cy + 8}`} fill="none" stroke="#2D2D2D" strokeWidth={1} opacity={0.5} />
                                <path d={`M ${def.w - 6} ${cy - 12} Q ${def.w} ${cy} ${def.w - 6} ${cy + 12}`} fill="none" stroke="#2D2D2D" strokeWidth={0.8} opacity={0.3} />
                              </>}
                              <text x={def.w / 2} y={def.h - 4} textAnchor="middle" fill={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={6} fontWeight={600} pointerEvents="none">{on ? "ON" : "OFF"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "linear-actuator" && (() => {
                          const on = Object.values(node.inputs).some(Boolean);
                          const cx = def.w / 2;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <rect x={cx - 16} y={def.h / 2 - 5} width={32} height={10} rx={3} fill={on ? "rgba(255,159,76,0.06)" : "rgba(45,45,45,0.04)"} stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <line x1={cx + (on ? 16 : 4)} y1={def.h / 2} x2={cx + 20} y2={def.h / 2} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.3)"} strokeWidth={2} strokeLinecap="round" />
                              <circle cx={cx + (on ? 16 : 4)} cy={def.h / 2} r={2} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.2)"} />
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{on ? "EXT" : "RET"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "robotic-arm" && (() => {
                          const on = Object.values(node.inputs).some(Boolean);
                          const cx = def.w / 2, cy = def.h / 2;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <circle cx={cx - 8} cy={cy + 6} r={4} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <line x1={cx - 8} y1={cy + 6} x2={cx + 4} y2={cy - 6} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.25)"} strokeWidth={2} strokeLinecap="round" />
                              <circle cx={cx + 4} cy={cy - 6} r={3} fill="rgba(45,45,45,0.08)" stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={0.8} />
                              <line x1={cx + 4} y1={cy - 6} x2={cx + 14} y2={cy - 2} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.2)"} strokeWidth={1.5} strokeLinecap="round" />
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{on ? "MOV" : "IDLE"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "printer-out" && (() => {
                          const on = Object.values(node.inputs).some(Boolean);
                          const cx = def.w / 2;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                              <rect x={cx - 14} y={8} width={28} height={16} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              {on && <rect x={cx - 10} y={24} width={20} height={8} rx={1} fill="#FFF8F0" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />}
                              {on && [0,1,2].map(i => <line key={i} x1={cx - 7} y1={27 + i * 2.5} x2={cx + 7} y2={27 + i * 2.5} stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />)}
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{on ? "PRINT" : "IDLE"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "dip-switch" && (() => {
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <text x={def.w / 2} y={10} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">DIP</text>
                              {[0,1,2,3,4,5,6,7].map((idx) => {
                                const sx = 8 + (idx % 4) * 18;
                                const sy = 16 + Math.floor(idx / 4) * 32;
                                const on = !!node.outputs[`o${idx}`];
                                return (
                                  <g key={idx}>
                                    <rect x={sx} y={sy} width={14} height={22} rx={2} fill={on ? "rgba(45,45,45,0.1)" : "rgba(0,0,0,0.3)"} stroke={on ? "#FF9F4C" : "rgba(45,45,45,0.1)"} strokeWidth={0.8} />
                                    <rect x={sx + 2} y={on ? sy + 2 : sy + 12} width={10} height={8} rx={1.5} fill={on ? "#FF9F4C" : "rgba(45,45,45,0.18)"} />
                                    <text x={sx + 7} y={sy - 2} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontFamily="monospace" pointerEvents="none">{idx}</text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}

                        {node.type === "keypad" && (() => {
                          const val = ((node.outputs.d3 ? 8 : 0) + (node.outputs.d2 ? 4 : 0) + (node.outputs.d1 ? 2 : 0) + (node.outputs.d0 ? 1 : 0));
                          const valid = !!node.outputs.valid;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <text x={def.w / 2} y={10} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">KEYPAD</text>
                              {[1,2,3,4,5,6,7,8,9,0].map((num, idx) => {
                                const kx = 10 + (idx % 3) * 20;
                                const ky = 14 + Math.floor(idx / 3) * 18;
                                const isActive = valid && val === num;
                                return (
                                  <g key={idx}>
                                    <rect x={kx} y={ky} width={16} height={14} rx={2} fill={isActive ? "rgba(45,45,45,0.1)" : "rgba(0,0,0,0.3)"} stroke={isActive ? "#FF9F4C" : "rgba(45,45,45,0.1)"} strokeWidth={0.6} />
                                    <text x={kx + 8} y={ky + 7.5} textAnchor="middle" dominantBaseline="central" fill={isActive ? "#FF9F4C" : "rgba(45,45,45,0.5)"} fontSize={7} fontWeight={600} fontFamily="monospace" pointerEvents="none">{num}</text>
                                  </g>
                                );
                              })}
                              <text x={def.w / 2} y={def.h - 5} textAnchor="middle" fill={valid ? "#FF9F4C" : "rgba(45,45,45,0.18)"} fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">{valid ? val.toString(16).toUpperCase() : "-"}</text>
                            </g>
                          );
                        })()}

                        {node.type === "analog-in" && (() => {
                          const val = ((node.outputs.d3 ? 8 : 0) + (node.outputs.d2 ? 4 : 0) + (node.outputs.d1 ? 2 : 0) + (node.outputs.d0 ? 1 : 0));
                          const barH = (val / 15) * 42;
                          return (
                            <g>
                              <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                              <text x={def.w / 2} y={10} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={700} fontFamily="system-ui" pointerEvents="none">ANALOG</text>
                              <rect x={12} y={14} width={6} height={42} rx={2} fill="rgba(0,0,0,0.3)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                              <rect x={12} y={14 + 42 - barH} width={6} height={barH} rx={2} fill="#2D2D2D" opacity={0.7} />
                              <text x={30} y={35} textAnchor="middle" fill="#2D2D2D" fontSize={14} fontWeight={900} fontFamily="monospace" pointerEvents="none">{val}</text>
                              <text x={30} y={48} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={6} fontFamily="monospace" pointerEvents="none">0-15</text>
                            </g>
                          );
                        })()}

                        {node.type === "random" && (() => {
                          const rm = def.h / 2;
                          return (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                            <text x={def.w/2} y={rm + 1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={14} fontWeight={900} fontFamily="serif" pointerEvents="none">?</text>
                          </g>
                          );
                        })()}

                        {node.type === "push-button" && (() => {
                          const pm = def.h / 2;
                          return (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                            <circle cx={def.w/2} cy={pm} r={pm - 10} fill={node.outputs.out ? "#FF9F4C" : "rgba(45,45,45,0.18)"} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
                            <line x1={def.w/2} y1={6} x2={def.w/2} y2={10} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
                            <line x1={def.w/2 - 3} y1={6} x2={def.w/2 + 3} y2={6} stroke="rgba(45,45,45,0.5)" strokeWidth={1.5} />
                            <text x={def.w/2} y={pm + 1} textAnchor="middle" dominantBaseline="central" fill={node.outputs.out ? "#FFFFFF" : "rgba(45,45,45,0.5)"} fontSize={8} fontWeight={800} fontFamily="monospace" pointerEvents="none">{node.outputs.out ? "1" : "0"}</text>
                          </g>
                          );
                        })()}

                        {/* ─── Advanced Actuator / Robotics / Industrial Canvas Renderings ─── */}

                        {node.type === "gripper" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={def.w/2-14} y={8} width={28} height={10} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <rect x={def.w/2-18} y={18} width={8} height={24} rx={1} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w/2+10} y={18} width={8} height={24} rx={1} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w/2-10} y={def.h/2+8} width={20} height={4} rx={1} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">2-Finger</text>
                          </g>
                        )}

                        {node.type === "gripper-3f" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={def.w/2-10} y={6} width={20} height={10} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <path d={`M ${def.w/2-10} ${16} L ${def.w/2-16} ${def.h-12}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" />
                            <path d={`M ${def.w/2} ${16} L ${def.w/2} ${def.h-8}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" />
                            <path d={`M ${def.w/2+10} ${16} L ${def.w/2+16} ${def.h-12}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" />
                            <circle cx={def.w/2-16} cy={def.h-10} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w/2} cy={def.h-6} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w/2+16} cy={def.h-10} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">3-Finger</text>
                          </g>
                        )}

                        {node.type === "encoder" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2} r={14} fill="none" stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={def.w/2} cy={def.h/2} r={8} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2} r={3} fill="rgba(45,45,45,0.1)" stroke="#2D2D2D" strokeWidth={0.8} />
                            {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
                              const rad=a*Math.PI/180;
                              return <line key={a} x1={def.w/2+Math.cos(rad)*8} y1={def.h/2+Math.sin(rad)*8} x2={def.w/2+Math.cos(rad)*14} y2={def.h/2+Math.sin(rad)*14} stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />;
                            })}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Quadrature</text>
                          </g>
                        )}

                        {node.type === "lidar" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2-2} r={12} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2} cy={def.h/2-2} r={5} fill="rgba(255,159,76,0.1)" stroke="#FF9F4C" strokeWidth={0.8} />
                            {[0,45,90,135,180,225,270,315].map(a => {
                              const rad=a*Math.PI/180;
                              return <line key={a} x1={def.w/2+Math.cos(rad)*5} y1={def.h/2-2+Math.sin(rad)*5} x2={def.w/2+Math.cos(rad)*12} y2={def.h/2-2+Math.sin(rad)*12} stroke="#FF9F4C" strokeWidth={0.6} opacity={0.4} />;
                            })}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">360° Scan</text>
                          </g>
                        )}

                        {node.type === "imu" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`il${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={def.w/2-14} y1={def.h/2} x2={def.w/2+14} y2={def.h/2} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2} y1={def.h/2-14} x2={def.w/2} y2={def.h/2+14} stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2-8} cy={def.h/2-8} r={3} fill="rgba(255,159,76,0.08)" stroke="#FF9F4C" strokeWidth={0.6} />
                            <circle cx={def.w/2+8} cy={def.h/2+8} r={3} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={0.6} />
                            <text x={def.w/2-8} y={def.h/2-6} textAnchor="middle" fill="rgba(255,159,76,0.5)" fontSize={4} pointerEvents="none">ACC</text>
                            <text x={def.w/2+8} y={def.h/2+10} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={4} pointerEvents="none">GYRO</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">6-AXIS</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">MPU6050</text>
                          </g>
                        )}

                        {node.type === "gps-rtk" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`gl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2} cy={def.h/2-4} r={12} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2-4} r={6} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
                            <circle cx={def.w/2} cy={def.h/2-4} r={2} fill="#FF9F4C" opacity={0.6} />
                            <line x1={def.w/2} y1={def.h/2-16} x2={def.w/2} y2={def.h/2-18} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
                            <circle cx={def.w/2} cy={def.h/2-20} r={1.5} fill="rgba(45,45,45,0.3)" />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">RTK</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">CM Accuracy</text>
                          </g>
                        )}

                        {node.type === "bluetooth-rc" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            {[0,1,2,3,4,5,6].map(i => <rect key={i} x={def.w-3} y={12+i*9} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <path d={`M ${def.w/2} ${def.h/2+6} L ${def.w/2} ${def.h/2-4}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M ${def.w/2} ${def.h/2-4} L ${def.w/2-5} ${def.h/2+1}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M ${def.w/2} ${def.h/2-4} L ${def.w/2+5} ${def.h/2+1}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${def.w/2} ${def.h/2-4} A ${6+i*4} ${6+i*4} 0 0 1 ${def.w/2+6+i*4} ${def.h/2-8-i*3}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.6-i*0.15} />
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">BT</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Gamepad</text>
                          </g>
                        )}

                        {node.type === "wifi-rc" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5,6].map(i => <rect key={i} x={def.w-3} y={10+i*10} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${def.w/2-4} ${def.h/2} Q ${def.w/2-8-i*3} ${def.h/2-8-i*3} ${def.w/2-2-i*2} ${def.h/2-14-i*3}`} fill="none" stroke="#FF9F4C" strokeWidth={1} opacity={0.6-i*0.15} />
                            ))}
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${def.w/2+4} ${def.h/2} Q ${def.w/2+8+i*3} ${def.h/2-8-i*3} ${def.w/2+2+i*2} ${def.h/2-14-i*3}`} fill="none" stroke="#FF9F4C" strokeWidth={1} opacity={0.6-i*0.15} />
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">WiFi</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Web Control</text>
                          </g>
                        )}

                        {node.type === "pid-controller" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`pl${i}`}><rect x={-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <text x={def.w/2} y={18} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">PID</text>
                            <path d={`M 18 ${def.h/2+8} Q ${def.w/2} ${def.h/2-6} ${def.w-18} ${def.h/2+4}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M 18 ${def.h/2+4} L ${def.w-18} ${def.h/2+4}`} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} strokeDasharray="3 2" />
                            <circle cx={def.w/2} cy={def.h/2-2} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2-12} y={def.h/2+14} fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">Kp</text>
                            <text x={def.w/2} y={def.h/2+14} fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">Ki</text>
                            <text x={def.w/2+12} y={def.h/2+14} fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">Kd</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Feedback Ctrl</text>
                          </g>
                        )}

                        {node.type === "kinematic-solver" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`kl${i}`}><rect x={-3} y={14+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <text x={12} y={def.h/2+2} fill="rgba(45,45,45,0.3)" fontSize={5} fontFamily="monospace" pointerEvents="none">XYZ</text>
                            <text x={def.w-20} y={def.h/2+2} fill="rgba(45,45,45,0.3)" fontSize={5} fontFamily="monospace" pointerEvents="none">J0-J5</text>
                            <path d={`M 18 ${def.h/2} L ${def.w/2-6} ${def.h/2} L ${def.w/2+6} ${def.h/2-10} L ${def.w-18} ${def.h/2-4}`} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2-6} cy={def.h/2} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w/2+6} cy={def.h/2-10} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">IK</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Inverse Kinematics</text>
                          </g>
                        )}

                        {node.type === "path-planner" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`ppl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={20} cy={def.h-16} r={3} fill="rgba(255,159,76,0.2)" stroke="#FF9F4C" strokeWidth={0.8} />
                            <circle cx={def.w-20} cy={16} r={3} fill="rgba(255,159,76,0.2)" stroke="#FF9F4C" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(idx => {
                              const px = 28+idx*12, py = def.h-20-idx*8+Math.sin(idx)*6;
                              return <circle key={idx} cx={px} cy={py} r={1.5} fill="#2D2D2D" opacity={0.4} />;
                            })}
                            <path d={`M 20 ${def.h-16} L 32 ${def.h-24} L 44 ${def.h-14} L 56 ${def.h-28} L 68 ${def.h-20}`} fill="none" stroke="#2D2D2D" strokeWidth={1} strokeDasharray="3 2" />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">A* RRT</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Motion Planning</text>
                          </g>
                        )}

                        {node.type === "collision-detector" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <rect key={i} x={def.w-3} y={12+i*10} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            {[0,1,2].map(i => <rect key={i} x={-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2-8} cy={def.h/2-2} r={8} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            <circle cx={def.w/2+8} cy={def.h/2+2} r={8} fill="none" stroke="#FF9F4C" strokeWidth={1} opacity={0.5} />
                            <line x1={def.w/2-2} y1={def.h/2} x2={def.w/2+2} y2={def.h/2} stroke="#2D2D2D" strokeWidth={1.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">AVOID</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Proximity</text>
                          </g>
                        )}

                        {node.type === "gimbal" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`gl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-8} y={def.h/2-8} width={16} height={12} rx={2} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={def.w/2} cy={def.h/2-2} r={4} fill="rgba(255,159,76,0.1)" stroke="#FF9F4C" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2-2} r={1.5} fill="#2D2D2D" />
                            <line x1={def.w/2} y1={def.h/2+4} x2={def.w/2} y2={def.h/2+12} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
                            <line x1={def.w/2-6} y1={def.h/2+12} x2={def.w/2+6} y2={def.h/2+12} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">3-AXIS</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Camera Stab</text>
                          </g>
                        )}

                        {node.type === "rover-diff" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => <g key={`rl${i}`}><rect x={-3} y={16+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={14} y={14} width={def.w-28} height={def.h-28} rx={4} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <rect x={8} y={def.h/2-12} width={8} height={24} rx={3} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w-16} y={def.h/2-12} width={8} height={24} rx={3} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={12} cy={def.h/2-6} r={2} fill="#FF9F4C" opacity={0.4} />
                            <circle cx={def.w-12} cy={def.h/2-6} r={2} fill="#FF9F4C" opacity={0.4} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">DIFF</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">2-Motor Drive</text>
                          </g>
                        )}

                        {node.type === "tracked-base" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => <g key={`tl${i}`}><rect x={-3} y={16+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={6} y={10} width={12} height={def.h-20} rx={4} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={def.w-18} y={10} width={12} height={def.h-20} rx={4} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4].map(i => <g key={`t${i}`}><circle cx={12} cy={14+i*8} r={2} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} /><circle cx={def.w-12} cy={14+i*8} r={2} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} /></g>)}
                            <rect x={20} y={14} width={def.w-40} height={def.h-28} rx={3} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.6} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">TANK</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Caterpillar</text>
                          </g>
                        )}

                        {node.type === "drone-quad" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4].map(i => <g key={`dl${i}`}><rect x={-3} y={14+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={def.w/2-18} y1={18} x2={def.w/2+18} y2={def.h-18} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2+18} y1={18} x2={def.w/2-18} y2={def.h-18} stroke="#2D2D2D" strokeWidth={1.5} />
                            <rect x={def.w/2-4} y={def.h/2-4} width={8} height={8} rx={1} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={0.8} />
                            {[[-18,-18],[18,-18],[-18,18],[18,18]].map(([dx,dy],idx) => (
                              <g key={idx}>
                                <circle cx={def.w/2+dx} cy={def.h/2+dy} r={8} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.4} />
                                <circle cx={def.w/2+dx} cy={def.h/2+dy} r={3} fill="rgba(45,45,45,0.15)" stroke="#2D2D2D" strokeWidth={0.6} />
                              </g>
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">QUAD</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">X-Config</text>
                          </g>
                        )}

                        {node.type === "flight-ctrl" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5].map(i => <g key={`fl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={16} y={16} width={def.w-32} height={def.h-32} rx={2} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
                            <text x={def.w/2} y={def.h/2-8} textAnchor="middle" fill="#2D2D2D" fontSize={8} fontWeight={800} fontFamily="monospace" pointerEvents="none">FC</text>
                            {[[-10,-10],[10,-10],[-10,10],[10,10]].map(([dx,dy],idx) => (
                              <g key={idx}>
                                <line x1={def.w/2+dx} y1={def.h/2+dy} x2={def.w/2+dx*2} y2={def.h/2+dy*2} stroke="#FF9F4C" strokeWidth={0.8} opacity={0.5} />
                                <circle cx={def.w/2+dx*2} cy={def.h/2+dy*2} r={2} fill="#FF9F4C" opacity={0.4} />
                              </g>
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">FLIGHT</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">PID Mixer</text>
                          </g>
                        )}

                        {node.type === "propeller-motor" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <circle cx={def.w/2} cy={def.h/2+4} r={8} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2} y1={def.h/2+4} x2={def.w/2} y2={4} stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            <ellipse cx={def.w/2-12} cy={10} rx={10} ry={3} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} transform={`rotate(-20 ${def.w/2-12} 10)`} />
                            <ellipse cx={def.w/2+12} cy={10} rx={10} ry={3} fill="none" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} transform={`rotate(20 ${def.w/2+12} 10)`} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BLDC</text>
                          </g>
                        )}

                        {node.type === "linear-guide" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            {[0,1,2].map(i => <rect key={i} x={def.w-3} y={14+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            <rect x={12} y={def.h/2-4} width={def.w-24} height={8} rx={2} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w/2-6} y={def.h/2-6} width={12} height={12} rx={1} fill="rgba(255,159,76,0.1)" stroke="#FF9F4C" strokeWidth={0.8} />
                            {[0,1,2,3,4,5,6,7].map(i => <line key={i} x1={16+i*6} y1={def.h/2-4} x2={16+i*6} y2={def.h/2+4} stroke="rgba(45,45,45,0.12)" strokeWidth={0.4} />)}
                            <circle cx={12} cy={def.h/2} r={2} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w-12} cy={def.h/2} r={2} fill="rgba(45,45,45,0.2)" />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Rail Guide</text>
                          </g>
                        )}

                        {node.type === "stepper-nema" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`sl${i}`}><rect x={-3} y={12+i*10} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={12+i*10} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={14} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-12} y={def.h/2-10} width={24} height={20} rx={2} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={def.w/2} cy={def.h/2} r={8} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2} r={3} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={0.8} />
                            <line x1={def.w/2} y1={def.h/2} x2={def.w/2+6} y2={def.h/2-4} stroke="#2D2D2D" strokeWidth={1} strokeLinecap="round" />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">NEMA</text>
                            <circle cx={def.w-16} cy={14} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">17 / 23</text>
                          </g>
                        )}

                        {node.type === "harmonic-drive" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <circle cx={def.w/2} cy={def.h/2} r={14} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2} cy={def.h/2} r={10} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2} r={6} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
                            <circle cx={def.w/2} cy={def.h/2} r={3} fill="rgba(255,159,76,0.1)" stroke="#FF9F4C" strokeWidth={0.8} />
                            {[0,60,120,180,240,300].map(a => {
                              const rad=a*Math.PI/180;
                              return <line key={a} x1={def.w/2+Math.cos(rad)*6} y1={def.h/2+Math.sin(rad)*6} x2={def.w/2+Math.cos(rad)*10} y2={def.h/2+Math.sin(rad)*10} stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />;
                            })}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">1:100</text>
                          </g>
                        )}

                        {node.type === "lead-screw" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            {[0,1].map(i => <rect key={i} x={def.w-3} y={14+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />)}
                            <rect x={12} y={def.h/2-3} width={def.w-24} height={6} rx={2} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1} />
                            {[0,1,2,3,4,5,6,7,8].map(i => (
                              <line key={i} x1={16+i*6} y1={def.h/2-3} x2={20+i*6} y2={def.h/2+3} stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            ))}
                            <rect x={def.w/2+8} y={def.h/2-5} width={8} height={10} rx={1} fill="rgba(255,159,76,0.08)" stroke="#FF9F4C" strokeWidth={0.6} />
                            <circle cx={12} cy={def.h/2} r={4} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={0.8} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Ball Screw</text>
                          </g>
                        )}

                        {node.type === "esc" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <rect x={-3} y={def.h/2-6} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={-3} y={def.h/2+2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <path d={`M 16 ${def.h/2} L 26 ${def.h/2-8} L 36 ${def.h/2+8} L 46 ${def.h/2-8} L 56 ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">ESC</text>
                            <circle cx={def.w-16} cy={14} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Brushless Ctrl</text>
                          </g>
                        )}

                        {node.type === "motor-driver" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5].map(i => <g key={`mdl${i}`}><rect x={-3} y={12+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={12+i*12} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={14} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-22} y={14} width={20} height={def.h-28} rx={2} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.6} />
                            <rect x={def.w/2+2} y={14} width={20} height={def.h-28} rx={2} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.6} />
                            <text x={def.w/2-12} y={def.h/2} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">A</text>
                            <text x={def.w/2+12} y={def.h/2} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">B</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">L298N</text>
                            <circle cx={def.w-16} cy={14} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Dual H-Bridge</text>
                          </g>
                        )}

                        {node.type === "robotic-arm-6dof" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`ral${i}`}><rect x={-3} y={14+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={14} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2-8} cy={def.h-22} r={5} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w/2-8} y1={def.h-22} x2={def.w/2-2} y2={def.h-36} stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2-2} y1={def.h-36} x2={def.w/2+10} y2={def.h-48} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2+10} y1={def.h-48} x2={def.w/2+16} y2={def.h-54} stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={def.w/2-2} cy={def.h-36} r={2.5} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w/2+10} cy={def.h-48} r={2} fill="#FF9F4C" opacity={0.4} />
                            <circle cx={def.w/2+16} cy={def.h-54} r={1.5} fill="#FF9F4C" opacity={0.3} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">6-DOF</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Robotic Arm</text>
                          </g>
                        )}

                        {node.type === "pneumatic-cylinder" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={-3} y={def.h/2-4} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2-2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={14} y={def.h/2-10} width={def.w-28} height={20} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={14+def.w/2-10} y1={def.h/2-10} x2={14+def.w/2-10} y2={def.h/2+10} stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
                            <rect x={def.w/2-6} y={def.h/2-3} width={18} height={6} rx={1} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <line x1={def.w/2+12} y1={def.h/2} x2={def.w-14} y2={def.h/2} stroke="#2D2D2D" strokeWidth={2} />
                            <circle cx={def.w-14} cy={def.h/2} r={3} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <text x={def.w/2} y={10} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">PNEU</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Air Cylinder</text>
                          </g>
                        )}

                        {node.type === "wheel-mecanum" && (
                          <g>
                            <circle cx={def.w/2} cy={def.h/2} r={Math.min(def.w,def.h)/2-4} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2} cy={def.h/2} r={Math.min(def.w,def.h)/2-10} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <circle cx={def.w/2} cy={def.h/2} r={4} fill="rgba(45,45,45,0.1)" stroke="#2D2D2D" strokeWidth={1} />
                            {[0,45,90,135,180,225,270,315].map(a => {
                              const rad = a*Math.PI/180, r1=Math.min(def.w,def.h)/2-10, r2=Math.min(def.w,def.h)/2-4;
                              return <line key={a} x1={def.w/2+Math.cos(rad)*r1} y1={def.h/2+Math.sin(rad)*r1} x2={def.w/2+Math.cos(rad+0.3)*r2} y2={def.h/2+Math.sin(rad+0.3)*r2} stroke="rgba(45,45,45,0.3)" strokeWidth={1.5} strokeLinecap="round" />;
                            })}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Mecanum</text>
                          </g>
                        )}

                        {node.type === "wheel-omni" && (
                          <g>
                            <circle cx={def.w/2} cy={def.h/2} r={Math.min(def.w,def.h)/2-4} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={def.w/2} cy={def.h/2} r={4} fill="rgba(45,45,45,0.1)" stroke="#2D2D2D" strokeWidth={1} />
                            {[0,60,120,180,240,300].map(a => {
                              const rad = a*Math.PI/180, r=Math.min(def.w,def.h)/2-8;
                              return <circle key={a} cx={def.w/2+Math.cos(rad)*r} cy={def.h/2+Math.sin(rad)*r} r={3} fill="rgba(45,45,45,0.15)" stroke="rgba(45,45,45,0.3)" strokeWidth={0.6} />;
                            })}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Omni</text>
                          </g>
                        )}

                        {node.type === "chassis-frame" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => <g key={`cfl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={14} y={14} width={def.w-28} height={def.h-28} rx={3} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1} strokeDasharray="4 2" />
                            <circle cx={22} cy={22} r={5} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w-22} cy={22} r={5} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={22} cy={def.h-22} r={5} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <circle cx={def.w-22} cy={def.h-22} r={5} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <line x1={22} y1={22} x2={def.w-22} y2={22} stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <line x1={22} y1={def.h-22} x2={def.w-22} y2={def.h-22} stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <line x1={22} y1={22} x2={22} y2={def.h-22} stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <line x1={def.w-22} y1={22} x2={def.w-22} y2={def.h-22} stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <text x={def.w/2} y={def.h/2+1} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={700} fontFamily="monospace" pointerEvents="none">CHASSIS</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">4-Wheel Frame</text>
                          </g>
                        )}

                        {node.type === "industrial-6axis" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`ial${i}`}><rect x={-3} y={12+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={12+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={14} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2-14} cy={def.h-18} r={7} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2-14} y1={def.h-18} x2={def.w/2-6} y2={def.h-32} stroke="#2D2D2D" strokeWidth={2.5} />
                            <line x1={def.w/2-6} y1={def.h-32} x2={def.w/2+8} y2={def.h-46} stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2+8} y1={def.h-46} x2={def.w/2+16} y2={def.h-52} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2+16} y1={def.h-52} x2={def.w/2+20} y2={def.h-56} stroke="#2D2D2D" strokeWidth={1} />
                            <circle cx={def.w/2-6} cy={def.h-32} r={3} fill="#FF9F4C" opacity={0.5} />
                            <circle cx={def.w/2+8} cy={def.h-46} r={2.5} fill="#FF9F4C" opacity={0.4} />
                            <circle cx={def.w/2+16} cy={def.h-52} r={2} fill="#FF9F4C" opacity={0.3} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">6-AXIS</text>
                            <circle cx={def.w-16} cy={14} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Industrial Bot</text>
                          </g>
                        )}

                        {node.type === "scara-arm" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2].map(i => <g key={`sal${i}`}><rect x={-3} y={16+i*20} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*20} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2-12} cy={def.h-20} r={6} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w/2-12} y1={def.h-20} x2={def.w/2+8} y2={def.h-20} stroke="#2D2D2D" strokeWidth={2.5} />
                            <circle cx={def.w/2+8} cy={def.h-20} r={3} fill="#FF9F4C" opacity={0.5} />
                            <line x1={def.w/2+8} y1={def.h-20} x2={def.w/2+18} y2={def.h-26} stroke="#2D2D2D" strokeWidth={1.5} />
                            <circle cx={def.w/2+18} cy={def.h-26} r={1.5} fill="#FF9F4C" opacity={0.4} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">SCARA</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Selective Compliance</text>
                          </g>
                        )}

                        {node.type === "delta-robot" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2].map(i => <g key={`dl${i}`}><rect x={-3} y={16+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*18} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={18} y1={16} x2={def.w/2-8} y2={def.h/2} stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            <line x1={def.w-18} y1={16} x2={def.w/2+8} y2={def.h/2} stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            <line x1={def.w/2} y1={16} x2={def.w/2} y2={def.h/2} stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            <line x1={def.w/2-8} y1={def.h/2} x2={def.w/2+8} y2={def.h/2} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2-8} y1={def.h/2} x2={def.w/2} y2={def.h-16} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2+8} y1={def.h/2} x2={def.w/2} y2={def.h-16} stroke="#2D2D2D" strokeWidth={1.5} />
                            <circle cx={def.w/2} cy={def.h-16} r={3} fill="#FF9F4C" opacity={0.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">DELTA</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Parallel Kinematic</text>
                          </g>
                        )}

                        {node.type === "vfd-drive" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2].map(i => <g key={`vl${i}`}><rect x={-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <path d={`M 18 ${def.h/2+6} L 28 ${def.h/2-8} L 38 ${def.h/2+8} L 48 ${def.h/2-8} L 58 ${def.h/2+6}`} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={def.w/2-8} y={14} width={16} height={10} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <text x={def.w/2} y={22} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">60Hz</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">VFD</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">AC Motor Ctrl</text>
                          </g>
                        )}

                        {node.type === "servo-drive" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2].map(i => <g key={`svl${i}`}><rect x={-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2} cy={def.h/2} r={14} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1.2} />
                            <line x1={def.w/2} y1={def.h/2} x2={def.w/2+10} y2={def.h/2-8} stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" />
                            <circle cx={def.w/2} cy={def.h/2} r={3} fill="#FF9F4C" opacity={0.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">SERVO DRV</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Closed Loop</text>
                          </g>
                        )}

                        {node.type === "proximity-switch" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <rect x={def.w-3} y={def.h/2-6} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2+2} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <rect x={def.w-3} y={def.h/2+10} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" />
                            <circle cx={20} cy={def.h/2} r={10} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <circle cx={20} cy={def.h/2} r={4} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.25)" strokeWidth={0.8} />
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${34+i*4} ${def.h/2-6-i*3} A ${8+i*3} ${8+i*3} 0 0 1 ${34+i*4} ${def.h/2+6+i*3}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.6-i*0.15} />
                            ))}
                            <text x={20} y={8} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">PROX</text>
                            <circle cx={def.w/2-4} cy={8} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2+8} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">NPN/PNP</text>
                          </g>
                        )}

                        {/* ─── Electronic Component Canvas Renderings ─── */}

                        {node.type === "resistor" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={14} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <polyline points={`14,${def.h/2} 17,${def.h/2-8} 21,${def.h/2+8} 25,${def.h/2-8} 29,${def.h/2+8} 33,${def.h/2-8} 37,${def.h/2+8} 40,${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} strokeLinejoin="round" />
                            <line x1={40} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <rect x={18} y={def.h/2-5} width={4} height={10} rx={0.5} fill="#FF9F4C" opacity={0.5} />
                            <rect x={24} y={def.h/2-5} width={4} height={10} rx={0.5} fill="#E8852E" opacity={0.5} />
                            <rect x={30} y={def.h/2-5} width={4} height={10} rx={0.5} fill="rgba(45,45,45,0.2)" opacity={0.5} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">1KΩ</text>
                          </g>
                        )}

                        {node.type === "capacitor" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-3} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2-3} y1={def.h/2-12} x2={def.w/2-3} y2={def.h/2+12} stroke="#2D2D2D" strokeWidth={2} />
                            <path d={`M ${def.w/2+3} ${def.h/2-12} Q ${def.w/2+3} ${def.h/2} ${def.w/2+3} ${def.h/2+12}`} fill="none" stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2+3} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">100μF</text>
                          </g>
                        )}

                        {node.type === "inductor" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={12} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => (
                              <path key={i} d={`M ${12 + i*8} ${def.h/2} A 4 4 0 0 1 ${12 + (i+1)*8} ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            ))}
                            <line x1={44} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">10mH</text>
                          </g>
                        )}

                        {node.type === "diode" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-10} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <polygon points={`${def.w/2-10},${def.h/2-10} ${def.w/2+8},${def.h/2} ${def.w/2-10},${def.h/2+10}`} fill="rgba(255,159,76,0.15)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={def.w/2+8} y1={def.h/2-10} x2={def.w/2+8} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2+8} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">1N4007</text>
                          </g>
                        )}

                        {node.type === "zener-diode" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-10} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <polygon points={`${def.w/2-10},${def.h/2-10} ${def.w/2+8},${def.h/2} ${def.w/2-10},${def.h/2+10}`} fill="rgba(255,159,76,0.15)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M ${def.w/2+8} ${def.h/2-10} L ${def.w/2+8} ${def.h/2+10} L ${def.w/2+12} ${def.h/2+7}`} fill="none" stroke="#2D2D2D" strokeWidth={1.8} />
                            <line x1={def.w/2+8} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">5.1V</text>
                          </g>
                        )}

                        {node.type === "transistor-bjt" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <circle cx={def.w/2+2} cy={def.h/2} r={12} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-6} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2-6} y1={def.h/2-10} x2={def.w/2-6} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2-6} y1={def.h/2-6} x2={def.w/2+10} y2={def.h/2-14} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2-6} y1={def.h/2+6} x2={def.w/2+10} y2={def.h/2+14} stroke="#2D2D2D" strokeWidth={1.2} />
                            <polygon points={`${def.w/2+8},${def.h/2+14} ${def.w/2+10},${def.h/2+10} ${def.w/2+14},${def.h/2+14}`} fill="#2D2D2D" />
                            <line x1={def.w/2+10} y1={def.h/2-14} x2={def.w-4} y2={def.h/2-14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2+10} y1={def.h/2+14} x2={def.w-4} y2={def.h/2+14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">NPN</text>
                          </g>
                        )}

                        {node.type === "transistor-mosfet" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <circle cx={def.w/2+2} cy={def.h/2} r={12} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-8} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2-8} y1={def.h/2-10} x2={def.w/2-8} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={2} />
                            <line x1={def.w/2-4} y1={def.h/2-10} x2={def.w/2-4} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={1} strokeDasharray="2 2" />
                            <line x1={def.w/2-4} y1={def.h/2-8} x2={def.w/2+10} y2={def.h/2-14} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2-4} y1={def.h/2+8} x2={def.w/2+10} y2={def.h/2+14} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={def.w/2+10} y1={def.h/2-14} x2={def.w-4} y2={def.h/2-14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2+10} y1={def.h/2+14} x2={def.w-4} y2={def.h/2+14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">NMOS</text>
                          </g>
                        )}

                        {node.type === "op-amp" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <polygon points={`8,4 ${def.w-6},${def.h/2} 8,${def.h-4}`} fill="rgba(255,159,76,0.06)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <text x={14} y={16} fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">+</text>
                            <text x={14} y={def.h-8} fill="#2D2D2D" fontSize={8} fontWeight={700} fontFamily="monospace" pointerEvents="none">-</text>
                            <line x1={4} y1={14} x2={8} y2={14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={4} y1={def.h-14} x2={8} y2={def.h-14} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w-6} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">OP-AMP</text>
                          </g>
                        )}

                        {node.type === "crystal-osc" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={def.w/2-6} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <rect x={def.w/2-6} y={def.h/2-10} width={3} height={20} rx={1} fill="rgba(45,45,45,0.12)" stroke="#2D2D2D" strokeWidth={0.8} />
                            <rect x={def.w/2+3} y={def.h/2-10} width={3} height={20} rx={1} fill="rgba(45,45,45,0.12)" stroke="#2D2D2D" strokeWidth={0.8} />
                            <rect x={def.w/2-3} y={def.h/2-12} width={6} height={24} rx={1} fill="none" stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w/2+6} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">XTAL</text>
                          </g>
                        )}

                        {node.type === "transformer" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={8} x2={4} y2={def.h-8} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
                            {[0,1,2].map(i => <path key={`l${i}`} d={`M ${def.w/2-6} ${10+i*12} A 4 4 0 0 0 ${def.w/2-6} ${18+i*12}`} fill="none" stroke="#2D2D2D" strokeWidth={1.2} />)}
                            <line x1={def.w/2-1} y1={6} x2={def.w/2-1} y2={def.h-6} stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            <line x1={def.w/2+2} y1={6} x2={def.w/2+2} y2={def.h-6} stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            {[0,1,2].map(i => <path key={`r${i}`} d={`M ${def.w/2+6} ${10+i*12} A 4 4 0 0 1 ${def.w/2+6} ${18+i*12}`} fill="none" stroke="#FF9F4C" strokeWidth={1.2} />)}
                            <line x1={def.w-4} y1={8} x2={def.w-4} y2={def.h-8} stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">XFRM</text>
                          </g>
                        )}

                        {node.type === "mosfet-driver" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => <g key={i}><rect x={2} y={8+i*10} width={4} height={3} rx={0.5} fill="rgba(45,45,45,0.3)" /><rect x={def.w-6} y={8+i*10} width={4} height={3} rx={0.5} fill="rgba(45,45,45,0.3)" /></g>)}
                            <text x={def.w/2} y={def.h/2-3} textAnchor="middle" fill="#2D2D2D" fontSize={6} fontWeight={800} fontFamily="monospace" pointerEvents="none">GATE</text>
                            <text x={def.w/2} y={def.h/2+6} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} pointerEvents="none">DRIVER</text>
                            <circle cx={4} cy={6} r={1.5} fill="#FF9F4C" opacity={0.6} />
                          </g>
                        )}

                        {node.type === "relay-module" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => (
                              <g key={i}>
                                <rect x={4} y={6+i*12} width={def.w-8} height={9} rx={2} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                                <circle cx={12} cy={10.5+i*12} r={2.5} fill={i < 2 ? "#FF9F4C" : "rgba(45,45,45,0.1)"} opacity={i < 2 ? 0.6 : 0.4} />
                                <text x={def.w-10} y={12+i*12} textAnchor="end" fill="rgba(45,45,45,0.25)" fontSize={4} fontFamily="monospace" pointerEvents="none">CH{i+1}</text>
                              </g>
                            ))}
                          </g>
                        )}

                        {node.type === "plc-controller" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4,5].map(i => <rect key={`l${i}`} x={-2} y={6+i*7} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" />)}
                            {[0,1,2,3,4,5].map(i => <rect key={`r${i}`} x={def.w-4} y={6+i*7} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" />)}
                            <text x={def.w/2} y={def.h/2-4} textAnchor="middle" fill="#2D2D2D" fontSize={8} fontWeight={800} fontFamily="monospace" pointerEvents="none">PLC</text>
                            <text x={def.w/2} y={def.h/2+6} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} pointerEvents="none">CPU</text>
                            <rect x={def.w/2+6} y={4} width={3} height={3} rx={1} fill="#FF9F4C" opacity={0.7} />
                          </g>
                        )}

                        {node.type === "plc-io-module" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            {[0,1,2,3,4,5,6,7].map(i => (
                              <g key={i}>
                                <rect x={4} y={4+i*6} width={6} height={4} rx={0.5} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.4} />
                                <circle cx={14} cy={6+i*6} r={1.5} fill={i < 4 ? "rgba(255,159,76,0.5)" : "rgba(68,255,68,0.3)"} />
                                <text x={def.w-8} y={8+i*6} textAnchor="end" fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">{i}</text>
                              </g>
                            ))}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">I/O</text>
                          </g>
                        )}

                        {/* ─── Power Component Canvas Renderings ─── */}

                        {node.type === "battery" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={10} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={10} y1={def.h/2-10} x2={10} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={2.5} />
                            <line x1={16} y1={def.h/2-6} x2={16} y2={def.h/2+6} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={20} y1={def.h/2-10} x2={20} y2={def.h/2+10} stroke="#2D2D2D" strokeWidth={2.5} />
                            <line x1={26} y1={def.h/2-6} x2={26} y2={def.h/2+6} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={26} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={10} textAnchor="middle" fill="rgba(45,45,45,0.25)" fontSize={5} fontWeight={600} pointerEvents="none">+</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">9V</text>
                          </g>
                        )}

                        {node.type === "adapter" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <text x={def.w/2} y={10} textAnchor="middle" fill="rgba(45,45,45,0.3)" fontSize={5} fontWeight={600} pointerEvents="none">AC~DC</text>
                            <path d={`M 8 ${def.h/2} L 16 ${def.h/2-6} L 24 ${def.h/2+6} L 32 ${def.h/2-6} L 40 ${def.h/2+6} L 48 ${def.h/2}`} fill="none" stroke="#FF9F4C" strokeWidth={1.2} opacity={0.6} />
                            <line x1={48} y1={def.h/2} x2={def.w/2-4} y2={def.h/2} stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
                            <rect x={def.w/2-4} y={def.h/2-4} width={8} height={8} rx={1} fill="rgba(255,159,76,0.1)" stroke="#2D2D2D" strokeWidth={0.8} />
                            <line x1={def.w/2+4} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">12V 2A</text>
                          </g>
                        )}

                        {node.type === "voltage-regulator" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={3} y={def.h/2-6} width={def.w-6} height={12} rx={1} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />
                            <line x1={-2} y1={def.h/2} x2={5} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w-5} y1={def.h/2} x2={def.w+2} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={def.w/2} y1={def.h/2-6} x2={def.w/2} y2={-2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">REG</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">5V</text>
                          </g>
                        )}

                        {node.type === "fuse" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={12} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <rect x={12} y={def.h/2-6} width={def.w-24} height={12} rx={2} fill="rgba(255,159,76,0.06)" stroke="rgba(45,45,45,0.25)" strokeWidth={1} />
                            <path d={`M 14 ${def.h/2} L 20 ${def.h/2-4} L 28 ${def.h/2+4} L 36 ${def.h/2-4} L ${def.w-14} ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w-12} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">2A</text>
                          </g>
                        )}

                        {node.type === "buck-converter" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(255,159,76,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={-2} y1={def.h/2} x2={8} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <path d={`M 14 ${def.h/2} A 4 4 0 0 1 22 ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M 22 ${def.h/2} A 4 4 0 0 1 30 ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={8} y1={def.h/2} x2={8} y2={def.h/2-8} stroke="rgba(45,45,45,0.3)" strokeWidth={0.8} />
                            <rect x={def.w/2-4} y={def.h/2-10} width={8} height={6} rx={1} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <line x1={30} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BUCK↓</text>
                          </g>
                        )}

                        {node.type === "boost-converter" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(255,159,76,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={-2} y1={def.h/2} x2={10} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <rect x={10} y={def.h/2-3} width={10} height={6} rx={1} fill="rgba(45,45,45,0.08)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <path d={`M 24 ${def.h/2} A 4 4 0 0 1 32 ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M 32 ${def.h/2} A 4 4 0 0 1 40 ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={40} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BOOST↑</text>
                          </g>
                        )}

                        {node.type === "bms" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <line x1={10} y1={8} x2={10} y2={def.h-8} stroke="#2D2D2D" strokeWidth={2.5} />
                            <line x1={16} y1={12} x2={16} y2={def.h-12} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={20} y1={8} x2={20} y2={def.h-8} stroke="#2D2D2D" strokeWidth={2.5} />
                            <line x1={26} y1={12} x2={26} y2={def.h-12} stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={30} y={6} width={def.w-36} height={def.h-12} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <text x={def.w-10} y={def.h/2-4} textAnchor="middle" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">BMS</text>
                            <text x={def.w-10} y={def.h/2+5} textAnchor="middle" fill="rgba(45,45,45,0.25)" fontSize={4} pointerEvents="none">SAFE</text>
                            <circle cx={def.w-14} cy={6} r={1.5} fill="#FF9F4C" opacity={0.5} />
                          </g>
                        )}

                        {node.type === "power-switch" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <circle cx={10} cy={def.h/2} r={3} fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={4} y1={def.h/2} x2={10} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <line x1={10} y1={def.h/2} x2={def.w-14} y2={isOn ? def.h/2 : def.h/2-10} stroke="#2D2D2D" strokeWidth={1.5} strokeLinecap="round" />
                            <circle cx={def.w-10} cy={def.h/2} r={3} fill={isOn ? "#FF9F4C" : "rgba(45,45,45,0.15)"} stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w-10} y1={def.h/2} x2={def.w-4} y2={def.h/2} stroke="rgba(45,45,45,0.4)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">{isOn ? "ON" : "OFF"}</text>
                          </g>
                        )}

                        {/* ─── Processor & Board Canvas Renderings ─── */}

                        {node.type === "microcontroller" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={12} y={12} width={def.w-24} height={def.h-24} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4].map(i => <g key={`ml${i}`}><rect x={-3} y={18+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={18+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={20} cy={20} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={16} y={def.h-22} width={def.w-32} height={4} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.5} />
                            <text x={def.w/2} y={def.h/2-4} textAnchor="middle" fill="#2D2D2D" fontSize={11} fontWeight={800} fontFamily="monospace" pointerEvents="none">MCU</text>
                            <text x={def.w/2} y={def.h/2+8} textAnchor="middle" fill="rgba(45,45,45,0.25)" fontSize={5} fontFamily="monospace" pointerEvents="none">8-bit</text>
                            <circle cx={def.w-16} cy={20} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ATmega328</text>
                          </g>
                        )}

                        {node.type === "cpu-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={10} y={10} width={def.w-20} height={def.h-20} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4,5].map(i => <g key={`cl${i}`}><rect x={-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={20} y={18} width={def.w-40} height={def.h-40} rx={2} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <text x={def.w/2} y={def.h/2-6} textAnchor="middle" fill="#2D2D2D" fontSize={13} fontWeight={800} fontFamily="monospace" pointerEvents="none">CPU</text>
                            <text x={def.w/2} y={def.h/2+6} textAnchor="middle" fill="rgba(45,45,45,0.25)" fontSize={5} fontFamily="monospace" pointerEvents="none">32-bit RISC</text>
                            <circle cx={20} cy={20} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w-20} cy={20} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ARM Cortex</text>
                          </g>
                        )}

                        {node.type === "fpga-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4].map(i => <g key={`fl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            {[0,1,2].map(row => [0,1,2,3].map(col => (
                              <rect key={`cl${row}${col}`} x={16+col*16} y={14+row*18} width={12} height={14} rx={1} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                            )))}
                            {[0,1,2].map(row => [0,1,2].map(col => (
                              <line key={`cl${row}${col}`} x1={22+col*16} y1={14+row*18+7} x2={22+(col+1)*16} y2={14+row*18+7} stroke="rgba(45,45,45,0.1)" strokeWidth={0.4} />
                            )))}
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={8} fontWeight={800} fontFamily="monospace" pointerEvents="none">FPGA</text>
                            <circle cx={14} cy={12} r={1.5} fill="#FF9F4C" opacity={0.5} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">LUT fabric</text>
                          </g>
                        )}

                        {node.type === "dsp-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4].map(i => <g key={`dl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <path d={`M 16 ${def.h/2} Q 24 ${def.h/2-10} 32 ${def.h/2} Q 40 ${def.h/2+10} ${def.w-16} ${def.h/2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <circle cx={16} cy={def.h/2} r={2} fill="#FF9F4C" opacity={0.6} />
                            <circle cx={def.w-16} cy={def.h/2} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={20} textAnchor="middle" fill="#2D2D2D" fontSize={8} fontWeight={800} fontFamily="monospace" pointerEvents="none">DSP</text>
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Signal Proc</text>
                          </g>
                        )}

                        {node.type === "npu-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3].map(i => <g key={`nl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            {[0,1,2].map(row => (
                              <g key={`nrow${row}`}>
                                {row === 0 && [0,1,2].map(ci => <circle key={`n0${ci}`} cx={22+ci*22} cy={22} r={4} fill="rgba(255,159,76,0.08)" stroke="#2D2D2D" strokeWidth={0.8} />)}
                                {row === 1 && [0,1,2,3].map(ci => <circle key={`n1${ci}`} cx={16+ci*18} cy={def.h/2} r={4} fill="rgba(255,159,76,0.08)" stroke="#2D2D2D" strokeWidth={0.8} />)}
                                {row === 2 && [0,1,2].map(ci => <circle key={`n2${ci}`} cx={22+ci*22} cy={def.h-22} r={4} fill="rgba(255,159,76,0.08)" stroke="#2D2D2D" strokeWidth={0.8} />)}
                              </g>
                            ))}
                            {[0,1,2].map(i => [0,1,2].map(j => <line key={`nl1${i}${j}`} x1={22+i*22} y1={26} x2={16+j*18} y2={def.h/2-4} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />))}
                            {[0,1,2,3].map(i => [0,1,2].map(j => <line key={`nl2${i}${j}`} x1={16+i*18} y1={def.h/2+4} x2={22+j*22} y2={def.h-26} stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />))}
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Neural Net</text>
                          </g>
                        )}

                        {node.type === "gpu-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="rgba(45,45,45,0.15)" strokeWidth={1} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4,5].map(i => <g key={`gl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            {[0,1,2,3].map(i => (
                              <g key={`cu${i}`}>
                                <rect x={16+i*22} y={18} width={18} height={def.h-36} rx={2} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.6} />
                                <text x={25+i*22} y={def.h/2} textAnchor="middle" fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">CU{i}</text>
                              </g>
                            ))}
                            <text x={def.w/2} y={14} textAnchor="middle" fill="#2D2D2D" fontSize={9} fontWeight={800} fontFamily="monospace" pointerEvents="none">GPU</text>
                            <circle cx={def.w-16} cy={12} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Parallel Core</text>
                          </g>
                        )}

                        {node.type === "arduino-uno" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={8} fill="rgba(255,159,76,0.04)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={4} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5].map(i => <g key={`al${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={16} y={14} width={22} height={14} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <circle cx={def.w-22} cy={22} r={6} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={10} fontWeight={800} fontFamily="monospace" pointerEvents="none">UNO</text>
                            <rect x={def.w/2-16} y={def.h-22} width={32} height={8} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.6} />
                            <circle cx={22} cy={def.h-18} r={1.5} fill="#FF9F4C" opacity={0.7} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ATmega328P</text>
                          </g>
                        )}

                        {node.type === "arduino-nano" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(255,159,76,0.04)" stroke="#2D2D2D" strokeWidth={1.5} />
                            {[0,1,2,3,4,5,6,7].map(i => <g key={`al${i}`}><rect x={-3} y={10+i*10} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={10+i*10} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={10} y={10} width={def.w-20} height={def.h-20} rx={2} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                            <rect x={14} y={14} width={16} height={10} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={9} fontWeight={800} fontFamily="monospace" pointerEvents="none">NANO</text>
                            <circle cx={def.w-18} cy={18} r={4} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1} />
                            <circle cx={18} cy={def.h-18} r={1.5} fill="#FF9F4C" opacity={0.7} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Nano v3</text>
                          </g>
                        )}

                        {node.type === "raspberry-pi" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`rl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={20} y={16} width={def.w-40} height={14} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.6} />
                            <text x={def.w/2} y={def.h/2-4} textAnchor="middle" fill="#2D2D2D" fontSize={10} fontWeight={800} fontFamily="monospace" pointerEvents="none">RPi 4</text>
                            <rect x={def.w/2-20} y={def.h/2+8} width={40} height={6} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                            {[0,1,2].map(i => <rect key={`rp${i}`} x={def.w/2-18+i*16} y={def.h/2+9} width={12} height={4} rx={0.5} fill="rgba(45,45,45,0.1)" />)}
                            <circle cx={22} cy={22} r={3} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1.5} />
                            <circle cx={22} cy={22} r={1} fill="#FF9F4C" opacity={0.6} />
                            <rect x={def.w-30} y={def.h-20} width={14} height={8} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Broadcom</text>
                          </g>
                        )}

                        {node.type === "raspberry-pi-pico" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={3} fill="rgba(255,159,76,0.03)" stroke="#2D2D2D" strokeWidth={1.2} />
                            {[0,1,2,3,4,5,6,7].map(i => <g key={`pl${i}`}><rect x={-3} y={8+i*10} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={8+i*10} width={6} height={3} rx={0.5} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={6} y={6} width={def.w-12} height={def.h-12} rx={2} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.1)" strokeWidth={0.8} />
                            <rect x={def.w/2-12} y={10} width={24} height={10} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.18)" strokeWidth={0.5} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={9} fontWeight={800} fontFamily="monospace" pointerEvents="none">PICO</text>
                            <circle cx={14} cy={def.h-14} r={1.5} fill="#FF9F4C" opacity={0.7} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">RP2040</text>
                          </g>
                        )}

                        {node.type === "esp32" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={6} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.03)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5].map(i => <g key={`el${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <rect x={14} y={12} width={def.w-28} height={16} rx={3} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <rect x={18} y={14} width={def.w-36} height={12} rx={1.5} fill="rgba(255,159,76,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.5} />
                            <path d={`M ${def.w-28} ${12} L ${def.w-28} ${6} L ${def.w-14} ${6} L ${def.w-14} ${12}`} fill="none" stroke="rgba(45,45,45,0.3)" strokeWidth={1} />
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={10} fontWeight={800} fontFamily="monospace" pointerEvents="none">ESP32</text>
                            <rect x={def.w/2-14} y={def.h/2+14} width={28} height={6} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                            <circle cx={22} cy={def.h-18} r={1.5} fill="#FF9F4C" opacity={0.7} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">WiFi+BLE</text>
                          </g>
                        )}

                        {node.type === "stm32" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.5} />
                            <rect x={10} y={10} width={def.w-20} height={def.h-20} rx={2} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.8} />
                            {[0,1,2,3,4,5].map(i => <g key={`sl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={20} cy={20} r={2} fill="rgba(45,45,45,0.15)" />
                            <text x={def.w/2} y={def.h/2-4} textAnchor="middle" fill="#2D2D2D" fontSize={10} fontWeight={800} fontFamily="monospace" pointerEvents="none">STM32</text>
                            <text x={def.w/2} y={def.h/2+8} textAnchor="middle" fill="rgba(45,45,45,0.25)" fontSize={5} fontFamily="monospace" pointerEvents="none">F103C8</text>
                            <rect x={def.w/2-16} y={def.h/2+16} width={32} height={6} rx={1} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                            <circle cx={def.w-18} cy={20} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">ARM Cortex-M3</text>
                          </g>
                        )}

                        {/* ─── Memory Block Canvas Renderings ─── */}

                        {["ram-block","rom-block","eeprom-block","flash-block","sram-block","cache-block"].includes(node.type) && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`ml${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            {[0,1,2].map(row => (
                              <g key={`mr${row}`}>
                                <rect x={16} y={24+row*18} width={def.w-32} height={12} rx={1.5} fill={node.type === "cache-block" ? "rgba(255,159,76,0.06)" : "rgba(45,45,45,0.03)"} stroke="rgba(45,45,45,0.12)" strokeWidth={0.5} />
                                <text x={22} y={33+row*18} fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">0x{(row*16).toString(16).toUpperCase().padStart(2,"0")}</text>
                                {[0,1,2,3].map(ci => <rect key={ci} x={50+ci*14} y={27+row*18} width={10} height={6} rx={0.5} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.08)" strokeWidth={0.3} />)}
                              </g>
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">
                              {node.type === "ram-block" ? "RAM" : node.type === "rom-block" ? "ROM" : node.type === "eeprom-block" ? "EEPROM" : node.type === "flash-block" ? "FLASH" : node.type === "sram-block" ? "SRAM" : "CACHE"}
                            </text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">
                              {node.type === "ram-block" ? "Vol. Memory" : node.type === "rom-block" ? "Read Only" : node.type === "eeprom-block" ? "E-Erasable" : node.type === "flash-block" ? "NOR/NAND" : node.type === "sram-block" ? "Static RAM" : "L1/L2"}
                            </text>
                          </g>
                        )}

                        {/* ─── Communication Block Canvas Renderings ─── */}

                        {node.type === "uart-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`ul${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <path d={`M 18 ${def.h/2-6} L 28 ${def.h/2-6} L 28 ${def.h/2+6} L 38 ${def.h/2+6}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M 38 ${def.h/2-6} L 48 ${def.h/2-6} L 48 ${def.h/2+6} L 58 ${def.h/2+6}`} fill="none" stroke="#FF9F4C" strokeWidth={1.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">UART</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">TX/RX Serial</text>
                          </g>
                        )}

                        {node.type === "spi-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`sl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            {[0,1,2].map(i => (
                              <line key={i} x1={18} y1={def.h/2-8+i*8} x2={def.w-18} y2={def.h/2-8+i*8} stroke={i === 0 ? "#2D2D2D" : i === 1 ? "#FF9F4C" : "rgba(45,45,45,0.3)"} strokeWidth={1.2} />
                            ))}
                            <text x={14} y={def.h/2-10} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">SCK</text>
                            <text x={14} y={def.h/2} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">MOSI</text>
                            <text x={14} y={def.h/2+10} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">MISO</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">SPI</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">4-Wire Bus</text>
                          </g>
                        )}

                        {node.type === "i2c-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`il${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={18} y1={def.h/2-4} x2={def.w-18} y2={def.h/2-4} stroke="#2D2D2D" strokeWidth={1.2} />
                            <line x1={18} y1={def.h/2+4} x2={def.w-18} y2={def.h/2+4} stroke="#FF9F4C" strokeWidth={1.2} />
                            <circle cx={24} cy={def.h/2-4} r={2} fill="rgba(45,45,45,0.2)" stroke="#2D2D2D" strokeWidth={0.6} />
                            <circle cx={24} cy={def.h/2+4} r={2} fill="rgba(255,159,76,0.2)" stroke="#FF9F4C" strokeWidth={0.6} />
                            <text x={12} y={def.h/2-2} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">SDA</text>
                            <text x={12} y={def.h/2+8} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">SCL</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">I²C</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">2-Wire Bus</text>
                          </g>
                        )}

                        {node.type === "can-bus" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`cl${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={18} y1={def.h/2-3} x2={def.w-18} y2={def.h/2-3} stroke="#2D2D2D" strokeWidth={1.5} />
                            <line x1={18} y1={def.h/2+3} x2={def.w-18} y2={def.h/2+3} stroke="#FF9F4C" strokeWidth={1.5} />
                            <text x={12} y={def.h/2-1} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">CAN_H</text>
                            <text x={12} y={def.h/2+7} fill="rgba(45,45,45,0.3)" fontSize={4} fontFamily="monospace" pointerEvents="none">CAN_L</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">CAN</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Diff. Pair</text>
                          </g>
                        )}

                        {node.type === "usb-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`ul${i}`}><rect x={-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-12} y={def.h/2-8} width={24} height={16} rx={3} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w/2-8} y={def.h/2-4} width={16} height={10} rx={1} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <rect x={def.w/2-5} y={def.h/2-1} width={10} height={4} rx={0.5} fill="rgba(45,45,45,0.08)" />
                            <line x1={def.w/2-3} y1={def.h/2+1} x2={def.w/2+3} y2={def.h/2+1} stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">USB</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Type-A/C</text>
                          </g>
                        )}

                        {node.type === "ethernet-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3,4].map(i => <g key={`el${i}`}><rect x={-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-14} y={def.h/2-10} width={28} height={20} rx={2} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={1} />
                            <rect x={def.w/2-8} y={def.h/2-6} width={16} height={8} rx={1} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.5} />
                            <circle cx={def.w/2-3} cy={def.h/2-2} r={1} fill="#FF9F4C" opacity={0.7} />
                            <circle cx={def.w/2+3} cy={def.h/2-2} r={1} fill="#44FF44" opacity={0.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">ETHERNET</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">RJ-45 PHY</text>
                          </g>
                        )}

                        {node.type === "wifi-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`wl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-10} y={def.h/2-6} width={20} height={12} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${def.w/2} ${def.h/2-4} Q ${def.w/2-6-i*4} ${def.h/2-12-i*4} ${def.w/2-2-i*4} ${def.h/2-18-i*4}`} fill="none" stroke="#FF9F4C" strokeWidth={1} opacity={0.5-i*0.12} />
                            ))}
                            {[0,1,2].map(i => (
                              <path key={i} d={`M ${def.w/2} ${def.h/2-4} Q ${def.w/2+6+i*4} ${def.h/2-12-i*4} ${def.w/2+2+i*4} ${def.h/2-18-i*4}`} fill="none" stroke="#FF9F4C" strokeWidth={1} opacity={0.5-i*0.12} />
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">WiFi</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">2.4/5GHz</text>
                          </g>
                        )}

                        {node.type === "bluetooth-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`bl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-10} y={def.h/2-6} width={20} height={12} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <path d={`M ${def.w/2} ${def.h/2+8} L ${def.w/2} ${def.h/2-2}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M ${def.w/2} ${def.h/2-2} L ${def.w/2-5} ${def.h/2+3}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <path d={`M ${def.w/2} ${def.h/2-2} L ${def.w/2+5} ${def.h/2+3}`} fill="none" stroke="#2D2D2D" strokeWidth={1.5} />
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">BT</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">BLE 5.0</text>
                          </g>
                        )}

                        {node.type === "zigbee-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`zl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            {[0,1,2].map(i => {
                              const cx = def.w/2-12+i*12, cy = def.h/2-2;
                              return <g key={i}><polygon points={`${cx},${cy-6} ${cx+5},${cy-2} ${cx+5},${cy+2} ${cx},${cy+6} ${cx-5},${cy+2} ${cx-5},${cy-2}`} fill="none" stroke="#2D2D2D" strokeWidth={0.8} /><circle cx={cx} cy={cy} r={2} fill="#FF9F4C" opacity={0.4} /></g>;
                            })}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">ZIGBEE</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Mesh Net</text>
                          </g>
                        )}

                        {node.type === "lora-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`ll${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <line x1={def.w/2} y1={def.h/2+10} x2={def.w/2} y2={def.h/2-6} stroke="#2D2D2D" strokeWidth={1.5} />
                            {[0,1,2,3,4].map(i => (
                              <path key={i} d={`M ${def.w/2-14+i*7} ${def.h/2-6} A ${3+i*1.5} ${3+i*1.5} 0 0 0 ${def.w/2-14+i*7+3} ${def.h/2-8-i*2}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.7-i*0.1} />
                            ))}
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">LoRa</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Long Range</text>
                          </g>
                        )}

                        {node.type === "gsm-module" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`gl${i}`}><rect x={-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={16+i*14} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <rect x={def.w/2-12} y={def.h/2-8} width={24} height={16} rx={2} fill="rgba(45,45,45,0.06)" stroke="rgba(45,45,45,0.2)" strokeWidth={0.8} />
                            <line x1={def.w/2-4} y1={def.h/2-8} x2={def.w/2-4} y2={def.h/2-12} stroke="#2D2D2D" strokeWidth={1} />
                            <line x1={def.w/2+4} y1={def.h/2-8} x2={def.w/2+4} y2={def.h/2-12} stroke="#2D2D2D" strokeWidth={1} />
                            {[0,1,2,3].map(i => (
                              <path key={i} d={`M ${def.w/2-4} ${def.h/2-12} A ${4+i*3} ${4+i*3} 0 0 0 ${def.w/2+4} ${def.h/2-12}`} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.6-i*0.1} />
                            ))}
                            <text x={def.w/2} y={def.h/2+2} textAnchor="middle" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">SIM</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">GSM</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">4G/5G Modem</text>
                          </g>
                        )}

                        {node.type === "mqtt-block" && (
                          <g>
                            <rect width={def.w} height={def.h} rx={4} fill="rgba(45,45,45,0.02)" stroke="#2D2D2D" strokeWidth={1.2} />
                            <rect x={8} y={8} width={def.w-16} height={def.h-16} rx={3} fill="rgba(45,45,45,0.04)" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            {[0,1,2,3].map(i => <g key={`ml${i}`}><rect x={-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /><rect x={def.w-3} y={14+i*16} width={6} height={4} rx={1} fill="rgba(45,45,45,0.25)" /></g>)}
                            <circle cx={16} cy={16} r={2} fill="rgba(45,45,45,0.15)" />
                            <circle cx={def.w/2} cy={def.h/2-2} r={12} fill="none" stroke="rgba(45,45,45,0.2)" strokeWidth={1.2} />
                            <text x={def.w/2} y={def.h/2+1} textAnchor="middle" fill="#2D2D2D" fontSize={5} fontWeight={700} fontFamily="monospace" pointerEvents="none">PUB</text>
                            <circle cx={def.w/2-8} cy={def.h/2+12} r={5} fill="none" stroke="rgba(45,45,45,0.15)" strokeWidth={0.8} />
                            <text x={def.w/2-8} y={def.h/2+14} textAnchor="middle" fill="rgba(45,45,45,0.2)" fontSize={4} fontFamily="monospace" pointerEvents="none">SUB</text>
                            <circle cx={def.w/2+8} cy={def.h/2+12} r={5} fill="none" stroke="#FF9F4C" strokeWidth={0.8} opacity={0.5} />
                            <text x={def.w/2+8} y={def.h/2+14} textAnchor="middle" fill="rgba(255,159,76,0.5)" fontSize={4} fontFamily="monospace" pointerEvents="none">BRO</text>
                            <text x={def.w/2} y={12} textAnchor="middle" fill="#2D2D2D" fontSize={7} fontWeight={800} fontFamily="monospace" pointerEvents="none">MQTT</text>
                            <circle cx={def.w-16} cy={16} r={2} fill="#FF9F4C" opacity={0.6} />
                            <text x={def.w/2} y={def.h-4} textAnchor="middle" fill="rgba(45,45,45,0.18)" fontSize={5} fontWeight={600} pointerEvents="none">Pub/Sub IoT</text>
                          </g>
                        )}

                        {/* ─── GateSVG Fallback ─── */}
                        {!isOutput && !["dip-switch", "keypad", "analog-in", "random", "push-button", "tri-led", "traffic-light", "digit-display", "dot-matrix", "ascii-display", "lcd-display", "indicator-panel", "scope-output", "servo-motor", "stepper-motor", "seven-seg-4", "status-led", "voltmeter", "ammeter", "clock-display", "thermometer-out", "tachometer", "power-meter", "data-latch-disp", "signal-analyzer", "dc-motor", "relay", "solenoid", "oled-display", "speaker", "linear-actuator", "robotic-arm", "printer-out", "esc", "motor-driver", "robotic-arm-6dof", "pneumatic-cylinder", "wheel-mecanum", "wheel-omni", "chassis-frame", "industrial-6axis", "scara-arm", "delta-robot", "vfd-drive", "servo-drive", "proximity-switch", "gripper", "gripper-3f", "encoder", "lidar", "imu", "gps-rtk", "bluetooth-rc", "wifi-rc", "pid-controller", "kinematic-solver", "path-planner", "collision-detector", "gimbal", "rover-diff", "tracked-base", "drone-quad", "flight-ctrl", "propeller-motor", "linear-guide", "stepper-nema", "harmonic-drive", "lead-screw", "microcontroller", "cpu-block", "fpga-block", "dsp-block", "npu-block", "gpu-block", "arduino-uno", "arduino-nano", "raspberry-pi", "raspberry-pi-pico", "esp32", "stm32", "ram-block", "rom-block", "eeprom-block", "flash-block", "sram-block", "cache-block", "uart-block", "spi-block", "i2c-block", "can-bus", "usb-block", "ethernet-block", "wifi-block", "bluetooth-block", "zigbee-block", "lora-block", "gsm-module", "mqtt-block", "battery", "adapter", "voltage-regulator", "fuse", "buck-converter", "boost-converter", "bms", "power-switch", "resistor", "capacitor", "inductor", "diode", "zener-diode", "transistor-bjt", "transistor-mosfet", "op-amp", "crystal-osc", "transformer", "mosfet-driver", "relay-module", "plc-controller", "plc-io-module"].includes(node.type) && (
                          <>
                            <GateSVG type={node.type} w={def.w} h={def.h} />

                            {isInput && !["dip-switch", "keypad", "analog-in", "random", "push-button"].includes(node.type) && (
                              <text x={def.w / 2} y={def.h / 2 + 1} textAnchor="middle" dominantBaseline="central"
                                fill="#2D2D2D" fontSize={11} fontWeight={800} fontFamily="monospace" pointerEvents="none">
                                {node.type === "const-0" ? "0" : node.type === "const-1" ? "1" : node.outputs.out ? "1" : "0"}
                              </text>
                            )}

                            {!isInput && !["half-adder", "full-adder", "half-subtractor", "full-subtractor", "mux2", "mux4", "decoder", "d-latch", "d-flipflop"].includes(node.type) && (
                              <text x={def.w / 2} y={def.h + 12} textAnchor="middle" dominantBaseline="central"
                                fill="#2D2D2D" fontSize={8} fontWeight={600} fontFamily="system-ui" pointerEvents="none" opacity={0.5}>
                                {def.label}
                              </text>
                            )}
                          </>
                        )}

                        <NodePorts node={node} onPortDown={handlePortDown} />

                        {SENSOR_TYPE_MAP[node.type as keyof typeof SENSOR_TYPE_MAP] && (() => {
                          const assigned = realSensors.getNodeChannel(node.id);
                          const isConnected = !!assigned;
                          const chanDef = assigned ? SENSOR_CHANNELS[assigned] : null;
                          const displayVal = realSensors.getDisplayValue(node.id);
                          return (
                            <g
                              transform={`translate(${def.w - 6}, -6)`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSensorConnectNode(node.id);
                                setShowSensorConnect(true);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <circle r={5} fill={isConnected ? "#22c55e" : "#555"} stroke={isConnected ? "#86efac" : "#333"} strokeWidth={1.5} />
                              {isConnected && (
                                <text y={1} textAnchor="middle" dominantBaseline="central" fill="#2D2D2D" fontSize={6} fontWeight={900} fontFamily="monospace" pointerEvents="none">R</text>
                              )}
                              {isConnected && displayVal && (
                                <g transform={`translate(${def.w / 2 - (def.w - 6)}, 16)`}>
                                  <rect x={-20} y={-5} width={40} height={11} rx={3} fill="#22c55e20" stroke="#22c55e40" strokeWidth={0.5} />
                                  <text y={1.5} textAnchor="middle" dominantBaseline="central" fill="#22c55e" fontSize={7} fontWeight={700} fontFamily="monospace" pointerEvents="none">
                                    {displayVal}
                                  </text>
                                </g>
                              )}
                              {!isConnected && (
                                <title>Click to connect real sensor</title>
                              )}
                              {isConnected && (
                                <title>Real sensor: {chanDef?.label} ({assigned}) — Click to change</title>
                              )}
                            </g>
                          );
                        })()}
                      </g>
                    );
                  })}
                </g>

                {placing && (
                  <g>
                    <rect x="50%" y="10" width="280" height="28" rx="14" transform="translate(-140, 0)" fill={theme.accent + "12"} stroke={theme.accent + "30"} strokeWidth="1" />
                    <text x="50%" y="28" textAnchor="middle" fill={theme.accent} fontSize={11} fontWeight={600} fontFamily="system-ui" opacity={0.85}>
                      Click to place {GATE_DEFS[placing]?.label} — Esc to cancel
                    </text>
                  </g>
                )}

                {simulated.nodes.length === 0 && !placing && (
                  <g>
                    <rect x="50%" y="50%" width="300" height="80" rx="16" transform="translate(-150, -40)" fill={theme.card + "40"} stroke={theme.border + "30"} strokeWidth="1" strokeDasharray="4 3" />
                    <text x="50%" y="50%" dy="-6" textAnchor="middle" fill={theme.textMuted} fontSize={13} fontFamily="system-ui" fontWeight="500" opacity={0.5}>
                      Your canvas is empty
                    </text>
                    <text x="50%" y="50%" dy="14" textAnchor="middle" fill={theme.textMuted} fontSize={10} fontFamily="system-ui" opacity={0.35}>
                      Pick a component from the palette → click here to place
                    </text>
                  </g>
                )}
              </svg>

              {/* Canvas status */}
              <div className="absolute bottom-3 left-3 flex gap-2 items-center max-sm:flex-col max-sm:items-start">
                <span className="px-3 py-1.5 rounded-xl text-[10px] font-mono border flex items-center gap-2"
                  style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", color: "#6B6B6B", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: simulated.nodes.length > 0 ? "#22c55e" : "rgba(45,45,45,0.2)" }} />
                  {simulated.nodes.length} nodes · {simulated.wires.length} wires · {Math.round(zoom * 100)}%
                  {(() => {
                    const gateCount = simulated.nodes.filter((n) => !["toggle", "const-0", "const-1", "button", "clock", "dip-switch", "keypad", "analog-in", "random", "push-button", "bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph", "tri-led", "traffic-light", "digit-display", "dot-matrix", "ascii-display", "lcd-display", "indicator-panel", "scope-output", "servo-motor", "stepper-motor"].includes(n.type)).length;
                    const inCount = simulated.nodes.filter((n) => ["toggle", "const-0", "const-1", "button", "clock", "dip-switch", "keypad", "analog-in", "random", "push-button"].includes(n.type)).length;
                    const outCount = simulated.nodes.filter((n) => ["bulb", "hex-display", "led", "7-segment", "buzzer", "bar-graph", "tri-led", "traffic-light", "digit-display", "dot-matrix", "ascii-display", "lcd-display", "indicator-panel", "scope-output", "servo-motor", "stepper-motor"].includes(n.type)).length;
                    return (
                      <>
                        <span className="w-px h-3 mx-1" style={{ background: "rgba(0,0,0,0.08)" }} />
                        <span style={{ color: "#9A9A9A" }}>G:{gateCount} I:{inCount} O:{outCount}</span>
                      </>
                    );
                  })()}
                </span>
                {wireFrom && (
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-semibold border"
                    style={{ background: "rgba(255,179,102,0.1)", borderColor: "rgba(255,179,102,0.25)", color: "#FFB366", backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(255,179,102,0.08)" }}>
                    Click an input port to connect — Esc to cancel
                  </span>
                )}
              </div>
              {/* Zoom controls */}
              <div className="absolute bottom-3 right-3 flex gap-1.5 items-center">
                <div className="flex items-center gap-1 p-1 rounded-xl border"
                  style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <button onClick={() => setZoom((z) => Math.min(z * 1.2, 4))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all hover:bg-black/5 active:scale-90"
                    style={{ color: "#6B6B6B" }}>
                    +
                  </button>
                  <button onClick={() => setZoom((z) => Math.max(z * 0.8, 0.15))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all hover:bg-black/5 active:scale-90"
                    style={{ color: "#6B6B6B" }}>
                    −
                  </button>
                  <div className="w-px h-4 mx-0.5" style={{ background: "rgba(0,0,0,0.08)" }} />
                  <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    className="px-2 h-7 rounded-lg flex items-center justify-center text-[9px] font-semibold transition-all hover:bg-black/5 active:scale-90"
                    style={{ color: "#6B6B6B" }}>
                    Fit
                  </button>
                </div>
              </div>
            </div>

            {/* Truth Table Panel */}
            {showTruthTable && (
              <div className="w-48 sm:w-60 md:w-60 lg:w-72 xl:w-80 overflow-auto" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)" }}>
                <TruthTablePanel tt={tt} theme={theme} />
              </div>
            )}
          </div>

          {/* K-Map Panel */}
          {showKMap && (
            <div className="h-48 sm:h-52 border-t overflow-auto" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)" }}>
              <KMapPanel tt={tt} theme={theme} />
            </div>
          )}

          {/* Verilog Panel */}
          {showVerilog && (
            <div className="h-48 sm:h-56 border-t flex flex-col" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b flex-wrap gap-1" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: "#FFB366" }} />
                  <span className="text-[11px] font-bold" style={{ color: "#FF9F4C" }}>
                    {verilogLang === "verilog" ? "Verilog HDL" : "VHDL"}
                  </span>
                  <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <button onClick={() => setVerilogLang("verilog")}
                      className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all",
                        verilogLang === "verilog" ? "text-white" : "")}
                      style={verilogLang === "verilog" ? { background: "rgba(255,179,102,0.2)", color: "#FFB366", boxShadow: "0 0 8px rgba(255,179,102,0.08)" } : { color: "#6B6B6B" }}>
                      Verilog
                    </button>
                    <button onClick={() => setVerilogLang("vhdl")}
                      className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all",
                        verilogLang === "vhdl" ? "text-white" : "")}
                      style={verilogLang === "vhdl" ? { background: "rgba(255,179,102,0.2)", color: "#FFB366", boxShadow: "0 0 8px rgba(255,179,102,0.08)" } : { color: "#6B6B6B" }}>
                      VHDL
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => {
                    navigator.clipboard.writeText(verilogLang === "verilog" ? verilogCode : vhdlCode);
                  }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:bg-white/5"
                    style={{ background: "rgba(255,179,102,0.1)", color: "#FFB366", border: "1px solid rgba(255,179,102,0.15)" }}>
                    Copy
                  </button>
                  <button onClick={() => {
                    const code = verilogLang === "verilog" ? verilogCode : vhdlCode;
                    const ext = verilogLang === "verilog" ? "v" : "vhd";
                    const blob = new Blob([code], { type: "text/plain" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `circuit.${ext}`;
                    a.click();
                  }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:bg-white/5"
                    style={{ background: "rgba(255,179,102,0.1)", color: "#FFB366", border: "1px solid rgba(255,179,102,0.15)" }}>
                    Export
                  </button>
                </div>
              </div>
              <textarea value={verilogLang === "verilog" ? verilogCode : vhdlCode}
                onChange={(e) => verilogLang === "verilog" ? setVerilogCode(e.target.value) : setVhdlCode(e.target.value)}
                className="flex-1 w-full p-3 text-[11px] font-mono resize-none outline-none"
                style={{ background: "#FFFFFF", color: "#2D2D2D" }}
                spellCheck={false} />
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowShortcuts(false)}>
          <div className="w-[380px] max-sm:w-[calc(100vw-2rem)] max-sm:mx-4 rounded-2xl border p-6 shadow-2xl" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: "#FF9F4C" }} />
                <h3 className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>×</button>
            </div>
            <div className="space-y-1.5">
              {[
                ["Delete Selected", "Delete / Backspace"],
                ["Cancel Operation", "Esc"],
                ["Auto Arrange", "Ctrl+Shift+A"],
                ["Save Circuit", "Ctrl+S"],
                ["Duplicate Node", "Ctrl+D"],
                ["Nudge Node", "Arrow Keys"],
                ["Nudge (fine)", "Shift+Arrow"],
                ["Undo", "Ctrl+Z"],
                ["Redo", "Ctrl+Shift+Z / Ctrl+Y"],
                ["Zoom In", "Scroll Up"],
                ["Zoom Out", "Scroll Down"],
                ["Pan Canvas", "Alt+Drag / Middle Drag"],
                ["Place Component", "Click component, then click canvas"],
                ["Connect Wires", "Click output port, then input port"],
                ["Toggle Shortcuts", "?"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-black/3">
                  <span className="text-[11px]" style={{ color: "#2D2D2D" }}>{k}</span>
                  <kbd className="px-2 py-0.5 rounded-md text-[9px] font-mono" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#6B6B6B" }}>{v}</kbd>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t text-[10px] text-center" style={{ borderColor: "rgba(0,0,0,0.08)", color: "#9A9A9A" }}>
              Press <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>?</kbd> to toggle this panel
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowSettings(false)}>
          <div className="w-96 max-sm:w-[calc(100vw-2rem)] max-sm:mx-4 rounded-2xl border p-6 shadow-2xl" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: "#FF9F4C" }} />
                <h3 className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Settings</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "#6B6B6B" }}>Canvas Color</label>
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setSettings((s) => ({ ...s, theme: t.id }))}
                      className={cn("flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all",
                        settings.theme === t.id ? "ring-2" : "")}
                      style={{
                        background: t.canvasBg, borderColor: t.border, color: t.text,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium" style={{ color: "#FF9F4C" }}>Show Grid</label>
                <button onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
                  className={cn("w-9 h-5 rounded-full transition-colors relative", settings.showGrid ? "" : "opacity-50")}
                  style={{ background: settings.showGrid ? "#FF9F4C" : "rgba(45,45,45,0.1)" }}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.showGrid ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2" style={{ color: "#6B6B6B" }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
                Keyboard Shortcuts
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]" style={{ color: "#6B6B6B" }}>
                {[
                  ["Delete Selected", "Delete"], ["Cancel", "Esc"],
                  ["Auto Arrange", "Ctrl+Shift+A"], ["Save Circuit", "Ctrl+S"],
                  ["Duplicate Node", "Ctrl+D"], ["Nudge", "Arrows"],
                  ["Zoom In", "Scroll Up"], ["Zoom Out", "Scroll Down"], ["Pan", "Alt+Drag"],
                ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1 px-1 rounded-md hover:bg-black/3">
                    <span>{k}</span>
                    <kbd className="px-1.5 py-0.5 rounded-md text-[9px] font-mono" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#6B6B6B" }}>{v}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowTemplates(false)}>
          <div className="w-[700px] max-sm:w-[calc(100vw-1rem)] max-sm:mx-2 max-h-[90vh] sm:max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 25px 60px -12px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 rounded-full" style={{ background: "#FF9F4C" }} />
                <h3 className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Circuit Templates</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: "rgba(255,159,76,0.12)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.15)" }}>{TEMPLATES.length} templates</span>
              </div>
              <button onClick={() => setShowTemplates(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>×</button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-5 py-2.5 border-b overflow-x-auto" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <button onClick={() => setTemplateCategory("All")}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                  templateCategory === "All" ? "text-white" : "")}
                    style={templateCategory === "All" ? { background: "#FF9F4C", color: "white", boxShadow: "0 0 12px rgba(255,159,76,0.2)" } : { color: "#6B6B6B" }}>
                All ({TEMPLATES.length})
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = TEMPLATES.filter((t) => t.category === cat).length;
                return (
                  <button key={cat} onClick={() => setTemplateCategory(cat)}
                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                      templateCategory === cat ? "text-white" : "")}
                    style={templateCategory === cat ? { background: "#FF9F4C", color: "white", boxShadow: "0 0 12px rgba(255,159,76,0.2)" } : { color: "#6B6B6B" }}>
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Templates grid */}
            <div className="flex-1 overflow-y-auto p-5 logic-panel">
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
                {TEMPLATES
                  .filter((t) => templateCategory === "All" || t.category === templateCategory)
                  .map((template) => (
                    <button key={template.id} onClick={() => loadTemplate(template.id)}
                      className="text-left p-3 sm:p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                      style={{ background: "rgba(45,45,45,0.3)", borderColor: "rgba(0,0,0,0.08)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full transition-all group-hover:scale-125" style={{ background: "#FF9F4C" }} />
                        <span className="text-[12px] font-bold" style={{ color: "#FF9F4C" }}>{template.name}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: "#6B6B6B" }}>{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded-md text-[8px] font-semibold"
                            style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.12)" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Sensor Connect Modal */}
      {showSensorConnect && sensorConnectNode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setShowSensorConnect(false)}>
          <div className="w-[480px] max-sm:w-[calc(100vw-1rem)] max-sm:mx-2 rounded-2xl border p-4 sm:p-6 shadow-2xl" style={{ background: "#FFF8F0", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <h3 className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Connect Real Sensor</h3>
              </div>
              <button onClick={() => setShowSensorConnect(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: "#6B6B6B" }}>×</button>
            </div>

            <p className="text-[11px] mb-4" style={{ color: "#6B6B6B" }}>
              Map a real hardware sensor channel to this component. Connect via Serial or WebSocket first.
            </p>

            <div className="rounded-xl p-3.5 mb-4 border" style={{ background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Connection</span>
                <div className="flex gap-1.5">
                  <button onClick={() => realSensors.connectSerial()}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:bg-white/5"
                    style={{ borderColor: "rgba(0,0,0,0.08)", color: "#6B6B6B" }}>
                    USB Serial
                  </button>
                  <button onClick={() => {
                    const url = prompt("WebSocket URL:", "ws://localhost:8765");
                    if (url) realSensors.connectWebSocket(url);
                  }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:bg-black/3"
                    style={{ borderColor: "rgba(0,0,0,0.08)", color: "#6B6B6B" }}>
                    WebSocket
                  </button>
                  <button onClick={() => realSensors.disconnect()}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:bg-red-500/5"
                    style={{ borderColor: "#ef444440", color: "#ef4444" }}>
                    Disconnect
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", realSensors.connected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
                <span className="text-[10px] font-mono" style={{ color: "#6B6B6B" }}>
                  {realSensors.connected ? `Connected (${realSensors.connectionType === "serial" ? "USB Serial" : "WebSocket"})` : "Not connected"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-2.5" style={{ color: "#6B6B6B" }}>Assign Channel</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 logic-panel">
                {(Object.keys(SENSOR_CHANNELS) as SensorChannel[]).map((ch) => {
                  const def = SENSOR_CHANNELS[ch];
                  const assigned = realSensors.getNodeChannel(sensorConnectNode) === ch;
                  return (
                    <button key={ch} onClick={() => {
                      realSensors.assignChannel(sensorConnectNode, ch);
                      setRealSensorTick((t) => t + 1);
                    }}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium border transition-all duration-200 text-left",
                        assigned ? "ring-1" : "border-transparent hover:bg-white/5")}
                      style={{
                        background: assigned ? "linear-gradient(135deg, rgba(255,159,76,0.12), rgba(255,159,76,0.03))" : "rgba(0,0,0,0.03)",
                        borderColor: assigned ? "rgba(255,159,76,0.35)" : "transparent",
                        color: assigned ? "#FF9F4C" : "#6B6B6B",
                        boxShadow: assigned ? "0 0 12px rgba(255,159,76,0.08)" : undefined,
                      }}>
                      <span className="font-mono text-[9px]" style={{ color: "#9A9A9A" }}>{ch}</span>
                      <span>{def.label}</span>
                      <span className="ml-auto text-[9px]" style={{ color: "#9A9A9A" }}>{def.bits}b</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {realSensors.getNodeChannel(sensorConnectNode) && (
              <button onClick={() => {
                realSensors.unassignChannel(sensorConnectNode);
                setRealSensorTick((t) => t + 1);
              }}
                className="w-full px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all hover:bg-red-500/10"
                style={{ borderColor: "#ef444440", color: "#ef4444", background: "rgba(239,68,68,0.04)" }}>
                Disconnect Sensor Channel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaletteCategory({ category, gates, placing, onSelect, theme, defaultOpen }: {
  category: string; gates: ReturnType<typeof Object.values>[0][]; placing: string | null;
  onSelect: (t: GateType) => void; theme: AppTheme; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || category === "Logic Gates");
  const catColor = GATE_COLORS[category] || "#9A9A9A";
  const catColors: Record<string, string> = {
    "Input Controls": "#FF9F4C", "Output Controls": "#FF9F4C", "Logic Gates": "#2D2D2D",
    Combinational: "#2D2D2D", Sequential: "#2D2D2D", Sensors: "#FF9F4C", Processors: "#2D2D2D",
    Memory: "#2D2D2D", Communication: "#2D2D2D", Power: "#FF9F4C", Electronic: "#2D2D2D",
    Actuators: "#2D2D2D", Boards: "#FF9F4C", Robotics: "#2D2D2D", Industrial: "#2D2D2D",
  };
  const activeColor = catColors[category] || catColor;
  return (
    <div className="mb-0.5">
      <button onClick={() => setOpen(!open)}
        className="logic-cat-header w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg mx-1"
        style={{ color: open ? activeColor : "#6B6B6B", width: "calc(100% - 8px)" }}>
        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: open ? activeColor + "15" : "rgba(0,0,0,0.04)", border: `1px solid ${open ? activeColor + "25" : "rgba(0,0,0,0.08)"}` }}>
          <svg className={cn("w-2.5 h-2.5 transition-transform duration-200", open && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <span className="flex-1 text-left">{category}</span>
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md min-w-[20px] text-center"
          style={{ background: open ? activeColor + "12" : "rgba(0,0,0,0.04)", color: open ? activeColor : "#6B6B6B", border: `1px solid ${open ? activeColor + "20" : "transparent"}` }}>
          {gates.length}
        </span>
      </button>
      {open && (
        <div className="px-2 pb-1.5 pt-0.5 space-y-0.5">
          {gates.map((g) => {
            const active = placing === g.type;
            return (
              <button key={g.type} onClick={() => onSelect(g.type)}
                className={cn("logic-palette-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-medium border group",
                  active ? "border-current" : "border-transparent")}
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(255,159,76,0.14), rgba(255,159,76,0.04))"
                    : undefined,
                  color: active ? "#FF9F4C" : "#6B6B6B",
                  boxShadow: active ? "0 0 12px rgba(255,159,76,0.08), inset 0 1px 0 rgba(255,159,76,0.1)" : undefined,
                }}>
                <span className="w-9 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: active ? "rgba(255,159,76,0.08)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${active ? "rgba(255,159,76,0.3)" : "rgba(0,0,0,0.08)"}`,
                    boxShadow: active ? "0 0 8px rgba(255,159,76,0.1)" : undefined,
                  }}>
                  <svg width={36} height={32} viewBox="0 0 32 28">
                    <GateSVG type={g.type} w={g.w * 0.32} h={g.h * 0.4} />
                  </svg>
                </span>
                <span className="truncate leading-tight">{g.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TruthTablePanel({ tt, theme }: { tt: ReturnType<typeof generateTruthTable>; theme: AppTheme }) {
  if (tt.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4" style={{ color: "#9A9A9A" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg className="w-6 h-6 opacity-25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>
        </div>
        <p className="text-xs font-medium mb-0.5">No inputs or outputs</p>
        <p className="text-[10px] opacity-50">Add Switch/Input and Bulb/LED components</p>
      </div>
    );
  }
  const inputs = tt.inputNodes || [];
  const outputs = tt.outputNodes || [];
  const activeRow = tt.activeRowIndex ?? -1;
  const currentOutputs = tt.currentOutputs || {};
  return (
    <div className="p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-2.5 shrink-0">
        <div className="w-1 h-3.5 rounded-full" style={{ background: "#FF9F4C" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#FF9F4C" }}>Truth Table</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(255,159,76,0.12)", color: "#FF9F4C", border: "1px solid rgba(255,159,76,0.15)" }}>{tt.rows.length} rows</span>
        {activeRow >= 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.15)" }}>LIVE</span>
        )}
      </div>
      <div className="flex-1 overflow-auto logic-panel rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <table className="w-full text-[10px] border-collapse">
          <thead className="sticky top-0">
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)" }}>
              <th className="px-2.5 py-2 text-left font-bold" style={{ color: "#6B6B6B" }}>#</th>
              {inputs.map((n) => <th key={n.id} className="px-2.5 py-2 text-center font-bold" style={{ color: "#2D2D2D" }}>{n.id.slice(0, 5)}</th>)}
              <th className="w-px" style={{ background: "rgba(0,0,0,0.08)" }} />
              {outputs.map((n) => <th key={n.id} className="px-2.5 py-2 text-center font-bold" style={{ color: "#FF9F4C" }}>{n.id.slice(0, 5)}</th>)}
            </tr>
          </thead>
          <tbody>
            {tt.rows.map((row, i) => {
              const isActive = i === activeRow;
              return (
                <tr key={i} style={{
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  background: isActive
                    ? "rgba(255,159,76,0.10)"
                    : i % 2 ? "rgba(0,0,0,0.02)" : undefined,
                  transition: "background 0.3s ease",
                }}>
                  <td className="px-2.5 py-1.5 font-mono" style={{ color: isActive ? "#E8852E" : "#9A9A9A", fontWeight: isActive ? 700 : 400 }}>{i}</td>
                  {inputs.map((n) => {
                    const val = row.inputs[n.id];
                    const isActiveInput = isActive;
                    return (
                      <td key={n.id} className="px-2.5 py-1.5 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-mono font-bold text-[10px]"
                          style={{
                            background: isActiveInput && val
                              ? "rgba(255,159,76,0.18)"
                              : val ? "rgba(45,45,45,0.06)" : "transparent",
                            color: isActiveInput ? "#E8852E" : val ? "#2D2D2D" : "#9A9A9A",
                            boxShadow: isActiveInput ? "0 0 6px rgba(255,159,76,0.12)" : undefined,
                          }}>
                          {val ? "1" : "0"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="w-px" style={{ background: "rgba(0,0,0,0.06)" }} />
                  {outputs.map((n) => {
                    const val = row.outputs[n.id];
                    const liveVal = currentOutputs[n.id];
                    return (
                      <td key={n.id} className="px-2.5 py-1.5 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md font-mono font-bold text-[10px]"
                          style={{
                            background: isActive
                              ? val ? "rgba(255,159,76,0.25)" : "rgba(255,159,76,0.06)"
                              : val ? "rgba(255,159,76,0.15)" : "transparent",
                            color: isActive ? "#E8852E" : val ? "#FF9F4C" : "#9A9A9A",
                            boxShadow: isActive ? "0 0 6px rgba(255,159,76,0.12)" : undefined,
                          }}>
                          {val ? "1" : "0"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KMapPanel({ tt, theme }: { tt: ReturnType<typeof generateTruthTable>; theme: AppTheme }) {
  if (tt.rows.length === 0 || !tt.inputNodes || tt.inputNodes.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4" style={{ color: "#9A9A9A" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg className="w-5 h-5 opacity-25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>
        </div>
        <p className="text-xs font-medium mb-0.5">K-Map requires at least 2 inputs</p>
        <p className="text-[10px] opacity-50">Add at least 2 Switch/Input components</p>
      </div>
    );
  }

  const n = Math.min(tt.inputNodes.length, 4);
  const vars = tt.inputNodes.slice(0, n);
  const outNode = tt.outputNodes?.[0];

  const grayCode = (bits: number): number[] => {
    if (bits === 1) return [0, 1];
    const prev = grayCode(bits - 1);
    return [...prev, ...prev.reverse().map((v) => v + (1 << (bits - 1)))];
  };

  const rows = n <= 2 ? 2 : 4;
  const cols = n <= 2 ? 2 : 4;
  const rowCode = grayCode(Math.log2(rows));
  const colCode = grayCode(Math.log2(cols));

  const currentInputs = tt.currentInputs || {};
  const activeRowIdx = tt.activeRowIndex ?? -1;

  const getVal = (r: number, c: number): boolean => {
    const idx = (r << Math.log2(cols)) | c;
    const match = tt.rows[idx];
    return match && outNode ? !!match.outputs[outNode.id] : false;
  };

  const isCellActive = (r: number, c: number): boolean => {
    if (activeRowIdx < 0) return false;
    const idx = (r << Math.log2(cols)) | c;
    return idx === activeRowIdx;
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1 h-3.5 rounded-full" style={{ background: "#FF9F4C" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#FF9F4C" }}>Karnaugh Map</span>
        {activeRowIdx >= 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(76,175,80,0.12)", color: "#4CAF50", border: "1px solid rgba(76,175,80,0.15)" }}>LIVE</span>
        )}
      </div>
      <div className="inline-flex flex-col rounded-lg p-2" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex">
          <div className="w-10 h-8" />
          {colCode.map((c) => (
            <div key={c} className="w-10 h-8 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: "#6B6B6B" }}>
              {c.toString(2).padStart(Math.log2(cols), "0")}
            </div>
          ))}
        </div>
        {rowCode.map((r, ri) => (
          <div key={r} className="flex">
            <div className="w-10 h-8 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: "#6B6B6B" }}>
              {r.toString(2).padStart(Math.log2(rows), "0")}
            </div>
            {colCode.map((c, ci) => {
              const val = getVal(ri, ci);
              const active = isCellActive(ri, ci);
              return (
                <div key={c} className="w-10 h-8 flex items-center justify-center rounded-lg m-0.5 text-[11px] font-mono font-bold transition-all duration-200"
                  style={{
                    background: active
                      ? val ? "linear-gradient(135deg, rgba(255,159,76,0.35), rgba(232,133,46,0.25))" : "rgba(255,159,76,0.12)"
                      : val ? "linear-gradient(135deg, rgba(255,159,76,0.2), rgba(255,159,76,0.1))" : "rgba(0,0,0,0.03)",
                    color: active ? "#E8852E" : val ? "#FF9F4C" : "#9A9A9A",
                    border: `1px solid ${active ? "rgba(232,133,46,0.45)" : val ? "rgba(255,159,76,0.25)" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: active ? "0 0 12px rgba(255,159,76,0.18), inset 0 0 6px rgba(255,159,76,0.08)" : val ? "0 0 8px rgba(255,159,76,0.08)" : undefined,
                    transform: active ? "scale(1.08)" : undefined,
                  }}>
                  {val ? "1" : "0"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
