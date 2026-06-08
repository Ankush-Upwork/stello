"use server";

import { revalidatePath } from "next/cache";

import { getAdminUser } from "@/lib/admin";
import { sendEmail, emailLayout } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function approveUpgrade(requestId: string): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorised.");

  const supabase = await createClient();
  const { data: req } = await supabase
    .from("upgrade_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.status !== "pending") throw new Error("Request not found.");

  // Apply the plan to the user's subscription (admin RLS allows this).
  const { error: subErr } = await supabase
    .from("subscriptions")
    .update({ plan_id: req.plan_id })
    .eq("user_id", req.user_id);
  if (subErr) throw new Error(subErr.message);

  await supabase
    .from("upgrade_requests")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", requestId);

  const { data: plan } = await supabase
    .from("plans")
    .select("name")
    .eq("id", req.plan_id)
    .maybeSingle();

  if (req.email) {
    await sendEmail({
      to: req.email,
      subject: `Your Sello plan is now ${plan?.name ?? "upgraded"}`,
      html: emailLayout(
        "You're upgraded! 🎉",
        `<p>Your Sello account is now on the <b>${plan?.name ?? "new"}</b> plan. All its features are unlocked. Thank you!</p>`
      ),
    });
  }

  revalidatePath("/admin/upgrades");
}

export async function rejectUpgrade(requestId: string): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Not authorised.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("upgrade_requests")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/upgrades");
}
