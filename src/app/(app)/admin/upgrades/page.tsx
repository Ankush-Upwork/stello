import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { RequestActions } from "@/app/(app)/admin/upgrades/request-row";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Upgrade requests · Sello" };

export default async function AdminUpgradesPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/dashboard");

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("upgrade_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const list = requests ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" /> Upgrade requests
        </h1>
        <p className="text-muted-foreground">
          Approve after you&apos;ve confirmed the customer&apos;s payment.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending requests"
          description="Upgrade requests from customers will appear here."
        />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.email ?? r.user_id}</p>
                  <p className="text-sm text-muted-foreground">
                    Wants <span className="font-medium capitalize text-foreground">{r.plan_id}</span>{" "}
                    · {formatDate(r.created_at)}
                  </p>
                </div>
                <RequestActions id={r.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
