"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createSale } from "@/app/(app)/sales/actions";
import { AddItemDialog, type PickedItem } from "@/app/(app)/sales/add-item-dialog";
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
import { DELIVERY_STATUSES, PAYMENT_MODES } from "@/lib/constants";
import type { Customer, ProductWithVariants } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";

export type LineItem = PickedItem & { key: string; quantity: number };

/** Prefill payload, e.g. from the AI sale-entry assistant. */
export type SalePrefill = {
  items?: LineItem[];
  customerId?: string;
  paid?: string;
  paymentMode?: string;
  notes?: string;
};

export const WALK_IN = "__walkin__";

function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NewSaleForm({
  products,
  customers,
  prefill,
}: {
  products: ProductWithVariants[];
  customers: Customer[];
  prefill?: SalePrefill;
}) {
  const router = useRouter();

  const [items, setItems] = React.useState<LineItem[]>(prefill?.items ?? []);
  const [customerId, setCustomerId] = React.useState<string>(
    prefill?.customerId ?? WALK_IN
  );
  const [saleDate, setSaleDate] = React.useState(todayLocal());
  const [discount, setDiscount] = React.useState("0");
  const [paid, setPaid] = React.useState(prefill?.paid ?? "0");
  const [paymentMode, setPaymentMode] = React.useState<string>(
    prefill?.paymentMode ?? "Cash"
  );
  const [delivery, setDelivery] = React.useState<string>("Delivered");
  const [notes, setNotes] = React.useState(prefill?.notes ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  function addItem(picked: PickedItem) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === picked.product_id && i.variant_id === picked.variant_id
      );
      if (existing) {
        return prev.map((i) =>
          i === existing
            ? { ...i, quantity: Math.min(i.quantity + 1, i.available) }
            : i
        );
      }
      return [
        ...prev,
        { ...picked, key: Math.random().toString(36).slice(2), quantity: 1 },
      ];
    });
  }

  function setQty(key: string, qty: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? { ...i, quantity: Math.max(1, Math.min(qty || 1, i.available)) }
          : i
      )
    );
  }

  function setPrice(key: string, price: string) {
    const n = Math.max(0, parseFloat(price) || 0);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, unit_price: n } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const total = Math.max(subtotal - discountNum, 0);
  const paidNum = Math.max(0, parseFloat(paid) || 0);
  const pending = total - paidNum;

  async function submit() {
    if (items.length === 0) {
      toast.error("Add at least one product.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createSale({
        customer_id: customerId === WALK_IN ? null : customerId,
        sale_date: saleDate,
        discount_amount: discountNum,
        paid_amount: paidNum,
        payment_mode: paymentMode as (typeof PAYMENT_MODES)[number],
        delivery_status: delivery as (typeof DELIVERY_STATUSES)[number],
        notes,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: 0,
        })),
      });

      if (result.ok) {
        toast.success("Sale recorded. Stock updated.");
        router.push(`/sales/${result.id}`);
        router.refresh();
      } else {
        toast.error(result.error);
        setSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No items yet"
              description="Add the products this customer is buying."
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
                    <p className="text-xs text-muted-foreground">{i.available} in stock</p>
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
                  {/* Quantity stepper */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-r-none"
                        onClick={() => setQty(i.key, i.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={i.quantity}
                        onChange={(e) => setQty(i.key, parseInt(e.target.value, 10))}
                        className="h-9 w-14 rounded-none border-x-0 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-l-none"
                        onClick={() => setQty(i.key, i.quantity + 1)}
                        disabled={i.quantity >= i.available}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Price ₹</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={i.unit_price}
                      onChange={(e) => setPrice(i.key, e.target.value)}
                      className="h-9 w-24"
                    />
                  </div>

                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Line total</p>
                    <p className="font-semibold">
                      {formatCurrency(i.quantity * i.unit_price)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          <AddItemDialog products={products} onPick={addItem} />
        </CardContent>
      </Card>

      {/* Customer + meta */}
      <Card>
        <CardHeader>
          <CardTitle>Customer &amp; details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WALK_IN}>Walk-in customer</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale_date">Date</Label>
              <Input
                id="sale_date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery status</Label>
              <Select value={delivery} onValueChange={setDelivery}>
                <SelectTrigger id="delivery">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_STATUSES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this sale"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount ₹</Label>
              <Input
                id="discount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_mode">Payment mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger id="payment_mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaid(String(total))}
              >
                Full
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {discountNum > 0 && (
              <Row label="Discount" value={`− ${formatCurrency(discountNum)}`} />
            )}
            <Row label="Total" value={formatCurrency(total)} bold />
            <Row label="Paid" value={formatCurrency(paidNum)} />
            <Row
              label="Pending"
              value={formatCurrency(Math.max(pending, 0))}
              tone={pending > 0 ? "amber" : undefined}
              bold
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={submit}
        disabled={submitting || items.length === 0}
      >
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? "Saving sale…" : "Confirm sale"}
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
      <span
        className={`${bold ? "font-semibold" : ""} ${tone === "amber" ? "text-amber-600" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
