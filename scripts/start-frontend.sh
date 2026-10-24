#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.0.0"
MODE="Product"
HOST_ONLY=false
SKIP_HOST=false
FORCE=false
API_BASE="${VITE_API_BASE:-/api}"
BACKEND_URL="${VITE_REMOTE_BACKEND:-}"
REQUESTED_PLUGINS=()
PNPM_CMD=()
PNPM_LABEL="pnpm"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HOST_ROOT="${ENTERPRISE_ROOT}/packages/@brix/enterprise-host/host-shell-standalone-web"
SOLUTIONS_ROOT="${ENTERPRISE_ROOT}/packages/@brix/enterprise-solutions"
STATE_ROOT="${SCRIPT_DIR}/.state"
LOG_ROOT="${SCRIPT_DIR}/logs/frontend"
PID_FILE="${STATE_ROOT}/frontend-processes.json"

default_backend_url() {
  local ip
  ip="$(ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p' | head -n 1)"
  if [[ -z "$ip" ]]; then
    ip="$(hostname -I 2>/dev/null | tr ' ' '\n' | sed -n '/^[0-9.][0-9.]*$/p' | head -n 1)"
  fi
  if [[ -z "$ip" ]]; then
    ip="localhost"
  fi
  printf 'http://%s:8081' "$ip"
}

usage() {
  cat <<'EOF'
===============================================================
    start-frontend.sh Usage Guide
===============================================================

Syntax:
    ./scripts/start-frontend.sh [options]

Options:
    --mode Product|Dev    Startup mode. Default is Product.
    --plugin <names>      Comma-separated plugin names to start.
                          Available: products, partners, messenger,
                          identity, carousel, booking, case,
                          contracts, intake, storage, compliance,
                          tenant
    --host-only           Start host shell only.
    --skip-host           Start plugins only (skip host shell).
    --force               Stop processes from previous state file first.
    --api-base URL        Browser API base. Default: /api.
    --backend-url URL     Backend proxy target. Default: http://<server-ip>:8081.
    --help, -h            Show this help message.

PowerShell-style options are also accepted:
    -Mode Dev -Plugin booking,case -HostOnly -SkipHost -Force

Examples:
    ./scripts/start-frontend.sh
    ./scripts/start-frontend.sh --plugin booking
    ./scripts/start-frontend.sh --plugin booking,case
    ./scripts/start-frontend.sh --mode Dev --plugin partners
    ./scripts/start-frontend.sh --host-only
    ./scripts/start-frontend.sh --skip-host --plugin booking
    ./scripts/start-frontend.sh --force
    ./scripts/start-frontend.sh --host-only --api-base /api --backend-url http://84.247.154.52:8081

Notes:
    - Host URL: http://localhost:3001
    - Logs: scripts/logs/frontend
    - Stop with: kill PIDs from scripts/.state/frontend-processes.json
===============================================================
EOF
}

header() {
  printf '\n===============================================================\n'
  printf '  %s\n' "$1"
  printf '===============================================================\n\n'
}

step() { printf '[STEP] %s\n' "$1"; }
info() { printf '[INFO] %s\n' "$1"; }
success() { printf '[ OK ] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; }

normalize_mode() {
  case "${1:-}" in
    Product|product) printf 'Product' ;;
    Dev|dev) printf 'Dev' ;;
    *) fail "Invalid mode: ${1:-}. Expected Product or Dev."; exit 2 ;;
  esac
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --mode|-Mode|-mode)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        MODE="$(normalize_mode "$2")"
        shift 2
        ;;
      --plugin|-Plugin|-plugin)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        REQUESTED_PLUGINS+=("$2")
        shift 2
        ;;
      --host-only|-HostOnly|-hostOnly)
        HOST_ONLY=true
        shift
        ;;
      --skip-host|-SkipHost|-skipHost)
        SKIP_HOST=true
        shift
        ;;
      --force|-Force|-force)
        FORCE=true
        shift
        ;;
      --api-base|-ApiBase|-apiBase)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        API_BASE="$2"
        shift 2
        ;;
      --backend-url|-BackendUrl|-backendUrl)
        [[ $# -ge 2 ]] || { fail "$1 requires a value"; exit 2; }
        BACKEND_URL="$2"
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

check_min_major() {
  local name="$1"
  local version="$2"
  local required="$3"
  local major
  major="$(printf '%s' "$version" | sed -E 's/^v?([0-9]+).*/\1/')"
  if [[ -n "$major" && "$major" =~ ^[0-9]+$ && "$major" -lt "$required" ]]; then
    fail "$name version is too old: $version. Required: $required+"
    exit 1
  fi
}

check_prerequisites() {
  [[ -d "$ENTERPRISE_ROOT" ]] || { fail "Missing path: $ENTERPRISE_ROOT"; exit 1; }
  [[ -d "$HOST_ROOT" ]] || { fail "Missing path: $HOST_ROOT"; exit 1; }
  [[ -d "$SOLUTIONS_ROOT" ]] || { fail "Missing path: $SOLUTIONS_ROOT"; exit 1; }

  if ! command_exists node; then
    fail "Node.js not found. Please install Node.js 18+."
    exit 1
  fi

  local node_version
  node_version="$(node --version)"
  check_min_major "Node.js" "$node_version" 18

  if command_exists pnpm; then
    PNPM_CMD=(pnpm)
    PNPM_LABEL="pnpm"
  elif command_exists corepack; then
    PNPM_CMD=(corepack pnpm)
    PNPM_LABEL="corepack pnpm"
    info "pnpm not found; using Corepack pnpm from packageManager."
  else
    fail "pnpm not found and corepack is unavailable. Please install pnpm 8+."
    exit 1
  fi

  local pnpm_version
  pnpm_version="$("${PNPM_CMD[@]}" --version)"
  check_min_major "pnpm" "$pnpm_version" 8

  info "Mode: $MODE"
  info "Node: $node_version"
  info "$PNPM_LABEL: v$pnpm_version"
  [[ -n "$BACKEND_URL" ]] || BACKEND_URL="$(default_backend_url)"
  info "API base: $API_BASE"
  info "Backend proxy: $BACKEND_URL"
  info "Log dir: $LOG_ROOT"
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "$value"
}

sync_host_local_plugins_env() {
  local joined="$1"
  local env_local_path="${HOST_ROOT}/.env.local"

  [[ -n "$BACKEND_URL" ]] || BACKEND_URL="$(default_backend_url)"

  cat > "$env_local_path" <<EOF
# Auto-generated by scripts/start-frontend.sh - DO NOT EDIT MANUALLY.
# Reflects the frontend processes actually started by this script.
VITE_LOCAL_PLUGINS=${joined}
VITE_API_BASE=${API_BASE}
VITE_API_BASE_URL=${API_BASE}
VITE_REMOTE_BACKEND=${BACKEND_URL}
EOF
  info "Wrote host .env.local: VITE_LOCAL_PLUGINS=${joined}"
  info "Wrote host .env.local: VITE_API_BASE=${API_BASE}"
  info "Wrote host .env.local: VITE_REMOTE_BACKEND=${BACKEND_URL}"
}

kill_previous_processes() {
  [[ -f "$PID_FILE" ]] || return 0

  if [[ "$FORCE" != true ]]; then
    fail "Existing state file detected: $PID_FILE"
    info "Stop previous frontend processes first, or pass --force."
    exit 1
  fi

  info "--force: stopping processes from previous state file..."
  node -e '
const fs = require("fs");
const file = process.argv[1];
let state;
try { state = JSON.parse(fs.readFileSync(file, "utf8")); } catch { process.exit(0); }
const realpath = (p) => { try { return fs.realpathSync(p); } catch { return null; } };
for (const proc of state.Processes || []) {
  const pid = Number(proc.PID);
  if (!Number.isInteger(pid) || pid <= 0) continue;
  // After a reboot the PID may belong to another program: leave it alone unless it runs in the app directory.
  const cwd = realpath(`/proc/${pid}/cwd`);
  if (cwd && proc.Path && cwd !== realpath(proc.Path)) {
    console.log(`[INFO] Skipped ${proc.Name}: PID ${pid} is no longer the recorded process`);
    continue;
  }
  // Started with setsid, so its process group also holds the dev server it spawned (pnpm does not pass SIGTERM on).
  for (const target of [-pid, pid]) {
    try { process.kill(target, "SIGTERM"); console.log(`[INFO] Stopped ${proc.Name} (PID=${pid})`); break; }
    catch (err) {
      if (err.code !== "ESRCH") { console.error(`[FAIL] Could not stop ${proc.Name} (PID=${pid}): ${err.message}`); break; }
    }
  }
}
' "$PID_FILE" || true
  sleep 1
}

stop_port_if_forced() {
  local port="$1"
  [[ "$FORCE" == true ]] || return 0

  local pids=() pid
  while IFS= read -r pid; do
    [[ -n "$pid" ]] && pids+=("$pid")
  done < <(ss -Hltnp "sport = :${port}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)

  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      info "--force: stopping process listening on port ${port} (PID=${pid})"
      kill "$pid" 2>/dev/null || true
    fi
  done

  # Give a stopped server up to 10 seconds to release the port.
  local attempt
  for ((attempt = 0; attempt < 20 && ${#pids[@]} > 0; attempt++)); do
    port_listening "$port" || break
    sleep 0.5
  done
}

port_listening() {
  local port="$1"

  ss -ltn "sport = :${port}" 2>/dev/null | sed -n '2p' | grep -q .
}

print_log_tail() {
  local label="$1"
  local file="$2"

  [[ -f "$file" ]] || return 0
  info "${label}: ${file}"
  tail -n 40 "$file" || true
}

http_ready() {
  local port="$1"
  local path="$2"
  local status

  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${port}${path}" 2>/dev/null || true)"
  [[ "$status" =~ ^2[0-9][0-9]$ || "$status" =~ ^3[0-9][0-9]$ ]]
}

compiled_ready() {
  local stdout="$1"
  local stderr="$2"

  { [[ -f "$stdout" ]] && grep -q 'Rspack compiled' "$stdout"; } ||
    { [[ -f "$stderr" ]] && grep -q 'Rspack compiled' "$stderr"; }
}

wait_for_frontend_ready() {
  local name="$1"
  local port="$2"
  local pid="$3"
  local stdout="$4"
  local stderr="$5"
  local attempts=60
  local attempt

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if ! kill -0 "$pid" 2>/dev/null; then
      fail "${name} exited before port ${port} became ready (PID=${pid})."
      print_log_tail "${name} stdout tail" "$stdout"
      print_log_tail "${name} stderr tail" "$stderr"
      exit 1
    fi

    if ! compiled_ready "$stdout" "$stderr"; then
      sleep 0.5
      continue
    fi

    if [[ "$name" == "host-shell" ]]; then
      if http_ready "$port" "/" && http_ready "$port" "/remoteEntry.js"; then
        success "${name} is ready on port ${port}."
        return 0
      fi
    elif http_ready "$port" "/remoteEntry.js"; then
      success "${name} is ready on port ${port}."
      return 0
    fi

    sleep 0.5
  done

  fail "${name} did not become ready on port ${port} within 30 seconds (PID=${pid})."
  print_log_tail "${name} stdout tail" "$stdout"
  print_log_tail "${name} stderr tail" "$stderr"
  exit 1
}

add_app() {
  APPS_NAME+=("$1")
  APPS_PATH+=("$2")
  APPS_PORT+=("$3")
  APPS_DEV+=("$4")
  APPS_PRODUCT+=("$5")
  APPS_PLUGIN_KEY+=("$6")
}

init_apps() {
  APPS_NAME=()
  APPS_PATH=()
  APPS_PORT=()
  APPS_DEV=()
  APPS_PRODUCT=()
  APPS_PLUGIN_KEY=()

  add_app "host-shell" "${HOST_ROOT}" 3001 "run dev" "run preview" ""
  add_app "plugin-products" "${SOLUTIONS_ROOT}/app-products/products-ui-web" 3004 "run dev" "exec rspack serve --mode production" "products"
  add_app "plugin-partners" "${SOLUTIONS_ROOT}/app-partners/partners-ui-web" 3003 "run dev" "exec rspack serve --mode production" "partners"
  add_app "plugin-messenger" "${SOLUTIONS_ROOT}/app-messenger/messenger-ui-web" 3006 "run dev" "exec rspack serve --mode production" "messenger"
  add_app "plugin-identity" "${SOLUTIONS_ROOT}/app-identity/identity-ui-web" 3016 "run start" "exec rspack serve --mode production" "identity"
  add_app "plugin-carousel" "${SOLUTIONS_ROOT}/app-carousel/carousel-ui-web" 3007 "run dev" "exec rspack serve --mode production" "carousel"
  add_app "plugin-case" "${SOLUTIONS_ROOT}/app-case/case-ui-web" 3050 "run dev" "run preview" "case"
  add_app "plugin-contracts" "${SOLUTIONS_ROOT}/app-contracts/contracts-ui-web" 3051 "run dev" "run preview" "contracts"
  add_app "plugin-intake" "${SOLUTIONS_ROOT}/app-intake/intake-ui-web" 3056 "run dev" "run preview" "intake"
  add_app "plugin-storage" "${SOLUTIONS_ROOT}/app-storage/storage-ui-web" 3053 "run dev" "run preview" "storage"
  add_app "plugin-compliance" "${SOLUTIONS_ROOT}/app-compliance/compliance-ui-web" 3052 "run dev" "exec rspack serve --mode production" "compliance"
  add_app "plugin-tenant" "${SOLUTIONS_ROOT}/app-tenant/tenant-ui-web" 3054 "run dev" "exec rspack serve --mode production" "tenant"
}

normalize_requested_plugins() {
  NORMALIZED_PLUGINS=()
  local item part
  for item in "${REQUESTED_PLUGINS[@]}"; do
    IFS=',' read -ra parts <<< "$item"
    for part in "${parts[@]}"; do
      part="$(printf '%s' "$part" | xargs | tr '[:upper:]' '[:lower:]')"
      [[ -n "$part" ]] && NORMALIZED_PLUGINS+=("$part")
    done
  done
}

plugin_requested() {
  local key="$1"
  local requested
  for requested in "${NORMALIZED_PLUGINS[@]}"; do
    [[ "$requested" == "$key" ]] && return 0
  done
  return 1
}

validate_requested_plugins() {
  [[ ${#NORMALIZED_PLUGINS[@]} -gt 0 ]] || return 0
  local requested i valid invalid=()
  for requested in "${NORMALIZED_PLUGINS[@]}"; do
    valid=false
    for i in "${!APPS_NAME[@]}"; do
      [[ -n "${APPS_PLUGIN_KEY[$i]}" && "${APPS_PLUGIN_KEY[$i]}" == "$requested" ]] && valid=true
    done
    [[ "$valid" == true ]] || invalid+=("$requested")
  done

  if [[ ${#invalid[@]} -gt 0 ]]; then
    fail "Unknown plugin(s): ${invalid[*]}"
    local keys=()
    for i in "${!APPS_NAME[@]}"; do
      [[ -n "${APPS_PLUGIN_KEY[$i]}" ]] && keys+=("${APPS_PLUGIN_KEY[$i]}")
    done
    info "Available plugins: ${keys[*]}"
    exit 1
  fi

  info "Selected plugins: ${NORMALIZED_PLUGINS[*]}"
}

select_apps() {
  SELECTED_INDEXES=()
  local i

  if [[ "$SKIP_HOST" != true ]]; then
    SELECTED_INDEXES+=(0)
  fi

  if [[ "$HOST_ONLY" != true ]]; then
    if [[ ${#NORMALIZED_PLUGINS[@]} -gt 0 ]]; then
      for i in "${!APPS_NAME[@]}"; do
        [[ -n "${APPS_PLUGIN_KEY[$i]}" ]] || continue
        plugin_requested "${APPS_PLUGIN_KEY[$i]}" && SELECTED_INDEXES+=("$i")
      done
    else
      for i in "${!APPS_NAME[@]}"; do
        [[ -n "${APPS_PLUGIN_KEY[$i]}" ]] && SELECTED_INDEXES+=("$i")
      done
    fi
  fi

  for i in "${SELECTED_INDEXES[@]}"; do
    [[ -d "${APPS_PATH[$i]}" ]] || { fail "Missing app path: ${APPS_PATH[$i]}"; exit 1; }
  done
}

join_local_plugin_keys() {
  local keys=()
  local i key
  for i in "${SELECTED_INDEXES[@]}"; do
    key="${APPS_PLUGIN_KEY[$i]}"
    [[ -n "$key" ]] && keys+=("$key")
  done
  if [[ ${#keys[@]} -eq 0 ]]; then
    printf ''
    return 0
  fi
  printf '%s\n' "${keys[@]}" | sort -u | paste -sd ',' -
}

start_frontend_process() {
  local i="$1"
  local name="${APPS_NAME[$i]}"
  local app_path="${APPS_PATH[$i]}"
  local port="${APPS_PORT[$i]}"
  local command_args node_env stdout stderr pid

  if [[ "$MODE" == "Product" ]]; then
    command_args="${APPS_PRODUCT[$i]}"
    node_env="production"
  else
    command_args="${APPS_DEV[$i]}"
    node_env="development"
  fi

  stdout="${LOG_ROOT}/${name}.out.log"
  stderr="${LOG_ROOT}/${name}.err.log"

  stop_port_if_forced "$port"

  if port_listening "$port"; then
    fail "Port ${port} is already in use and could not be cleared by this script."
    info "Stop the existing frontend process that owns port ${port}, then run this script again."
    exit 1
  fi

  step "Starting ${name} on port ${port}..."
  info "Command: ${PNPM_LABEL} ${command_args}"

  if command_exists setsid; then
    setsid bash -c 'cd "$1"; export NODE_ENV="$2"; shift 2; exec "$@"' \
      frontend-runner "$app_path" "$node_env" "${PNPM_CMD[@]}" ${command_args} \
      >"$stdout" 2>"$stderr" < /dev/null &
  else
    nohup bash -c 'cd "$1"; export NODE_ENV="$2"; shift 2; exec "$@"' \
      frontend-runner "$app_path" "$node_env" "${PNPM_CMD[@]}" ${command_args} \
      >"$stdout" 2>"$stderr" < /dev/null &
  fi
  pid=$!

  STARTED_NAME+=("$name")
  STARTED_PATH+=("$app_path")
  STARTED_PORT+=("$port")
  STARTED_PID+=("$pid")
  STARTED_LOG_OUT+=("$stdout")
  STARTED_LOG_ERR+=("$stderr")
  STARTED_COMMAND+=("${PNPM_LABEL} ${command_args}")

  wait_for_frontend_ready "$name" "$port" "$pid" "$stdout" "$stderr"
}

write_state_file() {
  local tmp
  tmp="$(mktemp)"
  {
    printf '{\n'
    printf '  "StartedAt": "%s",\n' "$(date +%Y-%m-%dT%H:%M:%S)"
    printf '  "Mode": "%s",\n' "$(json_escape "$MODE")"
    printf '  "HostOnly": %s,\n' "$HOST_ONLY"
    printf '  "SkipHost": %s,\n' "$SKIP_HOST"
    printf '  "Processes": [\n'
    local idx count
    count="${#STARTED_NAME[@]}"
    for idx in "${!STARTED_NAME[@]}"; do
      printf '    {'
      printf '"Name":"%s",' "$(json_escape "${STARTED_NAME[$idx]}")"
      printf '"Path":"%s",' "$(json_escape "${STARTED_PATH[$idx]}")"
      printf '"Port":%s,' "${STARTED_PORT[$idx]}"
      printf '"PID":%s,' "${STARTED_PID[$idx]}"
      printf '"LogOut":"%s",' "$(json_escape "${STARTED_LOG_OUT[$idx]}")"
      printf '"LogErr":"%s",' "$(json_escape "${STARTED_LOG_ERR[$idx]}")"
      printf '"Command":"%s"' "$(json_escape "${STARTED_COMMAND[$idx]}")"
      if (( idx + 1 < count )); then
        printf '},\n'
      else
        printf '}\n'
      fi
    done
    printf '  ]\n'
    printf '}\n'
  } > "$tmp"
  mv "$tmp" "$PID_FILE"
}

main() {
  parse_args "$@"

  header "Brix Enterprise Frontend Starter"

  if [[ "$HOST_ONLY" == true && "$SKIP_HOST" == true ]]; then
    fail "--host-only and --skip-host cannot be used together."
    exit 1
  fi

  check_prerequisites
  kill_previous_processes
  mkdir -p "$STATE_ROOT" "$LOG_ROOT"

  init_apps
  normalize_requested_plugins
  validate_requested_plugins
  select_apps

  local local_plugins host_selected=false idx
  local_plugins="$(join_local_plugin_keys)"
  for idx in "${SELECTED_INDEXES[@]}"; do
    [[ "${APPS_NAME[$idx]}" == "host-shell" ]] && host_selected=true
  done

  if [[ "$host_selected" == true || "$SKIP_HOST" == true ]]; then
    sync_host_local_plugins_env "$local_plugins"
    if [[ "$SKIP_HOST" == true ]]; then
      fail "--skip-host specified: a running host will NOT pick up new proxy rules."
      info "Restart the host for /plugins proxies to take effect."
    fi
  fi

  STARTED_NAME=()
  STARTED_PATH=()
  STARTED_PORT=()
  STARTED_PID=()
  STARTED_LOG_OUT=()
  STARTED_LOG_ERR=()
  STARTED_COMMAND=()

  for idx in "${SELECTED_INDEXES[@]}"; do
    start_frontend_process "$idx"
  done

  write_state_file

  header "Frontend Startup Summary"
  for idx in "${!STARTED_NAME[@]}"; do
    printf '  %s | PID=%s | Port=%s\n' "${STARTED_NAME[$idx]}" "${STARTED_PID[$idx]}" "${STARTED_PORT[$idx]}"
  done

  printf '\n'
  success "Host URL: http://localhost:3001"
  info "Public host URL: http://$(printf '%s' "$BACKEND_URL" | sed -E 's#^https?://([^:/]+).*#\1#'):3001"
  info "State file: $PID_FILE"
  info "Logs: $LOG_ROOT"
  info "Use PIDs from the state file to stop started processes."
}

main "$@"
