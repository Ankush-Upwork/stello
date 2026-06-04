import type { SaleItem } from "@/lib/supabase/types";

export type InvoiceLine = {
  name: string;
  variant: string;
  qty: number;
  unitPrice: number;
  amount: number;
  gstRate: number;
  taxable: number;
  tax: number;
};

export type RateGroup = {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
};

/**
 * Builds a GST breakup from sale items, treating line totals as GST-INCLUSIVE
 * (standard for Indian retail MRP). taxable = amount / (1 + rate/100).
 */
export function computeInvoice(items: SaleItem[]) {
  const lines: InvoiceLine[] = items.map((it) => {
    const amount = it.line_total;
    const rate = it.gst_rate ?? 0;
    const taxable = rate > 0 ? amount / (1 + rate / 100) : amount;
    const tax = amount - taxable;
    return {
      name: it.product_name_snapshot,
      variant: [it.size_snapshot, it.color_snapshot].filter(Boolean).join(" / "),
      qty: it.quantity,
      unitPrice: it.unit_price,
      amount,
      gstRate: rate,
      taxable,
      tax,
    };
  });

  const totalTaxable = lines.reduce((s, l) => s + l.taxable, 0);
  const totalTax = lines.reduce((s, l) => s + l.tax, 0);
  const totalAmount = lines.reduce((s, l) => s + l.amount, 0);

  // Group tax by rate for the summary table.
  const rateMap = new Map<number, RateGroup>();
  for (const l of lines) {
    if (l.gstRate <= 0) continue;
    const g = rateMap.get(l.gstRate) ?? { rate: l.gstRate, taxable: 0, cgst: 0, sgst: 0 };
    g.taxable += l.taxable;
    g.cgst += l.tax / 2;
    g.sgst += l.tax / 2;
    rateMap.set(l.gstRate, g);
  }

  return {
    lines,
    totalTaxable,
    totalTax,
    totalAmount,
    cgst: totalTax / 2,
    sgst: totalTax / 2,
    hasGst: totalTax > 0.01,
    byRate: [...rateMap.values()].sort((a, b) => a.rate - b.rate),
  };
}
