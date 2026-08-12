export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

/* ═══════════════════════════════════════════════════
   Prompt / user-text validation
   Prevents wasting AI calls on keyboard-mash input like
   "qqqqqfdjdfhh", "1232dmsnds", "#@!@#".
   ═══════════════════════════════════════════════════ */

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// QWERTY keyboard rows — catches roll-mash like "asdfghjkl" / "qwerty" / "zxcvbnm".
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const KEYBOARD_ROW_OF: Record<string, number> = {};
for (let i = 0; i < KEYBOARD_ROWS.length; i++) {
  for (const c of KEYBOARD_ROWS[i]) KEYBOARD_ROW_OF[c] = i;
}

// Common English + school/STEM vocabulary. Letter-only text long enough to
// carry meaning must contain at least one of these words, otherwise it's
// treated as meaningless keyboard-mash.
const COMMON_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "so", "for", "with", "without", "about",
  "above", "across", "after", "against", "along", "among", "around", "before", "behind",
  "below", "beneath", "beside", "between", "beyond", "during", "inside", "into", "near",
  "onto", "outside", "over", "through", "under", "until", "within", "from", "by", "at",
  "in", "on", "of", "to", "up", "down", "off", "out", "upon",
  "you", "your", "yours", "i", "my", "me", "we", "our", "us", "he", "him", "his", "she",
  "her", "hers", "it", "its", "they", "them", "their", "theirs", "who", "whom", "whose",
  "what", "which", "when", "where", "why", "how", "this", "that", "these", "those",
  "there", "here", "everyone", "everybody", "everything", "someone", "somebody",
  "something", "anyone", "anybody", "anything", "nobody", "nothing", "each", "every",
  "both", "either", "neither", "some", "any", "all", "none", "other", "another",
  "many", "much", "more", "most", "few", "fewer", "little", "less", "least", "several",
  "do", "does", "did", "done", "have", "has", "had", "having", "is", "are", "was",
  "were", "been", "being", "be", "am", "will", "would", "shall", "should", "can",
  "could", "may", "might", "must", "not", "no", "yes", "well", "also", "still", "even",
  "only", "just", "very", "too", "again", "already", "never", "always", "often",
  "sometimes", "usually", "then", "now", "today", "tomorrow", "yesterday", "soon",
  "early", "late", "once", "first", "second", "third", "last", "next", "one", "two",
  "three", "four", "five", "six", "seven", "eight", "nine", "ten", "zero", "hundred",
  "thousand", "million", "billion",
  "what", "how", "why", "who", "when", "where", "which",
  "hello", "hi", "hey", "thanks", "please", "thank",
  "explain", "describe", "compare", "contrast", "write", "solve", "create", "generate",
  "help", "make", "list", "give", "tell", "show", "define", "summarize", "simplify",
  "translate", "rewrite", "expand", "answer", "find", "calculate", "determine",
  "compute", "state", "discuss", "analyze", "examine", "evaluate", "justify", "propose",
  "outline", "draft", "edit", "review", "check", "understand", "learn", "study", "teach",
  "know", "think", "want", "need", "ask", "take", "build", "design", "draw", "read",
  "write", "speak", "type", "search", "play", "work", "move", "start", "stop", "open",
  "close", "add", "remove", "include", "exclude", "change", "improve", "reduce",
  "increase", "decrease", "measure", "count", "order", "sort", "match", "label",
  "identify", "classify", "predict", "observe", "infer", "conclude", "report", "present",
  "prepare", "practice", "revise", "memorize", "recall", "remember", "focus",
  "concentrate", "manage", "organize", "plan", "schedule", "choose", "select", "decide",
  "recommend", "suggest", "offer", "provide", "produce", "publish", "download",
  "upload", "save", "delete", "copy", "paste", "submit", "cancel", "continue",
  "finish", "complete", "achieve", "improve", "learn", "practice",
  "word", "book", "school", "student", "teacher", "class", "lesson", "subject",
  "science", "math", "maths", "mathematics", "history", "english", "geography",
  "physics", "chemistry", "biology", "grammar", "vocabulary", "spelling", "reading",
  "writing", "speaking", "listening", "language", "literature", "novel", "poem",
  "poetry", "essay", "story", "fiction", "nonfiction", "author", "character", "plot",
  "theme", "setting", "metaphor", "symbol", "imagery", "drama", "theater", "theatre",
  "play", "act", "scene", "dialogue", "comedy", "tragedy", "biography", "narrative",
  "sentence", "paragraph", "noun", "verb", "adjective", "adverb", "pronoun",
  "preposition", "conjunction", "punctuation", "letter", "syllable", "rhyme", "meter",
  "exam", "exams", "test", "tests", "quiz", "quizzes", "grade", "score", "homework",
  "project", "assignment", "deadline", "professor", "scholar", "textbook", "notebook",
  "pencil", "paper", "computer", "laptop", "phone", "internet", "website",
  "topic", "example", "idea", "concept", "theory", "fact", "reason", "result",
  "method", "approach", "technique", "skill", "knowledge", "understanding",
  "education", "university", "college", "library", "lab", "classroom", "lesson",
  "energy", "power", "force", "motion", "speed", "velocity", "mass", "weight",
  "volume", "pressure", "temperature", "heat", "light", "sound", "wave", "frequency",
  "gravity", "magnet", "electric", "electricity", "current", "circuit", "voltage",
  "cell", "cells", "molecule", "molecules", "atom", "atoms", "element", "compound",
  "mixture", "reaction", "chemical", "chemistry", "acid", "base", "salt", "gas",
  "solid", "liquid", "growth", "oxygen", "nitrogen", "hydrogen", "carbon", "dioxide",
  "glucose", "photosynthesis", "respiration", "enzyme", "enzymes", "protein",
  "proteins", "bacteria", "virus", "fungus", "fungi", "dna", "rna", "gene", "genes",
  "chromosome", "chromosomes", "mutation", "evolution", "ecosystem", "ecosystems",
  "habitat", "environment", "climate", "weather", "forest", "ocean", "river",
  "mountain", "desert", "population", "community", "organism", "organisms",
  "structure", "function", "process", "development", "reproduction", "digestion",
  "circulation", "nervous", "immune", "hormone", "hormones", "vitamin", "vitamins",
  "mineral", "minerals", "nutrient", "nutrients", "plant", "plants", "animal",
  "animals", "insect", "insects", "bird", "birds", "fish", "mammal", "mammals",
  "species", "selection", "adaptation", "fossil", "fossils", "rock", "rocks",
  "earthquake", "volcano", "volcanoes", "plate", "tectonic", "astronomy", "universe",
  "galaxy", "galaxies", "star", "stars", "planet", "planets", "moon", "sun", "solar",
  "orbit", "space", "rocket", "satellite", "comet", "asteroid", "exploration",
  "technology", "computer", "software", "hardware", "program", "code", "data",
  "network", "digital", "machine", "robot", "artificial", "intelligence", "engineer",
  "engineering", "design", "model", "algorithm", "function", "variable", "equation",
  "equations", "derivative", "integral", "calculus", "algebra", "geometry",
  "trigonometry", "probability", "statistics", "fraction", "fractions", "decimal",
  "decimals", "percent", "percentage", "ratio", "proportion", "angle", "triangle",
  "circle", "square", "rectangle", "polygon", "graph", "axis", "coordinate",
  "vector", "matrix", "theorem", "proof", "prime", "integer", "integers", "positive",
  "negative", "infinite", "infinity", "pi", "formula", "expression", "factor",
  "root", "square", "cube", "degree", "radian", "measurement", "measurements",
  "unit", "metric", "meter", "liter", "kilogram", "second", "length", "width",
  "height", "area", "circumference", "diameter", "radius", "perimeter", "numerator",
  "denominator", "sum", "difference", "product", "quotient", "divide", "multiply",
  "subtract", "add", "plus", "minus", "times", "equals", "equal", "greater", "smaller",
  "average", "mean", "median", "mode", "range", "deviation", "random", "sample",
  "country", "countries", "city", "cities", "state", "government", "business",
  "money", "food", "water", "world", "earth", "life", "time", "day", "days", "year",
  "years", "week", "weeks", "month", "months", "hour", "hours", "minute", "minutes",
  "number", "numbers", "part", "place", "group", "people", "person", "man", "woman",
  "child", "children", "family", "friend", "friends", "home", "culture", "society",
  "politics", "political", "election", "president", "war", "peace", "treaty",
  "history", "civilization", "ancient", "medieval", "modern", "industrial",
  "revolution", "empire", "kingdom", "religion", "language", "tradition", "custom",
  "festival", "holiday", "economy", "economic", "industry", "agriculture", "transport",
  "transportation", "medicine", "health", "nutrition", "exercise", "sport", "sports",
  "game", "team", "player", "competition", "champion", "victory", "defeat", "success",
  "failure", "opportunity", "challenge", "goal", "strategy", "decision", "opinion",
  "view", "argument", "evidence", "claim", "counterargument", "thesis", "introduction",
  "conclusion", "citation", "source", "reference", "bibliography", "research",
  "experiment", "hypothesis", "observation", "variable", "control", "trial", "chart",
  "table", "diagram", "simulation", "investigation", "asia", "africa", "europe",
  "america", "australia", "north", "south", "east", "west", "coast", "border",
  "region", "capital", "paris", "london", "berlin", "madrid", "rome", "moscow",
  "beijing", "tokyo", "delhi", "cairo", "sydney", "france", "french", "germany",
  "italy", "spain", "china", "chinese", "japan", "japanese", "india", "indian",
  "brazil", "canada", "england", "russia", "mexico", "egypt", "greece", "turkey",
  "panda", "tiger", "lion", "eagle", "whale", "dolphin", "snake", "turtle", "rabbit",
  "elephant", "giraffe", "zebra", "monkey", "gorilla", "penguin", "crocodile",
  "shark", "salmon", "tuna", "horse", "sheep", "goat", "cow", "pig", "chicken",
  "duck", "goose", "cat", "dog", "frog", "toad", "lizard", "butterfly", "moth",
  "spider", "ant", "bee", "worm", "apple", "banana", "orange", "grape", "mango",
  "wheat", "rice", "corn", "cotton", "flower", "flowers", "tree", "trees", "leaf",
  "leaves", "root", "seed", "seeds", "soil", "farm", "farmer", "crop", "crops",
  "quantum", "relativity", "thermodynamics", "electromagnetism", "gravitation",
  "assassin", "assassination", "assassinated", "periodic", "cellular",
  "entropy", "photon", "neutron", "electron", "proton", "isotope", "nucleus",
  "membrane", "cytoplasm", "nucleus", "mitochondria", "chloroplast", "tissue",
  "tissues", "organ", "organs", "heart", "brain", "blood", "bone", "muscle",
  "muscles", "skin", "eye", "eyes", "ear", "ears", "lung", "lungs", "kidney",
  "kidneys", "liver", "stomach", "intestine", "nerves", "neurons", "synapse",
  "digestion", "immune", "hormone", "adrenal", "thyroid", "pituitary", "insulin",
  "enzyme", "antibody", "antibodies", "vaccine", "disease", "diseases", "infection",
  "symptom", "symptoms", "treatment", "surgery", "genetic", "hereditary", "trait",
  "traits", "phenotype", "genotype", "dominant", "recessive", "mitosis", "meiosis",
]);

// A prompt is considered meaningful when it contains at least one word from
// the list above (with light plural handling), so pure keyboard-mash like
// "asdfghjkl" or "qwerty" never reaches the AI.
function hasDictionaryWord(raw: string): boolean {
  const tokens = raw.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  for (const token of tokens) {
    if (COMMON_WORDS.has(token)) return true;
    if (token.length > 3) {
      const t = token.endsWith("ies")
        ? token.slice(0, -3) + "y"
        : token.endsWith("es")
          ? token.slice(0, -2)
          : token.endsWith("s") && !token.endsWith("ss")
            ? token.slice(0, -1)
            : token;
      if (COMMON_WORDS.has(t)) return true;
    }
  }
  return false;
}

// Catches QWERTY roll-mash ("asdfghjkl", "qwertyuiop", "zxcvbnm"). Checked
// per-word so natural sentences never trip it; the threshold is high enough
// that real words like "assassination" are unaffected.
function isKeyboardRoll(raw: string): boolean {
  const words = raw.toLowerCase().split(/[^a-z]+/);
  for (const word of words) {
    if (word.length < 5) continue;
    let run = 1;
    for (let i = 1; i < word.length; i++) {
      run = KEYBOARD_ROW_OF[word[i]] === KEYBOARD_ROW_OF[word[i - 1]] ? run + 1 : 1;
      if (run >= 7) return true;
    }
  }
  return false;
}

const GIBBERISH_MESSAGE =
  "Please enter a clear, meaningful question or topic — e.g. 'Explain photosynthesis' or 'Write an essay on climate change'. Random or incomplete text (like 'qqqq', 'asdfghjkl' or '#@!@#') won't generate any content.";

export function validatePromptText(text: string): string | null {
  if (!text) return null;
  const raw = text.trim();
  if (raw.length < 3) return null;

  const asciiLetters = raw.match(/[a-z]/gi);
  const unicodeLetters = raw.match(/\p{L}/gu);
  const digits = raw.match(/[0-9]/g);
  const asciiCount = asciiLetters ? asciiLetters.length : 0;
  const unicodeCount = unicodeLetters ? unicodeLetters.length : 0;
  const digitCount = digits ? digits.length : 0;
  const whitespaceCount = (raw.match(/\s/g) || []).length;
  const symbolCount = raw.length - unicodeCount - digitCount - whitespaceCount;

  // Symbols/emoji only, nothing that looks like writing -> gibberish ("#@!@#", "🔥🔥🔥")
  if (unicodeCount === 0 && digitCount === 0) {
    return GIBBERISH_MESSAGE;
  }

  // Non-Latin scripts (CJK, Cyrillic, Devanagari, ...) and short math runs
  // like "2+2" have no ASCII letters, so the heuristics below don't apply.
  if (asciiCount === 0) {
    return null;
  }

  const letterArr = (asciiLetters || []).map((c) => c.toLowerCase());
  const totalAlpha = letterArr.length;

  // Keyboard roll-mash ("qwerty", "asdfghjkl", "zxcvbnm")
  if (isKeyboardRoll(raw)) {
    return GIBBERISH_MESSAGE;
  }

  // Repeated-character dominance: one letter > 40% of letters ("qqqqqfdjdfhh")
  if (totalAlpha >= 5) {
    const counts: Record<string, number> = {};
    for (const c of letterArr) counts[c] = (counts[c] || 0) + 1;
    const maxFreq = Math.max(...Object.values(counts));
    if (maxFreq / totalAlpha > 0.4) {
      return GIBBERISH_MESSAGE;
    }
  }

  // Low vowel ratio among enough letters -> consonant mash ("dmsnds")
  if (totalAlpha >= 5) {
    const vowelCount = letterArr.filter((c) => VOWELS.has(c)).length;
    if (vowelCount / totalAlpha < 0.1) {
      return GIBBERISH_MESSAGE;
    }
  }

  // Symbol/digit dominance with letters present -> "1232dmsnds"-style mash
  if (totalAlpha >= 4) {
    const nonLetterRatio = (symbolCount + digitCount) / raw.length;
    if (nonLetterRatio > 0.55) {
      return GIBBERISH_MESSAGE;
    }
  }

  // Meaning check: letter-heavy text must contain at least one real word, so
  // keyboard-mash like "asdfghjkl" is rejected. Code-like input (4+ symbols)
  // skips this so snippets still work in tools like text playground.
  if (totalAlpha >= 5 && symbolCount < 4 && !hasDictionaryWord(raw)) {
    return GIBBERISH_MESSAGE;
  }

  return null;
}

const TEXT_KEYS = new Set([
  "topic",
  "question",
  "prompt",
  "text",
  "subject",
  "message",
  "content",
  "input",
  "query",
  "statement",
  "title",
]);

function validateRequestBody(url: string, body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (TEXT_KEYS.has(key.toLowerCase())) {
      const msg = validatePromptText(String(obj[key] ?? ""));
      if (msg) return msg;
    }
  }
  return null;
}

export { GIBBERISH_MESSAGE };

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestInfo = { method, url: resolveUrl(input) };

  // Reject gibberish / inappropriate input for AI-tool endpoints before
  // hitting the network, so users get immediate, clear feedback. Math Solver
  // is intentionally exempt: expressions like "2x + 5 = 17" or "derivative of
  // 3x^2" look odd to plain-text heuristics but are perfectly valid input.
  if (method === "POST" && init.body && typeof init.body === "string") {
    const reqUrl = requestInfo.url;
    const isAiTool =
      (reqUrl.includes("/api/ai-tools/") && !reqUrl.includes("/api/ai-tools/math-solver")) ||
      reqUrl.includes("/api/test-conductor/") ||
      reqUrl.includes("/api/debate-mentor");
    if (isAiTool) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(init.body);
      } catch {
        parsed = null;
      }
      if (parsed) {
        const msg = validateRequestBody(reqUrl, parsed);
        if (msg) {
          const e: Error & { status: number; name: string } = Object.assign(new Error(msg), {
            name: "ValidationError",
            status: 422,
          });
          throw e;
        }
      }
    }
  }

  const response = await fetch(input, { ...init, method, headers });

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  return (await parseSuccessBody(response, responseType, requestInfo)) as T;
}
