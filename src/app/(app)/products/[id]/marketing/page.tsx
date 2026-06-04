import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MarketingStudio } from "@/app/(app)/products/[id]/marketing/marketing-studio";
import { Button } from "@/components/ui/button";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { businessTypeLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Marketing · Sello" };

export default async function ProductMarketingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const business = await getCurrentBusiness();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/products/${id}`} aria-label="Back to product">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Marketing</h1>
          <p className="truncate text-muted-foreground">{product.product_name}</p>
        </div>
      </div>

      <MarketingStudio
        businessName={business?.business_name ?? "our shop"}
        businessType={businessTypeLabel(business?.business_type)}
        productName={product.product_name}
        category={product.category}
        color={product.color}
        size={product.size}
        price={product.selling_price}
      />
    </div>
  );
}
