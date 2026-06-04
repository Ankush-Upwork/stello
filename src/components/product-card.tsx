import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Layers, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getStockStatus,
  productVariantLine,
  sellingPriceRange,
  totalQuantity,
} from "@/lib/products";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/supabase/types";

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const variants = product.variants ?? [];
  const qty = totalQuantity(product, variants);
  const status = getStockStatus(qty, product.low_stock_threshold);

  const range = sellingPriceRange(product, variants);
  const priceLabel =
    range.min === range.max
      ? formatCurrency(range.min)
      : `${formatCurrency(range.min)}–${formatCurrency(range.max)}`;

  const variantLine = product.has_variants
    ? `${variants.length} ${variants.length === 1 ? "variant" : "variants"}`
    : productVariantLine(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative h-28 w-28 shrink-0 bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.product_name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        {product.status === "inactive" && (
          <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Inactive
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold">{product.product_name}</h3>
            <span className="shrink-0 text-sm font-semibold">{priceLabel}</span>
          </div>
          {variantLine && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
              {product.has_variants && <Layers className="h-3.5 w-3.5" />}
              {variantLine}
            </p>
          )}
          {product.category && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {product.category}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            Qty: <span className="font-medium text-foreground">{qty}</span>
          </span>
          {status === "out" ? (
            <Badge variant="destructive">
              <TriangleAlert className="mr-1 h-3 w-3" /> Out of stock
            </Badge>
          ) : status === "low" ? (
            <Badge variant="warning">
              <TriangleAlert className="mr-1 h-3 w-3" /> Low stock
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
