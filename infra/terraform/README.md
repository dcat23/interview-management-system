# GCP infrastructure (Cloud Run)

Deploys the Spring Boot api to Cloud Run. Supersedes the AWS/ECS layout in
`docs/deployment.md` for the backend. Postgres (Neon), Redis (Upstash) and Kafka (Aiven)
stay external; this stack only owns what runs in GCP.

| File                   | Creates                                                                         |
|------------------------|---------------------------------------------------------------------------------|
| `artifact_registry.tf` | `ims` Docker repo, keeps the newest `image_retention_count` versions            |
| `secrets.tf`           | Secret Manager secrets (containers only — values via `set-secrets.sh`)          |
| `iam.tf`               | `ims-api` runtime service account, per-secret accessor, log/metric/trace writer |
| `cloud_run.tf`         | `ims-api` Cloud Run v2 service + public invoker binding                         |

Not managed here: API enablement and the state bucket (`bootstrap.sh`), secret values
(`set-secrets.sh`), image rollouts (`gcloud run deploy`).

## Prerequisites

- `gcloud` CLI (`scripts/gcloud/install/linux.sh`), logged in as a project Owner, billing linked to the project
- Terraform ≥ 1.6 — `scripts/terraform/install/linux.sh`
- Docker (to build/push the api image)

## First deploy

```bash
# 1. APIs, state bucket, backend.hcl, docker auth
infra/terraform/bootstrap.sh <project-id> us-east4 prod
gcloud auth application-default login

# 2. Registry, secrets, service account (image left empty → no Cloud Run service yet)
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in project + hosts
terraform init -backend-config=backend.hcl
terraform apply

# 3. Secret values: DATABASE_PASSWORD / REDIS_PASSWORD / JWT_SECRET from env or ../../.env,
#    Aiven certs from ../kafka/aiven/
./set-secrets.sh <project-id>

# 4. Build and push the image
REPO=$(terraform output -raw image_repository)
TAG=$(git rev-parse --short HEAD)
docker build -t "$REPO/api:$TAG" ../../backend/api
docker push "$REPO/api:$TAG"

# 5. Set image = "<REPO>/api:<TAG>" in terraform.tfvars, then
terraform apply
curl -f "$(terraform output -raw service_url)/actuator/health"
```

## Subsequent releases

Terraform ignores image drift on the service, so ship new images with gcloud:

```bash
docker build -t "$REPO/api:$TAG" backend/api && docker push "$REPO/api:$TAG"
gcloud run deploy ims-api --image "$REPO/api:$TAG" --region us-east4
```

Flyway migrates on boot; the startup probe allows ~3 minutes before a revision is failed,
and traffic only shifts once `/actuator/health/readiness` passes. Roll back with
`gcloud run services update-traffic ims-api --to-revisions <previous>=100 --region us-east4`.

## Runtime notes

- **Region** defaults to `us-east4`, next to the AWS us-east-1 Neon/Upstash/Aiven endpoints.
- **Always-on CPU, min 1 instance** — `SessionAutoTransitionJob` (`@Scheduled`) and SSE
  streams need CPU outside of requests. `max_instances` defaults to 2 because the job has no
  distributed lock and runs on every instance; add ShedLock before scaling out further.
- **Request timeout 3600s** with session affinity, for the MCP and notification SSE streams.
- **Kafka certs** are mounted from Secret Manager at `/secrets/<name>/…`; each path is passed
  via `KAFKA_SSL_CERT` / `KAFKA_SSL_KEY` / `KAFKA_SSL_CA` (see `application-aiven.yaml`).
- **Secrets** resolve to `latest` when a revision starts. After `set-secrets.sh` changes a
  value, deploy a new revision to pick it up.
- **Observability** — `application-prod.yaml` expects an OTLP collector sidecar on
  localhost (the ECS/ADOT design). None exists on Cloud Run yet, so OTLP export is disabled
  via env; logs go to Cloud Logging from stdout. A Google OTel collector sidecar exporting to
  Cloud Trace/Monitoring is the follow-up.
- **`seed-data`** is not in the prod profile list; seed users must be created some other way.
