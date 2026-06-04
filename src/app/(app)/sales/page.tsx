import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ReceiptText } from "lucide-react";

import { SalesBrowser } from "@/app/(app)/sales/sales-browser";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { fetchSalesWithCustomer } from "@/lib/queries/sales";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sales · Sello" };

export default async function SalesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const sales = await fetchSalesWithCustomer(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Your recorded sales</p>
        </div>
        <Button asChild>
          <Link href="/sales/new">
            <Plus className="h-4 w-4" /> New sale
          </Link>
        </Button>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No sales yet"
          description="Record your first sale — stock reduces automatically and pending payments are tracked."
          action={
            <Button asChild size="lg">
              <Link href="/sales/new">
                <Plus className="h-4 w-4" /> Record your first sale
              </Link>
            </Button>
          }
        />
      ) : (
        <SalesBrowser sales={sales} />
      )}
    </div>
  );
}
