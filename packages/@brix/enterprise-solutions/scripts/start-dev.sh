#!/usr/bin/env bash
# ============================================================
# Shinwa Solutions - Unified Development Startup Script (Unix)
# ============================================================
#
# This script starts the development environment for any 
# shinwa-app-* module.
#
# Usage:
#   ./start-dev.sh <module-name> [options]
#
# Examples:
#   ./start-dev.sh identity
#   ./start-dev.sh products --skip-docker
#   ./start-dev.sh contracts --skip-frontend --rebuild
#
# Options:
#   --skip-docker     Skip starting Docker infrastructure
#   --skip-backend    Skip starting the backend service
#   --skip-frontend   Skip starting the frontend dev server
#   --rebuild         Force Maven rebuild before starting
#
# 使用说明：
#   此脚本为所有 shinwa-app-* 模块提供统一的开发环境启动方式
#   支持跳过特定组件以加速开发循环
#
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Helper functions
header() { echo -e "\n${CYAN}=== $1 ===${NC}"; }
step() { echo -e "  ${GREEN}→ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
error() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "    ${GRAY}$1${NC}"; }

# Parse arguments
MODULE=""
SKIP_DOCKER=false
SKIP_BACKEND=false
SKIP_FRONTEND=false
REBUILD=false

show_help() {
    cat << EOF
Usage: $0 <module-name> [options]

Arguments:
  module-name       Module to start (identity, products, contracts, partners, 
                    booking, carousel, messenger, notifications)

Options:
  --skip-docker     Skip starting Docker infrastructure
  --skip-backend    Skip starting the backend service  
  --skip-frontend   Skip starting the frontend dev server
  --rebuild         Force Maven rebuild before starting
  -h, --help        Show this help message

Examples:
  $0 identity                    # Start identity with all components
  $0 products --skip-docker      # Start products, Docker already running
  $0 contracts --rebuild         # Start contracts with fresh build
EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        -*)
            error "Unknown option: $1"
            ;;
        *)
            if [[ -z "$MODULE" ]]; then
                MODULE=$1
            else
                error "Multiple modules specified. Only one module allowed."
            fi
            shift
            ;;
    esac
done

# Validate module
if [[ -z "$MODULE" ]]; then
    echo "Error: Module name is required."
    echo ""
    show_help
fi

VALID_MODULES=("identity" "products" "contracts" "partners" "booking" "carousel" "messenger" "notifications")
if [[ ! " ${VALID_MODULES[*]} " =~ " ${MODULE} " ]]; then
    error "Invalid module: $MODULE. Valid modules: ${VALID_MODULES[*]}"
fi

# ============================================================
# Configuration
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MODULE_PATH="$ROOT_DIR/shinwa-app-$MODULE"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose-dev.yml"

# ============================================================
# Pre-flight Checks
# 前置检查
# ============================================================

header "Shinwa Solutions Dev Environment - Module: $MODULE"
echo "  Root: $ROOT_DIR"
echo "  Module: $MODULE_PATH"

# Validate module directory exists
# 验证模块目录存在
if [[ ! -d "$MODULE_PATH" ]]; then
    error "Module directory not found: $MODULE_PATH"
fi

# Check Docker availability (unless skipped)
# 检查 Docker 可用性（除非跳过）
if [[ "$SKIP_DOCKER" == false ]]; then
    step "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker or use --skip-docker"
    fi
fi

# Check JDK availability (unless skipping backend)
# 检查 JDK 可用性（除非跳过后端）
if [[ "$SKIP_BACKEND" == false ]]; then
    step "Checking JDK..."
    if ! command -v java &> /dev/null; then
        error "JDK not found. Please install JDK 17 or later."
    fi
    info "$(java -version 2>&1 | head -n 1)"
    
    step "Checking Maven..."
    if ! command -v mvn &> /dev/null; then
        error "Maven not found. Please install Maven."
    fi
    info "$(mvn -version 2>&1 | head -n 1)"
fi

# ============================================================
# Docker Infrastructure
# Docker 基础设施
# ============================================================

if [[ "$SKIP_DOCKER" == false ]]; then
    header "Starting Docker Infrastructure"
    
    step "Starting PostgreSQL, Redis, MailHog..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    step "Waiting for services to be healthy..."
    max_retries=30
    retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if docker exec shinwa-dev-postgres pg_isready -U brix > /dev/null 2>&1; then
            info "PostgreSQL: Ready"
            break
        fi
        sleep 1
        ((retry_count++))
    done
    
    if [[ $retry_count -ge $max_retries ]]; then
        warn "PostgreSQL may not be fully ready. Proceeding anyway..."
    fi
    
    echo ""
    info "Infrastructure URLs:"
    info "  PostgreSQL: localhost:5432"
    info "  Redis:      localhost:6379"
    info "  Adminer:    http://localhost:8092"
    info "  MailHog:    http://localhost:8025"
fi

# ============================================================
# Backend Service
# 后端服务
# ============================================================

if [[ "$SKIP_BACKEND" == false ]]; then
    header "Starting Backend Service"
    
    pushd "$MODULE_PATH" > /dev/null
    
    # Check for pom.xml
    if [[ ! -f "pom.xml" ]]; then
        warn "No pom.xml found in $MODULE_PATH. Skipping backend."
    else
        if [[ "$REBUILD" == true ]]; then
            step "Building with Maven (clean install)..."
            mvn clean install -DskipTests
        fi
        
        step "Starting Spring Boot application..."
        echo -e "    ${YELLOW}Press Ctrl+C to stop the application${NC}"
        
        # Start in background if frontend also needs to run
        # 如果前端也需要运行，则在后台启动
        if [[ "$SKIP_FRONTEND" == false && -f "$MODULE_PATH/frontend/package.json" ]]; then
            mvn spring-boot:run &
            BACKEND_PID=$!
            info "Backend started in background (PID: $BACKEND_PID)"
            
            # Trap to cleanup on exit
            trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
        else
            mvn spring-boot:run
        fi
    fi
    
    popd > /dev/null
fi

# ============================================================
# Frontend Dev Server (if exists)
# 前端开发服务器（如果存在）
# ============================================================

if [[ "$SKIP_FRONTEND" == false ]]; then
    FRONTEND_PATH="$MODULE_PATH/frontend"
    
    if [[ -f "$FRONTEND_PATH/package.json" ]]; then
        header "Starting Frontend Dev Server"
        
        pushd "$FRONTEND_PATH" > /dev/null
        
        step "Installing dependencies..."
        pnpm install
        
        step "Starting dev server..."
        pnpm dev
        
        popd > /dev/null
    else
        info "No frontend found for $MODULE module"
    fi
fi

header "Development Environment Ready"
echo -e "  ${GREEN}Module: shinwa-app-$MODULE${NC}"
