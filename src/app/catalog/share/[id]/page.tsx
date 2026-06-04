import Image from "next/image";
import { Boxes, ImageIcon, MapPin, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { businessTypeLabel } from "@/lib/constants";
import {
  catalogInStock,
  catalogPriceRange,
  catalogVariantSummary,
  type CatalogData,
  type CatalogProduct,
} from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export const metadata = { title: "Catalog · Sello" };

export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_catalog", {
    p_business_id: id,
  });

  const catalog = (data as CatalogData | null) ?? null;

  if (error || !catalog?.business) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <Boxes className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Catalog not found</h1>
          <p className="text-sm text-muted-foreground">
            This catalog link may be incorrect or no longer available.
          </p>
        </div>
      </main>
    );
  }

  const { business, products } = catalog;
  const inStock = products.filter(catalogInStock);

  return (
    <main className="min-h-dvh bg-muted/30 pb-16">
      {/* Header */}
      <header className="bg-primary px-5 py-8 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-90">
            <span>{businessTypeLabel(business.type)}</span>
            {business.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {business.city}
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6">
        {inStock.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No products available right now. Please check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {inStock.map((p) => (
              <CatalogCard
                key={p.id}
                product={p}
                businessName={business.name}
                phone={business.phone}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Powered by Sello
        </p>
      </div>
    </main>
  );
}

function CatalogCard({
  product,
  businessName,
  phone,
}: {
  product: CatalogProduct;
  businessName: string;
  phone: string | null;
}) {
  const range = catalogPriceRange(product);
  const priceLabel =
    range.min === range.max
      ? formatCurrency(range.min)
      : `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
  const summary = catalogVariantSummary(product);

  const orderMessage = `Hi ${businessName}, I'm interested in "${product.name}"${
    summary ? ` (${summary})` : ""
  } priced ${priceLabel}. Is it available?`;
  const orderHref = waLink(phone, orderMessage);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-square w-full bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {product.category && (
          <Badge variant="secondary" className="absolute left-1.5 top-1.5">
            {product.category}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
        {summary && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{summary}</p>
        )}
        <p className="mt-1 font-bold">{priceLabel}</p>

        <div className="mt-3">
          {orderHref ? (
            <Button asChild variant="whatsapp" size="sm" className="w-full">
              <a href={orderHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Order
              </a>
            </Button>
          ) : (
            <Button variant="whatsapp" size="sm" className="w-full" disabled>
              Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
