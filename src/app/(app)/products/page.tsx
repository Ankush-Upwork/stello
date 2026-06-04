import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, Plus, Sparkles, Upload } from "lucide-react";

import { ProductsBrowser } from "@/app/(app)/products/products-browser";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products · Sello" };

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const list = await fetchProductsWithVariants(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Your shop inventory</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Import products">
            <Link href="/products/import">
              <Upload className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No products yet"
          description="Add your first product with a photo, size, colour and stock quantity."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products/quick-setup">
                  <Sparkles className="h-4 w-4" /> AI Quick Setup
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products/new">
                  <Plus className="h-4 w-4" /> Add manually
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <ProductsBrowser products={list} />
      )}
    </div>
  );
}
