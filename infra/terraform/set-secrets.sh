#!/usr/bin/env bash
# Push api secret values into Secret Manager (the secrets themselves are created by
# Terraform). Values are read from the environment first, then from an env file
# (default: repo-root .env). Aiven certs are read from infra/kafka/aiven/.
# A new version is only added when the value differs from the current latest one.
#
# Usage: infra/terraform/set-secrets.sh <project-id> [env-file]
set -euo pipefail

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

PROJECT_ID="${1:-${PROJECT_ID:-}}"
[[ -n "$PROJECT_ID" ]] || die "usage: $0 <project-id> [env-file]"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${2:-$REPO_ROOT/.env}"
CERT_DIR="${KAFKA_SSL_DIR:-$REPO_ROOT/infra/kafka/aiven}"
PREFIX="${SERVICE_NAME:-ims-api}"

# Read KEY from the environment, falling back to the env file. The file is parsed, not
# sourced, so nothing in it is executed.
read_value() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    printf '%s' "${!key}"
  elif [[ -f "$ENV_FILE" ]]; then
    grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- \
      | sed -E 's/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/'
  fi
}

# put_secret <secret-id> <file-with-value>
put_secret() {
  local id="$1" file="$2" current
  gcloud secrets describe "$id" --project "$PROJECT_ID" >/dev/null 2>&1 \
    || die "secret '$id' does not exist — run terraform apply first"
  current=$(mktemp)
  if gcloud secrets versions access latest --secret "$id" --project "$PROJECT_ID" \
       --out-file "$current" >/dev/null 2>&1 && cmp -s "$current" "$file"; then
    log "$id unchanged"
  else
    gcloud secrets versions add "$id" --project "$PROJECT_ID" --data-file "$file" >/dev/null
    log "$id updated"
  fi
  rm -f "$current"
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for pair in DATABASE_PASSWORD:database-password REDIS_PASSWORD:redis-password JWT_SECRET:jwt-secret; do
  key="${pair%%:*}"
  value=$(read_value "$key")
  [[ -n "$value" ]] || die "$key is empty — export it or set it in $ENV_FILE"
  printf '%s' "$value" >"$tmp/$key"
  put_secret "$PREFIX-${pair#*:}" "$tmp/$key"
done

for pair in service.cert:kafka-service-cert service.key:kafka-service-key ca.pem:kafka-ca-cert; do
  file="$CERT_DIR/${pair%%:*}"
  [[ -s "$file" ]] || die "missing $file"
  put_secret "$PREFIX-${pair#*:}" "$file"
done

log "Done. Running revisions pin 'latest' at start-up — redeploy to pick up changes:"
log "  gcloud run services update $PREFIX --region <region> --project $PROJECT_ID --update-labels=secrets-rotated=$(date +%s)"
