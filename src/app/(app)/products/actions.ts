"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/queries/subscription";
import {
  productSchema,
  variantsArraySchema,
  type ProductValues,
  type VariantValues,
} from "@/lib/validations/product";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const BUCKET = "product-images";

export type ProductFormState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | undefined;

type SB = SupabaseClient<Database>;

/** Extract the storage object path from a public URL, or null if not ours. */
function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

async function deleteImage(supabase: SB, url: string | null | undefined) {
  const path = storagePathFromUrl(url);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
}

function parse(formData: FormData) {
  return productSchema.safeParse({
    product_name: formData.get("product_name"),
    category: formData.get("category"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    size: formData.get("size"),
    color: formData.get("color"),
    design: formData.get("design"),
    brand: formData.get("brand"),
    material: formData.get("material"),
    purchase_price: formData.get("purchase_price"),
    selling_price: formData.get("selling_price"),
    quantity: formData.get("quantity"),
    low_stock_threshold: formData.get("low_stock_threshold"),
    hsn_code: formData.get("hsn_code"),
    gst_rate: formData.get("gst_rate"),
    supplier_name: formData.get("supplier_name"),
    supplier_phone: formData.get("supplier_phone"),
    image_url: formData.get("image_url"),
    status: formData.get("status"),
  });
}

/** Parse variant rows from the form. Returns null if has_variants is off. */
function parseVariants(
  formData: FormData
): { ok: true; variants: VariantValues[] } | { ok: false; error: string } | null {
  const hasVariants = formData.get("has_variants") === "true";
  if (!hasVariants) return null;

  const result = variantsArraySchema.safeParse(formData.get("variants") ?? "[]");
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Check the variants." };
  }
  return { ok: true, variants: result.data };
}

/** Build product-row values, zeroing single-product stock/price when variants are used. */
function productRow(data: ProductValues, hasVariants: boolean) {
  if (!hasVariants) return { ...data, has_variants: false };
  return {
    ...data,
    has_variants: true,
    size: null,
    color: null,
    quantity: 0,
    purchase_price: 0,
    selling_price: 0,
  };
}

async function insertVariants(
  supabase: SB,
  userId: string,
  productId: string,
  variants: VariantValues[]
) {
  const rows = variants.map((v) => ({
    user_id: userId,
    product_id: productId,
    size: v.size,
    color: v.color,
    sku: v.sku,
    barcode: v.barcode,
    quantity: v.quantity,
    purchase_price: v.purchase_price,
    selling_price: v.selling_price,
  }));
  return supabase.from("product_variants").insert(rows);
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const variantsResult = parseVariants(formData);
  if (variantsResult && !variantsResult.ok) {
    return { ok: false, error: variantsResult.error };
  }
  const hasVariants = variantsResult !== null;

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

  // Plan limit on number of products.
  const plan = await getUserPlan(supabase, user.id);
  if (plan.product_limit !== null) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= plan.product_limit) {
      return {
        ok: false,
        error: `You've reached your ${plan.name} plan limit of ${plan.product_limit} products. Upgrade to add more.`,
      };
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productRow(parsed.data, hasVariants),
      user_id: user.id,
      business_id: business.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  if (variantsResult?.ok) {
    const { error: vError } = await insertVariants(
      supabase,
      user.id,
      data.id,
      variantsResult.variants
    );
    if (vError) return { ok: false, error: vError.message };
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing product id." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const variantsResult = parseVariants(formData);
  if (variantsResult && !variantsResult.ok) {
    return { ok: false, error: variantsResult.error };
  }
  const hasVariants = variantsResult !== null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please log in again." };

  // Look up the previous image so we can clean it up if it changed.
  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .update(productRow(parsed.data, hasVariants))
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Replace variants wholesale (simplest correct approach pre-sales).
  // Removes old rows whether we're updating the grid or turning variants off.
  const { error: delError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", id);
  if (delError) return { ok: false, error: delError.message };

  if (variantsResult?.ok) {
    const { error: vError } = await insertVariants(
      supabase,
      user.id,
      id,
      variantsResult.variants
    );
    if (vError) return { ok: false, error: vError.message };
  }

  if (existing?.image_url && existing.image_url !== parsed.data.image_url) {
    await deleteImage(supabase, existing.image_url);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await deleteImage(supabase, existing?.image_url);

  revalidatePath("/products");
  revalidatePath("/dashboard");
}
