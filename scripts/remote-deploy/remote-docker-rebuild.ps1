# ============================================================
# Step: Rebuild Docker Images on Remote Server
# ============================================================
# 
# Purpose: SSH to remote server and rebuild Docker images
# 
# Usage:
#   .\remote-docker-rebuild.ps1
#   .\remote-docker-rebuild.ps1 -DevSmtp
#   .\remote-docker-rebuild.ps1 -NoCache
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [switch]$NoCache,
    [switch]$DevSmtp
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Docker Rebuild Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
Write-Host "Remote Dir: $RemoteDir" -ForegroundColor Yellow
if ($DevSmtp) {
    Write-Host "Dev SMTP: enabled (Mailpit compose overlay)" -ForegroundColor Yellow
}
Write-Host ""

if (-not $DevSmtp) {
    $NotificationEnvCheck = @"
cd $RemoteDir
test -f .env || exit 2
MAIL_HOST=`$(grep -E '^SPRING_MAIL_HOST=' .env | tail -n 1 | cut -d= -f2-)
LOGGING=`$(grep -E '^BRIX_PLATFORM_ADMIN_SETUP_LOGGING_NOTIFICATION_ENABLED=' .env | tail -n 1 | cut -d= -f2-)
if [ -z "`$MAIL_HOST" ] && [ "`$LOGGING" != "true" ]; then
  exit 1
fi
"@
    ssh $SshTarget $NotificationEnvCheck
    if ($LASTEXITCODE -eq 1) {
        Write-Host "ERROR: No setup-link notification adapter is configured." -ForegroundColor Red
        Write-Host "Use -DevSmtp for Mailpit, or set SPRING_MAIL_HOST and BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM in the remote .env." -ForegroundColor Red
        exit 1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to validate remote notification environment (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Build command
$ComposeFiles = "-f docker-compose.yml"
if ($DevSmtp) {
    $ComposeFiles = "$ComposeFiles -f docker-compose.dev-smtp.yml"
}

$buildCmd = "docker compose $ComposeFiles build"
if ($NoCache) {
    $buildCmd = "docker compose $ComposeFiles build --no-cache"
    Write-Host "Mode: No Cache (full rebuild)" -ForegroundColor Yellow
} else {
    Write-Host "Mode: Normal (use cache)" -ForegroundColor Yellow
}
Write-Host ""

# 使用分号连接命令避免 Windows CRLF 换行问题
$AllCommands = "echo '=== [1/3] Stopping existing containers ==='; cd $RemoteDir && docker compose $ComposeFiles down; echo ''; echo '=== [2/3] Rebuilding Docker images ==='; cd $RemoteDir && $buildCmd; echo ''; echo '=== [3/3] Starting containers ==='; cd $RemoteDir && docker compose $ComposeFiles up -d; echo ''; echo '=== Container Status ==='; cd $RemoteDir && docker compose $ComposeFiles ps"

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
