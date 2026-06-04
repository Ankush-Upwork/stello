import Link from "next/link";
import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/currency-display";
import type { Customer } from "@/lib/supabase/types";

export function CustomerCard({ customer }: { customer: Customer }) {
  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pending = customer.total_pending_amount;

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initials || "?"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{customer.name}</p>
        {customer.phone ? (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> {customer.phone}
          </p>
        ) : customer.city ? (
          <p className="truncate text-sm text-muted-foreground">{customer.city}</p>
        ) : null}
      </div>

      {pending > 0 && (
        <Badge variant="warning" className="shrink-0">
          <CurrencyDisplay amount={pending} className="font-semibold" />
          <span className="ml-1">due</span>
        </Badge>
      )}
    </Link>
  );
}
