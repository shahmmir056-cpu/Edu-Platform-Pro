import { Router, type IRouter, type Request, type Response } from "express";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DATA_DIR = path.resolve(import.meta.dirname ?? process.cwd(), "../../data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

interface FeedbackEntry {
  id: string;
  name: string;
  email: string;
  rating: number;
  category: string;
  message: string;
  page?: string;
  createdAt: string;
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function readFeedback(): Promise<FeedbackEntry[]> {
  try {
    await ensureDataDir();
    if (!existsSync(FEEDBACK_FILE)) return [];
    const raw = await readFile(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeFeedback(entries: FeedbackEntry[]) {
  await ensureDataDir();
  await writeFile(FEEDBACK_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

router.post("/feedback", async (req: Request, res: Response) => {
  try {
    const { name, email, rating, category, message, page } = req.body as Partial<FeedbackEntry>;

    if (!name || !email || !rating || !message) {
      res.status(400).json({ error: "Name, email, rating, and message are required." });
      return;
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be a number between 1 and 5." });
      return;
    }

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim(),
      rating,
      category: String(category || "general").trim(),
      message: String(message).trim(),
      page: page ? String(page).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    const all = await readFeedback();
    all.push(entry);
    await writeFeedback(all);

    logger.info({ id: entry.id, category, rating }, "Feedback submitted");
    res.json({ success: true, id: entry.id });
  } catch (err) {
    logger.error({ err }, "Failed to save feedback");
    res.status(500).json({ error: "Failed to save feedback. Please try again." });
  }
});

router.get("/feedback", async (_req: Request, res: Response) => {
  try {
    const all = await readFeedback();
    res.json({ count: all.length, entries: all.slice(-50).reverse() });
  } catch (err) {
    logger.error({ err }, "Failed to read feedback");
    res.status(500).json({ error: "Failed to read feedback." });
  }
});

export default router;
