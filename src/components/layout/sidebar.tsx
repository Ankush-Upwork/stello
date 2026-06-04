"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes } from "lucide-react";

import { NAV_ITEMS } from "@/lib/nav";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Sidebar({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-card md:flex">
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-2.5 px-6 text-lg font-bold tracking-tight"
      >
        <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-primary-foreground shadow-sm">
          <Boxes className="h-5 w-5" />
        </span>
        Sello
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (!item.available) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/60"
                title="Coming in a later phase"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {t(item.tkey, locale)}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  {t("nav.soon", locale)}
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.tkey, locale)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
