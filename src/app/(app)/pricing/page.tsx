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
  const [plans, current] = await Promise.all([
    getAllPlans(supabase),
    getUserPlan(supabase, user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Plans &amp; pricing</h1>
        <p className="text-muted-foreground">
          Pick the plan that fits your shop. Billing isn't live yet — switching is
          free while we build it.
        </p>
      </div>

      <PricingPlans plans={plans} currentPlanId={current.id} />

      <p className="text-center text-xs text-muted-foreground">
        Prices are placeholders. No payment is taken.
      </p>
    </div>
  );
}
