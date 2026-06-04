"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { switchPlan } from "@/app/(app)/pricing/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/supabase/types";

export function PricingPlans({
  plans,
  currentPlanId,
}: {
  plans: Plan[];
  currentPlanId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function choose(planId: string) {
    setPendingId(planId);
    try {
      await switchPlan(planId);
      toast.success("Plan updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change plan.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const popular = plan.id === "pro";
        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-5 shadow-sm",
              popular ? "border-primary ring-1 ring-primary" : "border-border/70"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              {popular && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  Popular
                </span>
              )}
            </div>

            <p className="mt-2">
              <span className="text-3xl font-extrabold tracking-tight">
                ₹{plan.price_yearly.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-muted-foreground">/year</span>
            </p>

            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-5 w-full"
              variant={isCurrent ? "outline" : popular ? "default" : "secondary"}
              disabled={isCurrent || pendingId !== null}
              onClick={() => choose(plan.id)}
            >
              {pendingId === plan.id && <Loader2 className="animate-spin" />}
              {isCurrent ? "Current plan" : `Choose ${plan.name}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
