"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deletePurchase } from "@/app/(app)/purchases/actions";
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

export function DeletePurchaseDialog({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [removeStock, setRemoveStock] = React.useState(true);
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    try {
      await deletePurchase(id, removeStock);
      toast.success(removeStock ? "Purchase deleted, stock reduced." : "Purchase deleted.");
      router.push("/purchases");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the purchase.");
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
          <DialogTitle>Delete this purchase?</DialogTitle>
          <DialogDescription>
            This removes the purchase and reverses the supplier's pending amount.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={removeStock}
            onChange={(e) => setRemoveStock(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm">Remove the added items from stock</span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Delete purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
