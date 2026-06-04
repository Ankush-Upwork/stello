"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { supplierSchema } from "@/lib/validations/purchase";

export type SupplierFormState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | undefined;

function parse(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
}

export async function createSupplier(
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  const parsed = parse(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };

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
    .from("suppliers")
    .insert({ ...parsed.data, user_id: user.id, business_id: business.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/suppliers");
  return { ok: true, id: data.id };
}

export async function updateSupplier(
  _prev: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing supplier id." };

  const parsed = parse(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return { ok: true, id };
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/suppliers");
}
