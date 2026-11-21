# VPS Deployment

1. Install Docker and Docker Compose on the Ubuntu VPS.
2. Point `nandi.surelm.com` DNS A record to the VPS public IP.
3. Clone this repository on the VPS.
4. Run:

```bash
cd deploy/vps
./deploy.sh
```

The script starts PostgreSQL, Qdrant, the Next.js app, and Caddy. Caddy provisions HTTPS for `nandi.surelm.com`.

To update the deployment later:

```bash
git pull
cd deploy/vps
docker compose up -d --build
```
