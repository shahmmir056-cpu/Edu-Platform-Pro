import { Router, type IRouter, type Request, type Response } from "express";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.FEEDBACK_DIR || path.resolve(__dirname, "../../data");
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

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be a number between 1 and 5." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      res.status(400).json({ error: "Invalid email format." });
      return;
    }

    const VALID_CATEGORIES = ["bug", "feature", "ux", "ai-quality", "general"];
    const cleanCat = String(category || "general").trim().toLowerCase();
    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim(),
      rating,
      category: VALID_CATEGORIES.includes(cleanCat) ? cleanCat : "general",
      message: String(message).trim(),
      page: page ? String(page).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    logger.info({ id: entry.id, category, rating, dataDir: DATA_DIR }, "Saving feedback");

    const all = await readFeedback();
    all.push(entry);
    await writeFeedback(all);

    logger.info({ id: entry.id, category, rating }, "Feedback submitted");
    res.json({ success: true, id: entry.id });
  } catch (err) {
    logger.error({ err, dataDir: DATA_DIR }, "Failed to save feedback");
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
