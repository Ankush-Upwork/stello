# Deploying Sello to production (Vercel + Supabase)

A step-by-step go-live checklist. Estimated time: ~20–30 minutes.

---

## 0) Before you start — security

- 🔑 **Rotate your OpenAI key.** It was pasted into a chat, so treat it as
  exposed. Create a fresh key at <https://platform.openai.com/api-keys>, delete
  the old one, and set a small monthly usage limit.
- Your `.env.local` is git-ignored, so secrets won't be committed. Good.

---

## 1) Make sure all database migrations are run

In the Supabase **SQL Editor**, confirm you've run every migration in order:

```
0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010
```

(Optional demo data: `seed_dummy_data.sql`, `seed_product_images.sql`.)

---

## 2) Push the code to GitHub

From the project folder (`d:\Inventory APP`):

```powershell
git init
git add .
git commit -m "Sello — initial deploy"
git branch -M main
```

Create an empty repo on GitHub (no README), then:

```powershell
git remote add origin https://github.com/<you>/sello.git
git push -u origin main
```

> Double-check `.env.local` is **not** in the push (it's git-ignored). Run
> `git status` first — you should NOT see `.env.local` listed.

---

## 3) Import the project on Vercel

1. Go to <https://vercel.com> → **Add New → Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default.
3. **Environment Variables** — add these (Production + Preview):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://joakalsabohggpkyorjj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_...` key |
| `OPENAI_API_KEY` | your **new** OpenAI key (server-side, not public) |
| `NEXT_PUBLIC_SITE_URL` | `https://sello.datavoris.com` |

4. Click **Deploy** (you'll get a temporary `…vercel.app` URL first).
5. Add your subdomain (next step), then set `NEXT_PUBLIC_SITE_URL=https://sello.datavoris.com` and redeploy.

### Attach your subdomain `sello.datavoris.com`

1. Vercel → Project → **Settings → Domains** → add **`sello.datavoris.com`**.
2. Vercel shows a DNS record to add. In your **datavoris.com DNS** (registrar/host),
   add a **CNAME**: `sello` → `cname.vercel-dns.com` (use the exact target Vercel shows).
3. Wait for it to verify (usually minutes). HTTPS is issued automatically.

---

## 4) Point Supabase Auth at the live URL

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://sello.datavoris.com`
- **Redirect URLs:** add `https://sello.datavoris.com/auth/callback`

In **Authentication → Providers → Email**: decide on **Confirm email**.
- Keep it **on** for real users (recommended) — confirmation links now point to
  your live domain via the callback above.
- Or keep it off for a quick pilot (instant signup).

---

## 5) Smoke-test the live app

On your phone, open the Vercel URL and run the full flow:

1. Sign up → create shop profile (add GSTIN + UPI ID)
2. Add a product (with a photo) → record a sale → open **Invoice / Print**
3. Try **Collect payment** (UPI QR) and a **WhatsApp** reminder
4. Switch language to **हिन्दी**
5. Check the **public catalog** link works while logged out

---

---

## Notes

- Every `git push` to `main` auto-deploys. Use branches + preview deploys for
  changes you want to test before going live.
- The Supabase **anon/publishable** key is safe in the browser — Row Level
  Security protects each shop's data. Never expose the `service_role` key.
