import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase email-confirmation / magic links.
 * Exchanges the `code` for a session, then sends the user to onboarding
 * or the dashboard depending on whether they have a business yet.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const next = business ? "/dashboard" : "/settings/business-profile";
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
