# ============================================================
# View remote Docker container logs
# ============================================================
# 
# Purpose: View container logs on remote server in real-time
# 
# Usage:
#   .\remote-docker-logs.ps1                    # View host-shell logs
#   .\remote-docker-logs.ps1 -Service postgres  # View postgres logs
#   .\remote-docker-logs.ps1 -DevSmtp -Service mailpit
#   .\remote-docker-logs.ps1 -All               # View all service logs
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [ValidateSet("host-shell", "postgres", "kafka", "redis", "minio", "mailpit", "otel-collector", "jaeger", "prometheus", "grafana")]
    [string]$Service = "host-shell",
    [switch]$All,
    [int]$Lines = 100,
    [switch]$DevSmtp
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - View Logs" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
if ($DevSmtp) {
    Write-Host "Dev SMTP: enabled (Mailpit compose overlay)" -ForegroundColor Yellow
}
Write-Host "(Press Ctrl+C to exit log view)" -ForegroundColor Gray
Write-Host ""

if ($Service -eq "mailpit" -and -not $DevSmtp) {
    Write-Host "ERROR: Mailpit logs require -DevSmtp because mailpit is defined in docker-compose.dev-smtp.yml." -ForegroundColor Red
    Write-Host "Run: .\remote-docker-logs.ps1 -DevSmtp -Service mailpit" -ForegroundColor Yellow
    exit 1
}

$ComposeFiles = "-f docker-compose.yml"
if ($DevSmtp) {
    $ComposeFiles = "$ComposeFiles -f docker-compose.dev-smtp.yml"
}

if ($All) {
    $LogCmd = "cd $RemoteDir && docker compose $ComposeFiles logs -f --tail=$Lines"
} else {
    $LogCmd = "cd $RemoteDir && docker compose $ComposeFiles logs -f --tail=$Lines $Service"
}

Write-Host "Viewing logs: $Service" -ForegroundColor Cyan
Write-Host ""

ssh $SshTarget $LogCmd
