import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";

import { CustomersBrowser } from "@/app/(app)/customers/customers-browser";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Customers · Sello" };

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = customers ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Your shop's customers</p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4" /> Add customer
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add customers to track their purchases and pending payments."
          action={
            <Button asChild size="lg">
              <Link href="/customers/new">
                <Plus className="h-4 w-4" /> Add your first customer
              </Link>
            </Button>
          }
        />
      ) : (
        <CustomersBrowser customers={list} />
      )}
    </div>
  );
}
