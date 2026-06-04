import { redirect } from "next/navigation";
import { Coins, IndianRupee, Percent, TrendingUp } from "lucide-react";

import { DashboardCard } from "@/components/dashboard-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import { HBarList, TrendChart } from "@/components/charts";
import { ReportTabs } from "@/components/report-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { resolveRange } from "@/lib/date-range";
import {
  dailySeries,
  fetchItemsForSales,
  fetchSalesInRange,
  profitSummary,
  topByProfit,
} from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Profit report · Sello" };

export default async function ProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const range = resolveRange(await searchParams);
  const supabase = await createClient();
  const sales = await fetchSalesInRange(supabase, user.id, range.from, range.to);
  const items = await fetchItemsForSales(
    supabase,
    sales.map((s) => s.id)
  );

  const { revenue, cost, profit, margin } = profitSummary(sales, items);
  const trend = dailySeries(sales, items);
  const topProfit = topByProfit(items, 5)
    .filter((p) => p.profit !== 0)
    .map((p) => ({ name: p.name, value: Math.round(p.profit), hint: `${p.qty} sold` }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportTabs />
      <DateRangeFilter />

      <p className="text-sm text-muted-foreground">{range.label}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardCard label="Revenue" value={formatCurrency(revenue)} icon={IndianRupee} />
        <DashboardCard label="Cost" value={formatCurrency(cost)} icon={Coins} accent="amber" />
        <DashboardCard label="Profit" value={formatCurrency(profit)} icon={TrendingUp} accent={profit >= 0 ? "green" : "red"} />
        <DashboardCard label="Margin" value={`${(margin * 100).toFixed(1)}%`} icon={Percent} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue &amp; profit trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={trend}
            series={[
              { key: "revenue", label: "Revenue", color: "#6366f1" },
              { key: "profit", label: "Profit", color: "#10b981" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most profitable products</CardTitle>
        </CardHeader>
        <CardContent>
          <HBarList data={topProfit} />
        </CardContent>
      </Card>
    </div>
  );
}
