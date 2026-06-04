import Link from "next/link";
import { redirect } from "next/navigation";
import { PackagePlus, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PurchaseCard } from "@/components/purchase-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchPurchasesWithSupplier } from "@/lib/queries/purchases";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Purchases · Sello" };

export default async function PurchasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const purchases = await fetchPurchasesWithSupplier(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Stock you've bought in</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/restock">
              <Sparkles className="h-4 w-4" /> AI Restock
            </Link>
          </Button>
          <Button asChild>
            <Link href="/purchases/new">
              <Plus className="h-4 w-4" /> New purchase
            </Link>
          </Button>
        </div>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="No purchases yet"
          description="Record a purchase to add stock and track what you owe suppliers."
          action={
            <Button asChild size="lg">
              <Link href="/purchases/new">
                <Plus className="h-4 w-4" /> Record a purchase
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {purchases.map((p) => (
            <PurchaseCard key={p.id} purchase={p} />
          ))}
        </div>
      )}
    </div>
  );
}
