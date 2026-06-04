"use client";

import * as React from "react";
import { AlertTriangle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { parseSaleText } from "@/app/(app)/ai/sale-entry/actions";
import {
  NewSaleForm,
  WALK_IN,
  type LineItem,
  type SalePrefill,
} from "@/app/(app)/sales/new-sale-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_MODES } from "@/lib/constants";
import type { AiDraft } from "@/lib/validations/ai";
import type { Customer, ProductWithVariants } from "@/lib/supabase/types";

const EXAMPLES = [
  "Sold 2 red kurtis size L to Priya for 2400, paid 1000 by UPI, 1400 pending.",
  "1 black saree to Meena, 1800 cash.",
  "Sold 3 footwear size 8 to Rahul 9876543210, total 1500 paid full.",
];

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Heuristic product match: substring either way, else shared-word overlap. */
function matchProduct(name: string, products: ProductWithVariants[]) {
  const q = norm(name);
  if (!q) return undefined;
  let best: { p: ProductWithVariants; score: number } | undefined;
  for (const p of products) {
    const pn = norm(p.product_name);
    let score = 0;
    if (pn === q) score = 100;
    else if (pn.includes(q) || q.includes(pn)) score = 60;
    else {
      const qWords = new Set(q.split(/\s+/).filter(Boolean));
      score = pn.split(/\s+/).filter((w) => qWords.has(w)).length * 10;
    }
    if (score > 0 && (!best || score > best.score)) best = { p, score };
  }
  return best?.p;
}

function matchVariant(
  product: ProductWithVariants,
  size: string,
  color: string
) {
  const s = norm(size);
  const c = norm(color);
  const inStock = product.variants.filter((v) => v.quantity > 0);
  return (
    inStock.find((v) => norm(v.size) === s && norm(v.color) === c) ??
    inStock.find((v) => s && norm(v.size) === s) ??
    inStock.find((v) => c && norm(v.color) === c) ??
    inStock[0]
  );
}

type Unmatched = { text: string; reason: string };

function buildPrefill(
  draft: AiDraft,
  products: ProductWithVariants[],
  customers: Customer[]
): { prefill: SalePrefill; unmatched: Unmatched[] } {
  const items: LineItem[] = [];
  const unmatched: Unmatched[] = [];

  draft.items.forEach((di, idx) => {
    const label = [di.quantity, di.color, di.product_name, di.size]
      .filter(Boolean)
      .join(" ");
    const product = matchProduct(di.product_name, products);
    if (!product) {
      unmatched.push({ text: label, reason: "not found in your products" });
      return;
    }

    let variantId: string | null = null;
    let size = product.size;
    let color = product.color;
    let unitPrice = product.selling_price;
    let available = product.quantity;

    if (product.has_variants) {
      const v = matchVariant(product, di.size, di.color);
      if (!v) {
        unmatched.push({ text: label, reason: "no matching size/colour in stock" });
        return;
      }
      variantId = v.id;
      size = v.size;
      color = v.color;
      unitPrice = v.selling_price;
      available = v.quantity;
    }

    if (available <= 0) {
      unmatched.push({ text: label, reason: "out of stock" });
      return;
    }

    items.push({
      key: `ai-${idx}`,
      product_id: product.id,
      variant_id: variantId,
      name: product.product_name,
      size,
      color,
      available,
      unit_price: di.selling_price > 0 ? di.selling_price : unitPrice,
      quantity: Math.max(1, Math.min(di.quantity || 1, available)),
    });
  });

  // Customer: match by phone digits, else by name.
  const phone = (draft.customer_phone ?? "").replace(/\D/g, "");
  const byName = norm(draft.customer_name);
  const customer =
    (phone &&
      customers.find((c) => (c.phone ?? "").replace(/\D/g, "") === phone)) ||
    (byName && customers.find((c) => norm(c.name) === byName)) ||
    (byName && customers.find((c) => norm(c.name).includes(byName))) ||
    undefined;

  const paymentMode =
    PAYMENT_MODES.find((m) => norm(m) === norm(draft.payment_mode)) ?? "Cash";

  return {
    prefill: {
      items,
      customerId: customer?.id ?? WALK_IN,
      paid: String(draft.paid_amount || 0),
      paymentMode,
      notes: draft.notes ?? "",
    },
    unmatched,
  };
}

export function AiSaleEntry({
  products,
  customers,
}: {
  products: ProductWithVariants[];
  customers: Customer[];
}) {
  const sellable = React.useMemo(
    () => products.filter((p) => p.status === "active"),
    [products]
  );

  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    prefill: SalePrefill;
    unmatched: Unmatched[];
    draft: AiDraft;
  } | null>(null);

  async function convert() {
    setLoading(true);
    try {
      const res = await parseSaleText(text);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { prefill, unmatched } = buildPrefill(res.draft, sellable, customers);
      setResult({ prefill, unmatched, draft: res.draft });
      if (prefill.items?.length === 0) {
        toast.warning("Couldn't match any items to your inventory — add them below.");
      } else {
        toast.success("Draft ready — review and confirm.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const matchedCustomer = customers.find((c) => c.id === result.prefill.customerId);
    return (
      <div className="space-y-5">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 py-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> AI understood
            </p>
            <p className="text-muted-foreground">
              Customer:{" "}
              <span className="text-foreground">
                {matchedCustomer?.name ??
                  (result.draft.customer_name || "Walk-in")}
              </span>
              {result.draft.customer_name && !matchedCustomer && (
                <span className="text-amber-600">
                  {" "}
                  (not in your customers — using walk-in)
                </span>
              )}{" "}
              · {result.prefill.items?.length ?? 0} item(s) matched
            </p>
            {result.unmatched.length > 0 && (
              <div className="rounded-md bg-amber-100 p-3 text-amber-800">
                <p className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4" /> Couldn't match:
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {result.unmatched.map((u, i) => (
                    <li key={i}>
                      {u.text} — {u.reason}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs">
                  Add these manually with the “Add product” button below.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <NewSaleForm
          products={sellable}
          customers={customers}
          prefill={result.prefill}
        />

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setResult(null);
            setText("");
          }}
        >
          <RotateCcw className="h-4 w-4" /> Start over
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder='e.g. "Sold 2 red kurtis size L to Priya for 2400, paid 1000 by UPI"'
          className="text-base"
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Try an example:</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setText(ex)}
                className="rounded-md border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={convert}
          disabled={loading || !text.trim()}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? "Reading…" : "Convert to Sale"}
        </Button>
      </CardContent>
    </Card>
  );
}
