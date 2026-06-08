"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { approveUpgrade, rejectUpgrade } from "@/app/(app)/admin/upgrades/actions";
import { Button } from "@/components/ui/button";

export function RequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);

  async function run(kind: "approve" | "reject") {
    setBusy(kind);
    try {
      if (kind === "approve") {
        await approveUpgrade(id);
        toast.success("Approved & user upgraded.");
      } else {
        await rejectUpgrade(id);
        toast.success("Request rejected.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run("approve")} disabled={busy !== null}>
        {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => run("reject")}
        disabled={busy !== null}
      >
        {busy === "reject" ? <Loader2 className="animate-spin" /> : <X className="h-4 w-4" />}
        Reject
      </Button>
    </div>
  );
}
