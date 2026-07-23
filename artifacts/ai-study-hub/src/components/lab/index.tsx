import { GelElectrophoresisSim } from "./GelElectrophoresis";
import { MicroscopeSim } from "./Microscope";
import { OsmosisSim } from "./Osmosis";
import { CellExplorer } from "./CellExplorer";
import { MitosisSim } from "./Mitosis";
import { EpidemicSim } from "./Epidemic";
import type { LabSimProps } from "./types";

const CUSTOM_SIMS: Record<string, React.ComponentType<LabSimProps>> = {
  "gel-electrophoresis": GelElectrophoresisSim,
  "light-microscope": MicroscopeSim,
  "osmosis-sim": OsmosisSim,
  "cell-structure": CellExplorer,
  "mitosis-sim": MitosisSim,
  "epidemic-sim": EpidemicSim,
};

export function getCustomSim(id: string): React.ComponentType<LabSimProps> | null {
  return CUSTOM_SIMS[id] ?? null;
}

export const CUSTOM_SIM_IDS = Object.keys(CUSTOM_SIMS);
