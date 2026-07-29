import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  BookOpen,
  PenTool,
  MessageSquare,
  Target,
  Star,
  Brain,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Zap,
  GraduationCap,
  Atom,
  Calculator,
  Globe,
  BookMarked,
  Beaker,
  Landmark,
  Cpu,
  ChevronDown,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { cn } from "@/lib/utils";

type TestPhase = "hub" | "config" | "taking" | "results";
type TestCategory = "mcq" | "true-false" | "fill-blank" | "short-answer" | "essay" | "speed";
type Difficulty = "Easy" | "Medium" | "Hard";

interface QuestionResult {
  questionIndex: number;
  userAnswer: string | number | boolean | null;
  correct: boolean;
  points: number;
}

interface TestConfig {
  type: TestCategory;
  classNumber: number;
  subject: string;
  numQuestions: number;
  difficulty: Difficulty;
  timerMinutes: number;
}

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const NUM_OPTIONS = [5, 10, 15, 20];
const TIMER_OPTIONS = [0, 5, 10, 20];

const CLASS_SUBJECTS: Record<number, { subjects: string[]; icon: any; color: string; label: string }> = {
  1:  { subjects: ["English", "Mathematics", "Environmental Studies"], icon: Sparkles, color: "#FF9F4C", label: "Class 1" },
  2:  { subjects: ["English", "Mathematics", "Environmental Studies"], icon: Sparkles, color: "#FF9F4C", label: "Class 2" },
  3:  { subjects: ["English", "Mathematics", "Environmental Studies", "General Knowledge"], icon: BookOpen, color: "#FF9F4C", label: "Class 3" },
  4:  { subjects: ["English", "Mathematics", "Environmental Studies", "General Knowledge"], icon: BookOpen, color: "#FF9F4C", label: "Class 4" },
  5:  { subjects: ["English", "Mathematics", "Science", "Social Studies"], icon: Globe, color: "#FF9F4C", label: "Class 5" },
  6:  { subjects: ["English", "Mathematics", "Science", "Social Science"], icon: Atom, color: "#FF9F4C", label: "Class 6" },
  7:  { subjects: ["English", "Mathematics", "Science", "Social Science"], icon: Atom, color: "#FF9F4C", label: "Class 7" },
  8:  { subjects: ["English", "Mathematics", "Science", "Social Science"], icon: Calculator, color: "#FF9F4C", label: "Class 8" },
  9:  { subjects: ["English", "Mathematics", "Science", "Social Science"], icon: Beaker, color: "#FF9F4C", label: "Class 9" },
  10: { subjects: ["English", "Mathematics", "Science", "Social Science"], icon: Beaker, color: "#FF9F4C", label: "Class 10" },
  11: { subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English", "History", "Geography", "Political Science", "Economics", "Computer Science"], icon: GraduationCap, color: "#FF9F4C", label: "Class 11" },
  12: { subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English", "History", "Geography", "Political Science", "Economics", "Computer Science"], icon: GraduationCap, color: "#FF9F4C", label: "Class 12" },
};

const SUBJECT_TOPIC_MAP: Record<string, string> = {
  "English": "English",
  "Mathematics": "Math",
  "Science": "Science",
  "Environmental Studies": "Science",
  "Social Studies": "History",
  "Social Science": "History",
  "General Knowledge": "General Knowledge",
  "Physics": "Science",
  "Chemistry": "Science",
  "Biology": "Science",
  "History": "History",
  "Geography": "History",
  "Political Science": "History",
  "Economics": "General Knowledge",
  "Computer Science": "General Knowledge",
};

const SUBJECT_ICONS: Record<string, any> = {
  "English": BookMarked,
  "Mathematics": Calculator,
  "Science": Atom,
  "Environmental Studies": Globe,
  "Social Studies": Landmark,
  "Social Science": Landmark,
  "General Knowledge": Brain,
  "Physics": Atom,
  "Chemistry": Beaker,
  "Biology": Atom,
  "History": Landmark,
  "Geography": Globe,
  "Political Science": Landmark,
  "Economics": BarChart3,
  "Computer Science": Cpu,
};

const QUESTION_BANK = {
  Science: {
    mcq: [
      { q: "What is the powerhouse of the cell?", opts: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], correct: 1, exp: "Mitochondria generate most of the cell's ATP." },
      { q: "What gas do plants absorb from the atmosphere?", opts: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, exp: "Plants use CO2 in photosynthesis." },
      { q: "What is the chemical symbol for gold?", opts: ["Go", "Gd", "Au", "Ag"], correct: 2, exp: "Au comes from the Latin 'aurum'." },
      { q: "What is the speed of light approximately?", opts: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0, exp: "Light travels at ~3×10⁸ m/s." },
      { q: "What is the pH of pure water?", opts: ["0", "7", "14", "5"], correct: 1, exp: "Pure water is neutral at pH 7." },
      { q: "What is the largest organ in the human body?", opts: ["Heart", "Liver", "Brain", "Skin"], correct: 3, exp: "Skin is the body's largest organ." },
      { q: "What force keeps planets in orbit?", opts: ["Magnetism", "Friction", "Gravity", "Tension"], correct: 2, exp: "Gravity provides centripetal force for orbits." },
      { q: "How many bones are in the adult human body?", opts: ["186", "196", "206", "216"], correct: 2, exp: "Adults have 206 bones." },
      { q: "What is the boiling point of water in Celsius?", opts: ["90°C", "100°C", "110°C", "120°C"], correct: 1, exp: "Water boils at 100°C at standard pressure." },
      { q: "What is the chemical formula for table salt?", opts: ["KCl", "NaCl", "CaCl2", "MgCl2"], correct: 1, exp: "Table salt is sodium chloride (NaCl)." },
    ],
    tf: [
      { s: "The Earth is the third planet from the Sun.", c: true, exp: "Mercury, Venus, then Earth." },
      { s: "DNA stands for Deoxyribonucleic Acid.", c: true, exp: "Correct full form." },
      { s: "Sound travels faster than light.", c: false, exp: "Light is much faster than sound." },
      { s: "Water boils at 90°C at sea level.", c: false, exp: "Water boils at 100°C at sea level." },
      { s: "The human body is about 60% water.", c: true, exp: "Adults are roughly 60% water." },
      { s: "Electrons have a positive charge.", c: false, exp: "Electrons are negatively charged." },
      { s: "The Sun is a star.", c: true, exp: "The Sun is a G-type main-sequence star." },
      { s: "Plants produce oxygen during photosynthesis.", c: true, exp: "Oxygen is a byproduct of photosynthesis." },
      { s: "The human heart has three chambers.", c: false, exp: "The human heart has four chambers." },
      { s: "Solid water is denser than liquid water.", c: false, exp: "Ice is less dense than liquid water." },
    ],
    fill: [
      { s: "The process by which plants make food is called ___.", a: "photosynthesis", kw: ["photosynthesis"] },
      { s: "The powerhouse of the cell is the ___.", a: "mitochondria", kw: ["mitochondria"] },
      { s: "The nearest star to Earth is the ___.", a: "Sun", kw: ["sun"] },
      { s: "Water is made of hydrogen and ___.", a: "oxygen", kw: ["oxygen"] },
      { s: "The study of fossils is called ___.", a: "paleontology", kw: ["paleontology"] },
      { s: "Electricity is the flow of ___.", a: "electrons", kw: ["electrons"] },
      { s: "The hardest natural substance is ___.", a: "diamond", kw: ["diamond"] },
      { s: "DNA stands for Deoxyribonucleic ___.", a: "Acid", kw: ["acid"] },
      { s: "The chemical symbol for water is ___.", a: "H2O", kw: ["h2o"] },
      { s: "The planet known as the Red Planet is ___.", a: "Mars", kw: ["mars"] },
    ],
  },
  Math: {
    mcq: [
      { q: "What is 15% of 200?", opts: ["25", "30", "35", "40"], correct: 1, exp: "15% of 200 = 0.15 × 200 = 30." },
      { q: "What is the square root of 144?", opts: ["10", "11", "12", "14"], correct: 2, exp: "12² = 144." },
      { q: "What is the value of Pi (π) to 2 decimal places?", opts: ["3.12", "3.14", "3.16", "3.18"], correct: 1, exp: "π ≈ 3.14159..." },
      { q: "If x + 5 = 12, what is x?", opts: ["5", "6", "7", "8"], correct: 2, exp: "x = 12 - 5 = 7." },
      { q: "What is 7 × 8?", opts: ["54", "56", "58", "64"], correct: 1, exp: "7 × 8 = 56." },
      { q: "What is the area of a circle with radius 5? (use π = 3.14)", opts: ["78.5", "31.4", "15.7", "62.8"], correct: 0, exp: "A = πr² = 3.14 × 25 = 78.5." },
      { q: "What is 3² + 4²?", opts: ["7", "12", "25", "49"], correct: 2, exp: "9 + 16 = 25." },
      { q: "What is 100 ÷ 4?", opts: ["20", "25", "30", "40"], correct: 1, exp: "100 / 4 = 25." },
      { q: "What is the next prime number after 7?", opts: ["8", "9", "10", "11"], correct: 3, exp: "11 is the next prime after 7." },
      { q: "What is 2⁵?", opts: ["16", "25", "32", "64"], correct: 2, exp: "2⁵ = 32." },
    ],
    tf: [
      { s: "Zero is an even number.", c: true, exp: "Zero is divisible by 2." },
      { s: "The sum of angles in a triangle is 180°.", c: true, exp: "This is a fundamental property of triangles." },
      { s: "A negative number multiplied by a negative number is negative.", c: false, exp: "Negative × negative = positive." },
      { s: "A circle has exactly 4 quarters.", c: true, exp: "A circle can be divided into 4 equal quadrants." },
      { s: "The square root of a negative number is a real number.", c: false, exp: "It is an imaginary number." },
      { s: "2 is the only even prime number.", c: true, exp: "All other even numbers are divisible by 2." },
      { s: "The sum of the first 10 natural numbers is 55.", c: true, exp: "1+2+...+10 = 55." },
      { s: "A fraction with a numerator larger than the denominator is always greater than 1.", c: true, exp: "An improper fraction > 1 (assuming positive numbers)." },
      { s: "Pi is exactly 22/7.", c: false, exp: "22/7 is an approximation, not exact." },
      { s: "The diagonal of a rectangle bisects its angles.", c: false, exp: "Only true for squares." },
    ],
    fill: [
      { s: "The sum of angles in a triangle is ___ degrees.", a: "180", kw: ["180"] },
      { s: "A triangle with all sides equal is called an ___ triangle.", a: "equilateral", kw: ["equilateral"] },
      { s: "The area of a rectangle is length ___ width.", a: "times", kw: ["times", "multiplied", "×", "*"] },
      { s: "A prime number is only divisible by 1 and ___.", a: "itself", kw: ["itself", "1 and itself"] },
      { s: "The square root of 81 is ___.", a: "9", kw: ["9"] },
      { s: "A right angle measures ___ degrees.", a: "90", kw: ["90"] },
      { s: "The formula for the circumference of a circle is 2π___.", a: "r", kw: ["r", "radius"] },
      { s: "The value of Pi to two decimal places is ___.", a: "3.14", kw: ["3.14"] },
      { s: "An angle greater than 90° but less than 180° is called ___ angle.", a: "obtuse", kw: ["obtuse"] },
      { s: "The distance around a circle is called the ___.", a: "circumference", kw: ["circumference"] },
    ],
  },
  History: {
    mcq: [
      { q: "In what year did World War II end?", opts: ["1943", "1944", "1945", "1946"], correct: 2, exp: "WWII ended in 1945." },
      { q: "Who was the first President of the United States?", opts: ["Jefferson", "Washington", "Lincoln", "Adams"], correct: 1, exp: "George Washington served 1789-1797." },
      { q: "The Renaissance began in which country?", opts: ["France", "England", "Italy", "Spain"], correct: 2, exp: "The Renaissance started in Italy around the 14th century." },
      { q: "Who discovered America in 1492?", opts: ["Vasco da Gama", "Columbus", "Magellan", "Drake"], correct: 1, exp: "Christopher Columbus reached the Americas in 1492." },
      { q: "The French Revolution began in which year?", opts: ["1776", "1789", "1804", "1815"], correct: 1, exp: "The French Revolution began in 1789." },
      { q: "Which ancient civilization built the pyramids?", opts: ["Romans", "Greeks", "Egyptians", "Persians"], correct: 2, exp: "Ancient Egyptians built the pyramids." },
      { q: "What was the Magna Carta?", opts: ["A battle", "A charter of rights", "A religion", "A currency"], correct: 1, exp: "The Magna Carta (1215) limited royal power." },
      { q: "Who wrote the Declaration of Independence?", opts: ["Washington", "Franklin", "Jefferson", "Hamilton"], correct: 2, exp: "Thomas Jefferson was the primary author." },
      { q: "The Industrial Revolution started in which country?", opts: ["USA", "Germany", "France", "England"], correct: 3, exp: "It began in England in the late 18th century." },
      { q: "What wall fell in 1989?", opts: ["Hadrian's Wall", "Great Wall", "Berlin Wall", "Wall of Jericho"], correct: 2, exp: "The Berlin Wall fell on November 9, 1989." },
    ],
    tf: [
      { s: "The American Revolution happened before the French Revolution.", c: true, exp: "American Revolution (1775-1783) preceded French (1789)." },
      { s: "Cleopatra was Egyptian by birth.", c: false, exp: "She was of Greek/Macedonian descent (Ptolemaic dynasty)." },
      { s: "The Great Wall of China is visible from space.", c: false, exp: "This is a common myth." },
      { s: "World War I began in 1914.", c: true, exp: "WWI started July 28, 1914." },
      { s: "The Roman Empire fell in 476 AD.", c: true, exp: "The Western Roman Empire fell in 476 AD." },
      { s: "Christopher Columbus was the first European to reach the Americas.", c: false, exp: "Norse Vikings arrived earlier (Leif Erikson)." },
      { s: "The Cold War was fought primarily with weapons.", c: false, exp: "It was mainly ideological/economic, not direct warfare." },
      { s: "Martin Luther King Jr. delivered the 'I Have a Dream' speech.", c: true, exp: "In 1963 during the March on Washington." },
      { s: "The Renaissance occurred during the Middle Ages.", c: false, exp: "The Renaissance followed the Middle Ages." },
      { s: "Gandhi led India's independence movement.", c: true, exp: "Mahatma Gandhi led India to independence in 1947." },
    ],
    fill: [
      { s: "The ancient city of ___ was buried by Mount Vesuvius in 79 AD.", a: "Pompeii", kw: ["pompeii"] },
      { s: "The ___ Revolution began in France in 1789.", a: "French", kw: ["french"] },
      { s: "The first man to walk on the moon was Neil ___.", a: "Armstrong", kw: ["armstrong"] },
      { s: "The ___ Empire was the largest contiguous empire in history.", a: "Mongol", kw: ["mongol"] },
      { s: "The document signed in 1215 limiting the king's power was the Magna ___.", a: "Carta", kw: ["carta"] },
      { s: "The war between the North and South in America was the Civil ___.", a: "War", kw: ["war"] },
      { s: "The ancient writing system of Egypt is called ___ glyphs.", a: "hieroglyphs", kw: ["hieroglyphs", "hieroglyphic"] },
      { s: "The ___ Wall divided Berlin from 1961 to 1989.", a: "Berlin", kw: ["berlin"] },
      { s: "The scientist who proposed the theory of relativity was Albert ___.", a: "Einstein", kw: ["einstein"] },
      { s: "The Renaissance began in the country of ___.", a: "Italy", kw: ["italy"] },
    ],
  },
  English: {
    mcq: [
      { q: "Which is a synonym for 'benevolent'?", opts: ["Cruel", "Kind", "Angry", "Lazy"], correct: 1, exp: "Benevolent means well-meaning and kindly." },
      { q: "What is the plural of 'child'?", opts: ["Childs", "Childes", "Children", "Childrens"], correct: 2, exp: "'Children' is the irregular plural." },
      { q: "Which word is a verb?", opts: ["Beautiful", "Run", "Quickly", "House"], correct: 1, exp: "'Run' is the only verb in the list." },
      { q: "What does 'ambiguous' mean?", opts: ["Clear", "Uncertain", "Brave", "Small"], correct: 1, exp: "Ambiguous means open to more than one interpretation." },
      { q: "Which sentence is grammatically correct?", opts: ["He don't like it", "He doesn't likes it", "He doesn't like it", "He not like it"], correct: 2, exp: "'He doesn't like it' is correct." },
      { q: "What is an antonym of 'enormous'?", opts: ["Huge", "Giant", "Tiny", "Large"], correct: 2, exp: "Tiny is the opposite of enormous." },
      { q: "Which is a pronoun?", opts: ["Quickly", "Under", "She", "Blue"], correct: 2, exp: "'She' is a pronoun." },
      { q: "What is a metaphor?", opts: ["A question", "A direct comparison", "An exaggeration", "A sound word"], correct: 1, exp: "A metaphor is a figure of speech making a direct comparison." },
      { q: "Who wrote 'Romeo and Juliet'?", opts: ["Dickens", "Shakespeare", "Austen", "Twain"], correct: 1, exp: "William Shakespeare wrote it." },
      { q: "Which word is an adjective?", opts: ["Run", "Beautiful", "Under", "Quickly"], correct: 1, exp: "'Beautiful' describes a noun — it's an adjective." },
    ],
    tf: [
      { s: "A noun is a word that describes an action.", c: false, exp: "Verbs describe actions; nouns name people/places/things." },
      { s: "'Their', 'there', and 'they're' are homophones.", c: true, exp: "They sound the same but have different meanings." },
      { s: "A sentence must always start with a capital letter.", c: true, exp: "Standard English convention." },
      { s: "An adverb describes a noun.", c: false, exp: "Adverbs modify verbs, adjectives, or other adverbs." },
      { s: "'Fewer' is used for countable nouns, 'less' for uncountable.", c: true, exp: "This is the standard grammatical distinction." },
      { s: "A paragraph typically has one main idea.", c: true, exp: "Each paragraph should focus on a single topic." },
      { s: "Fiction means something that is true.", c: false, exp: "Fiction is imaginary/invented content." },
      { s: "The subject of a sentence is who or what the sentence is about.", c: true, exp: "The subject performs or is the focus of the action." },
      { s: "Alliteration is the repetition of vowel sounds.", c: false, exp: "Alliteration is the repetition of initial consonant sounds." },
      { s: "A thesis statement usually appears in the introduction.", c: true, exp: "It presents the main argument at the start." },
    ],
    fill: [
      { s: "The opposite of 'hot' is ___.", a: "cold", kw: ["cold"] },
      { s: "A word that rhymes with 'cat' and means 'feline' is ___.", a: "cat", kw: ["cat"] },
      { s: "The past tense of 'go' is ___.", a: "went", kw: ["went"] },
      { s: "A ___ is a figure of speech that compares two things using 'like' or 'as'.", a: "simile", kw: ["simile"] },
      { s: "The main idea of an essay is called the ___ statement.", a: "thesis", kw: ["thesis"] },
      { s: "Words that sound the same but have different meanings are called ___ .", a: "homophones", kw: ["homophones"] },
      { s: "A ___ is a group of sentences about one topic.", a: "paragraph", kw: ["paragraph"] },
      { s: "The 'who' or 'what' of a sentence is the ___.", a: "subject", kw: ["subject"] },
      { s: "The plural of 'mouse' is ___.", a: "mice", kw: ["mice"] },
      { s: "A word that means the opposite of another is its ___.", a: "antonym", kw: ["antonym"] },
    ],
  },
  "General Knowledge": {
    mcq: [
      { q: "What is the capital of Japan?", opts: ["Beijing", "Seoul", "Tokyo", "Bangkok"], correct: 2, exp: "Tokyo is Japan's capital and largest city." },
      { q: "How many continents are there?", opts: ["5", "6", "7", "8"], correct: 2, exp: "There are 7 continents." },
      { q: "What is the largest ocean?", opts: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, exp: "The Pacific Ocean is the largest." },
      { q: "What year was the iPhone first released?", opts: ["2005", "2006", "2007", "2008"], correct: 2, exp: "Apple released the iPhone in 2007." },
      { q: "Which planet is known as the Blue Planet?", opts: ["Neptune", "Earth", "Uranus", "Mars"], correct: 1, exp: "Earth appears blue from space due to its oceans." },
      { q: "What is the currency of the United Kingdom?", opts: ["Euro", "Dollar", "Pound", "Franc"], correct: 2, exp: "The British Pound Sterling (GBP)." },
      { q: "Which sport uses the term 'love' for zero?", opts: ["Soccer", "Basketball", "Tennis", "Golf"], correct: 2, exp: "In tennis, 'love' means zero." },
      { q: "What is the tallest mountain in the world?", opts: ["K2", "Kangchenjunga", "Everest", "Lhotse"], correct: 2, exp: "Mount Everest is 8,849m tall." },
      { q: "How many days are in a leap year?", opts: ["364", "365", "366", "367"], correct: 2, exp: "A leap year has 366 days." },
      { q: "Which planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, exp: "Mars appears red due to iron oxide on its surface." },
    ],
    tf: [
      { s: "The Eiffel Tower is in London.", c: false, exp: "It's in Paris, France." },
      { s: "Water covers about 71% of Earth's surface.", c: true, exp: "About 71% of Earth is covered in water." },
      { s: "The Amazon is the longest river in the world.", c: false, exp: "The Nile is generally considered the longest." },
      { s: "Basketball was invented in Canada.", c: false, exp: "It was invented in the USA (Springfield, Massachusetts)." },
      { s: "The human brain weighs about 3 pounds.", c: true, exp: "Average adult brain weighs about 1.4 kg (~3 lbs)." },
      { s: "Australia is both a country and a continent.", c: true, exp: "Australia is the world's smallest continent and a country." },
      { s: "The Great Wall of China is over 2,000 years old.", c: true, exp: "Construction began around the 7th century BC." },
      { s: "There are 24 hours in a day.", c: true, exp: "Standard solar day." },
      { s: "The Statue of Liberty was a gift from England.", c: false, exp: "It was a gift from France." },
      { s: "An ostrich can run faster than a horse.", c: true, exp: "Ostriches can reach 70 km/h vs horse ~55 km/h." },
    ],
    fill: [
      { s: "The capital of France is ___.", a: "Paris", kw: ["paris"] },
      { s: "The largest planet in our solar system is ___.", a: "Jupiter", kw: ["jupiter"] },
      { s: "The national animal of India is the Bengal ___.", a: "tiger", kw: ["tiger"] },
      { s: "The color of a typical school bus is ___.", a: "yellow", kw: ["yellow"] },
      { s: "The ___ River is the longest in Africa.", a: "Nile", kw: ["nile"] },
      { s: "The fastest land animal is the ___.", a: "cheetah", kw: ["cheetah"] },
      { s: "The Olympic Games originated in ancient ___.", a: "Greece", kw: ["greece"] },
      { s: "The hardest natural substance on Earth is ___.", a: "diamond", kw: ["diamond"] },
      { s: "The sun is a type of ___.", a: "star", kw: ["star"] },
      { s: "The chemical symbol for gold is ___.", a: "Au", kw: ["au"] },
    ],
  },
};

function getGrade(pct: number): string {
  if (pct >= 95) return "A+";
  if (pct >= 90) return "A";
  if (pct >= 85) return "B+";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C+";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTopicForSubject(subject: string): keyof typeof QUESTION_BANK {
  const mapped = SUBJECT_TOPIC_MAP[subject] || "General Knowledge";
  return mapped as keyof typeof QUESTION_BANK;
}

function getClassDifficulty(classNumber: number, baseDifficulty: Difficulty): Difficulty {
  if (classNumber <= 4) return "Easy";
  if (classNumber <= 8) return baseDifficulty === "Hard" ? "Medium" : baseDifficulty;
  return baseDifficulty;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } } };

export default function TestConductor() {
  const [phase, setPhase] = useState<TestPhase>("hub");
  const [config, setConfig] = useState<TestConfig>({ type: "mcq", classNumber: 1, subject: "English", numQuestions: 10, difficulty: "Medium", timerMinutes: 10 });
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(string | number | boolean | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (phase !== "taking" || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "taking" && config.timerMinutes > 0 && timeLeft === 0 && questions.length > 0) {
      handleSubmit();
    }
  }, [timeLeft, phase]);

  const startTest = () => {
    const topic = getTopicForSubject(config.subject);
    const bank = QUESTION_BANK[topic];
    const maxQ = Math.min(config.numQuestions, bank.mcq.length, bank.tf.length, bank.fill.length);
    let pool: any[] = [];
    if (config.type === "mcq" || config.type === "speed") pool = shuffle(bank.mcq).slice(0, maxQ);
    else if (config.type === "true-false") pool = shuffle(bank.tf).slice(0, maxQ);
    else if (config.type === "fill-blank") pool = shuffle(bank.fill).slice(0, maxQ);
    else if (config.type === "short-answer") pool = shuffle(bank.fill).slice(0, maxQ);
    else pool = [...shuffle(bank.mcq.slice(0, Math.min(3, maxQ))), ...shuffle(bank.tf).slice(0, Math.min(2, maxQ))];

    setQuestions(pool);
    setAnswers(new Array(pool.length).fill(null));
    setCurrentIdx(0);
    setResults([]);
    setScore(0);
    setTimeLeft(config.timerMinutes * 60);
    setPhase("taking");
  };

  const handleSubmit = () => {
    const res: QuestionResult[] = questions.map((q, i) => {
      const ans = answers[i];
      let correct = false;
      let points = 0;

      if (config.type === "mcq" || config.type === "speed") {
        correct = ans === q.correct;
        points = correct ? 10 : 0;
      } else if (config.type === "true-false") {
        correct = ans === q.c;
        points = correct ? 10 : 0;
      } else if (config.type === "fill-blank") {
        const userAns = String(ans || "").toLowerCase().trim();
        correct = q.kw.some((k: string) => userAns.includes(k.toLowerCase()));
        points = correct ? 10 : 0;
      } else if (config.type === "short-answer") {
        const userAns = String(ans || "").toLowerCase().trim();
        correct = q.kw.some((k: string) => userAns.includes(k.toLowerCase()));
        points = correct ? 10 : 0;
      } else {
        correct = false;
        points = 0;
      }
      return { questionIndex: i, userAnswer: ans, correct, points };
    });
    setResults(res);
    setScore(res.reduce((s, r) => s + r.points, 0));
    setPhase("results");
  };

  const setAnswer = (ans: string | number | boolean | null) => {
    setAnswers((prev) => { const n = [...prev]; n[currentIdx] = ans; return n; });
  };

  const pct = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 min-h-[calc(100vh-4rem)]">
      <ToolHeader title="Test Conductor" description="Practice with class-specific tests across all subjects." icon={ClipboardCheck} />
      <AnimatePresence mode="wait">
        {phase === "hub" && <Hub key="hub" config={config} setConfig={setConfig} onStart={startTest} />}
        {phase === "taking" && (
          <Taking key="taking" config={config} questions={questions} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx}
            answers={answers} setAnswer={setAnswer} timeLeft={timeLeft} onSubmit={handleSubmit} />
        )}
        {phase === "results" && (
          <Results key="results" score={score} total={questions.length} results={results} questions={questions}
            config={config} pct={pct} onRetake={startTest} onHub={() => setPhase("hub")} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Hub({ config, setConfig, onStart }: { config: TestConfig; setConfig: React.Dispatch<React.SetStateAction<TestConfig>>; onStart: () => void }) {
  const [showAllClasses, setShowAllClasses] = useState(false);
  const currentClass = CLASS_SUBJECTS[config.classNumber];
  const subjects = currentClass?.subjects || [];
  const visibleClasses = showAllClasses ? Array.from({ length: 12 }, (_, i) => i + 1) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];



  const types: { id: TestCategory; name: string; desc: string; icon: any }[] = [
    { id: "mcq", name: "Multiple Choice", desc: "Pick the best answer from 4 options", icon: Target },
    { id: "true-false", name: "True or False", desc: "Decide if statements are correct", icon: CheckCircle2 },
    { id: "fill-blank", name: "Fill in the Blank", desc: "Complete sentences with the right word", icon: PenTool },
    { id: "short-answer", name: "Short Answer", desc: "Write brief answers to questions", icon: MessageSquare },
    { id: "essay", name: "Essay Test", desc: "Write longer responses with structure", icon: FileText },
    { id: "speed", name: "Speed Challenge", desc: "Rapid-fire questions under time pressure", icon: Zap },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Step 1: Class Selection */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-2 mt-6">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#FF9F4C" }}>1</div>
          <h2 className="text-xl font-serif font-bold text-foreground">Choose Your Class</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-11">Select the class you're studying in</p>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 mb-8">
        {visibleClasses.map((num) => {
          const cls = CLASS_SUBJECTS[num];
          const Icon = cls.icon;
          const active = config.classNumber === num;
          return (
            <motion.button key={num} variants={scaleIn} onClick={() => setConfig((c) => ({ ...c, classNumber: num, subject: cls.subjects[0] }))}
              className={cn(
                "relative p-4 rounded-2xl border-2 transition-all duration-300 text-center group overflow-hidden",
                active
                  ? "border-transparent shadow-lg scale-[1.03]"
                  : "border-black/[0.06] bg-white/[0.5] hover:border-black/[0.12] hover:shadow-md"
              )}
              style={active ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C" } : {}}>
              {active && <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 0%, #FF9F4C, transparent 70%)" }} />}
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all", active ? "shadow-md" : "bg-black/[0.04] group-hover:bg-black/[0.06]")}
                style={active ? { background: "#FF9F4C", color: "#fff" } : { color: "#FF9F4C" }}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold block" style={active ? { color: "#FF9F4C" } : { color: "#2D2D2D" }}>{cls.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Step 2: Subject Selection */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#FF9F4C" }}>2</div>
          <h2 className="text-xl font-serif font-bold text-foreground">Choose Subject</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-11">Pick a subject for Class {config.classNumber}</p>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-8">
        {subjects.map((sub) => {
          const Icon = SUBJECT_ICONS[sub] || BookOpen;
          const active = config.subject === sub;
          return (
            <motion.button key={sub} variants={scaleIn} onClick={() => setConfig((c) => ({ ...c, subject: sub }))}
              className={cn(
                "p-3.5 rounded-2xl border-2 transition-all duration-300 text-left group",
                active
                  ? "border-transparent shadow-lg"
                  : "border-black/[0.06] bg-white/[0.5] hover:border-black/[0.12] hover:shadow-md"
              )}
              style={active ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C" } : {}}>
              <div className="flex items-center gap-2.5">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all", active ? "shadow-md" : "bg-black/[0.04] group-hover:bg-black/[0.06]")}
                  style={active ? { background: "#FF9F4C", color: "#fff" } : { color: "#FF9F4C" }}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold block truncate" style={active ? { color: "#FF9F4C" } : { color: "#2D2D2D" }}>{sub}</span>
                  <span className="text-[10px]" style={{ color: "#6B6B6B" }}>{SUBJECT_TOPIC_MAP[sub]}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Step 3: Test Type */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#FF9F4C" }}>3</div>
          <h2 className="text-xl font-serif font-bold text-foreground">Select Test Type</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-11">Choose how you want to be tested</p>
      </motion.div>

      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {types.map((t) => {
          const Icon = t.icon;
          const active = config.type === t.id;
          return (
            <motion.button key={t.id} variants={scaleIn} onClick={() => setConfig((c) => ({ ...c, type: t.id }))}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all duration-300 group",
                active
                  ? "border-transparent shadow-lg"
                  : "border-black/[0.06] bg-white/[0.5] hover:border-black/[0.12] hover:shadow-md"
              )}
              style={active ? { background: `${currentClass.color}10`, borderColor: currentClass.color } : {}}>
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md")}
                  style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-0.5">{t.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>{t.desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Step 4: Settings */}
      <motion.div variants={fadeUp} className="rounded-2xl p-4 sm:p-6 mb-8" style={{ background: "rgba(255,255,255,0.5)", border: "2px solid rgba(0,0,0,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#FF9F4C" }}>4</div>
          <h3 className="font-serif font-bold text-foreground text-lg">Test Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#6B6B6B" }}>Questions</label>
            <div className="flex gap-1.5">
              {NUM_OPTIONS.map((n) => (
                <button key={n} onClick={() => setConfig((c) => ({ ...c, numQuestions: n }))}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2",
                    config.numQuestions === n ? "text-white shadow-md" : "bg-white/[0.5] hover:bg-white/[0.7] border-black/[0.06]")}
                  style={config.numQuestions === n ? { background: "#FF9F4C", borderColor: "#FF9F4C" } : { color: "#2D2D2D" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#6B6B6B" }}>Difficulty</label>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button key={d} onClick={() => setConfig((c) => ({ ...c, difficulty: d }))}
                  className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2",
                    config.difficulty === d ? "text-white shadow-md" : "bg-white/[0.5] hover:bg-white/[0.7] border-black/[0.06]")}
                  style={config.difficulty === d ? { background: "#FF9F4C", borderColor: "#FF9F4C" } : { color: "#2D2D2D" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#6B6B6B" }}>Timer</label>
            <div className="flex gap-1.5">
              {TIMER_OPTIONS.map((t) => (
                <button key={t} onClick={() => setConfig((c) => ({ ...c, timerMinutes: t }))}
                  className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2",
                    config.timerMinutes === t ? "text-white shadow-md" : "bg-white/[0.5] hover:bg-white/[0.7] border-black/[0.06]")}
                  style={config.timerMinutes === t ? { background: "#FF9F4C", borderColor: "#FF9F4C" } : { color: "#2D2D2D" }}>
                  {t === 0 ? "∞" : `${t}m`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pb-8">
        <button onClick={onStart}
          className="px-12 py-4 text-white font-bold rounded-2xl transition-all shadow-xl flex items-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
          <ClipboardCheck size={22} /> Start Test
          <span className="text-sm opacity-80 ml-1">Class {config.classNumber} · {config.subject}</span>
        </button>
        <p className="text-xs" style={{ color: "#6B6B6B" }}>
          {config.numQuestions} questions · {config.difficulty} · {config.timerMinutes === 0 ? "No timer" : `${config.timerMinutes} min`}
        </p>
      </motion.div>


    </motion.div>
  );
}

function Taking({ config, questions, currentIdx, setCurrentIdx, answers, setAnswer, timeLeft, onSubmit }: {
  config: TestConfig; questions: any[]; currentIdx: number; setCurrentIdx: (n: number) => void;
  answers: (string | number | boolean | null)[]; setAnswer: (a: string | number | boolean | null) => void;
  timeLeft: number; onSubmit: () => void;
}) {
  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const answered = answers.filter((a) => a !== null).length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>Class {config.classNumber}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(255,159,76,0.1)", color: "#FF9F4C" }}>{config.subject}</span>
            <span className="text-sm font-bold text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
          </div>
          {config.timerMinutes > 0 && (
            <span className={cn("flex items-center gap-1.5 text-sm font-mono font-bold", timeLeft < 60 ? "text-destructive" : "text-muted-foreground")}>
              <Timer size={14} /> {formatTime(timeLeft)}
            </span>
          )}
          <span className="text-sm" style={{ color: "#6B6B6B" }}>{answered}/{questions.length} answered</span>
        </div>
        <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: "#FF9F4C" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl p-4 sm:p-6 md:p-8 mb-6" style={{ background: "rgba(255,255,255,0.5)", border: "2px solid rgba(0,0,0,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <p className="text-xl font-serif font-bold text-foreground mb-8">
            {(config.type === "mcq" || config.type === "speed") && q.q}
            {config.type === "true-false" && q.s}
            {config.type === "fill-blank" && q.s}
            {config.type === "short-answer" && (q.q || q.s)}
            {config.type === "essay" && q.q}
          </p>

          {(config.type === "mcq" || config.type === "speed") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.opts.map((opt: string, i: number) => (
                <button key={i} onClick={() => setAnswer(i)}
                  className={cn("p-4 rounded-xl border-2 text-left font-medium transition-all duration-200",
                    answers[currentIdx] === i ? "shadow-md" : "bg-white/[0.5] hover:border-black/[0.15]")}
                  style={answers[currentIdx] === i ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C", color: "#2D2D2D" } : { borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
                  <span className="font-mono text-sm mr-2" style={{ color: "#6B6B6B" }}>{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          )}

          {config.type === "true-false" && (
            <div className="flex flex-col sm:flex-row gap-4">
              {[true, false].map((val) => (
                <button key={String(val)} onClick={() => setAnswer(val)}
                  className={cn("flex-1 py-5 rounded-xl border-2 text-lg font-bold transition-all duration-200",
                    answers[currentIdx] === val ? "shadow-md" : "bg-white/[0.5] hover:border-black/[0.15]")}
                  style={answers[currentIdx] === val ? { background: "rgba(255,159,76,0.1)", borderColor: "#FF9F4C", color: "#2D2D2D" } : { borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
                  {val ? "True" : "False"}
                </button>
              ))}
            </div>
          )}

          {(config.type === "fill-blank" || config.type === "short-answer") && (
            <input type="text" value={String(answers[currentIdx] || "")} onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full border-2 rounded-xl p-4 text-lg outline-none transition-all"
              style={{ background: "#FFFFFF", color: "#2D2D2D", borderColor: "rgba(0,0,0,0.08)" }} />
          )}

          {config.type === "essay" && (
            <textarea value={String(answers[currentIdx] || "")} onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your essay response here..."
              className="w-full border-2 rounded-xl p-4 min-h-[200px] text-lg outline-none transition-all resize-none"
              style={{ background: "#FFFFFF", color: "#2D2D2D", borderColor: "rgba(0,0,0,0.08)" }} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
          className="px-5 py-2.5 border-2 bg-white/[0.5] hover:bg-white/[0.7] rounded-xl font-bold disabled:opacity-30 transition-all flex items-center gap-1"
          style={{ borderColor: "rgba(0,0,0,0.08)", color: "#2D2D2D" }}>
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="flex gap-1.5 overflow-x-auto max-w-[80vw] sm:max-w-none py-1">
          {questions.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={cn("w-2.5 h-2.5 rounded-full transition-all shrink-0",
                i === currentIdx ? "scale-125" : answers[i] !== null ? "opacity-60" : "")}
              style={i === currentIdx ? { background: "#FF9F4C" } : answers[i] !== null ? { background: "#FF9F4C", opacity: 0.4 } : { background: "#D1D5DB" }} />
          ))}
        </div>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-5 py-2.5 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-md"
            style={{ background: "#FF9F4C" }}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={onSubmit} className="px-6 py-2.5 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-md"
            style={{ background: "#FF9F4C" }}>
            Submit <Send size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Results({ score, total, results, questions, config, pct, onRetake, onHub }: {
  score: number; total: number; results: QuestionResult[]; questions: any[]; config: TestConfig;
  pct: number; onRetake: () => void; onHub: () => void;
}) {
  const grade = getGrade(pct);
  const correct = results.filter((r) => r.correct).length;
  const wrong = total - correct;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="text-center mb-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(255,159,76,0.1)" }}>
          <Trophy size={48} style={{ color: "#FF9F4C" }} />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-4xl font-serif font-bold text-foreground mb-2">Test Complete!</motion.h2>
        <p className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Class {config.classNumber} · {config.subject}</p>

        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          className="flex items-center justify-center gap-6 my-8">
          <div className="text-center">
            <p className="text-5xl font-mono font-bold" style={{ color: "#FF9F4C" }}>{pct}%</p>
            <p className="text-sm uppercase tracking-wider mt-1" style={{ color: "#6B6B6B" }}>Score</p>
          </div>
          <div className="w-px h-16" style={{ background: "rgba(0,0,0,0.1)" }} />
          <div className="text-center">
            <p className="text-5xl font-serif font-bold" style={{ color: "#FF9F4C" }}>{grade}</p>
            <p className="text-sm uppercase tracking-wider mt-1" style={{ color: "#6B6B6B" }}>Grade</p>
          </div>
        </motion.div>

        <div className="flex justify-center gap-4 sm:gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18} /> {correct} Correct</div>
          <div className="flex items-center gap-2 text-destructive"><XCircle size={18} /> {wrong} Wrong</div>
          <div className="flex items-center gap-1" style={{ color: "#6B6B6B" }}><Star size={16} /> {score}/{total * 10} pts</div>
        </div>
      </div>

      <div className="space-y-3 mb-10">
        <h3 className="font-serif font-bold text-lg text-foreground mb-4">Question Review</h3>
        {results.map((r, i) => {
          const q = questions[i];
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={cn("p-4 rounded-xl border-2", r.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
              <div className="flex items-start gap-3">
                {r.correct ? <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" /> : <XCircle size={18} className="text-destructive mt-0.5 shrink-0" />}
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {q.q || q.s || q.question}
                  </p>
                  {(config.type === "mcq" || config.type === "speed") && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {r.userAnswer !== null ? q.opts[r.userAnswer as number] : "Unanswered"} {r.correct ? "" : `— Correct: ${q.opts[q.correct]}`}
                    </p>
                  )}
                  {config.type === "true-false" && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {r.userAnswer !== null ? String(r.userAnswer) : "Unanswered"} {r.correct ? "" : `— Correct: ${q.c}`}
                    </p>
                  )}
                  {(config.type === "fill-blank" || config.type === "short-answer") && (
                    <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                      Your answer: {String(r.userAnswer || "Unanswered")} — Expected: {q.a}
                    </p>
                  )}
                  {q.exp && <p className="text-xs mt-1 italic" style={{ color: "#6B6B6B" }}>{q.exp}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pb-16">
        <button onClick={onRetake} className="px-6 py-3 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}>
          <RotateCcw size={16} /> Retake Test
        </button>
        <button onClick={onHub} className="px-6 py-3 border-2 bg-white/[0.5] hover:bg-white/[0.7] font-bold text-foreground rounded-2xl transition-colors"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          All Tests
        </button>
      </div>
    </motion.div>
  );
}
