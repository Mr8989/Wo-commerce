# Cropped By Ayerkie — Node API

Express + Prisma replacement for the Django/DRF backend in `../backend`.

It talks to **the same Postgres database**: the Prisma schema is mapped onto the
tables Django's migrations created (`store_product`, `store_order`,
`admin_users`, …), and passwords are hashed in Django's `pbkdf2_sha256` format.
Existing products, orders and admin logins keep working — there is no data
migration and no frontend change.

## Quick start

```bash
cp .env.example .env      # or copy ../backend/.env and add DATABASE_URL
npm install               # runs `prisma generate`

# Existing database (already has the Django tables):
npm run migrate:baseline  # records the schema as applied; changes nothing

# Fresh, empty database:
npm run migrate:deploy    # creates the tables

npm run create-admin -- --username ayerkie --email you@example.com
npm run dev               # http://127.0.0.1:8000
```

Product images live under `MEDIA_ROOT` (default `./media`). Copy the existing
ones over so the paths stored in the database still resolve:

```bash
cp -R ../backend/media ./media
```

## Layout

| Path | What's in it |
| --- | --- |
| `src/config.js` | Environment loading; accepts the old `DATABASE_*` variables |
| `src/app.js` | Express wiring: helmet, CORS, `/media`, `/api`, error handling |
| `src/routes/` | One file per resource, mirroring the DRF viewsets |
| `src/lib/serializers.js` | Response shapes, byte-for-byte compatible with DRF's |
| `src/lib/django-password.js` | Django-compatible `pbkdf2_sha256` hashing |
| `src/lib/pagination.js` | DRF's `{count, next, previous, results}` envelope |
| `src/services/` | Gmail (nodemailer) and Africa's Talking SMS |
| `prisma/schema.prisma` | Models mapped onto Django's table and column names |
| `scripts/create-admin.js` | Replaces the Django admin for managing admins |

## Endpoints

Identical paths, methods and payloads to the Django API — trailing slashes are
optional now, so the frontend's `/api/products/` still works.

Rows marked **admin** need `Authorization: Bearer <token>` from
`/api/admin/login/`; everything else is public.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/products/` | `?category=<slug>&search=&featured=&sort=price_low\|price_high\|newest`, 12 per page |
| GET | `/api/products/featured/` | Up to 8 featured + active products, not paginated |
| GET | `/api/products/:id-or-slug/` | Numeric lookups by id, everything else by slug |
| POST | `/api/products/` | **admin** — JSON or `multipart/form-data` with an `image` file |
| PUT/PATCH/DELETE | `/api/products/:id-or-slug/` | **admin** |
| GET | `/api/categories/`, `/api/categories/:id/` | |
| POST | `/api/categories/` | **admin** |
| PUT/PATCH/DELETE | `/api/categories/:id/` | **admin** |
| POST | `/api/orders/` | Checkout. Line prices and the total are taken from the products table, not the request. 10 per IP per 15 min |
| GET | `/api/orders/track/:order_number/` | Customer order lookup by exact order number |
| GET | `/api/orders/` | **admin** — `?status=&search=<order number>` |
| GET | `/api/orders/stats/` | **admin** — dashboard totals |
| GET/PUT/PATCH/DELETE | `/api/orders/:id/` | **admin** — a status change texts the customer |
| POST | `/api/orders/:id/cancel/` | **admin** — only from `pending` or `processing` |
| GET/POST/DELETE | `/api/cart/`, `/api/cart/clear/` | Server-side cart; the storefront uses localStorage instead |
| POST | `/api/admin/login/`, `/logout/` | Bearer token in `admin_users.auth_token` |
| GET | `/api/admin/verify/` | |
| POST | `/api/admin/request-password-change/` | Emails a 6-digit code |
| POST | `/api/admin/verify-change-password/` | |
| GET | `/api/health/` | For uptime monitoring |

## Differences from the Django backend

**Gone:** the Django admin at `/admin/`. Use `npm run create-admin` to add or
update dashboard admins, and `npm run studio` (Prisma Studio) if you ever need
to poke at rows directly.

**Added:** a per-IP rate limit of 20 requests per 15 minutes on the login and
password-change endpoints. `django-axes` was configured but never actually
covered these views, because they check passwords directly instead of going
through Django's auth backends. The per-account lockout (5 failures, 15
minutes) works exactly as before.

**Unchanged, and worth fixing:** product, category and order endpoints still
accept writes without authentication, the same as the DRF `AllowAny` setting.
Anyone who knows the URL can create or delete a product. Closing this means
requiring a bearer token on those routes and having the admin pages in the
frontend send one — a small change on both sides, but it is a frontend change
too, so it is left as-is here.

Also carried over as-is: list endpoints return 12 items per page and the
storefront never requests page 2, so the Shop and admin Products pages show at
most 12 products. `store.js` calls `/admin/change-password/`, which did not
exist in the Django API either; the working flow is
`request-password-change` → `verify-change-password`.

## Schema changes

`prisma/schema.prisma` is the source of truth. After editing it:

```bash
npx prisma migrate dev --name what_changed   # development
npm run migrate:deploy                       # production
```

One caveat on a database created by Django: Prisma will report drift, because
Django did not add `DEFAULT CURRENT_TIMESTAMP` to the timestamp columns (it set
them in Python) and `relationMode = "prisma"` means Prisma ignores the
database's foreign keys. Neither affects runtime — Prisma supplies timestamps
and applies cascades itself — but it means `migrate dev` wants to "fix" them.
Write the SQL by hand in `prisma/migrations/` and apply it with
`migrate deploy` if that gets in the way.
