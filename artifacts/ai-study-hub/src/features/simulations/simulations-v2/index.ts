import { lazy } from "react";

export interface SimV2 {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  tags: string[];
  component: React.LazyExoticComponent<React.ComponentType>;
}

export const SIMS_V2: SimV2[] = [
  {
    id: "using-light-microscope",
    title: "Using a Light Microscope",
    description: "Master focus techniques, magnification settings, and specimen preparation with a virtual compound microscope.",
    category: "Microscopy",
    categoryColor: "#FF9F4C",
    difficulty: "Beginner",
    duration: "20 min",
    tags: ["Microscopy", "Cell Biology", "Lab Skills"],
    component: lazy(() => import("./Microscope")),
  },
  {
    id: "stomata-exploration",
    title: "Stomata Exploration",
    description: "Investigate how guard cells respond to environmental conditions by controlling stomatal aperture in real time.",
    category: "Plant Biology",
    categoryColor: "#E8852E",
    difficulty: "Beginner",
    duration: "25 min",
    tags: ["Plant Biology", "Physiology", "Environmental Science"],
    component: lazy(() => import("./Stomata")),
  },
  {
    id: "egg-lab",
    title: "The Egg Lab",
    description: "Observe osmosis in action as eggs placed in different solutions change mass and volume over 72 hours.",
    category: "Cell Biology",
    categoryColor: "#D4761A",
    difficulty: "Beginner",
    duration: "30 min",
    tags: ["Osmosis", "Cell Biology", "Diffusion"],
    component: lazy(() => import("./EggLab")),
  },
  {
    id: "plant-dissection",
    title: "Plant Dissection",
    description: "Virtually dissect a flower to identify reproductive and vegetative structures with detailed anatomical labels.",
    category: "Plant Biology",
    categoryColor: "#E8852E",
    difficulty: "Beginner",
    duration: "25 min",
    tags: ["Plant Anatomy", "Dissection", "Reproduction"],
    component: lazy(() => import("./PlantDissection")),
  },
  {
    id: "gel-electrophoresis",
    title: "Gel Electrophoresis",
    description: "Separate DNA fragments by size using an agarose gel and electric current, then analyze band patterns.",
    category: "Genetics",
    categoryColor: "#C46A10",
    difficulty: "Intermediate",
    duration: "35 min",
    tags: ["DNA", "Genetics", "Electrophoresis", "Biotechnology"],
    component: lazy(() => import("./GelElectrophoresis")),
  },
  {
    id: "spectrophotometer",
    title: "Using a Spectrophotometer",
    description: "Measure light absorbance across the visible spectrum to analyze the optical properties of colored solutions.",
    category: "Chemistry",
    categoryColor: "#FF9F4C",
    difficulty: "Intermediate",
    duration: "30 min",
    tags: ["Chemistry", "Spectroscopy", "Lab Skills", "Light"],
    component: lazy(() => import("./Spectrophotometer")),
  },
  {
    id: "osmosis-data-analysis",
    title: "Osmosis Data Analysis",
    description: "Plot experimental data from potato osmosis experiments and determine the solute potential of plant tissue.",
    category: "Cell Biology",
    categoryColor: "#D4761A",
    difficulty: "Intermediate",
    duration: "40 min",
    tags: ["Osmosis", "Data Analysis", "Statistics", "Cell Biology"],
    component: lazy(() => import("./OsmosisDataAnalysis")),
  },
  {
    id: "photosynthesis-cellular-respiration",
    title: "Photosynthesis & Respiration",
    description: "Control light intensity and temperature to explore how cells produce and consume energy molecules.",
    category: "Biochemistry",
    categoryColor: "#E8852E",
    difficulty: "Intermediate",
    duration: "45 min",
    tags: ["Photosynthesis", "Respiration", "Energy", "Biochemistry"],
    component: lazy(() => import("./PhotosynthesisRespiration")),
  },
  {
    id: "hardy-weinberg",
    title: "Hardy-Weinberg Modeling",
    description: "Model population genetics across generations and test how evolutionary forces shift allele frequencies.",
    category: "Genetics",
    categoryColor: "#C46A10",
    difficulty: "Advanced",
    duration: "50 min",
    tags: ["Population Genetics", "Evolution", "Statistics", "Modeling"],
    component: lazy(() => import("./HardyWeinberg")),
  },
  {
    id: "osmosis-saline",
    title: "Osmosis & IV Saline",
    description: "Explore why specific saline concentrations are used in medical IVs by observing effects on red blood cells.",
    category: "Medical Science",
    categoryColor: "#D4761A",
    difficulty: "Intermediate",
    duration: "30 min",
    tags: ["Osmosis", "Medicine", "Cell Biology", "Physiology"],
    component: lazy(() => import("./OsmosisSaline")),
  },
  {
    id: "restriction-fragment-analysis",
    title: "Restriction Fragment Analysis",
    description: "Digest the TAS2R38 taste receptor gene with restriction enzymes and analyze band patterns to identify tasters.",
    category: "Genetics",
    categoryColor: "#C46A10",
    difficulty: "Advanced",
    duration: "45 min",
    tags: ["Genetics", "Restriction Enzymes", "Gel Electrophoresis", "Genomics"],
    component: lazy(() => import("./RestrictionFragment")),
  },
  {
    id: "epidemic-simulation",
    title: "Epidemic Simulation",
    description: "Model pathogen spread through a population using the SIR framework and visualize how interventions change outcomes.",
    category: "Epidemiology",
    categoryColor: "#D4761A",
    difficulty: "Advanced",
    duration: "40 min",
    tags: ["Epidemiology", "SIR Model", "Public Health", "Modeling"],
    component: lazy(() => import("./EpidemicSimulation")),
  },
];

export function getSimV2(id: string): SimV2 | undefined {
  return SIMS_V2.find((s) => s.id === id);
}
