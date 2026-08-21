import { Router, type IRouter, type Request, type Response } from "express";
import {
  GenerateResearchBody,
  GenerateResearchResponse,
  GenerateEssayBody,
  GenerateEssayResponse,
  GenerateQuizBody,
  GenerateQuizResponse,
  GenerateFlashcardsBody,
  GenerateFlashcardsResponse,
  GenerateStudyNotesBody,
  GenerateStudyNotesResponse,
  GeneratePresentationBody,
  GeneratePresentationResponse,
  TransformTextBody,
  TransformTextResponse,
  SolveMathBody,
  SolveMathResponse,
} from "@workspace/api-zod";
import { generateJson, AiNotConfiguredError } from "../lib/ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

function isGibberish(text: string, isMath = false): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (isMath) {
    const hasLetter = /[a-zA-Z]/.test(trimmed);
    const hasDigit = /\d/.test(trimmed);
    const hasOperator = /[+\-*/^=<>]/.test(trimmed);
    if (!hasLetter && !hasDigit) return true;
    if (hasDigit || hasOperator || hasLetter) return false;
  }
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (alphaOnly.length < 2) return true;
  const alphaRatio = alphaOnly.length / trimmed.length;
  if (alphaRatio < 0.4) return true;
  const lower = alphaOnly.toLowerCase();
  const vowels = lower.replace(/[^aeiou]/g, "").length;
  const vowelRatio = vowels / alphaOnly.length;
  if (vowelRatio < 0.05) return true;
  if (trimmed.length <= 4 && vowelRatio > 0.85) {
    const consonants = alphaOnly.replace(/[aeiouAEIOU]/g, "");
    if (consonants.length === 0) return false;
  }
  if (vowelRatio > 0.95) return true;
  const consonantClusters = lower.match(/[^aeiou]{5,}/g);
  if (consonantClusters && consonantClusters.length > 0) return true;
  const words = trimmed.split(/\s+/);
  const longWords = words.filter((w) => w.replace(/[^a-zA-Z]/g, "").length >= 4);
  if (words.length >= 3 && longWords.length === 0) return true;
  const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const lowerTrimmed = trimmed.toLowerCase().replace(/[^a-z]/g, "");
  if (lowerTrimmed.length >= 4) {
    for (const row of keyboardRows) {
      for (let i = 0; i <= row.length - 4; i++) {
        if (lowerTrimmed.includes(row.substring(i, i + 4))) return true;
      }
    }
  }
  return false;
}

function validateTextInput(value: string, fieldName: string, isMath = false): void {
  if (isGibberish(value, isMath)) {
    throw new InputValidationError(`Please enter a valid ${fieldName}. Your input appears to be gibberish or random characters.`);
  }
}

function aiRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        res.status(503).json({ error: err.message, code: "AI_NOT_CONFIGURED" });
        return;
      }
      if (err instanceof InputValidationError) {
        res.status(400).json({ error: err.message, code: "INVALID_INPUT" });
        return;
      }
      logger.error({ err }, "AI tool request failed");
      res.status(500).json({ error: "Failed to generate content. Please try again." });
    }
  };
}

router.post(
  "/ai-tools/research",
  aiRoute(async (req, res) => {
    const input = GenerateResearchBody.parse(req.body);
    validateTextInput(input.topic, "research topic");
    const depth = input.depth ?? "standard";
    const sectionCount = depth === "overview" ? 3 : depth === "deep" ? 6 : 4;
    const result = await generateJson<unknown>({
      maxTokens: depth === "deep" ? 6000 : 4000,
      system:
        "You are a meticulous research assistant helping a student build a well-sourced study report. " +
        "Write in clear, confident prose, organized into sections. You cannot browse the web, so synthesize " +
        "from your own knowledge and be explicit about the kinds of primary sources a student should seek out " +
        "(do not invent fake URLs or fake citations). Respond ONLY with a single JSON object matching this shape: " +
        '{"title": string, "summary": string, "sections": [{"heading": string, "content": string}], ' +
        '"keyTakeaways": string[], "furtherQuestions": string[], "suggestedSources": [{"title": string, "note": string}]}',
      user: `Research topic: "${input.topic}"\nDepth: ${depth}\nWrite exactly ${sectionCount} sections, each 2-4 paragraphs. Include 3-5 keyTakeaways, 3-5 furtherQuestions, and 3-5 suggestedSources describing the TYPE of source to look for (e.g. "peer-reviewed meta-analysis on X", "primary historical document from Y era") with a short note on why it's useful -- not fabricated links.`,
    });
    res.json(GenerateResearchResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/essay",
  aiRoute(async (req, res) => {
    const input = GenerateEssayBody.parse(req.body);
    validateTextInput(input.topic, "essay topic");
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        "You are an excellent student writer. Write a clear, well-structured essay. " +
        'Return ONLY a JSON object: {"title": string, "outline": string[], "body": string, "wordCount": number}. ' +
        "body is the full essay as plain text with paragraphs separated by \\n\\n. wordCount is the actual word count.",
      user: `Topic: "${input.topic}"\nEssay type: ${input.essayType}\nTarget length: ${input.wordCount} words${input.tone ? `\nTone: ${input.tone}` : ""}\nProvide a 4-7 point outline, then the full essay body matching the target length as closely as possible.`,
    });
    res.json(GenerateEssayResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/quiz",
  aiRoute(async (req, res) => {
    const input = GenerateQuizBody.parse(req.body);
    validateTextInput(input.topic, "quiz topic");
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        "You are a subject-matter expert writing a fair, well-calibrated multiple-choice quiz for a student. " +
        "Each question must have exactly 4 options, exactly one correct, with plausible distractors and a short " +
        'explanation of the correct answer. Respond ONLY with a single valid JSON object: {"title": string, "questions": [{"question": string, ' +
        '"options": string[4], "correctIndex": number (0-3), "explanation": string}]}',
      user: `Topic: "${input.topic}"\nNumber of questions: ${input.numQuestions}\nDifficulty: ${input.difficulty}`,
    });
    res.json(GenerateQuizResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/flashcards",
  aiRoute(async (req, res) => {
    const input = GenerateFlashcardsBody.parse(req.body);
    validateTextInput(input.topic, "flashcard topic");
    const result = await generateJson<unknown>({
      maxTokens: 6000,
      system:
        "You create effective study flashcards: short, unambiguous prompts on the front and precise, memorable " +
        'answers on the back. Respond ONLY with a single valid JSON object: {"title": string, "cards": [{"front": string, "back": string}]}',
      user: `Topic: "${input.topic}"\nNumber of cards: ${input.numCards}\nCover the most important concepts, terms, and facts a student would need to know.`,
    });
    res.json(GenerateFlashcardsResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/study-notes",
  aiRoute(async (req, res) => {
    const input = GenerateStudyNotesBody.parse(req.body);
    validateTextInput(input.topic, "study notes topic");
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        "You create clear, well-organized study notes a student could use to review for an exam. " +
        'Respond ONLY with a single valid JSON object: {"title": string, "sections": [{"heading": string, "bullets": string[]}], ' +
        '"keyTerms": [{"term": string, "definition": string}]}',
      user: `Topic: "${input.topic}"\nOrganize into 4-6 sections with concise bullet points (not full paragraphs), plus a glossary of 5-10 key terms.`,
    });
    res.json(GenerateStudyNotesResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/presentation",
  aiRoute(async (req, res) => {
    const input = GeneratePresentationBody.parse(req.body);
    validateTextInput(input.topic, "presentation topic");
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        "You are an expert presentation designer. Create a slide-by-slide outline: concise on-slide bullets " +
        "(never full paragraphs) plus detailed speaker notes for what to actually say. " +
        'Respond ONLY with a single valid JSON object: {"title": string, "slides": [{"title": string, "bullets": string[], "speakerNotes": string}]}',
      user: `Topic: "${input.topic}"\nNumber of slides: ${input.numSlides}\nInclude a title slide and a closing/summary slide within the count. Bullets should be short phrases, 3-5 per slide.`,
    });
    res.json(GeneratePresentationResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/math-solver",
  aiRoute(async (req, res) => {
    const input = SolveMathBody.parse(req.body);
    validateTextInput(input.problem, "math problem", true);
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        "You are a patient, precise math tutor. Solve the given problem by breaking it into small, clearly " +
        "explained steps a student can follow -- never skip algebraic manipulations. Use plain text for math " +
        "(e.g. x^2, sqrt(x), 3/4, integral, not LaTeX). Respond ONLY with a single valid JSON object matching " +
        'this shape: {"restatedProblem": string, "topic": string, "steps": [{"title": string, "explanation": string, ' +
        '"expression": string}], "finalAnswer": string, "checkNote": string}. Include 3-8 steps depending on complexity.',
      user: `Solve this math problem step by step: ${input.problem}`,
    });
    res.json(SolveMathResponse.parse(result));
  }),
);

router.post(
  "/ai-tools/text-playground",
  aiRoute(async (req, res) => {
    const input = TransformTextBody.parse(req.body);
    validateTextInput(input.text, "text input");
    const modeInstructions: Record<string, string> = {
      summarize: "Summarize the text concisely while preserving all key points.",
      expand: "Expand the text with more detail, examples, and explanation while keeping the original meaning.",
      simplify: "Rewrite the text in simpler language, suitable for a younger or less specialized reader.",
      rewrite: "Rewrite the text to improve clarity and flow while preserving its meaning.",
      translate: `Translate the text into ${input.targetLanguage ?? "Spanish"}, preserving tone and meaning.`,
      "fix-grammar": "Fix all grammar, spelling, and punctuation errors without changing the meaning or style.",
    };
    const result = await generateJson<unknown>({
      maxTokens: 4000,
      system:
        `You are a precise text-editing assistant. ${modeInstructions[input.mode]} ` +
        'Respond ONLY with a single valid JSON object: {"result": string} containing the transformed text, nothing else.',
      user: input.text,
    });
    res.json(TransformTextResponse.parse(result));
  }),
);

export default router;
