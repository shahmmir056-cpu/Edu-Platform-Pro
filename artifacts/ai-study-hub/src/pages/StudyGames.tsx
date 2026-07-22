import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Brain,
  Shuffle,
  Zap,
  Trophy,
  RotateCcw,
  ArrowRight,
  Clock,
  Target,
  Sparkles,
  Star,
  Hash,
  BookOpen,
  Lightbulb,
  Lock,
  Eye,
  Heart,
  Flame,
  Crown,
  Medal,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { cn } from "@/lib/utils";

const VOCAB_SETS = [
  { name: "Science Terms", words: [
    { term: "Photosynthesis", def: "Process by which plants convert light to energy" },
    { term: "Mitochondria", def: "Powerhouse of the cell" },
    { term: "Gravity", def: "Force that attracts objects toward each other" },
    { term: "Molecule", def: "Two or more atoms bonded together" },
    { term: "Ecosystem", def: "Community of living organisms and their environment" },
    { term: "Velocity", def: "Speed in a given direction" },
    { term: "Enzyme", def: "Biological catalyst that speeds up reactions" },
    { term: "Neuron", def: "Nerve cell that transmits information" },
    { term: "Atom", def: "Smallest unit of a chemical element" },
    { term: "Hypothesis", def: "Proposed explanation for a phenomenon" },
  ]},
  { name: "Math Terms", words: [
    { term: "Integer", def: "Whole number (positive, negative, or zero)" },
    { term: "Pythagorean", def: "Theorem relating sides of a right triangle" },
    { term: "Polynomial", def: "Expression with multiple terms and variables" },
    { term: "Prime Number", def: "Number divisible only by 1 and itself" },
    { term: "Exponent", def: "Power to which a number is raised" },
    { term: "Quotient", def: "Result of division" },
    { term: "Numerator", def: "Top part of a fraction" },
    { term: "Diameter", def: "Line passing through the center of a circle" },
    { term: "Variable", def: "Symbol representing an unknown quantity" },
    { term: "Coefficient", def: "Number multiplied by a variable" },
  ]},
  { name: "History Terms", words: [
    { term: "Renaissance", def: "Cultural rebirth in 14th-17th century Europe" },
    { term: "Revolution", def: "Overthrow of a government or social order" },
    { term: "Democracy", def: "System of government by the whole population" },
    { term: "Industrialization", def: "Development of industry on a large scale" },
    { term: "Colonialism", def: "Practice of acquiring control over other countries" },
    { term: "Sovereignty", def: "Supreme authority within a territory" },
    { term: "Reformation", def: "16th-century religious movement" },
    { term: "Imperialism", def: "Policy of extending a country's power" },
    { term: "Feudalism", def: "Medieval social system of lords and vassals" },
    { term: "Enlightenment", def: "18th-century intellectual movement" },
  ]},
];

const SPEED_MATH_TOPICS = [
  { name: "Addition", gen: () => { const a = Math.floor(Math.random() * 50) + 1; const b = Math.floor(Math.random() * 50) + 1; return { q: `${a} + ${b}`, a: a + b }; }},
  { name: "Subtraction", gen: () => { const a = Math.floor(Math.random() * 50) + 20; const b = Math.floor(Math.random() * 20) + 1; return { q: `${a} - ${b}`, a: a - b }; }},
  { name: "Multiplication", gen: () => { const a = Math.floor(Math.random() * 12) + 1; const b = Math.floor(Math.random() * 12) + 1; return { q: `${a} x ${b}`, a: a * b }; }},
  { name: "Division", gen: () => { const b = Math.floor(Math.random() * 10) + 2; const a = b * (Math.floor(Math.random() * 10) + 1); return { q: `${a} / ${b}`, a: a / b }; }},
];

const HANGMAN_WORDS: Record<string, string[]> = {
  Animals: ["ELEPHANT", "GIRAFFE", "DOLPHIN", "PENGUIN", "CHEETAH", "OCTOPUS", "WALRUS", "BUFFALO"],
  Countries: ["JAPAN", "BRAZIL", "CANADA", "FRANCE", "GERMANY", "AUSTRALIA", "MEXICO", "INDIA"],
  Science: ["GRAVITY", "MOLECULE", "NUCLEUS", "ELECTRON", "PHOTON", "NEUTRON", "PROTON", "QUANTUM"],
  Food: ["CHOCOLATE", "SPAGHETTI", "AVOCADO", "PANCAKE", "DUMPLING", "BURRITO", "PRETZEL", "BISCUIT"],
};

const CODE_BREAKER_PATTERNS: { seq: string[]; answer: string; options: string[] }[] = [
  { seq: ["A", "B", "C", "D", "E"], answer: "F", options: ["F", "G", "H", "A"] },
  { seq: ["2", "4", "6", "8"], answer: "10", options: ["10", "9", "12", "11"] },
  { seq: ["red", "blue", "red", "blue"], answer: "red", options: ["red", "blue", "green", "yellow"] },
  { seq: ["circle", "square", "circle", "square", "circle"], answer: "square", options: ["square", "circle", "triangle", "diamond"] },
  { seq: ["1", "1", "2", "3", "5"], answer: "8", options: ["8", "7", "6", "9"] },
  { seq: ["monday", "tuesday", "wednesday", "thursday"], answer: "friday", options: ["friday", "saturday", "sunday", "monday"] },
  { seq: ["Jan", "Feb", "Mar", "Apr"], answer: "May", options: ["May", "Jun", "Jul", "Aug"] },
  { seq: ["3", "6", "9", "12", "15"], answer: "18", options: ["18", "16", "20", "17"] },
  { seq: ["one", "two", "three", "four", "five"], answer: "six", options: ["six", "seven", "five", "eight"] },
  { seq: ["small", "medium", "large", "XL"], answer: "XXL", options: ["XXL", "S", "M", "XS"] },
  { seq: ["spring", "summer", "autumn", "winter"], answer: "spring", options: ["spring", "fall", "monsoon", "dry"] },
  { seq: ["North", "East", "South"], answer: "West", options: ["West", "Up", "Down", "Center"] },
];

const TRIVIA_QUESTIONS = [
  { q: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], correct: 1 },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2 },
  { q: "What planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2 },
  { q: "What is the derivative of x^2?", options: ["x", "2x", "x^2", "2x^2"], correct: 1 },
  { q: "Which gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2 },
  { q: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0 },
  { q: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Austen", "Twain"], correct: 1 },
  { q: "What is the pH of pure water?", options: ["0", "7", "14", "5"], correct: 1 },
  { q: "Largest organ in the human body?", options: ["Heart", "Liver", "Brain", "Skin"], correct: 3 },
  { q: "What year did WWII end?", options: ["1943", "1944", "1945", "1946"], correct: 2 },
  { q: "SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correct: 2 },
  { q: "Bones in adult human body?", options: ["186", "196", "206", "216"], correct: 2 },
  { q: "Chemical formula for salt?", options: ["KCl", "NaCl", "CaCl2", "MgCl2"], correct: 1 },
  { q: "Force keeping planets in orbit?", options: ["Magnetism", "Friction", "Gravity", "Tension"], correct: 2 },
  { q: "Boiling point of water (C)?", options: ["90", "100", "110", "120"], correct: 1 },
];

type Game = "hub" | "memory" | "word-scramble" | "speed-math" | "trivia" | "code-breaker" | "hangman";

const SPRING = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: SPRING } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: SPRING } } };

export default function StudyGames() {
  const [game, setGame] = useState<Game>("hub");
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 min-h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">
        {game === "hub" && <GameHub key="hub" onSelect={setGame} />}
        {game === "memory" && <MemoryGame key="memory" onBack={() => setGame("hub")} />}
        {game === "word-scramble" && <WordScrambleGame key="ws" onBack={() => setGame("hub")} />}
        {game === "speed-math" && <SpeedMathGame key="sm" onBack={() => setGame("hub")} />}
        {game === "trivia" && <TriviaGame key="trivia" onBack={() => setGame("hub")} />}
        {game === "code-breaker" && <CodeBreakerGame key="cb" onBack={() => setGame("hub")} />}
        {game === "hangman" && <HangmanGame key="hangman" onBack={() => setGame("hub")} />}
      </AnimatePresence>
    </div>
  );
}

function GameHub({ onSelect }: { onSelect: (g: Game) => void }) {
  const games = [
    { id: "memory" as Game, name: "Memory Match", desc: "Flip cards and match terms with definitions. Train your visual memory.", icon: Brain, gradient: "from-primary/10 to-primary/5", borderHover: "hover:border-primary/40", difficulty: "Easy", bestFor: "Visual Learners" },
    { id: "word-scramble" as Game, name: "Word Scramble", desc: "Unscramble academic vocabulary before time runs out.", icon: Shuffle, gradient: "from-accent/10 to-accent/5", borderHover: "hover:border-accent", difficulty: "Medium", bestFor: "Vocabulary" },
    { id: "speed-math" as Game, name: "Speed Math", desc: "Solve as many math problems as you can in 60 seconds.", icon: Zap, gradient: "from-primary/10 to-primary/5", borderHover: "hover:border-primary/40", difficulty: "Hard", bestFor: "Quick Thinking" },
    { id: "trivia" as Game, name: "Brain Trivia", desc: "Test general knowledge with randomized trivia questions.", icon: Lightbulb, gradient: "from-accent/10 to-accent/5", borderHover: "hover:border-accent", difficulty: "Mixed", bestFor: "Knowledge" },
    { id: "code-breaker" as Game, name: "Code Breaker", desc: "Identify the pattern and predict what comes next in the sequence.", icon: Hash, gradient: "from-primary/10 to-primary/5", borderHover: "hover:border-primary/40", difficulty: "Logic", bestFor: "Pattern Recognition" },
    { id: "hangman" as Game, name: "Word Master", desc: "Guess the word letter by letter. Classic hangman with categories.", icon: Lock, gradient: "from-accent/10 to-accent/5", borderHover: "hover:border-accent", difficulty: "Vocab", bestFor: "Spelling" },
  ];

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <ToolHeader title="Study Games" description="Learn while you play — brain-training games built for students." icon={Gamepad2} />
      <motion.div variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {games.map((g) => (
          <motion.button key={g.id} variants={fadeUp} whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(g.id)}
            className={cn("group text-left bg-card border-2 border-card-border rounded-2xl p-7 transition-all duration-300 hover:shadow-xl", g.borderHover)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br", g.gradient)}>
              <g.icon size={26} className="text-foreground/80" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">{g.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full text-primary">{g.difficulty}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{g.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Target size={12} /> {g.bestFor}</span>
              <span className="text-sm font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Play <ArrowRight size={14} /></span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return <button onClick={onBack} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">&larr; Back to Games</button>;
}

function ScoreBadge({ score, icon: Icon }: { score: string | number; icon: any }) {
  return <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground"><Icon size={14} /> {score}</span>;
}

function StarRating({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={20} className={cn(i < stars ? "text-accent fill-accent" : "text-muted/50")} />
      ))}
    </div>
  );
}

function VictoryScreen({ title, score, subtitle, stars, onRestart, onBack, extraStats }: {
  title: string; score: string; subtitle: string; stars?: number; onRestart: () => void; onBack: () => void;
  extraStats?: { label: string; value: string | number }[];
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: SPRING }} className="text-center max-w-md mx-auto mt-12">
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
        <Trophy size={40} className="text-accent" />
      </motion.div>
      <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{title}</h2>
      {stars !== undefined && <div className="flex justify-center mb-3"><StarRating stars={stars} /></div>}
      <p className="text-lg text-muted-foreground mb-2">{score}</p>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      {extraStats && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {extraStats.map((s, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-3">
              <p className="text-xl font-mono font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onRestart}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md">
          <RotateCcw size={16} /> Play Again
        </motion.button>
        <button onClick={onBack} className="px-6 py-3 border-2 border-input bg-background hover:bg-muted font-bold rounded-xl transition-colors">
          All Games
        </button>
      </div>
    </motion.div>
  );
}

function ComboIndicator({ combo }: { combo: number }) {
  if (combo < 2) return null;
  return (
    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-bold">
      <Flame size={14} /> {combo}x Combo!
    </motion.div>
  );
}

// ─── MEMORY MATCH (UPGRADED) ──────────────────────────────

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [selectedSet, setSelectedSet] = useState(0);
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<{ id: number; term: string; def: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);

  const wordSet = VOCAB_SETS[selectedSet];

  const startGame = () => {
    const pairs = wordSet.words.slice(0, 6);
    const cardPairs = pairs.flatMap((w, i) => [
      { id: i * 2, term: w.term, def: w.def, flipped: false, matched: false },
      { id: i * 2 + 1, term: w.term, def: w.def, flipped: false, matched: false },
    ]);
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    setCards(cardPairs);
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setCombo(0);
    setTimer(0);
    setGameOver(false);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  useEffect(() => {
    if (matches === 6 && started) setGameOver(true);
  }, [matches, started]);

  const handleFlip = (id: number) => {
    if (flippedIds.length >= 2 || cards[id].flipped || cards[id].matched) return;
    const newCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const newFlipped = [...flippedIds, id];
    setCards(newCards);
    setFlippedIds(newFlipped);
    setMoves((m) => m + 1);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].term === newCards[second].term) {
        setCombo((c) => c + 1);
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.term === newCards[first].term ? { ...c, matched: true } : c)));
          setMatches((m) => m + 1);
          setFlippedIds([]);
        }, 400);
      } else {
        setCombo(0);
        setShakeWrong(true);
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === first || c.id === second ? { ...c, flipped: false } : c)));
          setFlippedIds([]);
          setShakeWrong(false);
        }, 800);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const stars = gameOver ? (moves <= 14 ? 3 : moves <= 20 ? 2 : 1) : 0;

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && (
          <div className="flex items-center gap-4">
            <ComboIndicator combo={combo} />
            <ScoreBadge score={formatTime(timer)} icon={Clock} />
            <ScoreBadge score={`${moves} moves`} icon={Target} />
            <ScoreBadge score={`${matches}/6`} icon={Star} />
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <Brain size={36} className="text-primary" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Memory Match</h2>
          <p className="text-muted-foreground mb-8">Match terms with their definitions. Flip two cards at a time. Build combos for glory!</p>
          <div className="space-y-3 mb-8">
            {VOCAB_SETS.map((s, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSet(i)}
                className={cn("w-full py-3 rounded-xl border-2 text-sm font-medium transition-all", selectedSet === i ? "border-primary bg-primary/5 text-primary" : "border-input bg-card hover:border-primary/30 text-foreground")}>
                {s.name}
              </motion.button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md">Start Game</motion.button>
        </motion.div>
      )}

      {started && !gameOver && (
        <motion.div variants={stagger} className={cn("grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-4", shakeWrong && "animate-shake")}>
          {cards.map((card, idx) => (
            <motion.button key={card.id} variants={scaleIn} onClick={() => handleFlip(card.id)}
              whileTap={{ scale: 0.95 }}
              className={cn("aspect-[3/4] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center text-center p-2 transition-all duration-300",
                card.matched ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-700 shadow-md shadow-emerald-500/10" :
                card.flipped ? "bg-primary text-primary-foreground border-2 border-primary shadow-md shadow-primary/20" :
                "bg-card border-2 border-card-border hover:border-primary/40 text-muted-foreground hover:shadow-md"
              )}>
              {card.flipped || card.matched ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={card.matched ? "text-lg" : ""}>
                  {card.matched ? <CheckCircle2 size={20} className="text-emerald-500" /> : (card.id % 2 === 0 ? card.term : card.def)}
                </motion.span>
              ) : (
                <span className="text-2xl opacity-20">?</span>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title="You Won!" score={`${moves} moves in ${formatTime(timer)}`}
          subtitle={`Score: ${Math.max(0, 300 - moves * 5 - timer)} points`}
          stars={stars} onRestart={startGame} onBack={onBack} />
      )}
    </motion.div>
  );
}

// ─── WORD SCRAMBLE (UPGRADED) ─────────────────────────────

function WordScrambleGame({ onBack }: { onBack: () => void }) {
  const [selectedSet, setSelectedSet] = useState(0);
  const [started, setStarted] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(30);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showDef, setShowDef] = useState(false);

  const wordSet = VOCAB_SETS[selectedSet];

  const scramble = (word: string): string => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("") === word ? scramble(word) : arr.join("");
  };

  const startGame = () => {
    const shuffled = [...wordSet.words].sort(() => Math.random() - 0.5).map((w) => w.term);
    setWords(shuffled);
    setCurrentIdx(0);
    setInput("");
    setScore(0);
    setStreak(0);
    setTimer(30);
    setShowHint(false);
    setFeedback(null);
    setShowDef(false);
    setGameOver(false);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => setTimer((t) => { if (t <= 1) { setGameOver(true); return 0; } return t - 1; }), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  const check = () => {
    if (input.toLowerCase().trim() === words[currentIdx].toLowerCase()) {
      const bonus = showHint ? 0 : 5;
      const streakBonus = streak >= 2 ? streak * 2 : 0;
      setScore((s) => s + 10 + bonus + streakBonus);
      setStreak((s) => s + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }
    setShowDef(true);
    setTimeout(() => {
      setCurrentIdx((i) => i + 1);
      setInput("");
      setShowHint(false);
      setFeedback(null);
      setShowDef(false);
      if (currentIdx >= words.length - 1) setGameOver(true);
    }, 1500);
  };

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && !gameOver && (
          <div className="flex items-center gap-4">
            <ComboIndicator combo={streak} />
            <ScoreBadge score={`${timer}s`} icon={Clock} />
            <ScoreBadge score={`Score: ${score}`} icon={Star} />
            <span className="text-sm text-muted-foreground">{currentIdx + 1}/{words.length}</span>
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
            <Shuffle size={36} className="text-accent-foreground" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Word Scramble</h2>
          <p className="text-muted-foreground mb-8">Unscramble the letters. Build streaks for bonus points!</p>
          <div className="space-y-3 mb-8">
            {VOCAB_SETS.map((s, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSet(i)}
                className={cn("w-full py-3 rounded-xl border-2 text-sm font-medium transition-all", selectedSet === i ? "border-primary bg-primary/5 text-primary" : "border-input bg-card hover:border-primary/30")}>
                {s.name}
              </motion.button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Start Scramble</motion.button>
        </motion.div>
      )}

      {started && !gameOver && currentIdx < words.length && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto mt-12">
          <div className="bg-card border-2 border-card-border rounded-2xl p-6 sm:p-10 shadow-lg">
            <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-bold">Unscramble this word</p>
            <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
              {scramble(words[currentIdx]).split("").map((letter: string, i: number) => (
                <motion.span key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                   className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary font-mono font-bold text-lg sm:text-xl flex items-center justify-center">
                  {letter}
                </motion.span>
              ))}
            </div>
            {showHint && (
              <p className="text-sm text-muted-foreground mb-4 italic">Hint: {wordSet.words.find((w) => w.term === words[currentIdx])?.def}</p>
            )}
            {showDef && feedback && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={cn("text-sm font-medium mb-4", feedback === "correct" ? "text-emerald-600" : "text-destructive")}>
                {feedback === "correct" ? "Correct!" : `Answer: ${words[currentIdx]}`}
                <span className="block text-xs text-muted-foreground mt-1">{wordSet.words.find((w) => w.term === words[currentIdx])?.def}</span>
              </motion.p>
            )}
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && check()}
              placeholder="Type your answer..."
              className={cn("w-full bg-background border-2 rounded-xl p-4 text-center text-xl font-bold outline-none transition-all mb-4",
                feedback === "correct" ? "border-emerald-500 bg-emerald-50" : feedback === "wrong" ? "border-destructive bg-destructive/5" : "border-input focus:ring-2 focus:ring-ring"
              )} />
            <div className="flex gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowHint(true)} disabled={showHint}
                className="px-4 py-2.5 border-2 border-input bg-background hover:bg-muted text-sm font-medium rounded-xl disabled:opacity-30">Hint</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={check} disabled={!input.trim()}
                className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50">Check</motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title="Time's Up!" score={`Score: ${score}`} subtitle={`Words completed: ${currentIdx}/${words.length}`}
          onRestart={startGame} onBack={onBack} />
      )}
    </motion.div>
  );
}

// ─── SPEED MATH (UPGRADED) ────────────────────────────────

function SpeedMathGame({ onBack }: { onBack: () => void }) {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState<{ q: string; a: number }>({ q: "", a: 0 });
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(60);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const topic = SPEED_MATH_TOPICS[selectedTopic];

  const nextQuestion = useCallback(() => { setCurrent(topic.gen()); setInput(""); setFeedback(null); }, [topic]);

  const startGame = () => {
    setScore(0); setStreak(0); setTimer(60); setCorrect(0); setWrong(0); setGameOver(false); setStarted(true); nextQuestion();
  };

  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => setTimer((t) => { if (t <= 1) { setGameOver(true); return 0; } return t - 1; }), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  const check = () => {
    const answer = parseFloat(input);
    if (answer === current.a) {
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => s + 1);
      setCorrect((c) => c + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setWrong((w) => w + 1);
      setFeedback("wrong");
    }
    setTimeout(() => nextQuestion(), 400);
  };

  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && !gameOver && (
          <div className="flex items-center gap-4">
            <ComboIndicator combo={streak} />
            <span className="text-sm font-bold text-muted-foreground">Accuracy: {accuracy}%</span>
            <ScoreBadge score={`${timer}s`} icon={Clock} />
            <ScoreBadge score={`Score: ${score}`} icon={Star} />
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <Zap size={36} className="text-primary" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Speed Math</h2>
          <p className="text-muted-foreground mb-8">Solve as many problems as you can in 60 seconds. Build streaks for bonus points!</p>
          <div className="space-y-3 mb-8">
            {SPEED_MATH_TOPICS.map((t, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTopic(i)}
                className={cn("w-full py-3 rounded-xl border-2 text-sm font-medium transition-all", selectedTopic === i ? "border-primary bg-primary/5 text-primary" : "border-input bg-card hover:border-primary/30")}>
                {t.name}
              </motion.button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Start Speed Math</motion.button>
        </motion.div>
      )}

      {started && !gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto mt-12">
          <div className="bg-card border-2 border-card-border rounded-2xl p-6 sm:p-10 shadow-lg">
            <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-bold">{topic.name}</p>
            <p className="text-3xl sm:text-5xl font-mono font-bold text-foreground mb-8">{current.q} = ?</p>
            <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && check()}
              placeholder="Your answer"
              className={cn("w-full bg-background border-2 rounded-xl p-4 text-center text-xl sm:text-3xl font-mono font-bold outline-none transition-all mb-4",
                feedback === "correct" ? "border-emerald-500 bg-emerald-50" : feedback === "wrong" ? "border-destructive bg-destructive/5" : "border-input focus:ring-2 focus:ring-ring"
              )} autoFocus />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={check} disabled={!input.trim()}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 shadow-md">Answer</motion.button>
          </div>
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title="Time's Up!" score={`Score: ${score}`} subtitle={`${correct} correct, ${wrong} wrong`}
          onRestart={startGame} onBack={onBack}
          extraStats={[{ label: "Correct", value: correct }, { label: "Wrong", value: wrong }, { label: "Accuracy", value: `${accuracy}%` }, { label: "Best Streak", value: streak }]} />
      )}
    </motion.div>
  );
}

// ─── TRIVIA (UPGRADED) ────────────────────────────────────

function TriviaGame({ onBack }: { onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState(TRIVIA_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(15);

  const startGame = () => {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled); setCurrentIdx(0); setSelected(null); setScore(0); setShowAnswer(false); setGameOver(false); setTimer(15); setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver || showAnswer) return;
    const interval = setInterval(() => setTimer((t) => { if (t <= 1) { setShowAnswer(true); return 0; } return t - 1; }), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver, showAnswer]);

  const handleSelect = (idx: number) => {
    if (showAnswer) return;
    setSelected(idx); setShowAnswer(true);
    if (idx === questions[currentIdx].correct) setScore((s) => s + 10);
  };

  const next = () => {
    if (currentIdx >= questions.length - 1) setGameOver(true);
    else { setCurrentIdx((i) => i + 1); setSelected(null); setShowAnswer(false); setTimer(15); }
  };

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && !gameOver && (
          <div className="flex items-center gap-4">
            <ScoreBadge score={`${timer}s`} icon={Clock} />
            <ScoreBadge score={`Score: ${score}`} icon={Star} />
            <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
            <Lightbulb size={36} className="text-accent-foreground" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Brain Trivia</h2>
          <p className="text-muted-foreground mb-8">10 random questions. 15 seconds each. How much do you know?</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Start Trivia</motion.button>
        </motion.div>
      )}

      {started && !gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-8">
          <div className="bg-card border-2 border-card-border rounded-2xl p-8 mb-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-muted-foreground">Question {currentIdx + 1}</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                timer > 10 ? "bg-primary/10 text-primary" : timer > 5 ? "bg-accent/10 text-accent-foreground" : "bg-red-100 text-red-700")}>
                {timer}
              </div>
            </div>
            <p className="text-xl font-serif font-bold text-foreground mb-8">{questions[currentIdx].q}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {questions[currentIdx].options.map((opt, i) => (
                <motion.button key={i} whileHover={!showAnswer ? { scale: 1.02 } : {}} whileTap={!showAnswer ? { scale: 0.98 } : {}}
                  onClick={() => handleSelect(i)}
                  className={cn("p-4 rounded-xl border-2 text-left font-medium transition-all",
                    showAnswer && i === questions[currentIdx].correct ? "border-emerald-500 bg-emerald-50 text-emerald-700" :
                    showAnswer && i === selected ? "border-destructive bg-destructive/5 text-destructive" :
                    selected === i ? "border-primary bg-primary/5" :
                    "border-input bg-background hover:border-primary/30")}>
                  <span className="font-mono text-sm text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
          {showAnswer && (
            <div className="flex justify-end">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={next} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 shadow-md">
                {currentIdx >= questions.length - 1 ? "See Results" : "Next Question"} <ArrowRight size={16} />
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title="Trivia Complete!" score={`${score}/${questions.length * 10}`}
          subtitle={score >= 80 ? "Outstanding! You're a trivia master!" : score >= 50 ? "Great job! Keep studying!" : "Good effort! Review the topics and try again."}
          onRestart={startGame} onBack={onBack} />
      )}
    </motion.div>
  );
}

// ─── CODE BREAKER (NEW) ───────────────────────────────────

function CodeBreakerGame({ onBack }: { onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [patterns, setPatterns] = useState(CODE_BREAKER_PATTERNS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(12);

  const startGame = () => {
    const shuffled = [...CODE_BREAKER_PATTERNS].sort(() => Math.random() - 0.5).slice(0, 10);
    setPatterns(shuffled); setCurrentIdx(0); setSelected(null); setScore(0); setShowAnswer(false); setGameOver(false); setTimer(12); setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver || showAnswer) return;
    const interval = setInterval(() => setTimer((t) => { if (t <= 1) { setShowAnswer(true); return 0; } return t - 1; }), 1000);
    return () => clearInterval(interval);
  }, [started, gameOver, showAnswer]);

  const handleSelect = (opt: string) => {
    if (showAnswer) return;
    setSelected(opt); setShowAnswer(true);
    if (opt === patterns[currentIdx].answer) setScore((s) => s + 10 + (timer >= 10 ? 5 : timer >= 5 ? 3 : 1));
  };

  const next = () => {
    if (currentIdx >= patterns.length - 1) setGameOver(true);
    else { setCurrentIdx((i) => i + 1); setSelected(null); setShowAnswer(false); setTimer(12); }
  };

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && !gameOver && (
          <div className="flex items-center gap-4">
            <ScoreBadge score={`${timer}s`} icon={Clock} />
            <ScoreBadge score={`Score: ${score}`} icon={Star} />
            <span className="text-sm text-muted-foreground">{currentIdx + 1}/{patterns.length}</span>
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <Hash size={36} className="text-primary" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Code Breaker</h2>
          <p className="text-muted-foreground mb-8">Find the pattern. Predict what comes next. Faster answers earn more points!</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Start Code Breaker</motion.button>
        </motion.div>
      )}

      {started && !gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-8">
          <div className="bg-card border-2 border-card-border rounded-2xl p-8 mb-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">What comes next?</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                timer > 8 ? "bg-primary/10 text-primary" : timer > 4 ? "bg-accent/10 text-accent-foreground" : "bg-red-100 text-red-700")}>
                {timer}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
              {patterns[currentIdx].seq.map((item, i) => (
                <span key={i}>
                  <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="inline-block px-4 py-2 rounded-lg bg-primary/10 text-primary font-mono font-bold text-lg">{item}</motion.span>
                  {i < patterns[currentIdx].seq.length - 1 && <span className="text-muted-foreground mx-1">,</span>}
                </span>
              ))}
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="inline-block px-4 py-2 rounded-lg bg-accent/10 text-accent-foreground font-mono font-bold text-lg">?</motion.span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {patterns[currentIdx].options.map((opt, i) => (
                <motion.button key={i} whileHover={!showAnswer ? { scale: 1.03 } : {}} whileTap={!showAnswer ? { scale: 0.97 } : {}}
                  onClick={() => handleSelect(opt)}
                  className={cn("p-4 rounded-xl border-2 text-center font-mono font-bold text-lg transition-all",
                    showAnswer && opt === patterns[currentIdx].answer ? "border-emerald-500 bg-emerald-50 text-emerald-700" :
                    showAnswer && opt === selected ? "border-destructive bg-destructive/5 text-destructive" :
                    "border-input bg-background hover:border-primary/30")}>
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
          {showAnswer && (
            <div className="flex justify-end">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={next} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 shadow-md">
                {currentIdx >= patterns.length - 1 ? "See Results" : "Next"} <ArrowRight size={16} />
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title="Pattern Master!" score={`Score: ${score}`} subtitle="You cracked the code!"
          onRestart={startGame} onBack={onBack} />
      )}
    </motion.div>
  );
}

// ─── HANGMAN (NEW) ────────────────────────────────────────

function HangmanGame({ onBack }: { onBack: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState("Animals");
  const [started, setStarted] = useState(false);
  const [word, setWord] = useState("");
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const MAX_WRONG = 6;

  const categories = Object.keys(HANGMAN_WORDS);

  const startGame = () => {
    const words = HANGMAN_WORDS[selectedCategory];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setWord(randomWord); setGuessed([]); setWrongCount(0); setGameOver(false); setWon(false); setHintRevealed(false); setStarted(true);
  };

  const guessLetter = (letter: string) => {
    if (guessed.includes(letter)) return;
    const newGuessed = [...guessed, letter];
    setGuessed(newGuessed);
    if (!word.includes(letter)) setWrongCount((c) => c + 1);
  };

  useEffect(() => {
    if (!started) return;
    const allGuessed = word.split("").every((l) => guessed.includes(l));
    if (allGuessed && word.length > 0) { setWon(true); setGameOver(true); }
    else if (wrongCount >= MAX_WRONG) { setGameOver(true); setWon(false); }
  }, [guessed, wrongCount, word, started]);

  const keyboard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const hangmanParts = [
    <circle key="head" cx="50" cy="25" r="8" className="fill-none stroke-current" strokeWidth="2" />,
    <line key="body" x1="50" y1="33" x2="50" y2="60" className="stroke-current" strokeWidth="2" />,
    <line key="larm" x1="50" y1="40" x2="35" y2="50" className="stroke-current" strokeWidth="2" />,
    <line key="rarm" x1="50" y1="40" x2="65" y2="50" className="stroke-current" strokeWidth="2" />,
    <line key="lleg" x1="50" y1="60" x2="38" y2="78" className="stroke-current" strokeWidth="2" />,
    <line key="rleg" x1="50" y1="60" x2="62" y2="78" className="stroke-current" strokeWidth="2" />,
  ];

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger}>
      <div className="flex items-center justify-between mb-6">
        <BackButton onBack={onBack} />
        {started && (
          <div className="flex items-center gap-4">
            <ScoreBadge score={`${MAX_WRONG - wrongCount} lives`} icon={Heart} />
            <ScoreBadge score={selectedCategory} icon={BookOpen} />
          </div>
        )}
      </div>

      {!started && (
        <motion.div variants={fadeUp} className="text-center max-w-md mx-auto mt-16">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10">
            <Lock size={36} className="text-accent-foreground" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Word Master</h2>
          <p className="text-muted-foreground mb-8">Guess the word letter by letter. {MAX_WRONG} wrong guesses and it's over!</p>
          <div className="space-y-3 mb-8">
            {categories.map((cat) => (
              <motion.button key={cat} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat)}
                className={cn("w-full py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  selectedCategory === cat ? "border-primary bg-primary/5 text-primary" : "border-input bg-card hover:border-primary/30")}>
                {cat}
              </motion.button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Start Game</motion.button>
        </motion.div>
      )}

      {started && !gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-8">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
            <div className="w-32 h-40 shrink-0">
              <svg viewBox="0 0 100 90" className="w-full h-full text-foreground/70">
                <line x1="10" y1="88" x2="90" y2="88" className="stroke-current" strokeWidth="2" />
                <line x1="30" y1="88" x2="30" y2="10" className="stroke-current" strokeWidth="2" />
                <line x1="30" y1="10" x2="50" y2="10" className="stroke-current" strokeWidth="2" />
                <line x1="50" y1="10" x2="50" y2="17" className="stroke-current" strokeWidth="2" />
                <AnimatePresence>
                  {hangmanParts.slice(0, wrongCount).map((part, i) => (
                    <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
                      {part}
                    </motion.g>
                  ))}
                </AnimatePresence>
              </svg>
            </div>
            <div className="flex-1 text-center">
              <div className="flex gap-2 justify-center mb-4 flex-wrap">
                {word.split("").map((letter, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={cn("w-10 h-12 rounded-lg font-mono font-bold text-xl flex items-center justify-center border-2",
                      guessed.includes(letter) ? "border-primary bg-primary/10 text-primary" : "border-muted bg-muted/30 text-transparent")}>
                    {guessed.includes(letter) ? letter : "_"}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border-2 border-card-border rounded-2xl p-6 shadow-lg">
            <div className="flex flex-wrap gap-2 justify-center">
              {keyboard.map((letter) => {
                const isGuessed = guessed.includes(letter);
                const isCorrect = isGuessed && word.includes(letter);
                const isWrong = isGuessed && !word.includes(letter);
                return (
                  <motion.button key={letter} whileHover={!isGuessed ? { scale: 1.1 } : {}} whileTap={!isGuessed ? { scale: 0.9 } : {}}
                    onClick={() => guessLetter(letter)} disabled={isGuessed || gameOver}
                    className={cn("w-10 h-10 rounded-lg font-bold text-sm transition-all",
                      isCorrect ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-400" :
                      isWrong ? "bg-red-100 text-red-400 border-2 border-red-200" :
                      "bg-background border-2 border-input hover:border-primary/40 hover:bg-primary/5 text-foreground"
                    )}>
                    {letter}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {gameOver && (
        <VictoryScreen title={won ? "You Won!" : "Game Over!"} score={won ? `Word: ${word}` : `The word was: ${word}`}
          subtitle={won ? "Great vocabulary skills!" : "Better luck next time!"}
          onRestart={startGame} onBack={onBack} />
      )}
    </motion.div>
  );
}
