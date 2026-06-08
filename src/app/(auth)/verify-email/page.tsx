import Link from "next/link";

import { VerifyEmail } from "@/app/(auth)/verify-email/verify-email";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Verify your email · Sello" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Check your email 📧</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-foreground">
            {email || "your email"}
          </span>
          . Click it to activate your account, then log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerifyEmail email={email ?? ""} />
        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
