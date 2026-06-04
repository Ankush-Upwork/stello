import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";

import { NewSaleForm } from "@/app/(app)/sales/new-sale-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New sale · Sello" };

export default async function NewSalePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [products, customersRes] = await Promise.all([
    fetchProductsWithVariants(supabase, user.id),
    supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  const sellableProducts = products.filter((p) => p.status === "active");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/sales" aria-label="Back to sales">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New sale</h1>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Add products first"
          description="You need at least one product before you can record a sale."
          action={
            <Button asChild size="lg">
              <Link href="/products/new">Add a product</Link>
            </Button>
          }
        />
      ) : (
        <NewSaleForm
          products={sellableProducts}
          customers={customersRes.data ?? []}
        />
      )}
    </div>
  );
}
