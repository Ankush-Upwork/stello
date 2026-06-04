import { notFound, redirect } from "next/navigation";

import { InvoiceView } from "@/app/invoice/[id]/invoice-view";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Invoice · Sello" };

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sale) notFound();

  const [{ data: items }, business, customerRes] = await Promise.all([
    supabase.from("sale_items").select("*").eq("sale_id", id).order("created_at"),
    getCurrentBusiness(),
    sale.customer_id
      ? supabase.from("customers").select("*").eq("id", sale.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <InvoiceView
      sale={sale}
      items={items ?? []}
      business={business}
      customer={customerRes.data}
    />
  );
}
