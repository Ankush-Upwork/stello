import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ImageIcon, Megaphone, Pencil, TriangleAlert } from "lucide-react";

import { DeleteProductButton } from "@/app/(app)/products/[id]/delete-product-button";
import { CurrencyDisplay } from "@/components/currency-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import {
  getStockStatus,
  profitPerUnit,
  sellingPriceRange,
  totalQuantity,
} from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const { data: variantData } = product.has_variants
    ? await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: true })
    : { data: [] };
  const variants = variantData ?? [];

  const qty = totalQuantity(product, variants);
  const status = getStockStatus(qty, product.low_stock_threshold);
  const profit = profitPerUnit(product);
  const range = sellingPriceRange(product, variants);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/products" aria-label="Back to products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold">{product.product_name}</h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/products/${id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="relative aspect-video w-full bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.product_name}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        <CardContent className="space-y-5 pt-5">
          {/* Status + price row */}
          <div className="flex flex-wrap items-center gap-2">
            {product.status === "inactive" && (
              <Badge variant="secondary">Inactive</Badge>
            )}
            {status === "out" ? (
              <Badge variant="destructive">
                <TriangleAlert className="mr-1 h-3 w-3" /> Out of stock
              </Badge>
            ) : status === "low" ? (
              <Badge variant="warning">
                <TriangleAlert className="mr-1 h-3 w-3" /> Low stock
              </Badge>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
            {product.category && <Badge variant="outline">{product.category}</Badge>}
          </div>

          {/* Pricing */}
          {product.has_variants ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Selling price"
                value={
                  range.min === range.max
                    ? formatCurrency(range.min)
                    : `${formatCurrency(range.min)}–${formatCurrency(range.max)}`
                }
              />
              <Stat label="Total stock" value={String(qty)} />
              <Stat label="Variants" value={String(variants.length)} />
              <Stat label="Low stock at" value={String(product.low_stock_threshold)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Selling price" value={<CurrencyDisplay amount={product.selling_price} />} />
              <Stat label="Purchase price" value={<CurrencyDisplay amount={product.purchase_price} />} />
              <Stat
                label="Profit / unit"
                value={<CurrencyDisplay amount={profit} />}
                tone={profit >= 0 ? "green" : "red"}
              />
              <Stat label="In stock" value={String(qty)} />
            </div>
          )}

          {/* Variants table */}
          {product.has_variants && variants.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium">Colour</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variants.map((v) => {
                    const vStatus = getStockStatus(
                      v.quantity,
                      product.low_stock_threshold
                    );
                    return (
                      <tr key={v.id}>
                        <td className="px-3 py-2">{v.size || "—"}</td>
                        <td className="px-3 py-2">{v.color || "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={
                              vStatus === "out"
                                ? "text-red-600"
                                : vStatus === "low"
                                  ? "text-amber-600"
                                  : ""
                            }
                          >
                            {v.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(v.selling_price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Attributes */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {!product.has_variants && <Detail label="Size" value={product.size} />}
            {!product.has_variants && <Detail label="Colour" value={product.color} />}
            <Detail label="Design" value={product.design} />
            <Detail label="Brand" value={product.brand} />
            <Detail label="Material" value={product.material} />
            <Detail label="SKU" value={product.sku} />
            <Detail label="Barcode" value={product.barcode} />
            {!product.has_variants && (
              <Detail label="Low stock at" value={String(product.low_stock_threshold)} />
            )}
          </dl>

          {/* Supplier */}
          {(product.supplier_name || product.supplier_phone) && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="mb-1 font-medium">Supplier</p>
              <p className="text-muted-foreground">
                {product.supplier_name ?? "—"}
                {product.supplier_phone ? ` · ${product.supplier_phone}` : ""}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/products/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/products/${id}/marketing`}>
                <Megaphone className="h-4 w-4" /> Marketing
              </Link>
            </Button>
            <DeleteProductButton id={product.id} name={product.product_name} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "green" | "red";
}) {
  const toneClass =
    tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "";
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
