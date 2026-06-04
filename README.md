# Sello

A mobile-first SaaS web app for small Indian local shops — inventory, sales,
customers, pending payments and WhatsApp automation, built to feel like a
business assistant rather than accounting software.

> **Positioning:** _"Tell the app what happened in your shop today, and it will
> update inventory, sales, customers, payment pending, and WhatsApp invoice
> automatically."_

This repository is being built in **phases**. See [ROADMAP.md](ROADMAP.md) for
the full, competitively-informed plan.

---

## Latest additions

- ⚡ **Performance pass** — route-level loading skeletons (instant feedback on
  every tap) + request-scoped auth de-duplication ([src/lib/auth.ts](src/lib/auth.ts)).
- 🧩 **Optional product variants** — a product can stay simple (one item) or be
  expanded into a **size × colour grid**, each variant with its own
  stock/price/SKU. Stock, value and low-stock are computed across variants.
- 👥 **Phase 3 — Customer Management** — customers list with **search by
  name/phone**, add/edit/delete, and a detail page with total purchase / paid /
  pending and live purchase history.
- 🧾 **Phase 4 — Sales + Auto Stock Deduction** — multi-item sales with a
  searchable product/variant picker, discount, payment mode, delivery status;
  **stock deducts automatically** (product or variant), customer totals update,
  and a unique invoice number (`SS-YYYYMMDD-0001`) is assigned. Everything runs
  in **one atomic Postgres transaction** (`create_sale()`), so insufficient
  stock rolls the whole sale back. Deleting a sale asks whether to **restore
  stock** (`delete_sale()`).
- 💬 **Phase 5 — WhatsApp Invoice + Payment Reminders** — one-tap **Send
  invoice** and **Send payment reminder** via `wa.me` links from the sale and
  customer pages, plus a **/payments/pending** page listing everyone who owes
  money with a "Remind" button. No WhatsApp API needed — opens WhatsApp with the
  message pre-filled. (No new tables — pure UI on existing data.)
- 📈 **Phase 6 — Dashboard + Reports** — dashboard now shows today's &
  this-month's **sales and profit**, pending payments, top sellers and recent
  sales. New **/reports** section (Sales, Profit, Inventory, Customers) with
  **Today / Yesterday / Week / Month / custom** date filters, profit margin,
  high-value & **dead stock**, and top customers. (No new tables.)
- 🎨 **Design** — modern indigo→violet brand theme, compact rounded cards,
  polished sidebar/top bar, a **floating mobile bottom bar with a center "Sale"
  button**, gradient dashboard hero.
- 📦 **Phase 9 — Purchases + Suppliers** — supplier list/detail with running
  purchased/paid/pending totals; record a **purchase that adds stock inward**
  (product or variant) and refreshes cost — atomic via `create_purchase()`;
  delete asks whether to **remove the added stock** (`delete_purchase()`).
  Pages: `/suppliers`, `/purchases`. **Run migration `0007`.**
- 💳 **Phase 10 — SaaS readiness** — `plans` + `subscriptions` tables (Free /
  Starter / Pro / Business), **usage limits enforced** (Free = 50 products, 50
  sales/month), a **/pricing** page (switch plans — no payment yet) and
  **/settings/billing** with usage bars. **Run migration `0008`.**
- 📊 **Reports v2** — the reports now have **charts** (revenue/profit trend,
  payment-mode donut, top-product & category bars) plus drill-through to sales.
- ⬆️ **Bulk product import** — `/products/import`: download a CSV template,
  fill it, upload, and import many products at once (validated, respects plan
  limit).
- 🛍️ **Phase 8 — AI Captions + WhatsApp Catalog** — a public **/catalog/share/[id]**
  page customers can browse and **order on WhatsApp** (only safe fields exposed
  via a security-definer function — costs/suppliers stay private); an owner
  **/catalog** page to copy/share the link; and **/products/[id]/marketing** to
  generate WhatsApp/Instagram/discount/new-arrival **captions with AI**.
- 🤖 **Phase 7 — AI Sale Entry** — type a sale in plain language
  ("Sold 2 red kurtis size L to Priya for ₹2400, paid 1000 UPI") on
  **/ai/sale-entry**; OpenAI returns a structured draft, the app **matches it to
  your products/variants and customers**, and you review/edit/confirm — reusing
  the Phase 4 sale engine. **Needs `OPENAI_API_KEY`** in `.env.local`
  (get one at platform.openai.com/api-keys). (No new tables.)

> **Run migrations in order** in the Supabase SQL Editor:
> `0001` → `0002` → `0003_phase3_5_product_variants.sql` →
> `0004_phase3_customers.sql` → `0005_phase4_sales.sql` →
> `0006_phase8_public_catalog.sql` → `0007_phase9_purchases.sql` →
> `0008_phase10_plans.sql` → `0009_market_gst_pricing.sql` →
> `0010_upi_record_payment.sql`. Only run the ones you haven't run yet.
>
> **Optional seeds:** `supabase/seed_dummy_data.sql` (demo products, customers,
> sales) and `supabase/seed_product_images.sql` (placeholder photos for testing).

---

## Phase 2 — Product Inventory Management

- ✅ `products` table with RLS + indexes (`supabase/migrations/0002_phase2_products.sql`)
- ✅ Supabase **Storage** bucket `product-images` (public read, owner-only writes)
- ✅ Product list with **search** + **category filter** + mobile product cards
- ✅ Add / edit / delete products (delete also removes the photo + asks to confirm)
- ✅ **Product image upload** (client-side direct to Storage, up to 5 MB)
- ✅ **Low / out-of-stock** indicators (`qty <= threshold` / `qty <= 0`)
- ✅ Real dashboard numbers: total products, low/out-of-stock count, inventory
  value (purchase price) and expected value (selling price) + low-stock alerts

### Phase 2 pages

| Route                   | Description                              |
| ----------------------- | ---------------------------------------- |
| `/products`             | Searchable, filterable product list      |
| `/products/new`         | Add a product (with photo)               |
| `/products/[id]`        | Product detail + edit/delete             |
| `/products/[id]/edit`   | Edit a product                           |

> **After pulling Phase 2, run the new migration**
> `supabase/migrations/0002_phase2_products.sql` in the Supabase SQL Editor.
> It creates the `products` table **and** the `product-images` storage bucket
> with its access policies.

---

## Phase 1 — what's included

- ✅ Next.js (App Router) + TypeScript
- ✅ Tailwind CSS + shadcn/ui (new-york style) components
- ✅ Supabase client/server/middleware setup with SSR cookie handling
- ✅ Email + password authentication (sign up, log in, log out)
- ✅ Protected app shell with route protection via middleware
- ✅ Mobile-first layout: sidebar (desktop), top bar, bottom tab nav (mobile)
- ✅ Business profile onboarding + edit
- ✅ Dashboard with placeholder stat cards
- ✅ PostgreSQL schema for `profiles` + `businesses` with Row Level Security

### Pages

| Route                          | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `/`                            | Public landing page                          |
| `/login`                       | Log in                                       |
| `/signup`                      | Create account                               |
| `/dashboard`                   | Protected home (stat cards + next steps)     |
| `/settings/business-profile`   | Create / edit business profile               |
| `/menu`                        | Mobile "More" menu (full nav + log out)      |
| `/auth/callback`               | Handles Supabase email-confirmation links    |

---

## Tech stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + Postgres +
RLS) · zod · sonner (toasts) · lucide-react (icons).

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> and create a free project.
2. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> On Windows PowerShell use `Copy-Item .env.example .env.local` instead of `cp`.

### 4. Run the database migration

Open **Supabase → SQL Editor**, paste the contents of
[`supabase/migrations/0001_phase1_profiles_businesses.sql`](supabase/migrations/0001_phase1_profiles_businesses.sql)
and run it. This creates the `profiles` and `businesses` tables, the
`business_type` enum, `updated_at` triggers, an auto-profile trigger on signup,
and all Row Level Security policies.

### 5. Auth settings (recommended for local dev)

In **Supabase → Authentication → Providers → Email**:

- For the fastest local testing, **turn off "Confirm email"** so signups create
  a session immediately and redirect straight to onboarding.
- If you keep email confirmation **on**, add
  `http://localhost:3000/auth/callback` to
  **Authentication → URL Configuration → Redirect URLs**. The confirmation link
  will then route users into the app.

### 6. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Environment variables

| Variable                        | Required | Description                                   |
| ------------------------------- | -------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Your Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key                      |
| `NEXT_PUBLIC_SITE_URL`          | No       | Base URL for auth redirects (default 3000)    |

---

## How auth & onboarding flow works

1. User signs up → Supabase creates an `auth.users` row.
2. A database trigger auto-creates a matching `profiles` row.
3. After login/signup the app checks for a `businesses` row:
   - **None?** → redirect to `/settings/business-profile` to onboard.
   - **Exists?** → redirect to `/dashboard`.
4. `src/middleware.ts` refreshes the session on every request and blocks
   unauthenticated access to protected routes.

---

## Project structure

```
src/
├─ app/
│  ├─ (auth)/                 # login, signup, auth server actions
│  ├─ (app)/                  # protected shell (layout) + pages
│  │  ├─ dashboard/
│  │  ├─ menu/
│  │  └─ settings/business-profile/
│  ├─ auth/callback/          # Supabase email-link handler
│  ├─ layout.tsx              # root layout + Toaster
│  ├─ page.tsx                # landing page
│  └─ globals.css
├─ components/
│  ├─ ui/                     # shadcn/ui primitives
│  ├─ layout/                 # sidebar, topbar, mobile-nav
│  ├─ dashboard-card.tsx
│  └─ submit-button.tsx
├─ lib/
│  ├─ supabase/               # client, server, middleware, types
│  ├─ validations/            # zod schemas
│  ├─ constants.ts            # business types, Indian states
│  ├─ nav.ts                  # navigation config
│  └─ utils.ts                # cn(), formatCurrency(), formatDate()
└─ middleware.ts
supabase/migrations/          # SQL schema
```

---

## Market-readiness add-ons ✅ (run migrations `0009` + `0010`)

- **Annual pricing** — Free ₹0 / Starter ₹1,999 / Pro ₹3,999 / Business ₹7,999 per year.
- **GST** — GSTIN on the shop, HSN + GST rate on products; a **printable / PDF +
  thermal Tax Invoice** at `/invoice/[id]` with CGST/SGST breakup (Print → Save as PDF).
- **UPI collection** — set a UPI ID in the shop profile; the sale page shows a
  **"Collect payment"** UPI QR + link and a one-tap **mark-received** that updates
  pending instantly (`record_payment`).
- **Hindi UI** — language switcher (account menu); navigation, dashboard and menu
  are translated (हिन्दी). Framework is in place to extend to full coverage +
  regional languages.

## AI features + entitlements (run migration `0012`)

Plans now gate AI: **paid tiers** unlock the "cheap" AI features; **Ask Sello**
(coming) is metered for Pro/Business via `ai_usage`.

- 🧰 **AI Quick Setup** (`/products/quick-setup`) — generates a starter product
  catalogue from your shop type + a short note; review & import.
- 🔄 **AI Restock** (`/restock`) — suggests reorder quantities from low stock +
  30-day sales velocity, with a one-line reason each.

Queued next: ⌨️ Smart Autofill (category/HSN/GST from a name) and 💬 **Ask Sello**
(metered NL command bar, Pro/Business).

Backlog: bulk import for **sales & purchases**, GST reports (GSTR-1), deeper
Hindi/regional coverage, offline mode, staff roles, real payment gateway.
