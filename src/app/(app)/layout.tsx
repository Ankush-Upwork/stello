import { redirect } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";

/**
 * Protected application shell: sidebar (desktop), top bar, and bottom
 * navigation (mobile). Route protection is enforced in middleware; this
 * layout additionally guarantees we have a user before rendering.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [business, locale] = await Promise.all([getCurrentBusiness(), getLocale()]);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <Sidebar locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          businessName={business?.business_name ?? "Set up your shop"}
          email={user.email ?? ""}
          locale={locale}
        />
        {/* pb-24 leaves room for the mobile bottom nav */}
        <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav locale={locale} />
    </div>
  );
}
