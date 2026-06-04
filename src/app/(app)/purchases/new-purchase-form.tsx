"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createPurchase } from "@/app/(app)/purchases/actions";
import {
  PurchaseItemDialog,
  type PickedPurchaseItem,
} from "@/app/(app)/purchases/purchase-item-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProductWithVariants, Supplier } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";

type Line = PickedPurchaseItem & { key: string; quantity: number };

const NO_SUPPLIER = "__none__";

function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NewPurchaseForm({
  products,
  suppliers,
  defaultSupplierId,
}: {
  products: ProductWithVariants[];
  suppliers: Supplier[];
  defaultSupplierId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<Line[]>([]);
  const [supplierId, setSupplierId] = React.useState(
    defaultSupplierId ?? NO_SUPPLIER
  );
  const [date, setDate] = React.useState(todayLocal());
  const [paid, setPaid] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  function addItem(picked: PickedPurchaseItem) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === picked.product_id && i.variant_id === picked.variant_id
      );
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...picked, key: Math.random().toString(36).slice(2), quantity: 1 }];
    });
  }

  const setQty = (key: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, qty || 1) } : i))
    );
  const setPrice = (key: string, price: string) =>
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, purchase_price: Math.max(0, parseFloat(price) || 0) } : i
      )
    );
  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.purchase_price, 0);
  const paidNum = Math.max(0, parseFloat(paid) || 0);
  const pending = subtotal - paidNum;

  async function submit() {
    if (items.length === 0) {
      toast.error("Add at least one item.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createPurchase({
        supplier_id: supplierId === NO_SUPPLIER ? null : supplierId,
        purchase_date: date,
        paid_amount: paidNum,
        notes,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
        })),
      });
      if (res.ok) {
        toast.success("Purchase recorded. Stock added.");
        router.push(`/purchases/${res.id}`);
        router.refresh();
      } else {
        toast.error(res.error);
        setSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Items received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <EmptyState
              icon={PackagePlus}
              title="No items yet"
              description="Add the products you're buying — stock goes up when you save."
              className="py-8"
            />
          ) : (
            items.map((i) => (
              <div key={i.key} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.name}</p>
                    {[i.size, i.color].filter(Boolean).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i.key)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <div className="flex items-center">
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setQty(i.key, i.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={i.quantity}
                        onChange={(e) => setQty(i.key, parseInt(e.target.value, 10))}
                        className="h-9 w-14 rounded-none border-x-0 text-center"
                      />
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setQty(i.key, i.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cost ₹</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={i.purchase_price}
                      onChange={(e) => setPrice(i.key, e.target.value)}
                      className="h-9 w-24"
                    />
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Line total</p>
                    <p className="font-semibold">{formatCurrency(i.quantity * i.purchase_price)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <PurchaseItemDialog products={products} onPick={addItem} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier &amp; payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid">Amount paid ₹</Label>
            <div className="flex gap-2">
              <Input
                id="paid"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => setPaid(String(subtotal))}>
                Full
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
            <Row label="Total" value={formatCurrency(subtotal)} bold />
            <Row label="Paid" value={formatCurrency(paidNum)} />
            <Row
              label="Pending"
              value={formatCurrency(Math.max(pending, 0))}
              bold
              tone={pending > 0 ? "amber" : undefined}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="button" size="lg" className="w-full" onClick={submit} disabled={submitting || items.length === 0}>
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? "Saving…" : "Confirm purchase"}
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "amber";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${tone === "amber" ? "text-amber-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}
