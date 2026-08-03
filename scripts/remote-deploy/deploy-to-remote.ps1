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
    [string]$RemoteDir = "/home/deploy/host-shell-standalone",
    [switch]$RotateBootstrapSetupCode
)

$ErrorActionPreference = "Stop"

# Source directory
$SourceDir = "d:\1.Sources\brix-enterprise\packages\@brix\enterprise-host\host-shell-standalone"
$TempDir = "$env:TEMP\host-shell-deploy"

function Assert-NestedJarEntry {
    param(
        [Parameter(Mandatory=$true)][string]$OuterJarPath,
        [Parameter(Mandatory=$true)][string]$NestedJarPattern,
        [Parameter(Mandatory=$true)][string]$RequiredEntry
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $outer = [System.IO.Compression.ZipFile]::OpenRead($OuterJarPath)
    $tempNested = Join-Path $env:TEMP ("brix-nested-" + [Guid]::NewGuid().ToString("N") + ".jar")
    try {
        $nestedEntry = $outer.Entries |
            Where-Object { $_.FullName -like $NestedJarPattern } |
            Select-Object -First 1
        if (-not $nestedEntry) {
            throw "Required nested jar not found: $NestedJarPattern"
        }

        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($nestedEntry, $tempNested)
        $nested = [System.IO.Compression.ZipFile]::OpenRead($tempNested)
        try {
            $entry = $nested.Entries |
                Where-Object { $_.FullName -eq $RequiredEntry } |
                Select-Object -First 1
            if (-not $entry) {
                throw "Required entry not found in $($nestedEntry.FullName): $RequiredEntry"
            }
        } finally {
            $nested.Dispose()
        }
    } finally {
        $outer.Dispose()
        if (Test-Path $tempNested) {
            Remove-Item -Force $tempNested
        }
    }
}

function Assert-PlatformBootstrapV2Jar {
    param([Parameter(Mandatory=$true)][string]$JarPath)

    Assert-NestedJarEntry `
        -OuterJarPath $JarPath `
        -NestedJarPattern "BOOT-INF/lib/platform-tenant-*.jar" `
        -RequiredEntry "db/migration/platform-tenant/V017__identity_bootstrap_state_machine.sql"
    Assert-NestedJarEntry `
        -OuterJarPath $JarPath `
        -NestedJarPattern "BOOT-INF/lib/platform-tenant-*.jar" `
        -RequiredEntry "io/brix/platform/tenant/entity/BootstrapState.class"
    Assert-NestedJarEntry `
        -OuterJarPath $JarPath `
        -NestedJarPattern "BOOT-INF/lib/platform-admin-*.jar" `
        -RequiredEntry "io/brix/platform/admin/controller/BootstrapController.class"
}

function New-RandomSetupCode {
    $bytes = New-Object byte[] 24
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    } finally {
        $rng.Dispose()
    }
    return [Convert]::ToBase64String($bytes).TrimEnd("=") -replace "\+", "-" -replace "/", "_"
}

function New-RandomBase64Aes256Key {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($bytes)
    } finally {
        $rng.Dispose()
    }
    return [Convert]::ToBase64String($bytes)
}

function Set-EnvFileValue {
    param(
        [Parameter(Mandatory=$true)][string]$EnvPath,
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string]$Value
    )

    $content = ""
    if (Test-Path $EnvPath) {
        $content = Get-Content $EnvPath -Raw
    }

    $escapedName = [regex]::Escape($Name)
    $line = "$Name=$Value"
    if ($content -match "(?m)^$escapedName=") {
        $content = [regex]::Replace($content, "(?m)^$escapedName=.*$", $line)
    } else {
        if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
            $content += "`r`n"
        }
        $content += "$line`r`n"
    }
    Set-Content -Path $EnvPath -Value $content -Encoding UTF8
}

function Assert-BootstrapV2Env {
    param([Parameter(Mandatory=$true)][string]$EnvPath)

    $content = Get-Content $EnvPath -Raw
    $banned = @(
        "BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD",
        "BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA"
    )
    foreach ($name in $banned) {
        if ($content -match "(?m)^\s*$name\s*=") {
            throw ".env still contains v1 bootstrap variable $name. Use BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE instead."
        }
    }

    $required = @(
        "BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL",
        "BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE",
        "BRIX_PLATFORM_MFA_ENCRYPTION_KEY",
        "BRIX_PLATFORM_ADMIN_SETUP_BASE_URL",
        "BRIX_TENANT_FIRST_OWNER_INVITE_BASE_URL",
        "BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM",
        "BRIX_INFRA_EMAIL_SMTP_FROM"
    )
    foreach ($name in $required) {
        if ($content -notmatch "(?m)^\s*$name\s*=\s*\S+") {
            throw ".env is missing required v2 bootstrap variable $name."
        }
    }

    $mfaKeyMatch = [regex]::Match($content, "(?m)^\s*BRIX_PLATFORM_MFA_ENCRYPTION_KEY\s*=\s*(\S+)")
    try {
        $mfaKeyBytes = [Convert]::FromBase64String($mfaKeyMatch.Groups[1].Value)
    } catch {
        throw "BRIX_PLATFORM_MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte AES key."
    }
    if ($mfaKeyBytes.Length -ne 32) {
        throw "BRIX_PLATFORM_MFA_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM."
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Remote Deploy Script - Step 1: Upload" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remote Target: $SshTarget" -ForegroundColor Yellow
Write-Host "Remote Dir: $RemoteDir" -ForegroundColor Yellow
Write-Host "Source Dir: $SourceDir" -ForegroundColor Yellow
if ($RotateBootstrapSetupCode) {
    Write-Host "Bootstrap setup code rotation: enabled" -ForegroundColor Yellow
}
Write-Host ""

$SourceEnvPath = "$SourceDir\.env"
if ($RotateBootstrapSetupCode) {
    if (-not (Test-Path $SourceEnvPath)) {
        throw "Cannot rotate BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE because $SourceEnvPath does not exist."
    }
    $GeneratedSetupCode = New-RandomSetupCode
    Set-EnvFileValue -EnvPath $SourceEnvPath -Name "BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE" -Value $GeneratedSetupCode
    Write-Host "Rotated BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE in source .env before packaging." -ForegroundColor Green
}

# Check JAR file exists
$JarFile = Get-ChildItem "$SourceDir\target\*-exec.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $JarFile) {
    Write-Host "ERROR: JAR file not found, please run Maven build first" -ForegroundColor Red
    Write-Host "  cd $SourceDir" -ForegroundColor Gray
    Write-Host "  mvn clean package -DskipTests" -ForegroundColor Gray
    exit 1
}
Write-Host "Found JAR: $($JarFile.Name)" -ForegroundColor Green
try {
    Assert-PlatformBootstrapV2Jar -JarPath $JarFile.FullName
    Write-Host "Verified JAR contains Platform Admin Bootstrap v2 artifacts" -ForegroundColor Green
} catch {
    Write-Host "ERROR: JAR does not contain Bootstrap v2 artifacts." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Build fresh platform artifacts before deploying:" -ForegroundColor Gray
    Write-Host "  cd d:\1.Sources\brix" -ForegroundColor Gray
    Write-Host "  mvn install -DskipTests" -ForegroundColor Gray
    Write-Host "  cd $SourceDir" -ForegroundColor Gray
    Write-Host "  mvn clean package -DskipTests" -ForegroundColor Gray
    exit 1
}

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
if (Test-Path "$SourceDir\docker-compose.dev-smtp.yml") {
    Copy-Item "$SourceDir\docker-compose.dev-smtp.yml" "$TempDir\"
}
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
    $GeneratedSetupCode = New-RandomSetupCode
    $GeneratedMfaEncryptionKey = New-RandomBase64Aes256Key
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

# Platform Admin setup-link delivery (dev default points at local frontend)
BRIX_PLATFORM_MFA_ISSUER=Brix
BRIX_PLATFORM_MFA_ENCRYPTION_KEY=$GeneratedMfaEncryptionKey
BRIX_PLATFORM_ADMIN_SETUP_BASE_URL=http://localhost:3001/platform/setup
BRIX_TENANT_FIRST_OWNER_INVITE_BASE_URL=http://localhost:3001/platform/first-owner/accept
BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM=platform-admin@brix.local
BRIX_INFRA_EMAIL_SMTP_FROM=platform-admin@brix.local

# Bootstrap v2: passwordless setup anchor
BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED=true
BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=ops-bootstrap@example.invalid
BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME=Bootstrap Setup
BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE=$GeneratedSetupCode
"@
    $envContent | Out-File -FilePath "$TempDir\.env" -Encoding ASCII
    Write-Host "  Created default .env file" -ForegroundColor Yellow
}

try {
    Assert-BootstrapV2Env -EnvPath "$TempDir\.env"
    Write-Host "  Verified .env uses Bootstrap v2 variables" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Bootstrap v2 environment validation failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
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
$ComposeFiles = @("$TempDir\docker-compose.yml")
if (Test-Path "$TempDir\docker-compose.dev-smtp.yml") {
    $ComposeFiles += "$TempDir\docker-compose.dev-smtp.yml"
}
scp $ComposeFiles "$TempDir\Dockerfile" "$TempDir\.env" "$TempDir\otel-collector-config.yaml" "$TempDir\prometheus.yml" "$TempDir\start.sh" "${SshTarget}:${RemoteDir}/"
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
