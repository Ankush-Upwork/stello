import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";

import { DeletePurchaseDialog } from "@/app/(app)/purchases/[id]/delete-purchase-dialog";
import { CurrencyDisplay } from "@/components/currency-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!purchase) notFound();

  const [{ data: items }, supplierRes] = await Promise.all([
    supabase.from("purchase_items").select("*").eq("purchase_id", id).order("created_at"),
    purchase.supplier_id
      ? supabase.from("suppliers").select("*").eq("id", purchase.supplier_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const lineItems = items ?? [];
  const supplier = supplierRes.data;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/purchases" aria-label="Back to purchases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">Purchase</h1>
          <p className="text-sm text-muted-foreground">{formatDate(purchase.purchase_date)}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-2 py-4">
          <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
          {supplier ? (
            <Link href={`/suppliers/${supplier.id}`} className="font-medium hover:underline">
              {supplier.name}
            </Link>
          ) : (
            <span className="font-medium">No supplier</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-2 py-2.5 text-center font-medium">Qty</th>
                <th className="px-2 py-2.5 text-right font-medium">Cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lineItems.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{it.product_name_snapshot}</p>
                    {[it.size_snapshot, it.color_snapshot].filter(Boolean).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {[it.size_snapshot, it.color_snapshot].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center">{it.quantity}</td>
                  <td className="px-2 py-2.5 text-right">
                    <CurrencyDisplay amount={it.purchase_price} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    <CurrencyDisplay amount={it.line_total} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm">
          <Row label="Total" value={<CurrencyDisplay amount={purchase.total_amount} />} bold />
          <Row label="Paid" value={<CurrencyDisplay amount={purchase.paid_amount} />} />
          <Row
            label="Pending"
            value={<CurrencyDisplay amount={purchase.pending_amount} />}
            bold
            tone={purchase.pending_amount > 0 ? "amber" : "green"}
          />
        </CardContent>
      </Card>

      {purchase.notes && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{purchase.notes}</p>
      )}

      <div className="flex justify-end">
        <DeletePurchaseDialog id={purchase.id} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  tone?: "amber" | "green";
}) {
  const toneClass =
    tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${toneClass}`}>{value}</span>
    </div>
  );
}
