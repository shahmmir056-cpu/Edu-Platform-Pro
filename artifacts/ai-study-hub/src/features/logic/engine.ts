import type { Circuit, CircuitNode, GateType } from "./types";

function evalNode(node: CircuitNode): boolean[] {
  const i = (k: string) => !!node.inputs[k];
  const def: Record<string, () => boolean> = {
    "const-0": () => false,
    "const-1": () => true,
    toggle: () => !!node.outputs.out,
    button: () => !!node.outputs.out,
    clock: () => !!node.outputs.out,
    buffer: () => i("a"),
    not: () => !i("a"),
    and: () => i("a") && i("b"),
    nand: () => !(i("a") && i("b")),
    or: () => i("a") || i("b"),
    nor: () => !(i("a") || i("b")),
    xor: () => i("a") !== i("b"),
    xnor: () => i("a") === i("b"),
    "half-adder": () => false,
    "full-adder": () => false,
    "half-subtractor": () => false,
    "full-subtractor": () => false,
    mux2: () => i("sel") ? i("i1") : i("i0"),
    mux4: () => {
      const s = (i("s1") ? 2 : 0) + (i("s0") ? 1 : 0);
      return [i("i0"), i("i1"), i("i2"), i("i3")][s];
    },
    decoder: () => false,
    "d-latch": () => i("en") ? i("d") : !!node.outputs.q,
    "d-flipflop": () => i("clk") ? i("d") : !!node.outputs.q,
    bulb: () => i("in"),
    "hex-display": () => i("a"),
    led: () => i("r"),
  };

  const ev = def[node.type];
  if (!ev) return [];

  if (node.type === "half-adder") {
    const s = i("a") !== i("b");
    const c = i("a") && i("b");
    return [s, c];
  }
  if (node.type === "full-adder") {
    const t = (i("a") ? 1 : 0) + (i("b") ? 1 : 0) + (i("cin") ? 1 : 0);
    return [t === 1 || t === 3, t >= 2];
  }
  if (node.type === "half-subtractor") {
    return [i("a") !== i("b"), !i("a") && i("b")];
  }
  if (node.type === "full-subtractor") {
    const d = i("a") !== i("b") !== i("bin");
    const bo = (!i("a") && i("b")) || (!i("a") && i("bin")) || (i("b") && i("bin"));
    return [d, bo];
  }
  if (node.type === "decoder") {
    const idx = (i("b") ? 2 : 0) + (i("a") ? 1 : 0);
    return [0 === idx, 1 === idx, 2 === idx, 3 === idx];
  }
  if (node.type === "hex-display") {
    const val = (i("d") ? 8 : 0) + (i("c") ? 4 : 0) + (i("b") ? 2 : 0) + (i("a") ? 1 : 0);
    return [val > 0];
  }
  if (node.type === "led") {
    return [i("r") || i("g") || i("b")];
  }

  return [ev()];
}

export function simulate(circuit: Circuit): Circuit {
  const nodes = circuit.nodes.map((n) => ({
    ...n,
    inputs: { ...n.inputs },
    outputs: { ...n.outputs },
  }));

  for (let iter = 0; iter < 30; iter++) {
    let changed = false;

    for (const node of nodes) {
      const def = { "const-0": false, "const-1": true };
      if (node.type in def) {
        const val = def[node.type as "const-0" | "const-1"];
        if (node.outputs.out !== val) { node.outputs.out = val; changed = true; }
        continue;
      }

      const outKeys = Object.keys(node.outputs);
      const vals = evalNode(node);
      outKeys.forEach((k, idx) => {
        const v = vals[idx] ?? false;
        if (node.outputs[k] !== v) { node.outputs[k] = v; changed = true; }
      });
    }

    for (const wire of circuit.wires) {
      const src = nodes.find((n) => n.id === wire.fromNode);
      const dst = nodes.find((n) => n.id === wire.toNode);
      if (src && dst) {
        const v = !!src.outputs[wire.fromPort];
        if (dst.inputs[wire.toPort] !== v) { dst.inputs[wire.toPort] = v; changed = true; }
      }
    }

    if (!changed) break;
  }

  return { nodes, wires: [...circuit.wires] };
}

export function generateTruthTable(circuit: Circuit) {
  const inputs = circuit.nodes.filter((n) => n.type === "toggle" || n.type === "const-0" || n.type === "const-1" || n.type === "button");
  const outputs = circuit.nodes.filter((n) => n.type === "bulb" || n.type === "hex-display" || n.type === "led" || n.type === "d-latch" || n.type === "d-flipflop");

  if (inputs.length === 0 || outputs.length === 0) return { headers: [], rows: [] };

  const n = inputs.length;
  if (n > 12) return { headers: [], rows: [] };
  const rows: { inputs: Record<string, boolean>; outputs: Record<string, boolean> }[] = [];

  for (let i = 0; i < Math.pow(2, n); i++) {
    const testCircuit: Circuit = {
      nodes: circuit.nodes.map((node) => {
        const idx = inputs.indexOf(node);
        if (idx >= 0) {
          return { ...node, inputs: { ...node.inputs }, outputs: { out: !!((i >> (n - 1 - idx)) & 1) } };
        }
        return { ...node, inputs: { ...node.inputs }, outputs: { ...node.outputs } };
      }),
      wires: [...circuit.wires],
    };

    const result = simulate(testCircuit);
    const iv: Record<string, boolean> = {};
    const ov: Record<string, boolean> = {};

    for (const inp of inputs) {
      const r = result.nodes.find((nd) => nd.id === inp.id);
      iv[inp.id] = r ? !!Object.values(r.outputs)[0] : false;
    }
    for (const out of outputs) {
      const r = result.nodes.find((nd) => nd.id === out.id);
      ov[out.id] = r ? !!Object.values(r.inputs)[0] : false;
    }

    rows.push({ inputs: iv, outputs: ov });
  }

  return {
    headers: [...inputs.map((n) => n.id), "", ...outputs.map((n) => n.id)],
    rows,
    inputNodes: inputs,
    outputNodes: outputs,
  };
}
