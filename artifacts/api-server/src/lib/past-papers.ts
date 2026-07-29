import { getDb } from "./db-sqlite";
import { papers, questions, questionFrequency, analysisCache } from "./schema-past-papers";
import { eq, like, sql, and, desc, asc } from "drizzle-orm";
import crypto from "node:crypto";

// ─── BOARD & SUBJECT CONSTANTS ───
export const BOARDS = [
  "Federal Board", "Punjab Board", "KPK Board", "Balochistan Board", "Sindh Board",
  "Lahore Board", "Rawalpindi Board", "Faisalabad Board", "Multan Board", "Gujranwala Board",
  "Bahawalpur Board", "Sargodha Board", "Sahiwal Board", "Dera Ghazi Khan Board",
  "Peshawar Board", "Abbottabad Board", "Swat Board", "Mardan Board",
  "Karachi Board", "Hyderabad Board", "Sukkur Board", "Larkana Board",
  "Quetta Board", "Turbat Board",
  "CSS", "MDCAT",
] as const;

export const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Urdu", "Computer Science", "Pakistani Studies", "Islamiat",
  "Economics", "Accounting", "Political Science", "Sociology",
  "History", "Geography", "Psychology", "Philosophy",
] as const;

export const GRADES = ["9th", "10th", "11th", "12th", "Intermediate", "Bachelor", "CSS", "MDCAT"] as const;
export const EXAM_TYPES = ["Annual", "Supplementary", "Midterm", "Model Paper", "Guess Paper"] as const;

// ─── TEXT NORMALIZATION ───
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "of", "in", "to", "for",
    "with", "on", "at", "from", "by", "about", "as", "into", "through",
    "during", "before", "after", "and", "or", "but", "if", "not", "no",
  ]);
  return normalizeText(text)
    .split(" ")
    .filter(w => w.length > 1 && !stopWords.has(w));
}

// ─── SIMILARITY SCORING ───
function cosineSimilarity(tokens1: string[], tokens2: string[]): number {
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();
  tokens1.forEach(t => freq1.set(t, (freq1.get(t) || 0) + 1));
  tokens2.forEach(t => freq2.set(t, (freq2.get(t) || 0) + 1));

  const allTokens = new Set([...freq1.keys(), ...freq2.keys()]);
  let dot = 0, mag1 = 0, mag2 = 0;
  for (const t of allTokens) {
    const v1 = freq1.get(t) || 0;
    const v2 = freq2.get(t) || 0;
    dot += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ─── SEMANTIC SEARCH ───
export interface SearchResult {
  questionId: number;
  paperId: number;
  questionText: string;
  questionType: string;
  marks: number;
  section: string | null;
  topics: string | null;
  difficulty: string | null;
  board: string;
  examType: string;
  year: number;
  subject: string;
  grade: string;
  classSection: string | null;
  score: number;
}

export function searchQuestions(params: {
  query: string;
  subject?: string;
  board?: string;
  yearFrom?: number;
  yearTo?: number;
  questionType?: string;
  limit?: number;
}): SearchResult[] {
  const db = getDb();
  const queryTokens = tokenize(params.query);
  const queryTokenSet = new Set(queryTokens);

  // Build WHERE conditions
  const conditions = [];
  if (params.subject) conditions.push(eq(papers.subject, params.subject));
  if (params.board) conditions.push(eq(papers.board, params.board));
  if (params.yearFrom) conditions.push(sql`${papers.year} >= ${params.yearFrom}`);
  if (params.yearTo) conditions.push(sql`${papers.year} <= ${params.yearTo}`);
  if (params.questionType) conditions.push(eq(questions.questionType, params.questionType));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch all matching questions
  const rows = db
    .select({
      questionId: questions.id,
      paperId: questions.paperId,
      questionText: questions.questionText,
      questionType: questions.questionType,
      marks: questions.marks,
      section: questions.section,
      topics: questions.topics,
      difficulty: questions.difficulty,
      board: papers.board,
      examType: papers.examType,
      year: papers.year,
      subject: papers.subject,
      grade: papers.grade,
      classSection: papers.classSection,
    })
    .from(questions)
    .innerJoin(papers, eq(questions.paperId, papers.id))
    .where(whereClause)
    .all();

  // Score each question
  const scored = rows.map(row => {
    const rowTokens = tokenize(row.questionText);
    const rowTokenSet = new Set(rowTokens);

    const cosSim = cosineSimilarity(queryTokens, rowTokens);
    const jaccSim = jaccardSimilarity(queryTokenSet, rowTokenSet);

    // Combined score: 60% cosine + 40% jaccard
    let score = cosSim * 0.6 + jaccSim * 0.4;

    // Exact substring match bonus
    if (row.questionText.toLowerCase().includes(params.query.toLowerCase())) {
      score = Math.min(1, score + 0.3);
    }

    // Topic match bonus
    if (row.topics) {
      const rowTopics = row.topics.toLowerCase().split(",").map((t: string) => t.trim());
      const topicMatches = queryTokens.filter(t => rowTopics.some((rt: string) => rt.includes(t)));
      score = Math.min(1, score + topicMatches.length * 0.05);
    }

    return { ...row, score };
  });

  // Sort by score, return top results
  return scored
    .filter(r => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit || 50);
}

// ─── EXACT MATCH SEARCH ───
export interface ExactMatchResult {
  questionId: number;
  paperId: number;
  questionText: string;
  questionType: string;
  marks: number;
  section: string | null;
  topics: string | null;
  difficulty: string | null;
  board: string;
  examType: string;
  year: number;
  subject: string;
  grade: string;
  classSection: string | null;
}

export function searchExactMatch(query: string): ExactMatchResult[] {
  const db = getDb();

  const rows = db
    .select({
      questionId: questions.id,
      paperId: questions.paperId,
      questionText: questions.questionText,
      questionType: questions.questionType,
      marks: questions.marks,
      section: questions.section,
      topics: questions.topics,
      difficulty: questions.difficulty,
      board: papers.board,
      examType: papers.examType,
      year: papers.year,
      subject: papers.subject,
      grade: papers.grade,
      classSection: papers.classSection,
    })
    .from(questions)
    .innerJoin(papers, eq(questions.paperId, papers.id))
    .where(sql`LOWER(${questions.questionText}) LIKE ${"%" + query.toLowerCase() + "%"}`)
    .all();

  return rows;
}

// ─── FREQUENCY ANALYSIS ───
export interface FrequencyResult {
  normalizedText: string;
  subject: string;
  board: string | null;
  count: number;
  years: number[];
  boards: string[];
  avgMarks: number;
  questionType: string | null;
  trend: "increasing" | "decreasing" | "stable";
}

export function analyzeFrequency(params: {
  query: string;
  subject?: string;
  board?: string;
}): FrequencyResult[] {
  const db = getDb();
  const queryTokens = tokenize(params.query);

  const conditions = [];
  if (params.subject) conditions.push(eq(questionFrequency.subject, params.subject));
  if (params.board) conditions.push(eq(questionFrequency.board, params.board));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = db
    .select()
    .from(questionFrequency)
    .where(whereClause)
    .all();

  return rows
    .map(row => {
      const rowTokens = tokenize(row.normalizedText);
      const sim = cosineSimilarity(queryTokens, rowTokens);

      const years = row.years ? JSON.parse(row.years) : [];
      const boards = row.boards ? JSON.parse(row.boards) : [];

      // Trend analysis
      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (years.length >= 2) {
        const sorted = [...years].sort((a: number, b: number) => a - b);
        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
        const avgFirst = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
        if (avgSecond > avgFirst + 0.5) trend = "increasing";
        else if (avgFirst > avgSecond + 0.5) trend = "decreasing";
      }

      return {
        ...row,
        years,
        boards,
        avgMarks: row.avgMarks || 0,
        _sim: sim,
        trend,
      };
    })
    .filter(r => r._sim > 0.1)
    .sort((a, b) => b._sim - a._sim || b.count - a.count)
    .slice(0, 20)
    .map(({ _sim, ...rest }) => rest);
}

// ─── GET PAPERS ───
export function getPapers(params: {
  board?: string;
  subject?: string;
  year?: number;
  limit?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (params.board) conditions.push(eq(papers.board, params.board));
  if (params.subject) conditions.push(eq(papers.subject, params.subject));
  if (params.year) conditions.push(eq(papers.year, params.year));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(papers)
    .where(whereClause)
    .orderBy(desc(papers.year))
    .limit(params.limit || 100)
    .all();
}

export function getPaperQuestions(paperId: number) {
  const db = getDb();
  return db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paperId))
    .orderBy(asc(questions.questionNumber))
    .all();
}

// ─── HASH FOR CACHING ───
function hashQuery(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}

export function getCachedAnalysis(query: string) {
  const db = getDb();
  const hash = hashQuery(query);
  const result = db
    .select()
    .from(analysisCache)
    .where(eq(analysisCache.queryHash, hash))
    .get();
  return result ? JSON.parse(result.resultJson) : null;
}

export function cacheAnalysis(query: string, result: any) {
  const db = getDb();
  const hash = hashQuery(query);
  try {
    db.run(sql`INSERT OR REPLACE INTO analysis_cache (query_hash, query_text, result_json) VALUES (${hash}, ${query}, ${JSON.stringify(result)})`);
  } catch { /* ignore cache errors */ }
}

export function getStats() {
  const db = getDb();
  const paperCount = db.select({ count: sql<number>`count(*)` }).from(papers).get()?.count || 0;
  const questionCount = db.select({ count: sql<number>`count(*)` }).from(questions).get()?.count || 0;
  const subjectCount = db.select({ count: sql<number>`count(distinct ${papers.subject})` }).from(papers).get()?.count || 0;
  const boardCount = db.select({ count: sql<number>`count(distinct ${papers.board})` }).from(papers).get()?.count || 0;
  const yearRange = db.select({
    min: sql<number>`min(${papers.year})`,
    max: sql<number>`max(${papers.year})`,
  }).from(papers).get();

  return { paperCount, questionCount, subjectCount, boardCount, yearRange };
}
