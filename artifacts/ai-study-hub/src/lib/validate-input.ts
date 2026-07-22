/**
 * Input validation for AI tool prompts.
 * Returns null if valid, or an error message string if invalid.
 */

// Common gibberish patterns (repeated chars, keyboard mashing, etc.)
const GIBBERISH_PATTERNS = [
  /^(.)\1{4,}$/,                    // "aaaaaa", "111111"
  /^[asdfghjkl]+$/i,                // keyboard mashing left hand
  /^[qwertyuiop]+$/i,               // keyboard mashing top row
  /^[zxcvbnm]+$/i,                  // keyboard mashing bottom row
  /^[a-z]{1,2}$/i,                  // single/double letter only
  /^\d+$/,                          // numbers only
  /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/,  // symbols only
  /^[a-z0-9]{1,3}$/i,              // very short alphanumeric
];

// Words that suggest valid educational content even if short
const VALID_SHORT_PATTERNS = [
  /^(photosynthesis|gravity|newton|algebra|geometry|calculus|ecology|mammals|reptiles|democracy|gravity|inertia|momentum|velocity|acceleration|nucleus|electron|proton|neutron|mitosis|meiosis|atom|molecule|compound|element|photosynthesis|respiration|digestion|circulatory|nervous)/i,
  /^(quadratic|polynomial|trigonometry|logarithm|exponential|integral|derivative|matrix|vector|theorem|hypothesis|experiment|variable|constant|equation|formula)/i,
];

/**
 * Validate AI tool input text.
 * @param text - The user input text
 * @param minLen - Minimum character length (default: 3)
 * @param maxLen - Maximum character length (default: 2000)
 * @returns Error message string if invalid, null if valid
 */
export function validatePrompt(text: string, minLen = 3, maxLen = 2000): string | null {
  const trimmed = text.trim();

  // Empty check
  if (!trimmed) {
    return "Please enter a topic or prompt before continuing.";
  }

  // Too short
  if (trimmed.length < minLen) {
    return `Please enter at least ${minLen} characters. Your input is currently ${trimmed.length} character${trimmed.length === 1 ? "" : "s"} long.`;
  }

  // Too long
  if (trimmed.length > maxLen) {
    return `Your input is too long. Please keep it under ${maxLen} characters.`;
  }

  // Gibberish: repeated characters
  if (/^(.)\1{5,}$/.test(trimmed)) {
    return "That looks like repeated characters. Please enter a real topic or question.";
  }

  // Gibberish: all same letter
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return "Please enter a full topic or question, not just a single letter.";
  }

  // Gibberish: random keyboard patterns (long strings of adjacent keys)
  if (GIBBERISH_PATTERNS.some((p) => p.test(trimmed))) {
    // But allow if it matches known educational terms
    if (!VALID_SHORT_PATTERNS.some((p) => p.test(trimmed))) {
      return "That doesn't appear to be a valid topic. Please describe what you'd like to learn about.";
    }
  }

  // Gibberish: mostly special characters or numbers
  const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
  if (alphaRatio < 0.3 && trimmed.length > 3) {
    return "Please enter text using mostly letters (a topic, question, or concept).";
  }

  // Gibberish: alternating characters (like "ababababab")
  if (trimmed.length > 10 && /^(.{1,2})\1{4,}$/.test(trimmed)) {
    return "That looks like a repeating pattern. Please enter a meaningful topic.";
  }

  // All periods or dots
  if (/^[.\s]+$/.test(trimmed)) {
    return "Please enter a real topic instead of just dots.";
  }

  // Just whitespace with invisible characters
  const visibleChars = trimmed.replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]/g, "");
  if (visibleChars.length < minLen) {
    return "Please enter visible text as your topic or prompt.";
  }

  return null;
}

/**
 * Validate math input specifically.
 * Allows equations, expressions, and word problems.
 */
export function validateMathInput(text: string): string | null {
  const trimmed = text.trim();

  if (!trimmed) {
    return "Please enter a math problem before solving.";
  }

  if (trimmed.length < 3) {
    return "Please enter a complete math problem (e.g., '2x + 5 = 17').";
  }

  // Gibberish check
  if (/^(.)\1{5,}$/.test(trimmed)) {
    return "That doesn't look like a valid math problem. Please enter an equation or expression.";
  }

  return null;
}

/**
 * Validate text playground input.
 * Checks that the text is meaningful enough to transform.
 */
export function validateTextInput(text: string): string | null {
  const trimmed = text.trim();

  if (!trimmed) {
    return "Please enter or paste some text to transform.";
  }

  if (trimmed.length < 10) {
    return "Please enter at least 10 characters of text for meaningful results.";
  }

  // Gibberish check
  if (/^(.)\1{9,}$/.test(trimmed)) {
    return "That doesn't look like real text. Please enter content you'd like to transform.";
  }

  const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
  if (alphaRatio < 0.2) {
    return "Please enter text with mostly letters for the best results.";
  }

  return null;
}
