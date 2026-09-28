output "image_repository" {
  description = "Push api images here, e.g. <repo>/api:<tag>."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ims.repository_id}"
}

output "service_account_email" {
  value = google_service_account.api.email
}

output "secret_ids" {
  description = "Secret Manager secrets set-secrets.sh fills in."
  value       = sort(local.all_secret_ids)
}

output "service_url" {
  value = one(google_cloud_run_v2_service.api[*].uri)
}
