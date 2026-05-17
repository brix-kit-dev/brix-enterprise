# ============================================================
# Step 1: Deploy files to remote server
# ============================================================
# 
# Purpose: Package host-shell-standalone files and upload to remote server
# 
# Usage: .\deploy-to-remote.ps1
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [string]$RemoteDir = "/home/deploy/host-shell-standalone"
)

$ErrorActionPreference = "Stop"

# Source directory
$SourceDir = "d:\1.Sources\brix-enterprise\packages\@brix\enterprise-host\host-shell-standalone"
$TempDir = "$env:TEMP\host-shell-deploy"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - Step 1: Upload" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
Write-Host "Remote Dir: $RemoteDir" -ForegroundColor Yellow
Write-Host "Source Dir: $SourceDir" -ForegroundColor Yellow
Write-Host ""

# Check JAR file exists
$JarFile = Get-ChildItem "$SourceDir\target\*-exec.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $JarFile) {
    Write-Host "ERROR: JAR file not found, please run Maven build first" -ForegroundColor Red
    Write-Host "  cd $SourceDir" -ForegroundColor Gray
    Write-Host "  mvn clean package -DskipTests" -ForegroundColor Gray
    exit 1
}
Write-Host "Found JAR: $($JarFile.Name)" -ForegroundColor Green

# Create temp directory
Write-Host ""
Write-Host "[1/4] Preparing deploy files..." -ForegroundColor Cyan
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
New-Item -ItemType Directory -Path "$TempDir\target" -Force | Out-Null
New-Item -ItemType Directory -Path "$TempDir\grafana" -Force | Out-Null

# Copy files
Copy-Item "$SourceDir\docker-compose.yml" "$TempDir\"
Copy-Item "$SourceDir\Dockerfile" "$TempDir\"
Copy-Item "$SourceDir\otel-collector-config.yaml" "$TempDir\"
Copy-Item "$SourceDir\prometheus.yml" "$TempDir\"
Copy-Item "$SourceDir\start.sh" "$TempDir\"
Copy-Item $JarFile.FullName "$TempDir\target\"

# Copy .env file (if exists)
if (Test-Path "$SourceDir\.env") {
    Copy-Item "$SourceDir\.env" "$TempDir\"
} else {
    # Create default .env file
    $envContent = @"
# Database password (required)
DB_PASSWORD=brix123

# Grafana admin password (required for full profile)
GRAFANA_ADMIN_PASSWORD=admin123

# MinIO credentials (required - host depends on minio service for FileStorageCapability)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=brix-minio-secret-2026
MINIO_BUCKET_NAME=brix-storage

# Google OAuth2 (optional)
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret

# Token encryption key (REQUIRED for OAuth login, no default permitted)
# Generate locally: openssl rand -base64 32
# TOKEN_ENCRYPTION_KEY=replace_with_32_byte_random_base64
"@
    $envContent | Out-File -FilePath "$TempDir\.env" -Encoding ASCII
    Write-Host "  Created default .env file" -ForegroundColor Yellow
}

# Copy grafana config (if exists)
if (Test-Path "$SourceDir\grafana") {
    Copy-Item -Recurse "$SourceDir\grafana\*" "$TempDir\grafana\" -ErrorAction SilentlyContinue
}

Write-Host "  Files prepared" -ForegroundColor Green

# 创建远程目录并上传文件（合并 SSH 命令）
Write-Host ""
Write-Host "[2/4] Creating remote directory and uploading files..." -ForegroundColor Cyan

# 先用一个 SSH 创建目录
ssh $SshTarget "mkdir -p $RemoteDir/target $RemoteDir/grafana"

# 上传所有文件（SCP 必须单独调用）
scp "$TempDir\docker-compose.yml" "$TempDir\Dockerfile" "$TempDir\.env" "$TempDir\otel-collector-config.yaml" "$TempDir\prometheus.yml" "$TempDir\start.sh" "${SshTarget}:${RemoteDir}/"
scp "$TempDir\target\*.jar" "${SshTarget}:${RemoteDir}/target/"

if (Test-Path "$TempDir\grafana\*") {
    scp -r "$TempDir\grafana" "${SshTarget}:${RemoteDir}/"
}

Write-Host "  Files uploaded" -ForegroundColor Green

# 设置权限
Write-Host ""
Write-Host "[3/4] Setting permissions..." -ForegroundColor Cyan
ssh $SshTarget "chmod +x $RemoteDir/start.sh"
Write-Host "  Permissions set" -ForegroundColor Green

# Cleanup temp files
Remove-Item -Recurse -Force $TempDir

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Run .\remote-docker-start.ps1 to start Docker containers" -ForegroundColor Yellow
Write-Host ""
