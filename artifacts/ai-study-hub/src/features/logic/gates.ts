import type { GateDef, GateDefMap } from "./types";

export const GATE_DEFS: GateDefMap = {
  input: {
    type: "input",
    label: "Input",
    category: "Input / Output",
    inputs: [],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 80,
    height: 50,
  },
  output: {
    type: "output",
    label: "Output",
    category: "Input / Output",
    inputs: [{ id: "in", label: "Q", side: "left" }],
    outputs: [],
    width: 80,
    height: 50,
  },
  not: {
    type: "not",
    label: "NOT",
    category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 90,
    height: 54,
  },
  and: {
    type: "and",
    label: "AND",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  or: {
    type: "or",
    label: "OR",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  nand: {
    type: "nand",
    label: "NAND",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  nor: {
    type: "nor",
    label: "NOR",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  xor: {
    type: "xor",
    label: "XOR",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  xnor: {
    type: "xnor",
    label: "XNOR",
    category: "Logic Gates",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 100,
    height: 60,
  },
  buffer: {
    type: "buffer",
    label: "Buffer",
    category: "Logic Gates",
    inputs: [{ id: "a", label: "A", side: "left" }],
    outputs: [{ id: "out", label: "Q", side: "right" }],
    width: 90,
    height: 54,
  },
  "half-adder": {
    type: "half-adder",
    label: "Half Adder",
    category: "Combinational",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [
      { id: "sum", label: "S", side: "right" },
      { id: "cout", label: "C", side: "right" },
    ],
    width: 110,
    height: 70,
  },
  "full-adder": {
    type: "full-adder",
    label: "Full Adder",
    category: "Combinational",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
      { id: "cin", label: "Cᵢ", side: "left" },
    ],
    outputs: [
      { id: "sum", label: "S", side: "right" },
      { id: "cout", label: "C₀", side: "right" },
    ],
    width: 110,
    height: 80,
  },
  "half-subtractor": {
    type: "half-subtractor",
    label: "Half Sub",
    category: "Combinational",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [
      { id: "diff", label: "D", side: "right" },
      { id: "borrow", label: "B₀", side: "right" },
    ],
    width: 110,
    height: 70,
  },
  "full-subtractor": {
    type: "full-subtractor",
    label: "Full Sub",
    category: "Combinational",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
      { id: "bin", label: "Bᵢ", side: "left" },
    ],
    outputs: [
      { id: "diff", label: "D", side: "right" },
      { id: "borrow", label: "B₀", side: "right" },
    ],
    width: 110,
    height: 80,
  },
  mux2: {
    type: "mux2",
    label: "2:1 MUX",
    category: "Combinational",
    inputs: [
      { id: "i0", label: "I₀", side: "left" },
      { id: "i1", label: "I₁", side: "left" },
      { id: "sel", label: "S", side: "left" },
    ],
    outputs: [{ id: "out", label: "Y", side: "right" }],
    width: 100,
    height: 80,
  },
  decoder: {
    type: "decoder",
    label: "2:4 Dec",
    category: "Combinational",
    inputs: [
      { id: "a", label: "A", side: "left" },
      { id: "b", label: "B", side: "left" },
    ],
    outputs: [
      { id: "o0", label: "D₀", side: "right" },
      { id: "o1", label: "D₁", side: "right" },
      { id: "o2", label: "D₂", side: "right" },
      { id: "o3", label: "D₃", side: "right" },
    ],
    width: 100,
    height: 90,
  },
  "d-latch": {
    type: "d-latch",
    label: "D-Latch",
    category: "Sequential",
    inputs: [
      { id: "d", label: "D", side: "left" },
      { id: "en", label: "EN", side: "left" },
    ],
    outputs: [
      { id: "q", label: "Q", side: "right" },
      { id: "qn", label: "Q̄", side: "right" },
    ],
    width: 100,
    height: 70,
  },
  "d-flipflop": {
    type: "d-flipflop",
    label: "D FF",
    category: "Sequential",
    inputs: [
      { id: "d", label: "D", side: "left" },
      { id: "clk", label: "CLK", side: "left" },
    ],
    outputs: [
      { id: "q", label: "Q", side: "right" },
      { id: "qn", label: "Q̄", side: "right" },
    ],
    width: 100,
    height: 70,
  },
};

export function getPortPos(
  nodeX: number,
  nodeY: number,
  nodeType: string,
  portId: string,
  side: "left" | "right"
): { x: number; y: number } {
  const def = GATE_DEFS[nodeType];
  if (!def) return { x: nodeX, y: nodeY };

  const ports = side === "left" ? def.inputs : def.outputs;
  const idx = ports.findIndex((p) => p.id === portId);
  if (idx === -1) return { x: nodeX + (side === "left" ? 0 : def.width), y: nodeY + def.height / 2 };

  const spacing = def.height / (ports.length + 1);
  const py = nodeY + spacing * (idx + 1);
  const px = nodeX + (side === "left" ? 0 : def.width);

  return { x: px, y: py };
}
