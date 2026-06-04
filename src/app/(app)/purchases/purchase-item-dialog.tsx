"use client";

import * as React from "react";
import { ChevronRight, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProductWithVariants } from "@/lib/supabase/types";

export type PickedPurchaseItem = {
  product_id: string;
  variant_id: string | null;
  name: string;
  size: string | null;
  color: string | null;
  purchase_price: number;
};

/** Like the sale item picker, but for buying stock — no out-of-stock gating,
 *  and it uses the cost (purchase) price. */
export function PurchaseItemDialog({
  products,
  onPick,
}: {
  products: ProductWithVariants[];
  onPick: (item: PickedPurchaseItem) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.product_name, p.category, p.sku, p.brand, ...p.variants.flatMap((v) => [v.size, v.color])]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    );
  }, [products, query]);

  function pick(item: PickedPurchaseItem) {
    onPick(item);
    setOpen(false);
    setExpanded(null);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add item to purchase</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            inputMode="search"
          />
        </div>

        <div className="-mx-1 max-h-[55vh] space-y-1 overflow-y-auto px-1">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No products found.</p>
          )}

          {filtered.map((p) => {
            if (p.has_variants) {
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="flex w-full items-center justify-between gap-2 p-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.product_name}</span>
                      <span className="text-xs text-muted-foreground">{p.variants.length} variants</span>
                    </span>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t">
                      {p.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            pick({
                              product_id: p.id,
                              variant_id: v.id,
                              name: p.product_name,
                              size: v.size,
                              color: v.color,
                              purchase_price: v.purchase_price,
                            })
                          }
                          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/60"
                        >
                          <span className="truncate">
                            {[v.size, v.color].filter(Boolean).join(" · ") || "Variant"}
                          </span>
                          <span className="shrink-0 text-muted-foreground">{v.quantity} in stock</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  pick({
                    product_id: p.id,
                    variant_id: null,
                    name: p.product_name,
                    size: p.size,
                    color: p.color,
                    purchase_price: p.purchase_price,
                  })
                }
                className="flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left hover:bg-muted/60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.product_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[p.size, p.color].filter(Boolean).join(" · ") || p.category || ""} · {p.quantity} in stock
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
