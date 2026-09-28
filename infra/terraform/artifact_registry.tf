resource "google_artifact_registry_repository" "ims" {
  location      = var.region
  repository_id = "ims"
  format        = "DOCKER"
  description   = "Interview management system container images"

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = var.image_retention_count
    }
  }

  cleanup_policies {
    id     = "delete-older"
    action = "DELETE"
    condition {
      tag_state = "ANY"
    }
  }
}
