"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Globe, LogOut, Settings, Store, User } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { setLocale } from "@/app/(app)/locale-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, t, type Locale } from "@/lib/i18n";

export function Topbar({
  businessName,
  email,
  locale = "en",
}: {
  businessName: string;
  email: string;
  locale?: Locale;
}) {
  const router = useRouter();

  async function chooseLocale(code: Locale) {
    await setLocale(code);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Store className="h-4 w-4" />
        </span>
        <span className="truncate font-semibold tracking-tight">{businessName}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account menu">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings/business-profile">
            <DropdownMenuItem>
              <Settings className="h-4 w-4" />
              {t("account.shopProfile", locale)}
            </DropdownMenuItem>
          </Link>
          <Link href="/settings/billing">
            <DropdownMenuItem>
              <CreditCard className="h-4 w-4" />
              {t("account.billing", locale)}
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> {t("account.language", locale)}
          </DropdownMenuLabel>
          {LOCALES.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => chooseLocale(l.code)}
            >
              <span className="w-4">
                {locale === l.code && <Check className="h-4 w-4" />}
              </span>
              {l.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <form action={logout}>
            <button type="submit" className="w-full">
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                {t("account.logout", locale)}
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
