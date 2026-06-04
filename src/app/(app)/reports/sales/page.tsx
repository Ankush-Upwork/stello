import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, IndianRupee, ReceiptText, TrendingUp, Wallet } from "lucide-react";

import { DashboardCard } from "@/components/dashboard-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Donut, HBarList, TrendChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { ReportTabs } from "@/components/report-tabs";
import { SaleCard } from "@/components/sale-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { resolveRange } from "@/lib/date-range";
import { fetchSalesWithCustomer } from "@/lib/queries/sales";
import {
  dailySeries,
  fetchItemsForSales,
  paymentBreakdown,
  profitSummary,
  salesSummary,
  topByQuantity,
} from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Sales report · Sello" };

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const range = resolveRange(await searchParams);
  const supabase = await createClient();
  const sales = await fetchSalesWithCustomer(supabase, user.id, {
    from: range.from,
    to: range.to,
  });
  const items = await fetchItemsForSales(supabase, sales.map((s) => s.id));

  const sum = salesSummary(sales);
  const { profit } = profitSummary(sales, items);
  const trend = dailySeries(sales, items);
  const payments = paymentBreakdown(sales);
  const topProducts = topByQuantity(items, 5).map((p) => ({
    name: p.name,
    value: Math.round(p.revenue),
    hint: `${p.qty} sold`,
  }));
  const avg = sum.count > 0 ? sum.revenue / sum.count : 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportTabs />
      <DateRangeFilter />

      <p className="text-sm text-muted-foreground">
        {range.label} · {sum.count} {sum.count === 1 ? "sale" : "sales"}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardCard label="Revenue" value={formatCurrency(sum.revenue)} icon={IndianRupee} accent="green" />
        <DashboardCard label="Profit" value={formatCurrency(profit)} icon={TrendingUp} accent={profit >= 0 ? "green" : "red"} />
        <DashboardCard label="Pending" value={formatCurrency(sum.pending)} icon={Wallet} accent={sum.pending > 0 ? "amber" : "primary"} />
        <DashboardCard label="Avg. sale" value={formatCurrency(avg)} icon={ReceiptText} />
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment modes</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut data={payments} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <HBarList data={topProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Drill-through to individual sales */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sales in this period</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sales">
              All sales <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {sales.length === 0 ? (
          <EmptyState icon={ReceiptText} title="No sales in this period" description="Try a different date range." />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sales.slice(0, 8).map((s) => (
              <SaleCard key={s.id} sale={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
