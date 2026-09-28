resource "google_service_account" "api" {
  account_id   = var.service_name
  display_name = "IMS API (Cloud Run runtime)"
}

resource "google_project_iam_member" "api" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/cloudtrace.agent",
  ])

  project = var.project_id
  role    = each.value
  member  = google_service_account.api.member
}

# Scoped per secret rather than project-wide secretAccessor.
resource "google_secret_manager_secret_iam_member" "api" {
  for_each = google_secret_manager_secret.api

  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.api.member
}
