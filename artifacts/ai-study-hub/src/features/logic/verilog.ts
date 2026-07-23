import type { Circuit, CircuitNode } from "./types";
import { GATE_DEFS } from "./gates";

function portName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}

function nodeLabel(node: CircuitNode): string {
  return `n${node.id}`;
}

function inputNodes(circuit: Circuit): CircuitNode[] {
  return circuit.nodes.filter((n) =>
    ["toggle", "const-0", "const-1", "button", "clock"].includes(n.type)
  );
}

function outputNodes(circuit: Circuit): CircuitNode[] {
  return circuit.nodes.filter((n) =>
    ["bulb", "hex-display", "led", "d-latch", "d-flipflop"].includes(n.type)
  );
}

function gateNodes(circuit: Circuit): CircuitNode[] {
  return circuit.nodes.filter((n) =>
    !["toggle", "const-0", "const-1", "button", "clock", "bulb", "hex-display", "led"].includes(n.type)
  );
}

function wireValue(circuit: Circuit, nodeId: string, portId: string): string {
  const node = circuit.nodes.find((n) => n.id === nodeId);
  if (!node) return "1'b0";
  const def = GATE_DEFS[node.type];
  if (!def) return "1'b0";
  if (node.type === "const-1") return "1'b1";
  if (node.type === "const-0") return "1'b0";
  if (node.type === "toggle" || node.type === "button" || node.type === "clock") {
    return portName(node.id);
  }
  const port = def.outputs.find((p) => p.id === portId);
  if (port) return `${nodeLabel(node)}.${portId}`;
  return `${nodeLabel(node)}.out`;
}

function gateExpression(circuit: Circuit, node: CircuitNode): string {
  const i = (k: string) => {
    const wire = circuit.wires.find((w) => w.toNode === node.id && w.toPort === k);
    if (wire) return wireValue(circuit, wire.fromNode, wire.fromPort);
    return `node_${portName(node.id)}_${k}`;
  };

  switch (node.type) {
    case "buffer": return i("a");
    case "not": return `~${i("a")}`;
    case "and": return `${i("a")} & ${i("b")}`;
    case "nand": return `~(${i("a")} & ${i("b")})`;
    case "or": return `${i("a")} | ${i("b")}`;
    case "nor": return `~(${i("a")} | ${i("b")})`;
    case "xor": return `${i("a")} ^ ${i("b")}`;
    case "xnor": return `~(${i("a")} ^ ${i("b")})`;
    case "half-adder": return `{${i("a")} ^ ${i("b")}, ${i("a")} & ${i("b")}}`;
    case "full-adder": {
      const sum = `${i("a")} ^ ${i("b")} ^ ${i("cin")}`;
      const cout = `(${i("a")} & ${i("b")}) | (${i("a")} & ${i("cin")}) | (${i("b")} & ${i("cin")})`;
      return `{${cout}, ${sum}}`;
    }
    case "half-subtractor": return `{~${i("a")} & ${i("b")}, ${i("a")} ^ ${i("b")}}`;
    case "full-subtractor": {
      const diff = `${i("a")} ^ ${i("b")} ^ ${i("bin")}`;
      const borrow = `(~${i("a")} & ${i("b")}) | (~${i("a")} & ${i("bin")}) | (${i("b")} & ${i("bin")})`;
      return `{${borrow}, ${diff}}`;
    }
    case "mux2": return `${i("sel")} ? ${i("i1")} : ${i("i0")}`;
    case "mux4": {
      const sel = `{${i("s1")}, ${i("s0")}}`;
      return `${sel} == 2'b00 ? ${i("i0")} : ${sel} == 2'b01 ? ${i("i1")} : ${sel} == 2'b10 ? ${i("i2")} : ${i("i3")}`;
    }
    case "decoder": return `{${i("b")}, ${i("a")}}`;
    case "d-latch": return `${i("en")} ? ${i("d")} : q_reg`;
    case "d-flipflop": return `q_reg`;
    default: return `1'b0`;
  }
}

export function generateVerilog(circuit: Circuit): string {
  const ins = inputNodes(circuit);
  const outs = outputNodes(circuit);
  const gates = gateNodes(circuit);
  const lines: string[] = [];

  lines.push("// Auto-generated Verilog from Logic Circuit Simulator");
  lines.push(`// ${circuit.nodes.length} nodes, ${circuit.wires.length} wires`);
  lines.push("");

  // Module declaration
  const portList = [
    ...ins.map((n) => `  input ${portName(n.id)}`),
    ...outs.map((n) => `  output reg ${portName(n.id)}`),
  ];
  lines.push(`module circuit(`);
  lines.push(portList.join(",\n"));
  lines.push(");");
  lines.push("");

  // Wire declarations for internal nodes
  if (gates.length > 0) {
    lines.push("  // Internal signals");
    for (const g of gates) {
      const def = GATE_DEFS[g.type];
      if (!def) continue;
      const multiOutput = ["half-adder", "full-adder", "half-subtractor", "full-subtractor", "decoder"].includes(g.type);
      if (multiOutput) {
        lines.push(`  wire [1:0] ${nodeLabel(g)};`);
      } else if (def.outputs.length > 0) {
        lines.push(`  wire ${nodeLabel(g)};`);
      }
    }
    lines.push("");
  }

  // Gate assignments
  lines.push("  // Logic assignments");
  for (const g of gates) {
    const def = GATE_DEFS[g.type];
    if (!def) continue;

    switch (g.type) {
      case "d-latch":
      case "d-flipflop":
        // Skip sequential for now (handled in always block)
        break;
      case "half-adder":
      case "full-adder":
      case "half-subtractor":
      case "full-subtractor": {
        const expr = gateExpression(circuit, g);
        lines.push(`  assign ${nodeLabel(g)} = ${expr};`);
        break;
      }
      case "decoder": {
        lines.push(`  assign ${nodeLabel(g)}[0] = ~${wireValue(circuit, g.id, "b")} & ~${wireValue(circuit, g.id, "a")};`);
        lines.push(`  assign ${nodeLabel(g)}[1] = ~${wireValue(circuit, g.id, "b")} & ${wireValue(circuit, g.id, "a")};`);
        lines.push(`  assign ${nodeLabel(g)}[2] = ${wireValue(circuit, g.id, "b")} & ~${wireValue(circuit, g.id, "a")};`);
        lines.push(`  assign ${nodeLabel(g)}[3] = ${wireValue(circuit, g.id, "b")} & ${wireValue(circuit, g.id, "a")};`);
        break;
      }
      default: {
        const expr = gateExpression(circuit, g);
        lines.push(`  assign ${nodeLabel(g)} = ${expr};`);
        break;
      }
    }
  }
  lines.push("");

  // Output assignments
  lines.push("  // Output assignments");
  for (const o of outs) {
    const wire = circuit.wires.find((w) => w.toNode === o.id);
    if (wire) {
      const src = circuit.nodes.find((n) => n.id === wire.fromNode);
      if (src) {
        if (["half-adder", "full-adder", "half-subtractor", "full-subtractor", "decoder"].includes(src.type)) {
          const port = GATE_DEFS[src.type]?.outputs.find((p) => p.id === wire.fromPort);
          const idx = port ? GATE_DEFS[src.type].outputs.indexOf(port) : 0;
          lines.push(`  assign ${portName(o.id)} = ${nodeLabel(src)}[${idx}];`);
        } else {
          lines.push(`  assign ${portName(o.id)} = ${nodeLabel(src)}.${wire.fromPort};`);
        }
      }
    }
  }
  lines.push("");

  // Sequential logic
  const seqNodes = gates.filter((n) => ["d-latch", "d-flipflop"].includes(n.type));
  if (seqNodes.length > 0) {
    lines.push("  // Sequential logic");
    lines.push("  reg q_reg;");
    lines.push("");
    for (const sn of seqNodes) {
      if (sn.type === "d-flipflop") {
        lines.push(`  always @(posedge ${wireValue(circuit, sn.id, "clk")}) begin`);
        lines.push(`    q_reg <= ${wireValue(circuit, sn.id, "d")};`);
        lines.push("  end");
      } else if (sn.type === "d-latch") {
        lines.push(`  always @(*) begin`);
        lines.push(`    if (${wireValue(circuit, sn.id, "en")})`);
        lines.push(`      q_reg <= ${wireValue(circuit, sn.id, "d")};`);
        lines.push("  end");
      }
    }
    lines.push("");
  }

  lines.push("endmodule");
  return lines.join("\n");
}

export function generateVHDL(circuit: Circuit): string {
  const ins = inputNodes(circuit);
  const outs = outputNodes(circuit);
  const lines: string[] = [];

  lines.push("-- Auto-generated VHDL from Logic Circuit Simulator");
  lines.push(`-- ${circuit.nodes.length} nodes, ${circuit.wires.length} wires`);
  lines.push("");
  lines.push("library IEEE;");
  lines.push("use IEEE.STD_LOGIC_1164.ALL;");
  lines.push("");

  lines.push("entity circuit is");
  lines.push("  port (");
  const portLines: string[] = [];
  for (const n of ins) {
    portLines.push(`    ${portName(n.id)} : in STD_LOGIC`);
  }
  for (const o of outs) {
    portLines.push(`    ${portName(o.id)} : out STD_LOGIC`);
  }
  lines.push(portLines.join(";\n"));
  lines.push("  );");
  lines.push("end circuit;");
  lines.push("");
  lines.push("architecture Behavioral of circuit is");
  lines.push("begin");
  lines.push("");

  for (const o of outs) {
    const wire = circuit.wires.find((w) => w.toNode === o.id);
    if (wire) {
      const src = circuit.nodes.find((n) => n.id === wire.fromNode);
      if (src) {
        const expr = gateExpression(circuit, src);
        lines.push(`  ${portName(o.id)} <= ${expr};`);
      }
    }
  }

  lines.push("");
  lines.push("end Behavioral;");
  return lines.join("\n");
}
