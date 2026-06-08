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

/** Whether the plan includes unlimited AI features (paid tiers). */
export function planHasAiFeatures(plan: Plan): boolean {
  return plan.ai_features;
}

/** Free accounts get this many AI requests total (lifetime), then must upgrade. */
export const FREE_TRIAL_AI_LIMIT = 5;

export type AiGate = {
  allowed: boolean;
  paid: boolean;
  used: number;
  remaining: number | null; // null = unlimited
  limit: number | null;
};

/** Decide if a user may run an AI action right now (paid = unlimited; free = 5 lifetime). */
export async function getAiGate(supabase: SB, userId: string): Promise<AiGate> {
  const plan = await getUserPlan(supabase, userId);
  if (plan.ai_features) {
    return { allowed: true, paid: true, used: 0, remaining: null, limit: null };
  }
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const used = count ?? 0;
  const remaining = Math.max(0, FREE_TRIAL_AI_LIMIT - used);
  return {
    allowed: remaining > 0,
    paid: false,
    used,
    remaining,
    limit: FREE_TRIAL_AI_LIMIT,
  };
}

/** Log one AI request (counts toward the free trial / Ask Sello caps). */
export async function recordAiUsage(
  supabase: SB,
  userId: string,
  kind: string
): Promise<void> {
  await supabase.from("ai_usage").insert({ user_id: userId, kind });
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
