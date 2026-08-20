import { Router } from "express";
import https from "node:https";

const router = Router();

const GROQ_HOST = "api.groq.com";
const GROQ_PATH = "/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

function httpsPost(body: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: GROQ_HOST,
        path: GROQ_PATH,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
          catch { resolve({ error: "Parse error" }); }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(60_000, () => req.destroy(new Error("Timeout")));
    req.write(body);
    req.end();
  });
}

function getSystemPrompt(mode: string, topic: string, interviewStyle?: string): string {
  const base = `You are Neural Sync AI Debate Mentor — a world-class professor, debate coach, and communication trainer. You are warm, sharp, witty, and deeply intelligent. You adapt your style to the student's level.`;

  switch (mode) {
    case "debate":
      return `${base}\n\nYou are in DEBATE MODE. The topic is: "${topic}".
RULES:
- Take the OPPOSING side of whatever the student argues.
- Present logical, well-structured arguments with evidence.
- Detect logical fallacies (ad hominem, straw man, false dilemma, etc.) and point them out.
- Ask follow-up questions that challenge weak points.
- Be respectful but intellectually rigorous.
- After 6-8 exchanges, provide a debate score and detailed feedback.
- Keep responses under 150 words. Be punchy and direct.`;

    case "teacher":
      return `${base}\n\nYou are in AI TEACHER MODE. The topic is: "${topic}".
RULES:
- Explain concepts step-by-step, never dump long paragraphs.
- Use real-world analogies and examples.
- After each explanation, STOP and ask "Did that make sense? Want me to go deeper?"
- If the student seems confused, simplify. If they understand, go deeper.
- Generate mini-quizzes: "Quick check: [question]?"
- Keep explanations under 100 words. Use numbered steps.
- Be encouraging but don't over-praise.`;

    case "viva":
      return `${base}\n\nYou are in VIVA EXAMINER MODE. The subject is: "${topic}".
RULES:
- Ask ONE question at a time. Wait for the student's answer.
- If the answer is weak, give a hint, then ask again.
- Evaluate: accuracy, depth, confidence, and communication.
- Never reveal the full answer immediately — guide them to discover it.
- After 5-8 questions, give a final performance report with scores.
- Tone: formal, professional, like a university oral exam.
- Keep questions concise. Follow-ups should be probing.`;

    case "interview":
      const styleDesc = interviewStyle === "hr"
        ? "HR/behavioral interview at a top tech company. Focus on culture fit, leadership, conflict resolution."
        : interviewStyle === "technical"
        ? "Technical interview at a top tech company. Data structures, algorithms, system design, problem-solving."
        : "Behavioral interview. STAR method, past experiences, situational questions.";
      return `${base}\n\nYou are in INTERVIEW MODE — ${styleDesc}
TOPIC/ROLE: "${topic}".
RULES:
- Ask one interview question at a time.
- React to answers like a real interviewer would (nod, follow up, probe).
- After 5-8 questions, provide detailed feedback: strengths, areas to improve, suggested answers.
- Tone: professional, like a real interview. Be encouraging but challenging.
- Keep questions natural and conversational.`;

    default:
      return base;
  }
}

function getScorePrompt(messages: any[], mode: string, topic: string): string {
  return `You are a scoring expert. Analyze this ${mode} conversation about "${topic}" and return a JSON score.

Messages:
${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

Return ONLY a JSON object with this exact structure:
{
  "overall": <1-100>,
  "confidence": <1-100>,
  "communication": <1-100>,
  "grammar": <1-100>,
  "criticalThinking": <1-100>,
  "debatePerformance": <1-100>,
  "feedback": ["<feedback1>", "<feedback2>", "<feedback3>"],
  "strongAreas": ["<area1>", "<area2>"],
  "weakAreas": ["<area1>", "<area2>"],
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"]
}

Be fair, detailed, and constructive. Score based on the actual conversation quality.`;
}

router.post("/debate-mentor/chat", async (req, res) => {
  try {
    const { messages, mode, topic, interviewStyle } = req.body;
    if (!messages || !mode || !topic) {
      return res.status(400).json({ error: "Missing messages, mode, or topic" });
    }

    const systemPrompt = getSystemPrompt(mode, topic, interviewStyle);
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ];

    const body = JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 4000,
      messages: allMessages,
      temperature: 0.8,
      top_p: 0.9,
    });

    const data = await httpsPost(body);

    if (data.error) {
      return res.status(500).json({ error: data.error.message || "AI error" });
    }

    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    return res.json({ reply });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

router.post("/debate-mentor/score", async (req, res) => {
  try {
    const { messages, mode, topic } = req.body;
    if (!messages || !mode || !topic) {
      return res.status(400).json({ error: "Missing data" });
    }

    const scorePrompt = getScorePrompt(messages, mode, topic);
    const body = JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: scorePrompt }],
      temperature: 0.3,
    });

    const data = await httpsPost(body);
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    let score;
    try { score = JSON.parse(content); }
    catch { score = { overall: 50, confidence: 50, communication: 50, grammar: 50, criticalThinking: 50, debatePerformance: 50, feedback: [], strongAreas: [], weakAreas: [], recommendations: [] }; }

    return res.json({ score });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
