<#
.SYNOPSIS
    Start Brix Enterprise frontend host and selected web plugins.

.DESCRIPTION
    Launches enterprise host shell plus selected enterprise solution web plugins.
    By default starts all plugins. Use -Plugin to start specific plugins only.
    Host shell is always started unless -SkipHost is specified.

.PARAMETER Mode
    Product (default) or Dev.

.PARAMETER Plugin
    Comma-separated list of plugin names to start (e.g., "booking,case").
    Available: products, partners, messenger, identity, carousel, booking, case, contracts, intake, storage, compliance, tenant
    If not specified, all plugins are started.

.PARAMETER HostOnly
    Start only host shell.

.PARAMETER SkipHost
    Start only plugins (skip host shell).

.PARAMETER Force
    Overwrite existing state file if present.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("Product", "Dev")]
    [string]$Mode = "Product",

    [Parameter(Mandatory = $false)]
    [string[]]$Plugin,

    [Parameter(Mandatory = $false)]
    [switch]$HostOnly,

    [Parameter(Mandatory = $false)]
    [switch]$SkipHost,

    [Parameter(Mandatory = $false)]
    [switch]$Force,

    [Parameter(Mandatory = $false)]
    [Alias("h", "?")]
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Usage {
        $usage = @"
===============================================================
    start-frontend.ps1 Usage Guide
===============================================================

Syntax:
    .\start-frontend.ps1 [options]

Options:
    -Mode Product|Dev   Startup mode. Default is Product.
    -Plugin <names>     Comma-separated plugin names to start.
                        Available: products, partners, messenger, 
                        identity, carousel, booking, case, 
                        contracts, intake, storage, compliance,
                        tenant
    -HostOnly           Start host shell only.
    -SkipHost           Start plugins only (skip host shell).
    -Force              Overwrite existing state file if present.
    -Help, -h, -?       Show this help message.

Examples:
    .\start-frontend.ps1
        Start host + all plugins in Product mode.

    .\start-frontend.ps1 -Plugin booking
        Start host + booking plugin only.

    .\start-frontend.ps1 -Plugin booking,case
        Start host + booking + case plugins.

    .\start-frontend.ps1 -Mode Dev -Plugin partners
        Start host + partners plugin in Dev mode.

    .\start-frontend.ps1 -HostOnly
        Start only host shell.

    .\start-frontend.ps1 -SkipHost -Plugin booking
        Start only booking plugin (no host shell).

    .\start-frontend.ps1 -Force
        Force startup when previous state file exists.

Notes:
    - Host URL: http://localhost:3001
    - Logs: scripts\logs\frontend
    - Stop with: .\stop-frontend.ps1 -Force
===============================================================
"@

        Write-Host $usage -ForegroundColor Cyan
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host ""
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

# ---------------------------------------------------------------------------
# Sync host's VITE_LOCAL_PLUGINS with the plugins actually started locally.
#
# Why: host-shell-standalone-web/rspack.config.mjs builds dev-server proxy
# rules from VITE_LOCAL_PLUGINS. If a started plugin (e.g. products) is not
# listed there, requests to /plugins/brix-app-<name>/remoteEntry.js fall
# through to the remote-backend catch-all proxy and 404, breaking MF loading
# (installHook.js: "[mfLoader] Failed to load script ...").
#
# Per v3.0 Blueprint Constraint 6 (Ultra-Thin Host) and Constraint 8
# (Configuration-Driven), we must NOT hardcode plugin lists in host code.
# The orchestration script is the single source of truth for which plugins
# are running locally and reconciles host configuration via .env.local
# (gitignored, dev-only).
# ---------------------------------------------------------------------------
function Sync-HostLocalPluginsEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostRoot,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$LocalPluginKeys
    )

    $envLocalPath = Join-Path $HostRoot ".env.local"
    $joined = ($LocalPluginKeys | Where-Object { $_ } | Sort-Object -Unique) -join ','

    $content = @"
# Auto-generated by scripts/start-frontend.ps1 — DO NOT EDIT MANUALLY.
# Reflects the plugins actually started by the orchestration script so the
# host dev-server proxy (/plugins/brix-app-<name>) targets local dev servers.
# Cleaned up by stop-frontend.ps1.
VITE_LOCAL_PLUGINS=$joined
"@

    Set-Content -Path $envLocalPath -Value $content -Encoding utf8 -NoNewline
    Write-Info "Wrote host .env.local: VITE_LOCAL_PLUGINS=$joined"
}

function Get-ShellExecutable {
    $pwsh = Get-Command "pwsh" -ErrorAction SilentlyContinue
    if ($pwsh) { return $pwsh.Source }

    $powershell = Get-Command "powershell" -ErrorAction SilentlyContinue
    if ($powershell) { return $powershell.Source }

    throw "No PowerShell executable found (pwsh or powershell)."
}

function Test-CommandAvailable {
    param([string]$CommandName)
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    return $null -ne $cmd
}

function Start-FrontendProcess {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$App,

        [Parameter(Mandatory = $true)]
        [string]$Mode,

        [Parameter(Mandatory = $true)]
        [string]$LogRoot,

        [Parameter(Mandatory = $true)]
        [string]$ShellExe
    )

    $stdout = Join-Path $LogRoot ($App.Name + ".out.log")
    $stderr = Join-Path $LogRoot ($App.Name + ".err.log")

    $startCommand = if ($Mode -eq "Product") { $App.ProductCommand } else { $App.DevCommand }
    $nodeEnv = if ($Mode -eq "Product") { "production" } else { "development" }

    $inlineCommand = @"
Set-Location '$($App.Path)'
`$env:NODE_ENV = '$nodeEnv'
$startCommand
"@

    Write-Step "Starting $($App.Name) on port $($App.Port)..."
    Write-Info "Command: $startCommand"

    $proc = Start-Process `
        -FilePath $ShellExe `
        -ArgumentList @("-NoLogo", "-NoProfile", "-Command", $inlineCommand) `
        -WorkingDirectory $App.Path `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru

    return [pscustomobject]@{
        Name = $App.Name
        Path = $App.Path
        Port = $App.Port
        PID = $proc.Id
        LogOut = $stdout
        LogErr = $stderr
        Command = $startCommand
    }
}

function Main {
    if ($Help) {
        Show-Usage
        return
    }

    Write-Header "Brix Enterprise Frontend Starter"

    if ($HostOnly -and $SkipHost) {
        Write-Fail "-HostOnly and -SkipHost cannot be used together."
        exit 1
    }

    $sourceRoot = Split-Path -Parent $PSScriptRoot
    $enterpriseRoot = Join-Path $sourceRoot "brix-enterprise"
    $hostRoot = Join-Path $enterpriseRoot "packages\@brix\enterprise-host\host-shell-standalone-web"
    $solutionsRoot = Join-Path $enterpriseRoot "packages\@brix\enterprise-solutions"

    $stateRoot = Join-Path $PSScriptRoot ".state"
    $logRoot = Join-Path $PSScriptRoot "logs\frontend"
    $pidFile = Join-Path $stateRoot "frontend-processes.json"

    if (-not (Test-Path $enterpriseRoot)) {
        Write-Fail "Missing path: $enterpriseRoot"
        exit 1
    }
    if (-not (Test-Path $hostRoot)) {
        Write-Fail "Missing path: $hostRoot"
        exit 1
    }
    if (-not (Test-Path $solutionsRoot)) {
        Write-Fail "Missing path: $solutionsRoot"
        exit 1
    }

    if (-not (Test-CommandAvailable "node")) {
        Write-Fail "Node.js not found. Please install Node.js 18+."
        exit 1
    }
    if (-not (Test-CommandAvailable "pnpm")) {
        Write-Fail "pnpm not found. Please install pnpm 8+."
        exit 1
    }

    if ((Test-Path $pidFile) -and -not $Force) {
        Write-Fail "Existing state file detected: $pidFile"
        Write-Info "Use stop-frontend.ps1 first, or pass -Force."
        exit 1
    }

    New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

    $shellExe = Get-ShellExecutable
    $nodeVersion = (& node --version 2>&1 | Select-Object -First 1)
    $pnpmVersion = (& pnpm --version 2>&1 | Select-Object -First 1)

    Write-Info "Mode: $Mode"
    Write-Info "Node: $nodeVersion"
    Write-Info "pnpm: $pnpmVersion"
    Write-Info "Log dir: $logRoot"

    $apps = @(
        [pscustomobject]@{ Name = "host-shell"; Path = $hostRoot; Port = 3001; DevCommand = "pnpm run dev"; ProductCommand = "pnpm run preview"; PluginKey = $null },
        [pscustomobject]@{ Name = "plugin-products"; Path = (Join-Path $solutionsRoot "app-products\products-ui-web"); Port = 3004; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "products" },
        [pscustomobject]@{ Name = "plugin-partners"; Path = (Join-Path $solutionsRoot "app-partners\partners-ui-web"); Port = 3003; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "partners" },
        [pscustomobject]@{ Name = "plugin-messenger"; Path = (Join-Path $solutionsRoot "app-messenger\messenger-ui-web"); Port = 3006; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "messenger" },
        [pscustomobject]@{ Name = "plugin-identity"; Path = (Join-Path $solutionsRoot "app-identity\identity-ui-web"); Port = 3016; DevCommand = "pnpm run start"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "identity" },
        [pscustomobject]@{ Name = "plugin-carousel"; Path = (Join-Path $solutionsRoot "app-carousel\carousel-ui-web"); Port = 3007; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "carousel" },
        [pscustomobject]@{ Name = "plugin-booking"; Path = (Join-Path $solutionsRoot "app-booking\booking-ui-web"); Port = 3015; DevCommand = "pnpm run start"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "booking" },
        [pscustomobject]@{ Name = "plugin-case"; Path = (Join-Path $solutionsRoot "app-case\case-ui-web"); Port = 3050; DevCommand = "pnpm run dev"; ProductCommand = "pnpm run preview"; PluginKey = "case" },
        [pscustomobject]@{ Name = "plugin-contracts"; Path = (Join-Path $solutionsRoot "app-contracts\contracts-ui-web"); Port = 3051; DevCommand = "pnpm run dev"; ProductCommand = "pnpm run preview"; PluginKey = "contracts" },
        [pscustomobject]@{ Name = "plugin-intake"; Path = (Join-Path $solutionsRoot "app-intake\intake-ui-web"); Port = 3056; DevCommand = "pnpm run dev"; ProductCommand = "pnpm run preview"; PluginKey = "intake" },
        [pscustomobject]@{ Name = "plugin-storage"; Path = (Join-Path $solutionsRoot "app-storage\storage-ui-web"); Port = 3053; DevCommand = "pnpm run dev"; ProductCommand = "pnpm run preview"; PluginKey = "storage" },
        [pscustomobject]@{ Name = "plugin-compliance"; Path = (Join-Path $solutionsRoot "app-compliance\compliance-ui-web"); Port = 3052; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "compliance" },
        [pscustomobject]@{ Name = "plugin-tenant"; Path = (Join-Path $solutionsRoot "app-tenant\tenant-ui-web"); Port = 3054; DevCommand = "pnpm run dev"; ProductCommand = "pnpm exec rspack serve --mode production"; PluginKey = "tenant" }
    )

    # Build list of selected apps
    $selectedApps = @()
    
    # Always add host unless -SkipHost
    if (-not $SkipHost) {
        $selectedApps += $apps | Where-Object { $_.Name -eq "host-shell" }
    }
    
    # Handle plugin selection
    if (-not $HostOnly) {
        $allPlugins = $apps | Where-Object { $_.Name -ne "host-shell" }
        
        if ($Plugin -and $Plugin.Count -gt 0) {
            # Normalize plugin names (support comma-separated in single string)
            $requestedPlugins = @()
            foreach ($p in $Plugin) {
                $requestedPlugins += $p.Split(',') | ForEach-Object { $_.Trim().ToLower() }
            }
            
            # Validate plugin names
            $validKeys = $allPlugins | ForEach-Object { $_.PluginKey }
            $invalidPlugins = $requestedPlugins | Where-Object { $_ -notin $validKeys }
            if ($invalidPlugins.Count -gt 0) {
                Write-Fail "Unknown plugin(s): $($invalidPlugins -join ', ')"
                Write-Info "Available plugins: $($validKeys -join ', ')"
                exit 1
            }
            
            # Select only requested plugins
            $selectedApps += $allPlugins | Where-Object { $_.PluginKey -in $requestedPlugins }
            Write-Info "Selected plugins: $($requestedPlugins -join ', ')"
        } else {
            # No -Plugin specified, start all plugins
            $selectedApps += $allPlugins
        }
    }

    foreach ($app in $selectedApps) {
        if (-not (Test-Path $app.Path)) {
            Write-Fail "Missing app path: $($app.Path)"
            exit 1
        }
    }

    # Reconcile host proxy registry with started plugins (see function comment).
    $localPluginKeys = @($selectedApps | Where-Object { $_.PluginKey } | ForEach-Object { $_.PluginKey })
    $hostInSelection = [bool]($selectedApps | Where-Object { $_.Name -eq "host-shell" })

    if ($hostInSelection) {
        Sync-HostLocalPluginsEnv -HostRoot $hostRoot -LocalPluginKeys $localPluginKeys
    }
    elseif ($SkipHost) {
        # Host is assumed already running. Update .env.local so a future host
        # restart picks up the new proxy rules, but warn the user that the
        # currently-running host instance will NOT pick up changes until restart.
        Sync-HostLocalPluginsEnv -HostRoot $hostRoot -LocalPluginKeys $localPluginKeys
        Write-Fail "-SkipHost specified: a running host will NOT pick up new proxy rules."
        Write-Info "Restart the host (stop-frontend.ps1 + start-frontend.ps1) for /plugins proxies to take effect."
    }

    $started = @()
    foreach ($app in $selectedApps) {
        $started += Start-FrontendProcess -App $app -Mode $Mode -LogRoot $logRoot -ShellExe $shellExe
        Start-Sleep -Milliseconds 500
    }

    $state = [pscustomobject]@{
        StartedAt = (Get-Date).ToString("s")
        Mode = $Mode
        HostOnly = [bool]$HostOnly
        SkipHost = [bool]$SkipHost
        Processes = $started
    }

    $state | ConvertTo-Json -Depth 5 | Out-File -FilePath $pidFile -Encoding utf8

    Write-Header "Frontend Startup Summary"
    foreach ($item in $started) {
        Write-Host ("  {0} | PID={1} | Port={2}" -f $item.Name, $item.PID, $item.Port) -ForegroundColor Green
    }

    Write-Host ""
    Write-Success "Host URL: http://localhost:3001"
    Write-Info "State file: $pidFile"
    Write-Info "Logs: $logRoot"
    Write-Info "Use stop-frontend.ps1 to stop all started processes."
}

Main
