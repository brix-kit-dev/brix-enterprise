# ============================================================
# SSH to remote server
# ============================================================
# 
# Purpose: Direct SSH connection to remote server for interactive operations
# 
# Usage: .\remote-ssh.ps1
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Connect to Remote Server" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connecting to: $SshTarget" -ForegroundColor Yellow
Write-Host ""

ssh $SshTarget
