import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Phone, Wallet } from "lucide-react";

import { CurrencyDisplay } from "@/components/currency-display";
import { EmptyState } from "@/components/empty-state";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildReminderMessage } from "@/lib/whatsapp";

export const metadata = { title: "Pending Payments · Sello" };

export default async function PendingPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .gt("total_pending_amount", 0)
    .order("total_pending_amount", { ascending: false });

  const list = customers ?? [];
  const business = await getCurrentBusiness();
  const businessName = business?.business_name ?? "our shop";
  const totalPending = list.reduce((s, c) => s + c.total_pending_amount, 0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pending Payments</h1>
        <p className="text-muted-foreground">Customers who owe you money</p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No pending payments"
          description="Everyone's paid up. Outstanding balances will show here when customers owe money."
        />
      ) : (
        <>
          <Card className="bg-amber-50">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm text-amber-700">Total outstanding</p>
                <p className="text-2xl font-bold text-amber-800">
                  <CurrencyDisplay amount={totalPending} />
                </p>
              </div>
              <p className="text-sm text-amber-700">
                {list.length} {list.length === 1 ? "customer" : "customers"}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {list.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex min-w-0 items-center justify-between gap-2 sm:flex-1"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.name}</p>
                      {c.phone && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      <span className="font-semibold text-amber-600">
                        <CurrencyDisplay amount={c.total_pending_amount} />
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>

                  <WhatsAppButton
                    phone={c.phone}
                    message={buildReminderMessage({
                      customerName: c.name,
                      businessName,
                      pendingAmount: c.total_pending_amount,
                    })}
                    label="Remind"
                    size="sm"
                    className="sm:w-auto"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
