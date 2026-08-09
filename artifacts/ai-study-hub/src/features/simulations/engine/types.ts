import { ReactNode } from "react";

export interface Simulation {
  id: string;
  title: string;
  subtitle: string;
  category: "Biology" | "Chemistry" | "Physics" | "Math";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  icon: string;
  steps: Step[];
  equipment: EquipmentDef[];
  initialLayout: LayoutItem[];
}

export interface Step {
  id: string;
  instruction: string;
  hint?: string;
  drag?: { from: string; to: string };
  trigger: Trigger;
  result?: StepResult;
  autoAdvance?: boolean;
}

export type Trigger =
  | { type: "collision"; items: string[] }
  | { type: "timer"; duration: number }
  | { type: "drag-complete"; from: string; to: string }
  | { type: "click"; target: string }
  | { type: "value-change"; target: string; above?: number; below?: number }
  | { type: "manual" };

export interface StepResult {
  visual?: string;
  data?: Record<string, number | string | boolean>;
  message?: string;
}

export interface EquipmentDef {
  id: string;
  type: string;
  label: string;
  draggable?: boolean;
  droppable?: boolean;
  initialState?: Record<string, unknown>;
}

export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
}

export interface SimState {
  currentStep: number;
  completedSteps: string[];
  equipmentState: Record<string, Record<string, unknown>>;
  results: Record<string, unknown>;
  isComplete: boolean;
  timer?: number;
  dragTarget: string | null;
  hoveredDrop: string | null;
}

export type SimAction =
  | { type: "SET_CURRENT_STEP"; step: number }
  | { type: "COMPLETE_STEP"; stepId: string; data?: Record<string, unknown> }
  | { type: "UPDATE_EQUIPMENT"; equipId: string; state: Record<string, unknown> }
  | { type: "SET_DRAG_TARGET"; equipId: string | null }
  | { type: "SET_HOVERED_DROP"; equipId: string | null }
  | { type: "TICK_TIMER" }
  | { type: "SET_RESULT"; key: string; value: unknown }
  | { type: "RESET"; _initial?: SimState };

export interface EquipmentComponent {
  id: string;
  label: string;
  render: (props: EquipmentRenderProps) => ReactNode;
}

export interface EquipmentRenderProps {
  state: Record<string, unknown>;
  isDragging: boolean;
  isDropTarget: boolean;
  isHovered: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onClick: (id: string) => void;
  width?: number;
  height?: number;
}
