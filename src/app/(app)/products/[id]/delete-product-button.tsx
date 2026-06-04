"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/(app)/products/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Delete this product?"
      description={
        <>
          <span className="font-medium text-foreground">{name}</span> will be
          permanently removed, along with its photo. This cannot be undone.
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
          await deleteProduct(id);
          toast.success("Product deleted.");
          router.push("/products");
          router.refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Could not delete the product."
          );
        }
      }}
    />
  );
}
