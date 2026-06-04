import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  address: optionalText,
  city: optionalText,
  notes: optionalText,
});

export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerValues = z.output<typeof customerSchema>;
