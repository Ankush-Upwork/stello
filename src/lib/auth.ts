import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/supabase/types";

/**
 * Request-scoped, de-duplicated auth helpers.
 *
 * React's `cache()` memoises these for the duration of a single server render,
 * so a layout AND the page it renders share ONE `auth.getUser()` round-trip
 * instead of each making their own. (The middleware still validates the session
 * separately on every request — that one is required for security.)
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentBusiness = cache(async (): Promise<Business | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data;
});
