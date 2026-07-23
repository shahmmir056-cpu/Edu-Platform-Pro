import OpenAI from "openai";

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

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Health
    if (path === "/api/healthz") return json({ status: "ok" });

    // Research
    if (path === "/api/ai-tools/research" && req.method === "POST") {
      const { topic, depth = "standard" } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const sectionCount = depth === "overview" ? 3 : depth === "deep" ? 6 : 4;
      const result = await generateJson({
        maxTokens: depth === "deep" ? 6000 : 4000,
        system: "You are a meticulous research assistant. Respond ONLY with JSON: " +
          '{"title": string, "summary": string, "sections": [{"heading": string, "content": string}], "keyTakeaways": string[], "furtherQuestions": string[], "suggestedSources": [{"title": string, "note": string}]}',
        user: `Research topic: "${topic}"\nDepth: ${depth}\nWrite exactly ${sectionCount} sections, each 2-4 paragraphs. Include 3-5 keyTakeaways, 3-5 furtherQuestions, and 3-5 suggestedSources.`,
      });
      return json(result);
    }

    // Essay
    if (path === "/api/ai-tools/essay" && req.method === "POST") {
      const { topic, essayType = "argumentative", wordCount = 500, tone } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const result = await generateJson({
        maxTokens: Math.min(8000, Math.round(wordCount * 2.2) + 800),
        system: "You are an excellent student writer. Respond ONLY with JSON: " +
          '{"title": string, "outline": string[], "body": string, "wordCount": number}. Body paragraphs separated by \\n\\n.',
        user: `Topic: "${topic}"\nType: ${essayType}\nLength: ${wordCount} words${tone ? `\nTone: ${tone}` : ""}\nProvide 4-7 point outline, then full essay.`,
      });
      return json(result);
    }

    // Quiz
    if (path === "/api/ai-tools/quiz" && req.method === "POST") {
      const { topic, numQuestions = 5, difficulty = "medium" } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const result = await generateJson({
        maxTokens: 4000,
        system: "Write a fair multiple-choice quiz. Each question: 4 options, 1 correct, with explanation. Respond ONLY with JSON: " +
          '{"title": string, "questions": [{"question": string, "options": string[4], "correctIndex": number, "explanation": string}]}',
        user: `Topic: "${topic}"\nQuestions: ${numQuestions}\nDifficulty: ${difficulty}`,
      });
      return json(result);
    }

    // Flashcards
    if (path === "/api/ai-tools/flashcards" && req.method === "POST") {
      const { topic, numCards = 10 } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const result = await generateJson({
        maxTokens: 3000,
        system: "Create effective study flashcards. Respond ONLY with JSON: " +
          '{"title": string, "cards": [{"front": string, "back": string}]}',
        user: `Topic: "${topic}"\nCards: ${numCards}\nCover most important concepts.`,
      });
      return json(result);
    }

    // Study Notes
    if (path === "/api/ai-tools/study-notes" && req.method === "POST") {
      const { topic } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const result = await generateJson({
        maxTokens: 4000,
        system: "Create clear study notes. Respond ONLY with JSON: " +
          '{"title": string, "sections": [{"heading": string, "bullets": string[]}], "keyTerms": [{"term": string, "definition": string}]}',
        user: `Topic: "${topic}"\n4-6 sections with concise bullets, plus 5-10 key terms glossary.`,
      });
      return json(result);
    }

    // Presentation
    if (path === "/api/ai-tools/presentation" && req.method === "POST") {
      const { topic, numSlides = 8 } = await req.json();
      if (!topic?.trim()) return json({ error: "Topic is required" }, 400);
      const result = await generateJson({
        maxTokens: 4000,
        system: "Create slide-by-slide outlines. Respond ONLY with JSON: " +
          '{"title": string, "slides": [{"title": string, "bullets": string[], "speakerNotes": string}]}',
        user: `Topic: "${topic}"\nSlides: ${numSlides}\nInclude title and closing slides.`,
      });
      return json(result);
    }

    // Math Solver
    if (path === "/api/ai-tools/math-solver" && req.method === "POST") {
      const { problem } = await req.json();
      if (!problem?.trim()) return json({ error: "Problem is required" }, 400);
      const result = await generateJson({
        maxTokens: 3000,
        system: "Patient math tutor. Solve step by step with plain text math. Respond ONLY with JSON: " +
          '{"restatedProblem": string, "topic": string, "steps": [{"title": string, "explanation": string, "expression": string}], "finalAnswer": string, "checkNote": string}',
        user: `Solve step by step: ${problem}`,
      });
      return json(result);
    }

    // Text Playground
    if (path === "/api/ai-tools/text-playground" && req.method === "POST") {
      const { text, mode = "rewrite", targetLanguage } = await req.json();
      if (!text?.trim()) return json({ error: "Text is required" }, 400);
      const modes: Record<string, string> = {
        summarize: "Summarize concisely.",
        expand: "Expand with more detail.",
        simplify: "Rewrite in simpler language.",
        rewrite: "Rewrite for clarity.",
        translate: `Translate into ${targetLanguage || "Spanish"}.`,
        "fix-grammar": "Fix all grammar errors.",
      };
      const result = await generateJson({
        maxTokens: 4000,
        system: `Text editor. ${modes[mode] || modes.rewrite} Respond ONLY with: {"result": string}`,
        user: text,
      });
      return json(result);
    }

    // ---- Classroom endpoints (in-memory, serverless-safe) ----
    const classrooms = globalThis as any;
    if (!classrooms._rooms) classrooms._rooms = {};
    if (!classrooms._codeToId) classrooms._codeToId = {};

    if (path === "/api/classrooms" && req.method === "GET") {
      const rooms = Object.values(classrooms._rooms).filter((r: any) => r.isActive);
      return json(rooms.map((r: any) => ({
        id: r.id, title: r.title, subject: r.subject,
        teacherName: r.teacherName, participantCount: Object.keys(r.participants || {}).length, code: r.code,
      })));
    }

    if (path === "/api/classrooms" && req.method === "POST") {
      const body = await req.json();
      const { title, subject, teacherId, teacherName, scheduledAt } = body;
      if (!title || !subject || !teacherId || !teacherName) {
        return json({ error: "title, subject, teacherId, teacherName are required" }, 400);
      }
      const id = crypto.randomUUID();
      let code;
      do { code = Math.random().toString(36).substring(2, 8).toUpperCase(); } while (classrooms._codeToId[code]);
      const room = {
        id, code, title, subject, teacherId, teacherName,
        scheduledAt: scheduledAt || null,
        createdAt: new Date().toISOString(), isActive: true,
        isLocked: false, hasWaitingRoom: false,
        participants: {}, waitingRoom: {}, attendance: [], messages: [], files: [], breakoutRooms: [], recordings: [],
      };
      classrooms._rooms[id] = room;
      classrooms._codeToId[code] = id;
      return json({ id, code, title, subject, teacherName, scheduledAt: room.scheduledAt }, 201);
    }

    const classroomGetMatch = path.match(/^\/api\/classrooms\/([^/]+)$/);
    if (classroomGetMatch && req.method === "GET") {
      const room = classrooms._rooms[classroomGetMatch[1]];
      if (!room) return json({ error: "Room not found" }, 404);
      return json({
        id: room.id, code: room.code, title: room.title, subject: room.subject,
        teacherName: room.teacherName, scheduledAt: room.scheduledAt,
        isActive: room.isActive, participantCount: Object.keys(room.participants).length,
      });
    }

    const codeMatch = path.match(/^\/api\/classrooms\/code\/([^/]+)$/);
    if (codeMatch && req.method === "GET") {
      const code = codeMatch[1].toUpperCase();
      const roomId = classrooms._codeToId[code];
      const room = roomId && classrooms._rooms[roomId];
      if (!room) return json({ error: "Room not found" }, 404);
      if (!room.isActive) return json({ error: "Class has ended" }, 410);
      return json({ id: room.id, code: room.code, title: room.title, subject: room.subject, teacherName: room.teacherName });
    }

    // ---- Feedback endpoints ----
    if (path === "/api/feedback" && req.method === "POST") {
      const body = await req.json();
      if (!body.message?.trim()) return json({ error: "Message is required" }, 400);
      const fb = {
        id: crypto.randomUUID(), ...body,
        createdAt: new Date().toISOString(),
      };
      if (!classrooms._feedback) classrooms._feedback = [];
      classrooms._feedback.push(fb);
      return json({ success: true, id: fb.id }, 201);
    }

    if (path === "/api/feedback" && req.method === "GET") {
      return json(classrooms._feedback || []);
    }

    return json({ error: "Not found" }, 404);
  } catch (err: any) {
    if (err?.message === "AI_NOT_CONFIGURED") {
      return json({ error: "No AI provider configured. Set GROQ_API_KEY.", code: "AI_NOT_CONFIGURED" }, 503);
    }
    console.error("API error:", err);
    return json({ error: "Failed to generate content. Please try again." }, 500);
  }
};

export const config = {
  path: "/api/*",
};
