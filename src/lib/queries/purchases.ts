import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Purchase } from "@/lib/supabase/types";

type SB = SupabaseClient<Database>;

export type PurchaseWithSupplier = Purchase & { supplier_name: string | null };

export async function fetchPurchasesWithSupplier(
  supabase: SB,
  userId: string,
  opts?: { supplierId?: string }
): Promise<PurchaseWithSupplier[]> {
  let query = supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false });

  if (opts?.supplierId) query = query.eq("supplier_id", opts.supplierId);

  const { data: purchases } = await query;
  const list = purchases ?? [];
  if (list.length === 0) return [];

  const supplierIds = Array.from(
    new Set(
      list.map((p) => p.supplier_id).filter((id): id is string => Boolean(id))
    )
  );

  const names = new Map<string, string>();
  if (supplierIds.length > 0) {
    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .in("id", supplierIds);
    for (const s of data ?? []) names.set(s.id, s.name);
  }

  return list.map((p) => ({
    ...p,
    supplier_name: p.supplier_id ? (names.get(p.supplier_id) ?? null) : null,
  }));
}
