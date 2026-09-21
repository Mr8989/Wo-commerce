# Going live without a VPS (free tier)

The store runs as four hosted pieces, all on free plans:

| Piece | Service | Notes |
| --- | --- | --- |
| Postgres database | [Neon](https://neon.tech) | 0.5 GB free — years of orders for a boutique |
| Node API (`backend-node/`) | [Render](https://render.com) web service | Free plan sleeps after 15 min idle; step 6 keeps it awake |
| Storefront + admin (`frontend/`) | [Vercel](https://vercel.com) | Also proxies `/api/*` to Render, so there is one domain and no CORS |
| Product images | [Cloudinary](https://cloudinary.com) | Render's disk is wiped on each deploy, so uploads go here |

Sign up for all four with the GitHub account that owns this repo. Total time
is about 30 minutes; nothing below needs a terminal except step 5.

## 1. Neon — database

1. New project, name it `croppedbyayerkie`, region closest to Ghana (Frankfurt).
2. On the project dashboard click **Connect**, pick **Pooled connection** off,
   and copy the connection string. It looks like
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.
   Keep it for step 3.

## 2. Cloudinary — images

1. Dashboard → **API Keys** (or the "Product Environment" panel).
2. Copy the **API environment variable**: `cloudinary://123456789:abcdef@your-cloud`.
   Keep it for step 3.

## 3. Render — API

1. Dashboard → **New → Blueprint**, connect the GitHub repo. Render reads
   `render.yaml` and proposes one service, `croppedbyayerkie-api`.
2. It asks for the values marked `sync: false`. Fill them in:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon string from step 1 |
   | `CLOUDINARY_URL` | the Cloudinary string from step 2 |
   | `SITE_URL` | `https://croppedbyayerkie.com` (or the Vercel URL until the domain is connected) |
   | `EMAIL_HOST_USER` | the shop's Gmail address |
   | `EMAIL_HOST_PASSWORD` | a **new** Gmail app password (Google Account → Security → 2‑Step Verification → App passwords) |
   | `DEFAULT_FROM_EMAIL` | `Cropped By Ayerkie Store <the same gmail>` |
   | `ADMIN_EMAIL` | where new-order emails should go |
   | `AFRICAS_TALKING_USERNAME` / `AFRICAS_TALKING_API_KEY` / `AFRICAS_TALKING_SENDER_ID` | from the Africa's Talking dashboard (leave the key empty to disable SMS) |
   | `SUPPORT_PHONE_NUMBER` | shown in customer messages |

3. **Apply**. The first build takes 3–5 minutes: it installs packages and runs
   the database migrations against Neon.
4. Note the service URL, e.g. `https://croppedbyayerkie-api.onrender.com`.
   Open `<that URL>/api/health/` — it should print `{"status":"ok"}`.

   If Render gave the service a different name (the default was taken), edit
   `frontend/vercel.json` so the `destination` matches, and push.

## 4. Vercel — website

1. Dashboard → **Add New → Project**, import the GitHub repo.
2. Set **Root Directory** to `frontend`. Framework is detected as Vite; leave
   the build settings alone. No environment variables are needed —
   `frontend/vercel.json` forwards `/api/*` to Render.
3. **Deploy**. You get a URL like `https://wo-commerce.vercel.app`; the shop,
   `/track-order` and `/admin/login` all work from it.

Every `git push` to `main` now redeploys both Render and Vercel automatically.

## 5. Create the admin login

Once with the Neon connection string, from your own machine:

```bash
cd backend-node
DATABASE_URL='<neon string>' npm run create-admin -- --username Dtetteh --email owner@example.com
```

It prompts for the password (8+ characters, upper, lower and a digit). Sign in
at `https://<vercel-url>/admin/login`.

## 6. Keep the API awake

Render's free plan sleeps the API after 15 idle minutes and the next visitor
waits ~40 seconds. Pinging it stays within the free 750 hours/month for a
single service:

1. [UptimeRobot](https://uptimerobot.com) (free) → **New monitor** → HTTP(s).
2. URL: `https://croppedbyayerkie-api.onrender.com/api/health/`, interval
   **5 minutes**, and add the shop owner's email for alerts.

That also emails you if the store ever actually goes down.

## 7. Connect croppedbyayerkie.com

1. Vercel → project → **Settings → Domains** → add `croppedbyayerkie.com` and
   `www.croppedbyayerkie.com`. Vercel shows the DNS records it wants.
2. Hostinger hPanel → **Domains → DNS Zone**: set the `A` record for `@` to
   Vercel's IP (`76.76.21.21`) and the `CNAME` for `www` to
   `cname.vercel-dns.com`. Remove any old `A` records pointing elsewhere.
3. Wait for Vercel to show the domain as valid (minutes to an hour); HTTPS is
   automatic.
4. Set `SITE_URL=https://croppedbyayerkie.com` on Render if you used the
   Vercel URL earlier, so links in emails and SMS use the real domain.

## Checking it works

- Storefront loads; product images (uploaded via `/admin/products`) come from
  `res.cloudinary.com`.
- Place a test order: the customer phone gets an SMS, `ADMIN_EMAIL` gets the
  "New Order" email, and the order appears at `/admin/orders`.
- `/track-order` finds it by order number.

## Later: moving up

- **Cold starts bother the owner?** Render → service → upgrade to Starter
  ($7/month), then delete the UptimeRobot monitor or keep it for alerts.
- **Outgrow the free tiers?** `DEPLOYMENT-NODE.md` covers a Hostinger VPS.
  The code is identical; only the environment variables change, and images
  already on Cloudinary keep working.
