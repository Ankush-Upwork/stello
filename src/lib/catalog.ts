export type CatalogVariant = {
  size: string | null;
  color: string | null;
  selling_price: number;
  quantity: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  has_variants: boolean;
  size: string | null;
  color: string | null;
  selling_price: number;
  quantity: number;
  variants: CatalogVariant[];
};

export type CatalogData = {
  business: {
    name: string;
    type: string;
    phone: string | null;
    city: string | null;
  } | null;
  products: CatalogProduct[];
};

export function catalogPriceRange(p: CatalogProduct): { min: number; max: number } {
  if (p.has_variants && p.variants.length > 0) {
    const prices = p.variants.map((v) => v.selling_price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: p.selling_price, max: p.selling_price };
}

export function catalogInStock(p: CatalogProduct): boolean {
  return p.has_variants ? p.variants.length > 0 : p.quantity > 0;
}

/** "S, M, L" / "Red, Blue" summary line for a catalog product. */
export function catalogVariantSummary(p: CatalogProduct): string {
  if (!p.has_variants) {
    return [p.size, p.color].filter(Boolean).join(" · ");
  }
  const sizes = Array.from(
    new Set(p.variants.map((v) => v.size).filter(Boolean))
  );
  const colors = Array.from(
    new Set(p.variants.map((v) => v.color).filter(Boolean))
  );
  return [sizes.join(", "), colors.join(", ")].filter(Boolean).join(" · ");
}
