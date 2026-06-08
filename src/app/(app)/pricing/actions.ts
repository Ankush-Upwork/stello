"use server";

import { revalidatePath } from "next/cache";

import { sendEmail, emailLayout } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export type RequestResult = { ok: true } | { ok: false; error: string };

/**
 * A user requests an upgrade. We record a pending request and email the user +
 * admin. No plan change happens until an admin approves (after payment).
 */
export async function requestUpgrade(planId: string): Promise<RequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const { data: plan } = await supabase
    .from("plans")
    .select("id, name, price_yearly")
    .eq("id", planId)
    .maybeSingle();
  if (!plan || plan.id === "free") {
    return { ok: false, error: "Pick a paid plan to upgrade." };
  }

  // One open request at a time.
  const { data: existing } = await supabase
    .from("upgrade_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "You already have a pending upgrade request." };
  }

  const { error } = await supabase.from("upgrade_requests").insert({
    user_id: user.id,
    email: user.email ?? null,
    plan_id: plan.id,
  });
  if (error) return { ok: false, error: error.message };

  // Notify the customer.
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Sello ${plan.name} upgrade request`,
      html: emailLayout(
        `Upgrade request received`,
        `<p>Thanks! We've received your request to upgrade to <b>${plan.name}</b> (₹${plan.price_yearly}/year).</p>
         <p>Our team will verify your payment and activate it shortly. We'll email you once it's live.</p>`
      ),
    });
  }
  // Notify the admin.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New upgrade request: ${plan.name}`,
      html: emailLayout(
        `New upgrade request`,
        `<p><b>${user.email}</b> requested <b>${plan.name}</b> (₹${plan.price_yearly}/year).</p>
         <p>Approve it in the admin panel: /admin/upgrades</p>`
      ),
    });
  }

  revalidatePath("/pricing");
  return { ok: true };
}
