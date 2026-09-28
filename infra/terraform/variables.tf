variable "project_id" {
  description = "GCP project to deploy into."
  type        = string
}

variable "region" {
  description = "Region for Cloud Run and Artifact Registry. us-east4 (N. Virginia) sits next to the Neon/Upstash/Aiven services in AWS us-east-1."
  type        = string
  default     = "us-east4"
}

variable "environment" {
  description = "Environment label (dev, staging, prod)."
  type        = string
  default     = "prod"
}

variable "service_name" {
  description = "Cloud Run service name; also prefixes the service account and secret ids."
  type        = string
  default     = "ims-api"
}

# --- Image -------------------------------------------------------------------

variable "image" {
  description = <<-EOT
    Full image reference for the first deploy, e.g.
    us-east4-docker.pkg.dev/<project>/ims/api:<tag>. Leave empty on the first apply — the
    Cloud Run service is only created once an image has been pushed and the secrets have
    versions. Later rollouts go through `gcloud run deploy`; Terraform ignores image drift.
  EOT
  type        = string
  default     = ""
}

variable "image_retention_count" {
  description = "Most recent image versions kept in Artifact Registry; older ones are cleaned up."
  type        = number
  default     = 10
}

# --- Runtime sizing ------------------------------------------------------------

variable "cpu" {
  description = "vCPUs per instance."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory per instance."
  type        = string
  default     = "1Gi"
}

variable "min_instances" {
  description = "Minimum instances. Keep at least 1 — the @Scheduled session auto-transition job and Kafka clients need a live instance."
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum instances. SessionAutoTransitionJob has no distributed lock, so every instance runs it; keep this low until one is added."
  type        = number
  default     = 2
}

variable "request_timeout_seconds" {
  description = "Request timeout. High because SSE streams (MCP, notifications) hold connections open."
  type        = number
  default     = 3600
}

variable "allow_unauthenticated" {
  description = "Grant allUsers run.invoker. The API does its own JWT auth, so this is normally true."
  type        = bool
  default     = true
}

# --- Application config (non-secret) ----------------------------------------

variable "spring_profiles" {
  description = "SPRING_PROFILES_ACTIVE."
  type        = string
  default     = "prod,aiven"
}

variable "database" {
  description = "Postgres connection (password lives in Secret Manager)."
  type = object({
    host = string
    port = optional(number, 5432)
    name = optional(string, "ims")
    user = string
  })
}

variable "redis" {
  description = "Redis connection (password lives in Secret Manager)."
  type = object({
    host        = string
    port        = optional(number, 6379)
    ssl_enabled = optional(bool, true)
  })
}

variable "kafka" {
  description = "Kafka connection (client certs live in Secret Manager)."
  type = object({
    bootstrap_servers = string
    replicas          = optional(number, 2)
  })
}

variable "extra_env" {
  description = "Additional plain environment variables for the api container."
  type        = map(string)
  default     = {}
}
