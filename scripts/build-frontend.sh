#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.0.0"
START_TIME="$(date +%s)"

MODE="Full"
CLEAN=false
PARALLEL=false
SKIP_INSTALL=false
NODE_MAX_HEAP_MB="${NODE_MAX_HEAP_MB:-4096}"
WORKSPACE_CONCURRENCY="${WORKSPACE_CONCURRENCY:-2}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTERPRISE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_ROOT="$(cd "${ENTERPRISE_ROOT}/.." && pwd)"

if [[ -d "${SOURCE_ROOT}/brix" ]]; then
  BRIX_ROOT="${SOURCE_ROOT}/brix"
else
  BRIX_ROOT="${ENTERPRISE_ROOT}/brix"
fi

declare -A BUILD_RESULTS=()
OVERALL_SUCCESS=true
ORIG_NODE_OPTIONS="${NODE_OPTIONS:-}"
PNPM_CMD=()
PNPM_LABEL="pnpm"

usage() {
  cat <<'EOF'
========================================================================
                Brix Platform Ubuntu Frontend Build Script
========================================================================

Usage:
  ./scripts/build-frontend.sh [options]

Build modes:
  --mode Full          Build core and enterprise frontend packages (default)
  --mode Core          Build only brix core frontend packages
  --mode Enterprise    Build only brix-enterprise frontend packages
  --mode Libs          Build only core library packages

Options:
  --clean              Remove dist/ directories before build
  --parallel           Keep for compatibility; pnpm topology build is used
  --skip-install       Skip pnpm install
  --help, -h, -?       Show this help

PowerShell-style options are also accepted:
  -Mode Core -Clean -Parallel -SkipInstall

Examples:
  ./scripts/build-frontend.sh --clean
  ./scripts/build-frontend.sh --mode Core --skip-install
  ./scripts/build-frontend.sh --mode Libs --skip-install
  ./scripts/build-frontend.sh --mode Enterprise --skip-install

Requirements:
  - Node.js 18+
  - pnpm 8+ or Corepack with packageManager support

========================================================================
EOF
}

header() {
  printf '\n========================================================================\n'
  printf '  %s\n' "$1"
  printf '========================================================================\n\n'
}

step() {
  printf '[STEP] %s\n' "$1"
}

info() {
  printf '[INFO] %s\n' "$1"
}

success() {
  printf '[ OK ] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
}

format_duration() {
  local seconds="$1"
  if (( seconds >= 60 )); then
    printf '%dm %ds' "$((seconds / 60))" "$((seconds % 60))"
  else
    printf '%ds' "$seconds"
  fi
}

normalize_mode() {
  case "${1:-}" in
    Full|full) echo "Full" ;;
    Core|core) echo "Core" ;;
    Enterprise|enterprise) echo "Enterprise" ;;
    Libs|libs) echo "Libs" ;;
    *)
      fail "Invalid mode: ${1:-}"
      usage
      exit 2
      ;;
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
      --clean|-Clean|-clean)
        CLEAN=true
        shift
        ;;
      --parallel|-Parallel|-parallel)
        PARALLEL=true
        shift
        ;;
      --skip-install|-SkipInstall|-skipInstall)
        SKIP_INSTALL=true
        shift
        ;;
      --help|-h|-Help|-help|-\?)
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

major_version() {
  sed -E 's/^v?([0-9]+).*/\1/'
}

check_min_major() {
  local name="$1"
  local actual="$2"
  local required="$3"
  local major
  major="$(printf '%s' "$actual" | major_version)"

  if [[ -n "$major" && "$major" =~ ^[0-9]+$ && "$major" -lt "$required" ]]; then
    fail "$name version is too old: $actual. Required: $required+"
    exit 1
  fi
}

check_prerequisites() {
  step "Checking prerequisites..."

  if ! command_exists node; then
    fail "Node.js not found. Please install Node.js 18+."
    exit 1
  fi

  local node_version
  node_version="$(node --version)"
  check_min_major "Node.js" "$node_version" 18
  info "Node.js: $node_version"

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
  if ! pnpm_version="$("${PNPM_CMD[@]}" --version)"; then
    fail "Unable to run $PNPM_LABEL --version. Enable Corepack or install pnpm 8+."
    exit 1
  fi
  check_min_major "pnpm" "$pnpm_version" 8
  info "$PNPM_LABEL: v$pnpm_version"

  success "Prerequisites OK"
}

run_in_dir() {
  local dir="$1"
  shift

  (cd "$dir" && "$@")
}

clean_dist() {
  local project_root="$1"
  local project_name="$2"

  step "Cleaning dist/ in $project_name..."

  local count=0
  while IFS= read -r -d '' dir; do
    rm -rf "$dir"
    count=$((count + 1))
  done < <(find "$project_root" \
    -path '*/node_modules' -prune -o \
    -path '*/.git' -prune -o \
    -type d -name dist -print0)

  success "Cleaned $count dist/ directories in $project_name"
}

pnpm_install() {
  local project_root="$1"
  local project_name="$2"

  step "Installing dependencies for $project_name..."

  if run_in_dir "$project_root" "${PNPM_CMD[@]}" install --frozen-lockfile; then
    success "Dependencies installed for $project_name"
    return 0
  fi

  info "Retrying pnpm install without --frozen-lockfile..."
  if run_in_dir "$project_root" "${PNPM_CMD[@]}" install; then
    success "Dependencies installed for $project_name"
    return 0
  fi

  fail "pnpm install failed for $project_name"
  return 1
}

package_json_field() {
  local package_file="$1"
  local field="$2"

  node -e 'const fs=require("fs"); const pkg=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); const field=process.argv[2]; const value=field==="build" ? pkg.scripts?.build : pkg[field]; if (value) process.stdout.write(String(value));' "$package_file" "$field"
}

get_aggregator_package_names() {
  local project_root="$1"
  local package_file name build_script

  while IFS= read -r -d '' package_file; do
    name="$(package_json_field "$package_file" name 2>/dev/null || true)"
    build_script="$(package_json_field "$package_file" build 2>/dev/null || true)"

    if [[ -n "$name" && "$build_script" =~ pnpm[[:space:]]+(-r|--recursive|run[[:space:]]+-r) ]]; then
      printf '%s\n' "$name"
      info "  Excluding aggregator: $name ($build_script)" >&2
    fi
  done < <(find "$project_root" \
    -path '*/node_modules' -prune -o \
    -path '*/.git' -prune -o \
    -path '*/dist' -prune -o \
    -name package.json -type f -print0)
}

get_solution_ui_excludes() {
  local solution_dir="$1"
  local package_file package_name

  [[ -d "$solution_dir" ]] || return 0

  while IFS= read -r -d '' package_file; do
    package_name="$(package_json_field "$package_file" name 2>/dev/null || true)"
    if [[ -n "$package_name" && ! "$package_name" =~ -shared$ ]]; then
      printf '%s\n' "$package_name"
      info "  Skipping solution plugin: $package_name" >&2
    fi
  done < <(find "$solution_dir" \
    -path '*/node_modules' -prune -o \
    -path '*/dist' -prune -o \
    -name package.json -type f -print0)
}

append_exclude_filters() {
  local -n target_ref="$1"
  shift
  local name

  for name in "$@"; do
    [[ -n "$name" ]] && target_ref+=("--filter" "!$name")
  done
}

pnpm_build() {
  local project_root="$1"
  local project_name="$2"
  local filter="${3:-}"
  shift 3 || true
  local extra_excludes=("$@")

  local step_start
  step_start="$(date +%s)"
  step "Building $project_name..."

  info "Scanning for aggregator packages to exclude..."
  local aggregators=()
  mapfile -t aggregators < <(get_aggregator_package_names "$project_root")

  local exclude_args=()
  append_exclude_filters exclude_args "${aggregators[@]}"
  append_exclude_filters exclude_args "${extra_excludes[@]}"

  if [[ -n "$filter" ]]; then
    info "Phase 1: pnpm --filter \"$filter\" ${exclude_args[*]} --workspace-concurrency=$WORKSPACE_CONCURRENCY run build"
    if ! run_in_dir "$project_root" "${PNPM_CMD[@]}" --filter "$filter" "${exclude_args[@]}" --workspace-concurrency="$WORKSPACE_CONCURRENCY" run build; then
      fail "Filtered build failed for $project_name [$filter]"
      return 1
    fi

    info "Phase 2: pnpm -r ${exclude_args[*]} --workspace-concurrency=$WORKSPACE_CONCURRENCY run build"
    if ! run_in_dir "$project_root" "${PNPM_CMD[@]}" -r "${exclude_args[@]}" --workspace-concurrency="$WORKSPACE_CONCURRENCY" run build; then
      fail "$project_name build failed"
      return 1
    fi
  else
    info "Running: pnpm -r ${exclude_args[*]} --workspace-concurrency=$WORKSPACE_CONCURRENCY run build"
    if ! run_in_dir "$project_root" "${PNPM_CMD[@]}" -r "${exclude_args[@]}" --workspace-concurrency="$WORKSPACE_CONCURRENCY" run build; then
      fail "$project_name build failed"
      return 1
    fi
  fi

  local elapsed
  elapsed="$(( $(date +%s) - step_start ))"
  success "$project_name build completed ($(format_duration "$elapsed"))"
}

record_result() {
  local key="$1"
  local status="$2"

  BUILD_RESULTS["$key"]="$status"
  if [[ "$status" != true ]]; then
    OVERALL_SUCCESS=false
  fi
}

build_core_enabled() {
  [[ "$MODE" == "Full" || "$MODE" == "Core" || "$MODE" == "Libs" ]]
}

build_enterprise_enabled() {
  [[ "$MODE" == "Full" || "$MODE" == "Enterprise" ]]
}

main() {
  parse_args "$@"

  header "Brix Platform Frontend Builder v$VERSION"
  info "Mode: $MODE"
  info "Clean: $CLEAN"
  info "SkipInstall: $SKIP_INSTALL"
  info "Parallel: $PARALLEL"
  info "Brix Root: $BRIX_ROOT"
  info "Enterprise Root: $ENTERPRISE_ROOT"

  check_prerequisites

  if build_core_enabled && [[ ! -d "$BRIX_ROOT" ]]; then
    fail "brix repository not found at: $BRIX_ROOT"
    exit 1
  fi

  if build_enterprise_enabled && [[ ! -d "$ENTERPRISE_ROOT" ]]; then
    fail "brix-enterprise repository not found at: $ENTERPRISE_ROOT"
    exit 1
  fi

  if [[ "$CLEAN" == true ]]; then
    header "Phase 0: Clean"
    build_core_enabled && clean_dist "$BRIX_ROOT" "brix"
    build_enterprise_enabled && clean_dist "$ENTERPRISE_ROOT" "brix-enterprise"
  fi

  if [[ "$SKIP_INSTALL" == false ]]; then
    header "Phase 1: Install Dependencies"
    if build_core_enabled; then
      pnpm_install "$BRIX_ROOT" "brix" || exit 1
    fi
    if build_enterprise_enabled; then
      pnpm_install "$ENTERPRISE_ROOT" "brix-enterprise" || exit 1
    fi
  fi

  export NODE_OPTIONS="--max-old-space-size=${NODE_MAX_HEAP_MB}${ORIG_NODE_OPTIONS:+ ${ORIG_NODE_OPTIONS}}"
  info "NODE_OPTIONS: $NODE_OPTIONS"

  if build_core_enabled; then
    header "Phase 2: Build brix Core Packages"
    info "Strategy: runtime-sdk first, then all leaf packages"
    if pnpm_build "$BRIX_ROOT" "brix (Layer 1-3)" "@brix-sdk/runtime-sdk-*"; then
      record_result "brix-core" true
    else
      record_result "brix-core" false
      fail "brix core build failed. Aborting."
      export NODE_OPTIONS="$ORIG_NODE_OPTIONS"
      exit 1
    fi
  fi

  if build_enterprise_enabled; then
    header "Phase 3: Build brix-enterprise Packages"
    info "Building enterprise framework packages, host app, and shared solution packages"
    info "Solution UI plugins are excluded; they are served by their dev servers."
    local solution_excludes=()
    mapfile -t solution_excludes < <(get_solution_ui_excludes "${ENTERPRISE_ROOT}/packages/@brix/enterprise-solutions")
    if pnpm_build "$ENTERPRISE_ROOT" "brix-enterprise (Layer 4-5)" "" "${solution_excludes[@]}"; then
      record_result "brix-enterprise" true
    else
      record_result "brix-enterprise" false
      fail "brix-enterprise build failed. Aborting."
      export NODE_OPTIONS="$ORIG_NODE_OPTIONS"
      exit 1
    fi
  fi

  export NODE_OPTIONS="$ORIG_NODE_OPTIONS"

  header "Build Summary"
  local key status
  for key in "${!BUILD_RESULTS[@]}"; do
    status="FAILED"
    if [[ "${BUILD_RESULTS[$key]}" == true ]]; then
      status="PASSED"
    fi
    printf "  %s : %s\n" "$key" "$status"
  done | sort

  local total_elapsed
  total_elapsed="$(( $(date +%s) - START_TIME ))"
  case "$MODE" in
    Full) info "Mode: Full - Layer 1-5 (Core + Enterprise)" ;;
    Core) info "Mode: Core - Layer 1-3 (Core Packages)" ;;
    Enterprise) info "Mode: Enterprise - Layer 4-5 (Enterprise Packages)" ;;
    Libs) info "Mode: Libs - Layer 1-3 (Library Packages)" ;;
  esac
  success "Total time: $(format_duration "$total_elapsed")"

  if [[ "$OVERALL_SUCCESS" == true ]]; then
    printf "\n*** BUILD SUCCESSFUL ***\n\n"
    exit 0
  fi

  printf "\n*** BUILD FAILED ***\n\n"
  exit 1
}

main "$@"
