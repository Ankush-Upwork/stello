"use server";

import OpenAI from "openai";

import { getCurrentUser } from "@/lib/auth";
import { getAiGate, recordAiUsage } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";
import { aiDraftSchema, type AiDraft } from "@/lib/validations/ai";

export type ParseResult =
  | { ok: true; draft: AiDraft }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are an assistant for a small Indian shop inventory system.

Convert the user's natural language sale entry into structured JSON.

Return only valid JSON.

Required format:
{
  "customer_name": "",
  "customer_phone": "",
  "items": [
    {
      "product_name": "",
      "size": "",
      "color": "",
      "quantity": 0,
      "selling_price": 0
    }
  ],
  "total_amount": 0,
  "paid_amount": 0,
  "pending_amount": 0,
  "payment_mode": "",
  "delivery_status": "",
  "notes": ""
}

Rules:
- If customer phone is not mentioned, keep it blank.
- If payment mode is not mentioned, keep it blank. Otherwise use one of: Cash, UPI, Card, Bank Transfer, Credit, Mixed.
- If delivery status is not mentioned, use "Delivered".
- If a total amount is given for multiple quantity, calculate the unit selling price.
- Amounts are in Indian Rupees; return plain numbers (no currency symbols or commas).
- Return only JSON. No explanation.`;

export async function parseSaleText(text: string): Promise<ParseResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Type what you sold first." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  const supabase = await createClient();
  const gate = await getAiGate(supabase, user.id);
  if (!gate.allowed) {
    return { ok: false, error: "You've used all 5 free AI requests. Upgrade to keep using AI." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "AI isn't configured yet. Add OPENAI_API_KEY to .env.local and restart.",
    };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const draft = aiDraftSchema.parse(JSON.parse(raw));

    if (draft.items.length === 0) {
      return {
        ok: false,
        error: "Couldn't find any products. Try mentioning the item and quantity.",
      };
    }

    await recordAiUsage(supabase, user.id, "sale_entry");
    return { ok: true, draft };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `AI error: ${err.message}`
          : "Could not understand that. Please rephrase.",
    };
  }
}
