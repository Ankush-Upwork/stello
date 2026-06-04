import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const money = z.coerce.number().min(0, "Cannot be negative").default(0);

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  address: optionalText,
  notes: optionalText,
});

export type SupplierInput = z.input<typeof supplierSchema>;

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  purchase_price: money,
});

export const purchaseSchema = z.object({
  supplier_id: z.string().uuid().nullable().optional(),
  purchase_date: z.string().optional(),
  paid_amount: money,
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
});

export type PurchaseInput = z.input<typeof purchaseSchema>;
