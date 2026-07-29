import { getDb } from "./db-sqlite";
import { papers, questions, questionFrequency } from "./schema-past-papers";
import { sql } from "drizzle-orm";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface PaperData {
  board: string;
  examType: string;
  year: number;
  subject: string;
  grade: string;
  title: string;
  totalMarks: number;
  duration: string;
  classSection: string;
  questions: { num: number; section: string; type: string; marks: number; text: string; topics: string; difficulty: string }[];
}

type QuestionItem = PaperData["questions"][number];

// ─── FEDERAL BOARD ───
const fedMath10_2018: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is a linear equation in one variable?", topics: "linear equations,algebra", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The value of i (imaginary unit) raised to the power 100 is:", topics: "complex numbers,indices", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "A polynomial of degree 3 is called:", topics: "polynomials,degree", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "If A and B are two sets, then A union B is denoted by:", topics: "sets,union", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The log of a number to its own base is:", topics: "logarithms,properties", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Solve the equation: 3(x - 2) + 4 = 2(x + 5) and verify your answer", topics: "linear equations,verification", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Using the quadratic formula, find the roots of x^2 + 4x + 4 = 0", topics: "quadratic equations,quadratic formula", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Find the partial fraction decomposition of (3x + 5) / (x^2 + 2x - 15)", topics: "partial fractions", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "Define a radian and convert 120 degrees into radians", topics: "trigonometry,radians,angle measurement", difficulty: "easy" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Solve the system of linear equations using Cramer's rule: 2x + y - z = 8, 3x - 2y + z = -4, x + 3y - 2z = 5", topics: "simultaneous equations,Cramer's rule,three variables", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Prove that the sum of the angles of a triangle is 180 degrees. Then find the third angle if two angles are 45 degrees and 75 degrees respectively", topics: "geometry,angle sum property,triangles", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "A rectangular hall is 5 meters longer than it is wide. If the area of the hall is 84 square meters, find its dimensions", topics: "quadratic equations,area,word problems", difficulty: "hard" },
];

const fedMath10_2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The solution set of the inequality 2x - 3 > 5 is:", topics: "linear inequalities", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The product of two matrices AB is defined when:", topics: "matrices,multiplication", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The additive inverse of a matrix A is:", topics: "matrices,additive inverse", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is a true proportion?", topics: "ratios,proportions", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The HCF of x^2 - 1 and x^2 + x - 2 is:", topics: "polynomials,HCF", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Find the remainder when the polynomial 2x^3 - 3x^2 + 4x - 1 is divided by x + 2", topics: "polynomials,remainder theorem", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Prove that the diagonals of a rectangle are equal in length", topics: "geometry,rectangles,diagonals,proofs", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "If sin theta = 5/13 and theta is acute, find the values of cos theta and tan theta", topics: "trigonometry,Pythagorean identity", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "A coin is tossed three times. Find the probability of getting exactly two heads", topics: "probability,binomial", difficulty: "medium" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Solve the equation x^4 - 5x^2 + 4 = 0 and hence solve x^4 - 5x^2 + 4 = 0 by reducing it to a quadratic form", topics: "quartic equations,quadratic form", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "The sum of two numbers is 15 and the sum of their squares is 113. Find the numbers", topics: "quadratic equations,word problems,system of equations", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "Construct a frequency polygon from the following data and estimate the median graphically", topics: "statistics,frequency polygon,median", difficulty: "hard" },
];

const fedMath10_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The set {x : x is a positive even integer less than 10} in roster form is:", topics: "sets,roster method", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The matrix obtained by interchanging rows and columns of a matrix A is called:", topics: "matrices,transpose", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The standard form of a quadratic equation is:", topics: "quadratic equations,standard form", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "If the discriminant of a quadratic equation is zero, then the equation has:", topics: "quadratic equations,discriminant", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The relationship between arc length, radius and angle in radians is given by s =", topics: "trigonometry,arc length", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "A man is 3 times as old as his son. In 12 years, the sum of their ages will be 76. Find their present ages", topics: "linear equations,age problems", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Resolve into partial fractions: (5x - 4) / (x^2 - x - 2)", topics: "partial fractions", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact", topics: "geometry,circles,tangent,proofs", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "Find the 10th term of the arithmetic progression: 3, 7, 11, 15, ...", topics: "arithmetic progression,sequences", difficulty: "easy" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Factorize x^3 + y^3 + z^3 - 3xyz and hence prove that if x + y + z = 0, then x^3 + y^3 + z^3 = 3xyz", topics: "factorization,cube identities,algebraic proofs", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "From the top of a lighthouse 75 meters high, the angles of depression of two ships are 30 degrees and 45 degrees. If the ships are on the same side of the lighthouse, find the distance between them", topics: "trigonometry,angles of depression,applications", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "The mean of a set of 20 observations is 15. If one observation 25 is included, find the new mean. Also find the median if the data is arranged in ascending order", topics: "statistics,mean,median", difficulty: "hard" },
];

const fedPhysics10_2018: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The dimension of torque is:", topics: "dimensions,torque", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The velocity of sound in vacuum is:", topics: "sound,medium", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The efficiency of a Carnot engine depends upon:", topics: "thermodynamics,Carnot engine", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "In elastic collisions, which quantity is conserved?", topics: "collisions,conservation laws", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The time period of a simple pendulum does not depend on:", topics: "oscillations,pendulum", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "State and explain the principle of conservation of momentum", topics: "momentum,conservation", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "A body of mass 5 kg is moving with a velocity of 10 m/s. A force of 20 N acts on it for 2 seconds. Find the final velocity", topics: "Newton's second law,impulse", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain why a sharp knife cuts better than a blunt one", topics: "pressure,applications", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "What is meant by specific heat capacity? Give its SI unit", topics: "thermodynamics,specific heat", difficulty: "easy" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Derive the expression for the kinetic energy of a moving body. A ball of mass 0.5 kg is thrown vertically upward with a speed of 15 m/s. Calculate the maximum height reached", topics: "kinetic energy,projectile motion,free fall", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Explain the working of a hydraulic press with a labeled diagram. State Pascal's law", topics: "fluid mechanics,Pascal's law,hydraulic press", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "Describe the construction and working of an AC generator with a neat diagram. Derive the expression for instantaneous EMF", topics: "electromagnetism,AC generator,Faraday's law", difficulty: "hard" },
];

const fedPhysics10_2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The slope of a velocity-time graph represents:", topics: "kinematics,graphical analysis", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The unit of impulse is:", topics: "impulse,units", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The phenomenon of diffraction is associated with:", topics: "wave optics,diffraction", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "In the photoelectric effect, increasing the intensity of light increases:", topics: "photoelectric effect,intensity", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The magnetic field inside a solenoid is:", topics: "electromagnetism,solenoid", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Define the coefficient of restitution. What does it signify?", topics: "collisions,elasticity", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "A car starts from rest and accelerates uniformly at 2 m/s^2 for 10 seconds. Find the distance covered", topics: "kinematics,uniform acceleration", difficulty: "easy" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain the formation of stationary waves on a stretched string", topics: "waves,stationary waves,strings", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "State Kirchhoff's junction rule and explain its physical basis", topics: "electricity,Kirchhoff's laws", difficulty: "medium" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "A stone is projected at an angle of 30 degrees with the horizontal with a speed of 30 m/s. Taking g = 10 m/s^2, calculate the range, maximum height and time of flight", topics: "projectile motion,range,maximum height", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Explain the working of a nuclear reactor with a labeled diagram. What is the role of moderators and control rods?", topics: "nuclear physics,reactor,fission", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "Derive the expression for the torque on a current carrying coil placed in a uniform magnetic field. Hence explain the working of a galvanometer", topics: "electromagnetism,torque,galvanometer", difficulty: "hard" },
];

const fedPhysics10_2025: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is a vector quantity?", topics: "vectors,scalar and vector", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The SI unit of pressure is:", topics: "units,pressure", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "According to Archimedes' principle, the buoyant force on a body equals:", topics: "fluid mechanics,Archimedes' principle", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "The frequency of an AC mains supply in Pakistan is:", topics: "alternating current,frequency", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The refractive index of diamond is approximately:", topics: "optics,refraction,refractive index", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Distinguish between distance and displacement with examples", topics: "kinematics,displacement,distance", difficulty: "easy" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Explain why a satellite orbits the Earth in a circular path", topics: "gravitation,circular motion,satellite", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is the principle of a fiber optic cable? Explain total internal reflection", topics: "optics,fiber optics,total internal reflection", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "Define electric flux and state Gauss's law in electrostatics", topics: "electrostatics,Gauss's law,electric flux", difficulty: "medium" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "A block of mass 4 kg is placed on a rough horizontal surface. A horizontal force of 20 N is applied. If the coefficient of kinetic friction is 0.3, calculate the acceleration of the block. Take g = 10 m/s^2", topics: "friction,Newton's laws,applications", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Explain the phenomenon of interference of light. Describe Young's double slit experiment and derive the expression for fringe width", topics: "wave optics,interference,Young's experiment", difficulty: "hard" },
  { num: 12, section: "Section C", type: "Long", marks: 5, text: "Derive the relation between the half-life and decay constant of a radioactive substance. A radioactive sample has a half-life of 5 years. What fraction of the original sample remains after 20 years?", topics: "nuclear physics,radioactivity,half-life", difficulty: "hard" },
];

const fedChemistry10_2019: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The number of neutrons in a hydrogen atom is:", topics: "atomic structure,hydrogen", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is an endothermic reaction?", topics: "chemical energetics,endothermic", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The general formula of alkenes is:", topics: "organic chemistry,alkenes", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Rusting of iron is an example of:", topics: "corrosion,oxidation", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The substance that oxidizes itself and reduces another is called:", topics: "redox reactions,oxidizing agent", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Define the term mole. How many molecules are present in 18 grams of water?", topics: "stoichiometry,mole concept", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Distinguish between strong acids and weak acids with examples", topics: "acids and bases,strength", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is the Haber process? Write the conditions and equation for the industrial preparation of ammonia", topics: "industrial chemistry,Haber process", difficulty: "medium" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "Explain the bonding in methane using the concept of hybridization", topics: "chemical bonding,hybridization,methane", difficulty: "medium" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain the Galvanic cell with a diagram. Write the half-cell reactions and calculate the EMF using the electrochemical series", topics: "electrochemistry,Galvanic cell,electrochemical series", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Describe the chemistry involved in the Solvay process for the manufacture of sodium carbonate. Write balanced equations", topics: "industrial chemistry,Solvay process", difficulty: "hard" },
];

const fedChemistry10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The electronic configuration of sodium (Na) is:", topics: "atomic structure,electronic configuration", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The chemical formula of baking soda is:", topics: "chemical formulas,sodium bicarbonate", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The process of conversion of a solid directly into gas is called:", topics: "states of matter,sublimation", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "An atom with 8 protons and 8 neutrons has a mass number of:", topics: "atomic structure,mass number", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is used as a dry cell electrode?", topics: "electrochemistry,dry cell", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Balance the following equation and identify the type of reaction: Fe + CuSO4 -> FeSO4 + Cu", topics: "chemical equations,balancing,reaction types", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "What are noble gases? Why are they chemically inert?", topics: "periodic table,noble gases,inertness", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain the difference between renewable and non-renewable resources with examples", topics: "environmental chemistry,resources", difficulty: "easy" },
  { num: 9, section: "Section B", type: "Short", marks: 2, text: "Describe the structure of an ionic compound using sodium chloride as an example", topics: "chemical bonding,ionic compounds,NaCl", difficulty: "medium" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain Le Chatelier's principle. How does change in temperature, pressure and concentration affect the equilibrium: N2(g) + 3H2(g) <=> 2NH3(g)?", topics: "chemical equilibrium,Le Chatelier's principle", difficulty: "hard" },
  { num: 11, section: "Section C", type: "Long", marks: 5, text: "Describe the preparation and properties of ethanoic acid (acetic acid). How is vinegar related to ethanoic acid?", topics: "organic chemistry,carboxylic acids,ethanoic acid", difficulty: "hard" },
];

const fedUrdu10_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"دیوانِ گَلیب\" کا مصنف کون ہے؟", topics: "ادب,شعر,گلیب", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو زبان کی بنیاد کس زبان پر ہے؟", topics: "زبان,تاریخ", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "\"کس کی زبان ہے یہ کہانی\" کس شاعر کی نظم ہے؟", topics: "شعر,نظم", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "nazm \"mard-e-momin\" ke barey mein mukhtasar note likhein", topics: "شعر,نظم,مکمل مسلم", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "ghazal aur nazm mein farq bayan karein", topics: "ادب,غزل,نظم", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "mazmoon likhein: \"قیام پاکستان کا مفہوم اور اہمیت\"", topics: "تحریر,مضمون,پاکستان", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Kahani \"Azm-e-Ali Mohammad\" ka khulasa likhein aur us ka sabaq beyan karein", topics: "ادب,کہانی, Serialization", difficulty: "hard" },
];

const fedUrdu10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"لاہور\" کس شاعر کی مشہور نظم ہے؟", topics: "شعر,نظم,لاہور", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو ادب کے \"عہدِ جدید\" کا آغاز کب ہوا؟", topics: "تاریخ ادب,عہد جدید", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "\"باغِ وطن\" کا خاموشی مصنف کون ہے؟", topics: "ادب,شاعری", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "\"ایک شام\" نظم کا تجزیہ کریں", topics: "شعر,نظم,تجزیہ", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "مثنوی اور نظم میں فرق لکھیں", topics: "ادب,مثنوی,نظم", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون لکھیں: \"سائنس کا تعلیم پر اثر\"", topics: "تحریر,مضمون,سائنس", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "دی گئی آیت کی تشریح اور ترجمہ کریں", topics: "قرآن,ترجمہ,تفسیر", difficulty: "hard" },
];

const fedPakStudies10_2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Pakistan ka qayam kis san mein hua?", topics: "تاریخ پاکستان,قیام", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "_resolution ko approve kis session mein kiya gaya?", topics: "تاریخ,قرارداد,لاہور", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Pakistan ka pehla governor-general kaun tha?", topics: "حکومت,گورنر جنرل", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "1857 ki jang-e-azadi ke asbab bayan karein", topics: "تاریخ,جنگ آزادی", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "two nation theory ka khulasa likhein", topics: "نظریہ دو قومیت,تاریخ", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "mazmoon: \"پاکستان میں مشروط حکومت کی اہمیت\"", topics: "حکومت,مشروطہ, Democracy", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Asia map par Pakistan ki hill ranges aur rivers ki nishandahi karein", topics: "جغرافیہ,پہاڈ,دریا", difficulty: "hard" },
];

const fedIslamiat10_2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "How many times is the name of Allah mentioned in the Holy Quran?", topics: "قرآن,نام", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The Holy Prophet (PBUH) migrated to Madina in which year?", topics: "تاریخ,ہجرت", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which Surah is called the heart of the Holy Quran?", topics: "قرآن,سورۃ یسین", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Write the names of the four Rightly Guided Caliphs in order", topics: "خلافت,خلفائے راشدین", difficulty: "easy" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Explain the significance of Namaz in a Muslim's daily life", topics: "نماز, عبادت", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Describe the main teachings of the Holy Quran regarding social justice", topics: "قرآن,انصاف,تعلیمات", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Write a note on the Battle of Badr and its significance in Islamic history", topics: "تاریخ,بدر, جنگ", difficulty: "hard" },
];

const fedBiology10_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The site of protein synthesis in a cell is:", topics: "cell biology,ribosomes", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Which blood vessels carry blood away from the heart?", topics: "circulatory system,arteries", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The term genotype refers to:", topics: "genetics,genotype", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Osmosis is the movement of water molecules from:", topics: "cell biology,osmosis", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "Which vitamin is produced in the human body on exposure to sunlight?", topics: "nutrition,vitamins", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the difference between aerobic and anaerobic respiration with word equations", topics: "respiration,aerobic,anaerobic", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Describe the structure of a plant cell with a labeled diagram", topics: "cell biology,plant cell", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is binomial nomenclature? Give two examples", topics: "taxonomy,binomial nomenclature", difficulty: "easy" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Describe the human digestive system from mouth to anus. What are the functions of the liver and pancreas?", topics: "human anatomy,digestive system", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain Mendel's laws of inheritance with the help of monohybrid and dihybrid crosses", topics: "genetics,Mendel's laws,monohybrid cross", difficulty: "hard" },
];

const fedBiology10_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The process of conversion of light energy into chemical energy in plants is called:", topics: "photosynthesis,energy conversion", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Antibodies are produced by:", topics: "immunology,B cells", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The chromosome number in human gametes is:", topics: "genetics,chromosomes,meiosis", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Which organelle is known as the kitchen of the cell?", topics: "cell biology,plastids", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The disease caused by the deficiency of Vitamin C is:", topics: "nutrition,deficiency diseases", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the process of translocation in plants", topics: "plant physiology,translocation", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Describe the structure of the human ear and explain how sound waves are converted into nerve impulses", topics: "human anatomy,ear,hearing", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is ecological succession? Differentiate between primary and secondary succession", topics: "ecology,succession", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Explain the structure of DNA using Watson and Crick's model. How does DNA replicate?", topics: "genetics,DNA structure,replication", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Describe the process of blood clotting in detail. What happens when this process is impaired?", topics: "human physiology,blood clotting", difficulty: "hard" },
];

const fedEnglish10_2019: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Choose the word that is closest in meaning to 'benevolent':", topics: "vocabulary,synonyms", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Identify the correct form: She ___ (go/goes) to school every day", topics: "grammar,subject-verb agreement", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following sentences is in the interrogative mood?", topics: "grammar,sentence types", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Rewrite the following sentences using the correct form of the verb: If I (be) rich, I (travel) around the world", topics: "grammar,conditional sentences", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Write a paragraph of 100 words on 'The Importance of Reading'", topics: "paragraph writing,reading", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Write a letter to your father requesting him to send you extra money for books", topics: "letter writing,formal", difficulty: "medium" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Read the passage and answer the questions: [Passage about pollution in Pakistani cities]", topics: "reading comprehension,passage", difficulty: "hard" },
];

const fedEnglish10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Choose the correct antonym of 'ephemeral':", topics: "vocabulary,antonyms", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The past participle of 'write' is:", topics: "grammar,tenses,participles", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which punctuation mark is used at the end of an indirect question?", topics: "grammar,punctuation", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Use the following idioms in sentences: (a) a piece of cake (b) break the ice", topics: "idioms,usage", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Change the voice: The teacher has already graded the papers", topics: "grammar,passive voice", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Write a dialogue between two friends discussing the advantages and disadvantages of social media", topics: "dialogue writing,social media", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Write an essay on 'The Role of Youth in Building a Nation'", topics: "essay writing,youth,nation building", difficulty: "hard" },
];

// ─── PUNJAB BOARD ───
const punjabMath10_2018: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "If x^2 - 5x + 6 = 0, then the values of x are:", topics: "quadratic equations,factoring", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The common ratio of the geometric progression 2, 6, 18, ... is:", topics: "geometric progression,common ratio", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The area of a triangle with base b and height h is given by:", topics: "area,triangles", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Prove that the quadrilateral formed by joining the midpoints of the sides of a rectangle is a rhombus", topics: "geometry,rectangle,midpoint,rhombus", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Find the sum of the first 20 terms of the AP: 5, 8, 11, 14, ...", topics: "arithmetic progression,sum", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Two poles of equal height stand on either side of a road 100 meters wide. From a point on the road, the angles of elevation of the tops of the poles are 30 degrees and 60 degrees. Find the height of the poles", topics: "trigonometry,angles of elevation,applications", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "A shopkeeper bought an article for Rs. 800 and marked it at 50% above the cost price. He then offered a discount of 20%. Find the selling price and his profit percentage", topics: "profit and loss,percentages", difficulty: "hard" },
];

const punjabMath10_2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The solution of the system x + y = 5 and x - y = 1 is:", topics: "simultaneous equations", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "If two triangles are similar, then the ratio of their areas is equal to:", topics: "geometry,area,similarity", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The equation of a line parallel to the x-axis is:", topics: "coordinate geometry,parallel lines", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Find the LCM and HCF of x^2 - 4 and x^2 + 2x - 8", topics: "polynomials,LCM,HCF", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "A chord of a circle of radius 10 cm subtends an angle of 60 degrees at the center. Find the length of the chord", topics: "circles,chords,angle at center", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A boat goes 20 km upstream in 5 hours and 20 km downstream in 2 hours. Find the speed of the boat in still water and the speed of the stream", topics: "word problems,upstream downstream,linear equations", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Prove that the tangent segments drawn from an external point to a circle are equal in length", topics: "geometry,circles,tangent,proofs", difficulty: "hard" },
];

const punjabMath12_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The derivative of ln(x) with respect to x is:", topics: "calculus,derivatives,logarithmic", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The value of the integral from 0 to 1 of x dx is:", topics: "calculus,definite integral", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "If f(x) = x^3, then f'(2) equals:", topics: "calculus,derivative at a point", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Find the derivative of sin(x) * cos(x) using the product rule", topics: "calculus,product rule", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Evaluate the integral of (2x + 3) / (x^2 + 3x + 2) dx", topics: "calculus,partial fractions,integration", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Find the local maxima and minima of f(x) = x^3 - 6x^2 + 9x + 1", topics: "calculus,maxima minima,optimization", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Solve the differential equation dy/dx = y/x with the initial condition y(1) = 2", topics: "differential equations,separation of variables", difficulty: "hard" },
];

const punjabMath12_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The gradient of the curve y = x^2 at the point (3, 9) is:", topics: "calculus,gradient,derivative", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The order of the differential equation d^2y/dx^2 + 3dy/dx + 2y = 0 is:", topics: "differential equations,order", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The integral of e^x sin(x) dx is found using:", topics: "calculus,integration by parts", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Use the chain rule to find dy/dx if y = (3x + 1)^5", topics: "calculus,chain rule", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Find the area under the curve y = x^2 from x = 0 to x = 3", topics: "calculus,area under curve", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Using integration by parts, evaluate the integral of x^2 e^x dx", topics: "calculus,integration by parts,exponential", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Solve the second order differential equation y'' - 4y' + 4y = 0 and find the particular solution when y(0) = 1 and y'(0) = 3", topics: "differential equations,second order,homogeneous", difficulty: "hard" },
];

const punjabPhysics11_2019: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The range of a projectile is maximum when the angle of projection is:", topics: "projectile motion,range", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The moment of inertia of a uniform rod about an axis through its center is:", topics: "rotational mechanics,moment of inertia", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The SI unit of angular momentum is:", topics: "rotational mechanics,units", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Derive the relation between linear velocity and angular velocity", topics: "circular motion,linear and angular velocity", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "State and explain the parallelogram law of vector addition", topics: "vectors,parallelogram law", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A body of mass m is released from the top of an inclined plane of angle theta and coefficient of friction mu. Derive the expression for the acceleration of the body", topics: "mechanics,inclined plane,friction", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Explain the concept of simple harmonic motion. Derive the expression for the time period of a spring-mass system", topics: "oscillations,SHM,spring", difficulty: "hard" },
];

const punjabPhysics11_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The work done by a force acting perpendicular to the direction of displacement is:", topics: "work,force,angle", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The escape velocity from Earth's surface is approximately:", topics: "gravitation,escape velocity", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The dimension of angular momentum is:", topics: "dimensions,angular momentum", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Explain the concept of work-energy theorem for a variable force", topics: "work-energy theorem", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Derive the expression for centripetal acceleration of a body moving in a horizontal circle", topics: "circular motion,centripetal acceleration", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A ball is thrown at an angle of 45 degrees with the horizontal from the top of a building 20 m high. If the initial speed is 20 m/s, find the range, time of flight and the velocity with which it hits the ground", topics: "projectile motion,building,range,velocity", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "State and prove the law of conservation of mechanical energy for a freely falling body", topics: "energy,conservation,free fall,proof", difficulty: "hard" },
];

const punjabUrdu10_2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"حبِ وطن\" نظم کے شاعر کا نام لکھیں", topics: "شعر,نظم,حب وطن", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو میں \"غزل\" کیسے لکھتے ہیں؟", topics: "ادب,غزل", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "\"مقامی ادب\" کسے کہتے ہیں؟", topics: "ادب,مقامی ادب", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "\"ایک کہانی ایک سبق\" نظم کا خلاصہ لکھیں", topics: "شعر,نظم,خلاصہ", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "پنجابی علاقے کی روایتی شاعری کے بارے میں لکھیں", topics: "ادب,شاعری,پنجاب", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون لکھیں: \"تعلیم کی اہمیت\" (200 الفاظ)", topics: "تحریر,مضمون,تعلیم", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "دی گئی حديث کی شرح اور اردو ترجمہ لکھیں", topics: " حدیث,ترجمہ,شرح", difficulty: "hard" },
];

const punjabUrdu10_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"اپنی مدد خود کرو\" کس شاعر کی نظم ہے؟", topics: "شعر,نظم", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو نثر کے \"جدید دور\" کا آغاز کس سال سے مانا جاتا ہے؟", topics: "تاریخ ادب,نثر", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "کس ناول کا قائم مقام \"اندھیرا گھر\" ہے؟", topics: "ادب,ناول,اندھیرا گھر", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "\"خوشبو\" نظم کا تجزیہ کریں اور اس کا مرکزی خیال بیان کریں", topics: "شعر,نظم,تجزیہ", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "خط بنائیں: اپنے دوست کو شادی میں مہمانی کی دعوت دیں", topics: "تحریر,خط,شادی", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون لکھیں: \"ماہرینِ طب کی ذمہ داری\" (200 الفاظ)", topics: "تحریر,مضمون,طب", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, "text": "کہانی کا خلاصہ: \"وہ چراغ جلتا رہا\" اور اس کا سبق بیان کریں", topics: "ادب,کہانی,خلاصہ", difficulty: "hard" },
];

const punjabIslamiat10_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "How many pillars of Islam are there?", topics: "اسلام,ارکان", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The first revelation came to the Holy Prophet (PBUH) in which cave?", topics: "تاریخ,وحی,غار حرا", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "How many Surahs are there in the Holy Quran?", topics: "قرآن,سورتیں", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Explain the meaning and significance of Kalma-e-Tayyaba", topics: "عقیدہ,کلمہ طیبہ", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Write the names of the books revealed to different Prophets", topics: "ادیان,کتب", difficulty: "easy" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Describe the main teachings of Islam regarding the rights of parents", topics: "اسلام,والدین,حقوق", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Write a note on the Treaty of Hudaybiyyah and its importance", topics: "تاریخ,صلح حدیبیہ", difficulty: "hard" },
];

// ─── SINDH BOARD ───
const sindhMath10_2019: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The sum of the first n terms of an AP is given by:", topics: "arithmetic progression,formula", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The distance between the points (1, 2) and (4, 6) is:", topics: "coordinate geometry,distance formula", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The value of sin^2(theta) + cos^2(theta) is:", topics: "trigonometry,identity", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Prove that the sum of the angles of a quadrilateral is 360 degrees", topics: "geometry,quadrilateral,angle sum", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Find the equation of the line passing through (1, -2) with slope 3", topics: "coordinate geometry,slope-intercept", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A ladder 10 meters long leans against a vertical wall. If the foot of the ladder is 6 meters from the wall, find the height at which the ladder touches the wall", topics: "Pythagoras theorem,applications", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Solve the equation 2x^2 - 3x - 5 = 0 using the completing the square method", topics: "quadratic equations,completing square", difficulty: "hard" },
];

const sindhMath10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The solution set of |x| = 5 is:", topics: "absolute value,equations", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The median of the data set 3, 7, 9, 12, 15 is:", topics: "statistics,median", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The slope of a line perpendicular to y = 2x + 3 is:", topics: "coordinate geometry,perpendicular slopes", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Find the GCD of 56 and 98 using the prime factorization method", topics: "number theory,GCD,prime factorization", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "A person walks 3 km east and then 4 km north. Find the resultant displacement", topics: "vectors,displacement,Pythagoras", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "The sum of three consecutive even numbers is 78. Find the numbers", topics: "linear equations,word problems", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "A rectangular garden is 20 meters longer than it is wide. If its area is 300 square meters, find its dimensions", topics: "quadratic equations,area,word problems", difficulty: "hard" },
];

const sindhEnglish9_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Choose the correct synonym of 'enormous':", topics: "vocabulary,synonyms", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The plural of 'child' is:", topics: "grammar,nouns,plurals", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Identify the adjective: 'The quick brown fox jumps over the lazy dog'", topics: "grammar,adjectives", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Write a paragraph about your favorite hobby", topics: "paragraph writing,hobby", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Change the following to passive voice: 'The boy is eating an apple'", topics: "grammar,passive voice", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Write a story with the beginning: 'It was a dark and stormy night when...'", topics: "story writing,creative writing", difficulty: "hard" },
];

const sindhEnglish9_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Choose the correct form: Neither the teacher nor the students ___ present", topics: "grammar,subject-verb agreement", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The opposite of 'ancient' is:", topics: "vocabulary,antonyms", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which sentence uses a comma correctly?", topics: "grammar,punctuation", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Use the following words in meaningful sentences: (a) beautiful (b) intelligent", topics: "vocabulary,sentences", difficulty: "easy" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Rewrite the sentences with correct punctuation marks", topics: "grammar,punctuation", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Write a letter to your principal requesting a change in the school timing", topics: "letter writing,formal", difficulty: "medium" },
];

const sindhUrdu10_2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"آج کا پاکستان\" کس شاعر کا نظم ہے؟", topics: "شعر,نظم", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو کا پہلا نثری مضمون کون سا ہے؟", topics: "ادب,نثر", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "\"شاعرِ مشرق\" کسے کہا جاتا ہے؟", topics: "ادب,شاعری", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "\"گلشنِ آزادی\" نظم کا خلاصہ لکھیں", topics: "شعر,نظم,خلاصہ", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "اردو ادب کی دو اہم صنفیں بیان کریں", topics: "ادب,صنفیں", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون لکھیں: \"حکومت کی اہمیت\" (200 الفاظ)", topics: "تحریر,مضمون,حکومت", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "کسی ایک نظم کا تجزیہ کریں اور اس کا مرکزی خیال بیان کریں", topics: "شعر,تجزیہ,نظم", difficulty: "hard" },
];

const sindhPakStudies10_2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Quaid-e-Azam ne Muslim League ki sadarat kab qabool ki?", topics: "تاریخ,قائد اعظم", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Pakistan ka qayam kis tarikhe ko hua?", topics: "تاریخ,قیام پاکستان", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Sindh ka sabse bada shehar kaun hai?", topics: "جغرافیہ,شہر", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Partition plan (1947) ka khulasa likhein", topics: "تاریخ,تقسیم", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Sindh ki cultural heritage ke bare mein likhein", topics: "ثقافت,سندھ", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون: \"پاکستان کی قیادت کا کردار\"", topics: "تحریر,قیادت,پاکستان", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Map par Sindh ki important rivers aur dams ki nishandahi karein", topics: "جغرافیہ,دریا,بند", difficulty: "hard" },
];

// ─── KPK BOARD ───
const kpkMath10_2019: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The product of two matrices is defined when:", topics: "matrices,conditions", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The equation of a line passing through the origin is:", topics: "coordinate geometry,origin", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The area of a sector of a circle with radius r and angle theta (in degrees) is:", topics: "area,sector,circle", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Solve the equation: x/(x-1) + (x+2)/(x+1) = 2", topics: "equations,rational", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Prove that the sum of interior angles on the same side of a transversal is 180 degrees", topics: "geometry,parallel lines,transversal", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A man walks 8 km north, then 6 km east, and then 2 km north. Find his displacement from the starting point", topics: "vectors,displacement,Pythagoras", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "If the mean of the observations x, x+2, x+4, x+6, x+8 is 12, find the value of x", topics: "statistics,mean,algebra", difficulty: "hard" },
];

const kpkMath10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is a proportion?", topics: "ratios,proportions", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The identity element for addition is:", topics: "number systems,identity", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The cube of (a + b) is:", topics: "algebra,binomial expansion", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Find the value of k if x - 2 is a factor of x^3 - kx^2 + 4x - 8", topics: "polynomials,factor theorem", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Solve the inequality 3x - 7 > 2x + 5 and represent the solution on a number line", topics: "linear inequalities,number line", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A farmer has 100 meters of fencing. He wants to enclose a rectangular garden with the maximum possible area. What dimensions should he choose?", topics: "optimization,area,quadratic", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Construct a frequency table from the given grouped data and find the mean using the direct method", topics: "statistics,frequency table,mean", difficulty: "hard" },
];

const kpkPhysics10_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The work done in moving a charge in an electric field is measured in:", topics: "electricity,work,units", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The power dissipated in a resistor is given by:", topics: "electricity,power,Ohm's law", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "In a series RLC circuit, at resonance the impedance is:", topics: "AC circuits,resonance,impedance", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Explain the difference between conductors, insulators and semiconductors with examples", topics: "materials,conductors,insulators", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "State the right-hand rule for determining the direction of magnetic force on a current carrying conductor", topics: "electromagnetism,Fleming's right hand rule", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A 100 watt bulb and a 200 watt bulb are connected in parallel to a 220V supply. Which bulb will glow brighter? Justify your answer", topics: "electricity,power,parallel circuit", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Explain the working of a cathode ray tube (CRT) with a neat labeled diagram", topics: "electronics,CRT,cathode rays", difficulty: "hard" },
];

const kpkPhysics10_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The acceleration due to gravity on the Moon is approximately:", topics: "gravitation,Moon,gravity", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The time period of a pendulum depends on:", topics: "oscillations,pendulum,time period", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "When a ray of light enters glass from air, its speed:", topics: "optics,refraction,speed of light", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Explain why the road surface becomes slippery during rain", topics: "friction,water,coefficient", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Derive the expression for the effective capacitance of two capacitors connected in series", topics: "electrostatics,capacitors,series", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "A car of mass 1000 kg is moving at 72 km/h. The brakes are applied and it comes to rest in 4 seconds. Calculate the retarding force and the distance covered during braking", topics: "kinematics,Newton's laws,braking", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Explain the formation of images by a concave mirror for different positions of the object. Draw ray diagrams", topics: "optics,concave mirror,ray diagrams", difficulty: "hard" },
];

const kpkUrdu10_2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "\"ستاروں سے آگے\" کس شاعر کا نظم ہے؟", topics: "شعر,نظم", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "اردو میں \"دہائی\" کیسے لکھتے ہیں؟", topics: "گیان,اداد", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "کس شاعر کو \"شاعرِ مشرق\" کا لقب ملا؟", topics: "ادب,شاعری", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "\"ہم پاکستاںی ہیں\" نظم کا خلاصہ لکھیں", topics: "شعر,نظم,پاکستان", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "اردو کی بولیوں کے بارے میں مختصر نوٹ لکھیں", topics: "ادب,بولیاں", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون لکھیں: \"خواتین کی تعلیم کی اہمیت\"", topics: "تحریر,مضمون,خواتین", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "دی گئی نظم کا تجزیہ اور شرح کریں", topics: "شعر,تجزیہ,شرح", difficulty: "hard" },
];

// ─── BALOCHISTAN BOARD ───
const balochMath10_2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The inverse of the matrix A exists only when:", topics: "matrices,inverse", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The discriminant of x^2 - 4x + 4 = 0 is:", topics: "quadratic equations,discriminant", difficulty: "medium" },
  { num: 3, section: "Section B", type: "Short", marks: 2, text: "Find the values of x for which x^2 - 9 = 0", topics: "quadratic equations,roots", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Prove that the base angles of an isosceles triangle are equal", topics: "geometry,isosceles triangle,proofs", difficulty: "medium" },
  { num: 5, section: "Section C", type: "Long", marks: 5, text: "A man invests Rs. 12,000 at 10% compound interest per annum. Calculate the total amount after 2 years", topics: "compound interest,financial math", difficulty: "hard" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Solve the simultaneous equations: 3x + 4y = 10 and 5x - 2y = 6", topics: "simultaneous equations,elimination", difficulty: "hard" },
];

const balochMath10_2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "If the ratio a:b is 3:5, then (a+2):(b+2) equals:", topics: "ratios,proportions", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The median of 1, 3, 5, 7, 9 is:", topics: "statistics,median", difficulty: "easy" },
  { num: 3, section: "Section B", type: "Short", marks: 2, text: "Find the LCM of 24 and 36", topics: "number theory,LCM", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "A train travels 240 km in 3 hours. Find its average speed in m/s", topics: "speed,distance,time,unit conversion", difficulty: "medium" },
  { num: 5, section: "Section C", type: "Long", marks: 5, text: "The length of a rectangle is twice its width. If the area is 72 cm^2, find the dimensions", topics: "area,rectangle,quadratic equations", difficulty: "hard" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Draw a bar graph for the given data and comment on the trend", topics: "statistics,bar graph,data analysis", difficulty: "hard" },
];

const balochIslamiat10_2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Which is the last Surah of the Holy Quran?", topics: "قرآن,سورۃ الناس", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The Holy Prophet (PBUH) was born in which year?", topics: "تاریخ,ولادت", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Zakat is obligatory on Muslims who possess:", topics: "زکوٰۃ,شرائط", difficulty: "medium" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Explain the significance of Roza (fasting) during Ramadan", topics: "روزہ,رمضان", difficulty: "medium" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Write the differences between Sunnah and Hadith", topics: "سنت,حدیث", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "Describe the events of the Battle of Uhud and its lessons for Muslims", topics: "تاریخ, احد,جنگ", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Write the teachings of Islam regarding the rights of neighbors", topics: "اسلام,پڑوسی,حقوق", difficulty: "hard" },
];

const balochPakStudies10_2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Who gave the slogan 'Pakistan ka matlab kya'?", topics: "تاریخ,شعار", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The national flower of Pakistan is:", topics: "قیمتی پودے,شہد", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Balochistan is the largest province of Pakistan by:", topics: "جغرافیہ,رقبہ", difficulty: "easy" },
  { num: 4, section: "Section B", type: "Short", marks: 2, text: "Write the names of Pakistan's neighbouring countries", topics: "جغرافیہ,ملک", difficulty: "easy" },
  { num: 5, section: "Section B", type: "Short", marks: 2, text: "Describe the importance of Indus River for Pakistan", topics: "جغرافیہ,دریائے سندھ", difficulty: "medium" },
  { num: 6, section: "Section C", type: "Long", marks: 5, text: "مضمون: \"پاکستان میں سائنسی تعلیم کی اہمیت\"", topics: "تحریر,مضمون,سائنس", difficulty: "hard" },
  { num: 7, section: "Section C", type: "Long", marks: 5, text: "Describe the geography of Balochistan and its natural resources", topics: "جغرافیہ,بلوچستان,وسائل", difficulty: "hard" },
];

// ─── CSS ───
const cssMath2020: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Prove that the set of rational numbers is dense in the set of real numbers", topics: "real analysis,density,rational numbers", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Find the eigenvalues and eigenvectors of the matrix [[2,1],[1,2]]", topics: "linear algebra,eigenvalues,eigenvectors", difficulty: "hard" },
  { num: 3, section: "Section A", type: "Short", marks: 5, text: "State and prove the Cauchy-Schwarz inequality for inner product spaces", topics: "linear algebra,Cauchy-Schwarz inequality", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Solve the boundary value problem: d^2y/dx^2 + lambda*y = 0, y(0) = 0, y(pi) = 0 for different values of lambda", topics: "differential equations,boundary value,eigenvalues", difficulty: "hard" },
  { num: 5, section: "Section B", type: "Long", marks: 10, text: "Find the Fourier series of the function f(x) = |x| in the interval (-pi, pi) and hence show that 1 + 1/4 + 1/9 + ... = pi^2/6", topics: "Fourier analysis,series,Basel problem", difficulty: "hard" },
];

const cssMath2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Prove that every convergent sequence in a metric space is a Cauchy sequence", topics: "real analysis,convergence,Cauchy sequence", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Find the rank of the matrix [[1,2,3],[2,4,6],[1,3,5]] and determine whether it is singular", topics: "linear algebra,rank,singularity", difficulty: "hard" },
  { num: 3, section: "Section A", type: "Short", marks: 5, text: "Solve the PDE: du/dt = k * d^2u/dx^2 using separation of variables", topics: "partial differential equations,heat equation", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Evaluate the contour integral of (z^2 + 1) / (z^2 - 1) around the circle |z| = 2 using the residue theorem", topics: "complex analysis,residue theorem,contour integral", difficulty: "hard" },
  { num: 5, section: "Section B", type: "Long", marks: 10, text: "Prove that the group of non-zero real numbers under multiplication is abelian, but the group of 2x2 invertible matrices under multiplication is not", topics: "abstract algebra,groups,abelian", difficulty: "hard" },
];

const cssPhysics2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Derive the expression for the energy stored in a charged capacitor", topics: "electrostatics,capacitor,energy", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "State and prove Gauss's theorem in electrostatics", topics: "electrostatics,Gauss's theorem", difficulty: "hard" },
  { num: 3, section: "Section A", type: "Short", marks: 5, text: "Explain the concept of entropy and its significance in the second law of thermodynamics", topics: "thermodynamics,entropy,second law", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Derive Maxwell's electromagnetic wave equations from Maxwell's equations and show that electromagnetic waves travel at the speed of light", topics: "electromagnetism,Maxwell's equations,waves", difficulty: "hard" },
  { num: 5, section: "Section B", type: "Long", marks: 10, text: "Explain the Compton scattering experiment. Derive the expression for the Compton shift and discuss its significance", topics: "modern physics,Compton effect,scattering", difficulty: "hard" },
];

const cssPhysics2025: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Derive the expression for the magnetic field inside a long solenoid using Ampere's circuital law", topics: "electromagnetism,solenoid,Ampere's law", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Explain the Bohr model of the hydrogen atom. Derive the expression for the energy levels", topics: "atomic physics,Bohr model,hydrogen", difficulty: "hard" },
  { num: 3, section: "Section A", type: "Short", marks: 5, text: "State and explain the Heisenberg uncertainty principle with examples", topics: "quantum mechanics,uncertainty principle", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Derive the expression for the Lorentz force on a charged particle moving in a combined electric and magnetic field. Explain the velocity selector and mass spectrometer", topics: "electromagnetism,Lorentz force,velocity selector", difficulty: "hard" },
  { num: 5, section: "Section B", type: "Long", marks: 10, text: "Explain the concept of superconductivity. Discuss the BCS theory and its applications in modern technology", topics: "solid state physics,superconductivity,BCS theory", difficulty: "hard" },
];

const cssEnglish2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Write a comprehensive essay on 'Climate Change and Its Impact on Developing Countries'", topics: "essay writing,climate change,developing countries", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Precis writing: Condense the given passage about Pakistan's economic challenges into one-third of its original length", topics: "precis writing,economic challenges", difficulty: "hard" },
  { num: 3, section: "Section B", type: "Long", marks: 10, text: "Analyze the given poem critically with reference to its theme, imagery and literary devices", topics: "literary analysis,poetry,theme", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Write a formal letter to the Secretary Education about the poor condition of government schools in your district", topics: "formal letter,education", difficulty: "hard" },
];

const cssEnglish2025: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Write an essay on 'The Role of Artificial Intelligence in Transforming Governance'", topics: "essay writing,AI,governance", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Precis writing: Summarize the passage about digital literacy in Pakistan", topics: "precis writing,digital literacy", difficulty: "hard" },
  { num: 3, section: "Section B", type: "Long", marks: 10, text: "Read the comprehension passage and answer with critical analysis: [Passage on water scarcity in South Asia]", topics: "reading comprehension,water scarcity,critical analysis", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Write a report for a newspaper on the deteriorating condition of public transport in Karachi", topics: "report writing,transport,Karachi", difficulty: "hard" },
];

const cssPakStudies2023: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Discuss the causes and consequences of the 1971 separation of East Pakistan", topics: "Pakistani history,1971,East Pakistan", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Analyze Pakistan's foreign policy in the context of the Cold War", topics: "foreign policy,Cold War,Pakistan", difficulty: "hard" },
  { num: 3, section: "Section B", type: "Long", marks: 10, text: "Critically examine the role of military in Pakistan's politics from 1958 to 2008", topics: "politics,military,Pakistan,governance", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Discuss the challenges of water management in Pakistan and suggest policy recommendations", topics: "water policy,management,Pakistan", difficulty: "hard" },
];

const cssIslamiat2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "Short", marks: 5, text: "Discuss the concept of Ijtihad in Islam and its relevance in the modern world", topics: "Islamic jurisprudence,Ijtihad,modern relevance", difficulty: "hard" },
  { num: 2, section: "Section A", type: "Short", marks: 5, text: "Analyze the economic teachings of the Holy Quran with specific reference to property rights and taxation", topics: "Islamic economics,Quran,property rights", difficulty: "hard" },
  { num: 3, section: "Section B", type: "Long", marks: 10, text: "Discuss the development of Islamic political thought from the Rightly Guided Caliphs to the Umayyad period", topics: "Islamic political thought,Caliphs,Umayyads", difficulty: "hard" },
  { num: 4, section: "Section B", type: "Long", marks: 10, text: "Critically evaluate the contribution of Sir Syed Ahmad Khan to the intellectual and educational reform of Muslims in South Asia", topics: "Sir Syed Ahmad Khan,education,reform", difficulty: "hard" },
];

// ─── MDCAT ───
const mdcatBio2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "Which organelle is responsible for the synthesis of ATP?", topics: "cell biology,mitochondria,ATP", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The enzyme that breaks down proteins in the stomach is:", topics: "enzymes,pepsin,digestion", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The structure that connects two bones is called:", topics: "skeletal system,joint", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Which hormone regulates blood sugar levels in the human body?", topics: "endocrine system,insulin,diabetes", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The correct sequence of the phases of the cell cycle is:", topics: "cell cycle,phases", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the process of filtration in the human kidney", topics: "kidney,filtration,urine formation", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Describe the structure of a neuron and explain how nerve impulses are transmitted", topics: "nervous system,neuron,impulse", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is immunological memory? How do vaccines work?", topics: "immunology,vaccines,memory cells", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Explain the process of photosynthesis in detail, including the light-dependent and light-independent reactions", topics: "photosynthesis,light reactions,Calvin cycle", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Describe the structure and function of the human heart. Explain how double circulation works", topics: "circulatory system,heart,double circulation", difficulty: "hard" },
];

const mdcatBio2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The powerhouse of the cell is:", topics: "cell biology,mitochondria", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The main function of white blood cells is:", topics: "blood,immune system,WBC", difficulty: "easy" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which part of the brain controls body balance?", topics: "nervous system,cerebellum,balance", difficulty: "easy" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "The process by which water moves from a region of lower solute concentration to higher solute concentration through a semipermeable membrane is:", topics: "cell biology,osmosis", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "DNA replication occurs during which phase of the cell cycle?", topics: "cell cycle,S phase,DNA replication", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the role of hemoglobin in oxygen transport", topics: "blood,hemoglobin,oxygen transport", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Describe the process of transcription in protein synthesis", topics: "genetics,transcription,RNA", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain the mechanism of natural selection as proposed by Darwin", topics: "evolution,natural selection,Darwin", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Describe the structure and functions of DNA. Explain how genes control traits through protein synthesis", topics: "genetics,DNA,protein synthesis,traits", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain the human digestive system in detail, from ingestion to absorption of nutrients", topics: "digestive system,enzymes,absorption", difficulty: "hard" },
];

const mdcatChem2022: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The molecular formula of glucose is:", topics: "biochemistry,glucose", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The number of sigma and pi bonds in ethene (C2H4) are:", topics: "organic chemistry,bonds,ethene", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is a chelating agent?", topics: "coordination chemistry,chelation", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "The pH of human blood is approximately:", topics: "acids and bases,pH,blood", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "Which vitamin is fat-soluble?", topics: "nutrition,vitamins,fat-soluble", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the concept of equivalent weight and its calculation for acids and bases", topics: "stoichiometry,equivalent weight", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "What are buffers? Explain their importance in biological systems", topics: "acids and bases,buffers,biological systems", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Describe the structure of benzene and explain its unusual stability", topics: "organic chemistry,benzene,aromaticity", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Explain the classification of organic reactions with examples. Discuss substitution, addition, elimination and rearrangement reactions", topics: "organic chemistry,reaction types,classification", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Describe the process of electroplating. What is the role of electrolyte concentration and current density?", topics: "electrochemistry,electroplating,electrolysis", difficulty: "hard" },
];

const mdcatChem2025: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The hybridization of nitrogen in ammonia (NH3) is:", topics: "chemical bonding,hybridization,NH3", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following is an example of an addition polymer?", topics: "polymer chemistry,addition polymer", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The normality of a 2M H2SO4 solution is:", topics: "solutions,normality,concentration", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "Which of the following elements has the highest electronegativity?", topics: "periodic table,electronegativity", difficulty: "easy" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The IUPAC name of CH3-CH(OH)-CH3 is:", topics: "organic chemistry,nomenclature,IUPAC", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the phenomenon of resonance with the example of the carbonate ion (CO3 2-)", topics: "chemical bonding,resonance,carbonate", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Distinguish between crystalline and amorphous solids with examples", topics: "states of matter,solids,crystalline", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "What is Markovnikov's rule? Apply it to the addition of HBr to propene", topics: "organic chemistry,Markovnikov's rule,addition", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Explain the different types of chemical bonds: ionic, covalent and coordinate covalent. Give examples and discuss their properties", topics: "chemical bonding,ionic,covalent,coordinate", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Describe the chemistry of drugs. Discuss analgesics, antibiotics and antiseptics with their mechanisms of action", topics: "pharmaceutical chemistry,drugs,antibiotics", difficulty: "hard" },
];

const mdcatPhys2021: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The unit of electric charge is:", topics: "electricity,units,charge", difficulty: "easy" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The velocity of light in a medium with refractive index 1.5 is:", topics: "optics,refractive index,velocity", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The work function of a metal is the minimum energy required to:", topics: "photoelectric effect,work function", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "In a uniform electric field, the potential difference between two points separated by distance d is:", topics: "electrostatics,potential difference", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The SI unit of magnetic flux is:", topics: "electromagnetism,flux,units", difficulty: "easy" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the concept of electric potential and potential energy", topics: "electrostatics,potential,potential energy", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Derive the expression for the time period of a spring-mass system performing SHM", topics: "oscillations,SHM,spring", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain the working of a p-n junction diode as a rectifier", topics: "electronics,p-n junction,rectifier", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "Derive the expression for the capacitance of a parallel plate capacitor with a dielectric slab between the plates", topics: "electrostatics,capacitor,dielectric", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain the Bohr model of the hydrogen atom. Derive the expression for the radius and energy of the nth orbit", topics: "atomic physics,Bohr model,hydrogen", difficulty: "hard" },
];

const mdcatPhys2024: QuestionItem[] = [
  { num: 1, section: "Section A", type: "MCQ", marks: 1, text: "The momentum of a photon of frequency nu is:", topics: "modern physics,photon,momentum", difficulty: "medium" },
  { num: 2, section: "Section A", type: "MCQ", marks: 1, text: "The phenomenon of constructive interference occurs when the path difference is:", topics: "wave optics,interference,path difference", difficulty: "medium" },
  { num: 3, section: "Section A", type: "MCQ", marks: 1, text: "The acceleration due to gravity at a height h above the Earth's surface is:", topics: "gravitation,altitude,gravity", difficulty: "medium" },
  { num: 4, section: "Section A", type: "MCQ", marks: 1, text: "In an inelastic collision, which quantities are conserved?", topics: "collisions,inelastic,conservation", difficulty: "medium" },
  { num: 5, section: "Section A", type: "MCQ", marks: 1, text: "The wavelength associated with an electron of mass m and velocity v is given by:", topics: "modern physics,de Broglie wavelength", difficulty: "medium" },
  { num: 6, section: "Section B", type: "Short", marks: 2, text: "Explain the formation of a rainbow using the principles of dispersion and total internal reflection", topics: "optics,rainbow,dispersion", difficulty: "medium" },
  { num: 7, section: "Section B", type: "Short", marks: 2, text: "Derive the relation between the focal length and radii of curvature of a spherical mirror", topics: "optics,mirror formula,focal length", difficulty: "medium" },
  { num: 8, section: "Section B", type: "Short", marks: 2, text: "Explain the working of an electric generator using Faraday's law", topics: "electromagnetism,generator,Faraday's law", difficulty: "medium" },
  { num: 9, section: "Section C", type: "Long", marks: 5, text: "State and explain Kirchhoff's rules. Apply them to find the current in a Wheatstone bridge circuit", topics: "electricity,Kirchhoff's rules,Wheatstone bridge", difficulty: "hard" },
  { num: 10, section: "Section C", type: "Long", marks: 5, text: "Explain the photoelectric effect. Discuss Einstein's photoelectric equation and its experimental verification", topics: "modern physics,photoelectric effect,Einstein", difficulty: "hard" },
];

// ─── HELPER FUNCTIONS ───
function fedBoard(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "Federal Board", examType: "Annual", year, subject, grade, classSection,
    title: `Federal Board ${grade} ${subject} Annual ${year}`,
    totalMarks: 75, duration: "3 hours", questions: qs,
  }));
}

function punjabBoard(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "Punjab Board", examType: "Annual", year, subject, grade, classSection,
    title: `Punjab Board ${grade} ${subject} Annual ${year}`,
    totalMarks: 75, duration: "3 hours", questions: qs,
  }));
}

function sindhBoard(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "Sindh Board", examType: "Annual", year, subject, grade, classSection,
    title: `Sindh Board ${grade} ${subject} Annual ${year}`,
    totalMarks: 75, duration: "3 hours", questions: qs,
  }));
}

function kpkBoard(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "KPK Board", examType: "Annual", year, subject, grade, classSection,
    title: `KPK Board ${grade} ${subject} Annual ${year}`,
    totalMarks: 75, duration: "3 hours", questions: qs,
  }));
}

function balochistanBoard(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "Balochistan Board", examType: "Annual", year, subject, grade, classSection,
    title: `Balochistan Board ${grade} ${subject} Annual ${year}`,
    totalMarks: 75, duration: "3 hours", questions: qs,
  }));
}

function cssPapers(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "CSS", examType: "Annual", year, subject, grade, classSection,
    title: `CSS ${subject} Paper ${year}`,
    totalMarks: 100, duration: "3 hours", questions: qs,
  }));
}

function mdcatPapers(subject: string, grade: string, yearData: { year: number; classSection: string; questions: QuestionItem[] }[]): PaperData[] {
  return yearData.map(({ year, classSection, questions: qs }) => ({
    board: "MDCAT", examType: "Annual", year, subject, grade, classSection,
    title: `MDCAT ${subject} Section ${year}`,
    totalMarks: 200, duration: "3 hours", questions: qs,
  }));
}

const SEED_DATA: PaperData[] = [
  // ═══ FEDERAL BOARD ═══
  ...fedBoard("Mathematics", "10th", [
    { year: 2018, classSection: "10th Class - Morning", questions: fedMath10_2018 },
    { year: 2021, classSection: "10th Class - Evening", questions: fedMath10_2021 },
    { year: 2024, classSection: "10th Class - Morning", questions: fedMath10_2024 },
  ]),
  ...fedBoard("Physics", "10th", [
    { year: 2018, classSection: "10th Class - Morning", questions: fedPhysics10_2018 },
    { year: 2022, classSection: "10th Class - Evening", questions: fedPhysics10_2022 },
    { year: 2025, classSection: "10th Class - Morning", questions: fedPhysics10_2025 },
  ]),
  ...fedBoard("Chemistry", "10th", [
    { year: 2019, classSection: "10th Class - Morning", questions: fedChemistry10_2019 },
    { year: 2023, classSection: "10th Class - Evening", questions: fedChemistry10_2023 },
  ]),
  ...fedBoard("Biology", "10th", [
    { year: 2020, classSection: "10th Class - Morning", questions: fedBiology10_2020 },
    { year: 2024, classSection: "10th Class - Evening", questions: fedBiology10_2024 },
  ]),
  ...fedBoard("English", "10th", [
    { year: 2019, classSection: "10th Class - Morning", questions: fedEnglish10_2019 },
    { year: 2023, classSection: "10th Class - Evening", questions: fedEnglish10_2023 },
  ]),
  ...fedBoard("Urdu", "10th", [
    { year: 2020, classSection: "10th Class - Evening", questions: fedUrdu10_2020 },
    { year: 2023, classSection: "10th Class - Morning", questions: fedUrdu10_2023 },
  ]),
  ...fedBoard("Pakistani Studies", "10th", [
    { year: 2021, classSection: "10th Class - Morning", questions: fedPakStudies10_2021 },
  ]),
  ...fedBoard("Islamiat", "10th", [
    { year: 2022, classSection: "10th Class - Evening", questions: fedIslamiat10_2022 },
  ]),

  // ═══ PUNJAB BOARD ═══
  ...punjabBoard("Mathematics", "10th", [
    { year: 2018, classSection: "10th Class - Morning", questions: punjabMath10_2018 },
    { year: 2022, classSection: "10th Class - Evening", questions: punjabMath10_2022 },
  ]),
  ...punjabBoard("Mathematics", "12th", [
    { year: 2020, classSection: "12th Class - Morning", questions: punjabMath12_2020 },
    { year: 2024, classSection: "12th Class - Evening", questions: punjabMath12_2024 },
  ]),
  ...punjabBoard("Physics", "11th", [
    { year: 2019, classSection: "11th Class - Morning", questions: punjabPhysics11_2019 },
    { year: 2023, classSection: "11th Class - Evening", questions: punjabPhysics11_2023 },
  ]),
  ...punjabBoard("Urdu", "10th", [
    { year: 2021, classSection: "10th Class - Evening", questions: punjabUrdu10_2021 },
    { year: 2024, classSection: "10th Class - Morning", questions: punjabUrdu10_2024 },
  ]),
  ...punjabBoard("Islamiat", "10th", [
    { year: 2020, classSection: "10th Class - Morning", questions: punjabIslamiat10_2020 },
  ]),

  // ═══ SINDH BOARD ═══
  ...sindhBoard("Mathematics", "10th", [
    { year: 2019, classSection: "10th Class - Morning", questions: sindhMath10_2019 },
    { year: 2023, classSection: "10th Class - Evening", questions: sindhMath10_2023 },
  ]),
  ...sindhBoard("English", "9th", [
    { year: 2020, classSection: "9th Class - Morning", questions: sindhEnglish9_2020 },
    { year: 2024, classSection: "9th Class - Evening", questions: sindhEnglish9_2024 },
  ]),
  ...sindhBoard("Urdu", "10th", [
    { year: 2021, classSection: "10th Class - Evening", questions: sindhUrdu10_2021 },
  ]),
  ...sindhBoard("Pakistani Studies", "10th", [
    { year: 2022, classSection: "10th Class - Morning", questions: sindhPakStudies10_2022 },
  ]),

  // ═══ KPK BOARD ═══
  ...kpkBoard("Mathematics", "10th", [
    { year: 2019, classSection: "10th Class - Morning", questions: kpkMath10_2019 },
    { year: 2023, classSection: "10th Class - Evening", questions: kpkMath10_2023 },
  ]),
  ...kpkBoard("Physics", "10th", [
    { year: 2020, classSection: "10th Class - Morning", questions: kpkPhysics10_2020 },
    { year: 2024, classSection: "10th Class - Evening", questions: kpkPhysics10_2024 },
  ]),
  ...kpkBoard("Urdu", "10th", [
    { year: 2022, classSection: "10th Class - Morning", questions: kpkUrdu10_2022 },
  ]),

  // ═══ BALOCHISTAN BOARD ═══
  ...balochistanBoard("Mathematics", "10th", [
    { year: 2020, classSection: "10th Class - Morning", questions: balochMath10_2020 },
    { year: 2024, classSection: "10th Class - Evening", questions: balochMath10_2024 },
  ]),
  ...balochistanBoard("Islamiat", "10th", [
    { year: 2021, classSection: "10th Class - Morning", questions: balochIslamiat10_2021 },
  ]),
  ...balochistanBoard("Pakistani Studies", "10th", [
    { year: 2023, classSection: "10th Class - Evening", questions: balochPakStudies10_2023 },
  ]),

  // ═══ CSS ═══
  ...cssPapers("Mathematics", "CSS", [
    { year: 2020, classSection: "CSS - Morning", questions: cssMath2020 },
    { year: 2024, classSection: "CSS - Evening", questions: cssMath2024 },
  ]),
  ...cssPapers("Physics", "CSS", [
    { year: 2021, classSection: "CSS - Morning", questions: cssPhysics2021 },
    { year: 2025, classSection: "CSS - Evening", questions: cssPhysics2025 },
  ]),
  ...cssPapers("English", "CSS", [
    { year: 2022, classSection: "CSS - Morning", questions: cssEnglish2022 },
    { year: 2025, classSection: "CSS - Evening", questions: cssEnglish2025 },
  ]),
  ...cssPapers("Pakistani Studies", "CSS", [
    { year: 2023, classSection: "CSS - Morning", questions: cssPakStudies2023 },
  ]),
  ...cssPapers("Islamiat", "CSS", [
    { year: 2024, classSection: "CSS - Evening", questions: cssIslamiat2024 },
  ]),

  // ═══ MDCAT ═══
  ...mdcatPapers("Biology", "MDCAT", [
    { year: 2021, classSection: "MDCAT - Morning", questions: mdcatBio2021 },
    { year: 2024, classSection: "MDCAT - Evening", questions: mdcatBio2024 },
  ]),
  ...mdcatPapers("Chemistry", "MDCAT", [
    { year: 2022, classSection: "MDCAT - Morning", questions: mdcatChem2022 },
    { year: 2025, classSection: "MDCAT - Evening", questions: mdcatChem2025 },
  ]),
  ...mdcatPapers("Physics", "MDCAT", [
    { year: 2021, classSection: "MDCAT - Evening", questions: mdcatPhys2021 },
    { year: 2024, classSection: "MDCAT - Morning", questions: mdcatPhys2024 },
  ]),
];

// ─── SEED FUNCTION ───
export function seedDatabase() {
  const db = getDb();
  const existingCount = db.select({ count: sql<number>`count(*)` }).from(papers).get()?.count || 0;
  if (existingCount > 0) return { seeded: false, count: existingCount };

  let paperId = 0;
  const freqMap = new Map<string, { count: number; years: Set<number>; boards: Set<string>; marks: number[]; type: string; subject: string }>();

  for (const paper of SEED_DATA) {
    const result = db.run(sql`INSERT INTO papers (board, exam_type, year, subject, grade, title, total_marks, duration, class_section) VALUES (${paper.board}, ${paper.examType}, ${paper.year}, ${paper.subject}, ${paper.grade}, ${paper.title}, ${paper.totalMarks}, ${paper.duration}, ${paper.classSection})`);
    paperId = Number(result.lastInsertRowid);

    for (const q of paper.questions) {
      db.run(sql`INSERT INTO questions (paper_id, question_number, section, question_type, marks, question_text, topics, difficulty) VALUES (${paperId}, ${q.num}, ${q.section}, ${q.type}, ${q.marks}, ${q.text}, ${q.topics}, ${q.difficulty})`);

      // Track frequency
      const norm = normalizeText(q.text);
      const existing = freqMap.get(norm);
      if (existing) {
        existing.count++;
        existing.years.add(paper.year);
        existing.boards.add(paper.board);
        existing.marks.push(q.marks);
      } else {
        freqMap.set(norm, { count: 1, years: new Set([paper.year]), boards: new Set([paper.board]), marks: [q.marks], type: q.type, subject: paper.subject });
      }
    }
  }

  // Insert frequency data
  for (const [norm, data] of freqMap) {
    db.run(sql`INSERT INTO question_frequency (normalized_text, subject, board, count, years, boards, last_seen, first_seen, avg_marks, question_type) VALUES (${norm}, ${data.subject}, ${[...data.boards][0]}, ${data.count}, ${JSON.stringify([...data.years])}, ${JSON.stringify([...data.boards])}, ${Math.max(...data.years)}, ${Math.min(...data.years)}, ${data.marks.reduce((a: number, b: number) => a + b, 0) / data.marks.length}, ${data.type})`);
  }

  return { seeded: true, count: SEED_DATA.length };
}
