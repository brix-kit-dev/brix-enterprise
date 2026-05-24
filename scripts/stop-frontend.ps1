<#
.SYNOPSIS
    Stop frontend processes started by start-frontend.ps1.

.DESCRIPTION
    Reads scripts/.state/frontend-processes.json and stops all recorded PIDs.

.PARAMETER Force
    Force stop process.

.PARAMETER KillPorts
    Kill processes occupying frontend ports (3001, 3003-3056).
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
        [switch]$Force,

        [Parameter(Mandatory = $false)]
        [switch]$KillPorts,

        [Parameter(Mandatory = $false)]
        [Alias("h", "?")]
        [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Usage {
        $usage = @"
===============================================================
    stop-frontend.ps1 Usage Guide
===============================================================

Syntax:
    .\stop-frontend.ps1 [options]

Options:
    -Force              Force stop all recorded frontend processes.
    -KillPorts          Kill all processes occupying frontend ports.
    -Help, -h, -?       Show this help message.

Examples:
    .\stop-frontend.ps1
        Stop all frontend processes from state file.

    .\stop-frontend.ps1 -Force
        Force stop all frontend processes.

    .\stop-frontend.ps1 -KillPorts
        Kill all processes occupying frontend ports (3001, 3003, etc).

Notes:
    - Reads state file: scripts\.state\frontend-processes.json
    - If state file is missing, script exits with error.
===============================================================
"@

        Write-Host $usage -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[ OK ] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

function Resolve-EnterpriseRoot {
    $candidate = Split-Path -Parent $PSScriptRoot
    $hostRelativePath = "packages\@brix\enterprise-host\host-shell-standalone-web"

    if (Test-Path (Join-Path $candidate $hostRelativePath)) {
        return $candidate
    }

    $nestedCandidate = Join-Path $candidate "brix-enterprise"
    if (Test-Path (Join-Path $nestedCandidate $hostRelativePath)) {
        return $nestedCandidate
    }

    throw "Cannot resolve brix-enterprise root from script path: $PSScriptRoot"
}

# ---------------------------------------------------------------------------
# Remove the auto-generated host .env.local written by start-frontend.ps1
# so the next host start uses checked-in defaults from .env.
# ---------------------------------------------------------------------------
function Remove-HostLocalEnv {
    $enterpriseRoot = Resolve-EnterpriseRoot
    $hostEnvLocal = Join-Path $enterpriseRoot "packages\@brix\enterprise-host\host-shell-standalone-web\.env.local"
    if (Test-Path $hostEnvLocal) {
        try {
            Remove-Item -Path $hostEnvLocal -Force -ErrorAction Stop
            Write-Info "Removed host .env.local"
        }
        catch {
            Write-Fail "Failed to remove host .env.local: $_"
        }
    }
}

function Stop-PortProcesses {
    param([int[]]$Ports)
    
    $stoppedCount = 0
    foreach ($port in $Ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                       Where-Object { $_.State -eq 'Listen' }
        
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId -gt 0) {
                Write-Step "Killing process on port $port (PID=$procId)"
                try {
                    Stop-Process -Id $procId -Force -ErrorAction Stop
                    Write-Success "Killed PID $procId"
                    $stoppedCount++
                }
                catch {
                    Write-Fail "Failed to kill PID ${procId}: $_"
                }
            }
        }
    }
    return $stoppedCount
}

function Main {
    if ($Help) {
        Show-Usage
        return
    }

    # Kill processes on ports if requested
    if ($KillPorts) {
        Write-Step "Killing processes on frontend ports..."
        $frontendPorts = @(3001, 3003, 3004, 3006, 3007, 3015, 3016, 3050, 3051, 3052, 3053, 3056)
        $killed = Stop-PortProcesses -Ports $frontendPorts
        Write-Success "Killed $killed processes on ports"
        
        # Also remove state file if exists
        $stateFile = Join-Path (Join-Path $PSScriptRoot ".state") "frontend-processes.json"
        if (Test-Path $stateFile) {
            Remove-Item -Path $stateFile -Force -ErrorAction SilentlyContinue
            Write-Info "Removed state file"
        }
        Remove-HostLocalEnv
        return
    }

    $stateFile = Join-Path (Join-Path $PSScriptRoot ".state") "frontend-processes.json"

    if (-not (Test-Path $stateFile)) {
        Write-Fail "State file not found: $stateFile"
        exit 1
    }

    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    if (-not $state.Processes) {
        Write-Fail "No process list in state file."
        Remove-Item -Path $stateFile -Force -ErrorAction SilentlyContinue
        exit 1
    }

    $stoppedCount = 0
    foreach ($proc in $state.Processes) {
        $processId = [int]$proc.PID
        Write-Step ("Stopping {0} (PID={1})" -f $proc.Name, $processId)

        $running = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($null -eq $running) {
            Write-Info "Process already exited: $processId"
            continue
        }

        try {
            Stop-Process -Id $processId -Force:$Force
            Write-Success ("Stopped {0}" -f $proc.Name)
            $stoppedCount++
        }
        catch {
            Write-Fail ("Failed to stop PID {0}: {1}" -f $processId, $_)
        }
    }

    Remove-Item -Path $stateFile -Force -ErrorAction SilentlyContinue
    Remove-HostLocalEnv
    Write-Success ("Stopped processes: {0}" -f $stoppedCount)
}

Main
