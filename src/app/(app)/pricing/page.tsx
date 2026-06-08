import { redirect } from "next/navigation";

import { PricingPlans } from "@/app/(app)/pricing/pricing-plans";
import { getCurrentUser } from "@/lib/auth";
import { getAllPlans, getUserPlan } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pricing · Sello" };

export default async function PricingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [plans, current, pendingRes] = await Promise.all([
    getAllPlans(supabase),
    getUserPlan(supabase, user.id),
    supabase
      .from("upgrade_requests")
      .select("plan_id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Plans &amp; pricing</h1>
        <p className="text-muted-foreground">
          Pick a plan and request an upgrade — we&apos;ll activate it after payment.
        </p>
      </div>

      <PricingPlans
        plans={plans}
        currentPlanId={current.id}
        pendingPlanId={pendingRes.data?.plan_id ?? null}
      />

      <p className="text-center text-xs text-muted-foreground">
        After you request, our team confirms your payment and activates the plan.
      </p>
    </div>
  );
}
