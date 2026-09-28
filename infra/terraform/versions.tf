terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0, < 8.0"
    }
  }

  # Partial config — bucket/prefix come from backend.hcl, which bootstrap.sh writes:
  #   terraform init -backend-config=backend.hcl
  backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region

  default_labels = {
    app         = "ims"
    environment = var.environment
    managed-by  = "terraform"
  }
}
