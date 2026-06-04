"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/queries/subscription";
import { productSchema } from "@/lib/validations/product";

export type BulkImportResult = {
  ok: boolean;
  inserted: number;
  skippedForLimit: number;
  failed: { line: number; error: string }[];
  error?: string;
};

/** Validate + insert many products from parsed CSV rows. */
export async function bulkCreateProducts(
  rows: Record<string, string>[]
): Promise<BulkImportResult> {
  const empty = { ok: false, inserted: 0, skippedForLimit: 0, failed: [] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ...empty, error: "No rows found in the file." };
  }
  if (rows.length > 2000) {
    return { ...empty, error: "Too many rows. Please import up to 2000 at a time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...empty, error: "Your session expired. Please log in again." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!business) return { ...empty, error: "Set up your shop profile first." };

  // Validate each row.
  const valid: Record<string, unknown>[] = [];
  const failed: { line: number; error: string }[] = [];

  rows.forEach((r, idx) => {
    const parsed = productSchema.safeParse({
      product_name: r.product_name,
      category: r.category,
      size: r.size,
      color: r.color,
      brand: r.brand,
      material: r.material,
      design: r.design,
      sku: r.sku,
      barcode: r.barcode,
      purchase_price: r.purchase_price,
      selling_price: r.selling_price,
      quantity: r.quantity,
      low_stock_threshold: r.low_stock_threshold || "5",
      supplier_name: r.supplier_name,
      supplier_phone: r.supplier_phone,
      status: r.status === "inactive" ? "inactive" : "active",
    });
    if (parsed.success) valid.push(parsed.data);
    else failed.push({ line: idx + 2, error: parsed.error.issues[0]?.message ?? "Invalid row" });
  });

  // Enforce plan product limit.
  let toInsert = valid;
  let skippedForLimit = 0;
  const plan = await getUserPlan(supabase, user.id);
  if (plan.product_limit !== null) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const remaining = Math.max(0, plan.product_limit - (count ?? 0));
    if (valid.length > remaining) {
      toInsert = valid.slice(0, remaining);
      skippedForLimit = valid.length - remaining;
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("products").insert(
      toInsert.map((v) => ({
        ...(v as object),
        user_id: user.id,
        business_id: business.id,
        has_variants: false,
      })) as never
    );
    if (error) return { ...empty, failed, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { ok: true, inserted: toInsert.length, skippedForLimit, failed };
}
