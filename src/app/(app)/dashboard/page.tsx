import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Flame,
  IndianRupee,
  Plus,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard-card";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { SaleCard } from "@/components/sale-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/currency-display";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { businessTypeLabel } from "@/lib/constants";
import { resolveRange } from "@/lib/date-range";
import { getStockStatus, inventoryValue, totalQuantity } from "@/lib/products";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { fetchSalesWithCustomer } from "@/lib/queries/sales";
import {
  fetchItemsForSales,
  fetchSalesInRange,
  fetchTotalPending,
  profitSummary,
  salesSummary,
  topByQuantity,
} from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getCurrentBusiness();
  if (!business) redirect("/settings/business-profile");

  const supabase = await createClient();

  const month = resolveRange({ range: "month" });
  const today = resolveRange({ range: "today" });

  const [products, monthSales, pending, recent] = await Promise.all([
    fetchProductsWithVariants(supabase, user.id),
    fetchSalesInRange(supabase, user.id, month.from, month.to),
    fetchTotalPending(supabase, user.id),
    fetchSalesWithCustomer(supabase, user.id),
  ]);

  const monthItems = await fetchItemsForSales(
    supabase,
    monthSales.map((s) => s.id)
  );

  // Today is a subset of this month.
  const todaySaleIds = new Set(
    monthSales.filter((s) => new Date(s.sale_date) >= today.from).map((s) => s.id)
  );
  const todaySales = monthSales.filter((s) => todaySaleIds.has(s.id));
  const todayItems = monthItems.filter((it) => todaySaleIds.has(it.sale_id));

  const todaySum = salesSummary(todaySales);
  const todayProfit = profitSummary(todaySales, todayItems).profit;
  const monthSum = salesSummary(monthSales);
  const monthProfit = profitSummary(monthSales, monthItems).profit;

  // Inventory stats (variant-aware).
  let lowStock = 0;
  let purchaseValue = 0;
  for (const p of products) {
    const qty = totalQuantity(p, p.variants);
    if (getStockStatus(qty, p.low_stock_threshold) !== "ok") lowStock += 1;
    purchaseValue += inventoryValue(p, p.variants, "purchase");
  }

  const topSellers = topByQuantity(monthItems, 5);
  const lowStockProducts = products
    .filter(
      (p) =>
        getStockStatus(totalQuantity(p, p.variants), p.low_stock_threshold) !==
        "ok"
    )
    .slice(0, 4);
  const recentSales = recent.slice(0, 5);
  const firstName = business.owner_name?.split(" ")[0] ?? "there";
  const locale = await getLocale();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Hero */}
      <div className="bg-brand-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-primary/20">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs font-medium text-white/80">
            {business.business_name} · {businessTypeLabel(business.business_type)}
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight">
            {t("dash.welcome", locale)}, {firstName} 👋
          </h1>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="flex-1 shadow-sm">
              <Link href="/sales/new">
                <ShoppingCart /> {t("action.addSale", locale)}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="flex-1 border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/products/new">
                <Plus /> {t("action.addProduct", locale)}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Sales summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("dash.salesSummary", locale)}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardCard label={t("dash.todaySales", locale)} value={formatCurrency(todaySum.revenue)} icon={ShoppingCart} hint={`${todaySum.count} sale${todaySum.count === 1 ? "" : "s"}`} />
          <DashboardCard label={t("dash.todayProfit", locale)} value={formatCurrency(todayProfit)} icon={TrendingUp} accent="green" />
          <DashboardCard label={t("dash.monthSales", locale)} value={formatCurrency(monthSum.revenue)} icon={ShoppingCart} hint={`${monthSum.count} sale${monthSum.count === 1 ? "" : "s"}`} />
          <DashboardCard label={t("dash.monthProfit", locale)} value={formatCurrency(monthProfit)} icon={TrendingUp} accent="green" />
        </div>
      </section>

      {/* Inventory + pending */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("dash.invPayments", locale)}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardCard label={t("dash.pending", locale)} value={formatCurrency(pending)} icon={Wallet} accent={pending > 0 ? "amber" : "primary"} />
          <DashboardCard label={t("dash.lowOut", locale)} value={String(lowStock)} icon={TriangleAlert} accent={lowStock > 0 ? "amber" : "primary"} />
          <DashboardCard label={t("dash.totalProducts", locale)} value={String(products.length)} icon={Boxes} />
          <DashboardCard label={t("dash.invValue", locale)} value={formatCurrency(purchaseValue)} icon={IndianRupee} hint="at purchase price" accent="green" />
        </div>
      </section>

      {/* Top sellers + recent sales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Flame className="h-5 w-5 text-orange-500" /> {t("dash.topSellers", locale)}
          </h2>
          {topSellers.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              No sales yet this month.
            </p>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {topSellers.map((p, i) => (
                  <div key={p.key} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">{p.qty} sold</span>
                    <span className="shrink-0 font-medium">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dash.recentSales", locale)}</h2>
            {recentSales.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/sales">
                  All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          {recentSales.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              No sales recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((s) => (
                <SaleCard key={s.id} sale={s} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Low stock alerts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("dash.lowAlerts", locale)}</h2>
          {products.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/products">All products</Link>
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No products yet"
            description="Add your first product to start tracking stock and inventory value."
            action={
              <Button asChild size="lg">
                <Link href="/products/new">
                  <Plus className="h-4 w-4" /> Add your first product
                </Link>
              </Button>
            }
          />
        ) : lowStockProducts.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            All products are above their low-stock level. 🎉
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {lowStockProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
