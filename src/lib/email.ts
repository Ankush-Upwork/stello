import "server-only";

/**
 * Minimal transactional email via Resend's REST API.
 * No-ops (logs) if RESEND_API_KEY isn't set, so flows still work in dev.
 * Set RESEND_API_KEY and EMAIL_FROM (e.g. "Sello <noreply@yourdomain>").
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Sello <onboarding@resend.dev>";

  if (!key) {
    console.log(`[email skipped — no RESEND_API_KEY] to=${args.to} subject="${args.subject}"`);
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html }),
    });
    return { ok: res.ok };
  } catch (err) {
    console.error("sendEmail failed:", err);
    return { ok: false };
  }
}

/** Tiny HTML wrapper so emails look consistent. */
export function emailLayout(title: string, body: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 12px">${title}</h2>
    ${body}
    <p style="margin-top:24px;color:#94a3b8;font-size:12px">Sello · Run your shop from your phone</p>
  </div>`;
}
