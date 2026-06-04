"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductWithVariants } from "@/lib/supabase/types";

const ALL = "__all__";

export function ProductsBrowser({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);

  // Build the category list from what actually exists.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== ALL && p.category !== category) return false;
      if (!q) return true;
      const haystack = [
        p.product_name,
        p.category,
        p.sku,
        p.brand,
        p.color,
        p.size,
        p.design,
        ...p.variants.flatMap((v) => [v.size, v.color, v.sku]),
      ];
      return haystack
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [products, query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, SKU, colour…"
            className="pl-9"
            inputMode="search"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
        {(query || category !== ALL) && ` of ${products.length}`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products match"
          description="Try a different search term or category filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
