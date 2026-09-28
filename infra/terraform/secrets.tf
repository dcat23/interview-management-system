resource "google_secret_manager_secret" "api" {
  for_each = toset(local.all_secret_ids)

  secret_id = each.value

  replication {
    auto {}
  }
}
