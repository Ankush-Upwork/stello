import Link from "next/link";
import { Boxes } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-5 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-bold"
      >
        <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-primary-foreground shadow-sm">
          <Boxes className="h-5 w-5" />
        </span>
        Sello
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
