<#
.SYNOPSIS
    Brix Enterprise Solutions - Unified Development Startup Script (Windows)

.DESCRIPTION
    This script starts the development environment for any app-* module.
    It handles:
    - Docker infrastructure (PostgreSQL, Redis, MailHog)
    - Backend services (Spring Boot via Maven)
    - Frontend dev server (if applicable)
    
    使用说明：
    - 此脚本为所有 app-* 模块提供统一的开发环境启动方式
    - 支持跳过特定组件以加速开发循环

.PARAMETER Module
    The module name to start (e.g., identity, products, contracts)
    模块名称（如：identity, products, contracts）

.PARAMETER SkipDocker
    Skip starting Docker infrastructure
    跳过 Docker 基础设施启动

.PARAMETER SkipBackend
    Skip starting the backend service
    跳过后端服务启动

.PARAMETER SkipFrontend
    Skip starting the frontend dev server
    跳过前端开发服务器启动

.PARAMETER Rebuild
    Force Maven rebuild before starting
    启动前强制 Maven 重新构建

.EXAMPLE
    .\start-dev.ps1 -Module identity
    # Starts the identity module with all components

.EXAMPLE
    .\start-dev.ps1 -Module products -SkipDocker
    # Starts products module, assumes Docker is already running

.EXAMPLE
    .\start-dev.ps1 -Module contracts -SkipFrontend -Rebuild
    # Starts contracts backend only with fresh build
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Module name (e.g., identity, products, contracts)")]
    [ValidateSet("identity", "products", "contracts", "partners", "booking", "carousel", "messenger", "notifications")]
    [string]$Module,

    [switch]$SkipDocker,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Rebuild
)

# ============================================================
# Configuration
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir
$ModulePath = Join-Path $RootDir "app-$Module"
$ComposeFile = Join-Path $ScriptDir "docker-compose-dev.yml"

# Colors for output
# 输出颜色定义
function Write-Header { param([string]$Text) Write-Host "`n=== $Text ===" -ForegroundColor Cyan }
function Write-Step { param([string]$Text) Write-Host "  → $Text" -ForegroundColor Green }
function Write-Warning { param([string]$Text) Write-Host "  ! $Text" -ForegroundColor Yellow }
function Write-Error { param([string]$Text) Write-Host "  ✗ $Text" -ForegroundColor Red }

# ============================================================
# Pre-flight Checks
# 前置检查
# ============================================================

Write-Header "Brix Enterprise Solutions Dev Environment - Module: $Module"
Write-Host "  Root: $RootDir"
Write-Host "  Module: $ModulePath"

# Validate module directory exists
# 验证模块目录存在
if (-not (Test-Path $ModulePath)) {
    Write-Error "Module directory not found: $ModulePath"
    exit 1
}

# Check Docker availability (unless skipped)
# 检查 Docker 可用性（除非跳过）
if (-not $SkipDocker) {
    Write-Step "Checking Docker..."
    try {
        $null = docker info 2>&1
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop or use -SkipDocker"
        exit 1
    }
}

# Check JDK availability (unless skipping backend)
# 检查 JDK 可用性（除非跳过后端）
if (-not $SkipBackend) {
    Write-Step "Checking JDK..."
    try {
        $javaVersion = java -version 2>&1 | Select-Object -First 1
        Write-Host "    Java: $javaVersion" -ForegroundColor Gray
    }
    catch {
        Write-Error "JDK not found. Please install JDK 17 or later."
        exit 1
    }
    
    # Check Maven
    Write-Step "Checking Maven..."
    try {
        $mvnVersion = mvn -version 2>&1 | Select-Object -First 1
        Write-Host "    Maven: $mvnVersion" -ForegroundColor Gray
    }
    catch {
        Write-Error "Maven not found. Please install Maven."
        exit 1
    }
}

# ============================================================
# Docker Infrastructure
# Docker 基础设施
# ============================================================

if (-not $SkipDocker) {
    Write-Header "Starting Docker Infrastructure"
    
    Push-Location $ScriptDir
    try {
        Write-Step "Starting PostgreSQL, Redis, MailHog..."
        docker compose -f $ComposeFile up -d
        
        Write-Step "Waiting for services to be healthy..."
        $maxRetries = 30
        $retryCount = 0
        
        while ($retryCount -lt $maxRetries) {
            $pgReady = docker exec brix-dev-postgres pg_isready -U brix 2>&1
            if ($pgReady -match "accepting connections") {
                Write-Host "    PostgreSQL: Ready" -ForegroundColor Gray
                break
            }
            Start-Sleep -Seconds 1
            $retryCount++
        }
        
        if ($retryCount -ge $maxRetries) {
            Write-Warning "PostgreSQL may not be fully ready. Proceeding anyway..."
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
    Write-Host "  Infrastructure URLs:" -ForegroundColor Gray
    Write-Host "    PostgreSQL: localhost:5432" -ForegroundColor Gray
    Write-Host "    Redis:      localhost:6379" -ForegroundColor Gray
    Write-Host "    Adminer:    http://localhost:8092" -ForegroundColor Gray
    Write-Host "    MailHog:    http://localhost:8025" -ForegroundColor Gray
}

# ============================================================
# Backend Service
# 后端服务
# ============================================================

if (-not $SkipBackend) {
    Write-Header "Starting Backend Service"
    
    Push-Location $ModulePath
    try {
        # Check for pom.xml
        if (-not (Test-Path "pom.xml")) {
            Write-Warning "No pom.xml found in $ModulePath. Skipping backend."
        }
        else {
            if ($Rebuild) {
                Write-Step "Building with Maven (clean install)..."
                mvn clean install -DskipTests
            }
            
            Write-Step "Starting Spring Boot application..."
            Write-Host "    Press Ctrl+C to stop the application" -ForegroundColor Yellow
            
            # Start in new window so frontend can also run
            # 在新窗口中启动，以便前端也可以运行
            if (-not $SkipFrontend) {
                Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ModulePath'; mvn spring-boot:run"
                Write-Host "    Backend started in new window" -ForegroundColor Gray
            }
            else {
                # Run in foreground if no frontend
                mvn spring-boot:run
            }
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================================
# Frontend Dev Server (if exists)
# 前端开发服务器（如果存在）
# ============================================================

if (-not $SkipFrontend) {
    $FrontendPath = Join-Path $ModulePath "frontend"
    
    if (Test-Path (Join-Path $FrontendPath "package.json")) {
        Write-Header "Starting Frontend Dev Server"
        
        Push-Location $FrontendPath
        try {
            Write-Step "Installing dependencies..."
            pnpm install
            
            Write-Step "Starting dev server..."
            pnpm dev
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Host "`n  No frontend found for $Module module" -ForegroundColor Gray
    }
}

Write-Header "Development Environment Ready"
Write-Host "  Module: app-$Module" -ForegroundColor Green
