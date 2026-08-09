export interface ToolSuggestion {
  route: string;
  name: string;
  reason: string;
}

const SUGGESTIONS: Record<string, ToolSuggestion[]> = {
  math: [
    { route: "/math-solver", name: "Math Solver", reason: "Solve equations and check your answers step by step" },
    { route: "/quiz", name: "Quiz Generator", reason: "Test yourself with practice questions on the topic" },
    { route: "/test-conductor", name: "Test Conductor", reason: "Take a full practice test under exam conditions" },
  ],
  physics: [
    { route: "/math-solver", name: "Math Solver", reason: "Verify the calculations behind physics problems" },
    { route: "/virtual-lab", name: "Virtual Lab", reason: "Run physics experiments safely on screen" },
    { route: "/simulations-v2", name: "Simulations Lab", reason: "Visualize how physical laws actually behave" },
  ],
  chemistry: [
    { route: "/virtual-lab", name: "Virtual Lab", reason: "Mix chemicals and observe reactions safely" },
    { route: "/quiz", name: "Quiz Generator", reason: "Practice chemical equations and concepts" },
    { route: "/flashcards", name: "Flashcards", reason: "Memorize formulas and element facts" },
  ],
  biology: [
    { route: "/virtual-lab", name: "Virtual Lab", reason: "Dissect, observe and experiment without real equipment" },
    { route: "/simulations", name: "Biology Simulations", reason: "Interactive experiments on cells and organisms" },
    { route: "/flashcards", name: "Flashcards", reason: "Memorize biological terms and processes" },
  ],
  science: [
    { route: "/virtual-lab", name: "Virtual Lab", reason: "Run hands-on experiments for any science topic" },
    { route: "/quiz", name: "Quiz Generator", reason: "Check your understanding with quick questions" },
    { route: "/study-notes", name: "Study Notes", reason: "Summarize the topic into clear notes" },
  ],
  english: [
    { route: "/essay", name: "Essay Writer", reason: "Draft essays on the topic you are studying" },
    { route: "/text-playground", name: "Text Playground", reason: "Improve, rephrase and analyze your writing" },
    { route: "/flashcards", name: "Flashcards", reason: "Learn vocabulary and literary terms" },
  ],
  debate: [
    { route: "/debate-mentor", name: "AI Debate", reason: "Build arguments and practice your reasoning" },
    { route: "/essay", name: "Essay Writer", reason: "Structure your ideas into a strong argument" },
    { route: "/text-playground", name: "Text Playground", reason: "Polish your speeches and responses" },
  ],
  computer: [
    { route: "/logic", name: "Logic Explorer", reason: "Train algorithmic thinking and problem solving" },
    { route: "/study-notes", name: "Study Notes", reason: "Turn concepts and syntax into concise notes" },
    { route: "/quiz", name: "Quiz Generator", reason: "Test concepts, code and terminology" },
  ],
  logic: [
    { route: "/logic", name: "Logic Explorer", reason: "Build circuits and solve logic puzzles" },
    { route: "/math-solver", name: "Math Solver", reason: "Solve the math behind the logic problems" },
    { route: "/study-games", name: "Study Games", reason: "Sharpen your brain with quick challenges" },
  ],
  history: [
    { route: "/study-notes", name: "Study Notes", reason: "Condense events and dates into clear notes" },
    { route: "/research", name: "Deep Research", reason: "Find detailed material on the period you study" },
    { route: "/flashcards", name: "Flashcards", reason: "Memorize dates, names and key events" },
  ],
};

const GENERAL: ToolSuggestion[] = [
  { route: "/quiz", name: "Quiz Generator", reason: "Test your understanding of any topic" },
  { route: "/flashcards", name: "Flashcards", reason: "Build cards to memorize key facts" },
  { route: "/study-notes", name: "Study Notes", reason: "Turn the topic into clear revision notes" },
];

const KEYWORD_MAP: [string[], keyof typeof SUGGESTIONS][] = [
  [["math", "algebra", "calculus", "geometry", "trigonometry", "arithmetic"], "math"],
  [["physics"], "physics"],
  [["chemistry", "chem"], "chemistry"],
  [["biology", "biolog", "botany", "zoology"], "biology"],
  [["english", "literature", "grammar", "writing"], "english"],
  [["debate", "civics", "social"], "debate"],
  [["computer", "programming", "coding", "informatics", "ict", " cs"], "computer"],
  [["logic"], "logic"],
  [["history", "geography", "social stud"], "history"],
  [["science"], "science"],
];

/** Which website tools to use while studying a given subject. */
export function suggestToolsForSubject(subject: string): ToolSuggestion[] {
  const s = subject.toLowerCase();
  for (const [keywords, key] of KEYWORD_MAP) {
    if (keywords.some((k) => s.includes(k))) return SUGGESTIONS[key];
  }
  return GENERAL;
}

/** Short plain-text list of tool names for a subject (used in reminder emails). */
export function toolListForSubject(subject: string): string {
  return suggestToolsForSubject(subject)
    .map((t) => t.name)
    .join(", ");
}
