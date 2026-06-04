"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Placeholder "upgrade": switches the user's plan with NO payment gateway.
 * In production this would happen after a successful checkout. For now it lets
 * you try the different tiers and see usage limits change.
 */
export async function switchPlan(planId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in again.");

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) throw new Error("Unknown plan.");

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: user.id, plan_id: planId }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/pricing");
  revalidatePath("/settings/billing");
}
