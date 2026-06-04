"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Menu,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Tab = { href: string; tkey: string; icon: LucideIcon };

const LEFT: Tab[] = [
  { href: "/dashboard", tkey: "nav.home", icon: LayoutDashboard },
  { href: "/products", tkey: "nav.products", icon: Boxes },
];
const RIGHT: Tab[] = [
  { href: "/customers", tkey: "nav.customers", icon: Users },
  { href: "/menu", tkey: "nav.more", icon: Menu },
];

/** Floating bottom tab bar with an elevated center "Sale" button (mobile only). */
export function MobileNav({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();

  const Item = ({ href, tkey, icon: Icon }: Tab) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {t(tkey, locale)}
      </Link>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <nav className="pointer-events-auto relative mx-3 mb-3 flex items-center rounded-2xl border border-border/70 bg-card/95 px-2 shadow-lg shadow-slate-300/40 backdrop-blur">
        {LEFT.map((t) => (
          <Item key={t.href} {...t} />
        ))}

        {/* Spacer for the FAB */}
        <div className="w-16 shrink-0" />

        {RIGHT.map((t) => (
          <Item key={t.href} {...t} />
        ))}

        {/* Center FAB → new sale */}
        <Link
          href="/sales/new"
          aria-label="New sale"
          className="bg-brand-gradient absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </nav>
    </div>
  );
}
