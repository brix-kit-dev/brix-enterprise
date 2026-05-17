<#
.SYNOPSIS
    停止 Verdaccio 本地 npm registry

.DESCRIPTION
    查找并停止 Verdaccio 进程。

.EXAMPLE
    .\stop-verdaccio.ps1

.NOTES
    Version: 1.0.0
#>

$ErrorActionPreference = "Continue"

$Script:VerdaccioPort = 4873

function Write-Step { param([string]$Message) Write-Host "[STEP] $Message" -ForegroundColor Cyan }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor White }
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stop Verdaccio" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Step "Finding Verdaccio process..."

$stopped = $false

# 通过端口查找进程
$netstatOutput = netstat -ano 2>$null | Select-String ":$Script:VerdaccioPort\s.*LISTENING"
if ($netstatOutput) {
    foreach ($line in $netstatOutput) {
        $parts = $line -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$' -and [int]$pid -gt 0) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Info "Stopping process: $($process.Name) (PID: $pid)"
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                $stopped = $true
            }
        }
    }
}

if ($stopped) {
    Write-Success "Verdaccio stopped"
} else {
    Write-Info "Verdaccio is not running"
}

Write-Host ""
