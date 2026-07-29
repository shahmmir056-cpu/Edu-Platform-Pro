import { Router, type IRouter } from "express";
import { seedDatabase } from "../lib/seed-past-papers";
import { searchQuestions, analyzeFrequency, getPapers, getPaperQuestions, getStats, searchExactMatch, BOARDS, SUBJECTS, GRADES, EXAM_TYPES } from "../lib/past-papers";
import { geminiGenerateJson, GeminiNotConfiguredError } from "../lib/gemini";
import { logger } from "../lib/logger";
import { getCachedAnalysis, cacheAnalysis } from "../lib/past-papers";

const router: IRouter = Router();

// ─── SEED (run once) ───
router.post("/past-papers/seed", (_req, res) => {
  try {
    const result = seedDatabase();
    res.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error({ err }, "Seed failed");
    res.status(500).json({ error: err.message });
  }
});

// ─── METADATA ───
router.get("/past-papers/meta", (_req, res) => {
  res.json({ boards: BOARDS, subjects: SUBJECTS, grades: GRADES, examTypes: EXAM_TYPES });
});

router.get("/past-papers/stats", (_req, res) => {
  try {
    res.json(getStats());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEARCH ───
router.post("/past-papers/search", (req, res) => {
  try {
    const { query, subject, board, yearFrom, yearTo, questionType, limit } = req.body;
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      res.status(400).json({ error: "Query must be at least 2 characters" });
      return;
    }

    // First check for exact text matches
    const exactMatches = searchExactMatch(query.trim());

    // Then do semantic search
    const semanticResults = searchQuestions({ query: query.trim(), subject, board, yearFrom, yearTo, questionType, limit: limit || 50 });

    // Merge: exact matches first (deduplicated), then semantic results
    const exactIds = new Set(exactMatches.map(e => e.questionId));
    const merged = [
      ...exactMatches.map(e => ({ ...e, score: 1.0, isExactMatch: true })),
      ...semanticResults.filter(r => !exactIds.has(r.questionId)).map(r => ({ ...r, isExactMatch: false })),
    ].slice(0, limit || 50);

    res.json({ results: merged, count: merged.length, exactMatchCount: exactMatches.length });
  } catch (err: any) {
    logger.error({ err }, "Search failed");
    res.status(500).json({ error: err.message });
  }
});

// ─── FREQUENCY ANALYSIS ───
router.post("/past-papers/frequency", (req, res) => {
  try {
    const { query, subject, board } = req.body;
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      res.status(400).json({ error: "Query must be at least 2 characters" });
      return;
    }
    const results = analyzeFrequency({ query: query.trim(), subject, board });
    res.json({ results, count: results.length });
  } catch (err: any) {
    logger.error({ err }, "Frequency analysis failed");
    res.status(500).json({ error: err.message });
  }
});

// ─── PAPERS LIST ───
router.get("/past-papers/list", (req, res) => {
  try {
    const { board, subject, year, limit } = req.query;
    const results = getPapers({
      board: board as string | undefined,
      subject: subject as string | undefined,
      year: year ? Number(year) : undefined,
      limit: limit ? Number(limit) : 100,
    });
    res.json({ results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/past-papers/paper/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const qs = getPaperQuestions(id);
    res.json({ questions: qs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GEMINI AI ANALYSIS (ISOLATED) ───
router.post("/past-papers/analyze", async (req, res) => {
  try {
    const { query, subject, board } = req.body;
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      res.status(400).json({ error: "Query must be at least 2 characters" });
      return;
    }

    // Check cache
    const cacheKey = `analyze:${query}:${subject || ""}:${board || ""}`;
    const cached = getCachedAnalysis(cacheKey);
    if (cached) { res.json(cached); return; }

    // Get frequency data for context
    const freqData = analyzeFrequency({ query: query.trim(), subject, board });
    const searchData = searchQuestions({ query: query.trim(), subject, board, limit: 10 });
    const exactMatches = searchExactMatch(query.trim());

    // Build question context from ACTUAL database questions
    const questionContext = searchData.map((q, i) =>
      `Q${i + 1} [${q.board}, ${q.year}, ${q.subject}, ${q.marks} marks, ${q.questionType}]: ${q.questionText}`
    ).join("\n");
    const exactContext = exactMatches.map((q) =>
      `[EXACT MATCH] ${q.questionText} (${q.board} ${q.year}, ${q.marks} marks)`
    ).join("\n");

    const systemInstruction = `You are an expert educational analyst specializing in Pakistani examination systems (Federal Board, Punjab Board, Sindh Board, KPK Board, Balochistan Board, CSS, MDCAT). You analyze ACTUAL past paper questions and trends to predict future exam questions. Always respond with valid JSON only. No markdown, no commentary. You MUST reference the actual past paper questions provided in your analysis - never fabricate questions.`;

    const contents = `Analyze this exam question/topic for Pakistani board exams: "${query}"

ACTUAL questions found in past paper database:
${questionContext || "No similar questions found in database."}

${exactContext ? `EXACT MATCHES from past papers:\n${exactContext}` : ""}

Frequency data: ${JSON.stringify(freqData.slice(0, 5))}

Provide a JSON response with exactly this structure:
{
  "reappearanceProbability": <number 0-100>,
  "probabilityLabel": "<Very Low|Low|Moderate|High|Very High>",
  "reasoning": "<2-3 sentence explanation based on the actual past paper data above>",
  "yearTrend": "<increasing|decreasing|stable>",
  "relatedQuestions": [
    { "question": "<actual question text from the database above, NOT fabricated>", "relevance": "<high|medium|low>", "board": "<board name>", "year": <year>, "marks": <marks> }
  ],
  "variations": [
    { "variation": "<rephrased version of a real question from above>", "difficulty": "<easy|medium|hard>" }
  ],
  "conceptualBasis": "<explain the key concepts this question tests, referencing actual questions found>",
  "preparationTips": [
    "<practical study tip based on actual exam patterns>",
    "<practical study tip>",
    "<practical study tip>"
  ],
  "estimatedMarks": <number based on actual question marks>,
  "difficultyLevel": "<easy|medium|hard>"
}`;

    const result = await geminiGenerateJson({
      systemInstruction,
      contents,
      maxTokens: 2048,
      temperature: 0.6,
    });

    cacheAnalysis(cacheKey, result);
    res.json(result);
  } catch (err: any) {
    if (err instanceof GeminiNotConfiguredError) {
      res.status(503).json({ error: "Gemini AI not configured. Set GEMINI_API_KEY in .env" });
      return;
    }
    logger.error({ err }, "Gemini analysis failed");
    res.status(500).json({ error: err.message });
  }
});

// ─── GEMINI: RELATED QUESTIONS ───
router.post("/past-papers/related", async (req, res) => {
  try {
    const { query, subject } = req.body;
    if (!query) { res.status(400).json({ error: "Query required" }); return; }

    const result = await geminiGenerateJson({
      systemInstruction: "You are an exam question analyst for Pakistani educational boards. Generate related questions. Respond with valid JSON only.",
      contents: `Generate 8 related exam questions for: "${query}" in ${subject || "the relevant subject"}.
JSON structure: { "questions": [{ "question": "<text>", "board": "<likely board>", "difficulty": "<easy|medium|hard>", "marks": <estimated marks>, "topics": "<comma-separated topics>" }] }`,
      maxTokens: 2048,
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof GeminiNotConfiguredError) { res.status(503).json({ error: "Gemini AI not configured" }); return; }
    res.status(500).json({ error: err.message });
  }
});

// ─── GEMINI: PREDICT REAPPEARANCE ───
router.post("/past-papers/predict", async (req, res) => {
  try {
    const { query, subject, board } = req.body;
    if (!query) { res.status(400).json({ error: "Query required" }); return; }

    const freqData = analyzeFrequency({ query, subject, board });
    const searchData = searchQuestions({ query, subject, board, limit: 5 });
    const questionContext = searchData.map((q) =>
      `"${q.questionText}" (${q.board} ${q.year}, ${q.subject}, ${q.marks} marks)`
    ).join("\n");

    const result = await geminiGenerateJson({
      systemInstruction: "You predict exam question reappearance based on ACTUAL historical data from Pakistani board exams. Reference real questions. Respond with valid JSON only.",
      contents: `Predict reappearance likelihood for: "${query}"

REAL questions from past papers database:
${questionContext || "No similar questions found."}

Historical frequency: ${JSON.stringify(freqData.slice(0, 3))}

JSON: { "probability": <0-100>, "reasoning": "<why, referencing actual questions>", "nextLikelyYear": <year>, "confidence": "<high|medium|low>", "relatedActualQuestions": ["<real question text from above>"], "factors": ["<factor1>", "<factor2>"] }`,
      maxTokens: 1024,
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof GeminiNotConfiguredError) { res.status(503).json({ error: "Gemini AI not configured" }); return; }
    res.status(500).json({ error: err.message });
  }
});

export default router;
