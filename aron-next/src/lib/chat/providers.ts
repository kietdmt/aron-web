import "server-only";

export type Msg = { role: "user" | "assistant"; content: string };
type Provider = "gemini" | "claude";

export function chatProvider(): Provider | null {
  if (process.env.CHAT_ENABLED === "false") return null;
  const want = process.env.CHAT_PROVIDER?.toLowerCase();
  if (want === "claude" && process.env.ANTHROPIC_API_KEY) return "claude";
  if (want === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (!want) {
    if (process.env.GEMINI_API_KEY) return "gemini";
    if (process.env.ANTHROPIC_API_KEY) return "claude";
  }
  return null;
}
export const chatEnabled = () => chatProvider() !== null;

export class ChatError extends Error {
  constructor(public kind: "busy" | "unavailable") { super(kind); }
}

const TIMEOUT = 25_000;

async function gemini(system: string, msgs: Msg[]): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) {
    console.error("chat gemini", res.status, (await res.text()).slice(0, 300));
    throw new ChatError(res.status === 429 ? "busy" : "unavailable");
  }
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
}

async function claude(system: string, msgs: Msg[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
      max_tokens: 700,
      temperature: 0.4,
      system,
      messages: msgs,
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) {
    console.error("chat claude", res.status, (await res.text()).slice(0, 300));
    throw new ChatError(res.status === 429 || res.status === 529 ? "busy" : "unavailable");
  }
  const j = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (j.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
}

export async function generate(system: string, msgs: Msg[]): Promise<string> {
  const p = chatProvider();
  if (!p) throw new ChatError("unavailable");
  try {
    return p === "gemini" ? await gemini(system, msgs) : await claude(system, msgs);
  } catch (e) {
    if (e instanceof ChatError) throw e;
    console.error("chat provider", p, e instanceof Error ? e.message : e);
    throw new ChatError("unavailable");
  }
}
