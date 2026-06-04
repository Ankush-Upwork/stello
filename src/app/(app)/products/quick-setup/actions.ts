"use server";

import { z } from "zod";

import { bulkCreateProducts } from "@/app/(app)/products/import/actions";
import { aiJson, AiError } from "@/lib/ai/openai";
import { getCurrentUser } from "@/lib/auth";
import { businessTypeLabel } from "@/lib/constants";
import { getUserPlan, planHasAiFeatures } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";

const draftSchema = z.object({
  products: z
    .array(
      z.object({
        product_name: z.string().catch(""),
        category: z.string().catch(""),
        selling_price: z.coerce.number().catch(0),
        gst_rate: z.coerce.number().catch(0),
      })
    )
    .catch([]),
});

export type StarterProduct = {
  product_name: string;
  category: string;
  selling_price: number;
  gst_rate: number;
};

export type GenerateResult =
  | { ok: true; products: StarterProduct[] }
  | { ok: false; error: string; gated?: boolean };

export async function generateStarterProducts(
  description: string
): Promise<GenerateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const supabase = await createClient();
  const plan = await getUserPlan(supabase, user.id);
  if (!planHasAiFeatures(plan)) {
    return { ok: false, error: "AI setup is available on paid plans.", gated: true };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("business_type")
    .eq("user_id", user.id)
    .maybeSingle();
  const type = businessTypeLabel(business?.business_type);

  try {
    const result = (await aiJson(
      `You set up inventory for small Indian retail shops. Suggest a realistic starter catalogue of 12–18 common products this shop sells.
For each product return: product_name, category (one or two words), selling_price (realistic INR number), gst_rate (one of 0, 5, 12, 18).
Return ONLY JSON: { "products": [ { "product_name": "", "category": "", "selling_price": 0, "gst_rate": 0 } ] }`,
      `Shop type: ${type}. ${description ? `Notes from owner: ${description}` : ""}`
    )) as unknown;

    const parsed = draftSchema.parse(result);
    const products = parsed.products
      .filter((p) => p.product_name.trim())
      .slice(0, 30);

    if (products.length === 0) {
      return { ok: false, error: "Couldn't generate products. Try adding a short description." };
    }
    return { ok: true, products };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof AiError ? err.message : "Could not generate the catalogue.",
    };
  }
}

/** Insert the selected starter products (reuses the bulk-import pipeline). */
export async function importStarterProducts(products: StarterProduct[]) {
  const rows = products.map((p) => ({
    product_name: p.product_name,
    category: p.category,
    selling_price: String(p.selling_price ?? 0),
    gst_rate: String(p.gst_rate ?? 0),
    quantity: "0",
    status: "active",
  }));
  return bulkCreateProducts(rows);
}
