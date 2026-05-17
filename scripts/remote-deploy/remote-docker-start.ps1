# ============================================================
# Step 2: Start remote Docker containers
# ============================================================
# 
# Purpose: SSH to remote server, build image and start Docker containers
# 
# Usage:
#   .\remote-docker-start.ps1                # Start core services
#   .\remote-docker-start.ps1 -Profile full  # Start all services (with observability)
# ============================================================

param(
    [string]$RemoteHost = "84.247.154.52",
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [ValidateSet("", "full")]
    [string]$Profile = ""
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - Step 2: Start Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget ($RemoteHost)" -ForegroundColor Yellow
Write-Host "Deploy Dir: $RemoteDir" -ForegroundColor Yellow
if ($Profile) {
    Write-Host "Mode: $Profile (full services with observability)" -ForegroundColor Yellow
} else {
    Write-Host "Mode: Core services (host-shell, postgres, kafka, redis)" -ForegroundColor Yellow
}
Write-Host ""

# Build start command
if ($Profile) {
    $ComposeCmd = "cd $RemoteDir && docker compose --profile $Profile up -d --build"
} else {
    $ComposeCmd = "cd $RemoteDir && docker compose up -d --build"
}

Write-Host "[1/3] Building and starting containers..." -ForegroundColor Cyan
Write-Host "  Command: $ComposeCmd" -ForegroundColor Gray
Write-Host ""

# 分步执行避免 heredoc 的 Windows 换行问题
Write-Host "Starting containers..." -ForegroundColor Cyan
ssh $SshTarget "$ComposeCmd"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start containers (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/3] Waiting for containers to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[3/3] Container Status:" -ForegroundColor Cyan
ssh $SshTarget "cd $RemoteDir && docker compose ps"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Startup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  - Host Shell API: http://${RemoteHost}:8081" -ForegroundColor White
Write-Host "  - Health Check:   http://${RemoteHost}:8081/actuator/health" -ForegroundColor White
if ($Profile -eq "full") {
    Write-Host "  - Jaeger UI:      http://${RemoteHost}:16686" -ForegroundColor White
    Write-Host "  - Prometheus:     http://${RemoteHost}:9090" -ForegroundColor White
    Write-Host "  - Grafana:        http://${RemoteHost}:3000 (admin/admin123)" -ForegroundColor White
}
Write-Host ""
Write-Host "Other commands:" -ForegroundColor Yellow
Write-Host "  - View logs:   .\remote-docker-logs.ps1" -ForegroundColor White
Write-Host "  - Check status: .\remote-docker-status.ps1" -ForegroundColor White
Write-Host "  - Stop:        .\remote-docker-stop.ps1" -ForegroundColor White
Write-Host ""
