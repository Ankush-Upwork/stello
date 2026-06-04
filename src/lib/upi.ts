/** Build a UPI deep link (works with GPay/PhonePe/Paytm etc. on mobile). */
export function buildUpiLink(args: {
  vpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): string {
  const params = new URLSearchParams({
    pa: args.vpa,
    pn: args.payeeName,
    cu: "INR",
  });
  if (args.amount && args.amount > 0) params.set("am", args.amount.toFixed(2));
  if (args.note) params.set("tn", args.note);
  return `upi://pay?${params.toString()}`;
}
