import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Returns the current user if they're an admin, else null. */
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
}
