#!/usr/bin/env bash
set -Eeuo pipefail

VERSION="1.1.0"
START_TIME="$(date +%s)"

MODE="Full"
SKIP_TESTS=true
RUN_ARCH_GUARD=false
RUN_COMPLIANCE_CHECK=false
CLEAN=false
PARALLEL=false

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIX_ENTERPRISE_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${BRIX_ENTERPRISE_PATH}/.." && pwd)"

if [[ -d "${WORKSPACE_ROOT}/brix" ]]; then
  BRIX_PATH="${WORKSPACE_ROOT}/brix"
else
  BRIX_PATH="${BRIX_ENTERPRISE_PATH}/brix"
fi

ARCH_COMPLIANCE_SCRIPT="${BRIX_ENTERPRISE_PATH}/packages/@brix/enterprise-solutions/scripts/architecture-compliance-check.ps1"
declare -A BUILD_RESULTS=()
OVERALL_SUCCESS=true

usage() {
  cat <<'EOF'
========================================================================
                Brix Platform Ubuntu Backend Build Script
========================================================================

Usage:
  ./scripts/build-backend.sh [options]

Build modes:
  --mode Full          Build brix core and brix-enterprise (default)
  --mode Core          Build only brix core
  --mode Enterprise    Build only brix-enterprise
  --mode Quick         Same backend-only compile path, kept for compatibility

Options:
  --skip-tests                  Skip unit tests (default for backend compile)
  --run-arch-guard              Run ArchUnit architecture tests
  --run-compliance-check        Run architecture compliance check
  --clean                       Run Maven clean before install
  --parallel                    Enable Maven parallel build (-T 1C)
  --help, -h, -?                Show this help

PowerShell-style options are also accepted:
  -Mode Quick -Clean -Parallel

Examples:
  ./scripts/build-backend.sh
  ./scripts/build-backend.sh --mode Quick
  ./scripts/build-backend.sh --clean --parallel
  ./scripts/build-backend.sh --run-arch-guard --run-compliance-check

Requirements:
  - JDK 17+
  - Maven 3.8+

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
  printf '[OK] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
}

normalize_mode() {
  case "${1:-}" in
    Full|full) echo "Full" ;;
    Core|core) echo "Core" ;;
    Enterprise|enterprise) echo "Enterprise" ;;
    Quick|quick) echo "Quick" ;;
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
      --skip-tests|-SkipTests|-skipTests)
        SKIP_TESTS=true
        shift
        ;;
      --run-arch-guard|-RunArchGuard|-runArchGuard)
        RUN_ARCH_GUARD=true
        shift
        ;;
      --run-compliance-check|-RunComplianceCheck|-runComplianceCheck)
        RUN_COMPLIANCE_CHECK=true
        shift
        ;;
      --clean|-Clean|-clean)
        CLEAN=true
        shift
        ;;
      --parallel|-Parallel|-parallel)
        PARALLEL=true
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

check_environment() {
  step "Checking environment..."

  if [[ -n "${JAVA_HOME:-}" && -d "${JAVA_HOME}/bin" ]]; then
    export PATH="${JAVA_HOME}/bin:${PATH}"
  fi

  if [[ -n "${MAVEN_HOME:-}" && -d "${MAVEN_HOME}/bin" ]]; then
    export PATH="${MAVEN_HOME}/bin:${PATH}"
  elif [[ -n "${M2_HOME:-}" && -d "${M2_HOME}/bin" ]]; then
    export PATH="${M2_HOME}/bin:${PATH}"
  fi

  if ! command_exists java; then
    fail "Java not found. Please install JDK 17+ or set JAVA_HOME."
    exit 1
  fi

  local java_version
  java_version="$(java -version 2>&1 | head -n 1)"
  info "Java: ${java_version}"
  info "JAVA_HOME: ${JAVA_HOME:-<not set>}"

  if ! command_exists mvn; then
    fail "Maven not found. Please install Maven 3.8+ or set MAVEN_HOME."
    exit 1
  fi

  local mvn_version
  mvn_version="$(mvn --version | head -n 1)"
  info "Maven: ${mvn_version}"

}

run_in_dir() {
  local dir="$1"
  shift

  (cd "$dir" && "$@")
}

invoke_maven_build() {
  local project_path="$1"
  local project_name="$2"
  local skip_tests="$3"
  local clean="$4"
  local parallel="$5"
  local include_arch_guard="$6"

  step "Building ${project_name}..."

  if [[ ! -d "$project_path" ]]; then
    fail "Project path not found: ${project_path}"
    return 1
  fi

  local mvn_args=()

  if [[ "$clean" == true ]]; then
    mvn_args+=("clean")
  fi

  mvn_args+=("install")

  if [[ "$project_name" == "brix-enterprise" ]]; then
    mvn_args+=("-pl" "!:host-standalone-web")
  fi

  if [[ "$skip_tests" == true && "$include_arch_guard" == false ]]; then
    mvn_args+=("-DskipTests")
  fi

  if [[ "$parallel" == true ]]; then
    mvn_args+=("-T" "1C")
  fi

  mvn_args+=("-B" "--no-transfer-progress")

  info "Running: mvn ${mvn_args[*]}"

  if run_in_dir "$project_path" mvn "${mvn_args[@]}"; then
    success "${project_name} build successful"
    return 0
  fi

  fail "${project_name} build failed"
  return 1
}

test_architecture_guard() {
  local project_path="$1"
  local project_name="$2"

  step "Running ArchUnit architecture tests for ${project_name}..."

  if [[ ! -d "$project_path" ]]; then
    fail "Project path not found: ${project_path}"
    return 1
  fi

  local mvn_args=(
    "test"
    "-Dtest=*ArchitectureTest,*ArchGuardTest,*RedLineTest"
    "-DfailIfNoTests=false"
    "-B"
  )

  info "Running: mvn ${mvn_args[*]}"

  if run_in_dir "$project_path" mvn "${mvn_args[@]}"; then
    success "Architecture tests passed for ${project_name}"
    return 0
  fi

  fail "Architecture tests failed for ${project_name}"
  return 1
}

invoke_compliance_check() {
  step "Running architecture compliance check..."

  if [[ ! -f "$ARCH_COMPLIANCE_SCRIPT" ]]; then
    fail "Compliance check script not found: ${ARCH_COMPLIANCE_SCRIPT}"
    return 1
  fi

  if ! command_exists pwsh; then
    fail "PowerShell (pwsh) not found. It is required to run the existing compliance check script on Ubuntu."
    return 1
  fi

  local solutions_path="${BRIX_ENTERPRISE_PATH}/packages/@brix/enterprise-solutions"
  info "Checking: ${solutions_path}"

  if pwsh "$ARCH_COMPLIANCE_SCRIPT" -RepositoryPath "$solutions_path" -OutputFormat Console; then
    success "Architecture compliance check completed"
    return 0
  fi

  fail "Architecture compliance check failed"
  return 1
}

record_result() {
  local key="$1"
  local status="$2"

  BUILD_RESULTS["$key"]="$status"
  if [[ "$status" != true ]]; then
    OVERALL_SUCCESS=false
  fi
}

maybe_build_core() {
  [[ "$MODE" == "Full" || "$MODE" == "Core" || "$MODE" == "Quick" ]]
}

maybe_build_enterprise() {
  [[ "$MODE" == "Full" || "$MODE" == "Enterprise" || "$MODE" == "Quick" ]]
}

main() {
  parse_args "$@"

  header "Brix Platform Backend Build Script v${VERSION}"

  info "Mode: ${MODE}"
  info "Tests: skipped (backend compile only)"
  info "Run ArchGuard: ${RUN_ARCH_GUARD}"
  info "Run Compliance Check: ${RUN_COMPLIANCE_CHECK}"
  info "Clean: ${CLEAN}"
  info "Parallel: ${PARALLEL}"
  info "Brix Path: ${BRIX_PATH}"
  info "Brix Enterprise Path: ${BRIX_ENTERPRISE_PATH}"
  printf '\n'

  check_environment

  if maybe_build_core; then
    header "Building Brix Core (Open Source)"

    local skip_tests_for_core="$SKIP_TESTS"
    if [[ "$MODE" == "Quick" ]]; then
      skip_tests_for_core=true
    fi

    if invoke_maven_build "$BRIX_PATH" "brix-core" "$skip_tests_for_core" "$CLEAN" "$PARALLEL" "$RUN_ARCH_GUARD"; then
      record_result "brix-core" true
    else
      record_result "brix-core" false
    fi
  fi

  if maybe_build_enterprise; then
    header "Building Brix Enterprise"

    local skip_tests_for_enterprise="$SKIP_TESTS"
    if [[ "$MODE" == "Quick" ]]; then
      skip_tests_for_enterprise=true
    fi

    if invoke_maven_build "$BRIX_ENTERPRISE_PATH" "brix-enterprise" "$skip_tests_for_enterprise" "$CLEAN" "$PARALLEL" "$RUN_ARCH_GUARD"; then
      record_result "brix-enterprise" true
    else
      record_result "brix-enterprise" false
    fi
  fi


  if [[ "$RUN_ARCH_GUARD" == true && "$OVERALL_SUCCESS" == true ]]; then
    header "Running Architecture Guard Tests"

    if [[ "$MODE" == "Full" || "$MODE" == "Core" ]]; then
      if test_architecture_guard "$BRIX_PATH" "brix-core"; then
        record_result "arch-guard-core" true
      else
        record_result "arch-guard-core" false
      fi
    fi

    if [[ "$MODE" == "Full" || "$MODE" == "Enterprise" ]]; then
      if test_architecture_guard "$BRIX_ENTERPRISE_PATH" "brix-enterprise"; then
        record_result "arch-guard-enterprise" true
      else
        record_result "arch-guard-enterprise" false
      fi
    fi
  fi

  if [[ "$RUN_COMPLIANCE_CHECK" == true && "$OVERALL_SUCCESS" == true ]]; then
    header "Running Architecture Compliance Check"

    if invoke_compliance_check; then
      record_result "compliance-check" true
    else
      record_result "compliance-check" false
    fi
  fi

  header "Build Summary"

  local key status
  for key in "${!BUILD_RESULTS[@]}"; do
    status="FAILED"
    if [[ "${BUILD_RESULTS[$key]}" == true ]]; then
      status="PASSED"
    fi
    printf '  %s : %s\n' "$key" "$status"
  done | sort

  local end_time duration
  end_time="$(date +%s)"
  duration="$((end_time - START_TIME))"

  printf '\nDuration: %02d:%02d:%02d\n' "$((duration / 3600))" "$(((duration % 3600) / 60))" "$((duration % 60))"

  if [[ "$OVERALL_SUCCESS" == true ]]; then
    printf '\n*** BUILD SUCCESSFUL ***\n\n'
    exit 0
  fi

  printf '\n*** BUILD FAILED ***\n\n'
  exit 1
}

main "$@"
