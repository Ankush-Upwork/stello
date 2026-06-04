"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  createSupplier,
  updateSupplier,
  type SupplierFormState,
} from "@/app/(app)/suppliers/actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Supplier } from "@/lib/supabase/types";

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const isEdit = Boolean(supplier);

  const [state, formAction] = useActionState<SupplierFormState, FormData>(
    isEdit ? updateSupplier : createSupplier,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Supplier updated." : "Supplier added.");
      router.push(`/suppliers/${state.id}`);
      router.refresh();
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={supplier!.id} />}
      <Card>
        <CardContent className="space-y-5 pt-4">
          <Field label="Supplier name" name="name" required defaultValue={supplier?.name ?? ""} placeholder="e.g. Surat Textiles" />
          <Field label="Phone" name="phone" type="tel" inputMode="numeric" maxLength={10} defaultValue={supplier?.phone ?? ""} placeholder="10-digit" />
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Textarea id="address" name="address" defaultValue={supplier?.address ?? ""} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ""} rows={2} />
          </div>
        </CardContent>
      </Card>

      {state && !state.ok && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        {isEdit ? "Save changes" : "Add supplier"}
      </SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input id={name} name={name} required={required} {...props} />
    </div>
  );
}
