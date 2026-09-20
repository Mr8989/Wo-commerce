# Deploying to a Hostinger VPS

Target: `croppedbyayerkie.com`, Ubuntu-based Hostinger VPS (KVM) with root/SSH access.

## 0. Provision the VPS

1. Buy a Hostinger **VPS (KVM)** plan (not the shared/Cloud Startup hosting plans — those don't support Postgres) and note the server's public IP address. Pick an Ubuntu OS image during setup (e.g. Ubuntu 24.04) in hPanel's VPS OS selector.
2. In Hostinger's DNS settings for `croppedbyayerkie.com` (hPanel → Domains → DNS Zone), point the `A` record (and `www`) at that IP.
3. SSH in as root to confirm access: `ssh root@<server-ip>` (Hostinger shows the root password in hPanel under the VPS's "Overview" tab).

## 1. Initial server setup

```bash
adduser deploy
usermod -aG sudo deploy
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```
Log out and back in as `deploy` from here on.

## 2. Install packages

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip \
    postgresql postgresql-contrib nginx certbot python3-certbot-nginx \
    nodejs npm git
```

## 3. PostgreSQL

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE ayerkie_prod;
CREATE ROLE ayerkie_prod WITH LOGIN PASSWORD 'use-a-strong-random-password';
ALTER SCHEMA public OWNER TO ayerkie_prod;
GRANT ALL PRIVILEGES ON DATABASE ayerkie_prod TO ayerkie_prod;
\q
```
(The `ALTER SCHEMA public OWNER TO` step matters — without it, Django's `migrate` will fail with "permission denied for schema public" on Postgres 15+.)

## 4. Get the code onto the server

```bash
sudo mkdir -p /var/www/croppedbyayerkie
sudo chown deploy:deploy /var/www/croppedbyayerkie
git clone <your-repo-url> /var/www/croppedbyayerkie
cd /var/www/croppedbyayerkie
```

## 5. Backend setup

```bash
cd /var/www/croppedbyayerkie/backend
python3.12 -m venv venv
./venv/bin/pip install -r requirements.txt

cp .env.production.example .env
nano .env   # fill in DATABASE_PASSWORD, SECRET_KEY, EMAIL_*, AFRICAS_TALKING_*, etc.
```
Generate a real `SECRET_KEY`:
```bash
./venv/bin/python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Then apply migrations and collect static files:
```bash
./venv/bin/python manage.py migrate
./venv/bin/python manage.py collectstatic --noinput
./venv/bin/python manage.py createsuperuser   # optional: Django admin superuser
```

## 6. Gunicorn (systemd)

```bash
sudo cp deploy/gunicorn.service /etc/systemd/system/croppedbyayerkie.service
sudo chown -R www-data:www-data /var/www/croppedbyayerkie/backend/media /var/www/croppedbyayerkie/backend/staticfiles
sudo systemctl daemon-reload
sudo systemctl enable --now croppedbyayerkie
sudo systemctl status croppedbyayerkie   # should show "active (running)"
```

### 6a. Crash email alerts

`deploy/gunicorn.service` already has `OnFailure=croppedbyayerkie-alert.service` wired in, so when the app crashes systemd fires off an email automatically using the same Gmail credentials already in `.env` (`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`), sent to `ADMIN_EMAIL`.

```bash
sudo cp deploy/croppedbyayerkie-alert.service /etc/systemd/system/
sudo systemctl daemon-reload
```

Test it fires correctly:
```bash
sudo systemctl kill -s SIGKILL croppedbyayerkie
# wait a few seconds for gunicorn's restart attempts to be exhausted, then check your inbox
sudo systemctl status croppedbyayerkie
```

(Optional) get the same alert if nginx or Postgres itself goes down:
```bash
sudo systemctl edit nginx
# add: OnFailure=croppedbyayerkie-alert.service
sudo systemctl edit postgresql
# add: OnFailure=croppedbyayerkie-alert.service
sudo systemctl daemon-reload
```

### 6b. External uptime monitoring (recommended, no server changes)

A per-service alert only fires if systemd notices that exact service fail — it won't catch the VPS itself losing power/network, DNS breaking, or your SSL certificate silently expiring. For that, add a free [UptimeRobot](https://uptimerobot.com) monitor (or similar — Better Uptime, Pingdom, etc. are alternatives):

1. Create a free account, add an **HTTP(s)** monitor for `https://croppedbyayerkie.com`, checked every 5 minutes.
2. Add a second monitor for `https://croppedbyayerkie.com/api/products/` so you're alerted if the API breaks even while the static frontend still loads.
3. Turn on **SSL certificate expiry** alerts if offered — catches you forgetting to renew before certbot's auto-renewal (step 7) does its job.
4. Point alerts at your email (and optionally SMS/phone push via their app).

## 7. nginx + HTTPS

```bash
sudo cp deploy/nginx_croppedbyayerkie.conf /etc/nginx/sites-available/croppedbyayerkie
sudo ln -s /etc/nginx/sites-available/croppedbyayerkie /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d croppedbyayerkie.com -d www.croppedbyayerkie.com
```
Certbot rewrites the nginx config to add the HTTPS server block and redirect. Confirm auto-renewal is scheduled: `sudo systemctl status certbot.timer`.

## 8. Frontend

Build locally or on the server:
```bash
cd /var/www/croppedbyayerkie/frontend
npm install
npm run build
```
This reads `frontend/.env.production` (already set to `VITE_API_URL=/api`, since nginx serves the frontend and proxies `/api/` on the same domain — no CORS needed). Output lands in `frontend/dist`, which the nginx config already points to.

## 9. Verify

- `https://croppedbyayerkie.com` loads the storefront.
- `https://croppedbyayerkie.com/api/products/` returns JSON.
- `https://croppedbyayerkie.com/admin/` loads the Django admin login.
- Admin dashboard login (`/admin-login` on the frontend) works end-to-end and stays logged in after a refresh.
- `sudo journalctl -u croppedbyayerkie -f` shows no errors under normal use.

## Redeploying after code changes

```bash
cd /var/www/croppedbyayerkie
git pull
cd backend && ./venv/bin/pip install -r requirements.txt && ./venv/bin/python manage.py migrate && ./venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart croppedbyayerkie
cd ../frontend && npm install && npm run build
```
