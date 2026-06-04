import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, Share2 } from "lucide-react";

import { CatalogShare } from "@/app/(app)/catalog/catalog-share";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Catalog · Sello" };

export default async function CatalogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getCurrentBusiness();
  if (!business) redirect("/settings/business-profile");

  const supabase = await createClient();
  const products = await fetchProductsWithVariants(supabase, user.id);
  const active = products.filter((p) => p.status === "active");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Share2 className="h-6 w-6 text-primary" /> Catalog
        </h1>
        <p className="text-muted-foreground">
          Share your products with customers via one link.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your catalog link</CardTitle>
          <CardDescription>
            Anyone with this link can browse your active products and order on
            WhatsApp. Prices show; your costs and suppliers stay private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogShare
            businessId={business.id}
            businessName={business.business_name}
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          In your catalog{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({active.length} active product{active.length === 1 ? "" : "s"})
          </span>
        </h2>

        {active.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No active products"
            description="Add products (set to Active) to show them in your catalog."
            action={
              <Button asChild size="lg">
                <Link href="/products/new">Add a product</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {active.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
