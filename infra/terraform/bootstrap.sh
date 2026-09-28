#!/usr/bin/env bash
# One-time GCP project setup that Terraform itself depends on:
#   - enables the required service APIs
#   - creates the GCS bucket holding Terraform state (versioned, private)
#   - writes backend.hcl for `terraform init`
#   - configures Docker auth for Artifact Registry
#
# Safe to re-run. Requires gcloud, logged in as a user with Owner (or equivalent) on the project.
#
# Usage: infra/terraform/bootstrap.sh <project-id> [region] [environment]
set -euo pipefail

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

PROJECT_ID="${1:-${PROJECT_ID:-}}"
REGION="${2:-${REGION:-us-east4}}"
ENVIRONMENT="${3:-${ENVIRONMENT:-prod}}"
[[ -n "$PROJECT_ID" ]] || die "usage: $0 <project-id> [region] [environment]"

STATE_BUCKET="${STATE_BUCKET:-${PROJECT_ID}-tfstate}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICES=(
  serviceusage.googleapis.com
  cloudresourcemanager.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  sts.googleapis.com
  storage.googleapis.com
  run.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com
  cloudtrace.googleapis.com
)

command -v gcloud >/dev/null || die "gcloud CLI not found — run scripts/gcloud/install/linux.sh"
[[ -n "$(gcloud auth list --filter=status:ACTIVE --format='value(account)')" ]] \
  || die "no active gcloud account — run: gcloud auth login"

gcloud projects describe "$PROJECT_ID" --format='value(projectId)' >/dev/null \
  || die "project '$PROJECT_ID' not found or not accessible"

log "Setting active project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID" --quiet >/dev/null

log "Enabling APIs (this can take a minute; billing must be linked)"
gcloud services enable "${SERVICES[@]}" --project "$PROJECT_ID"

if gcloud storage buckets describe "gs://$STATE_BUCKET" --project "$PROJECT_ID" >/dev/null 2>&1; then
  log "State bucket gs://$STATE_BUCKET already exists"
else
  log "Creating state bucket gs://$STATE_BUCKET"
  gcloud storage buckets create "gs://$STATE_BUCKET" \
    --project "$PROJECT_ID" \
    --location "$REGION" \
    --uniform-bucket-level-access \
    --public-access-prevention
fi
gcloud storage buckets update "gs://$STATE_BUCKET" --versioning >/dev/null

log "Writing $SCRIPT_DIR/backend.hcl"
cat >"$SCRIPT_DIR/backend.hcl" <<EOF
bucket = "$STATE_BUCKET"
prefix = "ims/$ENVIRONMENT"
EOF

log "Configuring Docker auth for ${REGION}-docker.pkg.dev"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet >/dev/null

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  log "No application-default credentials — Terraform needs them: gcloud auth application-default login"
fi

command -v terraform >/dev/null \
  || log "Terraform not installed — run scripts/terraform/install/linux.sh"

cat <<EOF

Bootstrap complete. Next:
  cd infra/terraform
  cp terraform.tfvars.example terraform.tfvars   # fill in project_id=$PROJECT_ID, region=$REGION, hosts
  terraform init -backend-config=backend.hcl
  terraform apply                                 # registry, secrets, service account
  ./set-secrets.sh $PROJECT_ID                    # push secret values
  # build + push the image, set var.image, terraform apply again (see README.md)
EOF
