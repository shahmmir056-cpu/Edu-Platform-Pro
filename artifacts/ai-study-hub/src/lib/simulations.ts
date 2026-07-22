export type SimSubject = "Physics" | "Chemistry" | "Biology" | "Math";

export interface Simulation {
  id: string;
  name: string;
  slug: string;
  subject: SimSubject;
  description: string;
}

export const SIM_SUBJECTS: SimSubject[] = ["Physics", "Chemistry", "Biology", "Math"];

export function simEmbedUrl(slug: string): string {
  return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_en.html?hideHeader=true&showResetButton=false&showInfoButton=false`;
}

export const SIMULATIONS: Simulation[] = [
  { id: "build-an-atom", name: "Build an Atom", slug: "build-an-atom", subject: "Chemistry", description: "Explore atomic structure by building atoms from protons, neutrons, and electrons." },
  { id: "ph-scale", name: "pH Scale", slug: "ph-scale", subject: "Chemistry", description: "Test the pH of various liquids and discover how acids and bases work." },
  { id: "states-of-matter", name: "States of Matter", slug: "states-of-matter", subject: "Chemistry", description: "Heat and cool atoms to see how they change between solid, liquid, and gas." },
  { id: "balancing-chemical-equations", name: "Balancing Chemical Equations", slug: "balancing-chemical-equations", subject: "Chemistry", description: "Practice balancing chemical equations by adjusting coefficients." },
  { id: "concentration", name: "Concentration", slug: "concentration", subject: "Chemistry", description: "Explore how concentration changes by adding solutes to solutions." },
  { id: "molecule-shapes", name: "Molecule Shapes", slug: "molecule-shapes", subject: "Chemistry", description: "Explore molecular geometry and VSEPR theory in 3D." },
  { id: "forces-and-motion-basics", name: "Forces and Motion: Basics", slug: "forces-and-motion-basics", subject: "Physics", description: "Apply forces to objects and observe the resulting motion with friction and gravity." },
  { id: "energy-skate-park-basics", name: "Energy Skate Park: Basics", slug: "energy-skate-park-basics", subject: "Physics", description: "Explore kinetic and potential energy as a skater rides a ramp." },
  { id: "projectile-motion", name: "Projectile Motion", slug: "projectile-motion", subject: "Physics", description: "Launch projectiles and study trajectories, air resistance, and parabolic paths." },
  { id: "pendulum-lab", name: "Pendulum Lab", slug: "pendulum-lab", subject: "Physics", description: "Explore pendulum properties — length, mass, gravity, and period of oscillation." },
  { id: "circuit-construction-kit-dc", name: "Circuit Construction Kit: DC", slug: "circuit-construction-kit-dc", subject: "Physics", description: "Build virtual circuits with batteries, resistors, and bulbs to learn Ohm's law." },
  { id: "wave-on-a-string", name: "Wave on a String", slug: "wave-on-a-string", subject: "Physics", description: "Create transverse waves and explore frequency, amplitude, and damping." },
  { id: "wave-interference", name: "Wave Interference", slug: "wave-interference", subject: "Physics", description: "Explore interference patterns with light and water waves." },
  { id: "gravity-and-orbits", name: "Gravity and Orbits", slug: "gravity-and-orbits", subject: "Physics", description: "Explore gravitational attraction between planets, moons, and the Sun." },
  { id: "energy-forms-and-changes", name: "Energy Forms and Changes", slug: "energy-forms-and-changes", subject: "Physics", description: "Track energy as it transforms between kinetic, thermal, and light forms." },
  { id: "masses-and-springs", name: "Masses and Springs", slug: "masses-and-springs", subject: "Physics", description: "Hang masses from springs and study Hooke's law and oscillation." },
  { id: "gas-properties", name: "Gas Properties", slug: "gas-properties", subject: "Chemistry", description: "Explore gas behavior — temperature, pressure, volume, and particle motion." },
  { id: "natural-selection", name: "Natural Selection", slug: "natural-selection", subject: "Biology", description: "See how traits are selected over generations in a rabbit population." },
  { id: "gene-expression-essentials", name: "Gene Expression Essentials", slug: "gene-expression-essentials", subject: "Biology", description: "Explore how genes are expressed through transcription and translation." },
  { id: "graphing-lines", name: "Graphing Lines", slug: "graphing-lines", subject: "Math", description: "Explore slope-intercept form and graph linear equations interactively." },
  { id: "function-builder", name: "Function Builder", slug: "function-builder", subject: "Math", description: "Build and analyze functions with input-output tables and graphs." },
  { id: "area-model-multiplication", name: "Area Model Multiplication", slug: "area-model-multiplication", subject: "Math", description: "Visualize multiplication using area models and arrays." },
  { id: "fraction-matcher", name: "Fraction Matcher", slug: "fraction-matcher", subject: "Math", description: "Match equivalent fractions using visual models and number lines." },
  { id: "fractions-intro", name: "Fractions: Intro", slug: "fractions-intro", subject: "Math", description: "Build fractions with shapes and number lines — halves, thirds, and more." },
  { id: "arithmetic", name: "Arithmetic", slug: "arithmetic", subject: "Math", description: "Practice addition, subtraction, multiplication, and division interactively." },
  { id: "trig-tour", name: "Trig Tour", slug: "trig-tour", subject: "Math", description: "Explore sine, cosine, and tangent with right triangles and the unit circle." },
  { id: "area-builder", name: "Area Builder", slug: "area-builder", subject: "Math", description: "Build shapes and calculate area using unit squares." },
  { id: "color-vision", name: "Color Vision", slug: "color-vision", subject: "Physics", description: "Explore how the eye perceives color through red, green, and blue cones." },
  { id: "coulombs-law", name: "Coulomb's Law", slug: "coulombs-law", subject: "Physics", description: "Explore electrostatic forces between charged particles." },
  { id: "my-solar-system", name: "My Solar System", slug: "my-solar-system", subject: "Physics", description: "Build your own solar system and watch gravitational interactions." },
  { id: "molarity", name: "Molarity", slug: "molarity", subject: "Chemistry", description: "Explore concentration by dissolving solutes in water." },
  { id: "reactants-products-and-leftovers", name: "Reactants, Products, and Leftovers", slug: "reactants-products-and-leftovers", subject: "Chemistry", description: "Explore limiting reagents and chemical reactions with sandwich-making." },
  { id: "natural-selection", name: "Natural Selection", slug: "natural-selection", subject: "Biology", description: "Watch how traits evolve through natural selection in real time." },
  { id: "bacterial-growth", name: "Bacterial Growth", slug: "bacterial-growth", subject: "Biology", description: "Explore exponential bacterial growth and environmental factors." },
  { id: "radians", name: "Radians", slug: "radians", subject: "Math", description: "Explore the relationship between degrees and radians on a circle." },
];
