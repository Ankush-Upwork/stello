import type { Product, ProductVariant } from "@/lib/supabase/types";

export type StockStatus = "out" | "low" | "ok";

/** Total stock for a product: sum of variants if it has them, else its own qty. */
export function totalQuantity(
  product: Pick<Product, "has_variants" | "quantity">,
  variants: Pick<ProductVariant, "quantity">[] = []
): number {
  if (product.has_variants) {
    return variants.reduce((sum, v) => sum + (v.quantity ?? 0), 0);
  }
  return product.quantity;
}

/** Inventory value at purchase or selling price, variant-aware. */
export function inventoryValue(
  product: Pick<
    Product,
    "has_variants" | "quantity" | "purchase_price" | "selling_price"
  >,
  variants: Pick<ProductVariant, "quantity" | "purchase_price" | "selling_price">[] = [],
  basis: "purchase" | "selling"
): number {
  const priceKey = basis === "purchase" ? "purchase_price" : "selling_price";
  if (product.has_variants) {
    return variants.reduce(
      (sum, v) => sum + (v.quantity ?? 0) * (v[priceKey] ?? 0),
      0
    );
  }
  return product.quantity * product[priceKey];
}

/** Selling-price display: a single value, or a "₹min – ₹max" range for variants. */
export function sellingPriceRange(
  product: Pick<Product, "has_variants" | "selling_price">,
  variants: Pick<ProductVariant, "selling_price">[] = []
): { min: number; max: number } {
  if (product.has_variants && variants.length > 0) {
    const prices = variants.map((v) => v.selling_price ?? 0);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: product.selling_price, max: product.selling_price };
}

/** Out of stock when qty <= 0; low when qty <= threshold; otherwise ok. */
export function getStockStatus(
  quantity: number,
  lowStockThreshold: number
): StockStatus {
  if (quantity <= 0) return "out";
  if (quantity <= lowStockThreshold) return "low";
  return "ok";
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  out: "Out of stock",
  low: "Low stock",
  ok: "In stock",
};

/** A short "Size · Colour" style line, skipping blank attributes. */
export function productVariantLine(p: Pick<Product, "size" | "color">): string {
  return [p.size, p.color].filter(Boolean).join(" · ");
}

export function profitPerUnit(p: Pick<Product, "selling_price" | "purchase_price">) {
  return (p.selling_price ?? 0) - (p.purchase_price ?? 0);
}
