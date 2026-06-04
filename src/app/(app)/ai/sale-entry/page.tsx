import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, Sparkles } from "lucide-react";

import { AiSaleEntry } from "@/app/(app)/ai/sale-entry/ai-sale-entry";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchProductsWithVariants } from "@/lib/queries/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Sale Entry · Sello" };

export default async function AiSaleEntryPage() {
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" /> AI Sale Entry
        </h1>
        <p className="text-muted-foreground">
          Type what you sold in plain language — the assistant turns it into a
          sale you can review and confirm.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Add products first"
          description="The assistant matches what you type against your products, so add some first."
          action={
            <Button asChild size="lg">
              <Link href="/products/new">Add a product</Link>
            </Button>
          }
        />
      ) : (
        <AiSaleEntry products={products} customers={customersRes.data ?? []} />
      )}
    </div>
  );
}
