import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

/** Renders a number as Indian Rupees, e.g. ₹1,250 */
export function CurrencyDisplay({
  amount,
  className,
}: {
  amount: number | null | undefined;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(amount)}
    </span>
  );
}
