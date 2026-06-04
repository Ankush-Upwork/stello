"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/reports/sales", label: "Sales" },
  { href: "/reports/profit", label: "Profit" },
  { href: "/reports/inventory", label: "Inventory" },
  { href: "/reports/customers", label: "Customers" },
];

export function ReportTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex-1 whitespace-nowrap rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
