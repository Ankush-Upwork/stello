"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, PackagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  getRestockSuggestions,
  type RestockItem,
} from "@/app/(app)/restock/actions";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RestockClient({
  allowed,
  remaining,
}: {
  allowed: boolean;
  remaining?: number | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [items, setItems] = React.useState<RestockItem[]>([]);
  const [summary, setSummary] = React.useState("");

  if (!allowed) {
    return (
      <UpgradeNudge
        title="You've used your 5 free AI requests"
        description="Upgrade to keep using AI Restock and the other AI features."
      />
    );
  }

  async function run() {
    setLoading(true);
    try {
      const res = await getRestockSuggestions();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setItems(res.items);
      setSummary(res.summary);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {remaining != null && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {remaining} free AI request{remaining === 1 ? "" : "s"} left on the Free plan.
        </p>
      )}
      {!done && (
        <Card>
          <CardContent className="space-y-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sello looks at what&apos;s low and how fast it&apos;s selling, then
              suggests how much to reorder.
            </p>
            <Button size="lg" onClick={run} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Analysing…" : "Suggest what to reorder"}
            </Button>
          </CardContent>
        </Card>
      )}

      {done && (
        <>
          {summary && (
            <p className="rounded-lg bg-primary/5 px-4 py-3 text-sm">{summary}</p>
          )}
          {items.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Nothing to reorder right now. 🎉
            </p>
          ) : (
            <>
              <Card>
                <CardContent className="divide-y p-0">
                  {items.map((it) => (
                    <div key={it.product_id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.current} in stock · {it.sold30} sold/30d · {it.reason}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-primary">
                          +{it.suggested_qty}
                        </p>
                        <p className="text-[10px] text-muted-foreground">reorder</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Button asChild className="w-full">
                <Link href="/purchases/new">
                  <PackagePlus className="h-4 w-4" /> Create a purchase
                </Link>
              </Button>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Refresh suggestions
          </Button>
        </>
      )}
    </div>
  );
}
