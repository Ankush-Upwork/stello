import { z } from "zod";

import { DELIVERY_STATUSES, PAYMENT_MODES } from "@/lib/constants";

const money = z.coerce.number().min(0, "Cannot be negative").default(0);

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit_price: money,
  discount_amount: money,
});

export const saleSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  sale_date: z.string().optional(),
  discount_amount: money,
  paid_amount: money,
  payment_mode: z.enum(PAYMENT_MODES).nullable().optional(),
  delivery_status: z.enum(DELIVERY_STATUSES).default("Delivered"),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  items: z.array(saleItemSchema).min(1, "Add at least one product"),
});

export type SaleInput = z.input<typeof saleSchema>;
export type SaleValues = z.output<typeof saleSchema>;
