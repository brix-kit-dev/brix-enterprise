#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_DIR="${ENTERPRISE_ROOT}/packages/@brix/enterprise-host/host-shell-standalone"
DEV_SMTP=false
REMOVE_VOLUMES=false
YES=false
DRY_RUN=false
PROFILE="full"
LOCAL_JWT_OVERLAY="docker-compose.local-jwt.yml"

usage() {
  cat <<'EOF'
========================================================================
                    Brix Docker Stop for Ubuntu
========================================================================

Usage:
  ./scripts/docker-stop.sh [options]

Options:
  --compose-dir DIR         Docker compose directory.
  --dev-smtp                Include docker-compose.dev-smtp.yml Mailpit SMTP overlay.
  --remove-volumes          Remove compose volumes too. Database/cache data will be lost.
  --yes, -y                 Skip confirmation for --remove-volumes.
  --profile full            Compose profile to include when stopping. Default: full.
  --no-profile              Stop without passing a compose profile.
  --dry-run                 Print commands without changing containers.
  --help, -h                Show this help.

PowerShell-style options are also accepted:
  -DevSmtp -RemoveVolumes

Examples:
  ./scripts/docker-stop.sh
  ./scripts/docker-stop.sh --dev-smtp
  ./scripts/docker-stop.sh --remove-volumes
  ./scripts/docker-stop.sh --remove-volumes --yes

Warning:
  --remove-volumes deletes persisted Docker volumes, including PostgreSQL data.

========================================================================
EOF
}

header() {
  printf '\n========================================================================\n'
  printf '  %s\n' "$1"
  printf '========================================================================\n\n'
}

step() { printf '[STEP] %s\n' "$1"; }
info() { printf '[INFO] %s\n' "$1"; }
success() { printf '[ OK ] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; }

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --compose-dir)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        COMPOSE_DIR="$2"
        shift 2
        ;;
      --dev-smtp|-DevSmtp)
        DEV_SMTP=true
        shift
        ;;
      --remove-volumes|-RemoveVolumes)
        REMOVE_VOLUMES=true
        shift
        ;;
      --yes|-y|-Yes|-yes)
        YES=true
        shift
        ;;
      --profile|-Profile)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        if [[ "$2" != "full" && -n "$2" ]]; then
          fail "Invalid profile: $2. Supported value: full"
          exit 2
        fi
        PROFILE="$2"
        shift 2
        ;;
      --no-profile)
        PROFILE=""
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --help|-h|-Help|-help)
        usage
        exit 0
        ;;
      *)
        fail "Unknown option: $1"
        usage
        exit 2
        ;;
    esac
  done
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

compose_args() {
  printf '%s\0%s\0' -f docker-compose.yml
  if [[ "$DEV_SMTP" == "true" ]]; then
    printf '%s\0%s\0' -f docker-compose.dev-smtp.yml
  fi
  if [[ -f "$LOCAL_JWT_OVERLAY" ]]; then
    printf '%s\0%s\0' -f "$LOCAL_JWT_OVERLAY"
  fi
}

profile_args() {
  if [[ -n "$PROFILE" ]]; then
    printf '%s\0%s\0' --profile "$PROFILE"
  fi
}

load_compose_args() {
  COMPOSE_FILES=()
  PROFILE_ARGS=()
  while IFS= read -r -d '' item; do
    COMPOSE_FILES+=("$item")
  done < <(compose_args)
  while IFS= read -r -d '' item; do
    PROFILE_ARGS+=("$item")
  done < <(profile_args)
}

print_cmd() {
  printf '+ cd %q\n' "$COMPOSE_DIR"
  printf '+ docker compose'
  local arg
  for arg in "${COMPOSE_FILES[@]}" "${PROFILE_ARGS[@]}" "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
}

run_compose() {
  if [[ "$DRY_RUN" == "true" ]]; then
    print_cmd "$@"
  else
    docker compose "${COMPOSE_FILES[@]}" "${PROFILE_ARGS[@]}" "$@"
  fi
}

check_prerequisites() {
  step "Checking prerequisites..."

  if ! command_exists docker; then
    fail "docker not found. Please install Docker Engine."
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    fail "docker compose plugin not available."
    exit 1
  fi

  if [[ ! -d "$COMPOSE_DIR" ]]; then
    fail "Compose directory not found: $COMPOSE_DIR"
    exit 1
  fi

  cd "$COMPOSE_DIR"

  [[ -f docker-compose.yml ]] || { fail "docker-compose.yml not found in $COMPOSE_DIR"; exit 1; }
  if [[ "$DEV_SMTP" == "true" && ! -f docker-compose.dev-smtp.yml ]]; then
    fail "docker-compose.dev-smtp.yml not found in $COMPOSE_DIR"
    exit 1
  fi

  success "Prerequisites OK"
}

confirm_remove_volumes() {
  [[ "$REMOVE_VOLUMES" == "true" ]] || return 0
  [[ "$DRY_RUN" == "true" ]] && return 0
  [[ "$YES" == "true" ]] && return 0

  printf '[WARN] --remove-volumes will delete persisted Docker volumes, including PostgreSQL data.\n' >&2
  printf 'Type y to continue: ' >&2
  local answer
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    info "Cancelled."
    exit 0
  fi
}

stop_containers() {
  step "Stopping Docker containers..."

  local down_args=(down)
  if [[ "$REMOVE_VOLUMES" == "true" ]]; then
    down_args+=(-v)
  fi

  run_compose "${down_args[@]}"
  success "Docker containers stopped"
}

show_status() {
  [[ "$DRY_RUN" == "true" ]] && { info "Dry run: skipping container status."; return 0; }

  step "Container status after stop..."
  run_compose ps
}

print_summary() {
  header "Docker Stop Complete"
  info "Compose dir: $COMPOSE_DIR"
  info "Profile: ${PROFILE:-none}"
  info "Dev SMTP overlay: $DEV_SMTP"
  info "Volumes removed: $REMOVE_VOLUMES"
}

main() {
  parse_args "$@"

  header "Brix Docker Stop v$VERSION"
  info "Compose dir: $COMPOSE_DIR"
  info "Profile: ${PROFILE:-none}"
  info "Dev SMTP overlay: $DEV_SMTP"
  info "Remove volumes: $REMOVE_VOLUMES"

  check_prerequisites
  load_compose_args
  confirm_remove_volumes
  stop_containers
  show_status
  print_summary
}

main "$@"
