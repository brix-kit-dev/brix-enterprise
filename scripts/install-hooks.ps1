<#
.SYNOPSIS
    Installs pre-commit hooks for both brix and brix-enterprise repositories.

.DESCRIPTION
    Phase 0.5 — Copies pre-commit hook scripts to .git/hooks/ directories
    in both repositories. The hooks prevent accidental commit of security-sensitive
    files (*.pem, *.p12, *.jks, etc.).

.EXAMPLE
    .\install-hooks.ps1
#>

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSScriptRoot
$repos = @(
    @{ Name = "brix"; Path = Join-Path $scriptDir "brix" },
    @{ Name = "brix-enterprise"; Path = Join-Path $scriptDir "brix-enterprise" }
)

foreach ($repo in $repos) {
    $hookSource = Join-Path $repo.Path "scripts" "pre-commit"
    $hookTarget = Join-Path $repo.Path ".git" "hooks" "pre-commit"

    if (-not (Test-Path $hookSource)) {
        Write-Warning "[$($repo.Name)] Pre-commit hook script not found: $hookSource"
        continue
    }

    $hooksDir = Join-Path $repo.Path ".git" "hooks"
    if (-not (Test-Path $hooksDir)) {
        Write-Warning "[$($repo.Name)] .git/hooks directory not found. Is this a git repository?"
        continue
    }

    Copy-Item -Path $hookSource -Destination $hookTarget -Force
    Write-Host "[OK] $($repo.Name): Pre-commit hook installed at $hookTarget" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pre-commit hooks installed successfully." -ForegroundColor Cyan
Write-Host "The hooks will block commits containing: *.pem, *.p12, *.jks, *.keystore, *.pfx, *.key, client_secret*.json" -ForegroundColor Yellow
