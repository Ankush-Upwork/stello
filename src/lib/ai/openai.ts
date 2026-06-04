import "server-only";

import OpenAI from "openai";

export class AiError extends Error {}

/** Call OpenAI in JSON mode and return the parsed object. Server-only. */
export async function aiJson(
  system: string,
  user: string,
  opts?: { model?: string; temperature?: number }
): Promise<unknown> {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiError("AI isn't configured. Add OPENAI_API_KEY and restart.");
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: opts?.model ?? "gpt-4o-mini",
    temperature: opts?.temperature ?? 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    throw new AiError("AI returned an unexpected response. Please try again.");
  }
}
