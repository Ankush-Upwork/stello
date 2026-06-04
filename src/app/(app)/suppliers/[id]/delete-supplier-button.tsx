"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteSupplier } from "@/app/(app)/suppliers/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteSupplierButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Delete this supplier?"
      description={
        <>
          <span className="font-medium text-foreground">{name}</span> will be
          removed. Past purchases stay, but lose the supplier link.
        </>
      }
      confirmLabel="Delete"
      trigger={
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      }
      onConfirm={async () => {
        try {
          await deleteSupplier(id);
          toast.success("Supplier deleted.");
          router.push("/suppliers");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not delete.");
        }
      }}
    />
  );
}
