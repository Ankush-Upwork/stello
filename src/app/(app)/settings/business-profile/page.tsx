import { redirect } from "next/navigation";

import { BusinessProfileForm } from "@/app/(app)/settings/business-profile/business-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Business Profile · Sello" };

export default async function BusinessProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getCurrentBusiness();

  const isEdit = Boolean(business);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Business profile" : "Set up your shop"}
        </h1>
        <p className="text-muted-foreground">
          {isEdit
            ? "Update your shop details below."
            : "Tell us about your shop. You can change this anytime."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop details</CardTitle>
          <CardDescription>
            This appears on WhatsApp invoices and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* On first setup, prefill owner name/email from the auth profile. */}
          <BusinessProfileForm
            business={business ?? null}
            prefill={{
              owner_name: (user.user_metadata?.full_name as string) ?? null,
              email: user.email ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
