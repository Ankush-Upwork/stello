/** Indian-grouped amount WITHOUT the ₹ symbol (we add ₹ in the templates). */
function inr(n: number | null | undefined): string {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  }).format(v);
}

/**
 * Build a wa.me link. Indian numbers get the 91 country code; anything that
 * already looks like it has a country code is passed through. Returns null if
 * there's no usable phone number.
 */
export function waLink(
  phone: string | null | undefined,
  message: string
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCc}?text=${encodeURIComponent(message)}`;
}

export type InvoiceMessageItem = {
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  lineTotal: number;
};

/** WhatsApp invoice message in the Sello format. */
export function buildInvoiceMessage(args: {
  customerName?: string | null;
  businessName: string;
  invoiceNumber: string;
  items: InvoiceMessageItem[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}): string {
  const greeting = args.customerName ? `Hi ${args.customerName}` : "Hello";

  const itemLines = args.items
    .map((it) => {
      const variant = [it.size, it.color].filter(Boolean).join(", ");
      const label = variant ? `${it.name} (${variant})` : it.name;
      return `- ${it.quantity} x ${label} — ₹${inr(it.lineTotal)}`;
    })
    .join("\n");

  return [
    `${greeting}, thank you for shopping with ${args.businessName}.`,
    "",
    "Your order details:",
    `Invoice: ${args.invoiceNumber}`,
    "Items:",
    itemLines,
    "",
    `Total Amount: ₹${inr(args.totalAmount)}`,
    `Paid: ₹${inr(args.paidAmount)}`,
    `Pending: ₹${inr(args.pendingAmount)}`,
    "",
    "Thank you,",
    args.businessName,
  ].join("\n");
}

/** Gentle payment-reminder message. Invoice line is included when provided. */
export function buildReminderMessage(args: {
  customerName?: string | null;
  businessName: string;
  pendingAmount: number;
  invoiceNumber?: string | null;
}): string {
  const greeting = args.customerName ? `Hi ${args.customerName}` : "Hello";
  const pendingLine = args.invoiceNumber
    ? `Your pending amount is ₹${inr(args.pendingAmount)} for invoice ${args.invoiceNumber}.`
    : `Your pending amount is ₹${inr(args.pendingAmount)}.`;

  return [
    `${greeting}, this is a gentle reminder from ${args.businessName}.`,
    "",
    pendingLine,
    "",
    "Please make the payment when convenient.",
    "",
    "Thank you.",
  ].join("\n");
}
