resource "google_cloud_run_v2_service" "api" {
  # Created only once an image exists and the secrets have versions — see var.image.
  count = var.image == "" ? 0 : 1

  name                = var.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.environment == "prod"

  template {
    service_account                  = google_service_account.api.email
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"
    timeout                          = "${var.request_timeout_seconds}s"
    session_affinity                 = true
    max_instance_request_concurrency = 80

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      name  = "api"
      image = var.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        # Instance-based billing: CPU stays allocated between requests so @Scheduled jobs,
        # Kafka producer retries and open SSE streams keep running.
        cpu_idle          = false
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = local.plain_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.env_secrets
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.api[env.value].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "volume_mounts" {
        for_each = local.file_secrets
        content {
          name       = volume_mounts.key
          mount_path = "/secrets/${volume_mounts.key}"
        }
      }

      # Flyway runs on boot, so give startup a generous window before failing the revision.
      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 5
        timeout_seconds       = 3
        failure_threshold     = 36
        http_get {
          path = "/actuator/health/readiness"
        }
      }

      liveness_probe {
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
        http_get {
          path = "/actuator/health/liveness"
        }
      }
    }

    dynamic "volumes" {
      for_each = local.file_secrets
      content {
        name = volumes.key
        secret {
          secret = google_secret_manager_secret.api[volumes.value.secret_id].secret_id
          items {
            version = "latest"
            path    = volumes.value.file
            mode    = 0400
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    # Image rollouts are done by `gcloud run deploy` (CI or by hand), not Terraform.
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_secret_manager_secret_iam_member.api,
    google_project_iam_member.api,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.image != "" && var.allow_unauthenticated ? 1 : 0

  name     = google_cloud_run_v2_service.api[0].name
  location = google_cloud_run_v2_service.api[0].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
