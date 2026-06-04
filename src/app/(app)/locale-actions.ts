"use server";

import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";

/** Persist the chosen UI language in a cookie. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
