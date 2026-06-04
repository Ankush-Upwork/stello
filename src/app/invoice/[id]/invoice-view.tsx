"use client";

import * as React from "react";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { computeInvoice } from "@/lib/invoice";
import type { Business, Customer, Sale, SaleItem } from "@/lib/supabase/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function InvoiceView({
  sale,
  items,
  business,
  customer,
}: {
  sale: Sale;
  items: SaleItem[];
  business: Business | null;
  customer: Customer | null;
}) {
  const [thermal, setThermal] = React.useState(false);
  const inv = computeInvoice(items);

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-5">
      {/* Controls (hidden when printing) */}
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/sales/${sale.id}`} aria-label="Back to sale">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setThermal((v) => !v)}
          >
            <Receipt className="h-4 w-4" />
            {thermal ? "A4 view" : "Thermal view"}
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice sheet */}
      <div
        className={cn(
          "print-sheet mx-auto rounded-xl border bg-white p-6 text-slate-900 shadow-sm",
          thermal ? "max-w-[80mm] text-xs" : "max-w-3xl text-sm"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={cn("font-bold", thermal ? "text-base" : "text-xl")}>
              {business?.business_name ?? "Invoice"}
            </h1>
            {business?.address && <p className="text-slate-500">{business.address}</p>}
            <p className="text-slate-500">
              {[business?.city, business?.state, business?.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
            {business?.phone && <p className="text-slate-500">Ph: {business.phone}</p>}
            {business?.gstin && <p className="text-slate-500">GSTIN: {business.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase tracking-wide text-slate-500">
              {inv.hasGst ? "Tax Invoice" : "Invoice"}
            </p>
            <p className="font-bold">{sale.invoice_number}</p>
            <p className="text-slate-500">{formatDate(sale.sale_date)}</p>
          </div>
        </div>

        {customer && (
          <div className="mt-4 border-t pt-3">
            <p className="text-slate-500">Bill to</p>
            <p className="font-medium">{customer.name}</p>
            {customer.phone && <p className="text-slate-500">{customer.phone}</p>}
          </div>
        )}

        {/* Items */}
        <table className="mt-4 w-full">
          <thead>
            <tr className="border-y text-left text-slate-500">
              <th className="py-1.5 font-medium">Item</th>
              <th className="py-1.5 text-center font-medium">Qty</th>
              <th className="py-1.5 text-right font-medium">Rate</th>
              {!thermal && inv.hasGst && (
                <th className="py-1.5 text-right font-medium">GST</th>
              )}
              <th className="py-1.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-b border-dashed align-top">
                <td className="py-1.5">
                  {l.name}
                  {l.variant && <span className="block text-slate-400">{l.variant}</span>}
                </td>
                <td className="py-1.5 text-center">{l.qty}</td>
                <td className="py-1.5 text-right">{formatCurrency(l.unitPrice)}</td>
                {!thermal && inv.hasGst && (
                  <td className="py-1.5 text-right">{l.gstRate}%</td>
                )}
                <td className="py-1.5 text-right">{formatCurrency(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-3 ml-auto w-full max-w-[16rem] space-y-1">
          {inv.hasGst && (
            <>
              <Row label="Taxable value" value={formatCurrency(inv.totalTaxable)} />
              <Row label="CGST" value={formatCurrency(inv.cgst)} />
              <Row label="SGST" value={formatCurrency(inv.sgst)} />
            </>
          )}
          {sale.discount_amount > 0 && (
            <Row label="Discount" value={`− ${formatCurrency(sale.discount_amount)}`} />
          )}
          <div className="flex justify-between border-t pt-1 font-bold">
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          <Row label="Paid" value={formatCurrency(sale.paid_amount)} />
          {sale.pending_amount > 0 && (
            <Row label="Balance due" value={formatCurrency(sale.pending_amount)} />
          )}
        </div>

        {inv.hasGst && !thermal && inv.byRate.length > 0 && (
          <table className="mt-5 w-full border-t pt-2 text-xs text-slate-500">
            <thead>
              <tr className="text-left">
                <th className="py-1 font-medium">GST %</th>
                <th className="py-1 text-right font-medium">Taxable</th>
                <th className="py-1 text-right font-medium">CGST</th>
                <th className="py-1 text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {inv.byRate.map((g) => (
                <tr key={g.rate}>
                  <td className="py-0.5">{g.rate}%</td>
                  <td className="py-0.5 text-right">{formatCurrency(g.taxable)}</td>
                  <td className="py-0.5 text-right">{formatCurrency(g.cgst)}</td>
                  <td className="py-0.5 text-right">{formatCurrency(g.sgst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-6 text-center text-slate-400">
          Thank you for shopping with {business?.business_name ?? "us"}!
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
