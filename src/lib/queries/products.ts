import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/supabase/types";

type SB = SupabaseClient<Database>;

/**
 * Fetch a user's products, each with its variant rows attached
 * (empty array for products that don't use variants).
 */
export async function fetchProductsWithVariants(
  supabase: SB,
  userId: string
): Promise<ProductWithVariants[]> {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const list = products ?? [];
  const variantProductIds = list.filter((p) => p.has_variants).map((p) => p.id);

  let variants: ProductVariant[] = [];
  if (variantProductIds.length > 0) {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", variantProductIds);
    variants = data ?? [];
  }

  const byProduct = new Map<string, ProductVariant[]>();
  for (const v of variants) {
    const arr = byProduct.get(v.product_id) ?? [];
    arr.push(v);
    byProduct.set(v.product_id, arr);
  }

  return list.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }));
}
