#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_DIR="${ENTERPRISE_ROOT}/packages/@brix/enterprise-host/host-shell-standalone"
NO_CACHE=false
DEV_SMTP=false
PROFILE=""
WAIT_SECONDS=10
SKIP_HEALTH_CHECK=false
INIT_ENV=false
APP_URL="http://localhost:8081"
LOCAL_JWT_DIR=".docker/jwt"
LOCAL_JWT_OVERLAY="docker-compose.local-jwt.yml"

usage() {
  cat <<'EOF'
========================================================================
                  Brix Docker Rebuild for Ubuntu
========================================================================

Usage:
  ./scripts/docker-rebuild.sh [options]

Options:
  --compose-dir DIR         Docker compose directory
  --no-cache                Rebuild Docker images without cache
  --dev-smtp                Enable docker-compose.dev-smtp.yml Mailpit SMTP overlay
  --init-env                Create local development .env, JWT keys, and compose overlay
  --profile full            Start compose services with profile full
  --wait-seconds SECONDS    Seconds to wait before status/health checks (default: 10)
  --skip-health-check       Skip HTTP health check after deployment
  --app-url URL             Health check base URL (default: http://localhost:8081)
  --help, -h                Show this help

Examples:
  ./scripts/docker-rebuild.sh --dev-smtp --init-env
  ./scripts/docker-rebuild.sh --dev-smtp --no-cache
  ./scripts/docker-rebuild.sh --profile full

SMTP behavior:
  - Production mode requires .env notification delivery configuration:
      SPRING_MAIL_HOST + BRIX_INFRA_EMAIL_SMTP_FROM
    or explicit BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED=true.
  - --dev-smtp loads Mailpit and verifies the host-shell container receives:
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
      --no-cache|-NoCache)
        NO_CACHE=true
        shift
        ;;
      --dev-smtp|-DevSmtp)
        DEV_SMTP=true
        shift
        ;;
      --init-env)
        INIT_ENV=true
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

random_base64() {
  local bytes="$1"
  if command_exists openssl; then
    openssl rand -base64 "$bytes"
  else
    head -c "$bytes" /dev/urandom | base64 | tr -d '\n'
    printf '\n'
  fi
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

run_compose() {
  docker compose "${COMPOSE_FILES[@]}" "${PROFILE_ARGS[@]}" "$@"
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

  if ! find target -maxdepth 1 -type f -name '*-exec.jar' | grep -q .; then
    fail "Executable jar not found under $COMPOSE_DIR/target. Build backend first."
    exit 1
  fi

  success "Prerequisites OK"
}

create_dev_env_if_needed() {
  [[ "$INIT_ENV" == "true" ]] || return 0
  if [[ -f .env ]]; then
    info ".env already exists; keeping existing values."
    if ! grep -Eq '^BRIX_PLATFORM_ADMIN_SETUP_BASE_URL=' .env; then
      printf '\nBRIX_PLATFORM_ADMIN_SETUP_BASE_URL=http://localhost:3001/platform/setup\n' >> .env
      chmod 600 .env
      success "Added missing BRIX_PLATFORM_ADMIN_SETUP_BASE_URL to existing .env"
    fi
    if ! grep -Eq '^BRIX_INFRA_EMAIL_SMTP_FROM=' .env; then
      printf '\nBRIX_INFRA_EMAIL_SMTP_FROM=platform-admin@brix.local\n' >> .env
      chmod 600 .env
      success "Added missing BRIX_INFRA_EMAIL_SMTP_FROM to existing .env"
    fi
    return 0
  fi

  step "Creating local development .env..."
  local db_password minio_secret google_secret token_key mfa_key setup_code
  db_password="$(random_base64 18 | tr -d '/+=' | cut -c1-24)"
  minio_secret="$(random_base64 24 | tr -d '/+=' | cut -c1-32)"
  google_secret="$(random_base64 24 | tr -d '/+=' | cut -c1-32)"
  token_key="$(random_base64 32)"
  mfa_key="$(random_base64 32)"
  setup_code="$(random_base64 24 | tr '+/' '-_' | tr -d '=' | cut -c1-32)"

  cat > .env <<EOF
# Generated by scripts/docker-rebuild.sh for local Docker development.
DB_PASSWORD=${db_password}
GRAFANA_ADMIN_PASSWORD=admin123
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=${minio_secret}
MINIO_BUCKET_NAME=brix-storage

GOOGLE_CLIENT_ID=local-dev-google-client-id
GOOGLE_CLIENT_SECRET=${google_secret}
TOKEN_ENCRYPTION_KEY=${token_key}

BRIX_PLATFORM_MFA_ISSUER=Brix
BRIX_PLATFORM_MFA_ENCRYPTION_KEY=${mfa_key}
BRIX_PLATFORM_ADMIN_SETUP_BASE_URL=http://localhost:3001/platform/setup
BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM=platform-admin@brix.local
BRIX_INFRA_EMAIL_SMTP_FROM=platform-admin@brix.local
BRIX_PLATFORM_ADMIN_SETUP_TOKEN_TTL_SECONDS=86400
BRIX_PLATFORM_ADMIN_SETUP_RETURN_URL_FOR_DEV_ONLY=false
BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED=false

SPRING_MAIL_HOST=
SPRING_MAIL_PORT=
SPRING_MAIL_USERNAME=
SPRING_MAIL_PASSWORD=
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_REQUIRED=

BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED=true
BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=admin@example.com
BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME=Super Admin
BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE=${setup_code}
BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE_TTL_SECONDS=900
BRIX_BOOTSTRAP_SUPER_ADMIN_SESSION_TTL_SECONDS=300
EOF
  chmod 600 .env
  success "Created .env"
}

ensure_local_jwt_if_needed() {
  [[ "$INIT_ENV" == "true" ]] || return 0

  step "Ensuring local JWT keys and compose overlay..."
  if ! command_exists openssl; then
    fail "openssl is required to generate local JWT keys."
    exit 1
  fi

  mkdir -p "$LOCAL_JWT_DIR"
  if [[ ! -f "$LOCAL_JWT_DIR/private.pem" || ! -f "$LOCAL_JWT_DIR/public.pem" ]]; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$LOCAL_JWT_DIR/private.pem" >/dev/null 2>&1
    openssl rsa -in "$LOCAL_JWT_DIR/private.pem" -outform PEM -pubout -out "$LOCAL_JWT_DIR/public.pem" >/dev/null 2>&1
    success "Generated local JWT key pair"
  else
    info "Local JWT key pair already exists; keeping existing files."
  fi
  chmod 644 "$LOCAL_JWT_DIR/private.pem" "$LOCAL_JWT_DIR/public.pem"

  cat > "$LOCAL_JWT_OVERLAY" <<'EOF'
services:
  host-shell:
    volumes:
      - ./.docker/jwt:/run/secrets/brix-jwt:ro
    environment:
      PLATFORM_JWT_PRIVATE_KEY_PATH: file:/run/secrets/brix-jwt/private.pem
      PLATFORM_SECURITY_JWT_PRIVATE_KEY_PATH: file:/run/secrets/brix-jwt/private.pem
      PLATFORM_SECURITY_JWT_PUBLIC_KEY_PATH: file:/run/secrets/brix-jwt/public.pem
      JWT_PRIVATE_KEY_PATH: file:/run/secrets/brix-jwt/private.pem
      JWT_PUBLIC_KEY_PATH: file:/run/secrets/brix-jwt/public.pem
EOF
  success "Ensured local JWT compose overlay"
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
    fail ".env not found in $COMPOSE_DIR. Create it or run with --dev-smtp --init-env for local development."
    exit 1
  fi

  local mail_host setup_base_url setup_mail_from smtp_from logging
  mail_host="$(get_env_value SPRING_MAIL_HOST)"
  setup_base_url="$(get_env_value BRIX_PLATFORM_ADMIN_SETUP_BASE_URL)"
  setup_mail_from="$(get_env_value BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM)"
  smtp_from="$(get_env_value BRIX_INFRA_EMAIL_SMTP_FROM)"
  logging="$(get_env_value BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED)"

  if [[ -z "$setup_base_url" ]]; then
    fail "BRIX_PLATFORM_ADMIN_SETUP_BASE_URL is empty in .env."
    exit 1
  fi

  if [[ -z "$mail_host" && "$logging" != "true" ]]; then
    fail "No setup-link notification adapter is configured in .env."
    fail "Use --dev-smtp for Mailpit, or set SPRING_MAIL_HOST and BRIX_INFRA_EMAIL_SMTP_FROM."
    exit 1
  fi

  if [[ -n "$mail_host" && -z "$smtp_from" ]]; then
    fail "SPRING_MAIL_HOST is set but BRIX_INFRA_EMAIL_SMTP_FROM is empty in .env."
    exit 1
  fi

  if [[ -n "$smtp_from" && -z "$setup_mail_from" ]]; then
    fail "BRIX_INFRA_EMAIL_SMTP_FROM is set but BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM is empty in .env."
    exit 1
  fi

  success "Notification environment OK"
}

rebuild_containers() {
  step "Rebuilding Docker images and starting containers..."

  local build_args=()
  if [[ "$NO_CACHE" == "true" ]]; then
    build_args+=(--no-cache)
  fi

  echo "=== [1/4] Stopping existing containers ==="
  run_compose down

  echo
  echo "=== [2/4] Rebuilding Docker images ==="
  run_compose build "${build_args[@]}"

  echo
  echo "=== [3/4] Starting containers ==="
  run_compose up -d

  echo
  echo "=== [4/4] Container Status ==="
  run_compose ps

  success "Docker rebuild completed"
}

verify_dev_smtp_overlay() {
  [[ "$DEV_SMTP" == "true" ]] || return 0

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
  header "Rebuild Complete"
  info "Compose dir: $COMPOSE_DIR"
  info "Mode: $([[ "$NO_CACHE" == "true" ]] && printf 'no-cache' || printf 'normal cache')"
  if [[ -n "$PROFILE" ]]; then
    info "Profile: $PROFILE"
  else
    info "Profile: core services"
  fi
  if [[ "$DEV_SMTP" == "true" ]]; then
    info "SMTP: Mailpit dev overlay enabled"
    info "Mailpit UI: http://localhost:8025"
    info "Mailpit SMTP: localhost:1025"
  else
    info "SMTP: production .env notification config validated"
  fi
  info "Host Shell API: ${APP_URL}"
  info "Health Check: ${APP_URL}/actuator/health"
}

main() {
  parse_args "$@"

  header "Brix Docker Rebuild v$VERSION"
  info "Compose dir: $COMPOSE_DIR"
  info "No cache: $NO_CACHE"
  info "Dev SMTP: $DEV_SMTP"
  info "Init env: $INIT_ENV"
  info "Profile: ${PROFILE:-core services}"

  check_prerequisites
  create_dev_env_if_needed
  ensure_local_jwt_if_needed
  load_compose_args
  check_notification_environment
  rebuild_containers
  verify_dev_smtp_overlay
  wait_and_health_check
  print_summary
}

main "$@"
