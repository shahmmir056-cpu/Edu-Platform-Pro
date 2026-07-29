import type { Circuit, CircuitNode, Wire, GateType } from "./types";
import { GATE_DEFS } from "./gates";

let _tid = 9000;
const tuid = () => `t${_tid++}`;

function makeNode(type: GateType, x: number, y: number, id?: string): CircuitNode {
  const def = GATE_DEFS[type];
  const inputs: Record<string, boolean> = {};
  const outputs: Record<string, boolean> = {};
  def.inputs.forEach((p) => { inputs[p.id] = false; });
  def.outputs.forEach((p) => { outputs[p.id] = false; });
  if (type === "const-1") outputs.out = true;
  return { id: id || tuid(), type, x, y, inputs, outputs };
}
function makeNodeOn(type: GateType, x: number, y: number, id?: string): CircuitNode {
  const n = makeNode(type, x, y, id);
  n.outputs.out = true;
  return n;
}

function makeWire(fromNode: string, fromPort: string, toNode: string, toPort: string): Wire {
  return { id: tuid(), fromNode, fromPort, toNode, toPort };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  build: () => Circuit;
}

function basicGate(type: GateType, name: string, desc: string, tags: string[]): Template {
  return {
    id: type, name, description: desc, category: "Basic Gates", tags,
    build: () => ({
      nodes: [makeNode("toggle", 60, 60, "SW"), makeNode(type, 260, 50, "G"), makeNode("bulb", 460, 60, "OUT")],
      wires: [makeWire("SW", "out", "G", "a"), makeWire("G", "out", "OUT", "in")],
    }),
  };
}

function twoInputGate(type: GateType, name: string, desc: string, tags: string[]): Template {
  return {
    id: type + "-2in", name, description: desc, category: "Basic Gates", tags,
    build: () => ({
      nodes: [
        makeNode("toggle", 60, 40, "A"), makeNode("toggle", 60, 140, "B"),
        makeNode(type, 260, 60, "G"), makeNode("bulb", 460, 80, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "G", "a"), makeWire("B", "out", "G", "b"),
        makeWire("G", "out", "OUT", "in"),
      ],
    }),
  };
}

export const TEMPLATES: Template[] = [
  // ─── BASIC GATES ────────────────────────────────────────────
  basicGate("buffer", "Buffer", "Output equals input", ["buffer"]),
  basicGate("not", "NOT Gate", "Inverts the input", ["inverter"]),
  twoInputGate("and", "AND Gate", "HIGH when both inputs HIGH", ["product"]),
  twoInputGate("or", "OR Gate", "HIGH when any input HIGH", ["sum"]),
  twoInputGate("nand", "NAND Gate", "Universal gate — NOT of AND", ["universal"]),
  twoInputGate("nor", "NOR Gate", "Universal gate — NOT of OR", ["universal"]),
  twoInputGate("xor", "XOR Gate", "HIGH when inputs differ", ["parity"]),
  twoInputGate("xnor", "XNOR Gate", "HIGH when inputs equal", ["equivalence"]),

  // ─── BASIC COMBINATIONS ─────────────────────────────────────
  {
    id: "not-and", name: "NOT-AND (NAND from gates)", description: "Constructs NAND from NOT + AND",
    category: "Basic Gates", tags: ["nand", "from-gates", "decomposition"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 140, "B"),
        makeNode("and", 200, 50, "G"), makeNode("not", 360, 55, "N"), makeNode("bulb", 500, 60, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "G", "a"), makeWire("B", "out", "G", "b"),
        makeWire("G", "out", "N", "a"), makeWire("N", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "or-from-nand", name: "OR from NANDs", description: "Constructs OR gate using only NAND gates (De Morgan)",
    category: "Basic Gates", tags: ["or", "universal", "de-morgan"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 160, "B"),
        makeNode("nand", 200, 30, "N1"), makeNode("nand", 200, 130, "N2"),
        makeNode("nand", 400, 70, "N3"), makeNode("bulb", 560, 80, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "N1", "a"), makeWire("A", "out", "N1", "b"),
        makeWire("B", "out", "N2", "a"), makeWire("B", "out", "N2", "b"),
        makeWire("N1", "out", "N3", "a"), makeWire("N2", "out", "N3", "b"),
        makeWire("N3", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "and-from-nor", name: "AND from NORs", description: "Constructs AND gate using only NOR gates (De Morgan)",
    category: "Basic Gates", tags: ["and", "universal", "de-morgan"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 160, "B"),
        makeNode("nor", 200, 30, "N1"), makeNode("nor", 200, 130, "N2"),
        makeNode("nor", 400, 70, "N3"), makeNode("bulb", 560, 80, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "N1", "a"), makeWire("A", "out", "N1", "b"),
        makeWire("B", "out", "N2", "a"), makeWire("B", "out", "N2", "b"),
        makeWire("N1", "out", "N3", "a"), makeWire("N2", "out", "N3", "b"),
        makeWire("N3", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "xor-from-nand", name: "XOR from NANDs", description: "XOR gate constructed from 4 NAND gates",
    category: "Basic Gates", tags: ["xor", "universal", "4-nand"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 200, "B"),
        makeNode("nand", 220, 40, "N1"), makeNode("nand", 220, 140, "N2"),
        makeNode("nand", 220, 240, "N3"), makeNode("nand", 400, 120, "N4"),
        makeNode("bulb", 560, 130, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "N1", "a"), makeWire("B", "out", "N1", "b"),
        makeWire("N1", "out", "N2", "a"), makeWire("B", "out", "N2", "b"),
        makeWire("N1", "out", "N3", "a"), makeWire("A", "out", "N3", "b"),
        makeWire("N2", "out", "N4", "a"), makeWire("N3", "out", "N4", "b"),
        makeWire("N4", "out", "OUT", "in"),
      ],
    }),
  },

  // ─── ARITHMETIC ─────────────────────────────────────────────
  {
    id: "half-adder", name: "Half Adder", description: "Adds two 1-bit numbers → Sum + Carry",
    category: "Arithmetic", tags: ["adder", "half-adder"],
    build: () => ({
      nodes: [
        makeNode("toggle", 60, 40, "A"), makeNode("toggle", 60, 160, "B"),
        makeNode("half-adder", 240, 60, "HA"),
        makeNode("bulb", 460, 50, "SUM"), makeNode("bulb", 460, 120, "CARRY"),
      ],
      wires: [
        makeWire("A", "out", "HA", "a"), makeWire("B", "out", "HA", "b"),
        makeWire("HA", "sum", "SUM", "in"), makeWire("HA", "cout", "CARRY", "in"),
      ],
    }),
  },
  {
    id: "full-adder", name: "Full Adder", description: "Adds two bits + carry-in → Sum + Carry-out",
    category: "Arithmetic", tags: ["adder", "full-adder", "carry"],
    build: () => ({
      nodes: [
        makeNode("toggle", 60, 30, "A"), makeNode("toggle", 60, 120, "B"), makeNode("toggle", 60, 210, "Cin"),
        makeNode("full-adder", 240, 60, "FA"),
        makeNode("bulb", 460, 50, "SUM"), makeNode("bulb", 460, 120, "COUT"),
      ],
      wires: [
        makeWire("A", "out", "FA", "a"), makeWire("B", "out", "FA", "b"), makeWire("Cin", "out", "FA", "cin"),
        makeWire("FA", "sum", "SUM", "in"), makeWire("FA", "cout", "COUT", "in"),
      ],
    }),
  },
  {
    id: "half-subtractor", name: "Half Subtractor", description: "Subtracts two bits → Difference + Borrow",
    category: "Arithmetic", tags: ["subtractor", "half-subtractor"],
    build: () => ({
      nodes: [
        makeNode("toggle", 60, 40, "A"), makeNode("toggle", 60, 160, "B"),
        makeNode("half-subtractor", 240, 60, "HS"),
        makeNode("bulb", 460, 50, "DIFF"), makeNode("bulb", 460, 120, "BORROW"),
      ],
      wires: [
        makeWire("A", "out", "HS", "a"), makeWire("B", "out", "HS", "b"),
        makeWire("HS", "diff", "DIFF", "in"), makeWire("HS", "borrow", "BORROW", "in"),
      ],
    }),
  },
  {
    id: "full-subtractor", name: "Full Subtractor", description: "Subtracts with borrow-in",
    category: "Arithmetic", tags: ["subtractor", "full-subtractor"],
    build: () => ({
      nodes: [
        makeNode("toggle", 60, 30, "A"), makeNode("toggle", 60, 120, "B"), makeNode("toggle", 60, 210, "Bin"),
        makeNode("full-subtractor", 240, 60, "FS"),
        makeNode("bulb", 460, 50, "DIFF"), makeNode("bulb", 460, 120, "BORROW"),
      ],
      wires: [
        makeWire("A", "out", "FS", "a"), makeWire("B", "out", "FS", "b"), makeWire("Bin", "out", "FS", "bin"),
        makeWire("FS", "diff", "DIFF", "in"), makeWire("FS", "borrow", "BORROW", "in"),
      ],
    }),
  },
  {
    id: "2bit-adder", name: "2-bit Ripple Carry Adder", description: "Adds two 2-bit numbers with carry chain",
    category: "Arithmetic", tags: ["adder", "2-bit", "ripple-carry"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("const-0", 40, 360, "C0"),
        makeNode("full-adder", 220, 230, "FA0"), makeNode("full-adder", 220, 100, "FA1"),
        makeNode("bulb", 440, 220, "S0"), makeNode("bulb", 440, 100, "S1"),
        makeNode("led", 440, 340, "COUT"),
      ],
      wires: [
        makeWire("A0", "out", "FA0", "a"), makeWire("B0", "out", "FA0", "b"), makeWire("C0", "out", "FA0", "cin"),
        makeWire("A1", "out", "FA1", "a"), makeWire("B1", "out", "FA1", "b"), makeWire("FA0", "cout", "FA1", "cin"),
        makeWire("FA0", "sum", "S0", "in"), makeWire("FA1", "sum", "S1", "in"),
        makeWire("FA1", "cout", "COUT", "r"),
      ],
    }),
  },
  {
    id: "4bit-ripple-adder", name: "4-bit Ripple Carry Adder", description: "Adds two 4-bit numbers",
    category: "Arithmetic", tags: ["adder", "4-bit", "ripple-carry"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A3"), makeNode("toggle", 30, 80, "A2"),
        makeNode("toggle", 30, 150, "A1"), makeNode("toggle", 30, 220, "A0"),
        makeNode("toggle", 30, 310, "B3"), makeNode("toggle", 30, 380, "B2"),
        makeNode("toggle", 30, 450, "B1"), makeNode("toggle", 30, 520, "B0"),
        makeNode("const-0", 30, 590, "C0"),
        makeNode("full-adder", 200, 470, "FA0"), makeNode("full-adder", 200, 350, "FA1"),
        makeNode("full-adder", 200, 230, "FA2"), makeNode("full-adder", 200, 110, "FA3"),
        makeNode("bulb", 420, 470, "S0"), makeNode("bulb", 420, 350, "S1"),
        makeNode("bulb", 420, 230, "S2"), makeNode("bulb", 420, 110, "S3"),
        makeNode("led", 420, 580, "COUT"),
      ],
      wires: [
        makeWire("A0", "out", "FA0", "a"), makeWire("B0", "out", "FA0", "b"), makeWire("C0", "out", "FA0", "cin"),
        makeWire("A1", "out", "FA1", "a"), makeWire("B1", "out", "FA1", "b"), makeWire("FA0", "cout", "FA1", "cin"),
        makeWire("A2", "out", "FA2", "a"), makeWire("B2", "out", "FA2", "b"), makeWire("FA1", "cout", "FA2", "cin"),
        makeWire("A3", "out", "FA3", "a"), makeWire("B3", "out", "FA3", "b"), makeWire("FA2", "cout", "FA3", "cin"),
        makeWire("FA0", "sum", "S0", "in"), makeWire("FA1", "sum", "S1", "in"),
        makeWire("FA2", "sum", "S2", "in"), makeWire("FA3", "sum", "S3", "in"),
        makeWire("FA3", "cout", "COUT", "r"),
      ],
    }),
  },
  {
    id: "adder-subtractor", name: "Adder/Subtractor", description: "Mode-select: add or subtract two 2-bit numbers",
    category: "Arithmetic", tags: ["adder", "subtractor", "mode-select"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("toggle", 40, 370, "MODE"),
        makeNode("xor", 180, 200, "X1"), makeNode("xor", 180, 280, "X0"),
        makeNode("full-adder", 340, 20, "FA1"), makeNode("full-adder", 340, 140, "FA0"),
        makeNode("bulb", 540, 30, "S1"), makeNode("bulb", 540, 150, "S0"),
        makeNode("led", 540, 260, "COUT"),
      ],
      wires: [
        makeWire("B1", "out", "X1", "a"), makeWire("MODE", "out", "X1", "b"),
        makeWire("B0", "out", "X0", "a"), makeWire("MODE", "out", "X0", "b"),
        makeWire("A0", "out", "FA0", "a"), makeWire("X0", "out", "FA0", "b"), makeWire("MODE", "out", "FA0", "cin"),
        makeWire("A1", "out", "FA1", "a"), makeWire("X1", "out", "FA1", "b"), makeWire("FA0", "cout", "FA1", "cin"),
        makeWire("FA0", "sum", "S0", "in"), makeWire("FA1", "sum", "S1", "in"),
        makeWire("FA1", "cout", "COUT", "r"),
      ],
    }),
  },
  {
    id: "2bit-multiplier", name: "2-bit Multiplier", description: "Multiplies two 2-bit numbers → 4-bit result",
    category: "Arithmetic", tags: ["multiplier", "2-bit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("and", 200, 20, "A1B1"), makeNode("and", 200, 100, "A1B0"),
        makeNode("and", 200, 180, "A0B1"), makeNode("and", 200, 260, "A0B0"),
        makeNode("half-adder", 360, 140, "HA1"), makeNode("half-adder", 360, 260, "HA2"),
        makeNode("bulb", 540, 20, "P3"), makeNode("bulb", 540, 120, "P2"),
        makeNode("bulb", 540, 240, "P1"), makeNode("bulb", 540, 310, "P0"),
      ],
      wires: [
        makeWire("A1", "out", "A1B1", "a"), makeWire("B1", "out", "A1B1", "b"),
        makeWire("A1", "out", "A1B0", "a"), makeWire("B0", "out", "A1B0", "b"),
        makeWire("A0", "out", "A0B1", "a"), makeWire("B1", "out", "A0B1", "b"),
        makeWire("A0", "out", "A0B0", "a"), makeWire("B0", "out", "A0B0", "b"),
        makeWire("A0B0", "out", "P0", "in"),
        makeWire("A1B0", "out", "HA1", "a"), makeWire("A0B1", "out", "HA1", "b"),
        makeWire("HA1", "sum", "P1", "in"),
        makeWire("A1B1", "out", "HA2", "a"), makeWire("HA1", "cout", "HA2", "b"),
        makeWire("HA2", "sum", "P2", "in"), makeWire("HA2", "cout", "P3", "in"),
      ],
    }),
  },
  {
    id: "4bit-alu", name: "4-bit ALU", description: "AND, OR, ADD operations on 2-bit numbers",
    category: "Arithmetic", tags: ["alu", "arithmetic", "logic-unit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("and", 220, 10, "AND1"), makeNode("and", 220, 80, "AND0"),
        makeNode("or", 220, 160, "OR1"), makeNode("or", 220, 230, "OR0"),
        makeNode("full-adder", 220, 300, "ADD"),
        makeNode("led", 440, 10, "R_AND1"), makeNode("led", 440, 80, "R_AND0"),
        makeNode("led", 440, 160, "R_OR1"), makeNode("led", 440, 230, "R_OR0"),
        makeNode("bulb", 440, 310, "R_ADD"),
      ],
      wires: [
        makeWire("A1", "out", "AND1", "a"), makeWire("B1", "out", "AND1", "b"),
        makeWire("A0", "out", "AND0", "a"), makeWire("B0", "out", "AND0", "b"),
        makeWire("A1", "out", "OR1", "a"), makeWire("B1", "out", "OR1", "b"),
        makeWire("A0", "out", "OR0", "a"), makeWire("B0", "out", "OR0", "b"),
        makeWire("A0", "out", "ADD", "a"), makeWire("B0", "out", "ADD", "b"),
        makeWire("AND1", "out", "R_AND1", "r"), makeWire("AND0", "out", "R_AND0", "r"),
        makeWire("OR1", "out", "R_OR1", "r"), makeWire("OR0", "out", "R_OR0", "r"),
        makeWire("ADD", "sum", "R_ADD", "in"),
      ],
    }),
  },
  {
    id: "carry-lookahead", name: "2-bit Carry Lookahead", description: "Fast parallel adder with generate/propagate",
    category: "Arithmetic", tags: ["carry-lookahead", "parallel", "fast-adder"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 120, "A0"),
        makeNode("toggle", 40, 230, "B1"), makeNode("toggle", 40, 330, "B0"),
        makeNode("and", 200, 20, "P1"), makeNode("and", 200, 120, "P0"),
        makeNode("or", 200, 230, "G1"), makeNode("or", 200, 330, "G0"),
        makeNode("full-adder", 380, 30, "FA1"), makeNode("full-adder", 380, 180, "FA0"),
        makeNode("bulb", 560, 40, "S1"), makeNode("bulb", 560, 190, "S0"),
      ],
      wires: [
        makeWire("A1", "out", "P1", "a"), makeWire("B1", "out", "P1", "b"),
        makeWire("A0", "out", "P0", "a"), makeWire("B0", "out", "P0", "b"),
        makeWire("A1", "out", "G1", "a"), makeWire("B1", "out", "G1", "b"),
        makeWire("A0", "out", "G0", "a"), makeWire("B0", "out", "G0", "b"),
        makeWire("A0", "out", "FA0", "a"), makeWire("B0", "out", "FA0", "b"),
        makeWire("G0", "out", "FA1", "cin"),
        makeWire("A1", "out", "FA1", "a"), makeWire("B1", "out", "FA1", "b"),
        makeWire("FA0", "sum", "S0", "in"), makeWire("FA1", "sum", "S1", "in"),
      ],
    }),
  },

  // ─── COMBINATIONAL ──────────────────────────────────────────
  {
    id: "2to1-mux", name: "2:1 MUX", description: "Selects I0 or I1 based on SEL",
    category: "Combinational", tags: ["mux", "selector"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "I0"), makeNode("toggle", 40, 140, "I1"), makeNode("toggle", 40, 240, "SEL"),
        makeNode("mux2", 240, 70, "MUX"), makeNode("bulb", 460, 90, "OUT"),
      ],
      wires: [
        makeWire("I0", "out", "MUX", "i0"), makeWire("I1", "out", "MUX", "i1"),
        makeWire("SEL", "out", "MUX", "sel"), makeWire("MUX", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "4to1-mux", name: "4:1 MUX", description: "Selects one of 4 inputs via 2 select lines",
    category: "Combinational", tags: ["mux", "4-input"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "I0"), makeNode("toggle", 30, 70, "I1"),
        makeNode("toggle", 30, 130, "I2"), makeNode("toggle", 30, 190, "I3"),
        makeNode("toggle", 30, 270, "S0"), makeNode("toggle", 30, 340, "S1"),
        makeNode("mux4", 220, 70, "MUX"), makeNode("bulb", 440, 100, "OUT"),
      ],
      wires: [
        makeWire("I0", "out", "MUX", "i0"), makeWire("I1", "out", "MUX", "i1"),
        makeWire("I2", "out", "MUX", "i2"), makeWire("I3", "out", "MUX", "i3"),
        makeWire("S0", "out", "MUX", "s0"), makeWire("S1", "out", "MUX", "s1"),
        makeWire("MUX", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "8to1-mux", name: "8:1 MUX", description: "Cascaded 4:1+4:1+2:1 for 8 inputs",
    category: "Combinational", tags: ["mux", "8-input", "cascaded"],
    build: () => ({
      nodes: [
        makeNode("toggle", 20, 10, "I0"), makeNode("toggle", 20, 60, "I1"),
        makeNode("toggle", 20, 110, "I2"), makeNode("toggle", 20, 160, "I3"),
        makeNode("toggle", 20, 230, "I4"), makeNode("toggle", 20, 280, "I5"),
        makeNode("toggle", 20, 330, "I6"), makeNode("toggle", 20, 380, "I7"),
        makeNode("toggle", 20, 440, "S0"), makeNode("toggle", 20, 500, "S1"),
        makeNode("toggle", 20, 560, "S2"),
        makeNode("mux4", 220, 80, "MUXH"), makeNode("mux4", 220, 310, "MUXL"),
        makeNode("mux2", 420, 180, "MUXO"), makeNode("bulb", 600, 190, "OUT"),
      ],
      wires: [
        makeWire("I0", "out", "MUXH", "i0"), makeWire("I1", "out", "MUXH", "i1"),
        makeWire("I2", "out", "MUXH", "i2"), makeWire("I3", "out", "MUXH", "i3"),
        makeWire("I4", "out", "MUXL", "i0"), makeWire("I5", "out", "MUXL", "i1"),
        makeWire("I6", "out", "MUXL", "i2"), makeWire("I7", "out", "MUXL", "i3"),
        makeWire("S0", "out", "MUXH", "s0"), makeWire("S1", "out", "MUXH", "s1"),
        makeWire("S0", "out", "MUXL", "s0"), makeWire("S1", "out", "MUXL", "s1"),
        makeWire("MUXH", "out", "MUXO", "i0"), makeWire("MUXL", "out", "MUXO", "i1"),
        makeWire("S2", "out", "MUXO", "sel"), makeWire("MUXO", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "2to1-mux-gates", name: "2:1 MUX (from gates)", description: "AND/NOT/OR implementation of 2:1 MUX",
    category: "Combinational", tags: ["mux", "from-gates"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "I0"), makeNode("toggle", 40, 140, "I1"), makeNode("toggle", 40, 240, "SEL"),
        makeNode("not", 180, 230, "N"), makeNode("and", 300, 30, "A0"), makeNode("and", 300, 130, "A1"),
        makeNode("or", 440, 70, "O"), makeNode("bulb", 580, 80, "OUT"),
      ],
      wires: [
        makeWire("SEL", "out", "N", "a"),
        makeWire("I0", "out", "A0", "a"), makeWire("N", "out", "A0", "b"),
        makeWire("I1", "out", "A1", "a"), makeWire("SEL", "out", "A1", "b"),
        makeWire("A0", "out", "O", "a"), makeWire("A1", "out", "O", "b"),
        makeWire("O", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "4to1-mux-gates", name: "4:1 MUX (from gates)", description: "Full gate-level 4:1 MUX with OR-tree",
    category: "Combinational", tags: ["mux", "4-input", "from-gates"],
    build: () => ({
      nodes: [
        makeNode("toggle", 20, 10, "I0"), makeNode("toggle", 20, 80, "I1"),
        makeNode("toggle", 20, 150, "I2"), makeNode("toggle", 20, 220, "I3"),
        makeNode("toggle", 20, 300, "S0"), makeNode("toggle", 20, 380, "S1"),
        makeNode("not", 150, 290, "nS0"), makeNode("not", 150, 370, "nS1"),
        makeNode("and", 280, 10, "A0"), makeNode("and", 280, 80, "A1"),
        makeNode("and", 280, 150, "A2"), makeNode("and", 280, 220, "A3"),
        makeNode("or", 420, 40, "OH"), makeNode("or", 420, 180, "OL"),
        makeNode("or", 540, 110, "O"), makeNode("bulb", 660, 120, "OUT"),
      ],
      wires: [
        makeWire("S0", "out", "nS0", "a"), makeWire("S1", "out", "nS1", "a"),
        makeWire("I0", "out", "A0", "a"), makeWire("nS0", "out", "A0", "b"),
        makeWire("I1", "out", "A1", "a"), makeWire("S0", "out", "A1", "b"),
        makeWire("I2", "out", "A2", "a"), makeWire("nS1", "out", "A2", "b"),
        makeWire("I3", "out", "A3", "a"), makeWire("S1", "out", "A3", "b"),
        makeWire("A0", "out", "OH", "a"), makeWire("A1", "out", "OH", "b"),
        makeWire("A2", "out", "OL", "a"), makeWire("A3", "out", "OL", "b"),
        makeWire("OH", "out", "O", "a"), makeWire("OL", "out", "O", "b"),
        makeWire("O", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "2to4-decoder", name: "2:4 Decoder", description: "Decodes 2-bit input to one-hot",
    category: "Combinational", tags: ["decoder", "demux"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 140, "B"),
        makeNode("decoder", 240, 60, "DEC"),
        makeNode("bulb", 440, 20, "D0"), makeNode("bulb", 440, 70, "D1"),
        makeNode("bulb", 440, 120, "D2"), makeNode("bulb", 440, 170, "D3"),
      ],
      wires: [
        makeWire("A", "out", "DEC", "a"), makeWire("B", "out", "DEC", "b"),
        makeWire("DEC", "o0", "D0", "in"), makeWire("DEC", "o1", "D1", "in"),
        makeWire("DEC", "o2", "D2", "in"), makeWire("DEC", "o3", "D3", "in"),
      ],
    }),
  },
  {
    id: "3to8-decoder", name: "3:8 Decoder", description: "Full 3-to-8 decoder from NOT+AND gates",
    category: "Combinational", tags: ["decoder", "3-bit", "from-gates"],
    build: () => {
      const a = makeNode("toggle", 30, 20, "A");
      const b = makeNode("toggle", 30, 150, "B");
      const c = makeNode("toggle", 30, 280, "C");
      const nA = makeNode("not", 140, 10, "nA");
      const nB = makeNode("not", 140, 140, "nB");
      const nC = makeNode("not", 140, 270, "nC");
      const gates = Array.from({ length: 8 }, (_, i) => makeNode("and", 280, 10 + i * 60, `g${i}`));
      const outs = Array.from({ length: 8 }, (_, i) => makeNode("bulb", 460, 10 + i * 60, `Y${i}`));
      const bits = (n: number, len: number) =>
        Array.from({ length: len }, (_, i) => !!((n >> (len - 1 - i)) & 1));
      const wires: Wire[] = [
        makeWire("A", "out", "nA", "a"), makeWire("B", "out", "nB", "a"), makeWire("C", "out", "nC", "a"),
      ];
      for (let i = 0; i < 8; i++) {
        const [cB, bB, aB] = bits(i, 3);
        wires.push(makeWire(aB ? "A" : "nA", "out", `g${i}`, "a"));
        wires.push(makeWire(bB ? "B" : "nB", "out", `g${i}`, "b"));
        wires.push(makeWire(`g${i}`, "out", `Y${i}`, "in"));
      }
      return { nodes: [a, b, c, nA, nB, nC, ...gates, ...outs], wires };
    },
  },
  {
    id: "demux-1to4", name: "1:4 Demultiplexer", description: "Routes DIN to one of 4 outputs",
    category: "Combinational", tags: ["demultiplexer", "demux"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 60, "DIN"), makeNode("toggle", 40, 200, "S0"), makeNode("toggle", 40, 300, "S1"),
        makeNode("not", 170, 190, "nS0"), makeNode("not", 170, 290, "nS1"),
        makeNode("and", 300, 20, "A0"), makeNode("and", 300, 110, "A1"),
        makeNode("and", 300, 200, "A2"), makeNode("and", 300, 290, "A3"),
        makeNode("bulb", 460, 20, "Y0"), makeNode("bulb", 460, 110, "Y1"),
        makeNode("bulb", 460, 200, "Y2"), makeNode("bulb", 460, 290, "Y3"),
      ],
      wires: [
        makeWire("S0", "out", "nS0", "a"), makeWire("S1", "out", "nS1", "a"),
        makeWire("DIN", "out", "A0", "a"), makeWire("nS0", "out", "A0", "b"),
        makeWire("DIN", "out", "A1", "a"), makeWire("S0", "out", "A1", "b"),
        makeWire("DIN", "out", "A2", "a"), makeWire("nS1", "out", "A2", "b"),
        makeWire("DIN", "out", "A3", "a"), makeWire("S1", "out", "A3", "b"),
        makeWire("A0", "out", "Y0", "in"), makeWire("A1", "out", "Y1", "in"),
        makeWire("A2", "out", "Y2", "in"), makeWire("A3", "out", "Y3", "in"),
      ],
    }),
  },
  {
    id: "priority-encoder", name: "4:2 Priority Encoder", description: "Encodes highest active input to 2-bit code",
    category: "Combinational", tags: ["encoder", "priority"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "D3"), makeNode("toggle", 40, 100, "D2"),
        makeNode("toggle", 40, 180, "D1"), makeNode("toggle", 40, 260, "D0"),
        makeNode("or", 220, 20, "Y1"), makeNode("or", 220, 100, "Y0"),
        makeNode("or", 300, 220, "V"),
        makeNode("bulb", 420, 30, "Q1"), makeNode("bulb", 420, 110, "Q0"),
        makeNode("led", 420, 230, "VALID"),
      ],
      wires: [
        makeWire("D3", "out", "Y1", "a"), makeWire("D2", "out", "Y1", "b"),
        makeWire("D3", "out", "Y0", "a"), makeWire("D1", "out", "Y0", "b"),
        makeWire("D3", "out", "V", "a"), makeWire("D0", "out", "V", "b"),
        makeWire("Y1", "out", "Q1", "in"), makeWire("Y0", "out", "Q0", "in"),
        makeWire("V", "out", "VALID", "r"),
      ],
    }),
  },
  {
    id: "8to3-priority-encoder", name: "8:3 Priority Encoder", description: "8 inputs → 3-bit code for highest active",
    category: "Combinational", tags: ["encoder", "priority", "8-input"],
    build: () => ({
      nodes: [
        makeNode("toggle", 20, 10, "D7"), makeNode("toggle", 20, 60, "D6"),
        makeNode("toggle", 20, 110, "D5"), makeNode("toggle", 20, 160, "D4"),
        makeNode("toggle", 20, 230, "D3"), makeNode("toggle", 20, 280, "D2"),
        makeNode("toggle", 20, 330, "D1"), makeNode("toggle", 20, 380, "D0"),
        makeNode("or", 200, 10, "O2"), makeNode("or", 200, 110, "O1"), makeNode("or", 200, 210, "O0"),
        makeNode("bulb", 400, 10, "Y2"), makeNode("bulb", 400, 110, "Y1"), makeNode("bulb", 400, 210, "Y0"),
      ],
      wires: [
        makeWire("D7", "out", "O2", "a"), makeWire("D6", "out", "O2", "b"),
        makeWire("D5", "out", "O1", "a"), makeWire("D4", "out", "O1", "b"),
        makeWire("D3", "out", "O0", "a"), makeWire("D2", "out", "O0", "b"),
        makeWire("O2", "out", "Y2", "in"), makeWire("O1", "out", "Y1", "in"), makeWire("O0", "out", "Y0", "in"),
      ],
    }),
  },
  {
    id: "odd-parity", name: "3-bit Odd Parity", description: "XOR chain — output HIGH when odd number of inputs are HIGH",
    category: "Combinational", tags: ["parity", "xor", "error-detection"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 30, "A"), makeNode("toggle", 40, 130, "B"), makeNode("toggle", 40, 230, "C"),
        makeNode("xor", 200, 40, "X1"), makeNode("xor", 360, 120, "X2"), makeNode("bulb", 520, 130, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "X1", "a"), makeWire("B", "out", "X1", "b"),
        makeWire("X1", "out", "X2", "a"), makeWire("C", "out", "X2", "b"),
        makeWire("X2", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "even-parity", name: "3-bit Even Parity", description: "XOR+NOT — output HIGH when even number of inputs are HIGH",
    category: "Combinational", tags: ["parity", "xnor", "error-detection"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 30, "A"), makeNode("toggle", 40, 130, "B"), makeNode("toggle", 40, 230, "C"),
        makeNode("xor", 200, 40, "X1"), makeNode("xor", 340, 120, "X2"),
        makeNode("not", 480, 130, "N"), makeNode("bulb", 580, 130, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "X1", "a"), makeWire("B", "out", "X1", "b"),
        makeWire("X1", "out", "X2", "a"), makeWire("C", "out", "X2", "b"),
        makeWire("X2", "out", "N", "a"), makeWire("N", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "majority-voter", name: "3-input Majority Voter", description: "HIGH when 2+ of 3 inputs are HIGH",
    category: "Combinational", tags: ["majority", "consensus"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A"), makeNode("toggle", 40, 130, "B"), makeNode("toggle", 40, 240, "C"),
        makeNode("and", 200, 10, "AB"), makeNode("and", 200, 110, "AC"), makeNode("and", 200, 220, "BC"),
        makeNode("or", 360, 60, "O1"), makeNode("or", 360, 200, "O2"),
        makeNode("bulb", 500, 130, "OUT"),
      ],
      wires: [
        makeWire("A", "out", "AB", "a"), makeWire("B", "out", "AB", "b"),
        makeWire("A", "out", "AC", "a"), makeWire("C", "out", "AC", "b"),
        makeWire("B", "out", "BC", "a"), makeWire("C", "out", "BC", "b"),
        makeWire("AB", "out", "O1", "a"), makeWire("AC", "out", "O1", "b"),
        makeWire("O1", "out", "O2", "a"), makeWire("BC", "out", "O2", "b"),
        makeWire("O2", "out", "OUT", "in"),
      ],
    }),
  },
  {
    id: "gray-code", name: "3-bit Gray Code Converter", description: "Binary → Gray: G[i] = B[i] XOR B[i+1]",
    category: "Combinational", tags: ["gray-code", "conversion"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "B2"), makeNode("toggle", 40, 120, "B1"), makeNode("toggle", 40, 220, "B0"),
        makeNode("xor", 220, 110, "X1"), makeNode("xor", 220, 200, "X0"),
        makeNode("bulb", 420, 20, "G2"), makeNode("bulb", 420, 120, "G1"), makeNode("bulb", 420, 220, "G0"),
      ],
      wires: [
        makeWire("B2", "out", "G2", "in"),
        makeWire("B2", "out", "X1", "a"), makeWire("B1", "out", "X1", "b"),
        makeWire("B1", "out", "X0", "a"), makeWire("B0", "out", "X0", "b"),
        makeWire("X1", "out", "G1", "in"), makeWire("X0", "out", "G0", "in"),
      ],
    }),
  },
  {
    id: "1bit-comparator", name: "1-bit Comparator", description: "EQ and NEQ outputs for two bits",
    category: "Combinational", tags: ["comparator", "1-bit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "A"), makeNode("toggle", 40, 160, "B"),
        makeNode("xnor", 220, 40, "EQ"), makeNode("xor", 220, 140, "NEQ"),
        makeNode("bulb", 420, 50, "Q_EQ"), makeNode("bulb", 420, 150, "Q_NEQ"),
      ],
      wires: [
        makeWire("A", "out", "EQ", "a"), makeWire("B", "out", "EQ", "b"),
        makeWire("A", "out", "NEQ", "a"), makeWire("B", "out", "NEQ", "b"),
        makeWire("EQ", "out", "Q_EQ", "in"), makeWire("NEQ", "out", "Q_NEQ", "in"),
      ],
    }),
  },
  {
    id: "2bit-comparator", name: "2-bit Magnitude Comparator", description: "A==B and A!=B for 2-bit numbers",
    category: "Combinational", tags: ["comparator", "2-bit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("xnor", 200, 20, "XN1"), makeNode("xnor", 200, 100, "XN0"),
        makeNode("and", 340, 50, "EQ"),
        makeNode("xor", 200, 200, "XR1"), makeNode("xor", 200, 280, "XR0"),
        makeNode("or", 340, 230, "NEQ"),
        makeNode("bulb", 480, 60, "A==B"), makeNode("bulb", 480, 240, "A!=B"),
      ],
      wires: [
        makeWire("A1", "out", "XN1", "a"), makeWire("B1", "out", "XN1", "b"),
        makeWire("A0", "out", "XN0", "a"), makeWire("B0", "out", "XN0", "b"),
        makeWire("XN1", "out", "EQ", "a"), makeWire("XN0", "out", "EQ", "b"),
        makeWire("A1", "out", "XR1", "a"), makeWire("B1", "out", "XR1", "b"),
        makeWire("A0", "out", "XR0", "a"), makeWire("B0", "out", "XR0", "b"),
        makeWire("XR1", "out", "NEQ", "a"), makeWire("XR0", "out", "NEQ", "b"),
        makeWire("EQ", "out", "A==B", "in"), makeWire("NEQ", "out", "A!=B", "in"),
      ],
    }),
  },
  {
    id: "bcd-to-binary", name: "BCD to Binary", description: "Converts BCD 4-bit to binary using adders",
    category: "Combinational", tags: ["bcd", "binary", "conversion"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A"), makeNode("toggle", 40, 100, "B"),
        makeNode("toggle", 40, 180, "C"), makeNode("toggle", 40, 260, "D"),
        makeNode("half-adder", 220, 80, "HA1"), makeNode("half-adder", 220, 200, "HA2"),
        makeNode("bulb", 420, 20, "Y0"), makeNode("bulb", 420, 100, "Y1"),
        makeNode("bulb", 420, 200, "Y2"), makeNode("led", 420, 290, "Y3"),
      ],
      wires: [
        makeWire("A", "out", "Y0", "in"),
        makeWire("B", "out", "HA1", "a"), makeWire("A", "out", "HA1", "b"),
        makeWire("HA1", "sum", "Y1", "in"),
        makeWire("C", "out", "HA2", "a"), makeWire("HA1", "cout", "HA2", "b"),
        makeWire("HA2", "sum", "Y2", "in"), makeWire("HA2", "cout", "Y3", "r"),
      ],
    }),
  },
  {
    id: "binary-to-bcd", name: "Binary to BCD", description: "4-bit binary → hex display",
    category: "Combinational", tags: ["binary", "bcd", "conversion"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "B0"), makeNode("toggle", 40, 100, "B1"),
        makeNode("toggle", 40, 180, "B2"), makeNode("toggle", 40, 260, "B3"),
        makeNode("hex-display", 260, 80, "HEX"),
      ],
      wires: [
        makeWire("B0", "out", "HEX", "a"), makeWire("B1", "out", "HEX", "b"),
        makeWire("B2", "out", "HEX", "c"), makeWire("B3", "out", "HEX", "d"),
      ],
    }),
  },

  // ─── DISPLAY ────────────────────────────────────────────────
  {
    id: "bcd-hex", name: "BCD to Hex Display", description: "4-bit BCD → hex digit on display",
    category: "Display", tags: ["bcd", "hex", "display"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A"), makeNode("toggle", 40, 100, "B"),
        makeNode("toggle", 40, 180, "C"), makeNode("toggle", 40, 260, "D"),
        makeNode("hex-display", 260, 80, "HEX"),
      ],
      wires: [
        makeWire("A", "out", "HEX", "a"), makeWire("B", "out", "HEX", "b"),
        makeWire("C", "out", "HEX", "c"), makeWire("D", "out", "HEX", "d"),
      ],
    }),
  },
  {
    id: "led-rgb", name: "RGB LED", description: "3-bit color mixing with R/G/B inputs",
    category: "Display", tags: ["led", "rgb", "color"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 30, "R"), makeNode("toggle", 40, 130, "G"), makeNode("toggle", 40, 230, "B"),
        makeNode("led", 240, 80, "RGB"),
      ],
      wires: [
        makeWire("R", "out", "RGB", "r"), makeWire("G", "out", "RGB", "g"), makeWire("B", "out", "RGB", "b"),
      ],
    }),
  },
  {
    id: "bcd-7seg", name: "BCD to 7-Segment Decoder", description: "Drives 7-segment display segments from BCD",
    category: "Display", tags: ["bcd", "7-segment", "decoder"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 20, "A"), makeNode("toggle", 30, 100, "B"),
        makeNode("toggle", 30, 180, "C"), makeNode("toggle", 30, 260, "D"),
        makeNode("and", 200, 10, "SEG_A"), makeNode("or", 200, 90, "SEG_B"),
        makeNode("not", 170, 270, "nD"), makeNode("and", 320, 60, "SEG_C"),
        makeNode("led", 440, 10, "A_SEG"), makeNode("led", 440, 90, "B_SEG"),
        makeNode("led", 440, 170, "C_SEG"),
      ],
      wires: [
        makeWire("A", "out", "SEG_A", "a"), makeWire("B", "out", "SEG_A", "b"),
        makeWire("A", "out", "SEG_B", "a"), makeWire("C", "out", "SEG_B", "b"),
        makeWire("D", "out", "nD", "a"),
        makeWire("nD", "out", "SEG_C", "a"), makeWire("B", "out", "SEG_C", "b"),
        makeWire("SEG_A", "out", "A_SEG", "r"), makeWire("SEG_B", "out", "B_SEG", "r"),
        makeWire("SEG_C", "out", "C_SEG", "r"),
      ],
    }),
  },

  // ─── MEMORY ─────────────────────────────────────────────────
  {
    id: "sr-latch-nor", name: "SR Latch (NOR)", description: "Cross-coupled NOR gates — basic memory",
    category: "Memory", tags: ["sr-latch", "nor", "bistable"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "S"), makeNode("toggle", 40, 200, "R"),
        makeNode("nor", 220, 20, "NQ"), makeNode("nor", 220, 160, "NQn"),
        makeNode("bulb", 420, 30, "Q"), makeNode("bulb", 420, 170, "Qn"),
      ],
      wires: [
        makeWire("S", "out", "NQ", "a"), makeWire("NQ", "out", "NQn", "a"),
        makeWire("R", "out", "NQn", "b"), makeWire("NQn", "out", "NQ", "b"),
        makeWire("NQ", "out", "Q", "in"), makeWire("NQn", "out", "Qn", "in"),
      ],
    }),
  },
  {
    id: "sr-latch-nand", name: "SR Latch (NAND)", description: "Cross-coupled NAND gates — active-low inputs",
    category: "Memory", tags: ["sr-latch", "nand", "bistable"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 40, "S"), makeNode("toggle", 40, 200, "R"),
        makeNode("nand", 220, 20, "NQ"), makeNode("nand", 220, 160, "NQn"),
        makeNode("bulb", 420, 30, "Q"), makeNode("bulb", 420, 170, "Qn"),
      ],
      wires: [
        makeWire("S", "out", "NQ", "a"), makeWire("NQ", "out", "NQn", "a"),
        makeWire("R", "out", "NQn", "b"), makeWire("NQn", "out", "NQ", "b"),
        makeWire("NQ", "out", "Q", "in"), makeWire("NQn", "out", "Qn", "in"),
      ],
    }),
  },
  {
    id: "d-latch", name: "D Latch", description: "Transparent latch — Q follows D when EN=HIGH",
    category: "Memory", tags: ["d-latch", "transparent"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 60, "D"), makeNode("toggle", 40, 180, "EN"),
        makeNode("d-latch", 240, 60, "DL"),
        makeNode("bulb", 440, 50, "Q"), makeNode("bulb", 440, 120, "Qn"),
      ],
      wires: [
        makeWire("D", "out", "DL", "d"), makeWire("EN", "out", "DL", "en"),
        makeWire("DL", "q", "Q", "in"), makeWire("DL", "qn", "Qn", "in"),
      ],
    }),
  },
  {
    id: "d-flipflop", name: "D Flip-Flop", description: "Edge-triggered — captures D on CLK rising edge",
    category: "Memory", tags: ["d-flipflop", "edge-triggered"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 60, "D"), makeNode("toggle", 40, 180, "CLK"),
        makeNode("d-flipflop", 240, 60, "DFF"),
        makeNode("bulb", 440, 50, "Q"), makeNode("bulb", 440, 120, "Qn"),
      ],
      wires: [
        makeWire("D", "out", "DFF", "d"), makeWire("CLK", "out", "DFF", "clk"),
        makeWire("DFF", "q", "Q", "in"), makeWire("DFF", "qn", "Qn", "in"),
      ],
    }),
  },
  {
    id: "jk-flipflop", name: "JK Flip-Flop", description: "J=1 K=0→Set, J=0 K=1→Reset, J=1 K=1→Toggle",
    category: "Memory", tags: ["jk-flipflop", "toggle"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 30, "J"), makeNode("toggle", 40, 130, "K"),
        makeNode("toggle", 40, 230, "CLK"),
        makeNode("not", 160, 30, "nJ"), makeNode("not", 160, 130, "nK"),
        makeNode("and", 260, 20, "AJ"), makeNode("and", 260, 110, "AK"),
        makeNode("or", 380, 60, "OR"), makeNode("d-flipflop", 460, 40, "DFF"),
        makeNode("bulb", 640, 30, "Q"), makeNode("bulb", 640, 100, "Qn"),
      ],
      wires: [
        makeWire("J", "out", "nJ", "a"), makeWire("K", "out", "nK", "a"),
        makeWire("J", "out", "AJ", "a"), makeWire("nK", "out", "AJ", "b"),
        makeWire("K", "out", "AK", "a"), makeWire("nJ", "out", "AK", "b"),
        makeWire("AJ", "out", "OR", "a"), makeWire("AK", "out", "OR", "b"),
        makeWire("OR", "out", "DFF", "d"), makeWire("CLK", "out", "DFF", "clk"),
        makeWire("DFF", "q", "Q", "in"), makeWire("DFF", "qn", "Qn", "in"),
      ],
    }),
  },
  {
    id: "t-flipflop", name: "T Flip-Flop", description: "XOR feedback: T=1 toggles, T=0 holds",
    category: "Memory", tags: ["t-flipflop", "toggle"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 60, "T"), makeNode("toggle", 40, 260, "CLK"),
        makeNode("xor", 160, 150, "XOR"), makeNode("d-flipflop", 280, 60, "DFF"),
        makeNode("bulb", 480, 50, "Q"), makeNode("bulb", 480, 120, "Qn"),
      ],
      wires: [
        makeWire("T", "out", "XOR", "a"), makeWire("DFF", "qn", "XOR", "b"),
        makeWire("XOR", "out", "DFF", "d"), makeWire("CLK", "out", "DFF", "clk"),
        makeWire("DFF", "q", "Q", "in"), makeWire("DFF", "qn", "Qn", "in"),
      ],
    }),
  },
  {
    id: "4bit-register", name: "4-bit Register", description: "Stores 4-bit word on CLK edge",
    category: "Memory", tags: ["register", "storage", "4-bit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 10, "D3"), makeNode("toggle", 40, 90, "D2"),
        makeNode("toggle", 40, 170, "D1"), makeNode("toggle", 40, 250, "D0"),
        makeNode("toggle", 40, 340, "CLK"),
        makeNode("d-flipflop", 220, 0, "FF3"), makeNode("d-flipflop", 220, 80, "FF2"),
        makeNode("d-flipflop", 220, 160, "FF1"), makeNode("d-flipflop", 220, 240, "FF0"),
        makeNode("bulb", 430, 0, "Q3"), makeNode("bulb", 430, 80, "Q2"),
        makeNode("bulb", 430, 160, "Q1"), makeNode("bulb", 430, 240, "Q0"),
      ],
      wires: [
        makeWire("D3", "out", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("D2", "out", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("D1", "out", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("D0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF3", "q", "Q3", "in"), makeWire("FF2", "q", "Q2", "in"),
        makeWire("FF1", "q", "Q1", "in"), makeWire("FF0", "q", "Q0", "in"),
      ],
    }),
  },
  {
    id: "shift-register", name: "4-bit Shift Register", description: "Serial-in, parallel-out shift register",
    category: "Memory", tags: ["shift-register", "serial", "parallel"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 60, "SIN"), makeNode("toggle", 40, 340, "CLK"),
        makeNode("d-flipflop", 220, 30, "FF3"), makeNode("d-flipflop", 220, 120, "FF2"),
        makeNode("d-flipflop", 220, 210, "FF1"), makeNode("d-flipflop", 220, 300, "FF0"),
        makeNode("bulb", 430, 30, "Q3"), makeNode("bulb", 430, 120, "Q2"),
        makeNode("bulb", 430, 210, "Q1"), makeNode("bulb", 430, 300, "Q0"),
      ],
      wires: [
        makeWire("SIN", "out", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF3", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF3", "q", "Q3", "in"), makeWire("FF2", "q", "Q2", "in"),
        makeWire("FF1", "q", "Q1", "in"), makeWire("FF0", "q", "Q0", "in"),
      ],
    }),
  },

  // ─── SEQUENTIAL ─────────────────────────────────────────────
  {
    id: "3bit-counter", name: "3-bit Binary Counter", description: "Counts 0→7 with XOR toggle logic",
    category: "Sequential", tags: ["counter", "3-bit", "binary"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 120, "CLK"), makeNode("const-1", 40, 30, "ONE"),
        makeNode("xor", 140, 30, "X0"), makeNode("xor", 140, 120, "X1"),
        makeNode("d-flipflop", 260, 20, "FF0"), makeNode("d-flipflop", 260, 110, "FF1"),
        makeNode("d-flipflop", 260, 200, "FF2"),
        makeNode("bulb", 440, 20, "Q0"), makeNode("bulb", 440, 110, "Q1"), makeNode("bulb", 440, 200, "Q2"),
      ],
      wires: [
        makeWire("ONE", "out", "X0", "a"), makeWire("FF0", "qn", "X0", "b"),
        makeWire("X0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "X1", "a"), makeWire("FF1", "qn", "X1", "b"),
        makeWire("X1", "out", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF0", "q", "Q0", "in"), makeWire("FF1", "q", "Q1", "in"), makeWire("FF2", "q", "Q2", "in"),
      ],
    }),
  },
  {
    id: "4bit-counter", name: "4-bit Binary Counter", description: "Counts 0→15 with cascaded toggle logic",
    category: "Sequential", tags: ["counter", "4-bit", "binary"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 160, "CLK"), makeNode("const-1", 40, 30, "ONE"),
        makeNode("xor", 150, 30, "X0"), makeNode("xor", 150, 110, "X1"),
        makeNode("and", 150, 200, "A01"), makeNode("and", 150, 270, "A012"),
        makeNode("d-flipflop", 260, 20, "FF0"), makeNode("d-flipflop", 260, 100, "FF1"),
        makeNode("d-flipflop", 260, 190, "FF2"), makeNode("d-flipflop", 260, 270, "FF3"),
        makeNode("bulb", 440, 20, "Q0"), makeNode("bulb", 440, 100, "Q1"),
        makeNode("bulb", 440, 190, "Q2"), makeNode("bulb", 440, 270, "Q3"),
      ],
      wires: [
        makeWire("ONE", "out", "X0", "a"), makeWire("FF0", "qn", "X0", "b"),
        makeWire("X0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "X1", "a"), makeWire("FF1", "qn", "X1", "b"),
        makeWire("X1", "out", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF0", "q", "A01", "a"), makeWire("FF1", "q", "A01", "b"),
        makeWire("A01", "out", "A012", "a"), makeWire("FF2", "qn", "A012", "b"),
        makeWire("A012", "out", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF0", "q", "Q0", "in"), makeWire("FF1", "q", "Q1", "in"),
        makeWire("FF2", "q", "Q2", "in"), makeWire("FF3", "q", "Q3", "in"),
      ],
    }),
  },
  {
    id: "johnson-counter", name: "Johnson Counter", description: "Twisted ring — 8-state sequence via NOT feedback",
    category: "Sequential", tags: ["johnson", "twisted-ring"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 160, "CLK"),
        makeNode("not", 130, 300, "NOT"), makeNode("d-flipflop", 220, 10, "FF0"),
        makeNode("d-flipflop", 220, 100, "FF1"), makeNode("d-flipflop", 220, 190, "FF2"),
        makeNode("d-flipflop", 220, 280, "FF3"),
        makeNode("bulb", 430, 10, "Q0"), makeNode("bulb", 430, 100, "Q1"),
        makeNode("bulb", 430, 190, "Q2"), makeNode("bulb", 430, 280, "Q3"),
      ],
      wires: [
        makeWire("FF3", "q", "NOT", "a"), makeWire("NOT", "out", "FF0", "d"),
        makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF0", "q", "Q0", "in"), makeWire("FF1", "q", "Q1", "in"),
        makeWire("FF2", "q", "Q2", "in"), makeWire("FF3", "q", "Q3", "in"),
      ],
    }),
  },
  {
    id: "ring-counter", name: "4-bit Ring Counter", description: "Circulates INIT bit through shift register",
    category: "Sequential", tags: ["ring-counter", "circulating"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "INIT"), makeNode("toggle", 40, 200, "CLK"),
        makeNode("d-flipflop", 220, 10, "FF0"), makeNode("d-flipflop", 220, 100, "FF1"),
        makeNode("d-flipflop", 220, 190, "FF2"), makeNode("d-flipflop", 220, 280, "FF3"),
        makeNode("bulb", 430, 10, "Q0"), makeNode("bulb", 430, 100, "Q1"),
        makeNode("bulb", 430, 190, "Q2"), makeNode("bulb", 430, 280, "Q3"),
      ],
      wires: [
        makeWire("INIT", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF0", "q", "Q0", "in"), makeWire("FF1", "q", "Q1", "in"),
        makeWire("FF2", "q", "Q2", "in"), makeWire("FF3", "q", "Q3", "in"),
      ],
    }),
  },
  {
    id: "lfsr-4bit", name: "4-bit LFSR", description: "XOR feedback from taps 3,4 → pseudo-random sequence",
    category: "Sequential", tags: ["lfsr", "pseudo-random", "feedback"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 160, "CLK"), makeNode("toggle", 40, 20, "SEED"),
        makeNode("xor", 140, 280, "XOR"), makeNode("d-flipflop", 240, 10, "FF0"),
        makeNode("d-flipflop", 240, 100, "FF1"), makeNode("d-flipflop", 240, 190, "FF2"),
        makeNode("d-flipflop", 240, 280, "FF3"),
        makeNode("bulb", 440, 10, "Q0"), makeNode("bulb", 440, 100, "Q1"),
        makeNode("bulb", 440, 190, "Q2"), makeNode("bulb", 440, 280, "Q3"),
      ],
      wires: [
        makeWire("SEED", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF2", "q", "XOR", "a"), makeWire("FF3", "q", "XOR", "b"),
        makeWire("XOR", "out", "FF0", "d"),
        makeWire("FF0", "q", "Q0", "in"), makeWire("FF1", "q", "Q1", "in"),
        makeWire("FF2", "q", "Q2", "in"), makeWire("FF3", "q", "Q3", "in"),
      ],
    }),
  },

  // ─── PRACTICAL ──────────────────────────────────────────────
  {
    id: "traffic-light", name: "Traffic Light Controller", description: "3-state ring: RED→YELLOW→GREEN→RED...",
    category: "Practical", tags: ["traffic-light", "state-machine"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 120, "CLK"),
        makeNode("d-flipflop", 220, 20, "FF_R"), makeNode("d-flipflop", 220, 140, "FF_Y"),
        makeNode("d-flipflop", 220, 260, "FF_G"),
        makeNode("not", 160, 20, "NR"), makeNode("not", 160, 140, "NY"), makeNode("not", 160, 260, "NG"),
        makeNode("led", 440, 20, "RED"), makeNode("led", 440, 140, "YELLOW"), makeNode("led", 440, 260, "GREEN"),
      ],
      wires: [
        makeWire("FF_G", "q", "NR", "a"), makeWire("NR", "out", "FF_R", "d"), makeWire("CLK", "out", "FF_R", "clk"),
        makeWire("FF_R", "q", "NY", "a"), makeWire("NY", "out", "FF_Y", "d"), makeWire("CLK", "out", "FF_Y", "clk"),
        makeWire("FF_Y", "q", "NG", "a"), makeWire("NG", "out", "FF_G", "d"), makeWire("CLK", "out", "FF_G", "clk"),
        makeWire("FF_R", "q", "RED", "r"), makeWire("FF_Y", "q", "YELLOW", "r"), makeWire("FF_G", "q", "GREEN", "r"),
      ],
    }),
  },

  // ─── COMPLEX CIRCUITS ───────────────────────────────────────
  {
    id: "4bit-alu-complex", name: "4-bit ALU (Full)", description: "AND, OR, ADD, SUB on 2-bit operands with mode select",
    category: "Complex", tags: ["alu", "arithmetic", "4-bit", "complex"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A1"), makeNode("toggle", 30, 80, "A0"),
        makeNode("toggle", 30, 180, "B1"), makeNode("toggle", 30, 250, "B0"),
        makeNode("toggle", 30, 350, "SUB"),
        makeNode("and", 200, 10, "AND1"), makeNode("and", 200, 80, "AND0"),
        makeNode("or", 200, 160, "OR1"), makeNode("or", 200, 230, "OR0"),
        makeNode("xor", 160, 250, "X0"), makeNode("xor", 160, 180, "X1"),
        makeNode("full-adder", 340, 10, "FA1"), makeNode("full-adder", 340, 140, "FA0"),
        makeNode("led", 540, 10, "R1"), makeNode("led", 540, 80, "R0"),
        makeNode("bulb", 540, 160, "AND"), makeNode("bulb", 540, 230, "OR"),
        makeNode("bulb", 540, 310, "ADD"),
      ],
      wires: [
        makeWire("A1", "out", "AND1", "a"), makeWire("B1", "out", "AND1", "b"),
        makeWire("A0", "out", "AND0", "a"), makeWire("B0", "out", "AND0", "b"),
        makeWire("A1", "out", "OR1", "a"), makeWire("B1", "out", "OR1", "b"),
        makeWire("A0", "out", "OR0", "a"), makeWire("B0", "out", "OR0", "b"),
        makeWire("B0", "out", "X0", "a"), makeWire("SUB", "out", "X0", "b"),
        makeWire("B1", "out", "X1", "a"), makeWire("SUB", "out", "X1", "b"),
        makeWire("A0", "out", "FA0", "a"), makeWire("X0", "out", "FA0", "b"), makeWire("SUB", "out", "FA0", "cin"),
        makeWire("A1", "out", "FA1", "a"), makeWire("X1", "out", "FA1", "b"), makeWire("FA0", "cout", "FA1", "cin"),
        makeWire("AND1", "out", "R1", "r"), makeWire("AND0", "out", "R0", "r"),
        makeWire("OR1", "out", "AND", "in"), makeWire("OR0", "out", "OR", "in"),
        makeWire("FA1", "sum", "ADD", "in"),
      ],
    }),
  },
  {
    id: "8bit-ripple-adder", name: "8-bit Ripple Carry Adder", description: "Full 8-bit adder chain with carry propagation",
    category: "Complex", tags: ["adder", "8-bit", "ripple-carry", "complex"],
    build: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];
      const makeAdder = (i: number) => {
        const yOff = 40 + i * 70;
        const aSw = makeNode("toggle", 20, yOff, `A${i}`);
        const bSw = makeNode("toggle", 20, yOff + 30, `B${i}`);
        const fa = makeNode("full-adder", 180, yOff, `FA${i}`);
        const sBulb = makeNode("bulb", 400, yOff, `S${i}`);
        nodes.push(aSw, bSw, fa, sBulb);
        wires.push(makeWire(`A${i}`, "out", `FA${i}`, "a"), makeWire(`B${i}`, "out", `FA${i}`, "b"));
        wires.push(makeWire(`FA${i}`, "sum", `S${i}`, "in"));
        return fa;
      };
      const c0 = makeNode("const-0", 20, 600, "C0"); nodes.push(c0);
      const fas: string[] = [];
      for (let i = 0; i < 8; i++) { const fa = makeAdder(i); fas.push(fa.id!); }
      wires.push(makeWire("C0", "out", "FA0", "cin"));
      for (let i = 0; i < 7; i++) wires.push(makeWire(`FA${i}`, "cout", `FA${i + 1}`, "cin"));
      const cout = makeNode("led", 400, 620, "COUT"); nodes.push(cout);
      wires.push(makeWire("FA7", "cout", "COUT", "r"));
      return { nodes, wires };
    },
  },
  {
    id: "4to16-decoder", name: "4:16 Decoder", description: "Full 4-to-16 one-hot decoder from gates",
    category: "Complex", tags: ["decoder", "4-bit", "16-output", "complex"],
    build: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];
      const a = makeNode("toggle", 20, 20, "A"); nodes.push(a);
      const b = makeNode("toggle", 20, 100, "B"); nodes.push(b);
      const c = makeNode("toggle", 20, 180, "C"); nodes.push(c);
      const d = makeNode("toggle", 20, 260, "D"); nodes.push(d);
      const nA = makeNode("not", 120, 10, "nA"); const nB = makeNode("not", 120, 90, "nB");
      const nC = makeNode("not", 120, 170, "nC"); const nD = makeNode("not", 120, 250, "nD");
      nodes.push(nA, nB, nC, nD);
      wires.push(makeWire("A", "out", "nA", "a"), makeWire("B", "out", "nB", "a"));
      wires.push(makeWire("C", "out", "nC", "a"), makeWire("D", "out", "nD", "a"));
      for (let i = 0; i < 16; i++) {
        const bits = [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1];
        const and1 = makeNode("and", 240, 10 + i * 40, `A1_${i}`);
        const and2 = makeNode("and", 360, 10 + i * 40, `A2_${i}`);
        const bulb = makeNode("bulb", 500, 10 + i * 40, `Y${i}`);
        nodes.push(and1, and2, bulb);
        const srcA = bits[0] ? "A" : "nA";
        const srcB = bits[1] ? "B" : "nB";
        const srcC = bits[2] ? "C" : "nC";
        const srcD = bits[3] ? "D" : "nD";
        wires.push(makeWire(srcA, "out", `A1_${i}`, "a"), makeWire(srcB, "out", `A1_${i}`, "b"));
        wires.push(makeWire(srcC, "out", `A2_${i}`, "a"), makeWire(srcD, "out", `A2_${i}`, "b"));
        wires.push(makeWire(`A1_${i}`, "out", `A2_${i}`, "a"));
        wires.push(makeWire(`A2_${i}`, "out", `Y${i}`, "in"));
      }
      return { nodes, wires };
    },
  },
  {
    id: "4bit-magnitude-comp", name: "4-bit Magnitude Comparator", description: "Full A==B and A!=B comparator",
    category: "Complex", tags: ["comparator", "4-bit", "complex"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A3"), makeNode("toggle", 30, 80, "A2"),
        makeNode("toggle", 30, 150, "A1"), makeNode("toggle", 30, 220, "A0"),
        makeNode("toggle", 30, 310, "B3"), makeNode("toggle", 30, 380, "B2"),
        makeNode("toggle", 30, 450, "B1"), makeNode("toggle", 30, 520, "B0"),
        makeNode("xnor", 200, 10, "XN3"), makeNode("xnor", 200, 80, "XN2"),
        makeNode("xnor", 200, 150, "XN1"), makeNode("xnor", 200, 220, "XN0"),
        makeNode("and", 300, 30, "A32"), makeNode("and", 300, 110, "A10"),
        makeNode("and", 400, 60, "EQ_ALL"),
        makeNode("bulb", 540, 60, "A==B"),
        makeNode("xor", 200, 310, "XR3"), makeNode("xor", 200, 380, "XR2"),
        makeNode("xor", 200, 450, "XR1"), makeNode("xor", 200, 520, "XR0"),
        makeNode("or", 320, 340, "O32"), makeNode("or", 320, 480, "O10"),
        makeNode("or", 420, 400, "NEQ"),
        makeNode("bulb", 540, 400, "A!=B"),
      ],
      wires: [
        makeWire("A3", "out", "XN3", "a"), makeWire("B3", "out", "XN3", "b"),
        makeWire("A2", "out", "XN2", "a"), makeWire("B2", "out", "XN2", "b"),
        makeWire("A1", "out", "XN1", "a"), makeWire("B1", "out", "XN1", "b"),
        makeWire("A0", "out", "XN0", "a"), makeWire("B0", "out", "XN0", "b"),
        makeWire("XN3", "out", "A32", "a"), makeWire("XN2", "out", "A32", "b"),
        makeWire("XN1", "out", "A10", "a"), makeWire("XN0", "out", "A10", "b"),
        makeWire("A32", "out", "EQ_ALL", "a"), makeWire("A10", "out", "EQ_ALL", "b"),
        makeWire("EQ_ALL", "out", "A==B", "in"),
        makeWire("A3", "out", "XR3", "a"), makeWire("B3", "out", "XR3", "b"),
        makeWire("A2", "out", "XR2", "a"), makeWire("B2", "out", "XR2", "b"),
        makeWire("A1", "out", "XR1", "a"), makeWire("B1", "out", "XR1", "b"),
        makeWire("A0", "out", "XR0", "a"), makeWire("B0", "out", "XR0", "b"),
        makeWire("XR3", "out", "O32", "a"), makeWire("XR2", "out", "O32", "b"),
        makeWire("XR1", "out", "O10", "a"), makeWire("XR0", "out", "O10", "b"),
        makeWire("O32", "out", "NEQ", "a"), makeWire("O10", "out", "NEQ", "b"),
        makeWire("NEQ", "out", "A!=B", "in"),
      ],
    }),
  },
  {
    id: "4bit-multiplier-complex", name: "4-bit Array Multiplier", description: "Multiplies 2-bit × 2-bit → 4-bit product",
    category: "Complex", tags: ["multiplier", "array", "complex"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A1"), makeNode("toggle", 30, 90, "A0"),
        makeNode("toggle", 30, 200, "B1"), makeNode("toggle", 30, 280, "B0"),
        makeNode("and", 200, 10, "A1B1"), makeNode("and", 200, 90, "A1B0"),
        makeNode("and", 200, 180, "A0B1"), makeNode("and", 200, 260, "A0B0"),
        makeNode("half-adder", 360, 140, "HA1"), makeNode("half-adder", 360, 260, "HA2"),
        makeNode("bulb", 540, 10, "P3"), makeNode("bulb", 540, 100, "P2"),
        makeNode("bulb", 540, 220, "P1"), makeNode("bulb", 540, 320, "P0"),
      ],
      wires: [
        makeWire("A1", "out", "A1B1", "a"), makeWire("B1", "out", "A1B1", "b"),
        makeWire("A1", "out", "A1B0", "a"), makeWire("B0", "out", "A1B0", "b"),
        makeWire("A0", "out", "A0B1", "a"), makeWire("B1", "out", "A0B1", "b"),
        makeWire("A0", "out", "A0B0", "a"), makeWire("B0", "out", "A0B0", "b"),
        makeWire("A0B0", "out", "P0", "in"),
        makeWire("A1B0", "out", "HA1", "a"), makeWire("A0B1", "out", "HA1", "b"),
        makeWire("HA1", "sum", "P1", "in"),
        makeWire("A1B1", "out", "HA2", "a"), makeWire("HA1", "cout", "HA2", "b"),
        makeWire("HA2", "sum", "P2", "in"), makeWire("HA2", "cout", "P3", "in"),
      ],
    }),
  },
  {
    id: "mod3-counter", name: "Mod-3 Counter", description: "Counts 0→1→2→0 using D flip-flops + AND/NOT logic",
    category: "Complex", tags: ["counter", "mod-3", "state-machine", "complex"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 160, "CLK"), makeNode("const-1", 40, 30, "ONE"),
        makeNode("not", 140, 100, "N1"),
        makeNode("and", 200, 20, "D1"), makeNode("and", 200, 120, "D0"),
        makeNode("d-flipflop", 320, 10, "FF1"), makeNode("d-flipflop", 320, 110, "FF0"),
        makeNode("bulb", 520, 10, "Q1"), makeNode("bulb", 520, 110, "Q0"),
        makeNode("hex-display", 520, 200, "COUNT"),
      ],
      wires: [
        makeWire("ONE", "out", "D1", "a"), makeWire("FF0", "qn", "D1", "b"),
        makeWire("FF1", "q", "N1", "a"),
        makeWire("FF0", "q", "D0", "a"), makeWire("N1", "out", "D0", "b"),
        makeWire("D1", "out", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("D0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF1", "q", "Q1", "in"), makeWire("FF0", "q", "Q0", "in"),
        makeWire("FF0", "q", "COUNT", "a"), makeWire("FF1", "q", "COUNT", "b"),
      ],
    }),
  },
  {
    id: "frequency-divider", name: "Frequency Divider (÷8)", description: "3-bit ripple counter divides clock by 8",
    category: "Complex", tags: ["frequency-divider", "clock", "÷8"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 120, "CLK"), makeNode("const-1", 40, 30, "ONE"),
        makeNode("xor", 130, 30, "X0"), makeNode("d-flipflop", 260, 20, "FF0"),
        makeNode("d-flipflop", 260, 110, "FF1"), makeNode("d-flipflop", 260, 200, "FF2"),
        makeNode("bulb", 440, 20, "÷2"), makeNode("bulb", 440, 110, "÷4"), makeNode("bulb", 440, 200, "÷8"),
      ],
      wires: [
        makeWire("ONE", "out", "X0", "a"), makeWire("FF0", "qn", "X0", "b"),
        makeWire("X0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF1", "q", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF0", "q", "÷2", "in"), makeWire("FF1", "q", "÷4", "in"), makeWire("FF2", "q", "÷8", "in"),
      ],
    }),
  },
  {
    id: "even-odd-detector", name: "Even/Odd Parity Detector", description: "Determines if 4-bit input has even or odd parity",
    category: "Complex", tags: ["parity", "detector", "4-bit"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "D3"), makeNode("toggle", 30, 100, "D2"),
        makeNode("toggle", 30, 190, "D1"), makeNode("toggle", 30, 280, "D0"),
        makeNode("xor", 200, 10, "X1"), makeNode("xor", 200, 100, "X0"),
        makeNode("xor", 340, 50, "XOUT"),
        makeNode("bulb", 500, 40, "ODD"), makeNode("bulb", 500, 120, "EVEN"),
      ],
      wires: [
        makeWire("D3", "out", "X1", "a"), makeWire("D2", "out", "X1", "b"),
        makeWire("D1", "out", "X0", "a"), makeWire("D0", "out", "X0", "b"),
        makeWire("X1", "out", "XOUT", "a"), makeWire("X0", "out", "XOUT", "b"),
        makeWire("XOUT", "out", "ODD", "in"), makeWire("XOUT", "out", "EVEN", "in"),
      ],
    }),
  },

  // ─── SCREEN OUTPUT CIRCUITS ──────────────────────────────────
  {
    id: "bcd-to-7seg-display", name: "BCD → 7-Segment Display", description: "4-bit BCD input decoded to 7-segment display with enable",
    category: "Screen Output", tags: ["7-segment", "bcd", "decoder", "display"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A"), makeNode("toggle", 30, 90, "B"),
        makeNode("toggle", 30, 170, "C"), makeNode("toggle", 30, 250, "D"),
        makeNode("bcd-to-7seg", 200, 60, "DEC"),
        makeNode("7-segment", 380, 40, "SEG"),
      ],
      wires: [
        makeWire("A", "out", "DEC", "b0"), makeWire("B", "out", "DEC", "b1"),
        makeWire("C", "out", "DEC", "b2"), makeWire("D", "out", "DEC", "b3"),
        makeWire("DEC", "a", "SEG", "a"), makeWire("DEC", "b", "SEG", "b"),
        makeWire("DEC", "c", "SEG", "c"), makeWire("DEC", "d", "SEG", "d"),
        makeWire("DEC", "e", "SEG", "e"), makeWire("DEC", "f", "SEG", "f"),
        makeWire("DEC", "g", "SEG", "g"),
      ],
    }),
  },
  {
    id: "4bit-counter-hex", name: "4-bit Counter → Hex Display", description: "Binary counter output shown on hex display",
    category: "Screen Output", tags: ["counter", "hex", "display", "sequential"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 160, "CLK"), makeNode("const-1", 40, 30, "ONE"),
        makeNode("xor", 150, 30, "X0"), makeNode("xor", 150, 110, "X1"),
        makeNode("and", 150, 200, "A01"), makeNode("and", 150, 270, "A012"),
        makeNode("d-flipflop", 260, 20, "FF0"), makeNode("d-flipflop", 260, 100, "FF1"),
        makeNode("d-flipflop", 260, 190, "FF2"), makeNode("d-flipflop", 260, 270, "FF3"),
        makeNode("hex-display", 440, 100, "HEX"),
      ],
      wires: [
        makeWire("ONE", "out", "X0", "a"), makeWire("FF0", "qn", "X0", "b"),
        makeWire("X0", "out", "FF0", "d"), makeWire("CLK", "out", "FF0", "clk"),
        makeWire("FF0", "q", "X1", "a"), makeWire("FF1", "qn", "X1", "b"),
        makeWire("X1", "out", "FF1", "d"), makeWire("CLK", "out", "FF1", "clk"),
        makeWire("FF0", "q", "A01", "a"), makeWire("FF1", "q", "A01", "b"),
        makeWire("A01", "out", "A012", "a"), makeWire("FF2", "qn", "A012", "b"),
        makeWire("A012", "out", "FF2", "d"), makeWire("CLK", "out", "FF2", "clk"),
        makeWire("FF2", "q", "FF3", "d"), makeWire("CLK", "out", "FF3", "clk"),
        makeWire("FF0", "out", "HEX", "a"), makeWire("FF1", "out", "HEX", "b"),
        makeWire("FF2", "out", "HEX", "c"), makeWire("FF3", "out", "HEX", "d"),
      ],
    }),
  },
  {
    id: "2bit-multiplier-led", name: "2-bit Multiplier → Bar Graph", description: "Multiplier result displayed on bar graph",
    category: "Screen Output", tags: ["multiplier", "bar-graph", "display", "arithmetic"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 20, "A1"), makeNode("toggle", 40, 100, "A0"),
        makeNode("toggle", 40, 200, "B1"), makeNode("toggle", 40, 280, "B0"),
        makeNode("multiplier-4bit", 220, 80, "MUL"),
        makeNode("bar-graph", 420, 60, "BAR"),
      ],
      wires: [
        makeWire("A0", "out", "MUL", "a0"), makeWire("A1", "out", "MUL", "a1"),
        makeWire("A0", "out", "MUL", "a0"), makeWire("A1", "out", "MUL", "a1"),
        makeWire("B0", "out", "MUL", "b0"), makeWire("B1", "out", "MUL", "b1"),
        makeWire("B0", "out", "MUL", "b0"), makeWire("B1", "out", "MUL", "b1"),
        makeWire("MUL", "p0", "BAR", "i0"), makeWire("MUL", "p1", "BAR", "i1"),
        makeWire("MUL", "p2", "BAR", "i2"), makeWire("MUL", "p3", "BAR", "i3"),
      ],
    }),
  },
  {
    id: "traffic-light-ctrl", name: "Traffic Light Controller", description: "Ring counter driving traffic light display",
    category: "Screen Output", tags: ["traffic-light", "ring-counter", "display", "sequential"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 120, "CLK"),
        makeNode("d-flipflop", 200, 20, "FF_R"), makeNode("d-flipflop", 200, 140, "FF_Y"),
        makeNode("d-flipflop", 200, 260, "FF_G"),
        makeNode("not", 140, 20, "NR"), makeNode("not", 140, 140, "NY"), makeNode("not", 140, 260, "NG"),
        makeNode("traffic-light", 400, 100, "LIGHT"),
      ],
      wires: [
        makeWire("FF_G", "q", "NR", "a"), makeWire("NR", "out", "FF_R", "d"), makeWire("CLK", "out", "FF_R", "clk"),
        makeWire("FF_R", "q", "NY", "a"), makeWire("NY", "out", "FF_Y", "d"), makeWire("CLK", "out", "FF_Y", "clk"),
        makeWire("FF_Y", "q", "NG", "a"), makeWire("NG", "out", "FF_G", "d"), makeWire("CLK", "out", "FF_G", "clk"),
        makeWire("FF_R", "q", "LIGHT", "r"), makeWire("FF_Y", "q", "LIGHT", "y"), makeWire("FF_G", "q", "LIGHT", "g"),
      ],
    }),
  },
  {
    id: "4bit-reg-display", name: "4-bit Register → Indicator Panel", description: "Register output shown on indicator panel",
    category: "Screen Output", tags: ["register", "indicator-panel", "display", "sequential"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "D3"), makeNode("toggle", 30, 80, "D2"),
        makeNode("toggle", 30, 150, "D1"), makeNode("toggle", 30, 220, "D0"),
        makeNode("toggle", 30, 300, "CLK"), makeNode("toggle", 30, 370, "EN"),
        makeNode("reg-4bit", 200, 60, "REG"),
        makeNode("indicator-panel", 400, 50, "PANEL"),
      ],
      wires: [
        makeWire("D3", "out", "REG", "d0"), makeWire("D2", "out", "REG", "d1"),
        makeWire("D1", "out", "REG", "d2"), makeWire("D0", "out", "REG", "d3"),
        makeWire("CLK", "out", "REG", "clk"), makeWire("EN", "out", "REG", "en"),
        makeWire("REG", "q0", "PANEL", "i0"), makeWire("REG", "q1", "PANEL", "i1"),
        makeWire("REG", "q2", "PANEL", "i2"), makeWire("REG", "q3", "PANEL", "i3"),
      ],
    }),
  },
  {
    id: "priority-encoder-hex", name: "Priority Encoder → Hex Display", description: "8:3 priority encoder with hex readout",
    category: "Screen Output", tags: ["encoder", "hex", "display", "combinational"],
    build: () => ({
      nodes: [
        makeNode("toggle", 20, 10, "D7"), makeNode("toggle", 20, 60, "D6"),
        makeNode("toggle", 20, 110, "D5"), makeNode("toggle", 20, 160, "D4"),
        makeNode("toggle", 20, 230, "D3"), makeNode("toggle", 20, 280, "D2"),
        makeNode("toggle", 20, 330, "D1"), makeNode("toggle", 20, 380, "D0"),
        makeNode("prio-encoder-8to3", 200, 120, "PE"),
        makeNode("hex-display", 400, 130, "HEX"),
      ],
      wires: [
        makeWire("D0", "out", "PE", "i0"), makeWire("D1", "out", "PE", "i1"),
        makeWire("D2", "out", "PE", "i2"), makeWire("D3", "out", "PE", "i3"),
        makeWire("D4", "out", "PE", "i4"), makeWire("D5", "out", "PE", "i5"),
        makeWire("D6", "out", "PE", "i6"), makeWire("D7", "out", "PE", "i7"),
        makeWire("PE", "y0", "HEX", "a"), makeWire("PE", "y1", "HEX", "b"),
        makeWire("PE", "y2", "HEX", "c"),
      ],
    }),
  },
  {
    id: "alu-status-leds", name: "ALU → Status LEDs + Hex Display", description: "4-bit ALU with result on hex and status on RGB LED",
    category: "Screen Output", tags: ["alu", "hex", "rgb-led", "display", "arithmetic"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A1"), makeNode("toggle", 30, 80, "A0"),
        makeNode("toggle", 30, 180, "B1"), makeNode("toggle", 30, 250, "B0"),
        makeNode("toggle", 30, 340, "S0"), makeNode("toggle", 30, 400, "S1"),
        makeNode("alu-4bit", 200, 80, "ALU"),
        makeNode("hex-display", 400, 40, "RESULT"),
        makeNode("led", 400, 140, "COUT"),
      ],
      wires: [
        makeWire("A0", "out", "ALU", "a0"), makeWire("A1", "out", "ALU", "a1"),
        makeWire("B0", "out", "ALU", "b0"), makeWire("B1", "out", "ALU", "b1"),
        makeWire("S0", "out", "ALU", "s0"), makeWire("S1", "out", "ALU", "s1"),
        makeWire("ALU", "o0", "RESULT", "a"), makeWire("ALU", "o1", "RESULT", "b"),
        makeWire("ALU", "o2", "RESULT", "c"), makeWire("ALU", "o3", "RESULT", "d"),
        makeWire("ALU", "cout", "COUT", "r"),
      ],
    }),
  },
  {
    id: "dot-matrix-shift", name: "Shift Register → Dot Matrix", description: "8-bit shift register driving 5×5 dot matrix display",
    category: "Screen Output", tags: ["shift-register", "dot-matrix", "display", "sequential"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 20, "SIN"), makeNode("toggle", 30, 340, "CLK"),
        makeNode("toggle", 30, 400, "EN"),
        makeNode("sipo-en", 200, 120, "SR"),
        makeNode("dot-matrix", 400, 80, "MATRIX"),
      ],
      wires: [
        makeWire("SIN", "out", "SR", "in"), makeWire("CLK", "out", "SR", "clk"), makeWire("EN", "out", "SR", "en"),
        makeWire("SR", "q0", "MATRIX", "p0"), makeWire("SR", "q1", "MATRIX", "p1"),
        makeWire("SR", "q2", "MATRIX", "p2"), makeWire("SR", "q3", "MATRIX", "p3"),
        makeWire("SR", "q4", "MATRIX", "p4"),
      ],
    }),
  },
  {
    id: "stopwatch-display", name: "Stopwatch → Dual Display", description: "Mod-6 and Mod-10 counters on digit displays",
    category: "Screen Output", tags: ["counter", "digit-display", "display", "sequential", "stopwatch"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 100, "CLK"), makeNode("toggle", 40, 220, "EN"),
        makeNode("counter-mod10", 200, 20, "CNT_SEC"),
        makeNode("counter-mod6", 200, 140, "CNT_TEN"),
        makeNode("digit-display", 400, 20, "SEC"),
        makeNode("digit-display", 400, 140, "TEN"),
      ],
      wires: [
        makeWire("CLK", "out", "CNT_SEC", "clk"), makeWire("EN", "out", "CNT_SEC", "en"),
        makeWire("CNT_SEC", "o0", "SEC", "d0"), makeWire("CNT_SEC", "o1", "SEC", "d1"),
        makeWire("CNT_SEC", "o2", "SEC", "d2"), makeWire("CNT_SEC", "o3", "SEC", "d3"),
        makeWire("CNT_SEC", "o0", "CNT_TEN", "clk"),
        makeWire("CNT_TEN", "o0", "TEN", "d0"), makeWire("CNT_TEN", "o1", "TEN", "d1"),
        makeWire("CNT_TEN", "o2", "TEN", "d2"),
      ],
    }),
  },
  {
    id: "adder-4bit-7seg", name: "4-bit Adder → Dual 7-Segment", description: "4-bit adder result decoded to two 7-segment displays",
    category: "Screen Output", tags: ["adder", "7-segment", "display", "arithmetic"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "A3"), makeNode("toggle", 30, 80, "A2"),
        makeNode("toggle", 30, 150, "A1"), makeNode("toggle", 30, 220, "A0"),
        makeNode("toggle", 30, 310, "B3"), makeNode("toggle", 30, 380, "B2"),
        makeNode("toggle", 30, 450, "B1"), makeNode("toggle", 30, 520, "B0"),
        makeNode("const-0", 30, 590, "C0"),
        makeNode("adder-4bit", 200, 200, "ADD"),
        makeNode("bcd-to-7seg", 400, 100, "DEC_LO"),
        makeNode("bcd-to-7seg", 400, 300, "DEC_HI"),
        makeNode("7-segment", 580, 80, "SEG_LO"),
        makeNode("7-segment", 580, 280, "SEG_HI"),
      ],
      wires: [
        makeWire("A0", "out", "ADD", "a0"), makeWire("A1", "out", "ADD", "a1"),
        makeWire("A2", "out", "ADD", "a2"), makeWire("A3", "out", "ADD", "a3"),
        makeWire("B0", "out", "ADD", "b0"), makeWire("B1", "out", "ADD", "b1"),
        makeWire("B2", "out", "ADD", "b2"), makeWire("B3", "out", "ADD", "b3"),
        makeWire("C0", "out", "ADD", "cin"),
        makeWire("ADD", "s0", "DEC_LO", "b0"), makeWire("ADD", "s1", "DEC_LO", "b1"),
        makeWire("ADD", "s2", "DEC_LO", "b2"), makeWire("ADD", "s3", "DEC_LO", "b3"),
        makeWire("DEC_LO", "a", "SEG_LO", "a"), makeWire("DEC_LO", "b", "SEG_LO", "b"),
        makeWire("DEC_LO", "c", "SEG_LO", "c"), makeWire("DEC_LO", "d", "SEG_LO", "d"),
        makeWire("DEC_LO", "e", "SEG_LO", "e"), makeWire("DEC_LO", "f", "SEG_LO", "f"),
        makeWire("DEC_LO", "g", "SEG_LO", "g"),
        makeWire("ADD", "cout", "DEC_HI", "b0"),
        makeWire("DEC_HI", "a", "SEG_HI", "a"), makeWire("DEC_HI", "b", "SEG_HI", "b"),
        makeWire("DEC_HI", "c", "SEG_HI", "c"), makeWire("DEC_HI", "d", "SEG_HI", "d"),
        makeWire("DEC_HI", "e", "SEG_HI", "e"), makeWire("DEC_HI", "f", "SEG_HI", "f"),
        makeWire("DEC_HI", "g", "SEG_HI", "g"),
      ],
    }),
  },

  // ─── AI / NEURAL NETWORK ────────────────────────────────────
  {
    id: "ai-sigmoid-neuron", name: "Sigmoid Neuron (Step)", description: "Threshold neuron: if sum(A·W) > T → ON. Models artificial neuron",
    category: "AI / Neural", tags: ["neuron", "sigmoid", "threshold", "ai", "neural-network"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "X1"), makeNode("toggle", 30, 100, "X2"),
        makeNode("toggle", 30, 190, "W1"), makeNode("toggle", 30, 280, "W2"),
        makeNode("toggle", 30, 370, "THRESH"),
        makeNode("and", 200, 20, "M1"), makeNode("and", 200, 110, "M2"),
        makeNode("full-adder", 380, 50, "ADD"),
        makeNode("bulb", 560, 40, "OUTPUT"),
        makeNode("bulb", 560, 120, "SUM"),
      ],
      wires: [
        makeWire("X1", "out", "M1", "a"), makeWire("W1", "out", "M1", "b"),
        makeWire("X2", "out", "M2", "a"), makeWire("W2", "out", "M2", "b"),
        makeWire("M1", "out", "ADD", "a"), makeWire("M2", "out", "ADD", "b"),
        makeWire("THRESH", "out", "ADD", "cin"),
        makeWire("ADD", "sum", "SUM", "in"), makeWire("ADD", "cout", "OUTPUT", "in"),
      ],
    }),
  },
  {
    id: "ai-perceptron", name: "Single-Layer Perceptron", description: "3 inputs × weights → AND of all → single neuron output",
    category: "AI / Neural", tags: ["perceptron", "neuron", "ai", "classification"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "X1"), makeNode("toggle", 30, 100, "X2"), makeNode("toggle", 30, 190, "X3"),
        makeNode("toggle", 30, 300, "W1"), makeNode("toggle", 30, 380, "W2"), makeNode("toggle", 30, 460, "W3"),
        makeNode("and", 200, 10, "M1"), makeNode("and", 200, 100, "M2"), makeNode("and", 200, 190, "M3"),
        makeNode("and", 360, 50, "AND12"), makeNode("and", 360, 150, "AND3M"),
        makeNode("bulb", 540, 100, "OUTPUT"),
      ],
      wires: [
        makeWire("X1", "out", "M1", "a"), makeWire("W1", "out", "M1", "b"),
        makeWire("X2", "out", "M2", "a"), makeWire("W2", "out", "M2", "b"),
        makeWire("X3", "out", "M3", "a"), makeWire("W3", "out", "M3", "b"),
        makeWire("M1", "out", "AND12", "a"), makeWire("M2", "out", "AND12", "b"),
        makeWire("AND12", "out", "AND3M", "a"), makeWire("M3", "out", "AND3M", "b"),
        makeWire("AND3M", "out", "OUTPUT", "in"),
      ],
    }),
  },
  {
    id: "ai-and-gate-nn", name: "AND Gate Neural Network", description: "2-input perceptron trained to learn AND function",
    category: "AI / Neural", tags: ["neural-network", "and-gate", "learning", "ai", "ml"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 30, "X1"), makeNode("toggle", 30, 160, "X2"),
        makeNode("toggle", 30, 280, "W1"), makeNode("toggle", 30, 380, "W2"),
        makeNode("toggle", 30, 480, "BIAS"),
        makeNode("and", 200, 30, "M1"), makeNode("and", 200, 160, "M2"),
        makeNode("or", 340, 60, "SUM"), makeNode("and", 340, 180, "ACT"),
        makeNode("not", 340, 280, "NBIAS"),
        makeNode("bulb", 520, 70, "Y"),
      ],
      wires: [
        makeWire("X1", "out", "M1", "a"), makeWire("W1", "out", "M1", "b"),
        makeWire("X2", "out", "M2", "a"), makeWire("W2", "out", "M2", "b"),
        makeWire("M1", "out", "SUM", "a"), makeWire("M2", "out", "SUM", "b"),
        makeWire("BIAS", "out", "NBIAS", "a"),
        makeWire("SUM", "out", "ACT", "a"), makeWire("NBIAS", "out", "ACT", "b"),
        makeWire("ACT", "out", "Y", "in"),
      ],
    }),
  },
  {
    id: "ai-or-gate-nn", name: "OR Gate Neural Network", description: "2-input perceptron that learns OR function",
    category: "AI / Neural", tags: ["neural-network", "or-gate", "learning", "ai", "ml"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 30, "X1"), makeNode("toggle", 30, 160, "X2"),
        makeNode("toggle", 30, 280, "W1"), makeNode("toggle", 30, 380, "W2"),
        makeNode("toggle", 30, 480, "BIAS"),
        makeNode("and", 200, 30, "M1"), makeNode("and", 200, 160, "M2"),
        makeNode("or", 340, 60, "SUM"), makeNode("or", 340, 180, "ACT"),
        makeNode("bulb", 520, 70, "Y"),
      ],
      wires: [
        makeWire("X1", "out", "M1", "a"), makeWire("W1", "out", "M1", "b"),
        makeWire("X2", "out", "M2", "a"), makeWire("W2", "out", "M2", "b"),
        makeWire("M1", "out", "SUM", "a"), makeWire("M2", "out", "SUM", "b"),
        makeWire("SUM", "out", "ACT", "a"), makeWire("BIAS", "out", "ACT", "b"),
        makeWire("ACT", "out", "Y", "in"),
      ],
    }),
  },
  {
    id: "ai-xor-nn", name: "XOR Gate Neural Network (2-layer)", description: "2-layer network solving XOR — the classic AI proof",
    category: "AI / Neural", tags: ["neural-network", "xor", "deep-learning", "ai", "ml", "backpropagation"],
    build: () => ({
      nodes: [
        makeNode("toggle", 20, 20, "X1"), makeNode("toggle", 20, 120, "X2"),
        makeNode("toggle", 20, 250, "W11"), makeNode("toggle", 20, 340, "W12"),
        makeNode("toggle", 20, 430, "W21"), makeNode("toggle", 20, 520, "W22"),
        makeNode("toggle", 20, 610, "B1"), makeNode("toggle", 20, 690, "B2"),
        makeNode("and", 180, 20, "H1"), makeNode("and", 180, 120, "H2"),
        makeNode("or", 320, 50, "SUM_H"), makeNode("and", 320, 150, "ACT_H"),
        makeNode("and", 460, 40, "O1"), makeNode("and", 460, 140, "O2"),
        makeNode("or", 580, 70, "OUT_SUM"), makeNode("and", 580, 170, "OUT_ACT"),
        makeNode("bulb", 740, 80, "Y"),
      ],
      wires: [
        makeWire("X1", "out", "H1", "a"), makeWire("W11", "out", "H1", "b"),
        makeWire("X2", "out", "H2", "a"), makeWire("W12", "out", "H2", "b"),
        makeWire("H1", "out", "SUM_H", "a"), makeWire("H2", "out", "SUM_H", "b"),
        makeWire("SUM_H", "out", "ACT_H", "a"), makeWire("B1", "out", "ACT_H", "b"),
        makeWire("ACT_H", "out", "O1", "a"), makeWire("W21", "out", "O1", "b"),
        makeWire("ACT_H", "out", "O2", "a"), makeWire("W22", "out", "O2", "b"),
        makeWire("O1", "out", "OUT_SUM", "a"), makeWire("O2", "out", "OUT_SUM", "b"),
        makeWire("OUT_SUM", "out", "OUT_ACT", "a"), makeWire("B2", "out", "OUT_ACT", "b"),
        makeWire("OUT_ACT", "out", "Y", "in"),
      ],
    }),
  },
  {
    id: "ai-half-adder-nn", name: "Half Adder Neural Network", description: "2-layer NN that learns Sum (XOR) and Carry (AND)",
    category: "AI / Neural", tags: ["neural-network", "half-adder", "ai", "binary-arithmetic"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 20, "A"), makeNode("toggle", 30, 140, "B"),
        makeNode("toggle", 30, 280, "WA"), makeNode("toggle", 30, 380, "WB"),
        makeNode("toggle", 30, 480, "BIAS"),
        makeNode("and", 220, 20, "M1"), makeNode("and", 220, 140, "M2"),
        makeNode("and", 220, 280, "MC1"), makeNode("and", 220, 380, "MC2"),
        makeNode("or", 380, 60, "SUM_O"), makeNode("and", 380, 180, "SUM_A"),
        makeNode("or", 380, 310, "CARRY"),
        makeNode("bulb", 560, 70, "SUM"), makeNode("bulb", 560, 320, "CARRY_OUT"),
      ],
      wires: [
        makeWire("A", "out", "M1", "a"), makeWire("WA", "out", "M1", "b"),
        makeWire("B", "out", "M2", "a"), makeWire("WB", "out", "M2", "b"),
        makeWire("M1", "out", "SUM_O", "a"), makeWire("M2", "out", "SUM_O", "b"),
        makeWire("SUM_O", "out", "SUM_A", "a"), makeWire("BIAS", "out", "SUM_A", "b"),
        makeWire("A", "out", "MC1", "a"), makeWire("WA", "out", "MC1", "b"),
        makeWire("B", "out", "MC2", "a"), makeWire("WB", "out", "MC2", "b"),
        makeWire("MC1", "out", "CARRY", "a"), makeWire("MC2", "out", "CARRY", "b"),
        makeWire("SUM_A", "out", "SUM", "in"), makeWire("CARRY", "out", "CARRY_OUT", "in"),
      ],
    }),
  },
  {
    id: "ai-majority-nn", name: "Majority Voter Neural Network", description: "3-input NN: output HIGH if 2+ inputs HIGH",
    category: "AI / Neural", tags: ["neural-network", "majority", "ai", "voting"],
    build: () => ({
      nodes: [
        makeNode("toggle", 30, 10, "X1"), makeNode("toggle", 30, 110, "X2"), makeNode("toggle", 30, 210, "X3"),
        makeNode("toggle", 30, 330, "W1"), makeNode("toggle", 30, 420, "W2"), makeNode("toggle", 30, 510, "W3"),
        makeNode("and", 220, 10, "M1"), makeNode("and", 220, 110, "M2"), makeNode("and", 220, 210, "M3"),
        makeNode("or", 380, 40, "O12"), makeNode("or", 380, 140, "O3B"),
        makeNode("bulb", 540, 90, "MAJORITY"),
      ],
      wires: [
        makeWire("X1", "out", "M1", "a"), makeWire("W1", "out", "M1", "b"),
        makeWire("X2", "out", "M2", "a"), makeWire("W2", "out", "M2", "b"),
        makeWire("X3", "out", "M3", "a"), makeWire("W3", "out", "M3", "b"),
        makeWire("M1", "out", "O12", "a"), makeWire("M2", "out", "O12", "b"),
        makeWire("O12", "out", "O3B", "a"), makeWire("M3", "out", "O3B", "b"),
        makeWire("O3B", "out", "MAJORITY", "in"),
      ],
    }),
  },
  {
    id: "ai-activation-functions", name: "Activation Function Comparisons", description: "Same input → AND (ReLU-like), OR (Max-like), XOR (nonlinear)",
    category: "AI / Neural", tags: ["activation", "relu", "nonlinear", "ai", "deep-learning"],
    build: () => ({
      nodes: [
        makeNode("toggle", 40, 30, "X1"), makeNode("toggle", 40, 160, "X2"),
        makeNode("and", 220, 20, "RELU"), makeNode("or", 220, 110, "MAX"),
        makeNode("xor", 220, 200, "XOR_NL"),
        makeNode("bulb", 420, 30, "AND_OUT"), makeNode("bulb", 420, 120, "OR_OUT"),
        makeNode("bulb", 420, 210, "XOR_OUT"),
      ],
      wires: [
        makeWire("X1", "out", "RELU", "a"), makeWire("X2", "out", "RELU", "b"),
        makeWire("X1", "out", "MAX", "a"), makeWire("X2", "out", "MAX", "b"),
        makeWire("X1", "out", "XOR_NL", "a"), makeWire("X2", "out", "XOR_NL", "b"),
        makeWire("RELU", "out", "AND_OUT", "in"), makeWire("MAX", "out", "OR_OUT", "in"),
        makeWire("XOR_NL", "out", "XOR_OUT", "in"),
      ],
    }),
  },

  // ─── REAL-WORLD SYSTEMS ─────────────────────────────────────
  {
    id: "temp-monitor-system",
    name: "Temperature Monitor",
    description: "Temperature sensor → microcontroller → OLED display",
    category: "Real-World",
    tags: ["sensor", "temperature", "microcontroller", "display", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNodeOn("toggle", 30, 150, "EN"),
        makeNode("battery", 30, 230, "BATT"),
        makeNode("temp-sensor", 30, 340, "SENSOR"),
        makeNode("microcontroller", 280, 120, "MCU"),
        makeNode("oled-display", 530, 120, "DISPLAY"),
        makeNode("led", 530, 250, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "MCU", "clk"), makeWire("RST", "out", "MCU", "rst"),
        makeWire("EN", "out", "MCU", "en"),
        makeWire("SENSOR", "d0", "MCU", "d0"), makeWire("SENSOR", "d1", "MCU", "d1"),
        makeWire("SENSOR", "d2", "MCU", "d2"), makeWire("SENSOR", "d3", "MCU", "d3"),
        makeWire("SENSOR", "d4", "MCU", "d4"), makeWire("SENSOR", "d5", "MCU", "d5"),
        makeWire("SENSOR", "d6", "MCU", "d6"), makeWire("SENSOR", "d7", "MCU", "d7"),
        makeWire("MCU", "d0", "DISPLAY", "d0"), makeWire("MCU", "d1", "DISPLAY", "d1"),
        makeWire("MCU", "d2", "DISPLAY", "d2"), makeWire("MCU", "d3", "DISPLAY", "d3"),
        makeWire("MCU", "d4", "DISPLAY", "d4"), makeWire("MCU", "d5", "DISPLAY", "d5"),
        makeWire("MCU", "d6", "DISPLAY", "d6"), makeWire("MCU", "d7", "DISPLAY", "d7"),
        makeWire("MCU", "tx", "DISPLAY", "clk"),
        makeWire("MCU", "tx", "LED", "r"), makeWire("EN", "out", "LED", "g"),
      ],
    }),
  },
  {
    id: "smart-home-hub",
    name: "Smart Home Hub",
    description: "Multi-sensor hub: temp + humidity + motion + light → MCU → WiFi + Bluetooth + relay",
    category: "Real-World",
    tags: ["smart-home", "sensor", "iot", "wifi", "bluetooth", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNodeOn("toggle", 30, 150, "EN"),
        makeNode("battery", 30, 220, "BATT"),
        makeNode("temp-sensor", 30, 330, "TEMP"),
        makeNode("humidity-sensor", 30, 440, "HUM"),
        makeNode("motion-sensor", 30, 540, "MOTION"),
        makeNode("light-sensor", 30, 610, "LIGHT"),
        makeNode("microcontroller", 280, 200, "MCU"),
        makeNode("wifi-block", 530, 80, "WIFI"),
        makeNode("bluetooth-block", 530, 230, "BT"),
        makeNode("relay", 530, 380, "RELAY"),
        makeNode("buzzer", 530, 480, "BUZZ"),
        makeNode("led", 700, 200, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "MCU", "clk"), makeWire("RST", "out", "MCU", "rst"),
        makeWire("EN", "out", "MCU", "en"),
        makeWire("TEMP", "d0", "MCU", "d0"), makeWire("TEMP", "d1", "MCU", "d1"),
        makeWire("HUM", "d2", "MCU", "d2"), makeWire("HUM", "d3", "MCU", "d3"),
        makeWire("MOTION", "out", "MCU", "d4"),
        makeWire("LIGHT", "d5", "MCU", "d5"), makeWire("LIGHT", "d6", "MCU", "d6"),
        makeWire("MCU", "d0", "WIFI", "d0"), makeWire("MCU", "d1", "WIFI", "d1"),
        makeWire("MCU", "d2", "WIFI", "d2"), makeWire("MCU", "d3", "WIFI", "d3"),
        makeWire("MCU", "tx", "WIFI", "clk"), makeWire("EN", "out", "WIFI", "en"),
        makeWire("MCU", "d0", "BT", "d0"), makeWire("MCU", "d1", "BT", "d1"),
        makeWire("MCU", "d2", "BT", "d2"), makeWire("MCU", "d3", "BT", "d3"),
        makeWire("MCU", "tx", "BT", "clk"), makeWire("EN", "out", "BT", "en"),
        makeWire("MCU", "d0", "RELAY", "coil"),
        makeWire("MOTION", "out", "BUZZ", "in"),
        makeWire("MCU", "tx", "LED", "r"), makeWire("WIFI", "connected", "LED", "g"),
      ],
    }),
  },
  {
    id: "robot-obstacle-avoid",
    name: "Robot Obstacle Avoider",
    description: "Ultrasonic + IR sensors → FPGA → DC motor + servo + buzzer",
    category: "Real-World",
    tags: ["robot", "sensor", "fpga", "motor", "obstacle-avoidance"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNodeOn("toggle", 30, 80, "EN"),
        makeNode("battery", 30, 160, "BATT"),
        makeNode("ultrasonic-sensor", 30, 270, "ULTRA"),
        makeNode("ir-sensor", 30, 440, "IR"),
        makeNode("fpga-block", 280, 150, "FPGA"),
        makeNode("dc-motor", 530, 50, "MOTOR"),
        makeNode("servo-motor", 530, 180, "SERVO"),
        makeNode("buzzer", 530, 300, "BUZZ"),
        makeNode("led", 530, 400, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "FPGA", "clk"), makeWire("EN", "out", "FPGA", "en"),
        makeWire("ULTRA", "d0", "FPGA", "d0"), makeWire("ULTRA", "d1", "FPGA", "d1"),
        makeWire("ULTRA", "d2", "FPGA", "d2"), makeWire("ULTRA", "d3", "FPGA", "d3"),
        makeWire("ULTRA", "d4", "FPGA", "d4"), makeWire("ULTRA", "d5", "FPGA", "d5"),
        makeWire("ULTRA", "d6", "FPGA", "d6"),
        makeWire("IR", "out", "FPGA", "d7"),
        makeWire("FPGA", "d0", "MOTOR", "in1"), makeWire("FPGA", "d1", "MOTOR", "in2"),
        makeWire("FPGA", "d2", "SERVO", "in"), makeWire("FPGA", "d3", "SERVO", "en"),
        makeWire("FPGA", "d4", "BUZZ", "in"),
        makeWire("FPGA", "d5", "LED", "r"), makeWire("FPGA", "d6", "LED", "g"),
        makeWire("FPGA", "d7", "LED", "b"),
      ],
    }),
  },
  {
    id: "data-logger-system",
    name: "Data Logger",
    description: "Multi-sensor data → CPU → RAM storage → UART serial output",
    category: "Real-World",
    tags: ["data-logger", "sensor", "memory", "uart", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("toggle", 30, 150, "IRQ"),
        makeNode("toggle", 30, 220, "WR"),
        makeNode("battery", 30, 300, "BATT"),
        makeNode("temp-sensor", 30, 400, "TEMP"),
        makeNode("humidity-sensor", 30, 510, "HUM"),
        makeNode("pressure-sensor", 30, 620, "PRES"),
        makeNode("cpu-block", 280, 180, "CPU"),
        makeNode("ram-block", 500, 180, "RAM"),
        makeNode("uart-block", 700, 180, "UART"),
        makeNode("led", 700, 310, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "CPU", "clk"), makeWire("RST", "out", "CPU", "rst"),
        makeWire("IRQ", "out", "CPU", "irq"),
        makeWire("TEMP", "d0", "CPU", "d0"), makeWire("TEMP", "d1", "CPU", "d1"),
        makeWire("TEMP", "d2", "CPU", "d2"), makeWire("TEMP", "d3", "CPU", "d3"),
        makeWire("HUM", "d4", "CPU", "d4"), makeWire("HUM", "d5", "CPU", "d5"),
        makeWire("PRES", "d6", "CPU", "d6"), makeWire("PRES", "d7", "CPU", "d7"),
        makeWire("CPU", "d0", "RAM", "d0"), makeWire("CPU", "d1", "RAM", "d1"),
        makeWire("CPU", "d2", "RAM", "d2"), makeWire("CPU", "d3", "RAM", "d3"),
        makeWire("CPU", "a0", "RAM", "a0"), makeWire("CPU", "a1", "RAM", "a1"),
        makeWire("CPU", "a2", "RAM", "a2"), makeWire("CPU", "a3", "RAM", "a3"),
        makeWire("WR", "out", "RAM", "wr"), makeWire("CLK", "out", "RAM", "clk"),
        makeWire("RAM", "q0", "UART", "d0"), makeWire("RAM", "q1", "UART", "d1"),
        makeWire("RAM", "q2", "UART", "d2"), makeWire("RAM", "q3", "UART", "d3"),
        makeWire("CLK", "out", "UART", "clk"), makeWire("IRQ", "out", "UART", "start"),
        makeWire("UART", "tx", "LED", "r"), makeWire("UART", "busy", "LED", "g"),
      ],
    }),
  },
  {
    id: "access-control",
    name: "RFID Access Control",
    description: "RFID reader → microcontroller → LCD + relay + buzzer",
    category: "Real-World",
    tags: ["rfid", "access-control", "security", "microcontroller", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNodeOn("toggle", 30, 150, "EN"),
        makeNode("battery", 30, 230, "BATT"),
        makeNode("rfid-reader", 30, 340, "RFID"),
        makeNode("microcontroller", 280, 150, "MCU"),
        makeNode("lcd-display", 530, 50, "LCD"),
        makeNode("relay", 530, 200, "RELAY"),
        makeNode("buzzer", 530, 350, "BUZZ"),
        makeNode("led", 530, 440, "LED"),
      ],
      wires: [
        makeWire("EN", "out", "RFID", "en"),
        makeWire("CLK", "out", "MCU", "clk"), makeWire("RST", "out", "MCU", "rst"),
        makeWire("EN", "out", "MCU", "en"),
        makeWire("RFID", "d0", "MCU", "d0"), makeWire("RFID", "d1", "MCU", "d1"),
        makeWire("RFID", "d2", "MCU", "d2"), makeWire("RFID", "d3", "MCU", "d3"),
        makeWire("RFID", "d4", "MCU", "d4"), makeWire("RFID", "d5", "MCU", "d5"),
        makeWire("RFID", "d6", "MCU", "d6"),
        makeWire("RFID", "valid", "MCU", "d7"),
        makeWire("MCU", "d0", "LCD", "d0"), makeWire("MCU", "d1", "LCD", "d1"),
        makeWire("MCU", "d2", "LCD", "d2"), makeWire("MCU", "d3", "LCD", "d3"),
        makeWire("MCU", "d4", "LCD", "d4"), makeWire("MCU", "d5", "LCD", "d5"),
        makeWire("MCU", "d6", "LCD", "d6"), makeWire("MCU", "d7", "LCD", "d7"),
        makeWire("MCU", "tx", "LCD", "clk"),
        makeWire("MCU", "d0", "RELAY", "coil"),
        makeWire("MCU", "d1", "BUZZ", "in"),
        makeWire("MCU", "d2", "LED", "r"), makeWire("MCU", "d3", "LED", "g"),
      ],
    }),
  },
  {
    id: "industrial-ctrl",
    name: "Industrial Controller",
    description: "Multi-sensor → CPU → RAM → CAN bus → motor + relay",
    category: "Real-World",
    tags: ["industrial", "can-bus", "cpu", "motor", "control-system"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("toggle", 30, 150, "IRQ"),
        makeNode("toggle", 30, 220, "WR"),
        makeNode("battery", 30, 300, "BATT"),
        makeNode("temp-sensor", 30, 400, "TEMP"),
        makeNode("pressure-sensor", 30, 510, "PRES"),
        makeNode("motion-sensor", 30, 610, "MOTION"),
        makeNode("cpu-block", 280, 150, "CPU"),
        makeNode("ram-block", 480, 100, "RAM"),
        makeNode("can-bus", 480, 280, "CAN"),
        makeNode("dc-motor", 700, 100, "MOTOR"),
        makeNode("relay", 700, 250, "RELAY"),
        makeNode("buzzer", 700, 400, "BUZZ"),
        makeNode("led", 700, 480, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "CPU", "clk"), makeWire("RST", "out", "CPU", "rst"),
        makeWire("IRQ", "out", "CPU", "irq"),
        makeWire("TEMP", "d0", "CPU", "d0"), makeWire("TEMP", "d1", "CPU", "d1"),
        makeWire("TEMP", "d2", "CPU", "d2"), makeWire("TEMP", "d3", "CPU", "d3"),
        makeWire("PRES", "d4", "CPU", "d4"), makeWire("PRES", "d5", "CPU", "d5"),
        makeWire("MOTION", "out", "CPU", "d6"),
        makeWire("CPU", "d0", "RAM", "d0"), makeWire("CPU", "d1", "RAM", "d1"),
        makeWire("CPU", "d2", "RAM", "d2"), makeWire("CPU", "d3", "RAM", "d3"),
        makeWire("CPU", "a0", "RAM", "a0"), makeWire("CPU", "a1", "RAM", "a1"),
        makeWire("CPU", "a2", "RAM", "a2"), makeWire("CPU", "a3", "RAM", "a3"),
        makeWire("WR", "out", "RAM", "wr"), makeWire("CLK", "out", "RAM", "clk"),
        makeWire("RAM", "q0", "CAN", "d0"), makeWire("RAM", "q1", "CAN", "d1"),
        makeWire("RAM", "q2", "CAN", "d2"), makeWire("RAM", "q3", "CAN", "d3"),
        makeWire("CLK", "out", "CAN", "clk"),
        makeWire("CAN", "tx", "MOTOR", "in1"), makeWire("CAN", "ack", "MOTOR", "in2"),
        makeWire("CAN", "busy", "RELAY", "coil"),
        makeWire("CPU", "d7", "BUZZ", "in"),
        makeWire("CPU", "wr", "LED", "r"), makeWire("CPU", "rd", "LED", "g"),
      ],
    }),
  },
  {
    id: "weather-station",
    name: "Weather Station",
    description: "4-sensor weather → CPU → flash storage → WiFi + LCD",
    category: "Real-World",
    tags: ["weather", "sensor", "iot", "wifi", "flash", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("toggle", 30, 150, "IRQ"),
        makeNode("toggle", 30, 220, "WR"),
        makeNode("battery", 30, 300, "BATT"),
        makeNode("temp-sensor", 30, 400, "TEMP"),
        makeNode("humidity-sensor", 30, 510, "HUM"),
        makeNode("pressure-sensor", 30, 620, "PRES"),
        makeNode("light-sensor", 30, 730, "LIGHT"),
        makeNode("cpu-block", 280, 200, "CPU"),
        makeNode("flash-block", 500, 150, "FLASH"),
        makeNode("wifi-block", 720, 80, "WIFI"),
        makeNode("lcd-display", 720, 250, "LCD"),
        makeNode("buzzer", 720, 370, "BUZZ"),
        makeNode("led", 500, 370, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "CPU", "clk"), makeWire("RST", "out", "CPU", "rst"),
        makeWire("IRQ", "out", "CPU", "irq"),
        makeWire("TEMP", "d0", "CPU", "d0"), makeWire("TEMP", "d1", "CPU", "d1"),
        makeWire("HUM", "d2", "CPU", "d2"), makeWire("HUM", "d3", "CPU", "d3"),
        makeWire("PRES", "d4", "CPU", "d4"), makeWire("PRES", "d5", "CPU", "d5"),
        makeWire("LIGHT", "d6", "CPU", "d6"), makeWire("LIGHT", "d7", "CPU", "d7"),
        makeWire("CPU", "d0", "FLASH", "d0"), makeWire("CPU", "d1", "FLASH", "d1"),
        makeWire("CPU", "d2", "FLASH", "d2"), makeWire("CPU", "d3", "FLASH", "d3"),
        makeWire("CPU", "a0", "FLASH", "a0"), makeWire("CPU", "a1", "FLASH", "a1"),
        makeWire("CPU", "a2", "FLASH", "a2"), makeWire("CPU", "a3", "FLASH", "a3"),
        makeWire("WR", "out", "FLASH", "wr"), makeWire("CLK", "out", "FLASH", "clk"),
        makeWire("FLASH", "q0", "WIFI", "d0"), makeWire("FLASH", "q1", "WIFI", "d1"),
        makeWire("FLASH", "q2", "WIFI", "d2"), makeWire("FLASH", "q3", "WIFI", "d3"),
        makeWire("CLK", "out", "WIFI", "clk"), makeWire("IRQ", "out", "WIFI", "en"),
        makeWire("FLASH", "q0", "LCD", "d0"), makeWire("FLASH", "q1", "LCD", "d1"),
        makeWire("FLASH", "q2", "LCD", "d2"), makeWire("FLASH", "q3", "LCD", "d3"),
        makeWire("FLASH", "done", "LCD", "clk"),
        makeWire("CPU", "wr", "BUZZ", "in"),
        makeWire("CPU", "rd", "LED", "r"), makeWire("FLASH", "done", "LED", "g"),
      ],
    }),
  },
  {
    id: "audio-system",
    name: "Audio Processing System",
    description: "Microphone → DSP → speaker + LED indicator",
    category: "Real-World",
    tags: ["audio", "dsp", "microphone", "speaker", "signal-processing"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNodeOn("toggle", 30, 80, "EN"),
        makeNode("battery", 30, 160, "BATT"),
        makeNode("microphone-sensor", 30, 270, "MIC"),
        makeNode("dsp-block", 280, 120, "DSP"),
        makeNode("speaker", 530, 50, "SPEAKER"),
        makeNode("led", 530, 200, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "DSP", "clk"), makeWire("EN", "out", "DSP", "en"),
        makeWire("MIC", "d0", "DSP", "d0"), makeWire("MIC", "d1", "DSP", "d1"),
        makeWire("MIC", "d2", "DSP", "d2"), makeWire("MIC", "d3", "DSP", "d3"),
        makeWire("MIC", "d4", "DSP", "d4"), makeWire("MIC", "d5", "DSP", "d5"),
        makeWire("MIC", "d6", "DSP", "d6"), makeWire("MIC", "d7", "DSP", "d7"),
        makeWire("DSP", "o0", "SPEAKER", "in"),
        makeWire("DSP", "o0", "LED", "r"), makeWire("DSP", "o1", "LED", "g"),
        makeWire("DSP", "o2", "LED", "b"),
      ],
    }),
  },
  {
    id: "power-management",
    name: "Power Management System",
    description: "Battery → voltage regulator + buck + boost → fuse → LED",
    category: "Real-World",
    tags: ["power", "battery", "regulator", "converter", "electronics"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("battery", 30, 200, "BATT"),
        makeNode("voltage-regulator", 280, 50, "VREG"),
        makeNode("buck-converter", 280, 200, "BUCK"),
        makeNode("boost-converter", 280, 340, "BOOST"),
        makeNode("fuse", 500, 180, "FUSE"),
        makeNode("voltmeter", 680, 80, "VMETER"),
        makeNode("ammeter", 680, 280, "AMETER"),
        makeNode("led", 680, 180, "LED"),
      ],
      wires: [
        makeWire("BATT", "vcc", "VREG", "vin"), makeWire("BATT", "gnd", "VREG", "gnd"),
        makeWire("BATT", "vcc", "BUCK", "vin"),
        makeWire("BATT", "vcc", "BOOST", "vin"),
        makeWire("CLK", "out", "BUCK", "clk"), makeWire("CLK", "out", "BOOST", "clk"),
        makeWire("VREG", "vout", "FUSE", "in"),
        makeWire("BUCK", "vout", "FUSE", "in"),
        makeWire("BOOST", "vout", "FUSE", "in"),
        makeWire("FUSE", "out", "LED", "r"), makeWire("FUSE", "out", "LED", "g"),
        makeWire("VREG", "vout", "VMETER", "in"),
        makeWire("FUSE", "out", "AMETER", "in"),
      ],
    }),
  },
  {
    id: "sensor-fusion-robot",
    name: "Sensor Fusion Robot",
    description: "Accelerometer + gyroscope + ultrasonic → CPU → motor + servo + display",
    category: "Real-World",
    tags: ["robot", "sensor-fusion", "imu", "cpu", "motor", "display"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("toggle", 30, 150, "IRQ"),
        makeNode("battery", 30, 210, "BATT"),
        makeNode("accelerometer-sensor", 30, 330, "ACCEL"),
        makeNode("gyro-sensor", 30, 480, "GYRO"),
        makeNode("ultrasonic-sensor", 30, 630, "ULTRA"),
        makeNode("cpu-block", 300, 200, "CPU"),
        makeNode("dc-motor", 560, 80, "MOTOR"),
        makeNode("servo-motor", 560, 220, "SERVO"),
        makeNode("oled-display", 560, 360, "DISPLAY"),
        makeNode("buzzer", 560, 500, "BUZZ"),
        makeNode("led", 560, 580, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "CPU", "clk"), makeWire("RST", "out", "CPU", "rst"),
        makeWire("IRQ", "out", "CPU", "irq"),
        makeWire("ACCEL", "x0", "CPU", "d0"), makeWire("ACCEL", "x1", "CPU", "d1"),
        makeWire("ACCEL", "y0", "CPU", "d2"), makeWire("ACCEL", "y1", "CPU", "d3"),
        makeWire("GYRO", "x0", "CPU", "d4"), makeWire("GYRO", "x1", "CPU", "d5"),
        makeWire("GYRO", "y0", "CPU", "d6"), makeWire("GYRO", "y1", "CPU", "d7"),
        makeWire("ULTRA", "out", "CPU", "irq"),
        makeWire("CPU", "d0", "MOTOR", "in1"), makeWire("CPU", "d1", "MOTOR", "in2"),
        makeWire("CPU", "d2", "SERVO", "in"), makeWire("CPU", "d3", "SERVO", "en"),
        makeWire("CPU", "d4", "DISPLAY", "d0"), makeWire("CPU", "d5", "DISPLAY", "d1"),
        makeWire("CPU", "d6", "DISPLAY", "d2"), makeWire("CPU", "d7", "DISPLAY", "d3"),
        makeWire("CPU", "a0", "DISPLAY", "d4"), makeWire("CPU", "a1", "DISPLAY", "d5"),
        makeWire("CPU", "wr", "DISPLAY", "clk"),
        makeWire("ULTRA", "d0", "BUZZ", "in"),
        makeWire("CPU", "a2", "LED", "r"), makeWire("CPU", "a3", "LED", "g"),
      ],
    }),
  },

  // ====== BOARD DEMO TEMPLATES ======
  {
    id: "arduino-weather",
    name: "Arduino Weather Station",
    description: "BME280 + PIR → Arduino Uno → OLED + LED + Buzzer",
    category: "Boards",
    tags: ["arduino", "bme280", "pir", "weather", "embedded"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("battery", 30, 160, "BATT"),
        makeNodeOn("bme280", 30, 260, "BME"),
        makeNodeOn("pir-sensor", 30, 370, "PIR"),
        makeNode("arduino-uno", 280, 140, "ARD"),
        makeNode("oled-display", 560, 60, "OLED"),
        makeNode("led", 560, 190, "LED"),
        makeNode("buzzer", 560, 300, "BUZZ"),
      ],
      wires: [
        makeWire("CLK", "out", "ARD", "clk"), makeWire("RST", "out", "ARD", "rst"),
        makeWire("BME", "t0", "ARD", "d0"), makeWire("BME", "t1", "ARD", "d1"),
        makeWire("BME", "h0", "ARD", "d2"), makeWire("BME", "h1", "ARD", "d3"),
        makeWire("BME", "p0", "ARD", "d4"), makeWire("BME", "p1", "ARD", "d5"),
        makeWire("PIR", "out", "ARD", "d6"),
        makeWire("ARD", "d0", "OLED", "d0"), makeWire("ARD", "d1", "OLED", "d1"),
        makeWire("ARD", "d2", "OLED", "d2"), makeWire("ARD", "d3", "OLED", "d3"),
        makeWire("ARD", "d4", "OLED", "d4"), makeWire("ARD", "d5", "OLED", "d5"),
        makeWire("ARD", "tx", "OLED", "clk"),
        makeWire("ARD", "d6", "LED", "r"), makeWire("ARD", "pwm0", "LED", "g"),
        makeWire("PIR", "out", "BUZZ", "in"),
      ],
    }),
  },
  {
    id: "esp32-iot-sensor",
    name: "ESP32 IoT Sensor Hub",
    description: "BME280 + Color + Current + Strain → ESP32 → WiFi + OLED",
    category: "Boards",
    tags: ["esp32", "iot", "wifi", "sensors"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("battery", 30, 160, "BATT"),
        makeNodeOn("bme280", 30, 260, "BME"),
        makeNodeOn("color-sensor", 30, 370, "COLOR"),
        makeNodeOn("current-sensor", 30, 470, "INA"),
        makeNodeOn("strain-gauge", 30, 570, "STRAIN"),
        makeNode("esp32", 280, 200, "ESP"),
        makeNode("wifi-block", 560, 80, "WIFI"),
        makeNode("oled-display", 560, 220, "OLED"),
        makeNode("led", 560, 360, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "ESP", "clk"), makeWire("RST", "out", "ESP", "rst"),
        makeWire("BME", "t0", "ESP", "gpio0"), makeWire("BME", "t1", "ESP", "gpio1"),
        makeWire("BME", "h0", "ESP", "gpio2"), makeWire("BME", "h1", "ESP", "gpio3"),
        makeWire("COLOR", "r", "ESP", "gpio4"), makeWire("COLOR", "g", "ESP", "gpio5"),
        makeWire("INA", "d0", "ESP", "gpio6"), makeWire("INA", "d1", "ESP", "gpio7"),
        makeWire("STRAIN", "d0", "ESP", "gpio7"),
        makeWire("ESP", "gpio0", "WIFI", "d0"), makeWire("ESP", "gpio1", "WIFI", "d1"),
        makeWire("ESP", "gpio2", "WIFI", "d2"), makeWire("ESP", "gpio3", "WIFI", "d3"),
        makeWire("ESP", "wifi", "WIFI", "clk"), makeWire("ESP", "wifi", "WIFI", "en"),
        makeWire("ESP", "gpio0", "OLED", "d0"), makeWire("ESP", "gpio1", "OLED", "d1"),
        makeWire("ESP", "gpio2", "OLED", "d2"), makeWire("ESP", "gpio3", "OLED", "d3"),
        makeWire("ESP", "gpio4", "OLED", "d4"), makeWire("ESP", "gpio5", "OLED", "d5"),
        makeWire("ESP", "tx", "OLED", "clk"),
        makeWire("ESP", "adc0", "LED", "r"), makeWire("ESP", "adc1", "LED", "g"),
      ],
    }),
  },
  {
    id: "stm32-motor-control",
    name: "STM32 Motor Control",
    description: "STM32 + Encoder → Motor Driver → DC Motors + Servo",
    category: "Boards",
    tags: ["stm32", "motor", "encoder", "control"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("battery", 30, 160, "BATT"),
        makeNodeOn("ultrasonic-sensor", 30, 260, "ULTRA"),
        makeNode("stm32", 280, 140, "STM"),
        makeNode("motor-driver", 560, 60, "DRV"),
        makeNode("dc-motor", 760, 40, "M1"),
        makeNode("dc-motor", 760, 130, "M2"),
        makeNode("servo-motor", 560, 220, "SRVO"),
        makeNode("oled-display", 560, 340, "OLED"),
      ],
      wires: [
        makeWire("CLK", "out", "STM", "clk"), makeWire("RST", "out", "STM", "rst"),
        makeWire("ULTRA", "d0", "STM", "pa0"), makeWire("ULTRA", "d1", "STM", "pa1"),
        makeWire("ULTRA", "d2", "STM", "pa2"), makeWire("ULTRA", "d3", "STM", "pa3"),
        makeWire("STM", "pa0", "DRV", "in1"), makeWire("STM", "pa1", "DRV", "in2"),
        makeWire("STM", "pa2", "DRV", "in3"), makeWire("STM", "pa3", "DRV", "in4"),
        makeWire("STM", "pb0", "DRV", "enA"), makeWire("STM", "pb1", "DRV", "enB"),
        makeWire("DRV", "out1", "M1", "in1"), makeWire("DRV", "out2", "M1", "in2"),
        makeWire("DRV", "out3", "M2", "in1"), makeWire("DRV", "out4", "M2", "in2"),
        makeWire("STM", "pa0", "SRVO", "in"), makeWire("STM", "pb0", "SRVO", "en"),
        makeWire("STM", "tx", "OLED", "d0"), makeWire("STM", "rx", "OLED", "d1"),
        makeWire("STM", "pa0", "OLED", "d2"), makeWire("STM", "pa1", "OLED", "d3"),
        makeWire("STM", "pa2", "OLED", "d4"), makeWire("STM", "pa3", "OLED", "d5"),
      ],
    }),
  },

  // ====== ROBOTICS DEMO TEMPLATES ======
  {
    id: "mecanum-drive",
    name: "Mecanum Drive Robot",
    description: "4× Mecanum wheels + Chassis + Motor Driver + ESP32",
    category: "Robotics",
    tags: ["mecanum", "robot", "drive", "holonomic"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("battery", 30, 160, "BATT"),
        makeNodeOn("ultrasonic-sensor", 30, 260, "ULTRA"),
        makeNode("esp32", 280, 120, "ESP"),
        makeNode("motor-driver", 530, 60, "DRV"),
        makeNode("wheel-mecanum", 730, 30, "WH1"),
        makeNode("wheel-mecanum", 730, 110, "WH2"),
        makeNode("wheel-mecanum", 730, 190, "WH3"),
        makeNode("wheel-mecanum", 730, 270, "WH4"),
        makeNode("chassis-frame", 530, 250, "CHAS"),
      ],
      wires: [
        makeWire("CLK", "out", "ESP", "clk"), makeWire("RST", "out", "ESP", "rst"),
        makeWire("ULTRA", "d0", "ESP", "gpio0"), makeWire("ULTRA", "d1", "ESP", "gpio1"),
        makeWire("ESP", "gpio0", "DRV", "in1"), makeWire("ESP", "gpio1", "DRV", "in2"),
        makeWire("ESP", "gpio2", "DRV", "in3"), makeWire("ESP", "gpio3", "DRV", "in4"),
        makeWire("ESP", "gpio4", "DRV", "enA"), makeWire("ESP", "gpio5", "DRV", "enB"),
        makeWire("DRV", "out1", "WH1", "fl"), makeWire("DRV", "out2", "WH2", "fr"),
        makeWire("DRV", "out3", "WH3", "rl"), makeWire("DRV", "out4", "WH4", "rr"),
        makeWire("WH1", "dir", "CHAS", "fl"), makeWire("WH2", "dir", "CHAS", "fr"),
        makeWire("WH3", "dir", "CHAS", "rl"), makeWire("WH4", "dir", "CHAS", "rr"),
      ],
    }),
  },
  {
    id: "6dof-arm-control",
    name: "6-DOF Robot Arm",
    description: "6-Axis Arm + Servo Drivers + Arduino + Force Sensor",
    category: "Robotics",
    tags: ["robot-arm", "6dof", "servo", "industrial"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNodeOn("toggle", 30, 150, "EN"),
        makeNode("battery", 30, 230, "BATT"),
        makeNodeOn("force-sensor", 30, 330, "FORCE"),
        makeNode("arduino-uno", 280, 120, "ARD"),
        makeNode("servo-drive", 530, 60, "SRV0"),
        makeNode("servo-drive", 530, 170, "SRV1"),
        makeNode("servo-drive", 530, 280, "SRV2"),
        makeNode("robotic-arm-6dof", 740, 170, "ARM"),
        makeNode("oled-display", 530, 390, "OLED"),
      ],
      wires: [
        makeWire("CLK", "out", "ARD", "clk"), makeWire("RST", "out", "ARD", "rst"),
        makeWire("EN", "out", "ARD", "d7"),
        makeWire("FORCE", "d0", "ARD", "d0"), makeWire("FORCE", "d1", "ARD", "d1"),
        makeWire("FORCE", "d2", "ARD", "d2"), makeWire("FORCE", "d3", "ARD", "d3"),
        makeWire("ARD", "d0", "SRV0", "pos"), makeWire("ARD", "d1", "SRV0", "vel"),
        makeWire("EN", "out", "SRV0", "en"),
        makeWire("ARD", "d2", "SRV1", "pos"), makeWire("ARD", "d3", "SRV1", "vel"),
        makeWire("EN", "out", "SRV1", "en"),
        makeWire("ARD", "pwm0", "SRV2", "pos"), makeWire("ARD", "pwm1", "SRV2", "vel"),
        makeWire("EN", "out", "SRV2", "en"),
        makeWire("SRV0", "cmd", "ARM", "j0"), makeWire("SRV1", "cmd", "ARM", "j1"),
        makeWire("SRV2", "cmd", "ARM", "j2"),
        makeWire("CLK", "out", "ARM", "clk"), makeWire("EN", "out", "ARM", "en"),
        makeWire("ARM", "done", "OLED", "d0"), makeWire("ARM", "x", "OLED", "d1"),
        makeWire("ARM", "y", "OLED", "d2"), makeWire("ARM", "z", "OLED", "d3"),
      ],
    }),
  },

  // ====== INDUSTRIAL DEMO TEMPLATES ======
  {
    id: "plc-conveyor",
    name: "PLC Conveyor Control",
    description: "PLC + I/O Module + Proximity Sensors + VFD Drive + Motor",
    category: "Industrial",
    tags: ["plc", "conveyor", "vfd", "industrial"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNode("battery", 30, 160, "BATT"),
        makeNodeOn("proximity-switch", 30, 260, "PROX1"),
        makeNodeOn("proximity-switch", 30, 350, "PROX2"),
        makeNodeOn("proximity-switch", 30, 440, "PROX3"),
        makeNode("plc-controller", 280, 120, "PLC"),
        makeNode("plc-io-module", 280, 300, "IO"),
        makeNode("vfd-drive", 530, 100, "VFD"),
        makeNode("dc-motor", 730, 100, "MOTOR"),
        makeNode("led", 530, 240, "LED"),
        makeNode("buzzer", 530, 340, "BUZZ"),
      ],
      wires: [
        makeWire("CLK", "out", "PLC", "clk"), makeWire("RST", "out", "PLC", "rst"),
        makeWire("PROX1", "out", "PLC", "i0"), makeWire("PROX2", "out", "PLC", "i1"),
        makeWire("PROX3", "out", "PLC", "i2"),
        makeWire("PLC", "q0", "IO", "i0"), makeWire("PLC", "q1", "IO", "i1"),
        makeWire("PLC", "q2", "IO", "i2"), makeWire("PLC", "q3", "IO", "i3"),
        makeWire("EN", "out", "IO", "en"),
        makeWire("IO", "q0", "VFD", "speed"), makeWire("IO", "q1", "VFD", "dir"),
        makeWire("EN", "out", "VFD", "en"),
        makeWire("VFD", "u", "MOTOR", "in1"), makeWire("VFD", "v", "MOTOR", "in2"),
        makeWire("PLC", "q4", "LED", "r"), makeWire("PLC", "q5", "LED", "g"),
        makeWire("VFD", "fault", "BUZZ", "in"),
      ],
    }),
  },
  {
    id: "scara-pick-place",
    name: "SCARA Pick & Place",
    description: "SCARA Arm + Servo Drives + Color Sensor + PLC",
    category: "Robotics",
    tags: ["scara", "pick-and-place", "servo", "industrial"],
    build: () => ({
      nodes: [
        makeNodeOn("toggle", 30, 10, "CLK"),
        makeNode("toggle", 30, 80, "RST"),
        makeNodeOn("toggle", 30, 150, "EN"),
        makeNode("battery", 30, 230, "BATT"),
        makeNodeOn("color-sensor", 30, 340, "COLOR"),
        makeNodeOn("ultrasonic-sensor", 30, 440, "ULTRA"),
        makeNode("plc-controller", 280, 140, "PLC"),
        makeNode("servo-drive", 530, 60, "SRV0"),
        makeNode("servo-drive", 530, 180, "SRV1"),
        makeNode("scara-arm", 730, 140, "ARM"),
        makeNode("relay", 530, 310, "RELAY"),
        makeNode("led", 730, 280, "LED"),
      ],
      wires: [
        makeWire("CLK", "out", "PLC", "clk"), makeWire("RST", "out", "PLC", "rst"),
        makeWire("COLOR", "r", "PLC", "i0"), makeWire("COLOR", "g", "PLC", "i1"),
        makeWire("COLOR", "b", "PLC", "i2"),
        makeWire("ULTRA", "d0", "PLC", "i3"), makeWire("ULTRA", "d1", "PLC", "i4"),
        makeWire("PLC", "q0", "SRV0", "pos"), makeWire("PLC", "q1", "SRV0", "vel"),
        makeWire("EN", "out", "SRV0", "en"),
        makeWire("PLC", "q2", "SRV1", "pos"), makeWire("PLC", "q3", "SRV1", "vel"),
        makeWire("EN", "out", "SRV1", "en"),
        makeWire("SRV0", "cmd", "ARM", "j0"), makeWire("SRV1", "cmd", "ARM", "j1"),
        makeWire("EN", "out", "ARM", "en"), makeWire("CLK", "out", "ARM", "clk"),
        makeWire("PLC", "q4", "RELAY", "coil"),
        makeWire("ARM", "done", "LED", "r"), makeWire("ARM", "x", "LED", "g"),
      ],
    }),
  },
];

export const TEMPLATE_CATEGORIES = [
  "Basic Gates",
  "Arithmetic",
  "Combinational",
  "Display",
  "Screen Output",
  "Memory",
  "Sequential",
  "Practical",
  "Complex",
  "AI / Neural",
  "Real-World",
  "Boards",
  "Robotics",
  "Industrial",
] as const;
