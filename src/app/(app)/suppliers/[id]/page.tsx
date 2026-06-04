import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Pencil, Phone, Plus, Truck } from "lucide-react";

import { DeleteSupplierButton } from "@/app/(app)/suppliers/[id]/delete-supplier-button";
import { CurrencyDisplay } from "@/components/currency-display";
import { EmptyState } from "@/components/empty-state";
import { PurchaseCard } from "@/components/purchase-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { fetchPurchasesWithSupplier } from "@/lib/queries/purchases";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!supplier) notFound();

  const purchases = await fetchPurchasesWithSupplier(supabase, user.id, {
    supplierId: id,
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/suppliers" aria-label="Back to suppliers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold">{supplier.name}</h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/suppliers/${id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      {(supplier.phone || supplier.address || supplier.notes) && (
        <Card className="space-y-1 p-4 text-sm">
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4" /> {supplier.phone}
            </a>
          )}
          {supplier.address && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {supplier.address}
            </p>
          )}
          {supplier.notes && <p className="text-muted-foreground">{supplier.notes}</p>}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total purchased" value={supplier.total_purchase_amount} />
        <Stat label="Paid" value={supplier.total_paid_amount} tone="green" />
        <Stat label="Pending" value={supplier.total_pending_amount} tone="amber" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Purchase history</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/purchases/new?supplier=${id}`}>
              <Plus className="h-4 w-4" /> New purchase
            </Link>
          </Button>
        </div>
        {purchases.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No purchases yet"
            description="Record a purchase from this supplier to add stock."
          />
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => (
              <PurchaseCard key={p.id} purchase={p} />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <DeleteSupplierButton id={supplier.id} name={supplier.name} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "amber";
}) {
  const toneClass =
    tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "";
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold", toneClass)}>
        <CurrencyDisplay amount={value} />
      </p>
    </Card>
  );
}
