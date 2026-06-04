"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { IndianRupee, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { recordSalePayment } from "@/app/(app)/sales/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buildUpiLink } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";

export function CollectPayment({
  saleId,
  invoice,
  pending,
  businessName,
  upiId,
}: {
  saleId: string;
  invoice: string;
  pending: number;
  businessName: string;
  upiId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(String(pending));
  const [saving, setSaving] = React.useState(false);

  const amt = Math.min(Math.max(parseFloat(amount) || 0, 0), pending);
  const upiLink = upiId
    ? buildUpiLink({
        vpa: upiId,
        payeeName: businessName,
        amount: amt > 0 ? amt : pending,
        note: invoice,
      })
    : null;

  async function record() {
    setSaving(true);
    try {
      await recordSalePayment(saleId, amt);
      toast.success("Payment recorded.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <IndianRupee className="h-4 w-4" /> Collect payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect {formatCurrency(pending)}</DialogTitle>
          <DialogDescription>
            {upiId
              ? "Show this QR or open a UPI app, then mark the amount received."
              : "Add a UPI ID in your shop profile to show a payment QR."}
          </DialogDescription>
        </DialogHeader>

        {upiLink && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border bg-white p-3">
              <QRCodeSVG value={upiLink} size={180} />
            </div>
            <Button asChild variant="outline" size="sm" className="sm:hidden">
              <a href={upiLink}>
                <Smartphone className="h-4 w-4" /> Open UPI app
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">{upiId}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount received</label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={pending}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <Button onClick={record} disabled={saving || amt <= 0} className="w-full">
          {saving && <Loader2 className="animate-spin" />}
          Mark {formatCurrency(amt)} received
        </Button>
      </DialogContent>
    </Dialog>
  );
}
