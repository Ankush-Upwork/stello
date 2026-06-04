# Sello — Product Roadmap

Updated after a competitive review of the Indian small-shop market (Vyapar,
myBillBook, Khatabook/OkCredit, Dukaan/Bikayi, TallyPrime, GimBooks, VasyERP).

The goal is **not** to match every feature of accounting-heavy incumbents, but
to be the **simplest, AI-first, WhatsApp-native** app for non-technical shop
owners — while still covering the table-stakes Indian shops expect.

---

## ✅ Done

- **Phase 1** — Auth, business profile, protected mobile-first shell.
- **Phase 2** — Product inventory (photos, search, category filter, low-stock),
  real dashboard stats, Supabase Storage.
- **Perf pass** — route loading skeletons + request-scoped auth de-duplication.

---

## 🧭 Our differentiators (the moat — invest here)

1. **AI natural-language entry** — "Sold 2 red kurtis size L to Priya, paid 1000
   UPI." No competitor does this well. This is the headline.
2. **WhatsApp-native commerce loop** — catalog → customer orders on WhatsApp →
   invoice + payment link in one thread (go beyond "share a PDF").
3. **Radical simplicity** — big buttons, vernacular, "tell me what happened
   today." Win the user who finds Vyapar overwhelming.
4. **AI insights, not just reports** — "These 8 designs haven't sold in 60 days,
   here's a WhatsApp offer to clear them."

---

## 📌 Revised phase plan

### Phase 3 — Customer Management  *(next)*
`customers` table with running purchase/paid/pending totals, search by
name/phone, add/edit, detail page (sales-history placeholder for Phase 4).

### Phase 3.5 — Product Variants *(structural — do before sales)*
Upgrade products to support a **size × colour variant matrix** (each variant has
its own SKU/barcode/quantity/price). Critical for boutique, garment and shoe
wholesale. Cheaper to do before sales logic depends on stock.

### Phase 4 — Sales + Auto Stock Deduction
Multi-item sales, discounts, paid/pending, payment mode, auto stock reduction,
customer-total updates, invoice numbers. **Folded in:** GST fields (GSTIN, HSN,
CGST/SGST) and the invoice data needed for printing.

### Phase 5 — WhatsApp Invoice + Payments
wa.me invoice + reminders **plus** (new vs original plan):
- **UPI payment collection** — QR / payment link, one-tap "mark as paid".
- **Printable invoice** — A4/A5 PDF + 2"/3" thermal layout.

### Phase 5.5 — Adoption essentials *(new — Indian table-stakes)*
- **Bulk product import** (Excel/CSV) — removes onboarding friction.
- **Vernacular UI** (Hindi first, then regional) — fits the non-technical owner.
- **Offline-friendly** behaviour / graceful sync — patchy-internet reality.
- **Barcode** generate + scan (camera) for fast counter billing.

### Phase 6 — Dashboard + Reports
Sales/profit/inventory/customer reports with date filters; **GST reports
(GSTR-1 summary)**; dead-stock & top-sellers; returns/credit notes.

### Phase 7 — AI Sales Entry Assistant
Natural-language → structured sale draft → editable preview → confirm.

### Phase 8 — AI Marketing + WhatsApp Catalog
Captions (WhatsApp/Instagram) + a **shareable catalog where customers can place
orders** (not just view) — closing the WhatsApp commerce loop.

### Phase 9 — Purchases + Suppliers
Supplier ledger, purchase entry → stock inward, supplier pending, purchase
history. **Folded in:** expenses tracking + simple P&L.

### Phase 10 — SaaS Readiness
Plans/limits, subscription tables, upgrade page, **staff roles & permissions**,
multi-store + stock transfer, custom invoice branding.

---

## 🗂️ Backlog / segment-specific (slot in by demand)

- Customer **measurements / tailoring notes** (boutique stitching).
- **Wholesale vs retail price tiers** (shoe wholesalers).
- **Batch + expiry** tracking (cosmetics).
- Customer **loyalty / points**.
- Estimates / quotations, delivery challan, proforma.
- Data backup / export, multi-device sync.

> Principle: every added feature must survive the "would this confuse a
> non-technical shop owner?" test. When in doubt, hide it behind AI or a simple
> default.
