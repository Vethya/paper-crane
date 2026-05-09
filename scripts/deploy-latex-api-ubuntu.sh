#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Deploy latex-api on an Ubuntu server with Docker and Caddy HTTPS.

Run from the repository root on the server:

  sudo DOMAIN=latex.example.com \
    ACME_EMAIL=you@example.com \
    ALLOWED_ORIGIN=https://your-app.example.com \
    bash scripts/deploy-latex-api-ubuntu.sh

Required env:
  DOMAIN          Public DNS name pointing at this server.
  ACME_EMAIL      Email for Let's Encrypt notices.
  ALLOWED_ORIGIN  Browser origin allowed to call /compile.

Optional env:
  LATEX_API_MEMORY_LIMIT    Docker memory limit. Default: 1536m.
  LATEX_API_CPUS            Docker CPU limit. Default: 1.5.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env: $name" >&2
    usage >&2
    exit 1
  fi
}

require_env DOMAIN
require_env ACME_EMAIL
require_env ALLOWED_ORIGIN

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo/root so it can install packages and start containers." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/latex-api/deploy"
ENV_FILE="$DEPLOY_DIR/.env.production"
LATEX_API_MEMORY_LIMIT="${LATEX_API_MEMORY_LIMIT:-1536m}"
LATEX_API_CPUS="${LATEX_API_CPUS:-1.5}"

if [[ ! -f "$REPO_ROOT/latex-api/Dockerfile" ]]; then
  echo "Could not find latex-api/Dockerfile. Run this from the resume-manager repository." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "Checking required packages..."
apt-get update
apt-get install -y ca-certificates curl gnupg

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is missing; installing Docker Engine..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is missing; installing it..."
  apt-get update
  apt-get install -y docker-compose-plugin
else
  echo "Docker Compose already installed: $(docker compose version)"
fi

systemctl enable --now docker

echo "Writing production environment..."
cat > "$ENV_FILE" <<EOF
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL
ALLOWED_ORIGIN=$ALLOWED_ORIGIN
LATEX_API_MEMORY_LIMIT=$LATEX_API_MEMORY_LIMIT
LATEX_API_CPUS=$LATEX_API_CPUS
EOF
chmod 600 "$ENV_FILE"

if command -v ufw >/dev/null 2>&1; then
  if ufw status | grep -q "Status: active"; then
    echo "UFW is active; allowing HTTP/HTTPS if missing..."
    ufw allow 80/tcp
    ufw allow 443/tcp
  else
    echo "UFW is installed but inactive; leaving it inactive."
  fi
else
  echo "UFW is not installed; leaving host firewall unchanged."
fi

echo "Building and starting latex-api..."
docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/docker-compose.prod.yml" up -d --build

echo "Waiting for health check..."
for _ in $(seq 1 30); do
  if curl -fsS "https://$DOMAIN/health" >/dev/null 2>&1; then
    echo "latex-api is live at https://$DOMAIN"
    exit 0
  fi
  sleep 3
done

echo "Started containers, but health check did not pass yet."
echo "Check logs with:"
echo "  docker compose --env-file $ENV_FILE -f $DEPLOY_DIR/docker-compose.prod.yml logs -f"
exit 1
