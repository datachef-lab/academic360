#!/usr/bin/env bash
#
# render-env.sh — materialise the per-app runtime env files on an instance from
# AWS SSM Parameter Store, decrypted via the instance's IAM role.
#
# Source of truth: SSM Parameter Store under $SSM_PREFIX (default /a360/prod).
# One sub-path per env file:
#   $SSM_PREFIX/backend/*          -> $ENV_DIR/backend.env
#   $SSM_PREFIX/student-console/*  -> $ENV_DIR/student-console.env
#   $SSM_PREFIX/notification/*     -> $ENV_DIR/notification.env
# (main-console has no runtime env file — its config is baked at build time.)
#
# A parameter named  /a360/prod/backend/DATABASE_URL  becomes the line
# DATABASE_URL=<value>  in backend.env. SecureString params are decrypted.
#
# Run by both the SSM deploy command and the Launch Template userdata, so new
# ASG instances converge to the same config on boot. No secret ever lives in
# GitHub or on disk in plaintext beyond these 0600 files.
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
SSM_PREFIX="${SSM_PREFIX:-/a360/prod}"
ENV_DIR="${ENV_DIR:-/opt/academic360/env}"

# group (SSM sub-path) : output env filename
GROUPS=(
  "backend:backend.env"
  "student-console:student-console.env"
  "notification:notification.env"
)

mkdir -p "$ENV_DIR"

render_group() {
  local group="$1" outfile="$2"
  local path="$SSM_PREFIX/$group"
  local tmp
  tmp="$(mktemp)"

  # AWS CLI v2 auto-paginates get-parameters-by-path. Name<TAB>Value per line.
  # Values are single-line (env values); tabs/newlines inside a value are not
  # supported by --output text and are not expected for this config set.
  aws ssm get-parameters-by-path \
    --region "$REGION" \
    --path "$path" \
    --recursive \
    --with-decryption \
    --query 'Parameters[].[Name,Value]' \
    --output text \
  | while IFS=$'\t' read -r name value; do
      [ -z "$name" ] && continue
      printf '%s=%s\n' "${name#"$path"/}" "$value" >> "$tmp"
    done

  if [ ! -s "$tmp" ]; then
    echo "WARN: no parameters under $path — leaving $ENV_DIR/$outfile untouched" >&2
    rm -f "$tmp"
    return 0
  fi

  install -m 600 "$tmp" "$ENV_DIR/$outfile"
  rm -f "$tmp"
  echo "rendered $ENV_DIR/$outfile ($(wc -l < "$ENV_DIR/$outfile") keys)"
}

for entry in "${GROUPS[@]}"; do
  render_group "${entry%%:*}" "${entry#*:}"
done

echo "render-env: done"
