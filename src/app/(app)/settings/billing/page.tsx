import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getUsage, getUserPlan } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing · Sello" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [plan, usage] = await Promise.all([
    getUserPlan(supabase, user.id),
    getUsage(supabase, user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Billing &amp; plan</h1>

      <Card>
        <CardHeader>
          <CardDescription>Current plan</CardDescription>
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl">{plan.name}</span>
            <span className="text-base font-semibold text-muted-foreground">
              ₹{plan.price_yearly.toLocaleString("en-IN")}/yr
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar
            label="Products"
            used={usage.products}
            limit={plan.product_limit}
          />
          <UsageBar
            label="Sales this month"
            used={usage.salesThisMonth}
            limit={plan.monthly_sales_limit}
          />
          <Button asChild className="w-full">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" /> View plans &amp; upgrade
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Payments aren't enabled yet — this is a preview of the SaaS plan system.
      </p>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const near = !unlimited && pct >= 80;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used} {unlimited ? "· Unlimited" : `/ ${limit}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            unlimited ? "bg-emerald-500" : near ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: unlimited ? "100%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}
