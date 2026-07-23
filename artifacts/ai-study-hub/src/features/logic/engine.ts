import type { Circuit, CircuitNode, TruthTableRow } from "./types";
import { GATE_DEFS } from "./gates";

function evalGate(type: string, inputs: Record<string, boolean>): boolean {
  const a = !!inputs.a;
  const b = !!inputs.b;
  const cin = !!inputs.cin;
  const bin = !!inputs.bin;
  const d = !!inputs.d;
  const en = !!inputs.en;
  const clk = !!inputs.clk;
  const sel = !!inputs.sel;
  const i0 = !!inputs.i0;
  const i1 = !!inputs.i1;

  switch (type) {
    case "input":
      return !!inputs._value;
    case "not":
      return !a;
    case "and":
      return a && b;
    case "or":
      return a || b;
    case "nand":
      return !(a && b);
    case "nor":
      return !(a || b);
    case "xor":
      return a !== b;
    case "xnor":
      return a === b;
    case "buffer":
      return a;
    case "half-adder":
      return a !== b;
    case "full-adder": {
      const s = (a ? 1 : 0) + (b ? 1 : 0) + (cin ? 1 : 0);
      return s === 1 || s === 3;
    }
    case "half-subtractor":
      return a !== b;
    case "full-subtractor":
      return a !== b !== bin;
    case "mux2":
      return sel ? i1 : i0;
    case "decoder":
      return false;
    case "d-latch":
      return en ? d : d;
    case "d-flipflop":
      return d;
    default:
      return false;
  }
}

export function simulate(circuit: Circuit): Circuit {
  const { nodes, wires } = circuit;
  const updated = nodes.map((n) => ({
    ...n,
    inputValues: { ...n.inputValues },
    outputValues: { ...n.outputValues },
  }));

  for (let iter = 0; iter < 20; iter++) {
    let changed = false;

    for (const node of updated) {
      const def = GATE_DEFS[node.type];
      if (!def) continue;

      if (node.type === "input") {
        node.outputValues = { out: !!node.inputValues._value };
        continue;
      }

      for (const outPort of def.outputs) {
        let val: boolean;
        if (node.type === "decoder") {
          const a = !!node.inputValues.a;
          const b = !!node.inputValues.b;
          const idx = (a ? 2 : 0) + (b ? 1 : 0);
          val = outPort.id === `o${idx}`;
        } else if (node.type === "half-adder") {
          val = outPort.id === "sum" ? !!node.inputValues.a !== !!node.inputValues.b : !!node.inputValues.a && !!node.inputValues.b;
        } else if (node.type === "full-adder") {
          const s = (node.inputValues.a ? 1 : 0) + (node.inputValues.b ? 1 : 0) + (node.inputValues.cin ? 1 : 0);
          val = outPort.id === "sum" ? s === 1 || s === 3 : s >= 2;
        } else if (node.type === "half-subtractor") {
          val = outPort.id === "diff" ? !!node.inputValues.a !== !!node.inputValues.b : !node.inputValues.a && !!node.inputValues.b;
        } else if (node.type === "full-subtractor") {
          const d = !!node.inputValues.a !== !!node.inputValues.b !== !!node.inputValues.bin;
          val = outPort.id === "diff" ? d : (!node.inputValues.a && !!node.inputValues.b) || (!node.inputValues.a && !!node.inputValues.bin) || (!!node.inputValues.b && !!node.inputValues.bin);
        } else if (node.type === "d-latch") {
          val = outPort.id === "q" ? (node.inputValues.en ? node.inputValues.d : node.outputValues.q ?? false) : !(node.inputValues.en ? node.inputValues.d : node.outputValues.q ?? false);
        } else if (node.type === "d-flipflop") {
          val = outPort.id === "q" ? (node.inputValues.clk ? node.inputValues.d : node.outputValues.q ?? false) : !(node.inputValues.clk ? node.inputValues.d : node.outputValues.q ?? false);
        } else {
          val = evalGate(node.type, node.inputValues);
        }

        if (node.outputValues[outPort.id] !== val) {
          node.outputValues[outPort.id] = val;
          changed = true;
        }
      }
    }

    for (const wire of wires) {
      const src = updated.find((n) => n.id === wire.from.nodeId);
      const dst = updated.find((n) => n.id === wire.to.nodeId);
      if (src && dst) {
        const val = !!src.outputValues[wire.from.portId];
        if (dst.inputValues[wire.to.portId] !== val) {
          dst.inputValues[wire.to.portId] = val;
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return { nodes: updated, wires: [...wires] };
}

export function generateTruthTable(circuit: Circuit): TruthTableRow[] {
  const sim = simulate(circuit);
  const inputs = sim.nodes.filter((n) => n.type === "input");
  const outputs = sim.nodes.filter((n) => n.type === "output");

  if (inputs.length === 0 || outputs.length === 0) return [];

  const n = inputs.length;
  const rows: TruthTableRow[] = [];

  for (let i = 0; i < Math.pow(2, n); i++) {
    const testCircuit: Circuit = {
      nodes: sim.nodes.map((node) => {
        if (node.type === "input") {
          const idx = inputs.indexOf(node);
          return {
            ...node,
            inputValues: { _value: !!((i >> (n - 1 - idx)) & 1) },
          };
        }
        return { ...node, inputValues: { ...node.inputValues } };
      }),
      wires: [...sim.wires],
    };

    const result = simulate(testCircuit);
    const inputVals: Record<string, boolean> = {};
    const outputVals: Record<string, boolean> = {};

    for (const inp of inputs) {
      const r = result.nodes.find((n) => n.id === inp.id);
      inputVals[inp.id] = r ? !!r.outputValues.out : false;
    }
    for (const out of outputs) {
      const r = result.nodes.find((n) => n.id === out.id);
      outputVals[out.id] = r ? !!r.inputValues.in : false;
    }

    rows.push({ inputs: inputVals, outputs: outputVals });
  }

  return rows;
}

export function exportJSON(circuit: Circuit): string {
  return JSON.stringify(circuit, null, 2);
}

export function importJSON(json: string): Circuit | null {
  try {
    const data = JSON.parse(json);
    if (data.nodes && data.wires) return data as Circuit;
    return null;
  } catch {
    return null;
  }
}
