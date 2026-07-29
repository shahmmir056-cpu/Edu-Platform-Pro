export type SimSubject = "Physics" | "Chemistry" | "Biology" | "Math" | "Biotechnology";

export type SimType = "phet" | "custom";

export interface Simulation {
  id: string;
  name: string;
  slug: string;
  subject: SimSubject;
  description: string;
  type: SimType;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes?: number;
  tags?: string[];
}

export const SIM_SUBJECTS: SimSubject[] = ["Physics", "Chemistry", "Biology", "Math", "Biotechnology"];

export function simEmbedUrl(slug: string): string {
  return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_en.html?hideHeader=true&showResetButton=false&showInfoButton=false`;
}

export const SIMULATIONS: Simulation[] = [
  // ====== CHEMISTRY ======
  { id: "build-an-atom", name: "Build an Atom", slug: "build-an-atom", subject: "Chemistry", description: "Explore atomic structure by building atoms from protons, neutrons, and electrons.", type: "phet" },
  { id: "ph-scale", name: "pH Scale", slug: "ph-scale", subject: "Chemistry", description: "Test the pH of various liquids and discover how acids and bases work.", type: "phet" },
  { id: "ph-scale-basics", name: "pH Scale: Basics", slug: "ph-scale-basics", subject: "Chemistry", description: "Learn about the pH scale and test common household substances.", type: "phet" },
  { id: "states-of-matter", name: "States of Matter", slug: "states-of-matter", subject: "Chemistry", description: "Heat and cool atoms to see how they change between solid, liquid, and gas.", type: "phet" },
  { id: "states-of-matter-basics", name: "States of Matter: Basics", slug: "states-of-matter-basics", subject: "Chemistry", description: "Explore heating and cooling of atoms in solid, liquid, and gas phases.", type: "phet" },
  { id: "balancing-chemical-equations", name: "Balancing Chemical Equations", slug: "balancing-chemical-equations", subject: "Chemistry", description: "Practice balancing chemical equations by adjusting coefficients.", type: "phet" },
  { id: "concentration", name: "Concentration", slug: "concentration", subject: "Chemistry", description: "Explore how concentration changes by adding solutes to solutions.", type: "phet" },
  { id: "molecule-shapes", name: "Molecule Shapes", slug: "molecule-shapes", subject: "Chemistry", description: "Explore molecular geometry and VSEPR theory in 3D.", type: "phet" },
  { id: "molecule-shapes-basics", name: "Molecule Shapes: Basics", slug: "molecule-shapes-basics", subject: "Chemistry", description: "Build molecules and discover their 3D shapes.", type: "phet" },
  { id: "gas-properties", name: "Gas Properties", slug: "gas-properties", subject: "Chemistry", description: "Explore gas behavior — temperature, pressure, volume, and particle motion.", type: "phet" },
  { id: "molarity", name: "Molarity", slug: "molarity", subject: "Chemistry", description: "Explore concentration by dissolving solutes in water.", type: "phet" },
  { id: "reactants-products-and-leftovers", name: "Reactants, Products, and Leftovers", slug: "reactants-products-and-leftovers", subject: "Chemistry", description: "Explore limiting reagents and chemical reactions with sandwich-making.", type: "phet" },
  { id: "acid-base-solutions", name: "Acid-Base Solutions", slug: "acid-base-solutions", subject: "Chemistry", description: "Explore pH, indicators, and the strength of acids and bases.", type: "phet" },
  { id: "density", name: "Density", slug: "density", subject: "Chemistry", description: "Explore how density relates to mass and volume of objects and fluids.", type: "phet" },
  { id: "beers-law-lab", name: "Beer's Law Lab", slug: "beers-law-lab", subject: "Chemistry", description: "Explore the relationship between light absorption and concentration.", type: "phet" },
  { id: "molecule-polarity", name: "Molecule Polarity", slug: "molecule-polarity", subject: "Chemistry", description: "Explore bond and molecular polarity with electrostatic potential maps.", type: "phet" },

  // ====== PHYSICS ======
  { id: "forces-and-motion-basics", name: "Forces and Motion: Basics", slug: "forces-and-motion-basics", subject: "Physics", description: "Apply forces to objects and observe the resulting motion with friction and gravity.", type: "phet" },
  { id: "energy-skate-park-basics", name: "Energy Skate Park: Basics", slug: "energy-skate-park-basics", subject: "Physics", description: "Explore kinetic and potential energy as a skater rides a ramp.", type: "phet" },
  { id: "energy-skate-park", name: "Energy Skate Park", slug: "energy-skate-park", subject: "Physics", description: "Build tracks, ramps, and jumps for a skater and explore energy conservation.", type: "phet" },
  { id: "projectile-motion", name: "Projectile Motion", slug: "projectile-motion", subject: "Physics", description: "Launch projectiles and study trajectories, air resistance, and parabolic paths.", type: "phet" },
  { id: "pendulum-lab", name: "Pendulum Lab", slug: "pendulum-lab", subject: "Physics", description: "Explore pendulum properties — length, mass, gravity, and period of oscillation.", type: "phet" },
  { id: "circuit-construction-kit-dc", name: "Circuit Construction Kit: DC", slug: "circuit-construction-kit-dc", subject: "Physics", description: "Build virtual circuits with batteries, resistors, and bulbs to learn Ohm's law.", type: "phet" },
  { id: "circuit-construction-kit-ac", name: "Circuit Construction Kit: AC", slug: "circuit-construction-kit-ac", subject: "Physics", description: "Build AC circuits with batteries, resistors, bulbs, inductors, and capacitors.", type: "phet" },
  { id: "wave-on-a-string", name: "Wave on a String", slug: "wave-on-a-string", subject: "Physics", description: "Create transverse waves and explore frequency, amplitude, and damping.", type: "phet" },
  { id: "wave-interference", name: "Wave Interference", slug: "wave-interference", subject: "Physics", description: "Explore interference patterns with light and water waves.", type: "phet" },
  { id: "gravity-and-orbits", name: "Gravity and Orbits", slug: "gravity-and-orbits", subject: "Physics", description: "Explore gravitational attraction between planets, moons, and the Sun.", type: "phet" },
  { id: "energy-forms-and-changes", name: "Energy Forms and Changes", slug: "energy-forms-and-changes", subject: "Physics", description: "Track energy as it transforms between kinetic, thermal, and light forms.", type: "phet" },
  { id: "masses-and-springs", name: "Masses and Springs", slug: "masses-and-springs", subject: "Physics", description: "Hang masses from springs and study Hooke's law and oscillation.", type: "phet" },
  { id: "masses-and-springs-basics", name: "Masses and Springs: Basics", slug: "masses-and-springs-basics", subject: "Physics", description: "Hang masses on springs and explore Hooke's Law.", type: "phet" },
  { id: "color-vision", name: "Color Vision", slug: "color-vision", subject: "Physics", description: "Explore how the eye perceives color through red, green, and blue cones.", type: "phet" },
  { id: "coulombs-law", name: "Coulomb's Law", slug: "coulombs-law", subject: "Physics", description: "Explore electrostatic forces between charged particles.", type: "phet" },
  { id: "my-solar-system", name: "My Solar System", slug: "my-solar-system", subject: "Physics", description: "Build your own solar system and watch gravitational interactions.", type: "phet" },
  { id: "ohms-law", name: "Ohm's Law", slug: "ohms-law", subject: "Physics", description: "Explore the relationships between voltage, current, and resistance.", type: "phet" },
  { id: "faradays-law", name: "Faraday's Law", slug: "faradays-law", subject: "Physics", description: "Explore how a changing magnetic field induces an electric current.", type: "phet" },
  { id: "blackbody-spectrum", name: "Blackbody Spectrum", slug: "blackbody-spectrum", subject: "Physics", description: "Explore how the color of light emitted depends on an object's temperature.", type: "phet" },
  { id: "geometric-optics", name: "Geometric Optics", slug: "geometric-optics", subject: "Physics", description: "Explore reflection and refraction with mirrors and lenses.", type: "phet" },

  // ====== BIOLOGY ======
  { id: "natural-selection", name: "Natural Selection", slug: "natural-selection", subject: "Biology", description: "See how traits are selected over generations in a rabbit population.", type: "phet" },
  { id: "gene-expression-essentials", name: "Gene Expression Essentials", slug: "gene-expression-essentials", subject: "Biology", description: "Explore how genes are expressed through transcription and translation.", type: "phet" },
  { id: "neuron", name: "Neuron", slug: "neuron", subject: "Biology", description: "Explore how neurons fire action potentials and transmit signals.", type: "phet" },

  // ====== MATH ======
  { id: "graphing-lines", name: "Graphing Lines", slug: "graphing-lines", subject: "Math", description: "Explore slope-intercept form and graph linear equations interactively.", type: "phet" },
  { id: "function-builder", name: "Function Builder", slug: "function-builder", subject: "Math", description: "Build and analyze functions with input-output tables and graphs.", type: "phet" },
  { id: "area-model-multiplication", name: "Area Model Multiplication", slug: "area-model-multiplication", subject: "Math", description: "Visualize multiplication using area models and arrays.", type: "phet" },
  { id: "fraction-matcher", name: "Fraction Matcher", slug: "fraction-matcher", subject: "Math", description: "Match equivalent fractions using visual models and number lines.", type: "phet" },
  { id: "fractions-intro", name: "Fractions: Intro", slug: "fractions-intro", subject: "Math", description: "Build fractions with shapes and number lines — halves, thirds, and more.", type: "phet" },
  { id: "arithmetic", name: "Arithmetic", slug: "arithmetic", subject: "Math", description: "Practice addition, subtraction, multiplication, and division interactively.", type: "phet" },
  { id: "trig-tour", name: "Trig Tour", slug: "trig-tour", subject: "Math", description: "Explore sine, cosine, and tangent with right triangles and the unit circle.", type: "phet" },
  { id: "area-builder", name: "Area Builder", slug: "area-builder", subject: "Math", description: "Build shapes and calculate area using unit squares.", type: "phet" },
  { id: "plinko-probability", name: "Plinko Probability", slug: "plinko-probability", subject: "Math", description: "Drop balls through a peg board and explore probability distributions.", type: "phet" },
];
