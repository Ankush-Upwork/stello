import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  IndianRupee,
  MessageCircle,
  Receipt,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm">
              <Boxes className="h-5 w-5" />
            </span>
            Sello
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-72 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
          <div className="text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="h-4 w-4" /> AI + WhatsApp for your shop
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Run your shop from your{" "}
              <span className="text-brand-gradient">phone</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
              Tell Sello what happened in your shop today — it updates
              inventory, sales, customers, pending payments and WhatsApp invoices
              automatically. No notebooks, no Excel.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to start · No credit card · Works on any phone
            </p>
          </div>

          {/* Phone preview */}
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <DashboardPreview />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-4 text-sm text-muted-foreground">
          <span className="font-medium">Built for</span>
          {["Boutiques", "Garment shops", "Footwear", "Cosmetics", "Gift shops", "Home sellers"].map(
            (s) => (
              <span key={s} className="flex items-center gap-1">
                <Check className="h-4 w-4 text-emerald-600" /> {s}
              </span>
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything your shop needs</h2>
          <p className="mt-3 text-muted-foreground">
            One simple app instead of notebooks, Excel and scattered WhatsApp chats.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* See it in action */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">See it in action</h2>
            <p className="mt-3 text-muted-foreground">
              Clean, mobile-first screens designed for busy shopkeepers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ScreenCard title="Smart dashboard" desc="Today's sales, profit & alerts at a glance.">
              <DashboardPreview compact />
            </ScreenCard>
            <ScreenCard title="GST invoice" desc="Tax invoice you can print or share instantly.">
              <InvoicePreview />
            </ScreenCard>
            <ScreenCard title="WhatsApp catalog" desc="Customers browse & order on WhatsApp.">
              <CatalogPreview />
            </ScreenCard>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <span className="bg-brand-gradient mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full font-bold text-white">
                {i + 1}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16">
        <div className="bg-brand-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white shadow-lg shadow-primary/20">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to simplify your shop?</h2>
            <p className="mx-auto mt-2 max-w-md text-white/85">
              Join shopkeepers across India managing their business the smart way.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 shadow-sm">
              <Link href="/signup">
                Start free today <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sello · Made for Indian local shops.
      </footer>
    </main>
  );
}

const FEATURES = [
  { icon: Boxes, title: "Inventory in your pocket", body: "Products with photos, sizes & colours. Low-stock alerts before you run out." },
  { icon: IndianRupee, title: "Sales & auto stock", body: "Record a sale and stock updates itself. Profit tracked on every bill." },
  { icon: MessageCircle, title: "WhatsApp invoices", body: "Send invoices & gentle payment reminders to customers in one tap." },
  { icon: Receipt, title: "GST tax invoices", body: "Print or save GST invoices with CGST/SGST — A4 or thermal." },
  { icon: Sparkles, title: "AI sale entry", body: '"Sold 2 red kurtis to Priya for ₹2400" — and it\'s done.' },
  { icon: BarChart3, title: "Reports & insights", body: "Sales, profit, top sellers and dead stock — no Excel needed." },
];

const STEPS = [
  { title: "Create your shop", body: "Sign up and add your shop details in under a minute." },
  { title: "Add products & sales", body: "Bulk-import products, then record sales as they happen." },
  { title: "Sell & get paid", body: "Share catalogs, send invoices and collect via UPI." },
];

/* ----------------------------- UI mockups ------------------------------ */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[270px] rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
      <div className="h-[560px] overflow-hidden rounded-[1.5rem] bg-background">
        {children}
      </div>
    </div>
  );
}

function ScreenCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="h-[300px] overflow-hidden">{children}</div>
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-0.5 text-center text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-muted/30 text-[11px]">
      <div className="flex items-center justify-between bg-card px-3 py-2.5">
        <span className="font-semibold">Priya&apos;s Boutique</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">P</span>
      </div>
      <div className="space-y-2.5 p-3">
        <div className="bg-brand-gradient rounded-xl p-3 text-white">
          <p className="text-[10px] text-white/80">Welcome, Priya 👋</p>
          <p className="mt-2 text-[10px] text-white/80">Today&apos;s sales</p>
          <p className="text-lg font-bold">₹4,200</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Profit", v: "₹1,650", c: "text-emerald-600" },
            { l: "Pending", v: "₹2,400", c: "text-amber-600" },
            { l: "Products", v: "128", c: "" },
            { l: "Low stock", v: "6", c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-card p-2">
              <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
              <p className="text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        {!compact && (
          <div className="rounded-lg border bg-card p-2.5">
            <p className="mb-1.5 font-semibold">Top sellers</p>
            {["Anarkali Kurti", "Cotton Saree", "Denim Jeans"].map((p, i) => (
              <div key={p} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/10 text-[9px] text-primary">
                    {i + 1}
                  </span>
                  {p}
                </span>
                <span className="text-muted-foreground">₹{(12 - i * 3)}00</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoicePreview() {
  return (
    <div className="flex h-full flex-col bg-white p-4 text-[11px] text-slate-900">
      <div className="flex items-start justify-between border-b pb-2">
        <div>
          <p className="text-sm font-bold">Priya&apos;s Boutique</p>
          <p className="text-slate-400">GSTIN: 24ABCDE1234F1Z5</p>
        </div>
        <div className="text-right">
          <p className="font-semibold uppercase text-slate-400">Tax Invoice</p>
          <p className="font-bold">SL-20260604-0007</p>
        </div>
      </div>
      <table className="mt-2 w-full">
        <thead className="border-b text-left text-slate-400">
          <tr>
            <th className="py-1 font-medium">Item</th>
            <th className="py-1 text-right font-medium">Amt</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Anarkali Kurti (M/Red)", "2,400"],
            ["Cotton Saree", "1,500"],
          ].map(([n, a]) => (
            <tr key={n} className="border-b border-dashed">
              <td className="py-1">{n}</td>
              <td className="py-1 text-right">₹{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-2 w-32 space-y-0.5">
        <Row l="CGST" v="₹178" />
        <Row l="SGST" v="₹178" />
        <div className="flex justify-between border-t pt-1 font-bold">
          <span>Total</span>
          <span>₹3,900</span>
        </div>
      </div>
      <div className="mt-auto rounded-lg bg-[#25D366]/10 p-2 text-center text-[#1ebe57]">
        Send on WhatsApp
      </div>
    </div>
  );
}

function CatalogPreview() {
  return (
    <div className="flex h-full flex-col bg-muted/30 text-[11px]">
      <div className="bg-primary px-3 py-3 text-white">
        <p className="text-sm font-bold">Priya&apos;s Boutique</p>
        <p className="text-[10px] text-white/80">Boutique · Surat</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {[
          ["Anarkali Kurti", "₹1,200"],
          ["Cotton Saree", "₹1,500"],
          ["Party Clutch", "₹799"],
          ["Denim Jeans", "₹1,299"],
        ].map(([n, p], i) => (
          <div key={n} className="overflow-hidden rounded-lg border bg-card">
            <div
              className="h-12"
              style={{
                background: ["#fde68a", "#fbcfe8", "#bfdbfe", "#bbf7d0"][i],
              }}
            />
            <div className="p-1.5">
              <p className="truncate font-medium">{n}</p>
              <p className="font-bold">{p}</p>
              <div className="mt-1 rounded bg-[#25D366]/15 py-0.5 text-center text-[9px] text-[#1ebe57]">
                Order
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{l}</span>
      <span>{v}</span>
    </div>
  );
}
