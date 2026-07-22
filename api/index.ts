import express from "express";
import cors from "cors";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function getClient() {
  return new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    fetch: globalThis.fetch,
  });
}

async function generateJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  if (!GROQ_API_KEY) throw new Error("AI_NOT_CONFIGURED");
  const { system, user, maxTokens = 4000 } = params;
  const openai = getClient();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: maxTokens,
        messages,
        response_format: { type: "json_object" },
      });
      const content = completion.choices[0]?.message?.content ?? "";
      try {
        return JSON.parse(content) as T;
      } catch {
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content: "That was not valid JSON. Reply with ONLY a single valid JSON object, no markdown fences.",
        });
      }
    } catch (err: any) {
      if (attempt === 2) throw err;
      messages.push({
        role: "user",
        content: "Your previous reply failed. Reply again with ONLY a single valid JSON object.",
      });
    }
  }
  throw new Error("AI generation failed after retries");
}

function aiRoute(handler: (req: express.Request, res: express.Response) => Promise<void>) {
  return async (req: express.Request, res: express.Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      if (err?.message === "AI_NOT_CONFIGURED") {
        res.status(503).json({ error: "No AI provider configured. Set GROQ_API_KEY.", code: "AI_NOT_CONFIGURED" });
        return;
      }
      console.error("AI tool error:", err);
      res.status(500).json({ error: "Failed to generate content. Please try again." });
    }
  };
}

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

app.post("/api/ai-tools/research", aiRoute(async (req, res) => {
  const { topic, depth = "standard" } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const sectionCount = depth === "overview" ? 3 : depth === "deep" ? 6 : 4;
  const result = await generateJson<unknown>({
    maxTokens: depth === "deep" ? 6000 : 4000,
    system: "You are a meticulous research assistant helping a student build a well-sourced study report. Write in clear, confident prose, organized into sections. You cannot browse the web, so synthesize from your own knowledge. Respond ONLY with a single JSON object: " +
      '{"title": string, "summary": string, "sections": [{"heading": string, "content": string}], "keyTakeaways": string[], "furtherQuestions": string[], "suggestedSources": [{"title": string, "note": string}]}',
    user: `Research topic: "${topic}"\nDepth: ${depth}\nWrite exactly ${sectionCount} sections, each 2-4 paragraphs. Include 3-5 keyTakeaways, 3-5 furtherQuestions, and 3-5 suggestedSources.`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/essay", aiRoute(async (req, res) => {
  const { topic, essayType = "argumentative", wordCount = 500, tone } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: Math.min(8000, Math.round(wordCount * 2.2) + 800),
    system: "You are an excellent student writer. Write polished, well-structured essays. Respond ONLY with a single valid JSON object: " +
      '{"title": string, "outline": string[], "body": string, "wordCount": number}. The body must be a properly quoted JSON string with paragraphs separated by \\n\\n.',
    user: `Topic: "${topic}"\nEssay type: ${essayType}\nTarget length: ${wordCount} words${tone ? `\nTone: ${tone}` : ""}\nProvide a 4-7 point outline, then the full essay body.`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/quiz", aiRoute(async (req, res) => {
  const { topic, numQuestions = 5, difficulty = "medium" } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: 4000,
    system: "You are a subject-matter expert writing a fair multiple-choice quiz. Each question has exactly 4 options, one correct, with explanations. Respond ONLY with: " +
      '{"title": string, "questions": [{"question": string, "options": string[4], "correctIndex": number, "explanation": string}]}',
    user: `Topic: "${topic}"\nNumber of questions: ${numQuestions}\nDifficulty: ${difficulty}`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/flashcards", aiRoute(async (req, res) => {
  const { topic, numCards = 10 } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: 3000,
    system: "You create effective study flashcards. Respond ONLY with: " +
      '{"title": string, "cards": [{"front": string, "back": string}]}',
    user: `Topic: "${topic}"\nNumber of cards: ${numCards}\nCover the most important concepts.`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/study-notes", aiRoute(async (req, res) => {
  const { topic } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: 4000,
    system: "You create clear, well-organized study notes. Respond ONLY with: " +
      '{"title": string, "sections": [{"heading": string, "bullets": string[]}], "keyTerms": [{"term": string, "definition": string}]}',
    user: `Topic: "${topic}"\nOrganize into 4-6 sections with concise bullet points, plus a glossary of 5-10 key terms.`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/presentation", aiRoute(async (req, res) => {
  const { topic, numSlides = 8 } = req.body;
  if (!topic?.trim()) { res.status(400).json({ error: "Topic is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: 4000,
    system: "You are an expert presentation designer. Create slide-by-slide outlines. Respond ONLY with: " +
      '{"title": string, "slides": [{"title": string, "bullets": string[], "speakerNotes": string}]}',
    user: `Topic: "${topic}"\nNumber of slides: ${numSlides}\nInclude title and closing slides.`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/math-solver", aiRoute(async (req, res) => {
  const { problem } = req.body;
  if (!problem?.trim()) { res.status(400).json({ error: "Problem is required" }); return; }
  const result = await generateJson<unknown>({
    maxTokens: 3000,
    system: "You are a patient, precise math tutor. Solve problems step by step using plain text math. Respond ONLY with: " +
      '{"restatedProblem": string, "topic": string, "steps": [{"title": string, "explanation": string, "expression": string}], "finalAnswer": string, "checkNote": string}',
    user: `Solve this math problem step by step: ${problem}`,
  });
  res.json(result);
}));

app.post("/api/ai-tools/text-playground", aiRoute(async (req, res) => {
  const { text, mode = "rewrite", targetLanguage } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: "Text is required" }); return; }
  const modeInstructions: Record<string, string> = {
    summarize: "Summarize the text concisely.",
    expand: "Expand with more detail and examples.",
    simplify: "Rewrite in simpler language.",
    rewrite: "Rewrite to improve clarity and flow.",
    translate: `Translate into ${targetLanguage || "Spanish"}.`,
    "fix-grammar": "Fix all grammar and spelling errors.",
  };
  const result = await generateJson<unknown>({
    maxTokens: 4000,
    system: `You are a precise text-editing assistant. ${modeInstructions[mode] || modeInstructions.rewrite} Respond ONLY with: {"result": string}`,
    user: text,
  });
  res.json(result);
}));

const feedbackEntries: any[] = [];

app.post("/api/feedback", (req, res) => {
  const { name, email, rating, category, message } = req.body;
  if (!name || !email || !rating || !message) {
    res.status(400).json({ error: "Name, email, rating, and message are required." });
    return;
  }
  const entry = {
    id: crypto.randomUUID(),
    name, email, rating, category: category || "general", message,
    createdAt: new Date().toISOString(),
  };
  feedbackEntries.push(entry);
  res.json({ success: true, id: entry.id });
});

app.get("/api/feedback", (_req, res) => {
  res.json({ count: feedbackEntries.length, entries: feedbackEntries.slice(-50).reverse() });
});

const publicDir = path.join(__dirname, "..", "artifacts", "ai-study-hub", "dist", "public");
app.use(express.static(publicDir, { index: "index.html" }));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
