import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Pencil, Phone, ShoppingCart } from "lucide-react";

import { DeleteCustomerButton } from "@/app/(app)/customers/[id]/delete-customer-button";
import { CurrencyDisplay } from "@/components/currency-display";
import { EmptyState } from "@/components/empty-state";
import { SaleCard } from "@/components/sale-card";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { fetchSalesWithCustomer } from "@/lib/queries/sales";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buildReminderMessage } from "@/lib/whatsapp";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!customer) notFound();

  const sales = await fetchSalesWithCustomer(supabase, user.id, {
    customerId: customer.id,
  });

  const business = await getCurrentBusiness();
  const pendingSales = sales.filter((s) => s.pending_amount > 0);
  const reminderMessage = buildReminderMessage({
    customerName: customer.name,
    businessName: business?.business_name ?? "our shop",
    pendingAmount: customer.total_pending_amount,
    // Reference the invoice only when there's a single outstanding bill.
    invoiceNumber:
      pendingSales.length === 1 ? pendingSales[0].invoice_number : null,
  });

  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/customers" aria-label="Back to customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-bold">{customer.name}</h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/customers/${id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials || "?"}
            </span>
            <div className="min-w-0 space-y-1 text-sm">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {customer.email}
                </p>
              )}
              {(customer.address || customer.city) && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[customer.address, customer.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {customer.notes && (
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {customer.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account summary */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total purchase" value={customer.total_purchase_amount} />
        <Stat label="Paid" value={customer.total_paid_amount} tone="green" />
        <Stat label="Pending" value={customer.total_pending_amount} tone="amber" />
      </div>

      {customer.total_pending_amount > 0 && (
        <WhatsAppButton
          phone={customer.phone}
          message={reminderMessage}
          label="Send payment reminder"
          className="w-full"
        />
      )}

      {/* Purchase history */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Purchase history</h2>
        {sales.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No sales yet"
            description="Sales for this customer will appear here once you record them."
          />
        ) : (
          <div className="space-y-3">
            {sales.map((s) => (
              <SaleCard key={s.id} sale={s} />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <DeleteCustomerButton id={customer.id} name={customer.name} />
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
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "";
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold", toneClass)}>
        <CurrencyDisplay amount={value} />
      </p>
    </Card>
  );
}
