import type { ChatMessage, DebateMode, InterviewStyle, DebateScore } from "../types";

const API_BASE = "https://acceptable-charm-production-2ace.up.railway.app/api/debate-mentor";

export async function sendDebateMessage(
  messages: ChatMessage[],
  mode: DebateMode,
  topic: string,
  interviewStyle?: InterviewStyle
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      mode,
      topic,
      interviewStyle,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function generateScore(
  messages: ChatMessage[],
  mode: DebateMode,
  topic: string
): Promise<DebateScore> {
  const res = await fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      mode,
      topic,
    }),
  });

  if (!res.ok) throw new Error("Failed to generate score");
  const data = await res.json();
  return data.score;
}
