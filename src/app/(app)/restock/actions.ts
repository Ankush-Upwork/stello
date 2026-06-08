"use server";

import { z } from "zod";

import { aiJson, AiError } from "@/lib/ai/openai";
import { getCurrentUser } from "@/lib/auth";
import { getStockStatus, totalQuantity } from "@/lib/products";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import {
  aggregateByProduct,
  fetchItemsForSales,
  fetchSalesInRange,
} from "@/lib/queries/reports";
import { getAiGate, recordAiUsage } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";

export type RestockItem = {
  product_id: string;
  name: string;
  current: number;
  sold30: number;
  suggested_qty: number;
  reason: string;
};

export type RestockResult =
  | { ok: true; items: RestockItem[]; summary: string }
  | { ok: false; error: string; gated?: boolean };

const aiSchema = z.object({
  summary: z.string().catch(""),
  items: z
    .array(
      z.object({
        product_id: z.string().catch(""),
        suggested_qty: z.coerce.number().catch(0),
        reason: z.string().catch(""),
      })
    )
    .catch([]),
});

export async function getRestockSuggestions(): Promise<RestockResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const supabase = await createClient();
  const gate = await getAiGate(supabase, user.id);
  if (!gate.allowed) {
    return {
      ok: false,
      error: "You've used all 5 free AI requests. Upgrade to keep using AI.",
      gated: true,
    };
  }

  // Low / out-of-stock candidates (variant-aware).
  const products = await fetchProductsWithVariants(supabase, user.id);
  const candidates = products
    .map((p) => ({ p, qty: totalQuantity(p, p.variants) }))
    .filter(({ p, qty }) => getStockStatus(qty, p.low_stock_threshold) !== "ok");

  if (candidates.length === 0) {
    return { ok: true, items: [], summary: "Everything is well stocked. Nothing to reorder right now." };
  }

  // Units sold in the last 30 days, per product.
  const since = new Date(Date.now() - 30 * 86400000);
  const sales = await fetchSalesInRange(supabase, user.id, since, new Date());
  const items = await fetchItemsForSales(supabase, sales.map((s) => s.id));
  const sold = new Map(aggregateByProduct(items).map((a) => [a.key, a.qty]));

  const compact = candidates.map(({ p, qty }) => ({
    product_id: p.id,
    name: p.product_name,
    current: qty,
    threshold: p.low_stock_threshold,
    sold_30d: sold.get(p.id) ?? 0,
  }));

  try {
    const result = (await aiJson(
      `You help an Indian shopkeeper decide how much stock to reorder.
For each product, suggest a sensible reorder quantity considering units sold in the last 30 days and the low-stock threshold (aim for ~3–4 weeks of cover; for fast movers reorder more, for non-movers reorder little).
Return ONLY JSON: { "summary": "one friendly sentence", "items": [ { "product_id": "", "suggested_qty": 0, "reason": "short" } ] }`,
      JSON.stringify({ products: compact })
    )) as unknown;

    const parsed = aiSchema.parse(result);
    const byId = new Map(parsed.items.map((i) => [i.product_id, i]));

    const merged: RestockItem[] = compact.map((c) => {
      const ai = byId.get(c.product_id);
      return {
        product_id: c.product_id,
        name: c.name,
        current: c.current,
        sold30: c.sold_30d,
        suggested_qty: ai?.suggested_qty ?? Math.max(c.threshold * 2 - c.current, c.sold_30d),
        reason: ai?.reason ?? "Below low-stock level",
      };
    });

    await recordAiUsage(supabase, user.id, "restock");
    return { ok: true, items: merged, summary: parsed.summary || "Here are your reorder suggestions." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AiError ? err.message : "Could not generate suggestions.",
    };
  }
}
