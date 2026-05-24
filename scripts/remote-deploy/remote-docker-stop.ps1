# ============================================================
# Stop remote Docker containers
# ============================================================
# 
# Purpose: Stop and remove Docker containers on remote server
# 
# Usage:
#   .\remote-docker-stop.ps1                 # Stop containers, keep volumes
#   .\remote-docker-stop.ps1 -DevSmtp        # Stop containers with Mailpit overlay
#   .\remote-docker-stop.ps1 -RemoveVolumes  # Stop and remove volumes
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [switch]$RemoveVolumes,
    [switch]$DevSmtp
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - Stop Docker" -ForegroundColor Cyan
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

if ($RemoveVolumes) {
    Write-Host "WARNING: Will delete all volumes (database, cache data will be lost)" -ForegroundColor Red
    $Confirm = Read-Host "Confirm delete? (y/N)"
    if ($Confirm -ne "y" -and $Confirm -ne "Y") {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
    $ComposeCmd = "cd $RemoteDir && docker compose $ComposeFiles --profile full down -v"
} else {
    $ComposeCmd = "cd $RemoteDir && docker compose $ComposeFiles --profile full down"
}

Write-Host "Stopping containers..." -ForegroundColor Cyan
ssh $SshTarget "$ComposeCmd"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to stop containers (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Containers Stopped" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
