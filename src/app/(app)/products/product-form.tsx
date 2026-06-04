"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Layers } from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/app/(app)/products/actions";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import {
  VariantsEditor,
  rowsFromVariants,
} from "@/components/variants-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { Product, ProductVariant } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function ProductForm({
  userId,
  product,
  variants = [],
}: {
  userId: string;
  product?: Product;
  variants?: ProductVariant[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [hasVariants, setHasVariants] = useState(product?.has_variants ?? false);

  const [state, formAction] = useActionState<ProductFormState, FormData>(
    isEdit ? updateProduct : createProduct,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Product updated." : "Product added.");
      router.push(`/products/${state.id}`);
      router.refresh();
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="has_variants" value={hasVariants ? "true" : "false"} />

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Photo</Label>
            <ImageUpload userId={userId} defaultUrl={product?.image_url ?? null} />
          </div>

          <Field
            label="Product name"
            name="product_name"
            required
            defaultValue={product?.product_name ?? ""}
            placeholder="e.g. Cotton Anarkali Kurti"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={product?.category ?? undefined}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={product?.status ?? "active"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Sizes &amp; colours
          </CardTitle>
          <CardDescription>
            Turn this on if the same product comes in multiple sizes or colours,
            each with its own stock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Toggle
            checked={hasVariants}
            onChange={setHasVariants}
            label="This product has multiple sizes / colours"
          />

          {hasVariants ? (
            <VariantsEditor
              initialRows={
                product?.has_variants ? rowsFromVariants(variants) : undefined
              }
              defaultSelling={product ? String(product.selling_price) : "0"}
              defaultPurchase={product ? String(product.purchase_price) : "0"}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Size" name="size" defaultValue={product?.size ?? ""} placeholder="e.g. L / 38 / Free" />
              <Field label="Colour" name="color" defaultValue={product?.color ?? ""} placeholder="e.g. Red" />
              <Field
                label="Quantity in stock"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={product ? String(product.quantity) : "0"}
              />
              <Field
                label="Purchase price (₹)"
                name="purchase_price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={product ? String(product.purchase_price) : "0"}
              />
              <Field
                label="Selling price (₹)"
                name="selling_price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={product ? String(product.selling_price) : "0"}
              />
            </div>
          )}

          <Field
            label="Low stock alert at"
            name="low_stock_threshold"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={product ? String(product.low_stock_threshold) : "5"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>More details (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Design / Article" name="design" defaultValue={product?.design ?? ""} placeholder="e.g. Floral / A-203" />
          <Field label="Brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="e.g. Biba" />
          <Field label="Material" name="material" defaultValue={product?.material ?? ""} placeholder="e.g. Cotton" />
          <Field label="SKU" name="sku" defaultValue={product?.sku ?? ""} placeholder="Style code (optional)" />
          <Field label="Barcode" name="barcode" defaultValue={product?.barcode ?? ""} placeholder="Optional" />
          <Field label="HSN code" name="hsn_code" defaultValue={product?.hsn_code ?? ""} placeholder="For GST (optional)" />
          <Field
            label="GST rate (%)"
            name="gst_rate"
            type="number"
            inputMode="decimal"
            min={0}
            max={28}
            step="0.01"
            defaultValue={product ? String(product.gst_rate) : "0"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Supplier name" name="supplier_name" defaultValue={product?.supplier_name ?? ""} />
          <Field
            label="Supplier phone"
            name="supplier_phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            defaultValue={product?.supplier_phone ?? ""}
            placeholder="10-digit"
          />
        </CardContent>
      </Card>

      {state && !state.ok && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        {isEdit ? "Save changes" : "Add product"}
      </SubmitButton>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
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
