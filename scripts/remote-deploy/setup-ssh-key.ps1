# ============================================================
# Setup SSH Key Authentication (One-time setup)
# ============================================================
# 
# Purpose: Configure SSH key authentication to remote server
#          After running this script, you won't need to enter
#          password for any remote deploy scripts.
# 
# Usage: .\setup-ssh-key.ps1
# ============================================================

param(
    [string]$RemoteHost = "84.247.154.52",
    [string]$RemoteUser = "deploy"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SSH Key Authentication Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Server: $RemoteUser@$RemoteHost" -ForegroundColor Yellow
Write-Host ""

$SshDir = "$env:USERPROFILE\.ssh"
$KeyFile = "$SshDir\id_rsa"
$PubKeyFile = "$SshDir\id_rsa.pub"

# Step 1: Check if SSH key exists
if (Test-Path $PubKeyFile) {
    Write-Host "[1/3] SSH key already exists: $PubKeyFile" -ForegroundColor Green
} else {
    Write-Host "[1/3] Generating SSH key pair..." -ForegroundColor Cyan
    
    # Create .ssh directory if not exists
    if (-not (Test-Path $SshDir)) {
        New-Item -ItemType Directory -Path $SshDir -Force | Out-Null
    }
    
    # Generate key (no passphrase for convenience)
    ssh-keygen -t rsa -b 4096 -f $KeyFile -N '""' -q
    Write-Host "  SSH key generated" -ForegroundColor Green
}

# Step 2: Copy public key to remote server
Write-Host ""
Write-Host "[2/3] Copying public key to remote server..." -ForegroundColor Cyan
Write-Host "  (Enter password ONE LAST TIME)" -ForegroundColor Yellow
Write-Host ""

$PubKey = Get-Content $PubKeyFile -Raw
$PubKey = $PubKey.Trim()

# Use ssh to append key to authorized_keys
$Command = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys"
ssh "$RemoteUser@$RemoteHost" $Command

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Public key copied" -ForegroundColor Green
} else {
    Write-Host "  Failed to copy public key" -ForegroundColor Red
    exit 1
}

# Step 3: Test connection
Write-Host ""
Write-Host "[3/3] Testing SSH connection (should not ask for password)..." -ForegroundColor Cyan
$TestResult = ssh -o BatchMode=yes -o ConnectTimeout=5 "$RemoteUser@$RemoteHost" "echo 'SSH key authentication successful'"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Setup Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "SSH key authentication is now configured." -ForegroundColor Green
    Write-Host "You can run all remote-deploy scripts without entering password." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "  SSH key test failed. You may still need to enter password." -ForegroundColor Yellow
}
