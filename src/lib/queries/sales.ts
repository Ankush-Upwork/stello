import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import type { SaleWithCustomer } from "@/components/sale-card";

type SB = SupabaseClient<Database>;

/**
 * Fetch a user's sales with the customer's name attached. Optionally scope to a
 * single customer (used on the customer detail page).
 */
export async function fetchSalesWithCustomer(
  supabase: SB,
  userId: string,
  opts?: { customerId?: string; from?: Date; to?: Date }
): Promise<SaleWithCustomer[]> {
  let query = supabase
    .from("sales")
    .select("*")
    .eq("user_id", userId)
    .order("sale_date", { ascending: false });

  if (opts?.customerId) query = query.eq("customer_id", opts.customerId);
  if (opts?.from) query = query.gte("sale_date", opts.from.toISOString());
  if (opts?.to) query = query.lt("sale_date", opts.to.toISOString());

  const { data: sales } = await query;
  const list = sales ?? [];
  if (list.length === 0) return [];

  const customerIds = Array.from(
    new Set(list.map((s) => s.customer_id).filter((id): id is string => Boolean(id)))
  );

  const names = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name")
      .in("id", customerIds);
    for (const c of customers ?? []) names.set(c.id, c.name);
  }

  return list.map((s) => ({
    ...s,
    customer_name: s.customer_id ? (names.get(s.customer_id) ?? null) : null,
  }));
}
