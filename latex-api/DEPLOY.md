# latex-api Production Deploy

This deploy runs `latex-api` with Docker Compose behind a Caddy reverse proxy.
Caddy handles HTTPS certificate issuance and renewal automatically.

## DNS

In Cloudflare, create:

- Type: `A`
- Name: `latex-api`
- IPv4 address: your Hetzner server IP
- Proxy status: DNS only for the first deploy

After the first successful deploy, Cloudflare proxying is optional. If you enable it, use SSL/TLS mode `Full (strict)`.

## Deploy

SSH into the server, clone or pull this repo, then run the deploy script from the repo root:

```bash
sudo DOMAIN=latex-api.vethya.com \
  ACME_EMAIL=you@example.com \
  ALLOWED_ORIGIN=https://your-app.example.com \
  bash scripts/deploy-latex-api-ubuntu.sh
```

The script:

- Installs Docker only if Docker is missing.
- Installs the Docker Compose plugin only if Compose is missing.
- Starts Docker if needed.
- Writes `latex-api/deploy/.env.production`.
- Starts `latex-api` and Caddy with Docker Compose.
- If UFW is active, allows only missing `80/tcp` and `443/tcp` rules.
- If UFW is inactive or missing, leaves the host firewall unchanged.

The script does not change Vercel and does not modify Cloudflare.

Separately, update the frontend environment variable in Vercel:

```bash
NEXT_PUBLIC_LATEX_API_URL=https://latex-api.vethya.com
```

## Updating

SSH into the server, pull the latest code, then run:

```bash
sudo DOMAIN=latex-api.vethya.com \
  ACME_EMAIL=you@example.com \
  ALLOWED_ORIGIN=https://your-app.example.com \
  bash scripts/deploy-latex-api-ubuntu.sh
```

## Logs

```bash
sudo docker compose \
  --env-file latex-api/deploy/.env.production \
  -f latex-api/deploy/docker-compose.prod.yml \
  logs -f
```

## Notes

- `ALLOWED_ORIGIN` should be the exact frontend origin, not `*`, for production.
- The API is intentionally only exposed through Caddy on ports 80 and 443.
- The Node service listens on port `3027` only inside the Docker network.
- Caddy stores certificates in the `caddy_data` Docker volume and renews them automatically.
