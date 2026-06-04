import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, User } from "lucide-react";

import { CollectPayment } from "@/app/(app)/sales/[id]/collect-payment";
import { DeleteSaleDialog } from "@/app/(app)/sales/[id]/delete-sale-dialog";
import { CurrencyDisplay } from "@/components/currency-display";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { buildInvoiceMessage, buildReminderMessage } from "@/lib/whatsapp";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!sale) notFound();

  const [{ data: items }, customerRes] = await Promise.all([
    supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id)
      .order("created_at", { ascending: true }),
    sale.customer_id
      ? supabase.from("customers").select("*").eq("id", sale.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const lineItems = items ?? [];
  const customer = customerRes.data;
  const business = await getCurrentBusiness();
  const businessName = business?.business_name ?? "our shop";

  const invoiceMessage = buildInvoiceMessage({
    customerName: customer?.name,
    businessName,
    invoiceNumber: sale.invoice_number,
    items: lineItems.map((it) => ({
      name: it.product_name_snapshot,
      size: it.size_snapshot,
      color: it.color_snapshot,
      quantity: it.quantity,
      lineTotal: it.line_total,
    })),
    totalAmount: sale.total_amount,
    paidAmount: sale.paid_amount,
    pendingAmount: sale.pending_amount,
  });

  const reminderMessage = buildReminderMessage({
    customerName: customer?.name,
    businessName,
    pendingAmount: sale.pending_amount,
    invoiceNumber: sale.invoice_number,
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/sales" aria-label="Back to sales">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{sale.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(sale.sale_date)}</p>
          </div>
        </div>
        <Badge variant={sale.delivery_status === "Cancelled" ? "destructive" : "secondary"}>
          {sale.delivery_status}
        </Badge>
      </div>

      {/* Customer */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="truncate font-medium hover:underline">
                {customer.name}
                {customer.phone ? <span className="text-muted-foreground"> · {customer.phone}</span> : null}
              </Link>
            ) : (
              <span className="font-medium">Walk-in customer</span>
            )}
          </div>
          <WhatsAppButton
            phone={customer?.phone}
            message={invoiceMessage}
            label="Send invoice"
            size="sm"
          />
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-2 py-2.5 text-center font-medium">Qty</th>
                <th className="px-2 py-2.5 text-right font-medium">Price</th>
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
                    <CurrencyDisplay amount={it.unit_price} />
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

      {/* Totals */}
      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm">
          <Row label="Subtotal" value={<CurrencyDisplay amount={sale.subtotal} />} />
          {sale.discount_amount > 0 && (
            <Row
              label="Discount"
              value={<>− <CurrencyDisplay amount={sale.discount_amount} /></>}
            />
          )}
          <Row label="Total" value={<CurrencyDisplay amount={sale.total_amount} />} bold />
          <Row
            label={`Paid${sale.payment_mode ? ` (${sale.payment_mode})` : ""}`}
            value={<CurrencyDisplay amount={sale.paid_amount} />}
          />
          <Row
            label="Pending"
            value={<CurrencyDisplay amount={sale.pending_amount} />}
            bold
            tone={sale.pending_amount > 0 ? "amber" : "green"}
          />
        </CardContent>
      </Card>

      {sale.notes && (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {sale.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {sale.pending_amount > 0 && (
          <CollectPayment
            saleId={sale.id}
            invoice={sale.invoice_number}
            pending={sale.pending_amount}
            businessName={businessName}
            upiId={business?.upi_id ?? null}
          />
        )}
        <Button asChild variant="outline">
          <Link href={`/invoice/${sale.id}`}>
            <FileText className="h-4 w-4" /> Invoice / Print
          </Link>
        </Button>
        {sale.pending_amount > 0 && customer && (
          <WhatsAppButton
            phone={customer.phone}
            message={reminderMessage}
            label="Send reminder"
            variant="outline"
          />
        )}
        <div className="ml-auto">
          <DeleteSaleDialog id={sale.id} invoice={sale.invoice_number} />
        </div>
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
