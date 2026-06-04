"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/queries/subscription";
import { resolveRange } from "@/lib/date-range";
import { saleSchema, type SaleInput } from "@/lib/validations/sale";
import type { Json } from "@/lib/supabase/types";

export type CreateSaleResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Creates a sale atomically via the create_sale() Postgres function:
 * validates + deducts stock, writes the sale and items, updates the
 * customer's running totals and assigns an invoice number — all in one
 * transaction. Any problem (e.g. insufficient stock) rolls everything back.
 */
export async function createSale(input: SaleInput): Promise<CreateSaleResult> {
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the sale." };
  }

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

  // Plan limit on sales per month.
  const plan = await getUserPlan(supabase, user.id);
  if (plan.monthly_sales_limit !== null) {
    const month = resolveRange({ range: "month" });
    const { count } = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("sale_date", month.from.toISOString())
      .lt("sale_date", month.to.toISOString());
    if ((count ?? 0) >= plan.monthly_sales_limit) {
      return {
        ok: false,
        error: `You've hit your ${plan.name} plan limit of ${plan.monthly_sales_limit} sales this month. Upgrade for unlimited sales.`,
      };
    }
  }

  const payload = {
    business_id: business.id,
    customer_id: parsed.data.customer_id ?? null,
    sale_date: parsed.data.sale_date ?? null,
    discount_amount: parsed.data.discount_amount,
    paid_amount: parsed.data.paid_amount,
    payment_mode: parsed.data.payment_mode ?? null,
    delivery_status: parsed.data.delivery_status,
    notes: parsed.data.notes ?? null,
    items: parsed.data.items.map((i) => ({
      product_id: i.product_id,
      variant_id: i.variant_id ?? null,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount_amount: i.discount_amount,
    })),
  };

  const { data, error } = await supabase.rpc("create_sale", {
    payload: payload as unknown as Json,
  });

  if (error) {
    // Surface the friendly RAISE message from the function (e.g. low stock).
    return { ok: false, error: error.message };
  }

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { ok: true, id: data as string };
}

export async function recordSalePayment(
  saleId: string,
  amount: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_sale_id: saleId,
    p_amount: amount,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/sales");
  revalidatePath("/customers");
  revalidatePath("/payments/pending");
  revalidatePath("/dashboard");
}

export async function deleteSale(
  id: string,
  restoreStock: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_sale", {
    p_sale_id: id,
    p_restore: restoreStock,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}
