"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  createCustomer,
  updateCustomer,
  type CustomerFormState,
} from "@/app/(app)/customers/actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/lib/supabase/types";

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const isEdit = Boolean(customer);

  const [state, formAction] = useActionState<CustomerFormState, FormData>(
    isEdit ? updateCustomer : createCustomer,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Customer updated." : "Customer added.");
      router.push(`/customers/${state.id}`);
      router.refresh();
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={customer!.id} />}

      <Card>
        <CardContent className="space-y-5 pt-5">
          <Field
            label="Name"
            name="name"
            required
            defaultValue={customer?.name ?? ""}
            placeholder="e.g. Priya Sharma"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Phone (WhatsApp)"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              defaultValue={customer?.phone ?? ""}
              placeholder="10-digit mobile"
            />
            <Field
              label="Email (optional)"
              name="email"
              type="email"
              inputMode="email"
              defaultValue={customer?.email ?? ""}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={customer?.address ?? ""}
              placeholder="House no., street, area"
              rows={2}
            />
          </div>

          <Field
            label="City"
            name="city"
            defaultValue={customer?.city ?? ""}
            placeholder="City"
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={customer?.notes ?? ""}
              placeholder="e.g. Prefers cotton, sizes M, regular customer"
              rows={2}
            />
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
        {isEdit ? "Save changes" : "Add customer"}
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
