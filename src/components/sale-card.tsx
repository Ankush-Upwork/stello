import Link from "next/link";
import { User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/currency-display";
import type { Sale } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export type SaleWithCustomer = Sale & { customer_name: string | null };

export function SaleCard({ sale }: { sale: SaleWithCustomer }) {
  return (
    <Link
      href={`/sales/${sale.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold">{sale.invoice_number}</p>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {sale.customer_name ?? "Walk-in customer"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(sale.sale_date)}
          {sale.payment_mode ? ` · ${sale.payment_mode}` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <CurrencyDisplay amount={sale.total_amount} className="font-semibold" />
        {sale.pending_amount > 0 ? (
          <Badge variant="warning" className="mt-1 block">
            <CurrencyDisplay amount={sale.pending_amount} /> due
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
