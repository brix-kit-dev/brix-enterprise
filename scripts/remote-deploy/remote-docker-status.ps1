# ============================================================
# Check remote Docker container status
# ============================================================
# 
# Purpose: View container running status on remote server
# 
# Usage:
#   .\remote-docker-status.ps1
#   .\remote-docker-status.ps1 -DevSmtp
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [switch]$DevSmtp
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - Container Status" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
if ($DevSmtp) {
    Write-Host "Dev SMTP: enabled (Mailpit compose overlay)" -ForegroundColor Yellow
}
Write-Host ""

$ComposeFiles = "-f docker-compose.yml"
if ($DevSmtp) {
    $ComposeFiles = "$ComposeFiles -f docker-compose.dev-smtp.yml"
}

# 使用 bash -c 执行多个命令
ssh $SshTarget "bash -c 'echo === Container Status ===; cd $RemoteDir && docker compose $ComposeFiles --profile full ps -a; echo; echo === Resource Usage ===; docker stats --no-stream; echo; echo === Health Check ===; curl -s http://localhost:8081/actuator/health | head -c 300'"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
