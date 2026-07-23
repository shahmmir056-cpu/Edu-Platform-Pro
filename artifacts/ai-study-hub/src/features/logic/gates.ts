import type { GateDef, GateType } from "./types";

export const GATE_DEFS: Record<GateType, GateDef> = {
  "const-0": {
    type: "const-0", label: "0", category: "Input Controls",
    inputs: [], outputs: [{ id: "out", label: "0", side: "right" }], w: 60, h: 40,
  },
  "const-1": {
    type: "const-1", label: "1", category: "Input Controls",
    inputs: [], outputs: [{ id: "out", label: "1", side: "right" }], w: 60, h: 40,
  },
  toggle: {
    type: "toggle", label: "Switch", category: "Input Controls",
    inputs: [], outputs: [{ id: "out", label: "Q", side: "right" }], w: 70, h: 44,
  },
  button: {
    type: "button", label: "Button", category: "Input Controls",
    inputs: [], outputs: [{ id: "out", label: "Q", side: "right" }], w: 70, h: 44,
  },
  clock: {
    type: "clock", label: "Clock", category: "Input Controls",
    inputs: [], outputs: [{ id: "out", label: "CLK", side: "right" }], w: 70, h: 44,
  },
  bulb: {
    type: "bulb", label: "Bulb", category: "Output Controls",
    inputs: [{ id: "in", label: "A", side: "left" }], outputs: [], w: 60, h: 50,
  },
  "hex-display": {
    type: "hex-display", label: "Hex Display", category: "Output Controls",
    inputs: [
      { id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" },
      { id: "c", label: "C", side: "left" }, { id: "d", label: "D", side: "left" },
    ], outputs: [], w: 70, h: 60,
  },
  led: {
    type: "led", label: "LED", category: "Output Controls",
    inputs: [{ id: "r", label: "R", side: "left" }, { id: "g", label: "G", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [], w: 60, h: 56,
  },
  buffer: {
    type: "buffer", label: "Buffer", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }], outputs: [{ id: "out", label: "Q", side: "right" }], w: 80, h: 48,
  },
  not: {
    type: "not", label: "NOT", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }], outputs: [{ id: "out", label: "Q", side: "right" }], w: 80, h: 48,
  },
  and: {
    type: "and", label: "AND", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  nand: {
    type: "nand", label: "NAND", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  or: {
    type: "or", label: "OR", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  nor: {
    type: "nor", label: "NOR", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  xor: {
    type: "xor", label: "XOR", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  xnor: {
    type: "xnor", label: "XNOR", category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }], w: 90, h: 52,
  },
  "half-adder": {
    type: "half-adder", label: "Half Adder", category: "Combinational",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "sum", label: "Sum", side: "right" }, { id: "cout", label: "Cout", side: "right" }], w: 100, h: 64,
  },
  "full-adder": {
    type: "full-adder", label: "Full Adder", category: "Combinational",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }, { id: "cin", label: "Cin", side: "left" }],
    outputs: [{ id: "sum", label: "Sum", side: "right" }, { id: "cout", label: "Cout", side: "right" }], w: 100, h: 72,
  },
  "half-subtractor": {
    type: "half-subtractor", label: "Half Sub", category: "Combinational",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "diff", label: "D", side: "right" }, { id: "borrow", label: "Bout", side: "right" }], w: 100, h: 64,
  },
  "full-subtractor": {
    type: "full-subtractor", label: "Full Sub", category: "Combinational",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }, { id: "bin", label: "Bin", side: "left" }],
    outputs: [{ id: "diff", label: "D", side: "right" }, { id: "borrow", label: "Bout", side: "right" }], w: 100, h: 72,
  },
  mux2: {
    type: "mux2", label: "2:1 MUX", category: "Combinational",
    inputs: [{ id: "i0", label: "I0", side: "left" }, { id: "i1", label: "I1", side: "left" }, { id: "sel", label: "S", side: "left" }],
    outputs: [{ id: "out", label: "Y", side: "right" }], w: 90, h: 68,
  },
  mux4: {
    type: "mux4", label: "4:1 MUX", category: "Combinational",
    inputs: [{ id: "i0", label: "I0", side: "left" }, { id: "i1", label: "I1", side: "left" }, { id: "i2", label: "I2", side: "left" }, { id: "i3", label: "I3", side: "left" }, { id: "s0", label: "S0", side: "left" }, { id: "s1", label: "S1", side: "left" }],
    outputs: [{ id: "out", label: "Y", side: "right" }], w: 100, h: 90,
  },
  decoder: {
    type: "decoder", label: "2:4 Decoder", category: "Combinational",
    inputs: [{ id: "a", label: "A", side: "left" }, { id: "b", label: "B", side: "left" }],
    outputs: [{ id: "o0", label: "D0", side: "right" }, { id: "o1", label: "D1", side: "right" }, { id: "o2", label: "D2", side: "right" }, { id: "o3", label: "D3", side: "right" }], w: 100, h: 80,
  },
  "d-latch": {
    type: "d-latch", label: "D-Latch", category: "Sequential",
    inputs: [{ id: "d", label: "D", side: "left" }, { id: "en", label: "EN", side: "left" }],
    outputs: [{ id: "q", label: "Q", side: "right" }, { id: "qn", label: "Q'", side: "right" }], w: 90, h: 60,
  },
  "d-flipflop": {
    type: "d-flipflop", label: "D Flip-Flop", category: "Sequential",
    inputs: [{ id: "d", label: "D", side: "left" }, { id: "clk", label: "CLK", side: "left" }],
    outputs: [{ id: "q", label: "Q", side: "right" }, { id: "qn", label: "Q'", side: "right" }], w: 90, h: 60,
  },
};

export function portPos(
  nx: number, ny: number, gtype: GateType, portId: string, side: "left" | "right"
): { x: number; y: number } {
  const def = GATE_DEFS[gtype];
  if (!def) return { x: nx, y: ny };
  const ports = side === "left" ? def.inputs : def.outputs;
  const idx = ports.findIndex((p) => p.id === portId);
  if (idx === -1) return { x: nx + (side === "left" ? 0 : def.w), y: ny + def.h / 2 };
  const gap = def.h / (ports.length + 1);
  return {
    x: nx + (side === "left" ? 0 : def.w),
    y: ny + gap * (idx + 1),
  };
}

export const CATEGORIES = ["Input Controls", "Output Controls", "Logic Gates", "Combinational", "Sequential"] as const;
