#!/usr/bin/env bash
set -Eeuo pipefail

PUBLIC_PORTS=(22 8081 3001 3000)
LOCAL_ONLY_PORTS=(5432 6379 9092 9000 9001 1025 8025)
TRUSTED_CIDR=""
ENABLE_UFW=true
DRY_RUN=false

usage() {
  cat <<'EOF'
===============================================================
    Brix Ubuntu Port Setup
===============================================================

Usage:
  ./scripts/setup-ubuntu-ports.sh [options]

Default policy:
  - Open public app ports: 22, 8081, 3001, 3000
  - Keep data/dev infra ports local-only: 5432, 6379, 9092, 9000, 9001, 1025, 8025

Options:
  --trusted-cidr CIDR    Also allow data/dev infra ports from this CIDR/IP.
                         Example: --trusted-cidr 203.0.113.10/32
  --public-ports LIST    Override public ports, comma-separated.
                         Example: --public-ports 22,80,443,8081,3001
  --no-enable            Do not run 'ufw --force enable'.
  --dry-run              Print commands without changing firewall.
  --help, -h             Show this help.

Notes:
  Docker compose currently binds PostgreSQL/Redis/Kafka/MinIO/Mailpit to
  127.0.0.1, so they are local-only even if a firewall rule is added. That is
  intentional. Do not expose 5432/6379/9092 to the public Internet.
===============================================================
EOF
}

info() { printf '[INFO] %s\n' "$1"; }
success() { printf '[ OK ] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; }

split_ports() {
  local input="$1"
  local item
  IFS=',' read -ra items <<< "$input"
  PUBLIC_PORTS=()
  for item in "${items[@]}"; do
    item="$(printf '%s' "$item" | xargs)"
    [[ "$item" =~ ^[0-9]+$ ]] || { fail "Invalid port: $item"; exit 2; }
    PUBLIC_PORTS+=("$item")
  done
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --trusted-cidr)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        TRUSTED_CIDR="$2"
        shift 2
        ;;
      --public-ports)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        split_ports "$2"
        shift 2
        ;;
      --no-enable)
        ENABLE_UFW=false
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

run_cmd() {
  if [[ "$DRY_RUN" == true ]]; then
    printf '+ %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

need_root() {
  if [[ "$DRY_RUN" == true ]]; then
    return 0
  fi
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    if command -v sudo >/dev/null 2>&1; then
      info "Firewall changes need administrator privileges. Re-running with sudo..."
      exec sudo "$0" "$@"
    fi
    fail "Administrator privileges are required. Run: sudo ./scripts/setup-ubuntu-ports.sh"
    exit 1
  fi
}

check_ufw() {
  if ! command -v ufw >/dev/null 2>&1; then
    fail "ufw not found. Install it with: sudo apt-get install ufw"
    exit 1
  fi
}

main() {
  parse_args "$@"
  need_root "$@"
  check_ufw

  info "Public ports: ${PUBLIC_PORTS[*]}"
  info "Local-only data/dev ports: ${LOCAL_ONLY_PORTS[*]}"
  if [[ -n "$TRUSTED_CIDR" ]]; then
    info "Trusted CIDR for data/dev ports: $TRUSTED_CIDR"
  fi

  run_cmd ufw default deny incoming
  run_cmd ufw default allow outgoing

  local port
  for port in "${PUBLIC_PORTS[@]}"; do
    run_cmd ufw allow "${port}/tcp"
  done

  if [[ -n "$TRUSTED_CIDR" ]]; then
    for port in "${LOCAL_ONLY_PORTS[@]}"; do
      run_cmd ufw allow from "$TRUSTED_CIDR" to any port "$port" proto tcp
    done
  fi

  if [[ "$ENABLE_UFW" == true ]]; then
    run_cmd ufw --force enable
  fi

  run_cmd ufw status verbose
  success "Ubuntu port rules configured"
}

main "$@"
