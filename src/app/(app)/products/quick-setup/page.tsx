import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { QuickSetup } from "@/app/(app)/products/quick-setup/quick-setup";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getUserPlan, planHasAiFeatures } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Quick Setup · Sello" };

export default async function QuickSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const plan = await getUserPlan(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/products" aria-label="Back to products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" /> AI Quick Setup
        </h1>
      </div>
      <QuickSetup allowed={planHasAiFeatures(plan)} />
    </div>
  );
}
