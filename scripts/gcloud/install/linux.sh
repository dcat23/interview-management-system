#!/usr/bin/env bash
# Install the Google Cloud CLI (gcloud, gsutil, bq) on Linux from Google's release archive.
#
# Usage:
#   scripts/gcloud/install/linux.sh                  # latest release
#   GCLOUD_VERSION=540.0.0 scripts/gcloud/install/linux.sh
#   GCLOUD_COMPONENTS="beta" scripts/gcloud/install/linux.sh
#   INSTALL_ROOT=/opt BIN_DIR=/usr/local/bin scripts/gcloud/install/linux.sh
#
# The SDK is unpacked to $INSTALL_ROOT/google-cloud-sdk and its binaries symlinked into
# $BIN_DIR. Defaults: /usr/local/lib + /usr/local/bin when writable (or passwordless sudo is
# available), else ~/.local/share + ~/.local/bin. Re-running with the same version is a no-op.
set -euo pipefail

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

for cmd in curl tar; do
  command -v "$cmd" >/dev/null || die "'$cmd' is required"
done

case "$(uname -m)" in
  x86_64 | amd64)  arch=x86_64 ;;
  aarch64 | arm64) arch=arm ;;
  i386 | i686)     arch=x86 ;;
  *) die "unsupported architecture: $(uname -m)" ;;
esac

version="${GCLOUD_VERSION:-}"
if command -v gcloud >/dev/null; then
  installed=$(gcloud version --format='value("Google Cloud SDK")' 2>/dev/null || true)
  if [[ -z "$version" || "$version" == "$installed" ]]; then
    log "gcloud $installed already installed at $(command -v gcloud)"
    log "Update with: gcloud components update"
    exit 0
  fi
  log "Found gcloud $installed, installing $version"
fi

use_sudo=""
if [[ -z "${INSTALL_ROOT:-}" && -z "${BIN_DIR:-}" ]]; then
  if [[ -w /usr/local/bin && -w /usr/local/lib ]]; then
    INSTALL_ROOT=/usr/local/lib BIN_DIR=/usr/local/bin
  elif command -v sudo >/dev/null && sudo -n true 2>/dev/null; then
    INSTALL_ROOT=/usr/local/lib BIN_DIR=/usr/local/bin use_sudo=sudo
  else
    INSTALL_ROOT="$HOME/.local/share" BIN_DIR="$HOME/.local/bin"
  fi
fi
INSTALL_ROOT="${INSTALL_ROOT:-$HOME/.local/share}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
for dir in "$INSTALL_ROOT" "$BIN_DIR"; do
  [[ -d "$dir" && ! -w "$dir" ]] && use_sudo=sudo
done

base="https://dl.google.com/dl/cloudsdk/channels/rapid/downloads"
archive="google-cloud-cli${version:+-$version}-linux-${arch}.tar.gz"
sdk_dir="$INSTALL_ROOT/google-cloud-sdk"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

log "Downloading ${archive}"
curl -fSL --progress-bar -o "$tmp/$archive" "$base/$archive" \
  || die "download failed — check GCLOUD_VERSION (see https://cloud.google.com/sdk/docs/release-notes)"
tar -xzf "$tmp/$archive" -C "$tmp"

log "Installing to $sdk_dir"
$use_sudo mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
$use_sudo rm -rf "$sdk_dir"
$use_sudo mv "$tmp/google-cloud-sdk" "$sdk_dir"

# Non-interactive: no rc-file edits (we symlink instead), no prompts, no usage reporting.
$use_sudo "$sdk_dir/install.sh" \
  --quiet \
  --usage-reporting=false \
  --path-update=false \
  --command-completion=false \
  ${GCLOUD_COMPONENTS:+--additional-components $GCLOUD_COMPONENTS} \
  >/dev/null

for bin in gcloud gsutil bq docker-credential-gcloud; do
  [[ -e "$sdk_dir/bin/$bin" ]] && $use_sudo ln -sf "$sdk_dir/bin/$bin" "$BIN_DIR/$bin"
done

log "Installed gcloud $("$BIN_DIR/gcloud" version --format='value("Google Cloud SDK")') ($BIN_DIR/gcloud)"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) log "Add $BIN_DIR to your PATH, e.g.: echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.bashrc" ;;
esac
log "Next: gcloud auth login && gcloud auth application-default login"
