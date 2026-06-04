"use client";

import { useMemo, useState } from "react";
import { Search, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SaleCard, type SaleWithCustomer } from "@/components/sale-card";
import { Input } from "@/components/ui/input";

export function SalesBrowser({ sales }: { sales: SaleWithCustomer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) =>
      [s.invoice_number, s.customer_name, s.payment_mode]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    );
  }, [sales, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by invoice or customer…"
          className="pl-9"
          inputMode="search"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No sales match"
          description="Try a different invoice number or customer name."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((s) => (
            <SaleCard key={s.id} sale={s} />
          ))}
        </div>
      )}
    </div>
  );
}
