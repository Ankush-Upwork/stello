"use server";

import OpenAI from "openai";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";

const str = z.string().catch("");
const captionSchema = z.object({
  whatsapp: str,
  instagram: str,
  discount: str,
  new_arrival: str,
});

export type Captions = z.infer<typeof captionSchema>;
export type CaptionResult =
  | { ok: true; captions: Captions }
  | { ok: false; error: string };

export async function generateCaptions(input: {
  businessName: string;
  businessType: string;
  productName: string;
  category: string | null;
  color: string | null;
  size: string | null;
  price: number;
}): Promise<CaptionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "AI isn't configured yet. Add OPENAI_API_KEY to .env.local and restart.",
    };
  }

  const system = `You are a marketing copywriter for a small Indian ${input.businessType} shop named "${input.businessName}".
Write short, catchy, friendly product captions for an Indian audience.
Use the ₹ symbol for prices and a few relevant emojis. Keep each caption under 300 characters.
Return ONLY valid JSON with these keys:
{
  "whatsapp": "a short message to send customers on WhatsApp",
  "instagram": "a premium Instagram caption with 3-5 relevant hashtags",
  "discount": "a discount/sale announcement",
  "new_arrival": "a new arrival announcement"
}`;

  const details = [
    `Product: ${input.productName}`,
    input.category ? `Category: ${input.category}` : "",
    input.color ? `Colour: ${input.color}` : "",
    input.size ? `Size: ${input.size}` : "",
    `Price: ₹${input.price}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: details },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const captions = captionSchema.parse(JSON.parse(raw));
    return { ok: true, captions };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `AI error: ${err.message}` : "Could not generate captions.",
    };
  }
}
