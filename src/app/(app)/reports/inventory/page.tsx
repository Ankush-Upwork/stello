import { redirect } from "next/navigation";
import { Boxes, IndianRupee, PackageX, TriangleAlert } from "lucide-react";

import { DashboardCard } from "@/components/dashboard-card";
import { HBarList } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { ReportTabs } from "@/components/report-tabs";
import { getCurrentUser } from "@/lib/auth";
import { getStockStatus, inventoryValue, totalQuantity } from "@/lib/products";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { deadStock, fetchRecentlySoldProductIds } from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/supabase/types";

export const metadata = { title: "Inventory report · Sello" };

const DEAD_STOCK_DAYS = 60;

export default async function InventoryReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const products = await fetchProductsWithVariants(supabase, user.id);

  const since = new Date(Date.now() - DEAD_STOCK_DAYS * 86400000);
  const soldRecently = await fetchRecentlySoldProductIds(supabase, user.id, since);

  const withQty = products.map((p) => ({
    p,
    qty: totalQuantity(p, p.variants),
    value: inventoryValue(p, p.variants, "purchase"),
  }));

  const outOfStock = withQty.filter((x) => x.qty <= 0).map((x) => x.p);
  const lowStock = withQty
    .filter((x) => getStockStatus(x.qty, x.p.low_stock_threshold) === "low")
    .map((x) => x.p);
  const highValue = [...withQty]
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const dead = deadStock(products, soldRecently);

  const totalValue = withQty.reduce((s, x) => s + x.value, 0);

  // Stock value grouped by category.
  const categoryMap = new Map<string, number>();
  for (const x of withQty) {
    const key = x.p.category || "Uncategorised";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + x.value);
  }
  const categoryValues = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportTabs />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardCard label="Total products" value={String(products.length)} icon={Boxes} />
        <DashboardCard label="Low stock" value={String(lowStock.length)} icon={TriangleAlert} accent="amber" />
        <DashboardCard label="Out of stock" value={String(outOfStock.length)} icon={PackageX} accent={outOfStock.length > 0 ? "red" : "primary"} />
        <DashboardCard label="Inventory value" value={formatCurrency(totalValue)} icon={IndianRupee} accent="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock value by category</CardTitle>
        </CardHeader>
        <CardContent>
          <HBarList data={categoryValues} />
        </CardContent>
      </Card>

      <Section title="Out of stock" products={outOfStock} emptyText="Nothing is out of stock. 🎉" />
      <Section title="Low stock" products={lowStock} emptyText="No products are running low." />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Highest-value stock</h2>
        {highValue.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            No stock on hand.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {highValue.map((x) => (
              <ProductCard key={x.p.id} product={x.p} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Dead stock{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (in stock, not sold in {DEAD_STOCK_DAYS} days)
          </span>
        </h2>
        {dead.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            No dead stock — everything in stock has sold recently.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {dead.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Section({
  title,
  products,
  emptyText,
}: {
  title: string;
  products: ProductWithVariants[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {products.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
