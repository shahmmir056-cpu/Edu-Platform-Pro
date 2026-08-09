/* ------------------------------------------------------------------ */
/* Math expression engine: tokenizer, parser, evaluator, and          */
/* higher-level numeric tools (root finding, statistics, matrices).   */
/* ------------------------------------------------------------------ */

export type Token =
  | { type: "num"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: string }
  | { type: "lp" }
  | { type: "rp" };

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  log: Math.log10,
  ln: Math.log,
  abs: Math.abs,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
};

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[\d.]/.test(c)) {
      let num = "";
      while (i < src.length && /[\d.]/.test(src[i])) {
        num += src[i];
        i++;
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Zπ]/.test(c)) {
      let ident = "";
      while (i < src.length && /[a-zA-Z0-9_π]/.test(src[i])) {
        ident += src[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }
    if ("+-*/^".includes(c) || c === "×" || c === "÷") {
      tokens.push({
        type: "op",
        value: c === "×" ? "*" : c === "÷" ? "/" : c,
      });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ type: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rp" });
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

function preprocess(src: string): string {
  let s = src.replace(/\s+/g, "");
  s = s.replace(/(\d)%/g, "$1/100");
  s = s.replace(/(\d)(?=[a-zA-Z(])/g, "$1*");
  s = s.replace(/\)(?=[a-zA-Z0-9(])/g, ")*");
  s = s.replace(/(?<=[x])(?=[a-zA-Z(])/g, "*");
  return s;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private expect(type: Token["type"]): Token {
    const t = this.peek();
    if (!t || t.type !== type) {
      throw new Error("Unexpected token");
    }
    return this.next() as Token;
  }

  parse(): (x: number) => number {
    const fn = this.expression();
    if (this.peek()) {
      throw new Error("Unexpected trailing tokens");
    }
    return fn;
  }

  private expression(): (x: number) => number {
    let left = this.term();
    while (true) {
      const t = this.peek();
      if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) break;
      const op = (this.next() as Token & { value: string }).value;
      const right = this.term();
      const l = left;
      left =
        op === "+" ? (x) => l(x) + right(x) : (x) => l(x) - right(x);
    }
    return left;
  }

  private term(): (x: number) => number {
    let left = this.factor();
    while (true) {
      const t = this.peek();
      if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) break;
      const op = (this.next() as Token & { value: string }).value;
      const right = this.factor();
      const l = left;
      left =
        op === "*" ? (x) => l(x) * right(x) : (x) => l(x) / right(x);
    }
    return left;
  }

  private factor(): (x: number) => number {
    const base = this.unary();
    const t = this.peek();
    if (t && t.type === "op" && t.value === "^") {
      this.next();
      const exp = this.factor();
      const b = base;
      return (x) => Math.pow(b(x), exp(x));
    }
    return base;
  }

  private unary(): (x: number) => number {
    const t = this.peek();
    if (t && t.type === "op" && t.value === "-") {
      this.next();
      const inner = this.unary();
      return (x) => -inner(x);
    }
    return this.primary();
  }

  private primary(): (x: number) => number {
    const t = this.next();
    if (!t) {
      throw new Error("Unexpected end of expression");
    }
    if (t.type === "num") {
      return () => t.value;
    }
    if (t.type === "ident") {
      if (t.value === "x") return (x) => x;
      if (t.value === "pi" || t.value === "π") return () => Math.PI;
      if (t.value === "e") return () => Math.E;
      if (this.peek()?.type === "lp") {
        this.next();
        const inner = this.expression();
        this.expect("rp");
        const fn = FUNCS[t.value.toLowerCase()];
        if (!fn) {
          throw new Error(`Unknown function "${t.value}"`);
        }
        return (x) => fn(inner(x));
      }
      throw new Error(`Unknown symbol "${t.value}"`);
    }
    if (t.type === "lp") {
      const inner = this.expression();
      this.expect("rp");
      return inner;
    }
    throw new Error("Invalid expression");
  }
}

export function compileFunction(expr: string): (x: number) => number {
  const tokens = tokenize(preprocess(expr));
  if (tokens.length === 0) {
    throw new Error("Empty expression");
  }
  return new Parser(tokens).parse();
}

/** Evaluate a compiled function safely; returns null when undefined/infinite. */
export function safeEval(fn: (x: number) => number, x: number): number | null {
  try {
    const y = fn(x);
    return Number.isFinite(y) && Math.abs(y) < 1e9 ? y : null;
  } catch {
    return null;
  }
}

/** Evaluate a raw expression string at x; throws on syntax errors. */
export function evalAt(expr: string, x: number): number {
  return compileFunction(expr)(x);
}

export function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  if (Math.abs(n) >= 1e6 || Math.abs(n) < 1e-4) return n.toExponential(4);
  return String(Number(n.toPrecision(8)));
}

/* ------------------------------------------------------------------ */
/* Root finding (bisection over sampled intervals)                     */
/* ------------------------------------------------------------------ */

export interface RootResult {
  root: number;
  value: number;
}

export function findRoots(
  f: (x: number) => number,
  min: number,
  max: number
): RootResult[] {
  const roots: RootResult[] = [];
  const N = 2400;
  const step = (max - min) / N;

  let prevX = min;
  let prevY = safeEval(f, min);

  if (prevY === 0) {
    roots.push({ root: prevX, value: 0 });
  }

  for (let i = 1; i <= N; i++) {
    const x = min + step * i;
    const y = safeEval(f, x);
    if (prevY !== null && y !== null) {
      if (y === 0) {
        roots.push({ root: x, value: 0 });
      } else if (prevY * y < 0) {
        let lo = prevX;
        let hi = x;
        let fl = prevY;
        for (let k = 0; k < 100; k++) {
          const mid = (lo + hi) / 2;
          const fm = safeEval(f, mid);
          if (fm === null) break;
          if (Math.abs(fm) < 1e-12) {
            roots.push({ root: mid, value: fm });
            break;
          }
          if (fl * fm < 0) {
            hi = mid;
          } else {
            lo = mid;
            fl = fm;
          }
          if (hi - lo < 1e-9) {
            roots.push({ root: (lo + hi) / 2, value: fm });
            break;
          }
        }
      }
    }
    prevX = x;
    prevY = y;
  }

  // Deduplicate roots that converged to the same point.
  roots.sort((a, b) => a.root - b.root);
  const deduped: RootResult[] = [];
  for (const r of roots) {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(r.root - last.root) > 1e-3) {
      deduped.push(r);
    }
  }
  return deduped;
}

/* ------------------------------------------------------------------ */
/* Linear systems (Gaussian elimination with partial pivoting)         */
/* ------------------------------------------------------------------ */

export interface LinearSystemResult {
  solution: number[] | null;
  determinant: number;
  rank: number;
}

export function solveLinearSystem(
  A: number[][],
  b: number[]
): LinearSystemResult {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  let det = 1;
  let rank = 0;

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) {
        pivot = row;
      }
    }
    if (Math.abs(M[pivot][col]) < 1e-12) continue;
    if (pivot !== col) {
      [M[pivot], M[col]] = [M[col], M[pivot]];
      det = -det;
    }
    const pv = M[col][col];
    det *= pv;
    rank++;
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pv;
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  const singular = Math.abs(det) < 1e-9 || rank < n;
  if (singular) {
    return { solution: null, determinant: det, rank };
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let k = row + 1; k < n; k++) {
      sum -= M[row][k] * x[k];
    }
    x[row] = sum / M[row][row];
  }
  return { solution: x, determinant: det, rank };
}

/* ------------------------------------------------------------------ */
/* Matrix operations                                                   */
/* ------------------------------------------------------------------ */

export function matAdd(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function matSub(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0].length;
  const p = a[0].length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < p; k++) {
        sum += a[i][k] * b[k][j];
      }
      row.push(sum);
    }
    out.push(row);
  }
  return out;
}

export function matDet(m: number[][]): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const sub = m
      .slice(1)
      .map((row) => row.filter((_, k) => k !== j));
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * matDet(sub);
  }
  return det;
}

export function matInverse(m: number[][]): number[][] | null {
  const n = m.length;
  const det = matDet(m);
  if (Math.abs(det) < 1e-12) return null;

  // Gauss-Jordan on the augmented matrix.
  const M = m.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) {
        pivot = row;
      }
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[pivot], M[col]] = [M[col], M[pivot]];
    const pv = M[col][col];
    for (let k = 0; k < 2 * n; k++) M[col][k] /= pv;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let k = 0; k < 2 * n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  return M.map((row) => row.slice(n));
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  range: number;
  min: number;
  max: number;
  variancePop: number;
  varianceSample: number;
  stdDevPop: number;
  stdDevSample: number;
  q1: number;
  q3: number;
  iqr: number;
}

function medianSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeStats(data: number[]): StatsResult {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const variancePop =
    data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const varianceSample =
    n > 1 ? data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1) : NaN;

  const lower = sorted.slice(0, Math.floor(n / 2));
  const upper = sorted.slice(Math.ceil(n / 2));
  const q1 = medianSorted(lower);
  const q3 = medianSorted(upper);

  const freq = new Map<number, number>();
  data.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
  const maxFreq = Math.max(...freq.values());
  const modes =
    maxFreq > 1
      ? [...freq.entries()]
          .filter(([, c]) => c === maxFreq)
          .map(([v]) => v)
          .sort((a, b) => a - b)
      : [];

  return {
    count: n,
    sum,
    mean,
    median: medianSorted(sorted),
    modes,
    range: sorted[n - 1] - sorted[0],
    min: sorted[0],
    max: sorted[n - 1],
    variancePop,
    varianceSample,
    stdDevPop: Math.sqrt(variancePop),
    stdDevSample: Math.sqrt(varianceSample),
    q1,
    q3,
    iqr: q3 - q1,
  };
}

export function parseNumbers(raw: string): number[] {
  const parts = raw.split(/[\s,;]+/).filter((p) => p.trim() !== "");
  return parts.map((p) => parseFloat(p)).filter((v) => Number.isFinite(v));
}
