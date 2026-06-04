"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  saveBusinessProfile,
  type BusinessFormState,
} from "@/app/(app)/settings/business-profile/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TYPES, INDIAN_STATES } from "@/lib/constants";
import type { Business } from "@/lib/supabase/types";

export function BusinessProfileForm({
  business,
  prefill,
}: {
  business: Business | null;
  /** Used to pre-populate the form on first-time setup (no business yet). */
  prefill?: { owner_name?: string | null; email?: string | null };
}) {
  const router = useRouter();
  const isEdit = Boolean(business);
  const initial = {
    owner_name: business?.owner_name ?? prefill?.owner_name ?? "",
    email: business?.email ?? prefill?.email ?? "",
  };

  const [state, formAction] = useActionState<BusinessFormState, FormData>(
    saveBusinessProfile,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        state.created ? "Shop profile created!" : "Profile updated."
      );
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="Business name"
        required
        name="business_name"
        defaultValue={business?.business_name ?? ""}
        placeholder="e.g. Priya's Boutique"
      />

      <Field
        label="Owner name"
        required
        name="owner_name"
        defaultValue={initial.owner_name}
        placeholder="e.g. Priya Sharma"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Phone (WhatsApp)"
          required
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          defaultValue={business?.phone ?? ""}
          placeholder="10-digit mobile"
        />
        <Field
          label="Email (optional)"
          name="email"
          type="email"
          inputMode="email"
          defaultValue={initial.email}
          placeholder="shop@example.com"
        />
      </div>

      {/* Business type */}
      <div className="space-y-2">
        <Label htmlFor="business_type">Business type</Label>
        <Select
          name="business_type"
          defaultValue={business?.business_type ?? "boutique"}
        >
          <SelectTrigger id="business_type">
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address (optional)</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={business?.address ?? ""}
          placeholder="Shop no., street, area"
          rows={2}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="City"
          name="city"
          defaultValue={business?.city ?? ""}
          placeholder="City"
        />
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select name="state" defaultValue={business?.state ?? undefined}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field
          label="Pincode"
          name="pincode"
          inputMode="numeric"
          maxLength={6}
          defaultValue={business?.pincode ?? ""}
          placeholder="6-digit"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="GSTIN (optional)"
          name="gstin"
          maxLength={15}
          defaultValue={business?.gstin ?? ""}
          placeholder="15-digit GST number"
        />
        <Field
          label="UPI ID (optional)"
          name="upi_id"
          defaultValue={business?.upi_id ?? ""}
          placeholder="name@bank — for collecting payments"
        />
      </div>

      {state && !state.ok && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton
        className="w-full"
        size="lg"
        pendingText="Saving…"
      >
        {isEdit ? "Save changes" : "Create my shop"}
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
