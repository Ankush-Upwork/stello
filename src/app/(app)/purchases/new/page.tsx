import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";

import { NewPurchaseForm } from "@/app/(app)/purchases/new-purchase-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New purchase · Sello" };

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { supplier } = await searchParams;
  const supabase = await createClient();
  const [products, suppliersRes] = await Promise.all([
    fetchProductsWithVariants(supabase, user.id),
    supabase.from("suppliers").select("*").eq("user_id", user.id).order("name"),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/purchases" aria-label="Back to purchases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New purchase</h1>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Add products first"
          description="You need products before you can buy stock for them."
          action={
            <Button asChild size="lg">
              <Link href="/products/new">Add a product</Link>
            </Button>
          }
        />
      ) : (
        <NewPurchaseForm
          products={products}
          suppliers={suppliersRes.data ?? []}
          defaultSupplierId={supplier}
        />
      )}
    </div>
  );
}
