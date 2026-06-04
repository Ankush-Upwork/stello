import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Read the user's chosen locale from the cookie (defaults to English). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}
