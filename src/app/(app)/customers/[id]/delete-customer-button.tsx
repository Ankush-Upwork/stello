"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCustomer } from "@/app/(app)/customers/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Delete this customer?"
      description={
        <>
          <span className="font-medium text-foreground">{name}</span> will be
          permanently removed. This cannot be undone.
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
          await deleteCustomer(id);
          toast.success("Customer deleted.");
          router.push("/customers");
          router.refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Could not delete the customer."
          );
        }
      }}
    />
  );
}
