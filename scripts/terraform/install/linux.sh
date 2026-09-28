#!/usr/bin/env bash
# Install the Terraform CLI on Linux from the official HashiCorp release zip.
#
# Usage:
#   scripts/terraform/install/linux.sh              # latest release
#   TERRAFORM_VERSION=1.9.8 scripts/terraform/install/linux.sh
#   INSTALL_DIR=/usr/local/bin scripts/terraform/install/linux.sh
#
# INSTALL_DIR defaults to /usr/local/bin when writable (or sudo is available), else
# ~/.local/bin. The download is verified against HashiCorp's SHA256SUMS.
set -euo pipefail

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

for cmd in curl unzip sha256sum; do
  command -v "$cmd" >/dev/null || die "'$cmd' is required"
done

case "$(uname -m)" in
  x86_64 | amd64)  arch=amd64 ;;
  aarch64 | arm64) arch=arm64 ;;
  armv7l | armv6l) arch=arm ;;
  i386 | i686)     arch=386 ;;
  *) die "unsupported architecture: $(uname -m)" ;;
esac

version="${TERRAFORM_VERSION:-}"
if [[ -z "$version" ]]; then
  version=$(curl -fsSL https://checkpoint-api.hashicorp.com/v1/check/terraform \
    | sed -n 's/.*"current_version":"\([^"]*\)".*/\1/p')
  [[ -n "$version" ]] || die "could not determine the latest Terraform version; set TERRAFORM_VERSION"
fi
version="${version#v}"

if command -v terraform >/dev/null; then
  installed=$(terraform version | head -n1 | sed 's/^Terraform v//')
  if [[ "$installed" == "$version" ]]; then
    log "Terraform $version already installed at $(command -v terraform)"
    exit 0
  fi
  log "Found Terraform $installed, installing $version"
fi

use_sudo=""
if [[ -z "${INSTALL_DIR:-}" ]]; then
  if [[ -w /usr/local/bin ]]; then
    INSTALL_DIR=/usr/local/bin
  elif command -v sudo >/dev/null && sudo -n true 2>/dev/null; then
    INSTALL_DIR=/usr/local/bin
    use_sudo=sudo
  else
    INSTALL_DIR="$HOME/.local/bin"
  fi
elif [[ -d "$INSTALL_DIR" && ! -w "$INSTALL_DIR" ]]; then
  use_sudo=sudo
fi

base="https://releases.hashicorp.com/terraform/${version}"
zip="terraform_${version}_linux_${arch}.zip"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

log "Downloading Terraform $version (linux_$arch)"
curl -fsSL -o "$tmp/$zip" "$base/$zip"
curl -fsSL -o "$tmp/SHA256SUMS" "$base/terraform_${version}_SHA256SUMS"

log "Verifying checksum"
(cd "$tmp" && grep " ${zip}\$" SHA256SUMS | sha256sum -c --quiet -) || die "checksum mismatch for $zip"

unzip -q -o "$tmp/$zip" terraform -d "$tmp"
$use_sudo mkdir -p "$INSTALL_DIR"
$use_sudo install -m 0755 "$tmp/terraform" "$INSTALL_DIR/terraform"

log "Installed $("$INSTALL_DIR/terraform" version | head -n1) to $INSTALL_DIR/terraform"
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *) log "Add $INSTALL_DIR to your PATH, e.g.: echo 'export PATH=\"$INSTALL_DIR:\$PATH\"' >> ~/.bashrc" ;;
esac
