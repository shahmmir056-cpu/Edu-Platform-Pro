import type { Simulation } from "../engine/types";
import { osmosisEgg } from "./osmosisEgg";
import { gelElectrophoresis } from "./gelElectrophoresis";
import { microscopeUse } from "./microscopeUse";

export const CUSTOM_SIMULATIONS: Simulation[] = [
  osmosisEgg,
  gelElectrophoresis,
  microscopeUse,
];

export function getSimulationById(id: string): Simulation | undefined {
  return CUSTOM_SIMULATIONS.find((s) => s.id === id);
}
