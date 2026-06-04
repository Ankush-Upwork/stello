import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Card } from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/nav";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const metadata = { title: "Menu · Sello" };

export default async function MenuPage() {
  const locale = await getLocale();
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t("nav.more", locale)}</h1>

      <Card className="divide-y">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{t(item.tkey, locale)}</span>
              </span>
              {item.available ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {t("nav.soon", locale)}
                </span>
              )}
            </div>
          );

          return item.available ? (
            <Link
              key={item.href}
              href={item.href}
              className="block hover:bg-muted/50"
            >
              {content}
            </Link>
          ) : (
            <div
              key={item.href}
              className={cn("cursor-not-allowed text-muted-foreground/70")}
            >
              {content}
            </div>
          );
        })}
      </Card>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3.5 font-medium text-destructive hover:bg-destructive/5"
        >
          <LogOut className="h-5 w-5" />
          {t("account.logout", locale)}
        </button>
      </form>
    </div>
  );
}
