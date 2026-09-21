# Cropped By Ayerkie

E-commerce storefront for a women's fashion label, with an admin dashboard for
products, categories and orders.

| Directory | What it is |
| --- | --- |
| `frontend/` | React 18 + Vite storefront and admin dashboard |
| `backend-node/` | Express + Prisma API on Postgres — see [its README](backend-node/README.md) |
| `backend/` | The previous Django/DRF API, kept until the Node cutover is confirmed |
| `deploy/` | systemd units and the nginx site config |

Local setup: `./setup.sh`

Deployment: [DEPLOYMENT-FREE.md](DEPLOYMENT-FREE.md) for the free hosted setup
(Neon + Render + Vercel + Cloudinary), or [DEPLOYMENT-NODE.md](DEPLOYMENT-NODE.md)
for a Hostinger VPS. The Django instructions in [DEPLOYMENT.md](DEPLOYMENT.md)
apply only to the old `backend/`.
