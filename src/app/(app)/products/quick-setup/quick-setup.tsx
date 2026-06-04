"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  generateStarterProducts,
  importStarterProducts,
  type StarterProduct,
} from "@/app/(app)/products/quick-setup/actions";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type Row = StarterProduct & { include: boolean };

export function QuickSetup({ allowed }: { allowed: boolean }) {
  const router = useRouter();
  const [description, setDescription] = React.useState("");
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  if (!allowed) {
    return (
      <UpgradeNudge
        title="AI Quick Setup is a paid feature"
        description="Upgrade to Starter or higher to auto-generate a starter product catalogue for your shop."
      />
    );
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await generateStarterProducts(description);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setRows(res.products.map((p) => ({ ...p, include: true })));
    } finally {
      setLoading(false);
    }
  }

  async function addSelected() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.include);
    if (chosen.length === 0) {
      toast.error("Select at least one product.");
      return;
    }
    setSaving(true);
    try {
      const res = await importStarterProducts(chosen);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Added ${res.inserted} products.`);
      router.push("/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (rows) {
    const count = rows.filter((r) => r.include).length;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Review the suggestions, untick anything you don&apos;t sell, then add
          them. You can edit prices &amp; stock later.
        </p>
        <Card>
          <CardContent className="divide-y p-0">
            {rows.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setRows((rs) =>
                    rs!.map((x, j) => (j === i ? { ...x, include: !x.include } : x))
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                    r.include ? "border-primary bg-primary text-white" : "border-input"
                  }`}
                >
                  {r.include && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.product_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.category}
                    {r.gst_rate > 0 ? ` · GST ${r.gst_rate}%` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {formatCurrency(r.selling_price)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows(null)} disabled={saving}>
            Back
          </Button>
          <Button className="flex-1" onClick={addSelected} disabled={saving || count === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            Add {count} products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <p className="text-sm text-muted-foreground">
          We&apos;ll suggest a starter catalogue based on your shop type. Add an
          optional note to tailor it (e.g. &quot;mostly cotton kurtis and sarees&quot;).
        </p>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional: what do you mainly sell?"
        />
        <Button size="lg" className="w-full" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? "Generating…" : "Generate starter products"}
        </Button>
      </CardContent>
    </Card>
  );
}
