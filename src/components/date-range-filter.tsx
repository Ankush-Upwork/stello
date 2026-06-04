"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANGE_PRESETS, type RangeKey } from "@/lib/date-range";
import { cn } from "@/lib/utils";

/** Preset + custom date-range picker that drives the page via URL params. */
export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = (params.get("range") as RangeKey) || "month";
  const [from, setFrom] = React.useState(params.get("from") ?? "");
  const [to, setTo] = React.useState(params.get("to") ?? "");

  function setPreset(key: RangeKey) {
    router.push(`${pathname}?range=${key}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    router.push(`${pathname}?range=custom&from=${from}&to=${to}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RANGE_PRESETS.map((p) => (
          <Button
            key={p.key}
            type="button"
            size="sm"
            variant={active === p.key ? "default" : "outline"}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-3 text-sm",
            active === "custom"
              ? "border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          Custom
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-auto"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 w-auto"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={applyCustom}
          disabled={!from || !to}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
