#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_DIR="${ENTERPRISE_ROOT}/packages/@brix/enterprise-host/host-shell-standalone"
DEV_SMTP=false
PROFILE=""
WAIT_SECONDS=10
SKIP_HEALTH_CHECK=false
APP_URL="http://localhost:8081"
DRY_RUN=false
NO_BUILD=false
FORCE_RECREATE=true
LOCAL_JWT_OVERLAY="docker-compose.local-jwt.yml"

usage() {
  cat <<'EOF'
========================================================================
                    Brix Docker Start for Ubuntu
========================================================================

Usage:
  ./scripts/docker-start.sh [options]

Options:
  --compose-dir DIR         Docker compose directory.
  --dev-smtp                Enable docker-compose.dev-smtp.yml Mailpit SMTP overlay.
  --profile full            Start compose services with profile full.
  --wait-seconds SECONDS    Seconds to wait before status/health checks. Default: 10.
  --skip-health-check       Skip HTTP health check after startup.
  --app-url URL             Health check base URL. Default: http://localhost:8081.
  --no-build                Start containers without rebuilding images.
  --no-force-recreate       Do not pass --force-recreate to docker compose up.
  --dry-run                 Print commands without changing containers.
  --help, -h                Show this help.

PowerShell-style options are also accepted:
  -DevSmtp -Profile full

Examples:
  ./scripts/docker-start.sh
  ./scripts/docker-start.sh --dev-smtp
  ./scripts/docker-start.sh --profile full
  ./scripts/docker-start.sh --dev-smtp --app-url http://84.247.154.52:8081

SMTP behavior:
  - Without --dev-smtp, .env must configure setup-link notification delivery:
      SPRING_MAIL_HOST + BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM
    or set BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED=true.
  - With --dev-smtp, Mailpit is started and the app receives:
      SPRING_MAIL_HOST=mailpit, SPRING_MAIL_PORT=1025

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
      --profile|-Profile)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        if [[ "$2" != "full" && -n "$2" ]]; then
          fail "Invalid profile: $2. Supported value: full"
          exit 2
        fi
        PROFILE="$2"
        shift 2
        ;;
      --wait-seconds)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        [[ "$2" =~ ^[0-9]+$ ]] || { fail "--wait-seconds must be a number"; exit 2; }
        WAIT_SECONDS="$2"
        shift 2
        ;;
      --skip-health-check)
        SKIP_HEALTH_CHECK=true
        shift
        ;;
      --app-url)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        APP_URL="${2%/}"
        shift 2
        ;;
      --no-build)
        NO_BUILD=true
        shift
        ;;
      --no-force-recreate)
        FORCE_RECREATE=false
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
  [[ -f Dockerfile ]] || { fail "Dockerfile not found in $COMPOSE_DIR"; exit 1; }
  if [[ "$DEV_SMTP" == "true" && ! -f docker-compose.dev-smtp.yml ]]; then
    fail "docker-compose.dev-smtp.yml not found in $COMPOSE_DIR"
    exit 1
  fi

  if [[ "$NO_BUILD" != "true" ]] && ! find target -maxdepth 1 -type f -name '*-exec.jar' | grep -q .; then
    fail "Executable jar not found under $COMPOSE_DIR/target. Build backend first."
    exit 1
  fi

  success "Prerequisites OK"
}

get_env_value() {
  local name="$1"
  grep -E "^${name}=" .env 2>/dev/null | tail -n 1 | cut -d= -f2-
}

check_notification_environment() {
  step "Checking setup-link notification environment..."

  if [[ "$DEV_SMTP" == "true" ]]; then
    info "Dev SMTP enabled; Mailpit compose overlay will provide SMTP."
    return 0
  fi

  if [[ ! -f .env ]]; then
    fail ".env not found in $COMPOSE_DIR. Create it or use --dev-smtp for Mailpit."
    exit 1
  fi

  local mail_host mail_from logging
  mail_host="$(get_env_value SPRING_MAIL_HOST)"
  mail_from="$(get_env_value BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM)"
  logging="$(get_env_value BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED)"

  if [[ -z "$mail_host" && "$logging" != "true" ]]; then
    fail "No setup-link notification adapter is configured in .env."
    fail "Use --dev-smtp for Mailpit, or set SPRING_MAIL_HOST and BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM."
    exit 1
  fi

  if [[ -n "$mail_host" && -z "$mail_from" ]]; then
    fail "SPRING_MAIL_HOST is set but BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM is empty in .env."
    exit 1
  fi

  success "Notification environment OK"
}

start_containers() {
  step "Starting Docker containers..."

  local up_args=(-d)
  if [[ "$NO_BUILD" != "true" ]]; then
    up_args+=(--build)
  fi
  if [[ "$FORCE_RECREATE" == "true" ]]; then
    up_args+=(--force-recreate)
  fi

  echo "=== [1/3] Stopping existing containers ==="
  run_compose down

  echo
  echo "=== [2/3] Starting containers ==="
  run_compose up "${up_args[@]}"

  echo
  echo "=== [3/3] Container Status ==="
  run_compose ps

  success "Docker startup command completed"
}

verify_dev_smtp_overlay() {
  [[ "$DEV_SMTP" == "true" ]] || return 0
  [[ "$DRY_RUN" == "true" ]] && { info "Dry run: skipping Mailpit verification."; return 0; }

  step "Verifying Mailpit SMTP reached host-shell container..."
  local mail_host mail_port
  mail_host="$(docker inspect brix-host-shell-standalone --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^SPRING_MAIL_HOST=' | cut -d= -f2-)"
  mail_port="$(docker inspect brix-host-shell-standalone --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^SPRING_MAIL_PORT=' | cut -d= -f2-)"

  if [[ "$mail_host" != "mailpit" || "$mail_port" != "1025" ]]; then
    fail "Expected SPRING_MAIL_HOST=mailpit and SPRING_MAIL_PORT=1025, got SPRING_MAIL_HOST=$mail_host SPRING_MAIL_PORT=$mail_port"
    exit 1
  fi

  success "Mailpit SMTP env verified"
}

wait_and_health_check() {
  [[ "$DRY_RUN" == "true" ]] && { info "Dry run: skipping wait and health check."; return 0; }

  if (( WAIT_SECONDS > 0 )); then
    step "Waiting ${WAIT_SECONDS}s before status/health checks..."
    sleep "$WAIT_SECONDS"
  fi

  step "Checking container status..."
  run_compose ps

  if [[ "$SKIP_HEALTH_CHECK" == "true" ]]; then
    info "Health check skipped."
    return 0
  fi

  step "Checking host-shell health endpoint..."
  local body
  for _ in {1..30}; do
    body="$(curl -fsS --max-time 3 "${APP_URL}/actuator/health" 2>/dev/null || true)"
    if [[ "$body" == *'"status":"UP"'* || "$body" == *'"status":"STARTING"'* ]]; then
      echo "$body" | head -c 500
      echo
      success "Health endpoint responded"
      return 0
    fi
    sleep 2
  done

  curl -fsS --max-time 5 "${APP_URL}/actuator/health" | head -c 500
  echo
  success "Health endpoint responded"
}

print_summary() {
  header "Docker Startup Complete"
  info "Compose dir: $COMPOSE_DIR"
  info "Profile: ${PROFILE:-core services}"
  info "Build images: $([[ "$NO_BUILD" == "true" ]] && printf 'false' || printf 'true')"
  info "Force recreate: $FORCE_RECREATE"
  if [[ "$DEV_SMTP" == "true" ]]; then
    info "SMTP: Mailpit dev overlay enabled"
    info "Mailpit UI: http://localhost:8025"
    info "Mailpit SMTP: localhost:1025"
  else
    info "SMTP: .env notification config validated"
  fi
  info "Host Shell API: ${APP_URL}"
  info "Health Check: ${APP_URL}/actuator/health"
}

main() {
  parse_args "$@"

  header "Brix Docker Start v$VERSION"
  info "Compose dir: $COMPOSE_DIR"
  info "Dev SMTP: $DEV_SMTP"
  info "Profile: ${PROFILE:-core services}"
  info "Build images: $([[ "$NO_BUILD" == "true" ]] && printf 'false' || printf 'true')"
  info "Force recreate: $FORCE_RECREATE"

  check_prerequisites
  load_compose_args
  check_notification_environment
  start_containers
  verify_dev_smtp_overlay
  wait_and_health_check
  print_summary
}

main "$@"
