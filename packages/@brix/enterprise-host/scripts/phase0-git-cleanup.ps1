# ============================================================
# Phase 0: Git History Secret Cleanup Script (PowerShell)
# ============================================================
#
# WARNING: This script REWRITES Git history!
# - All team members must re-clone after execution
# - Backup your repositories before running
#
# Prerequisites:
#   - Install BFG Repo Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
#   - Or install git-filter-repo: pip install git-filter-repo
#
# Usage:
#   1. Review this script carefully
#   2. Run in each repository root
#   3. Force push after verification
#   4. Notify all team members to re-clone
#
# ============================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Phase 0: Git History Secret Cleanup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This will REWRITE Git history!" -ForegroundColor Red
Write-Host "WARNING: All team members must RE-CLONE after execution!" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Aborted."
        exit 1
    }
}

# Define repositories to process
$repositories = @(
    "D:\1.Sources\runtime-sdk",
    "D:\1.Sources\infra-adapters",
    "D:\1.Sources\platform-commons",
    "D:\1.Sources\platform-devtools",
    "D:\1.Sources\shinwa-platform",
    "D:\1.Sources\shinwa-host-assembly",
    "D:\1.Sources\shinwa-solutions"
)

# Files to remove from Git history
$secretFiles = @(
    "private.pem",
    "cert.pem",
    "public.pem",
    "jwt-keystore.p12",
    "google_client_secret.json",
    ".env"
)

# BFG pattern for deletion
$bfgPattern = "{" + ($secretFiles -join ",") + "}"

foreach ($repo in $repositories) {
    if (-not (Test-Path $repo)) {
        Write-Host "Skipping: $repo (not found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "Processing: $repo" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    
    Push-Location $repo
    try {
        # Step 1: Backup .git
        if (-not $DryRun) {
            Write-Host "Step 1: Creating .git backup..." -ForegroundColor Cyan
            if (Test-Path ".git.backup") {
                Remove-Item -Recurse -Force ".git.backup"
            }
            Copy-Item -Recurse ".git" ".git.backup"
        }
        
        # Step 2: Check for secrets in history
        Write-Host "Step 2: Scanning for secrets in Git history..." -ForegroundColor Cyan
        $secretsFound = @()
        foreach ($file in $secretFiles) {
            $result = git log --all --diff-filter=A --name-only -- "*$file" 2>$null
            if ($result) {
                $secretsFound += $file
            }
        }
        
        if ($secretsFound.Count -eq 0) {
            Write-Host "  No secrets found in this repository!" -ForegroundColor Green
        } else {
            Write-Host "  Found secrets: $($secretsFound -join ', ')" -ForegroundColor Red
            
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would remove these files from history" -ForegroundColor Yellow
            } else {
                # Step 3: Remove using git-filter-repo (preferred method)
                Write-Host "Step 3: Removing secrets from history..." -ForegroundColor Cyan
                Write-Host "  Run the following command manually:" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "  # Using git-filter-repo (recommended):"
                Write-Host "  git filter-repo --invert-paths --path-glob '*.pem' --path-glob '*.p12' --path '*client_secret*' --path '.env'"
                Write-Host ""
                Write-Host "  # OR using BFG:"
                Write-Host "  java -jar bfg.jar --delete-files '$bfgPattern' ."
                Write-Host ""
            }
        }
        
        # Step 4: Verify current files are in .gitignore
        Write-Host "Step 4: Verifying .gitignore coverage..." -ForegroundColor Cyan
        if (Test-Path ".gitignore") {
            $gitignore = Get-Content ".gitignore" -Raw
            $missingPatterns = @()
            @("*.pem", "*.p12", "*.key", ".env", "*client_secret*") | ForEach-Object {
                if ($gitignore -notmatch [regex]::Escape($_)) {
                    $missingPatterns += $_
                }
            }
            if ($missingPatterns.Count -gt 0) {
                Write-Host "  WARNING: Missing patterns in .gitignore: $($missingPatterns -join ', ')" -ForegroundColor Yellow
            } else {
                Write-Host "  .gitignore is properly configured" -ForegroundColor Green
            }
        } else {
            Write-Host "  WARNING: No .gitignore found!" -ForegroundColor Red
        }
        
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Next Steps:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "1. Review each repository's scan results"
Write-Host "2. Execute the git-filter-repo or BFG commands manually"
Write-Host "3. Verify cleanup: git log --all --diff-filter=A -- '*.pem' '*.p12' '*client_secret*' '.env'"
Write-Host "4. Force push: git push --force --all; git push --force --tags"
Write-Host "5. Notify ALL team members to delete and re-clone!"
Write-Host "6. ROTATE ALL EXPOSED CREDENTIALS IMMEDIATELY!"
Write-Host "============================================================"
