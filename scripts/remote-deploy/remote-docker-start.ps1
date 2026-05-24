# ============================================================
# Step 2: Start remote Docker containers
# ============================================================
# 
# Purpose: SSH to remote server, build image and start Docker containers
# 
# Usage:
#   .\remote-docker-start.ps1                # Start core services
#   .\remote-docker-start.ps1 -DevSmtp       # Start core services with Mailpit SMTP
#   .\remote-docker-start.ps1 -Profile full  # Start all services (with observability)
# ============================================================

param(
    [string]$RemoteHost = "84.247.154.52",
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [ValidateSet("", "full")]
    [string]$Profile = "",
    [switch]$DevSmtp
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
if ($DevSmtp) {
    Write-Host "Dev SMTP: enabled (Mailpit, SMTP/UI bound to remote localhost:1025/8025)" -ForegroundColor Yellow
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

# Build start command
$ComposeFiles = "-f docker-compose.yml"
if ($DevSmtp) {
    $ComposeFiles = "$ComposeFiles -f docker-compose.dev-smtp.yml"
}
if ($Profile) {
    $ComposeCmd = "cd $RemoteDir && docker compose $ComposeFiles --profile $Profile down && docker compose $ComposeFiles --profile $Profile up -d --build --force-recreate"
} else {
    $ComposeCmd = "cd $RemoteDir && docker compose $ComposeFiles down && docker compose $ComposeFiles up -d --build --force-recreate"
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

if ($DevSmtp) {
    $DevSmtpEnvCheck = @"
MAIL_HOST=`$(docker inspect brix-host-shell-standalone --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^SPRING_MAIL_HOST=' | cut -d= -f2-)
MAIL_PORT=`$(docker inspect brix-host-shell-standalone --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^SPRING_MAIL_PORT=' | cut -d= -f2-)
if [ "`$MAIL_HOST" != "mailpit" ] || [ "`$MAIL_PORT" != "1025" ]; then
  echo "Expected SPRING_MAIL_HOST=mailpit and SPRING_MAIL_PORT=1025, got SPRING_MAIL_HOST=`$MAIL_HOST SPRING_MAIL_PORT=`$MAIL_PORT"
  exit 1
fi
"@
    ssh $SshTarget $DevSmtpEnvCheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Dev SMTP overlay did not reach the host-shell container." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host ""
Write-Host "[2/3] Waiting for containers to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[3/3] Container Status:" -ForegroundColor Cyan
ssh $SshTarget "cd $RemoteDir && docker compose $ComposeFiles ps"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Startup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  - Host Shell API: http://${RemoteHost}:8081" -ForegroundColor White
Write-Host "  - Health Check:   http://${RemoteHost}:8081/actuator/health" -ForegroundColor White
if ($DevSmtp) {
    Write-Host "  - Mailpit SMTP:   localhost:1025 after running .\tunnel.ps1" -ForegroundColor White
    Write-Host "  - Mailpit UI:     http://localhost:8025 after running .\tunnel.ps1" -ForegroundColor White
}
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
