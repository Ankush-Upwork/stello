"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { customerSchema } from "@/lib/validations/customer";

export type CustomerFormState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | undefined;

function parse(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    notes: formData.get("notes"),
  });
}

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!business) return { ok: false, error: "Set up your shop profile first." };

  const { data, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, user_id: user.id, business_id: business.id })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/customers");
  return { ok: true, id: data.id };
}

export async function updateCustomer(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing customer id." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true, id };
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
}
