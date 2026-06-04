import Link from "next/link";
import { redirect } from "next/navigation";
import { Phone, Plus, Truck } from "lucide-react";

import { CurrencyDisplay } from "@/components/currency-display";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Suppliers · Sello" };

export default async function SuppliersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const list = suppliers ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Who you buy stock from</p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="h-4 w-4" /> Add supplier
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No suppliers yet"
          description="Add suppliers to record purchases and track what you owe them."
          action={
            <Button asChild size="lg">
              <Link href="/suppliers/new">
                <Plus className="h-4 w-4" /> Add your first supplier
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.name}</p>
                {s.phone && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {s.phone}
                  </p>
                )}
              </div>
              {s.total_pending_amount > 0 && (
                <Badge variant="warning" className="shrink-0">
                  <CurrencyDisplay amount={s.total_pending_amount} /> due
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
