import type { Simulation } from "../engine/types";

export const osmosisEgg: Simulation = {
  id: "osmosis-egg",
  title: "The Egg Lab",
  subtitle: "Membrane Transport & Osmosis",
  category: "Biology",
  description: "Explore osmosis by placing a de-shelled egg in different solutions. Watch water move across the semi-permeable membrane and observe changes in mass and volume.",
  difficulty: "Beginner",
  estimatedMinutes: 8,
  icon: "🥚",
  equipment: [
    { id: "egg", type: "egg", label: "Egg", draggable: true, initialState: { mass: 65, shell: true, color: "#F5E6CA" } },
    { id: "vinegar-beaker", type: "beaker", label: "Vinegar", droppable: true, initialState: { fillLevel: 0.6, liquidColor: "#E3F2FD", temperature: 22 } },
    { id: "syrup-beaker", type: "beaker", label: "Corn Syrup", droppable: true, initialState: { fillLevel: 0.5, liquidColor: "#FFF8E1", temperature: 22 } },
    { id: "water-beaker", type: "beaker", label: "Distilled Water", droppable: true, initialState: { fillLevel: 0.7, liquidColor: "#E3F2FD", temperature: 22 } },
    { id: "scale", type: "scale", label: "Balance Scale", initialState: { mass: 0 } },
    { id: "thermometer", type: "thermometer", label: "Thermometer", initialState: { temperature: 22 } },
  ],
  initialLayout: [
    { id: "egg", x: 60, y: 180, scale: 1 },
    { id: "vinegar-beaker", x: 200, y: 200, scale: 0.9 },
    { id: "syrup-beaker", x: 340, y: 200, scale: 0.9 },
    { id: "water-beaker", x: 480, y: 200, scale: 0.9 },
    { id: "scale", x: 300, y: 360, scale: 0.8 },
    { id: "thermometer", x: 550, y: 180, scale: 0.85 },
  ],
  steps: [
    {
      id: "weigh-raw",
      instruction: "Place the egg on the scale to measure its initial mass.",
      hint: "Drag the egg onto the scale.",
      trigger: { type: "collision", items: ["egg", "scale"] },
      result: { data: { "egg-mass": 65 }, message: "Initial mass: 65g. The shell is mostly calcium carbonate." },
    },
    {
      id: "dissolve-shell",
      instruction: "Place the egg in the vinegar to dissolve the shell.",
      hint: "The acid in vinegar reacts with the calcium carbonate shell.",
      trigger: { type: "collision", items: ["egg", "vinegar-beaker"] },
      result: {
        visual: "shell-dissolves",
        data: { "shell-dissolved": true, "vinegar-color": "slightly-yellow" },
        message: "Bubbles of CO₂ form as the shell dissolves. Wait 24 hours.",
      },
    },
    {
      id: "wait-shell",
      instruction: "Wait for the shell to fully dissolve (simulated 24 hours).",
      trigger: { type: "timer", duration: 5 },
      result: { visual: "egg-bare", message: "The shell is gone! The egg is now held together by its semi-permeable membrane." },
    },
    {
      id: "weigh-bare",
      instruction: "Weigh the egg again after shell dissolution.",
      trigger: { type: "collision", items: ["egg", "scale"] },
      result: { data: { "egg-mass": 72 }, message: "Mass increased to 72g! Water entered through osmosis (hypotonic vinegar)." },
    },
    {
      id: "to-syrup",
      instruction: "Now place the egg in corn syrup (hypertonic solution).",
      hint: "Watch what happens to the egg's size.",
      trigger: { type: "collision", items: ["egg", "syrup-beaker"] },
      result: {
        visual: "egg-shrinks",
        data: { "syrup-direction": "water-leaves" },
        message: "Water leaves the egg by osmosis — the syrup has higher solute concentration.",
      },
    },
    {
      id: "wait-syrup",
      instruction: "Wait for osmosis to occur in the syrup.",
      trigger: { type: "timer", duration: 5 },
      result: { visual: "egg-shrunken", message: "The egg has shriveled! Water moved from low solute (egg) to high solute (syrup)." },
    },
    {
      id: "weigh-syrup",
      instruction: "Weigh the egg after the syrup treatment.",
      trigger: { type: "collision", items: ["egg", "scale"] },
      result: { data: { "egg-mass": 55 }, message: "Mass dropped to 55g. Water left the egg through osmosis." },
    },
    {
      id: "to-water",
      instruction: "Finally, place the egg in distilled water (hypotonic).",
      trigger: { type: "collision", items: ["egg", "water-beaker"] },
      result: {
        visual: "egg-swells",
        data: { "water-direction": "water-enters" },
        message: "Water flows back into the egg! Distilled water has zero solute concentration.",
      },
    },
    {
      id: "wait-water",
      instruction: "Wait for the egg to rehydrate.",
      trigger: { type: "timer", duration: 4 },
      result: { visual: "egg-swollen", message: "The egg has reabsorbed water and is now larger than its original size!" },
    },
    {
      id: "final-weigh",
      instruction: "Take a final measurement.",
      trigger: { type: "collision", items: ["egg", "scale"] },
      result: {
        data: { "egg-mass": 78, isComplete: true },
        message: "Final mass: 78g. The egg gained even more water because it has no shell to limit expansion!",
      },
    },
  ],
};
