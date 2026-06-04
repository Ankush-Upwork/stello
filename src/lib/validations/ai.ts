import { z } from "zod";

// Resilient coercions — the model may omit fields or send nulls.
const str = z.string().catch("");
const num = z.coerce.number().catch(0);

const aiItemSchema = z.object({
  product_name: str,
  size: str,
  color: str,
  quantity: num,
  selling_price: num,
});

/** Shape the AI sale-entry assistant must return. */
export const aiDraftSchema = z.object({
  customer_name: str,
  customer_phone: str,
  items: z.array(aiItemSchema).catch([]),
  total_amount: num,
  paid_amount: num,
  pending_amount: num,
  payment_mode: str,
  delivery_status: str,
  notes: str,
});

export type AiDraft = z.infer<typeof aiDraftSchema>;
export type AiDraftItem = z.infer<typeof aiItemSchema>;
