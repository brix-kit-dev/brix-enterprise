# ============================================================
# Step: Rebuild Docker Images on Remote Server
# ============================================================
# 
# Purpose: SSH to remote server and rebuild Docker images
# 
# Usage: .\remote-docker-rebuild.ps1 [-NoCache]
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Docker Rebuild Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
Write-Host "Remote Dir: $RemoteDir" -ForegroundColor Yellow
Write-Host ""

# Build command
$buildCmd = "docker compose build"
if ($NoCache) {
    $buildCmd = "docker compose build --no-cache"
    Write-Host "Mode: No Cache (full rebuild)" -ForegroundColor Yellow
} else {
    Write-Host "Mode: Normal (use cache)" -ForegroundColor Yellow
}
Write-Host ""

# 使用分号连接命令避免 Windows CRLF 换行问题
$AllCommands = "echo '=== [1/3] Stopping existing containers ==='; cd $RemoteDir && docker compose down; echo ''; echo '=== [2/3] Rebuilding Docker images ==='; cd $RemoteDir && $buildCmd; echo ''; echo '=== [3/3] Starting containers ==='; cd $RemoteDir && docker compose up -d; echo ''; echo '=== Container Status ==='; cd $RemoteDir && docker compose ps"

Write-Host "Executing rebuild..." -ForegroundColor Cyan
ssh $SshTarget "$AllCommands"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Rebuild failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Rebuild Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check status: .\remote-docker-status.ps1" -ForegroundColor Yellow
Write-Host "View logs: .\remote-docker-logs.ps1" -ForegroundColor Yellow
Write-Host ""
