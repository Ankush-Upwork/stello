import { z } from "zod";

import { BUSINESS_TYPE_VALUES } from "@/lib/constants";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const businessProfileSchema = z.object({
  business_name: z.string().trim().min(2, "Business name is required"),
  owner_name: z.string().trim().min(2, "Owner name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  business_type: z.enum(BUSINESS_TYPE_VALUES, {
    errorMap: () => ({ message: "Select a business type" }),
  }),
  address: optionalText,
  city: optionalText,
  state: optionalText,
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Enter a 6-digit pincode")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 characters")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  upi_id: z
    .string()
    .trim()
    .regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, "Enter a valid UPI ID, e.g. name@bank")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type BusinessProfileInput = z.input<typeof businessProfileSchema>;
export type BusinessProfileValues = z.output<typeof businessProfileSchema>;
