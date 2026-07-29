import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { papers, questions, questionFrequency, analysisCache, initializeDb } from "./schema-past-papers";
import path from "node:path";
import fs from "node:fs";

const schema = { papers, questions, questionFrequency, analysisCache };

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "past-papers.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  initializeDb(db as any);
  return db;
}

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
