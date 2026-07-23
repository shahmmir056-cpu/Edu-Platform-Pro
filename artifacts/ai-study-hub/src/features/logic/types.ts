export type PortSide = "left" | "right";

export interface PortDef {
  id: string;
  label: string;
  side: PortSide;
}

export type GateType =
  | "input"
  | "output"
  | "not"
  | "and"
  | "or"
  | "nand"
  | "nor"
  | "xor"
  | "xnor"
  | "buffer"
  | "half-adder"
  | "full-adder"
  | "half-subtractor"
  | "full-subtractor"
  | "mux2"
  | "decoder"
  | "d-latch"
  | "d-flipflop";

export interface GateDef {
  type: GateType;
  label: string;
  category: "Input / Output" | "Logic Gates" | "Combinational" | "Sequential";
  inputs: PortDef[];
  outputs: PortDef[];
  width: number;
  height: number;
}

export interface CircuitNode {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputValues: Record<string, boolean>;
  outputValues: Record<string, boolean>;
}

export interface Wire {
  id: string;
  from: { nodeId: string; portId: string };
  to: { nodeId: string; portId: string };
}

export interface Circuit {
  nodes: CircuitNode[];
  wires: Wire[];
}

export interface GateDefMap {
  [key: string]: GateDef;
}

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
}
