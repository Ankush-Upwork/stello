import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Plan } from "@/lib/supabase/types";
import { resolveRange } from "@/lib/date-range";

type SB = SupabaseClient<Database>;

/** Used if the plans table can't be read (kept in sync with migration 0008). */
export const FREE_PLAN_FALLBACK: Plan = {
  id: "free",
  name: "Free",
  price_yearly: 0,
  product_limit: 50,
  monthly_sales_limit: 50,
  features: ["Up to 50 products", "50 sales per month", "Basic dashboard"],
  sort_order: 1,
  ai_features: false,
  ai_assistant_limit: 0,
};

/** Whether the plan includes the "cheap four" AI features (paid tiers). */
export function planHasAiFeatures(plan: Plan): boolean {
  return plan.ai_features;
}

/** Monthly Ask Sello cap: 0 = not allowed, null = unlimited. */
export function askSelloLimit(plan: Plan): number | null {
  return plan.ai_assistant_limit;
}

/** Count of metered AI (Ask Sello) calls used this month. */
export async function getAskSelloUsage(
  supabase: SB,
  userId: string
): Promise<number> {
  const { resolveRange } = await import("@/lib/date-range");
  const month = resolveRange({ range: "month" });
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "ask_sello")
    .gte("created_at", month.from.toISOString());
  return count ?? 0;
}

/** The plan the user is currently on (defaults to Free). */
export async function getUserPlan(supabase: SB, userId: string): Promise<Plan> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  const planId = sub?.plan_id ?? "free";
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  return plan ?? FREE_PLAN_FALLBACK;
}

export type Usage = { products: number; salesThisMonth: number };

export async function getUsage(supabase: SB, userId: string): Promise<Usage> {
  const month = resolveRange({ range: "month" });

  const [{ count: products }, { count: sales }] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("sale_date", month.from.toISOString())
      .lt("sale_date", month.to.toISOString()),
  ]);

  return { products: products ?? 0, salesThisMonth: sales ?? 0 };
}

export async function getAllPlans(supabase: SB): Promise<Plan[]> {
  const { data } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
