#!/usr/bin/env bash
set -Eeuo pipefail

FORCE=false
STOP_STATE=true
KILL_PORTS=true
PORTS=(3001 3003 3004 3006 3007 3015 3016 3050 3051 3052 3053 3054 3056)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HOST_ENV_LOCAL="${ENTERPRISE_ROOT}/packages/@brix/enterprise-host/host-shell-standalone-web/.env.local"
STATE_ROOT="${SCRIPT_DIR}/.state"
PID_FILE="${STATE_ROOT}/frontend-processes.json"

usage() {
  cat <<'EOF'
===============================================================
    stop-frontend.sh Usage Guide
===============================================================

Syntax:
    ./scripts/stop-frontend.sh [options]

Options:
    --force, -f          Force kill recorded frontend processes with SIGKILL.
    --state-only         Only stop processes from state file; do not kill ports.
    --ports-only         Only kill frontend ports; do not read the state file.
    --ports LIST         Override frontend ports, comma-separated.
                         Default: 3001,3003,3004,3006,3007,3015,3016,3050-3054,3056
    --help, -h           Show this help message.

PowerShell-style options are also accepted:
    -Force -KillPorts -Help

Examples:
    ./scripts/stop-frontend.sh
    ./scripts/stop-frontend.sh --force
    ./scripts/stop-frontend.sh --ports 3001,3004,3050

Notes:
    - Reads state file: scripts/.state/frontend-processes.json
    - Also kills leftover processes listening on frontend ports by default.
    - Removes the auto-generated host .env.local created by start-frontend.sh.
===============================================================
EOF
}

step() { printf '[STEP] %s\n' "$1"; }
info() { printf '[INFO] %s\n' "$1"; }
success() { printf '[ OK ] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; }

split_ports() {
  local input="$1" item
  IFS=',' read -ra items <<< "$input"
  PORTS=()
  for item in "${items[@]}"; do
    item="$(printf '%s' "$item" | xargs)"
    [[ "$item" =~ ^[0-9]+$ ]] || { fail "Invalid port: $item"; exit 2; }
    PORTS+=("$item")
  done
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force|-f|-Force|-force)
        FORCE=true
        shift
        ;;
      --state-only|-StateOnly|-stateOnly)
        KILL_PORTS=false
        shift
        ;;
      --ports-only|-PortsOnly|-portsOnly)
        STOP_STATE=false
        KILL_PORTS=true
        shift
        ;;
      --kill-ports|-KillPorts|-killPorts)
        KILL_PORTS=true
        shift
        ;;
      --ports|-Ports|-ports)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        split_ports "$2"
        shift 2
        ;;
      --help|-h|-Help|-help|'-?')
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

process_exists() {
  local pid="$1"
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

wait_for_exit() {
  local pid="$1" deadline
  deadline=$((SECONDS + 5))
  while process_exists "$pid" && (( SECONDS < deadline )); do
    sleep 0.2
  done
  ! process_exists "$pid"
}

stop_pid() {
  local pid="$1" name="${2:-process}"

  if ! process_exists "$pid"; then
    info "Already stopped: ${name} (PID=${pid})"
    return 1
  fi

  step "Stopping ${name} (PID=${pid})"
  if [[ "$FORCE" == true ]]; then
    kill -KILL "$pid" 2>/dev/null || true
  else
    kill -TERM "$pid" 2>/dev/null || true
    if ! wait_for_exit "$pid"; then
      info "PID ${pid} did not exit after SIGTERM; sending SIGKILL"
      kill -KILL "$pid" 2>/dev/null || true
    fi
  fi

  if process_exists "$pid"; then
    fail "Failed to stop ${name} (PID=${pid})"
    return 1
  fi

  success "Stopped ${name}"
  return 0
}

stop_recorded_processes() {
  if [[ ! -f "$PID_FILE" ]]; then
    info "State file not found: $PID_FILE"
    return 0
  fi

  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js is required to read the state file: $PID_FILE"
    return 1
  fi

  local stopped=0 line name pid
  while IFS=$'\t' read -r name pid; do
    [[ -n "${pid:-}" ]] || continue
    if stop_pid "$pid" "$name"; then
      stopped=$((stopped + 1))
    fi
  done < <(node -e '
const fs = require("fs");
const file = process.argv[1];
let state;
try { state = JSON.parse(fs.readFileSync(file, "utf8")); } catch (err) { process.exit(1); }
for (const proc of state.Processes || []) {
  if (proc && proc.PID) console.log(`${proc.Name || "frontend"}\t${proc.PID}`);
}
' "$PID_FILE")

  rm -f "$PID_FILE"
  info "Removed state file"
  success "Stopped recorded processes: $stopped"
}

pids_for_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tulpen 2>/dev/null | sed -n "/:${port}[[:space:]]/s/.*pid=\([0-9][0-9]*\).*/\1/p" | sort -u
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null | sort -u
  else
    fail "Neither ss nor lsof is available; cannot inspect port $port"
    return 1
  fi
}

kill_frontend_ports() {
  [[ "$KILL_PORTS" == true ]] || return 0

  local killed=0 port pid
  step "Killing processes on frontend ports: ${PORTS[*]}"
  for port in "${PORTS[@]}"; do
    while IFS= read -r pid; do
      [[ -n "$pid" ]] || continue
      if stop_pid "$pid" "port ${port}"; then
        killed=$((killed + 1))
      fi
    done < <(pids_for_port "$port" || true)
  done
  success "Killed port processes: $killed"
}

remove_host_local_env() {
  if [[ -f "$HOST_ENV_LOCAL" ]]; then
    rm -f "$HOST_ENV_LOCAL"
    info "Removed host .env.local"
  fi
}

main() {
  parse_args "$@"
  if [[ "$STOP_STATE" == true ]]; then
    stop_recorded_processes
  fi
  kill_frontend_ports
  remove_host_local_env
  success "Frontend stopped"
}

main "$@"
