"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteSale } from "@/app/(app)/sales/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteSaleDialog({
  id,
  invoice,
}: {
  id: string;
  invoice: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [restore, setRestore] = React.useState(true);
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    try {
      await deleteSale(id, restore);
      toast.success(
        restore ? "Sale deleted, stock restored." : "Sale deleted."
      );
      router.push("/sales");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the sale.");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete sale {invoice}?</DialogTitle>
          <DialogDescription>
            This permanently removes the sale and reverses the customer's pending
            amount. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={restore}
            onChange={(e) => setRestore(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm">
            Add the sold items back to stock
          </span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Delete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
