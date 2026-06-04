import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "green" | "amber" | "red";
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
  }[accent];

  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm shadow-slate-200/40">
      <span
        className={cn(
          "mb-2 grid h-8 w-8 place-items-center rounded-lg",
          accentClasses
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="truncate text-xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
