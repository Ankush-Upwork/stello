import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  Sale,
  SaleItem,
  ProductWithVariants,
} from "@/lib/supabase/types";
import { totalQuantity } from "@/lib/products";
import { formatDate } from "@/lib/utils";

type SB = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchSalesInRange(
  supabase: SB,
  userId: string,
  from: Date,
  to: Date
): Promise<Sale[]> {
  const { data } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", userId)
    .gte("sale_date", from.toISOString())
    .lt("sale_date", to.toISOString())
    .order("sale_date", { ascending: false });
  return data ?? [];
}

export async function fetchItemsForSales(
  supabase: SB,
  saleIds: string[]
): Promise<SaleItem[]> {
  if (saleIds.length === 0) return [];
  const { data } = await supabase
    .from("sale_items")
    .select("*")
    .in("sale_id", saleIds);
  return data ?? [];
}

/** Product ids that have sold since `since` (used for dead-stock detection). */
export async function fetchRecentlySoldProductIds(
  supabase: SB,
  userId: string,
  since: Date
): Promise<Set<string>> {
  const sales = await fetchSalesInRange(supabase, userId, since, new Date());
  const items = await fetchItemsForSales(
    supabase,
    sales.map((s) => s.id)
  );
  const ids = new Set<string>();
  for (const it of items) if (it.product_id) ids.add(it.product_id);
  return ids;
}

/** Total outstanding across all of a user's sales. */
export async function fetchTotalPending(
  supabase: SB,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("sales")
    .select("pending_amount")
    .eq("user_id", userId)
    .gt("pending_amount", 0);
  return (data ?? []).reduce((s, r) => s + (r.pending_amount ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Pure aggregators
// ---------------------------------------------------------------------------

export function salesSummary(sales: Sale[]) {
  return sales.reduce(
    (a, s) => ({
      count: a.count + 1,
      revenue: a.revenue + s.total_amount,
      paid: a.paid + s.paid_amount,
      pending: a.pending + s.pending_amount,
    }),
    { count: 0, revenue: 0, paid: 0, pending: 0 }
  );
}

export function profitSummary(sales: Sale[], items: SaleItem[]) {
  const revenue = sales.reduce((s, x) => s + x.total_amount, 0);
  const cost = items.reduce(
    (s, it) => s + it.purchase_price_snapshot * it.quantity,
    0
  );
  const profit = revenue - cost;
  const margin = revenue > 0 ? profit / revenue : 0;
  return { revenue, cost, profit, margin };
}

export type ProductTotals = {
  key: string;
  name: string;
  qty: number;
  revenue: number;
  profit: number;
};

export function aggregateByProduct(items: SaleItem[]): ProductTotals[] {
  const map = new Map<string, ProductTotals>();
  for (const it of items) {
    const key = it.product_id ?? `name:${it.product_name_snapshot}`;
    const cur =
      map.get(key) ??
      { key, name: it.product_name_snapshot, qty: 0, revenue: 0, profit: 0 };
    cur.qty += it.quantity;
    cur.revenue += it.line_total;
    cur.profit += it.line_profit;
    map.set(key, cur);
  }
  return [...map.values()];
}

export function topByQuantity(items: SaleItem[], n: number): ProductTotals[] {
  return aggregateByProduct(items)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, n);
}

export function topByProfit(items: SaleItem[], n: number): ProductTotals[] {
  return aggregateByProduct(items)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, n);
}

/** Per-day revenue + profit for a trend chart. */
export function dailySeries(sales: Sale[], items: SaleItem[]) {
  const saleDay = new Map<string, string>();
  const byDay = new Map<
    string,
    { key: string; label: string; revenue: number; cost: number }
  >();

  for (const s of sales) {
    const key = new Date(s.sale_date).toISOString().slice(0, 10);
    saleDay.set(s.id, key);
    const cur =
      byDay.get(key) ??
      { key, label: formatDate(s.sale_date), revenue: 0, cost: 0 };
    cur.revenue += s.total_amount;
    byDay.set(key, cur);
  }
  for (const it of items) {
    const key = saleDay.get(it.sale_id);
    const cur = key ? byDay.get(key) : undefined;
    if (cur) cur.cost += it.purchase_price_snapshot * it.quantity;
  }

  return [...byDay.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((d) => ({
      label: d.label,
      revenue: Math.round(d.revenue),
      profit: Math.round(d.revenue - d.cost),
    }));
}

/** Sales total grouped by payment mode (for a donut). */
export function paymentBreakdown(sales: Sale[]) {
  const m = new Map<string, number>();
  for (const s of sales) {
    const k = s.payment_mode || "Other";
    m.set(k, (m.get(k) ?? 0) + s.total_amount);
  }
  return [...m.entries()].map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));
}

/** Products with stock on hand that haven't sold since `recentlySoldIds`. */
export function deadStock(
  products: ProductWithVariants[],
  recentlySoldIds: Set<string>
): ProductWithVariants[] {
  return products.filter(
    (p) =>
      totalQuantity(p, p.variants) > 0 && !recentlySoldIds.has(p.id)
  );
}
