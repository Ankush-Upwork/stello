"use client";

import { useMemo, useState } from "react";
import { Search, UserRoundSearch } from "lucide-react";

import { CustomerCard } from "@/components/customer-card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/supabase/types";

export function CustomersBrowser({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.city, c.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="pl-9"
          inputMode="search"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
        {query && ` of ${customers.length}`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserRoundSearch}
          title="No customers match"
          description="Try a different name or phone number."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </div>
      )}
    </div>
  );
}
