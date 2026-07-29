import { useReducer, useCallback, useEffect, type ReactNode } from "react";
import type { Simulation, SimState, SimAction, Step } from "./types";

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.step };

    case "COMPLETE_STEP":
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.stepId],
        currentStep: state.currentStep + 1,
        results: action.data ? { ...state.results, ...action.data } : state.results,
        timer: 0,
      };

    case "UPDATE_EQUIPMENT":
      return {
        ...state,
        equipmentState: {
          ...state.equipmentState,
          [action.equipId]: { ...state.equipmentState[action.equipId], ...action.state },
        },
      };

    case "SET_DRAG_TARGET":
      return { ...state, dragTarget: action.equipId };

    case "SET_HOVERED_DROP":
      return { ...state, hoveredDrop: action.equipId };

    case "TICK_TIMER":
      return { ...state, timer: (state.timer ?? 0) + 1 };

    case "SET_RESULT":
      return { ...state, results: { ...state.results, [action.key]: action.value } };

    case "RESET":
      return action._initial ?? initialState();

    default:
      return state;
  }
}

function initialState(): SimState {
  return {
    currentStep: 0,
    completedSteps: [],
    equipmentState: {},
    results: {},
    isComplete: false,
    timer: 0,
    dragTarget: null,
    hoveredDrop: null,
  };
}

export interface SimulationEngineProps {
  simulation: Simulation;
  children: (ctx: SimulationContext) => ReactNode;
}

export interface SimulationContext {
  state: SimState;
  dispatch: (action: SimAction) => void;
  currentStep: Step | null;
  isStepCompleted: (stepId: string) => boolean;
  completeStep: (stepId: string, data?: Record<string, unknown>) => void;
  advanceStep: () => void;
  resetSim: () => void;
  updateEquipment: (equipId: string, state: Record<string, unknown>) => void;
  getEquipmentState: (equipId: string) => Record<string, unknown>;
  progress: number;
}

export function SimulationEngine({ simulation, children }: SimulationEngineProps) {
  const makeInitialState = useCallback((): SimState => ({
    currentStep: 0,
    completedSteps: [],
    equipmentState: Object.fromEntries(
      simulation.equipment.map((e) => [e.id, { ...(e.initialState ?? {}) }])
    ),
    results: {},
    isComplete: false,
    timer: 0,
    dragTarget: null,
    hoveredDrop: null,
  }), [simulation]);

  const [state, dispatch] = useReducer(simReducer, null, makeInitialState);

  const currentStep = simulation.steps[state.currentStep] ?? null;

  const isStepCompleted = useCallback(
    (stepId: string) => state.completedSteps.includes(stepId),
    [state.completedSteps]
  );

  const completeStep = useCallback(
    (stepId: string, data?: Record<string, unknown>) => {
      dispatch({ type: "COMPLETE_STEP", stepId, data });
    },
    []
  );

  const advanceStep = useCallback(() => {
    if (currentStep) {
      completeStep(currentStep.id, currentStep.result?.data);
    }
  }, [currentStep, completeStep]);

  const resetSim = useCallback(() => {
    dispatch({ type: "RESET", _initial: makeInitialState() });
  }, [makeInitialState]);

  const updateEquipment = useCallback(
    (equipId: string, equipState: Record<string, unknown>) => {
      dispatch({ type: "UPDATE_EQUIPMENT", equipId, state: equipState });
    },
    []
  );

  const getEquipmentState = useCallback(
    (equipId: string) => state.equipmentState[equipId] ?? {},
    [state.equipmentState]
  );

  const progress = simulation.steps.length > 0
    ? (state.completedSteps.length / simulation.steps.length) * 100
    : 0;

  // Timer tick for timer triggers
  useEffect(() => {
    if (!currentStep || currentStep.trigger.type !== "timer") return;
    if (state.completedSteps.includes(currentStep.id)) return;
    const interval = setInterval(() => {
      dispatch({ type: "TICK_TIMER" });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, state.completedSteps]);

  // Auto-complete timer steps
  useEffect(() => {
    if (!currentStep) return;
    if (state.completedSteps.includes(currentStep.id)) return;
    if (currentStep.trigger.type === "timer" && currentStep.trigger.duration) {
      if ((state.timer ?? 0) >= currentStep.trigger.duration) {
        completeStep(currentStep.id, currentStep.result?.data);
      }
    }
  }, [currentStep, state.timer, completeStep, state.completedSteps]);

  // Auto-complete at end
  useEffect(() => {
    if (state.completedSteps.length === simulation.steps.length && simulation.steps.length > 0) {
      dispatch({ type: "SET_RESULT", key: "isComplete", value: true });
    }
  }, [state.completedSteps, simulation.steps.length]);

  const ctx: SimulationContext = {
    state,
    dispatch,
    currentStep,
    isStepCompleted,
    completeStep,
    advanceStep,
    resetSim,
    updateEquipment,
    getEquipmentState,
    progress,
  };

  return <>{children(ctx)}</>;
}
