import { Router } from "express";
import { generateJson, AiNotConfiguredError } from "../lib/ai";
import { logger } from "../lib/logger";

const router = Router();

export type TestCategory = "mcq" | "true-false" | "fill-blank" | "short-answer" | "essay" | "speed";
type Difficulty = "Easy" | "Medium" | "Hard";

interface DraftConfig {
  classNumber: number | null;
  subject: string | null;
  topic: string | null;
  testType: TestCategory | null;
  numQuestions: number | null;
  difficulty: Difficulty | null;
}

interface ReadyConfig {
  classNumber: number;
  subject: string;
  topic: string;
  testType: TestCategory;
  numQuestions: number;
  difficulty: Difficulty;
}

const CATEGORY_KEYS = ["mcq", "true-false", "fill-blank", "short-answer", "essay", "speed"] as const;
const CATEGORY_HINTS: Record<TestCategory, string> = {
  "mcq": "four options, exactly one correct",
  "true-false": "a statement the student judges true or false",
  "fill-blank": "a sentence with a single blank marked ____",
  "short-answer": "a concise written answer of one or two sentences",
  "essay": "a longer structured written response",
  "speed": "four options, exactly one correct (rapid-fire)",
};

function parseConfig(raw: any): DraftConfig {
  const num = (v: any): number | null =>
    Number.isFinite(v) && Number(v) >= 1 && Number(v) <= 12 ? Math.round(Number(v)) : null;
  const subject = (v: any): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 40) : null;
  const topic = (v: any): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null;
  const testType = (v: any): TestCategory | null =>
    CATEGORY_KEYS.includes(v) ? (v as TestCategory) : null;
  const count = (v: any): number | null =>
    Number.isFinite(v) && Number(v) >= 1 && Number(v) <= 25 ? Math.round(Number(v)) : null;
  const difficulty = (v: any): Difficulty | null =>
    v === "Easy" || v === "Medium" || v === "Hard" ? v : null;

  return {
    classNumber: num(raw?.classNumber),
    subject: subject(raw?.subject),
    topic: topic(raw?.topic),
    testType: testType(raw?.testType ?? raw?.type),
    numQuestions: count(raw?.numQuestions),
    difficulty: difficulty(raw?.difficulty),
  };
}

function applyDefaults(cfg: DraftConfig): ReadyConfig {
  const subject = cfg.subject ?? "General Knowledge";
  return {
    classNumber: cfg.classNumber ?? 10,
    subject,
    topic: cfg.topic ?? subject,
    testType: cfg.testType ?? "mcq",
    numQuestions: cfg.numQuestions ?? 10,
    difficulty: cfg.difficulty ?? "Medium",
  };
}

/**
 * POST /api/test-conductor/plan
 * Body: { message: string, collected?: Partial<DraftConfig> }
 * The AI parses a natural-language request and either asks for more info
 * or returns a complete test config.
 */
router.post("/test-conductor/plan", async (req, res) => {
  const message = String(req.body?.message ?? "").trim().slice(0, 400);
  const collected = (req.body?.collected ?? {}) as Partial<DraftConfig>;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const result = await generateJson<{
      status: "ask" | "ready";
      reply: string;
      config: Partial<DraftConfig>;
    }>({
      maxTokens: 1200,
      system:
        "You are the Test Conductor assistant for an educational platform. Students type natural-language " +
        "requests such as \"class 10 physics electricity mcq test\" or \"5th grade science quiz on plants\". " +
        "Extract test parameters and merge them with any info already collected.\n\n" +
        "Available test types (exact keys): mcq, true-false, fill-blank, short-answer, essay, speed.\n\n" +
        "Rules:\n" +
        "- classNumber: an integer 1-12. null if not mentioned.\n" +
        "- subject: a clean subject label (Physics, Mathematics, Biology, Chemistry, History, Geography, " +
        "English, Computer Science, Economics, Science, etc.). null if not mentioned.\n" +
        "- topic: the specific topic or chapter the student wants to be tested on. null if not mentioned.\n" +
        "- testType: one of the exact keys above. null if not mentioned.\n" +
        "- numQuestions: integer 5-20. Default 10 if not mentioned.\n" +
        "- difficulty: \"Easy\", \"Medium\", or \"Hard\". Default \"Medium\" if not mentioned.\n" +
        "- Preserve already-known values unless the new message clearly changes them.\n" +
        "- status is always \"ready\": never block generation. Missing fields are fine; the server fills " +
        "defaults (class 10, General Knowledge, topic = subject, mcq, 10 questions, Medium).\n" +
        "- reply: a friendly confirmation under 45 words that states the final plan, e.g. " +
        "\"Here's your Class 10 Physics MCQ test on Electricity.\".\n\n" +
        'Respond ONLY with a single JSON object: {"status":"ask"|"ready","reply":string,' +
        '"config":{"classNumber":number|null,"subject":string|null,"topic":string|null,' +
        '"testType":"mcq"|"true-false"|"fill-blank"|"short-answer"|"essay"|"speed"|null,' +
        '"numQuestions":number|null,"difficulty":"Easy"|"Medium"|"Hard"|null}}',
      user: `Student message: "${message}"\nAlready known: ${JSON.stringify(collected)}`,
    });

    const config = applyDefaults(parseConfig(result.config));
    const reply =
      typeof result.reply === "string" && result.reply.trim()
        ? result.reply.trim()
        : `Test ready: Class ${config.classNumber} ${config.subject}, topic "${config.topic}", ${config.numQuestions} ${config.testType} questions.`;
    res.json({
      status: "ready",
      reply,
      config,
      ready: true,
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      res.status(503).json({ error: err.message, code: "AI_NOT_CONFIGURED" });
      return;
    }
    logger.error({ err }, "test-conductor plan failed");
    res.status(500).json({ error: "Failed to understand your request. Please try again." });
  }
});

/**
 * POST /api/test-conductor/generate
 * Body: { config: { classNumber, subject, topic, testType, numQuestions, difficulty } }
 * The AI writes a full test for the requested type. Questions are returned
 * in the shapes the frontend test runner already consumes.
 */
router.post("/test-conductor/generate", async (req, res) => {
  const parsed = parseConfig(req.body?.config);
  const cfg = applyDefaults(parsed) as ReadyConfig;
  const { classNumber, subject, topic, testType, numQuestions, difficulty } = cfg;

  let responseShape: string;
  let gradingInstruction: string;
  if (testType === "mcq" || testType === "speed") {
    responseShape =
      '{"title":string,"questions":[{"q":string,"opts":string[4],"correct":number 0-3,"exp":string}]}';
    gradingInstruction =
      "For each question give exactly 4 distinct options, set correct to the index (0-3) of the right one, " +
      "and include a short explanation in exp.";
  } else if (testType === "true-false") {
    responseShape = '{"title":string,"questions":[{"q":string,"correct":boolean,"exp":string}]}';
    gradingInstruction =
      "For each question state a fact or claim, set correct to true/false, and include a short explanation in exp.";
  } else if (testType === "fill-blank") {
    responseShape =
      '{"title":string,"questions":[{"q":string,"answer":string,"keywords":[string],"exp":string}]}';
    gradingInstruction =
      "Each question must contain exactly one blank written as ____ inside the question text. " +
      "Provide the expected answer and 2-4 keywords (lowercase) that any correct answer would contain.";
  } else if (testType === "short-answer") {
    responseShape =
      '{"title":string,"questions":[{"q":string,"answer":string,"keywords":[string],"exp":string}]}';
    gradingInstruction =
      "Each question expects a short written answer. Provide a model answer and 2-5 keywords (lowercase) " +
      "that any correct answer would contain.";
  } else {
    responseShape =
      '{"title":string,"questions":[{"q":string,"answer":string,"keywords":[string],"exp":string}]}';
    gradingInstruction =
      "Each question expects a structured essay. Provide a model answer and 3-5 keywords (lowercase) that " +
      "a good essay would touch on, used for lightweight grading.";
  }

  try {
    const result = await generateJson<{
      title: string;
      questions: any[];
    }>({
      maxTokens: 6000,
      system:
        "You are a top-tier subject-matter expert writing a high-level test for a student. " +
        "Write genuinely good, exam-style questions appropriate for the student's class and subject, " +
        "calibrated to the requested difficulty. Never repeat the same question. All question text, options, " +
        "and explanations must be in plain English (no markdown, no LaTeX). " +
        `Test type: ${testType}. For this type: ${CATEGORY_HINTS[testType]}. ` +
        `${gradingInstruction}\n` +
        `Respond ONLY with a single valid JSON object matching this shape: ${responseShape}`,
      user:
        `Class ${classNumber}, Subject: ${subject}, Topic: ${topic}, Difficulty: ${difficulty}. ` +
        `Write exactly ${numQuestions} questions. Title should be a concise test name.`,
    });

    const title =
      typeof result.title === "string" && result.title.trim()
        ? result.title.trim()
        : `${subject} — ${topic}`;
    const questions = Array.isArray(result.questions)
      ? result.questions.map((q: any) => normalizeQuestion(testType, q)).filter((q: any) => q !== null)
      : [];

    if (questions.length === 0) {
      throw new Error("AI returned no usable questions");
    }

    res.json({ title, type: testType, config: { classNumber, subject, topic, testType, numQuestions, difficulty }, questions });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      res.status(503).json({ error: err.message, code: "AI_NOT_CONFIGURED" });
      return;
    }
    logger.error({ err }, "test-conductor generate failed");
    res.status(500).json({ error: "Failed to generate the test. Please try again." });
  }
});

function normalizeQuestion(testType: TestCategory, q: any): any {
  const qText = typeof q?.q === "string" && q.q.trim() ? q.q.trim() : null;
  const exp = typeof q?.exp === "string" && q.exp.trim() ? q.exp.trim() : undefined;
  if (!qText) return null;

  if (testType === "mcq" || testType === "speed") {
    const opts = Array.isArray(q.opts)
      ? q.opts.filter((o: any): o is string => typeof o === "string" && o.trim().length > 0).map((o: string) => o.trim()).slice(0, 4)
      : [];
    const correct = Number.isInteger(q.correct) && q.correct >= 0 && q.correct < opts.length ? q.correct : 0;
    if (opts.length < 2) return null;
    return { q: qText, opts, correct, exp };
  }

  if (testType === "true-false") {
    const c = typeof q.correct === "boolean" ? q.correct : String(q.correct).toLowerCase().startsWith("t");
    return { s: qText, c, exp };
  }

  if (testType === "fill-blank" || testType === "short-answer") {
    const kw = Array.isArray(q.keywords)
      ? q.keywords.filter((k: any): k is string => typeof k === "string" && k.trim().length > 0).map((k: string) => k.trim().toLowerCase()).slice(0, 6)
      : [];
    const a = typeof q.answer === "string" && q.answer.trim() ? q.answer.trim() : undefined;
    if (kw.length === 0 && !a) return null;
    const kwSet = new Set<string>();
    if (a) kwSet.add(a.toLowerCase());
    kw.forEach((k: string) => kwSet.add(k));
    return { s: qText, kw: Array.from(kwSet).slice(0, 7), a, exp };
  }

  const kw = Array.isArray(q.keywords)
    ? q.keywords.filter((k: any): k is string => typeof k === "string" && k.trim().length > 0).map((k: string) => k.trim().toLowerCase()).slice(0, 6)
    : [];
  const a = typeof q.answer === "string" && q.answer.trim() ? q.answer.trim() : undefined;
  const kwSet = new Set<string>();
  kw.forEach((k: string) => kwSet.add(k));
  if (a) {
    a.toLowerCase().split(/[\s,;.]+/).filter(Boolean).slice(0, 4).forEach((t: string) => kwSet.add(t));
  }
  return { q: qText, kw: Array.from(kwSet).slice(0, 8), exp };
}

export default router;
