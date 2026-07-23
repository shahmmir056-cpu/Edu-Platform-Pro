export type GateType =
  | "const-0" | "const-1" | "toggle" | "button" | "clock"
  | "bulb" | "hex-display" | "led"
  | "buffer" | "not" | "and" | "nand" | "or" | "nor" | "xor" | "xnor"
  | "half-adder" | "full-adder"
  | "half-subtractor" | "full-subtractor"
  | "mux2" | "mux4" | "decoder"
  | "d-latch" | "d-flipflop";

export interface PortDef {
  id: string;
  label: string;
  side: "left" | "right";
}

export interface GateDef {
  type: GateType;
  label: string;
  category: "Input Controls" | "Output Controls" | "Logic Gates" | "Combinational" | "Sequential";
  inputs: PortDef[];
  outputs: PortDef[];
  w: number;
  h: number;
}

export interface CircuitNode {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputs: Record<string, boolean>;
  outputs: Record<string, boolean>;
  state?: boolean;
}

export interface Wire {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

export interface Circuit {
  nodes: CircuitNode[];
  wires: Wire[];
}

export type ThemeId = "dark" | "light" | "forest" | "midnight";

export interface AppTheme {
  id: ThemeId;
  label: string;
  bg: string;
  canvasBg: string;
  gridDot: string;
  sidebar: string;
  toolbar: string;
  panel: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
}

export interface Settings {
  showGrid: boolean;
  theme: ThemeId;
}
