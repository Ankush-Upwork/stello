import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { RestockClient } from "@/app/(app)/restock/restock-client";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getAiGate } from "@/lib/queries/subscription";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "AI Restock · Sello" };

export default async function RestockPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const gate = await getAiGate(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/purchases" aria-label="Back to purchases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" /> AI Restock
        </h1>
      </div>
      <RestockClient allowed={gate.allowed} remaining={gate.paid ? null : gate.remaining} />
    </div>
  );
}
