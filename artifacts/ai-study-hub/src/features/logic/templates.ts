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

function basicGateTemplate(
  type: GateType, name: string, desc: string, tags: string[]
): Template {
  return {
    id: type,
    name,
    description: desc,
    category: "Basic Gates",
    tags,
    build: () => {
      const sw1 = makeNode("toggle", 60, 60, "sw1");
      const gate = makeNode(type, 260, 50, "gate");
      const bulb = makeNode("bulb", 460, 60, "bulb");
      const wires = [
        makeWire("sw1", "out", "gate", "a"),
        makeWire("gate", "out", "bulb", "in"),
      ];
      return { nodes: [sw1, gate, bulb], wires };
    },
  };
}

function twoInputGateTemplate(
  type: GateType, name: string, desc: string, tags: string[]
): Template {
  return {
    id: type + "-2in",
    name,
    description: desc,
    category: "Basic Gates",
    tags,
    build: () => {
      const sw1 = makeNode("toggle", 60, 40, "sw1");
      const sw2 = makeNode("toggle", 60, 140, "sw2");
      const gate = makeNode(type, 260, 60, "gate");
      const bulb = makeNode("bulb", 460, 80, "bulb");
      const wires = [
        makeWire("sw1", "out", "gate", "a"),
        makeWire("sw2", "out", "gate", "b"),
        makeWire("gate", "out", "bulb", "in"),
      ];
      return { nodes: [sw1, sw2, gate, bulb], wires };
    },
  };
}

export const TEMPLATES: Template[] = [
  basicGateTemplate("buffer", "Buffer", "Single-input buffer — output equals input", ["buffer", "pass-through"]),
  basicGateTemplate("not", "NOT Gate", "Inverts the input signal", ["inverter", "complement"]),
  twoInputGateTemplate("and", "AND Gate", "Output HIGH only when both inputs are HIGH", ["conjunction", "product"]),
  twoInputGateTemplate("or", "OR Gate", "Output HIGH when at least one input is HIGH", ["disjunction", "sum"]),
  twoInputGateTemplate("nand", "NAND Gate", "NOT-AND: universal gate, output LOW when both inputs HIGH", ["universal", "not-and"]),
  twoInputGateTemplate("nor", "NOR Gate", "NOT-OR: universal gate, output HIGH only when all inputs LOW", ["universal", "not-or"]),
  twoInputGateTemplate("xor", "XOR Gate", "Output HIGH when inputs are different", ["exclusive-or", "parity"]),
  twoInputGateTemplate("xnor", "XNOR Gate", "Output HIGH when inputs are equal", ["exclusive-nor", "equality", "equivalence"]),

  {
    id: "half-adder-standalone",
    name: "Half Adder",
    description: "Adds two 1-bit numbers producing Sum and Carry",
    category: "Arithmetic",
    tags: ["adder", "half-adder", "binary-addition"],
    build: () => {
      const a = makeNode("toggle", 60, 40, "a");
      const b = makeNode("toggle", 60, 140, "b");
      const ha = makeNode("half-adder", 240, 60, "ha");
      const sumBulb = makeNode("bulb", 440, 50, "sum");
      const coutBulb = makeNode("bulb", 440, 110, "cout");
      return {
        nodes: [a, b, ha, sumBulb, coutBulb],
        wires: [
          makeWire("a", "out", "ha", "a"),
          makeWire("b", "out", "ha", "b"),
          makeWire("ha", "sum", "sumBulb", "in"),
          makeWire("ha", "cout", "coutBulb", "in"),
        ],
      };
    },
  },

  {
    id: "full-adder-standalone",
    name: "Full Adder",
    description: "Adds two 1-bit numbers with carry-in, producing Sum and Carry-out",
    category: "Arithmetic",
    tags: ["adder", "full-adder", "carry"],
    build: () => {
      const a = makeNode("toggle", 60, 30, "a");
      const b = makeNode("toggle", 60, 110, "b");
      const cin = makeNode("toggle", 60, 190, "cin");
      const fa = makeNode("full-adder", 240, 60, "fa");
      const sumBulb = makeNode("bulb", 440, 50, "sum");
      const coutBulb = makeNode("bulb", 440, 110, "cout");
      return {
        nodes: [a, b, cin, fa, sumBulb, coutBulb],
        wires: [
          makeWire("a", "out", "fa", "a"),
          makeWire("b", "out", "fa", "b"),
          makeWire("cin", "out", "fa", "cin"),
          makeWire("fa", "sum", "sumBulb", "in"),
          makeWire("fa", "cout", "coutBulb", "in"),
        ],
      };
    },
  },

  {
    id: "half-subtractor-standalone",
    name: "Half Subtractor",
    description: "Subtracts two 1-bit numbers producing Difference and Borrow",
    category: "Arithmetic",
    tags: ["subtractor", "half-subtractor"],
    build: () => {
      const a = makeNode("toggle", 60, 40, "a");
      const b = makeNode("toggle", 60, 140, "b");
      const hs = makeNode("half-subtractor", 240, 60, "hs");
      const diffBulb = makeNode("bulb", 440, 50, "diff");
      const borrowBulb = makeNode("bulb", 440, 110, "borrow");
      return {
        nodes: [a, b, hs, diffBulb, borrowBulb],
        wires: [
          makeWire("a", "out", "hs", "a"),
          makeWire("b", "out", "hs", "b"),
          makeWire("hs", "diff", "diffBulb", "in"),
          makeWire("hs", "borrow", "borrowBulb", "in"),
        ],
      };
    },
  },

  {
    id: "full-subtractor-standalone",
    name: "Full Subtractor",
    description: "Subtracts two 1-bit numbers with borrow-in",
    category: "Arithmetic",
    tags: ["subtractor", "full-subtractor", "borrow"],
    build: () => {
      const a = makeNode("toggle", 60, 30, "a");
      const b = makeNode("toggle", 60, 110, "b");
      const bin = makeNode("toggle", 60, 190, "bin");
      const fs = makeNode("full-subtractor", 240, 60, "fs");
      const diffBulb = makeNode("bulb", 440, 50, "diff");
      const borrowBulb = makeNode("bulb", 440, 110, "borrow");
      return {
        nodes: [a, b, bin, fs, diffBulb, borrowBulb],
        wires: [
          makeWire("a", "out", "fs", "a"),
          makeWire("b", "out", "fs", "b"),
          makeWire("bin", "out", "fs", "bin"),
          makeWire("fs", "diff", "diffBulb", "in"),
          makeWire("fs", "borrow", "borrowBulb", "in"),
        ],
      };
    },
  },

  {
    id: "4bit-ripple-carry-adder",
    name: "4-bit Ripple Carry Adder",
    description: "Cascades four full adders to add two 4-bit binary numbers",
    category: "Arithmetic",
    tags: ["adder", "4-bit", "ripple-carry", "multi-bit"],
    build: () => {
      const a3 = makeNode("toggle", 40, 20, "A3"); (a3.outputs.out = false);
      const a2 = makeNode("toggle", 40, 80, "A2"); (a2.outputs.out = false);
      const a1 = makeNode("toggle", 40, 140, "A1"); (a1.outputs.out = false);
      const a0 = makeNode("toggle", 40, 200, "A0");
      const b3 = makeNode("toggle", 40, 290, "B3"); (b3.outputs.out = false);
      const b2 = makeNode("toggle", 40, 350, "B2"); (b2.outputs.out = false);
      const b1 = makeNode("toggle", 40, 410, "B1"); (b1.outputs.out = false);
      const b0 = makeNode("toggle", 40, 470, "B0");
      const c0 = makeNode("const-0", 40, 540, "c0");
      const fa0 = makeNode("full-adder", 220, 430, "fa0");
      const fa1 = makeNode("full-adder", 220, 310, "fa1");
      const fa2 = makeNode("full-adder", 220, 190, "fa2");
      const fa3 = makeNode("full-adder", 220, 70, "fa3");
      const s0 = makeNode("bulb", 420, 420, "S0");
      const s1 = makeNode("bulb", 420, 300, "S1");
      const s2 = makeNode("bulb", 420, 180, "S2");
      const s3 = makeNode("bulb", 420, 60, "S3");
      const cout = makeNode("led", 420, 530, "Cout");
      return {
        nodes: [a0, a1, a2, a3, b0, b1, b2, b3, c0, fa0, fa1, fa2, fa3, s0, s1, s2, s3, cout],
        wires: [
          makeWire("A0", "out", "fa0", "a"), makeWire("B0", "out", "fa0", "b"), makeWire("c0", "out", "fa0", "cin"),
          makeWire("A1", "out", "fa1", "a"), makeWire("B1", "out", "fa1", "b"), makeWire("fa0", "cout", "fa1", "cin"),
          makeWire("A2", "out", "fa2", "a"), makeWire("B2", "out", "fa2", "b"), makeWire("fa1", "cout", "fa2", "cin"),
          makeWire("A3", "out", "fa3", "a"), makeWire("B3", "out", "fa3", "b"), makeWire("fa2", "cout", "fa3", "cin"),
          makeWire("fa0", "sum", "S0", "in"), makeWire("fa1", "sum", "S1", "in"),
          makeWire("fa2", "sum", "S2", "in"), makeWire("fa3", "sum", "S3", "in"),
          makeWire("fa3", "cout", "Cout", "r"),
        ],
      };
    },
  },

  {
    id: "2to1-mux-gates",
    name: "2:1 MUX (from gates)",
    description: "2:1 multiplexer built from AND/OR/NOT gates",
    category: "Combinational",
    tags: ["mux", "multiplexer", "from-gates", "selector"],
    build: () => {
      const i0 = makeNode("toggle", 40, 40, "I0");
      const i1 = makeNode("toggle", 40, 140, "I1");
      const sel = makeNode("toggle", 40, 240, "SEL");
      const notG = makeNode("not", 180, 230, "not1");
      const and0 = makeNode("and", 300, 30, "and0");
      const and1 = makeNode("and", 300, 130, "and1");
      const orG = makeNode("or", 440, 70, "or1");
      const outB = makeNode("bulb", 580, 80, "out");
      return {
        nodes: [i0, i1, sel, notG, and0, and1, orG, outB],
        wires: [
          makeWire("I0", "out", "and0", "a"), makeWire("SEL", "out", "and0", "b"),
          makeWire("SEL", "out", "not1", "a"),
          makeWire("I1", "out", "and1", "a"), makeWire("not1", "out", "and1", "b"),
          makeWire("and0", "out", "orG", "a"), makeWire("and1", "out", "orG", "b"),
          makeWire("orG", "out", "outB", "in"),
        ],
      };
    },
  },

  {
    id: "2to1-mux",
    name: "2:1 MUX",
    description: "2:1 multiplexer — selects one of two inputs based on select line",
    category: "Combinational",
    tags: ["mux", "multiplexer", "selector"],
    build: () => {
      const i0 = makeNode("toggle", 40, 40, "I0");
      const i1 = makeNode("toggle", 40, 140, "I1");
      const sel = makeNode("toggle", 40, 240, "SEL");
      const mux = makeNode("mux2", 240, 70, "mux");
      const outB = makeNode("bulb", 440, 90, "out");
      return {
        nodes: [i0, i1, sel, mux, outB],
        wires: [
          makeWire("I0", "out", "mux", "i0"), makeWire("I1", "out", "mux", "i1"),
          makeWire("SEL", "out", "mux", "sel"),
          makeWire("mux", "out", "outB", "in"),
        ],
      };
    },
  },

  {
    id: "4to1-mux",
    name: "4:1 MUX",
    description: "4:1 multiplexer with two select lines",
    category: "Combinational",
    tags: ["mux", "multiplexer", "4-input"],
    build: () => {
      const i0 = makeNode("toggle", 40, 20, "I0");
      const i1 = makeNode("toggle", 40, 80, "I1");
      const i2 = makeNode("toggle", 40, 140, "I2");
      const i3 = makeNode("toggle", 40, 200, "I3");
      const s0 = makeNode("toggle", 40, 280, "S0");
      const s1 = makeNode("toggle", 40, 340, "S1");
      const mux = makeNode("mux4", 240, 80, "mux");
      const outB = makeNode("bulb", 440, 110, "out");
      return {
        nodes: [i0, i1, i2, i3, s0, s1, mux, outB],
        wires: [
          makeWire("I0", "out", "mux", "i0"), makeWire("I1", "out", "mux", "i1"),
          makeWire("I2", "out", "mux", "i2"), makeWire("I3", "out", "mux", "i3"),
          makeWire("S0", "out", "mux", "s0"), makeWire("S1", "out", "mux", "s1"),
          makeWire("mux", "out", "outB", "in"),
        ],
      };
    },
  },

  {
    id: "8to1-mux",
    name: "8:1 MUX",
    description: "8:1 multiplexer built from two 4:1 MUXes and one 2:1 MUX",
    category: "Combinational",
    tags: ["mux", "multiplexer", "8-input", "cascaded"],
    build: () => {
      const i0 = makeNode("toggle", 30, 10, "I0");
      const i1 = makeNode("toggle", 30, 60, "I1");
      const i2 = makeNode("toggle", 30, 110, "I2");
      const i3 = makeNode("toggle", 30, 160, "I3");
      const i4 = makeNode("toggle", 30, 230, "I4");
      const i5 = makeNode("toggle", 30, 280, "I5");
      const i6 = makeNode("toggle", 30, 330, "I6");
      const i7 = makeNode("toggle", 30, 380, "I7");
      const s0 = makeNode("toggle", 30, 440, "S0");
      const s1 = makeNode("toggle", 30, 500, "S1");
      const s2 = makeNode("toggle", 30, 560, "S2");
      const muxHi = makeNode("mux4", 240, 90, "muxH");
      const muxLo = makeNode("mux4", 240, 310, "muxL");
      const muxOut = makeNode("mux2", 440, 190, "muxO");
      const outB = makeNode("bulb", 600, 200, "out");
      return {
        nodes: [i0, i1, i2, i3, i4, i5, i6, i7, s0, s1, s2, muxHi, muxLo, muxOut, outB],
        wires: [
          makeWire("I0", "out", "muxH", "i0"), makeWire("I1", "out", "muxH", "i1"),
          makeWire("I2", "out", "muxH", "i2"), makeWire("I3", "out", "muxH", "i3"),
          makeWire("I4", "out", "muxL", "i0"), makeWire("I5", "out", "muxL", "i1"),
          makeWire("I6", "out", "muxL", "i2"), makeWire("I7", "out", "muxL", "i3"),
          makeWire("S0", "out", "muxH", "s0"), makeWire("S1", "out", "muxH", "s1"),
          makeWire("S0", "out", "muxL", "s0"), makeWire("S1", "out", "muxL", "s1"),
          makeWire("muxH", "out", "muxO", "i0"), makeWire("muxL", "out", "muxO", "i1"),
          makeWire("S2", "out", "muxO", "sel"),
          makeWire("muxO", "out", "outB", "in"),
        ],
      };
    },
  },

  {
    id: "2to4-decoder",
    name: "2:4 Decoder",
    description: "Decodes 2-bit input to one of four output lines",
    category: "Combinational",
    tags: ["decoder", "demux"],
    build: () => {
      const a = makeNode("toggle", 40, 40, "A");
      const b = makeNode("toggle", 40, 140, "B");
      const dec = makeNode("decoder", 240, 60, "dec");
      const d0 = makeNode("bulb", 440, 30, "D0");
      const d1 = makeNode("bulb", 440, 80, "D1");
      const d2 = makeNode("bulb", 440, 130, "D2");
      const d3 = makeNode("bulb", 440, 180, "D3");
      return {
        nodes: [a, b, dec, d0, d1, d2, d3],
        wires: [
          makeWire("A", "out", "dec", "a"), makeWire("B", "out", "dec", "b"),
          makeWire("dec", "o0", "D0", "in"), makeWire("dec", "o1", "D1", "in"),
          makeWire("dec", "o2", "D2", "in"), makeWire("dec", "o3", "D3", "in"),
        ],
      };
    },
  },

  {
    id: "3to8-decoder",
    name: "3:8 Decoder",
    description: "Decodes 3-bit input to one of eight outputs using AND/NOT gates",
    category: "Combinational",
    tags: ["decoder", "3-bit", "demux"],
    build: () => {
      const a = makeNode("toggle", 40, 30, "A");
      const b = makeNode("toggle", 40, 130, "B");
      const c = makeNode("toggle", 40, 230, "C");
      const notA = makeNode("not", 160, 20, "nA");
      const notB = makeNode("not", 160, 120, "nB");
      const notC = makeNode("not", 160, 220, "nC");
      const d0 = makeNode("and", 280, 10, "d0");
      const d1 = makeNode("and", 280, 70, "d1");
      const d2 = makeNode("and", 280, 130, "d2");
      const d3 = makeNode("and", 280, 190, "d3");
      const d4 = makeNode("and", 280, 250, "d4");
      const d5 = makeNode("and", 280, 310, "d5");
      const d6 = makeNode("and", 280, 370, "d6");
      const d7 = makeNode("and", 280, 430, "d7");
      const b0 = makeNode("bulb", 440, 10, "Y0");
      const b1 = makeNode("bulb", 440, 70, "Y1");
      const b2 = makeNode("bulb", 440, 130, "Y2");
      const b3 = makeNode("bulb", 440, 190, "Y3");
      const b4 = makeNode("bulb", 440, 250, "Y4");
      const b5 = makeNode("bulb", 440, 310, "Y5");
      const b6 = makeNode("bulb", 440, 370, "Y6");
      const b7 = makeNode("bulb", 440, 430, "Y7");
      return {
        nodes: [a, b, c, notA, notB, notC, d0, d1, d2, d3, d4, d5, d6, d7, b0, b1, b2, b3, b4, b5, b6, b7],
        wires: [
          makeWire("A", "out", "nA", "a"), makeWire("B", "out", "nB", "a"), makeWire("C", "out", "nC", "a"),
          makeWire("nC", "out", "d0", "a"), makeWire("nB", "out", "d0", "b"),
          makeWire("nC", "out", "d1", "a"), makeWire("nB", "out", "d1", "b"),
          makeWire("nC", "out", "d2", "a"), makeWire("nB", "out", "d2", "b"),
          makeWire("nC", "out", "d3", "a"), makeWire("nB", "out", "d3", "b"),
          makeWire("d0", "out", "Y0", "in"), makeWire("d1", "out", "Y1", "in"),
          makeWire("d2", "out", "Y2", "in"), makeWire("d3", "out", "Y3", "in"),
          makeWire("d4", "out", "Y4", "in"), makeWire("d5", "out", "Y5", "in"),
          makeWire("d6", "out", "Y6", "in"), makeWire("d7", "out", "Y7", "in"),
          makeWire("A", "out", "d0", "a"), makeWire("A", "out", "d2", "a"),
          makeWire("A", "out", "d4", "a"), makeWire("A", "out", "d6", "a"),
          makeWire("nA", "out", "d1", "a"), makeWire("nA", "out", "d3", "a"),
          makeWire("nA", "out", "d5", "a"), makeWire("nA", "out", "d7", "a"),
          makeWire("B", "out", "d4", "b"), makeWire("B", "out", "d5", "b"),
          makeWire("B", "out", "d6", "b"), makeWire("B", "out", "d7", "b"),
          makeWire("C", "out", "d4", "a"), makeWire("C", "out", "d5", "a"),
          makeWire("C", "out", "d6", "a"), makeWire("C", "out", "d7", "a"),
        ],
      };
    },
  },

  {
    id: "priority-encoder",
    name: "Priority Encoder",
    description: "Encodes highest-priority active input to 2-bit binary",
    category: "Combinational",
    tags: ["encoder", "priority"],
    build: () => {
      const d3 = makeNode("toggle", 40, 20, "D3");
      const d2 = makeNode("toggle", 40, 100, "D2");
      const d1 = makeNode("toggle", 40, 180, "D1");
      const d0 = makeNode("toggle", 40, 260, "D0");
      const orG1 = makeNode("or", 220, 20, "or1");
      const orG2 = makeNode("or", 220, 100, "or2");
      const vOr = makeNode("or", 340, 160, "vOr");
      const y1 = makeNode("bulb", 420, 30, "Y1");
      const y0 = makeNode("bulb", 420, 110, "Y0");
      const v = makeNode("led", 420, 200, "V");
      return {
        nodes: [d3, d2, d1, d0, orG1, orG2, vOr, y1, y0, v],
        wires: [
          makeWire("D3", "out", "orG1", "a"), makeWire("D2", "out", "orG1", "b"),
          makeWire("D3", "out", "orG2", "a"), makeWire("D1", "out", "orG2", "b"),
          makeWire("D3", "out", "vOr", "a"), makeWire("D0", "out", "vOr", "b"),
          makeWire("orG1", "out", "Y1", "in"), makeWire("orG2", "out", "Y0", "in"),
          makeWire("vOr", "out", "V", "r"),
        ],
      };
    },
  },

  {
    id: "4bit-comparator",
    name: "4-bit Comparator",
    description: "Compares two 4-bit numbers: Equal, Greater, Less",
    category: "Combinational",
    tags: ["comparator", "magnitude", "4-bit"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 80, "A1");
      const b0 = makeNode("toggle", 40, 140, "B0");
      const b1 = makeNode("toggle", 40, 200, "B1");
      const xnor0 = makeNode("xnor", 200, 20, "xnor0");
      const xnor1 = makeNode("xnor", 200, 100, "xnor1");
      const eqAnd = makeNode("and", 360, 40, "eqAnd");
      const eqBulb = makeNode("bulb", 500, 50, "EQ");
      const xor0 = makeNode("xor", 200, 180, "xor0");
      const xor1 = makeNode("xor", 200, 260, "xor1");
      const orG = makeNode("or", 360, 200, "or1");
      const neqBulb = makeNode("bulb", 500, 210, "NEQ");
      return {
        nodes: [a0, a1, b0, b1, xnor0, xnor1, eqAnd, eqBulb, xor0, xor1, orG, neqBulb],
        wires: [
          makeWire("A0", "out", "xnor0", "a"), makeWire("B0", "out", "xnor0", "b"),
          makeWire("A1", "out", "xnor1", "a"), makeWire("B1", "out", "xnor1", "b"),
          makeWire("xnor0", "out", "eqAnd", "a"), makeWire("xnor1", "out", "eqAnd", "b"),
          makeWire("eqAnd", "out", "eqBulb", "in"),
          makeWire("A0", "out", "xor0", "a"), makeWire("B0", "out", "xor0", "b"),
          makeWire("A1", "out", "xor1", "a"), makeWire("B1", "out", "xor1", "b"),
          makeWire("xor0", "out", "orG", "a"), makeWire("xor1", "out", "orG", "b"),
          makeWire("orG", "out", "neqBulb", "in"),
        ],
      };
    },
  },

  {
    id: "bcd-to-hex",
    name: "BCD to Hex Display",
    description: "Displays BCD input (0-9) on a hex display",
    category: "Display",
    tags: ["bcd", "hex", "display", "decoder"],
    build: () => {
      const a = makeNode("toggle", 40, 40, "A");
      const b = makeNode("toggle", 40, 120, "B");
      const c = makeNode("toggle", 40, 200, "C");
      const d = makeNode("toggle", 40, 280, "D");
      const hex = makeNode("hex-display", 260, 80, "hex");
      return {
        nodes: [a, b, c, d, hex],
        wires: [
          makeWire("A", "out", "hex", "a"), makeWire("B", "out", "hex", "b"),
          makeWire("C", "out", "hex", "c"), makeWire("D", "out", "hex", "d"),
        ],
      };
    },
  },

  {
    id: "4bit-alu",
    name: "4-bit ALU",
    description: "Arithmetic Logic Unit with AND, OR, ADD, SUB operations",
    category: "Arithmetic",
    tags: ["alu", "arithmetic", "logic-unit"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 80, "A1");
      const b0 = makeNode("toggle", 40, 140, "B0");
      const b1 = makeNode("toggle", 40, 200, "B1");
      const andG = makeNode("and", 220, 20, "andOp");
      const orG = makeNode("or", 220, 100, "orOp");
      const fa = makeNode("full-adder", 220, 200, "addOp");
      const andB = makeNode("bulb", 420, 30, "AND");
      const orB = makeNode("bulb", 420, 110, "OR");
      const addB = makeNode("bulb", 420, 210, "ADD");
      return {
        nodes: [a0, a1, b0, b1, andG, orG, fa, andB, orB, addB],
        wires: [
          makeWire("A0", "out", "andG", "a"), makeWire("B0", "out", "andG", "b"),
          makeWire("A0", "out", "orG", "a"), makeWire("B0", "out", "orG", "b"),
          makeWire("A0", "out", "fa", "a"), makeWire("B0", "out", "fa", "b"),
          makeWire("andG", "out", "AND", "in"), makeWire("orG", "out", "OR", "in"),
          makeWire("fa", "sum", "ADD", "in"),
        ],
      };
    },
  },

  {
    id: "sr-latch-nor",
    name: "SR Latch (NOR)",
    description: "Set-Reset latch using NOR gates — basic memory element",
    category: "Memory",
    tags: ["sr-latch", "memory", "nor", "bistable"],
    build: () => {
      const s = makeNode("toggle", 40, 40, "S");
      const r = makeNode("toggle", 40, 200, "R");
      const nor1 = makeNode("nor", 220, 20, "norQ");
      const nor2 = makeNode("nor", 220, 160, "norQn");
      const qBulb = makeNode("bulb", 420, 30, "Q");
      const qnBulb = makeNode("bulb", 420, 170, "Qn");
      return {
        nodes: [s, r, nor1, nor2, qBulb, qnBulb],
        wires: [
          makeWire("S", "out", "norQ", "a"),
          makeWire("norQ", "out", "norQn", "a"),
          makeWire("R", "out", "norQn", "b"),
          makeWire("norQn", "out", "norQ", "b"),
          makeWire("norQ", "out", "Q", "in"),
          makeWire("norQn", "out", "Qn", "in"),
        ],
      };
    },
  },

  {
    id: "sr-latch-nand",
    name: "SR Latch (NAND)",
    description: "Set-Reset latch using NAND gates — active-low inputs",
    category: "Memory",
    tags: ["sr-latch", "memory", "nand", "bistable"],
    build: () => {
      const s = makeNode("toggle", 40, 40, "S");
      const r = makeNode("toggle", 40, 200, "R");
      const nand1 = makeNode("nand", 220, 20, "nandQ");
      const nand2 = makeNode("nand", 220, 160, "nandQn");
      const qBulb = makeNode("bulb", 420, 30, "Q");
      const qnBulb = makeNode("bulb", 420, 170, "Qn");
      return {
        nodes: [s, r, nand1, nand2, qBulb, qnBulb],
        wires: [
          makeWire("S", "out", "nandQ", "a"),
          makeWire("nandQ", "out", "nandQn", "a"),
          makeWire("R", "out", "nandQn", "b"),
          makeWire("nandQn", "out", "nandQ", "b"),
          makeWire("nandQ", "out", "Q", "in"),
          makeWire("nandQn", "out", "Qn", "in"),
        ],
      };
    },
  },

  {
    id: "d-latch-standalone",
    name: "D Latch",
    description: "Transparent D latch — output follows D when enabled",
    category: "Memory",
    tags: ["d-latch", "transparent", "memory"],
    build: () => {
      const d = makeNode("toggle", 40, 60, "D");
      const en = makeNode("toggle", 40, 180, "EN");
      const latch = makeNode("d-latch", 220, 60, "latch");
      const qBulb = makeNode("bulb", 420, 50, "Q");
      const qnBulb = makeNode("bulb", 420, 120, "Qn");
      return {
        nodes: [d, en, latch, qBulb, qnBulb],
        wires: [
          makeWire("D", "out", "latch", "d"), makeWire("EN", "out", "latch", "en"),
          makeWire("latch", "q", "Q", "in"), makeWire("latch", "qn", "Qn", "in"),
        ],
      };
    },
  },

  {
    id: "d-flipflop-standalone",
    name: "D Flip-Flop",
    description: "Edge-triggered D flip-flop — captures D on clock rising edge",
    category: "Memory",
    tags: ["d-flipflop", "edge-triggered", "sequential"],
    build: () => {
      const d = makeNode("toggle", 40, 60, "D");
      const clk = makeNode("toggle", 40, 180, "CLK");
      const ff = makeNode("d-flipflop", 220, 60, "dff");
      const qBulb = makeNode("bulb", 420, 50, "Q");
      const qnBulb = makeNode("bulb", 420, 120, "Qn");
      return {
        nodes: [d, clk, ff, qBulb, qnBulb],
        wires: [
          makeWire("D", "out", "ff", "d"), makeWire("CLK", "out", "ff", "clk"),
          makeWire("ff", "q", "Q", "in"), makeWire("ff", "qn", "Qn", "in"),
        ],
      };
    },
  },

  {
    id: "jk-flipflop",
    name: "JK Flip-Flop",
    description: "JK flip-flop with preset and clear — most versatile FF",
    category: "Memory",
    tags: ["jk-flipflop", "toggle", "sequential"],
    build: () => {
      const j = makeNode("toggle", 40, 30, "J");
      const k = makeNode("toggle", 40, 120, "K");
      const clk = makeNode("toggle", 40, 210, "CLK");
      const notJ = makeNode("not", 180, 30, "notJ");
      const notK = makeNode("not", 180, 120, "notK");
      const and1 = makeNode("and", 280, 20, "and1");
      const and2 = makeNode("and", 280, 100, "and2");
      const orG = makeNode("or", 380, 60, "orQ");
      const qBulb = makeNode("bulb", 520, 60, "Q");
      return {
        nodes: [j, k, clk, notJ, notK, and1, and2, orG, qBulb],
        wires: [
          makeWire("J", "out", "notJ", "a"), makeWire("K", "out", "notK", "a"),
          makeWire("J", "out", "and1", "a"), makeWire("notK", "out", "and1", "b"),
          makeWire("K", "out", "and2", "a"), makeWire("notJ", "out", "and2", "b"),
          makeWire("and1", "out", "orG", "a"), makeWire("and2", "out", "orG", "b"),
          makeWire("orG", "out", "Q", "in"),
        ],
      };
    },
  },

  {
    id: "t-flipflop",
    name: "T Flip-Flop",
    description: "Toggle flip-flop — XOR-based T-to-D conversion with feedback",
    category: "Memory",
    tags: ["t-flipflop", "toggle", "counter"],
    build: () => {
      const t = makeNode("toggle", 40, 60, "T");
      const clk = makeNode("toggle", 40, 260, "CLK");
      const dff = makeNode("d-flipflop", 280, 60, "dff");
      const xorG = makeNode("xor", 160, 160, "xorFB");
      const qBulb = makeNode("bulb", 480, 50, "Q");
      const qnBulb = makeNode("bulb", 480, 120, "Qn");
      return {
        nodes: [t, clk, dff, xorG, qBulb, qnBulb],
        wires: [
          makeWire("T", "out", "xorG", "a"), makeWire("dff", "qn", "xorG", "b"),
          makeWire("xorG", "out", "dff", "d"), makeWire("CLK", "out", "dff", "clk"),
          makeWire("dff", "q", "Q", "in"), makeWire("dff", "qn", "Qn", "in"),
        ],
      };
    },
  },

  {
    id: "4bit-register",
    name: "4-bit Register",
    description: "Stores 4-bit data with clock enable",
    category: "Memory",
    tags: ["register", "storage", "4-bit", "sequential"],
    build: () => {
      const d0 = makeNode("toggle", 40, 20, "D0");
      const d1 = makeNode("toggle", 40, 100, "D1");
      const d2 = makeNode("toggle", 40, 180, "D2");
      const d3 = makeNode("toggle", 40, 260, "D3");
      const clk = makeNode("toggle", 40, 350, "CLK");
      const ff0 = makeNode("d-flipflop", 220, 10, "ff0");
      const ff1 = makeNode("d-flipflop", 220, 90, "ff1");
      const ff2 = makeNode("d-flipflop", 220, 170, "ff2");
      const ff3 = makeNode("d-flipflop", 220, 250, "ff3");
      const q0 = makeNode("bulb", 420, 10, "Q0");
      const q1 = makeNode("bulb", 420, 90, "Q1");
      const q2 = makeNode("bulb", 420, 170, "Q2");
      const q3 = makeNode("bulb", 420, 250, "Q3");
      return {
        nodes: [d0, d1, d2, d3, clk, ff0, ff1, ff2, ff3, q0, q1, q2, q3],
        wires: [
          makeWire("D0", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("D1", "out", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("D2", "out", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("D3", "out", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "4bit-shift-register",
    name: "4-bit Shift Register",
    description: "Shifts data left on each clock pulse — serial in, parallel out",
    category: "Memory",
    tags: ["shift-register", "serial", "parallel", "sequential"],
    build: () => {
      const sin = makeNode("toggle", 40, 60, "SIN");
      const clk = makeNode("toggle", 40, 300, "CLK");
      const ff0 = makeNode("d-flipflop", 200, 30, "ff0");
      const ff1 = makeNode("d-flipflop", 200, 120, "ff1");
      const ff2 = makeNode("d-flipflop", 200, 210, "ff2");
      const ff3 = makeNode("d-flipflop", 200, 300, "ff3");
      const q0 = makeNode("bulb", 400, 30, "Q0");
      const q1 = makeNode("bulb", 400, 120, "Q1");
      const q2 = makeNode("bulb", 400, 210, "Q2");
      const q3 = makeNode("bulb", 400, 300, "Q3");
      return {
        nodes: [sin, clk, ff0, ff1, ff2, ff3, q0, q1, q2, q3],
        wires: [
          makeWire("SIN", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff2", "q", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "3bit-binary-counter",
    name: "3-bit Binary Counter",
    description: "Counts from 0 to 7 in binary using T flip-flops",
    category: "Sequential",
    tags: ["counter", "binary", "3-bit", "ripple"],
    build: () => {
      const clk = makeNode("toggle", 40, 120, "CLK");
      const ff0 = makeNode("d-flipflop", 200, 30, "ff0");
      const ff1 = makeNode("d-flipflop", 200, 120, "ff1");
      const ff2 = makeNode("d-flipflop", 200, 210, "ff2");
      const xor0 = makeNode("xor", 120, 40, "xor0");
      const xor1 = makeNode("xor", 120, 130, "xor1");
      const const1 = makeNode("const-1", 40, 40, "c1");
      const q0 = makeNode("bulb", 400, 30, "Q0");
      const q1 = makeNode("bulb", 400, 120, "Q1");
      const q2 = makeNode("bulb", 400, 210, "Q2");
      return {
        nodes: [clk, ff0, ff1, ff2, xor0, xor1, const1, q0, q1, q2],
        wires: [
          makeWire("c1", "out", "xor0", "a"), makeWire("ff0", "qn", "xor0", "b"),
          makeWire("xor0", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "xor1", "a"), makeWire("ff1", "qn", "xor1", "b"),
          makeWire("xor1", "out", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"),
        ],
      };
    },
  },

  {
    id: "4bit-binary-counter",
    name: "4-bit Binary Counter",
    description: "Counts from 0 to 15 in binary — ripple counter design",
    category: "Sequential",
    tags: ["counter", "binary", "4-bit", "ripple"],
    build: () => {
      const clk = makeNode("toggle", 40, 160, "CLK");
      const const1 = makeNode("const-1", 40, 40, "c1");
      const ff0 = makeNode("d-flipflop", 240, 30, "ff0");
      const ff1 = makeNode("d-flipflop", 240, 110, "ff1");
      const ff2 = makeNode("d-flipflop", 240, 190, "ff2");
      const ff3 = makeNode("d-flipflop", 240, 270, "ff3");
      const xor0 = makeNode("xor", 150, 30, "x0");
      const xor1 = makeNode("xor", 150, 110, "x1");
      const xor2 = makeNode("xor", 150, 190, "x2");
      const x2and = makeNode("and", 150, 230, "x2a");
      const x2and2 = makeNode("and", 150, 270, "x2b");
      const q0 = makeNode("bulb", 440, 30, "Q0");
      const q1 = makeNode("bulb", 440, 110, "Q1");
      const q2 = makeNode("bulb", 440, 190, "Q2");
      const q3 = makeNode("bulb", 440, 270, "Q3");
      return {
        nodes: [clk, const1, ff0, ff1, ff2, ff3, xor0, xor1, xor2, x2and, x2and2, q0, q1, q2, q3],
        wires: [
          makeWire("c1", "out", "x0", "a"), makeWire("ff0", "qn", "x0", "b"),
          makeWire("x0", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "x1", "a"), makeWire("ff1", "qn", "x1", "b"),
          makeWire("x1", "out", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff0", "q", "x2and", "a"), makeWire("ff1", "q", "x2and", "b"),
          makeWire("x2and", "out", "x2and2", "a"), makeWire("ff2", "qn", "x2and2", "b"),
          makeWire("x2and2", "out", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff2", "q", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "4bit-multiplier",
    name: "4-bit Multiplier",
    description: "Multiplies two 4-bit numbers using AND gates and adders",
    category: "Arithmetic",
    tags: ["multiplier", "4-bit", "binary-multiplication"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 80, "A1");
      const b0 = makeNode("toggle", 40, 160, "B0");
      const b1 = makeNode("toggle", 40, 240, "B1");
      const and00 = makeNode("and", 200, 20, "a00");
      const and01 = makeNode("and", 200, 80, "a01");
      const and10 = makeNode("and", 200, 160, "a10");
      const and11 = makeNode("and", 200, 240, "a11");
      const ha1 = makeNode("half-adder", 360, 140, "ha1");
      const ha2 = makeNode("half-adder", 360, 260, "ha2");
      const p0 = makeNode("bulb", 520, 20, "P0");
      const p1 = makeNode("bulb", 520, 140, "P1");
      const p2 = makeNode("bulb", 520, 260, "P2");
      const p3 = makeNode("led", 520, 340, "P3");
      return {
        nodes: [a0, a1, b0, b1, and00, and01, and10, and11, ha1, ha2, p0, p1, p2, p3],
        wires: [
          makeWire("A0", "out", "and00", "a"), makeWire("B0", "out", "and00", "b"),
          makeWire("A0", "out", "and01", "a"), makeWire("B1", "out", "and01", "b"),
          makeWire("A1", "out", "and10", "a"), makeWire("B0", "out", "and10", "b"),
          makeWire("A1", "out", "and11", "a"), makeWire("B1", "out", "and11", "b"),
          makeWire("and00", "out", "P0", "in"),
          makeWire("and01", "out", "ha1", "a"), makeWire("and10", "out", "ha1", "b"),
          makeWire("ha1", "sum", "P1", "in"),
          makeWire("ha1", "cout", "ha2", "a"), makeWire("and11", "out", "ha2", "b"),
          makeWire("ha2", "sum", "P2", "in"), makeWire("ha2", "cout", "P3", "r"),
        ],
      };
    },
  },

  {
    id: "odd-parity-generator",
    name: "Odd Parity Generator",
    description: "Generates odd parity bit for 3-bit input",
    category: "Combinational",
    tags: ["parity", "error-detection", "xor"],
    build: () => {
      const a = makeNode("toggle", 40, 30, "A");
      const b = makeNode("toggle", 40, 120, "B");
      const c = makeNode("toggle", 40, 210, "C");
      const xor1 = makeNode("xor", 200, 30, "xor1");
      const xor2 = makeNode("xor", 340, 100, "xor2");
      const parity = makeNode("bulb", 500, 110, "PARITY");
      return {
        nodes: [a, b, c, xor1, xor2, parity],
        wires: [
          makeWire("A", "out", "xor1", "a"), makeWire("B", "out", "xor1", "b"),
          makeWire("xor1", "out", "xor2", "a"), makeWire("C", "out", "xor2", "b"),
          makeWire("xor2", "out", "PARITY", "in"),
        ],
      };
    },
  },

  {
    id: "even-parity-generator",
    name: "Even Parity Generator",
    description: "Generates even parity bit for 3-bit input",
    category: "Combinational",
    tags: ["parity", "error-detection", "xnor"],
    build: () => {
      const a = makeNode("toggle", 40, 30, "A");
      const b = makeNode("toggle", 40, 120, "B");
      const c = makeNode("toggle", 40, 210, "C");
      const xor1 = makeNode("xor", 200, 30, "xor1");
      const xor2 = makeNode("xor", 340, 100, "xor2");
      const notG = makeNode("not", 480, 110, "not1");
      const parity = makeNode("bulb", 580, 110, "PARITY");
      return {
        nodes: [a, b, c, xor1, xor2, notG, parity],
        wires: [
          makeWire("A", "out", "xor1", "a"), makeWire("B", "out", "xor1", "b"),
          makeWire("xor1", "out", "xor2", "a"), makeWire("C", "out", "xor2", "b"),
          makeWire("xor2", "out", "notG", "a"), makeWire("notG", "out", "PARITY", "in"),
        ],
      };
    },
  },

  {
    id: "majority-voter",
    name: "Majority Voter (3-input)",
    description: "Outputs HIGH when 2 or more of 3 inputs are HIGH",
    category: "Combinational",
    tags: ["majority", "voter", "consensus"],
    build: () => {
      const a = makeNode("toggle", 40, 20, "A");
      const b = makeNode("toggle", 40, 120, "B");
      const c = makeNode("toggle", 40, 220, "C");
      const ab = makeNode("and", 200, 20, "ab");
      const ac = makeNode("and", 200, 120, "ac");
      const bc = makeNode("and", 200, 220, "bc");
      const or1 = makeNode("or", 360, 70, "or1");
      const or2 = makeNode("or", 360, 200, "or2");
      const outB = makeNode("bulb", 500, 130, "OUT");
      return {
        nodes: [a, b, c, ab, ac, bc, or1, or2, outB],
        wires: [
          makeWire("A", "out", "ab", "a"), makeWire("B", "out", "ab", "b"),
          makeWire("A", "out", "ac", "a"), makeWire("C", "out", "ac", "b"),
          makeWire("B", "out", "bc", "a"), makeWire("C", "out", "bc", "b"),
          makeWire("ab", "out", "or1", "a"), makeWire("ac", "out", "or1", "b"),
          makeWire("or1", "out", "or2", "a"), makeWire("bc", "out", "or2", "b"),
          makeWire("or2", "out", "OUT", "in"),
        ],
      };
    },
  },

  {
    id: "4to1-mux-gates",
    name: "4:1 MUX (from gates)",
    description: "4:1 multiplexer built from AND/OR/NOT gates",
    category: "Combinational",
    tags: ["mux", "4-input", "from-gates"],
    build: () => {
      const i0 = makeNode("toggle", 30, 20, "I0");
      const i1 = makeNode("toggle", 30, 100, "I1");
      const i2 = makeNode("toggle", 30, 180, "I2");
      const i3 = makeNode("toggle", 30, 260, "I3");
      const s0 = makeNode("toggle", 30, 340, "S0");
      const s1 = makeNode("toggle", 30, 420, "S1");
      const notS0 = makeNode("not", 160, 330, "nS0");
      const notS1 = makeNode("not", 160, 410, "nS1");
      const and0 = makeNode("and", 280, 20, "and0");
      const and1 = makeNode("and", 280, 100, "and1");
      const and2 = makeNode("and", 280, 180, "and2");
      const and3 = makeNode("and", 280, 260, "and3");
      const orHi = makeNode("or", 420, 50, "orH");
      const orLo = makeNode("or", 420, 210, "orL");
      const orOut = makeNode("or", 540, 130, "orO");
      const outB = makeNode("bulb", 660, 140, "OUT");
      return {
        nodes: [i0, i1, i2, i3, s0, s1, notS0, notS1, and0, and1, and2, and3, orHi, orLo, orOut, outB],
        wires: [
          makeWire("S0", "out", "notS0", "a"), makeWire("S1", "out", "notS1", "a"),
          makeWire("I0", "out", "and0", "a"), makeWire("nS0", "out", "and0", "b"),
          makeWire("I1", "out", "and1", "a"), makeWire("S0", "out", "and1", "b"),
          makeWire("I2", "out", "and2", "a"), makeWire("nS1", "out", "and2", "b"),
          makeWire("I3", "out", "and3", "a"), makeWire("S1", "out", "and3", "b"),
          makeWire("and0", "out", "orHi", "a"), makeWire("and1", "out", "orHi", "b"),
          makeWire("and2", "out", "orLo", "a"), makeWire("and3", "out", "orLo", "b"),
          makeWire("orHi", "out", "orO", "a"), makeWire("orLo", "out", "orO", "b"),
          makeWire("orO", "out", "OUT", "in"),
        ],
      };
    },
  },

  {
    id: "8to3-priority-encoder",
    name: "8:3 Priority Encoder",
    description: "Encodes highest-priority active input from 8 lines to 3-bit binary",
    category: "Combinational",
    tags: ["encoder", "priority", "8-input"],
    build: () => {
      const d = Array.from({ length: 8 }, (_, i) => makeNode("toggle", 30, 10 + i * 50, `D${i}`));
      const orG = makeNode("or", 220, 10, "orH");
      const orL = makeNode("or", 220, 110, "orL");
      const orM = makeNode("or", 220, 210, "orM");
      const y2 = makeNode("bulb", 420, 10, "Y2");
      const y1 = makeNode("bulb", 420, 110, "Y1");
      const y0 = makeNode("bulb", 420, 210, "Y0");
      return {
        nodes: [...d, orG, orL, orM, y2, y1, y0],
        wires: [
          makeWire("D7", "out", "orH", "a"), makeWire("D6", "out", "orH", "b"),
          makeWire("D5", "out", "orL", "a"), makeWire("D4", "out", "orL", "b"),
          makeWire("D3", "out", "orM", "a"), makeWire("D2", "out", "orM", "b"),
          makeWire("orH", "out", "Y2", "in"), makeWire("orL", "out", "Y1", "in"),
          makeWire("orM", "out", "Y0", "in"),
        ],
      };
    },
  },

  {
    id: "gray-code-converter",
    name: "Gray Code Converter",
    description: "Converts 3-bit binary to Gray code",
    category: "Combinational",
    tags: ["gray-code", "conversion", "encoding"],
    build: () => {
      const b2 = makeNode("toggle", 40, 20, "B2");
      const b1 = makeNode("toggle", 40, 120, "B1");
      const b0 = makeNode("toggle", 40, 220, "B0");
      const xorG = makeNode("xor", 220, 20, "xor1");
      const xor2 = makeNode("xor", 220, 120, "xor2");
      const g2 = makeNode("bulb", 400, 20, "G2");
      const g1 = makeNode("bulb", 400, 120, "G1");
      const g0 = makeNode("bulb", 400, 220, "G0");
      return {
        nodes: [b2, b1, b0, xorG, xor2, g2, g1, g0],
        wires: [
          makeWire("B2", "out", "G2", "in"),
          makeWire("B2", "out", "xor1", "a"), makeWire("B1", "out", "xor1", "b"),
          makeWire("xor1", "out", "G1", "in"),
          makeWire("B1", "out", "xor2", "a"), makeWire("B0", "out", "xor2", "b"),
          makeWire("xor2", "out", "G0", "in"),
        ],
      };
    },
  },

  {
    id: "2bit-multiplier",
    name: "2-bit Multiplier",
    description: "Multiplies two 2-bit numbers",
    category: "Arithmetic",
    tags: ["multiplier", "2-bit", "simple"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 100, "A1");
      const b0 = makeNode("toggle", 40, 180, "B0");
      const b1 = makeNode("toggle", 40, 260, "B1");
      const and00 = makeNode("and", 200, 20, "a00");
      const and01 = makeNode("and", 200, 100, "a01");
      const and10 = makeNode("and", 200, 180, "a10");
      const and11 = makeNode("and", 200, 260, "a11");
      const ha = makeNode("half-adder", 360, 160, "ha1");
      const p0 = makeNode("bulb", 500, 20, "P0");
      const p1 = makeNode("bulb", 500, 160, "P1");
      const p2 = makeNode("bulb", 500, 280, "P2");
      return {
        nodes: [a0, a1, b0, b1, and00, and01, and10, and11, ha, p0, p1, p2],
        wires: [
          makeWire("A0", "out", "and00", "a"), makeWire("B0", "out", "and00", "b"),
          makeWire("A0", "out", "and01", "a"), makeWire("B1", "out", "and01", "b"),
          makeWire("A1", "out", "and10", "a"), makeWire("B0", "out", "and10", "b"),
          makeWire("A1", "out", "and11", "a"), makeWire("B1", "out", "and11", "b"),
          makeWire("and00", "out", "P0", "in"),
          makeWire("and01", "out", "ha", "a"), makeWire("and10", "out", "ha", "b"),
          makeWire("ha", "sum", "P1", "in"), makeWire("ha", "cout", "P2", "in"),
        ],
      };
    },
  },

  {
    id: "bcd-to-binary",
    name: "BCD to Binary",
    description: "Converts BCD (4-bit) to binary representation",
    category: "Combinational",
    tags: ["bcd", "binary", "conversion"],
    build: () => {
      const a = makeNode("toggle", 40, 20, "A");
      const b = makeNode("toggle", 40, 100, "B");
      const c = makeNode("toggle", 40, 180, "C");
      const d = makeNode("toggle", 40, 260, "D");
      const ha1 = makeNode("half-adder", 200, 100, "ha1");
      const ha2 = makeNode("half-adder", 200, 220, "ha2");
      const o0 = makeNode("bulb", 400, 20, "Y0");
      const o1 = makeNode("bulb", 400, 120, "Y1");
      const o2 = makeNode("bulb", 400, 220, "Y2");
      const o3 = makeNode("led", 400, 300, "Y3");
      return {
        nodes: [a, b, c, d, ha1, ha2, o0, o1, o2, o3],
        wires: [
          makeWire("A", "out", "o0", "in"),
          makeWire("B", "out", "ha1", "a"), makeWire("A", "out", "ha1", "b"),
          makeWire("ha1", "sum", "o1", "in"),
          makeWire("C", "out", "ha2", "a"), makeWire("ha1", "cout", "ha2", "b"),
          makeWire("ha2", "sum", "o2", "in"), makeWire("ha2", "cout", "o3", "r"),
        ],
      };
    },
  },

  {
    id: "4bit-magnitude-comparator",
    name: "4-bit Magnitude Comparator",
    description: "Compares two 4-bit numbers: A>B, A<B, A==B",
    category: "Combinational",
    tags: ["comparator", "magnitude", "4-bit"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 80, "A1");
      const b0 = makeNode("toggle", 40, 140, "B0");
      const b1 = makeNode("toggle", 40, 200, "B1");
      const eq0 = makeNode("xnor", 200, 20, "eq0");
      const eq1 = makeNode("xnor", 200, 100, "eq1");
      const eqAnd = makeNode("and", 340, 40, "eqAnd");
      const eqBulb = makeNode("bulb", 480, 50, "A==B");
      const gt0 = makeNode("and", 200, 180, "gt0");
      const gt1 = makeNode("and", 200, 260, "gt1");
      const gtOr = makeNode("or", 340, 210, "gtOr");
      const gtBulb = makeNode("bulb", 480, 220, "A!=B");
      return {
        nodes: [a0, a1, b0, b1, eq0, eq1, eqAnd, eqBulb, gt0, gt1, gtOr, gtBulb],
        wires: [
          makeWire("A0", "out", "eq0", "a"), makeWire("B0", "out", "eq0", "b"),
          makeWire("A1", "out", "eq1", "a"), makeWire("B1", "out", "eq1", "b"),
          makeWire("eq0", "out", "eqAnd", "a"), makeWire("eq1", "out", "eqAnd", "b"),
          makeWire("eqAnd", "out", "A==B", "in"),
          makeWire("A0", "out", "gt0", "a"), makeWire("B0", "out", "gt0", "b"),
          makeWire("A1", "out", "gt1", "a"), makeWire("B1", "out", "gt1", "b"),
          makeWire("gt0", "out", "gtOr", "a"), makeWire("gt1", "out", "gtOr", "b"),
          makeWire("gtOr", "out", "A!=B", "in"),
        ],
      };
    },
  },

  {
    id: "ring-counter",
    name: "Ring Counter",
    description: "Circulates a single HIGH bit through 4 D flip-flops in a ring",
    category: "Sequential",
    tags: ["ring-counter", "sequential", "circulating"],
    build: () => {
      const clk = makeNode("toggle", 40, 160, "CLK");
      const init = makeNode("toggle", 40, 20, "INIT");
      const ff0 = makeNode("d-flipflop", 240, 10, "ff0");
      const ff1 = makeNode("d-flipflop", 240, 100, "ff1");
      const ff2 = makeNode("d-flipflop", 240, 190, "ff2");
      const ff3 = makeNode("d-flipflop", 240, 280, "ff3");
      const q0 = makeNode("bulb", 460, 10, "Q0");
      const q1 = makeNode("bulb", 460, 100, "Q1");
      const q2 = makeNode("bulb", 460, 190, "Q2");
      const q3 = makeNode("bulb", 460, 280, "Q3");
      return {
        nodes: [clk, init, ff0, ff1, ff2, ff3, q0, q1, q2, q3],
        wires: [
          makeWire("INIT", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff2", "q", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "johnson-counter",
    name: "Johnson Counter",
    description: "Twisted ring counter — inverts feedback for 8-state sequence",
    category: "Sequential",
    tags: ["johnson-counter", "twisted-ring", "sequential"],
    build: () => {
      const clk = makeNode("toggle", 40, 160, "CLK");
      const ff0 = makeNode("d-flipflop", 200, 10, "ff0");
      const ff1 = makeNode("d-flipflop", 200, 100, "ff1");
      const ff2 = makeNode("d-flipflop", 200, 190, "ff2");
      const ff3 = makeNode("d-flipflop", 200, 280, "ff3");
      const notG = makeNode("not", 140, 300, "notFB");
      const q0 = makeNode("bulb", 420, 10, "Q0");
      const q1 = makeNode("bulb", 420, 100, "Q1");
      const q2 = makeNode("bulb", 420, 190, "Q2");
      const q3 = makeNode("bulb", 420, 280, "Q3");
      return {
        nodes: [clk, ff0, ff1, ff2, ff3, notG, q0, q1, q2, q3],
        wires: [
          makeWire("ff3", "q", "notG", "a"), makeWire("notG", "out", "ff0", "d"),
          makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff2", "q", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "lfsr-4bit",
    name: "4-bit LFSR",
    description: "Linear Feedback Shift Register with XOR tap at bits 3 and 4",
    category: "Sequential",
    tags: ["lfsr", "pseudo-random", "shift-register", "feedback"],
    build: () => {
      const clk = makeNode("toggle", 40, 160, "CLK");
      const init = makeNode("toggle", 40, 20, "SEED");
      const ff0 = makeNode("d-flipflop", 200, 10, "ff0");
      const ff1 = makeNode("d-flipflop", 200, 100, "ff1");
      const ff2 = makeNode("d-flipflop", 200, 190, "ff2");
      const ff3 = makeNode("d-flipflop", 200, 280, "ff3");
      const xorFB = makeNode("xor", 140, 300, "xorFB");
      const q0 = makeNode("bulb", 420, 10, "Q0");
      const q1 = makeNode("bulb", 420, 100, "Q1");
      const q2 = makeNode("bulb", 420, 190, "Q2");
      const q3 = makeNode("bulb", 420, 280, "Q3");
      return {
        nodes: [clk, init, ff0, ff1, ff2, ff3, xorFB, q0, q1, q2, q3],
        wires: [
          makeWire("ff2", "q", "xorFB", "a"), makeWire("ff3", "q", "xorFB", "b"),
          makeWire("xorFB", "out", "ff0", "d"), makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "ff1", "d"), makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "ff2", "d"), makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff2", "q", "ff3", "d"), makeWire("CLK", "out", "ff3", "clk"),
          makeWire("ff0", "q", "Q0", "in"), makeWire("ff1", "q", "Q1", "in"),
          makeWire("ff2", "q", "Q2", "in"), makeWire("ff3", "q", "Q3", "in"),
        ],
      };
    },
  },

  {
    id: "binary-to-bcd",
    name: "Binary to BCD",
    description: "Converts 4-bit binary to BCD using double-dabble algorithm",
    category: "Combinational",
    tags: ["binary", "bcd", "conversion", "double-dabble"],
    build: () => {
      const b0 = makeNode("toggle", 40, 20, "B0");
      const b1 = makeNode("toggle", 40, 100, "B1");
      const b2 = makeNode("toggle", 40, 180, "B2");
      const b3 = makeNode("toggle", 40, 260, "B3");
      const hex = makeNode("hex-display", 240, 80, "bcd");
      const bcd1 = makeNode("bulb", 420, 200, "TENS");
      return {
        nodes: [b0, b1, b2, b3, hex, bcd1],
        wires: [
          makeWire("B0", "out", "hex", "a"), makeWire("B1", "out", "hex", "b"),
          makeWire("B2", "out", "hex", "c"), makeWire("B3", "out", "hex", "d"),
          makeWire("B3", "out", "TENS", "in"),
        ],
      };
    },
  },

  {
    id: "carry-lookahead-4bit",
    name: "4-bit Carry Lookahead Adder",
    description: "Parallel prefix adder — faster than ripple carry",
    category: "Arithmetic",
    tags: ["carry-lookahead", "parallel", "fast-adder"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 90, "A1");
      const b0 = makeNode("toggle", 40, 170, "B0");
      const b1 = makeNode("toggle", 40, 240, "B1");
      const and0 = makeNode("and", 200, 20, "p0");
      const and1 = makeNode("and", 200, 100, "p1");
      const or0 = makeNode("or", 200, 180, "g0");
      const or1 = makeNode("or", 200, 260, "g1");
      const fa0 = makeNode("full-adder", 360, 20, "fa0");
      const fa1 = makeNode("full-adder", 360, 160, "fa1");
      const s0 = makeNode("bulb", 540, 30, "S0");
      const s1 = makeNode("bulb", 540, 170, "S1");
      return {
        nodes: [a0, a1, b0, b1, and0, and1, or0, or1, fa0, fa1, s0, s1],
        wires: [
          makeWire("A0", "out", "and0", "a"), makeWire("B0", "out", "and0", "b"),
          makeWire("A1", "out", "and1", "a"), makeWire("B1", "out", "and1", "b"),
          makeWire("A0", "out", "or0", "a"), makeWire("B0", "out", "or0", "b"),
          makeWire("A1", "out", "or1", "a"), makeWire("B1", "out", "or1", "b"),
          makeWire("A0", "out", "fa0", "a"), makeWire("B0", "out", "fa0", "b"),
          makeWire("or0", "out", "fa1", "cin"),
          makeWire("A1", "out", "fa1", "a"), makeWire("B1", "out", "fa1", "b"),
          makeWire("fa0", "sum", "S0", "in"), makeWire("fa1", "sum", "S1", "in"),
        ],
      };
    },
  },

  {
    id: "traffic-light-basic",
    name: "Traffic Light Controller",
    description: "Basic traffic light state machine with 3 lights",
    category: "Practical",
    tags: ["traffic-light", "controller", "state-machine"],
    build: () => {
      const clk = makeNode("toggle", 40, 120, "CLK");
      const ff0 = makeNode("d-flipflop", 200, 20, "ffR");
      const ff1 = makeNode("d-flipflop", 200, 140, "ffY");
      const ff2 = makeNode("d-flipflop", 200, 260, "ffG");
      const notR = makeNode("not", 160, 30, "nR");
      const notY = makeNode("not", 160, 150, "nY");
      const notG = makeNode("not", 160, 270, "nG");
      const red = makeNode("led", 420, 20, "RED");
      const yellow = makeNode("led", 420, 140, "YELLOW");
      const green = makeNode("led", 420, 260, "GREEN");
      return {
        nodes: [clk, ff0, ff1, ff2, notR, notY, notG, red, yellow, green],
        wires: [
          makeWire("ff2", "q", "notR", "a"), makeWire("notR", "out", "ff0", "d"),
          makeWire("CLK", "out", "ff0", "clk"),
          makeWire("ff0", "q", "notY", "a"), makeWire("notY", "out", "ff1", "d"),
          makeWire("CLK", "out", "ff1", "clk"),
          makeWire("ff1", "q", "notG", "a"), makeWire("notG", "out", "ff2", "d"),
          makeWire("CLK", "out", "ff2", "clk"),
          makeWire("ff0", "q", "RED", "r"), makeWire("ff1", "q", "YELLOW", "r"),
          makeWire("ff2", "q", "GREEN", "r"),
        ],
      };
    },
  },

  {
    id: "adder-subtractor",
    name: "Adder/Subtractor",
    description: "Combined adder-subtractor with mode select",
    category: "Arithmetic",
    tags: ["adder", "subtractor", "combined", "mode-select"],
    build: () => {
      const a0 = makeNode("toggle", 40, 20, "A0");
      const a1 = makeNode("toggle", 40, 100, "A1");
      const b0 = makeNode("toggle", 40, 180, "B0");
      const b1 = makeNode("toggle", 40, 260, "B1");
      const mode = makeNode("toggle", 40, 350, "MODE");
      const xor0 = makeNode("xor", 180, 180, "xor0");
      const xor1 = makeNode("xor", 180, 260, "xor1");
      const fa0 = makeNode("full-adder", 340, 40, "fa0");
      const fa1 = makeNode("full-adder", 340, 160, "fa1");
      const s0 = makeNode("bulb", 540, 50, "S0");
      const s1 = makeNode("bulb", 540, 170, "S1");
      const cout = makeNode("led", 540, 280, "COUT");
      return {
        nodes: [a0, a1, b0, b1, mode, xor0, xor1, fa0, fa1, s0, s1, cout],
        wires: [
          makeWire("B0", "out", "xor0", "a"), makeWire("MODE", "out", "xor0", "b"),
          makeWire("B1", "out", "xor1", "a"), makeWire("MODE", "out", "xor1", "b"),
          makeWire("A0", "out", "fa0", "a"), makeWire("xor0", "out", "fa0", "b"),
          makeWire("MODE", "out", "fa0", "cin"),
          makeWire("A1", "out", "fa1", "a"), makeWire("xor1", "out", "fa1", "b"),
          makeWire("fa0", "cout", "fa1", "cin"),
          makeWire("fa0", "sum", "S0", "in"), makeWire("fa1", "sum", "S1", "in"),
          makeWire("fa1", "cout", "COUT", "r"),
        ],
      };
    },
  },

  {
    id: "bcd-7seg-decoder",
    name: "BCD to 7-Segment",
    description: "Drives a 7-segment display from BCD input",
    category: "Display",
    tags: ["bcd", "7-segment", "display", "decoder"],
    build: () => {
      const a = makeNode("toggle", 40, 20, "A");
      const b = makeNode("toggle", 40, 100, "B");
      const c = makeNode("toggle", 40, 180, "C");
      const d = makeNode("toggle", 40, 260, "D");
      const and1 = makeNode("and", 200, 20, "segA");
      const or1 = makeNode("or", 200, 100, "segB");
      const notD = makeNode("not", 160, 280, "nD");
      const and2 = makeNode("and", 340, 50, "segC");
      const outA = makeNode("led", 460, 20, "A");
      const outB = makeNode("led", 460, 100, "B");
      const outC = makeNode("led", 460, 180, "C");
      return {
        nodes: [a, b, c, d, and1, or1, notD, and2, outA, outB, outC],
        wires: [
          makeWire("A", "out", "segA", "a"), makeWire("B", "out", "segA", "b"),
          makeWire("A", "out", "segB", "a"), makeWire("C", "out", "segB", "b"),
          makeWire("D", "out", "nD", "a"),
          makeWire("nD", "out", "segC", "a"), makeWire("B", "out", "segC", "b"),
          makeWire("segA", "out", "A", "r"), makeWire("segB", "out", "B", "r"),
          makeWire("segC", "out", "C", "r"),
        ],
      };
    },
  },

  {
    id: "demux-1to4",
    name: "1:4 Demultiplexer",
    description: "Routes a single input to one of four outputs",
    category: "Combinational",
    tags: ["demultiplexer", "demux", "router"],
    build: () => {
      const din = makeNode("toggle", 40, 60, "DIN");
      const s0 = makeNode("toggle", 40, 180, "S0");
      const s1 = makeNode("toggle", 40, 280, "S1");
      const notS0 = makeNode("not", 180, 170, "nS0");
      const notS1 = makeNode("not", 180, 270, "nS1");
      const and0 = makeNode("and", 300, 20, "a0");
      const and1 = makeNode("and", 300, 100, "a1");
      const and2 = makeNode("and", 300, 180, "a2");
      const and3 = makeNode("and", 300, 260, "a3");
      const y0 = makeNode("bulb", 460, 20, "Y0");
      const y1 = makeNode("bulb", 460, 100, "Y1");
      const y2 = makeNode("bulb", 460, 180, "Y2");
      const y3 = makeNode("bulb", 460, 260, "Y3");
      return {
        nodes: [din, s0, s1, notS0, notS1, and0, and1, and2, and3, y0, y1, y2, y3],
        wires: [
          makeWire("S0", "out", "nS0", "a"), makeWire("S1", "out", "nS1", "a"),
          makeWire("DIN", "out", "and0", "a"), makeWire("nS0", "out", "and0", "b"),
          makeWire("DIN", "out", "and1", "a"), makeWire("S0", "out", "and1", "b"),
          makeWire("DIN", "out", "and2", "a"), makeWire("nS1", "out", "and2", "b"),
          makeWire("DIN", "out", "and3", "a"), makeWire("S1", "out", "and3", "b"),
          makeWire("and0", "out", "Y0", "in"), makeWire("and1", "out", "Y1", "in"),
          makeWire("and2", "out", "Y2", "in"), makeWire("and3", "out", "Y3", "in"),
        ],
      };
    },
  },

  {
    id: "magnitude-comparator-1bit",
    name: "1-bit Comparator",
    description: "Compares two single bits: Equal, Not Equal",
    category: "Combinational",
    tags: ["comparator", "1-bit", "equality"],
    build: () => {
      const a = makeNode("toggle", 40, 40, "A");
      const b = makeNode("toggle", 40, 160, "B");
      const xnorG = makeNode("xnor", 200, 40, "eq");
      const xorG = makeNode("xor", 200, 140, "neq");
      const eqBulb = makeNode("bulb", 420, 40, "EQ");
      const neqBulb = makeNode("bulb", 420, 140, "NEQ");
      return {
        nodes: [a, b, xnorG, xorG, eqBulb, neqBulb],
        wires: [
          makeWire("A", "out", "eq", "a"), makeWire("B", "out", "eq", "b"),
          makeWire("eq", "out", "EQ", "in"),
          makeWire("A", "out", "neq", "a"), makeWire("B", "out", "neq", "b"),
          makeWire("neq", "out", "NEQ", "in"),
        ],
      };
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  "Basic Gates",
  "Arithmetic",
  "Combinational",
  "Memory",
  "Sequential",
  "Display",
  "Practical",
] as const;
