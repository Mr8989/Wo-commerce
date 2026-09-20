# Deploying the Node backend

Replaces `DEPLOYMENT.md` (Django/gunicorn). The database, domain, TLS and
frontend build are unchanged — only the application process changes.

## Cutting over an existing Hostinger VPS

The Node API reads and writes the same Postgres database, so this is a swap of
the running process, not a data migration. Expect a minute or two of downtime.

```bash
cd /var/www/croppedbyayerkie
git pull

# 1. Node 20+ (Ubuntu's `nodejs` package is usually too old)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # must be >= 20

# 2. Dependencies and Prisma client
cd backend-node
npm ci --omit=dev

# 3. Configuration: reuse the Django .env and add the two new variables
cp ../backend/.env .env
nano .env
#   add DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/DBNAME
#   add SITE_URL=https://croppedbyayerkie.com
#   set DEBUG=False
#
# The server itself can assemble DATABASE_URL out of the old DATABASE_NAME /
# DATABASE_USER / ... variables, but the Prisma CLI reads .env directly and
# needs the single URL, so `migrate deploy` below fails without it.
#
# SECRET_KEY, ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS are Django-only and are
# simply ignored.

# 4. Tell Prisma the schema is already there — this runs no SQL
npx prisma migrate resolve --applied 0_init

# 5. Move the uploaded product images across
sudo mv ../backend/media ./media
sudo chown -R www-data:www-data ./media

# 6. Swap the service
sudo systemctl stop croppedbyayerkie
sudo cp ../deploy/croppedbyayerkie-node.service /etc/systemd/system/croppedbyayerkie.service
sudo systemctl daemon-reload
sudo systemctl start croppedbyayerkie
sudo systemctl status croppedbyayerkie      # should be "active (running)"

# 7. nginx: drop the /static/ and /admin/ proxies, point /media/ at the new path
sudo cp ../deploy/nginx_croppedbyayerkie_node.conf /etc/nginx/sites-available/croppedbyayerkie
sudo nginx -t && sudo systemctl reload nginx
```

Certbot's HTTPS server block lives in the same file and step 7 overwrites it.
Re-run `sudo certbot --nginx -d croppedbyayerkie.com -d www.croppedbyayerkie.com`
afterwards to have it re-added.

### Verify

```bash
curl -s https://croppedbyayerkie.com/api/health/          # {"status":"ok"}
curl -s https://croppedbyayerkie.com/api/products/ | head # JSON, count + results
```

Then in a browser:

- the storefront loads and product images appear (they come from `/media/`)
- `/admin/login` signs in with the **existing** admin password
- a hard refresh on `/admin/orders` loads the dashboard rather than a 404
  (the old nginx config proxied that path to the Django admin)
- placing a test order sends the customer SMS and the owner email

Crash alerts keep working: `deploy/alert-on-failure.sh` now looks for
`backend-node/.env` first and falls back to the Django one.

### Rolling back

Nothing is destructive except moving `media/` in step 5, so a rollback is:

```bash
sudo systemctl stop croppedbyayerkie
sudo mv /var/www/croppedbyayerkie/backend-node/media /var/www/croppedbyayerkie/backend/media
sudo cp deploy/gunicorn.service /etc/systemd/system/croppedbyayerkie.service
sudo cp deploy/nginx_croppedbyayerkie.conf /etc/nginx/sites-available/croppedbyayerkie
sudo systemctl daemon-reload && sudo systemctl start croppedbyayerkie
sudo nginx -t && sudo systemctl reload nginx
```

Once you have run on Node for a while, delete `backend/`, `deploy/gunicorn.service`,
`deploy/nginx_croppedbyayerkie.conf` and `DEPLOYMENT.md`.

## Redeploying after code changes

```bash
cd /var/www/croppedbyayerkie
git pull
cd backend-node && npm ci --omit=dev && npx prisma migrate deploy
sudo systemctl restart croppedbyayerkie
cd ../frontend && npm install && npm run build
```

## Moving off the VPS

If the goal is a smaller hosting bill, the VPS is what costs money — the same
box runs Node for the same price it ran Django. Worth knowing before you move:

- **The app is a plain HTTP server on `PORT`.** Render, Railway and Fly.io all
  run it with `npm ci && npm run start`. Set every variable from `.env.example`
  in the host's dashboard.
- **Uploaded images need a disk that survives restarts.** Free tiers usually
  have an ephemeral filesystem, so `media/` is wiped on every deploy. Either
  attach a persistent volume (Render disks, Fly volumes — usually the point
  where the free tier ends) or move uploads to object storage such as
  Cloudflare R2 or Backblaze B2 and store the URL in `image_url`. Products
  already support a pasted URL instead of an upload, so that path works today
  without code changes.
- **You still need Postgres.** Neon and Supabase have usable free tiers;
  point `DATABASE_URL` at one and run `npx prisma migrate deploy` against it.
- **The frontend is static.** `frontend/dist` can go on Cloudflare Pages,
  Netlify or Vercel for free. Set `VITE_API_URL` to the API's public URL and
  add that origin to `CORS_ALLOWED_ORIGINS`, since they will no longer share a
  domain.
- **Free tiers sleep.** A request to a cold instance can take 30+ seconds,
  which is rough on a storefront. A small paid instance avoids it.
