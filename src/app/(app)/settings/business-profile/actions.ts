"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { businessProfileSchema } from "@/lib/validations/business";

export type BusinessFormState =
  | { ok: true; created: boolean }
  | { ok: false; error: string }
  | undefined;

/**
 * Creates the user's business on first setup, or updates it on subsequent
 * edits. Returns a state object the client form can react to (toast + redirect).
 */
export async function saveBusinessProfile(
  _prev: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const parsed = businessProfileSchema.safeParse({
    business_name: formData.get("business_name"),
    owner_name: formData.get("owner_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    business_type: formData.get("business_type"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    gstin: formData.get("gstin"),
    upi_id: formData.get("upi_id"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }

  // Does a business already exist for this user?
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const values = { ...parsed.data, currency: "INR" };

  if (existing) {
    const { error } = await supabase
      .from("businesses")
      .update(values)
      .eq("id", existing.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/settings/business-profile");
    return { ok: true, created: false };
  }

  const { error } = await supabase
    .from("businesses")
    .insert({ ...values, user_id: user.id });

  if (error) return { ok: false, error: error.message };

  // Keep the profile's name/phone in sync for convenience.
  await supabase
    .from("profiles")
    .update({ full_name: values.owner_name, phone: values.phone })
    .eq("id", user.id);

  revalidatePath("/dashboard");
  return { ok: true, created: true };
}
