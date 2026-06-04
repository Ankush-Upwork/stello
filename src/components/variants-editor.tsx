"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductVariant } from "@/lib/supabase/types";

export type VariantRow = {
  _key: string;
  size: string;
  color: string;
  quantity: string;
  selling_price: string;
  purchase_price: string;
  sku: string;
};

function emptyRow(defaults?: { selling?: string; purchase?: string }): VariantRow {
  return {
    _key: Math.random().toString(36).slice(2),
    size: "",
    color: "",
    quantity: "0",
    selling_price: defaults?.selling ?? "0",
    purchase_price: defaults?.purchase ?? "0",
    sku: "",
  };
}

export function rowsFromVariants(variants: ProductVariant[]): VariantRow[] {
  return variants.map((v) => ({
    _key: v.id,
    size: v.size ?? "",
    color: v.color ?? "",
    quantity: String(v.quantity),
    selling_price: String(v.selling_price),
    purchase_price: String(v.purchase_price),
    sku: v.sku ?? "",
  }));
}

/**
 * Dynamic editor for a product's size/colour variants. Serialises the rows
 * into a hidden input (`name`) as JSON for the form action to parse.
 */
export function VariantsEditor({
  name = "variants",
  initialRows,
  defaultSelling = "0",
  defaultPurchase = "0",
}: {
  name?: string;
  initialRows?: VariantRow[];
  defaultSelling?: string;
  defaultPurchase?: string;
}) {
  const [rows, setRows] = React.useState<VariantRow[]>(
    initialRows && initialRows.length > 0
      ? initialRows
      : [emptyRow({ selling: defaultSelling, purchase: defaultPurchase })]
  );

  function update(key: string, field: keyof VariantRow, value: string) {
    setRows((rs) =>
      rs.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setRows((rs) => [
      ...rs,
      emptyRow({ selling: defaultSelling, purchase: defaultPurchase }),
    ]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._key !== key) : rs));
  }

  const totalStock = rows.reduce(
    (sum, r) => sum + (parseInt(r.quantity, 10) || 0),
    0
  );

  // Serialise for the server action.
  const serialised = JSON.stringify(
    rows.map((r) => ({
      size: r.size,
      color: r.color,
      quantity: r.quantity,
      selling_price: r.selling_price,
      purchase_price: r.purchase_price,
      sku: r.sku,
    }))
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialised} />

      {rows.map((row, idx) => (
        <div key={row._key} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Variant {idx + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => removeRow(row._key)}
              disabled={rows.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Cell label="Size">
              <Input
                value={row.size}
                onChange={(e) => update(row._key, "size", e.target.value)}
                placeholder="S / 38 / Free"
              />
            </Cell>
            <Cell label="Colour">
              <Input
                value={row.color}
                onChange={(e) => update(row._key, "color", e.target.value)}
                placeholder="Red"
              />
            </Cell>
            <Cell label="Quantity">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={row.quantity}
                onChange={(e) => update(row._key, "quantity", e.target.value)}
              />
            </Cell>
            <Cell label="Selling ₹">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={row.selling_price}
                onChange={(e) =>
                  update(row._key, "selling_price", e.target.value)
                }
              />
            </Cell>
            <Cell label="Purchase ₹">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={row.purchase_price}
                onChange={(e) =>
                  update(row._key, "purchase_price", e.target.value)
                }
              />
            </Cell>
            <Cell label="SKU (optional)">
              <Input
                value={row.sku}
                onChange={(e) => update(row._key, "sku", e.target.value)}
                placeholder="Code"
              />
            </Cell>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" /> Add variant
        </Button>
        <span className="text-sm text-muted-foreground">
          Total stock: <span className="font-semibold text-foreground">{totalStock}</span>
        </span>
      </div>
    </div>
  );
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
