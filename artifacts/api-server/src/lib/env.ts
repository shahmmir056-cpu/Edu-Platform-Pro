import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Minimal dependency-free .env loader.
 * Loads KEY=VALUE lines from the api-server `.env` file into process.env
 * without overwriting values that are already set (e.g. real environment
 * variables).
 */
export function loadDotEnv(): void {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // bundled dist/index.mjs lives in <api-server>/dist
    path.resolve(moduleDir, "../.env"),
    // running from src (tsx): <api-server>/src/lib
    path.resolve(moduleDir, "../../.env"),
    // launched with cwd = <api-server>
    path.resolve(process.cwd(), ".env"),
  ];
  const envPath = candidates.find((p) => existsSync(p));
  if (!envPath) return;

  let raw: string;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
