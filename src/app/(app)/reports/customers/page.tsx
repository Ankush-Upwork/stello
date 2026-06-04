import { redirect } from "next/navigation";
import { IndianRupee, Users, Wallet } from "lucide-react";

import { CustomerCard } from "@/components/customer-card";
import { DashboardCard } from "@/components/dashboard-card";
import { HBarList } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ReportTabs } from "@/components/report-tabs";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Customers report · Sello" };

export default async function CustomersReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id);

  const customers = data ?? [];
  const totalPurchase = customers.reduce((s, c) => s + c.total_purchase_amount, 0);
  const totalPending = customers.reduce((s, c) => s + c.total_pending_amount, 0);

  const topSpenders = [...customers]
    .filter((c) => c.total_purchase_amount > 0)
    .sort((a, b) => b.total_purchase_amount - a.total_purchase_amount)
    .slice(0, 6);
  const owing = [...customers]
    .filter((c) => c.total_pending_amount > 0)
    .sort((a, b) => b.total_pending_amount - a.total_pending_amount)
    .slice(0, 6);
  const topChart = topSpenders.map((c) => ({
    name: c.name,
    value: c.total_purchase_amount,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportTabs />

      <div className="grid grid-cols-3 gap-3">
        <DashboardCard label="Customers" value={String(customers.length)} icon={Users} />
        <DashboardCard label="Total sales" value={formatCurrency(totalPurchase)} icon={IndianRupee} accent="green" />
        <DashboardCard label="Total pending" value={formatCurrency(totalPending)} icon={Wallet} accent={totalPending > 0 ? "amber" : "primary"} />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add customers and record sales to see who your best customers are."
        />
      ) : (
        <>
          {topChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top customers by spend</CardTitle>
              </CardHeader>
              <CardContent>
                <HBarList data={topChart} />
              </CardContent>
            </Card>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Top customers</h2>
            {topSpenders.length === 0 ? (
              <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                No purchases recorded yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {topSpenders.map((c) => (
                  <CustomerCard key={c.id} customer={c} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Customers with pending dues</h2>
            {owing.length === 0 ? (
              <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                No pending dues. 🎉
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {owing.map((c) => (
                  <CustomerCard key={c.id} customer={c} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
