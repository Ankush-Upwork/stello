"use client";

import * as React from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { resendVerification } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function VerifyEmail({ email }: { email: string }) {
  const [sending, setSending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email) {
      toast.error("Go back and sign up again to resend.");
      return;
    }
    setSending(true);
    try {
      const res = await resendVerification(email);
      if (res.ok) {
        toast.success("Verification email sent again.");
        setCooldown(45);
      } else {
        toast.error(res.error ?? "Could not resend. Try again shortly.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <Mail className="h-5 w-5 shrink-0 text-primary" />
        Didn&apos;t get it? Check spam, or resend below.
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={resend}
        disabled={sending || cooldown > 0}
      >
        {sending && <Loader2 className="animate-spin" />}
        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
      </Button>
    </div>
  );
}
