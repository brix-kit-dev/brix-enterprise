# ============================================================================
# start-stack.ps1 — Phase 3 / C-5
#
# Boots the local backend stack required by the super-admin E2E suite:
#   1. Postgres + Redis via docker compose
#   2. Spring Boot host (host-shell-standalone) via mvn spring-boot:run
#
# The Java host runs in the foreground so a developer can observe startup
# errors interactively.  Use Ctrl+C to stop the host, then `stack:down` to
# remove the containers.
#
# Environment variables expected:
#   BRIX_BOOTSTRAP_PASSWORD  Bootstrap super-admin password (defaults to
#                            "LocalDevOnly!ChangeMe" — must match
#                            tests/constants.ts).
# ============================================================================

[CmdletBinding()]
param(
    [string] $BootstrapPassword = $env:BRIX_BOOTSTRAP_PASSWORD,
    [switch] $SkipDocker
)

$ErrorActionPreference = 'Stop'

if (-not $BootstrapPassword) {
    $BootstrapPassword = 'LocalDevOnly!ChangeMe'
    Write-Host "BRIX_BOOTSTRAP_PASSWORD not set — using local-dev default." -ForegroundColor Yellow
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$suiteRoot = Split-Path -Parent $here
$repoRoot = Resolve-Path (Join-Path $suiteRoot '..\..')
$hostModule = Join-Path $repoRoot 'packages\@brix\enterprise-host\host-shell-standalone'

if (-not $SkipDocker) {
    Write-Host "==> Starting Postgres + Redis (docker compose)..." -ForegroundColor Cyan
    Push-Location $suiteRoot
    try {
        docker compose up -d
    } finally {
        Pop-Location
    }
}

# Wait for Postgres health.
Write-Host "==> Waiting for Postgres to become healthy..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    $status = docker inspect --format '{{.State.Health.Status}}' brix-e2e-postgres 2>$null
    if ($status -eq 'healthy') { break }
    Start-Sleep -Seconds 2
}
if ($status -ne 'healthy') {
    throw "Postgres did not become healthy within 60s (last status: $status)."
}

Write-Host "==> Booting Spring Boot host on :8081..." -ForegroundColor Cyan
$env:DB_HOST = 'localhost'
$env:DB_PORT = '55432'
$env:DB_NAME = 'brix_platform'
$env:DB_USERNAME = 'brix'
$env:DB_PASSWORD = 'brix_local_e2e'
$env:REDIS_HOST = 'localhost'
$env:REDIS_PORT = '56379'
$env:BRIX_BOOTSTRAP_PASSWORD = $BootstrapPassword
$env:SPRING_PROFILES_ACTIVE = 'standalone'

Push-Location $hostModule
try {
    mvn spring-boot:run
} finally {
    Pop-Location
}
