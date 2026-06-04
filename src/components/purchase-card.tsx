import Link from "next/link";
import { Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/currency-display";
import type { PurchaseWithSupplier } from "@/lib/queries/purchases";
import { formatDate } from "@/lib/utils";

export function PurchaseCard({ purchase }: { purchase: PurchaseWithSupplier }) {
  return (
    <Link
      href={`/purchases/${purchase.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
          {purchase.supplier_name ?? "No supplier"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(purchase.purchase_date)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <CurrencyDisplay amount={purchase.total_amount} className="font-semibold" />
        {purchase.pending_amount > 0 ? (
          <Badge variant="warning" className="mt-1 block">
            <CurrencyDisplay amount={purchase.pending_amount} /> due
          </Badge>
        ) : (
          <Badge variant="success" className="mt-1 block">
            Paid
          </Badge>
        )}
      </div>
    </Link>
  );
}
