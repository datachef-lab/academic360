#!/usr/bin/env bash
#
# deploy-on-instance.sh — pull the current images from ECR and (re)start the
# stack on a single instance. Invoked by the GitHub Actions deploy via SSM Run
# Command, and by the Launch Template userdata on boot (so ASG replacements
# self-heal to the current :prod images).
#
# Env (all have sane defaults; CI overrides ECR_REGISTRY / IMAGE_TAG / RUN_MIGRATE):
#   ECR_REGISTRY  ECR registry host (default: the a360 account registry)
#   IMAGE_TAG     image tag to run (default: prod)
#   RUN_MIGRATE   "true" to run DB migrations before `up` (set on ONE instance only)
#   APP_DIR       dir holding docker-compose.yml (default: /opt/academic360/app)
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
ECR_REGISTRY="${ECR_REGISTRY:-049252392122.dkr.ecr.ap-south-1.amazonaws.com}"
IMAGE_TAG="${IMAGE_TAG:-prod}"
RUN_MIGRATE="${RUN_MIGRATE:-false}"
APP_DIR="${APP_DIR:-/opt/academic360/app}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/healthz}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Exported for docker-compose variable substitution (image: ${ECR_REGISTRY}/...:${IMAGE_TAG})
export ECR_REGISTRY IMAGE_TAG

echo "== render runtime env from SSM =="
"$SCRIPT_DIR/render-env.sh"

echo "== ECR login ($ECR_REGISTRY) =="
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "== pull images (tag: $IMAGE_TAG) =="
docker compose -f "$COMPOSE_FILE" pull

if [ "$RUN_MIGRATE" = "true" ]; then
  echo "== db:migrate (drizzle-kit, against already-built image) =="
  # The runner image lacks turbo, so we skip the package's `pnpm run build &&`
  # prefix and invoke the local drizzle-kit binary directly. Migrations + config
  # ship in the image (full workspace is COPYed into the backend runner stage).
  docker compose -f "$COMPOSE_FILE" run --rm -w /app/apps/backend backend \
    npx drizzle-kit migrate
fi

echo "== up -d =="
docker compose -f "$COMPOSE_FILE" up -d

echo "== health check ($HEALTH_URL) =="
for i in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "healthz OK (attempt $i)"
    docker image prune -f || true
    echo "deploy-on-instance: done"
    exit 0
  fi
  sleep 2
done

echo "ERROR: health check failed after ~60s" >&2
docker compose -f "$COMPOSE_FILE" ps || true
exit 1
