import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

// Coerce form string -> number, default 0, no negatives.
const money = z.coerce
  .number({ invalid_type_error: "Enter a valid amount" })
  .min(0, "Cannot be negative")
  .default(0);

const wholeNumber = z.coerce
  .number({ invalid_type_error: "Enter a valid number" })
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
  .default(0);

export const productSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required"),
  category: optionalText,
  sku: optionalText,
  barcode: optionalText,
  size: optionalText,
  color: optionalText,
  design: optionalText,
  brand: optionalText,
  material: optionalText,
  purchase_price: money,
  selling_price: money,
  quantity: wholeNumber,
  low_stock_threshold: wholeNumber,
  hsn_code: optionalText,
  gst_rate: z.coerce
    .number({ invalid_type_error: "Enter a valid GST %" })
    .min(0, "Cannot be negative")
    .max(28, "GST rate looks too high")
    .default(0),
  supplier_name: optionalText,
  supplier_phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  image_url: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;

/** A single size/colour variant row. */
export const variantSchema = z
  .object({
    size: optionalText,
    color: optionalText,
    sku: optionalText,
    barcode: optionalText,
    quantity: wholeNumber,
    purchase_price: money,
    selling_price: money,
  })
  // Skip completely blank rows by requiring at least a size or a colour.
  .refine((v) => Boolean(v.size || v.color), {
    message: "Each variant needs a size or a colour",
    path: ["size"],
  });

export type VariantValues = z.output<typeof variantSchema>;

/** The `variants` field arrives as a JSON string from the form. */
export const variantsArraySchema = z
  .string()
  .transform((s, ctx) => {
    try {
      return JSON.parse(s || "[]");
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid variants" });
      return z.NEVER;
    }
  })
  .pipe(z.array(variantSchema).min(1, "Add at least one size/colour"));
