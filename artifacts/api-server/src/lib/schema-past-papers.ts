import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export const papers = sqliteTable("papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  board: text("board").notNull(),
  examType: text("exam_type").notNull(),
  year: integer("year").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  title: text("title").notNull(),
  source: text("source"),
  totalMarks: integer("total_marks"),
  duration: text("duration"),
  classSection: text("class_section"),
  createdAt: text("created_at").default("datetime('now')"),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: integer("paper_id").notNull().references(() => papers.id),
  questionNumber: integer("question_number").notNull(),
  section: text("section"),
  questionType: text("question_type").notNull(),
  marks: integer("marks").notNull(),
  questionText: text("question_text").notNull(),
  topics: text("topics"),
  difficulty: text("difficulty"),
});

export const questionFrequency = sqliteTable("question_frequency", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  normalizedText: text("normalized_text").notNull().unique(),
  subject: text("subject").notNull(),
  board: text("board"),
  count: integer("count").notNull().default(1),
  years: text("years"),
  boards: text("boards"),
  lastSeen: integer("last_seen"),
  firstSeen: integer("first_seen"),
  avgMarks: real("avg_marks"),
  questionType: text("question_type"),
});

export const analysisCache = sqliteTable("analysis_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryHash: text("query_hash").notNull().unique(),
  queryText: text("query_text").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: text("created_at").default("datetime('now')"),
});

type SchemaType = {
  papers: typeof papers;
  questions: typeof questions;
  questionFrequency: typeof questionFrequency;
  analysisCache: typeof analysisCache;
};

type DB = BetterSQLite3Database<SchemaType>;

export function initializeDb(db: DB) {
  db.run(/* sql */ `
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      year INTEGER NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT,
      total_marks INTEGER,
      duration TEXT,
      class_section TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(/* sql */ `
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL REFERENCES papers(id),
      question_number INTEGER NOT NULL,
      section TEXT,
      question_type TEXT NOT NULL,
      marks INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      topics TEXT,
      difficulty TEXT
    )
  `);

  db.run(/* sql */ `
    CREATE TABLE IF NOT EXISTS question_frequency (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      normalized_text TEXT NOT NULL UNIQUE,
      subject TEXT NOT NULL,
      board TEXT,
      count INTEGER NOT NULL DEFAULT 1,
      years TEXT,
      boards TEXT,
      last_seen INTEGER,
      first_seen INTEGER,
      avg_marks REAL,
      question_type TEXT
    )
  `);

  db.run(/* sql */ `
    CREATE TABLE IF NOT EXISTS analysis_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_hash TEXT NOT NULL UNIQUE,
      query_text TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_papers_board ON papers(board)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_papers_subject ON papers(subject)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON questions(paper_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_freq_subject ON question_frequency(subject)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_freq_count ON question_frequency(count)`);
}
