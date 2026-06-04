import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown when a feature needs a paid (or higher) plan. */
export function UpgradeNudge({
  title = "This is a paid feature",
  description = "Upgrade your plan to unlock AI features.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-primary/5 px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5">
        <Link href="/pricing">
          <Sparkles className="h-4 w-4" /> View plans
        </Link>
      </Button>
    </div>
  );
}
