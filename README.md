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

Deployment: [DEPLOYMENT-NODE.md](DEPLOYMENT-NODE.md). The Django instructions in
[DEPLOYMENT.md](DEPLOYMENT.md) apply only to `backend/`.
