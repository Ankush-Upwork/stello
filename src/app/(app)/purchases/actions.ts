"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { purchaseSchema, type PurchaseInput } from "@/lib/validations/purchase";
import type { Json } from "@/lib/supabase/types";

export type CreatePurchaseResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPurchase(
  input: PurchaseInput
): Promise<CreatePurchaseResult> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the purchase." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!business) return { ok: false, error: "Set up your shop profile first." };

  const payload = {
    business_id: business.id,
    supplier_id: parsed.data.supplier_id ?? null,
    purchase_date: parsed.data.purchase_date ?? null,
    paid_amount: parsed.data.paid_amount,
    notes: parsed.data.notes ?? null,
    items: parsed.data.items.map((i) => ({
      product_id: i.product_id,
      variant_id: i.variant_id ?? null,
      quantity: i.quantity,
      purchase_price: i.purchase_price,
    })),
  };

  const { data, error } = await supabase.rpc("create_purchase", {
    payload: payload as unknown as Json,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/dashboard");
  return { ok: true, id: data as string };
}

export async function deletePurchase(
  id: string,
  removeStock: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_purchase", {
    p_purchase_id: id,
    p_remove_stock: removeStock,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/dashboard");
}
