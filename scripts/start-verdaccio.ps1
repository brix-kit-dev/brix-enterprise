<#
.SYNOPSIS
    启动 Verdaccio 本地 npm registry

.DESCRIPTION
    启动 Verdaccio 服务并等待其就绪。
    如果 Verdaccio 已在运行，则直接返回成功。

.PARAMETER Wait
    启动后等待用户按键（用于独立运行）

.EXAMPLE
    .\start-verdaccio.ps1
    .\start-verdaccio.ps1 -Wait

.NOTES
    Version: 1.0.0
    Requires: verdaccio (npm install -g verdaccio)
#>

param(
    [switch]$Wait
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================

$Script:VerdaccioPort = 4873
$Script:VerdaccioUrl = "http://localhost:$Script:VerdaccioPort"

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Step { param([string]$Message) Write-Host "[STEP] $Message" -ForegroundColor Cyan }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor White }
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Fail { param([string]$Message) Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }

function Test-VerdaccioRunning {
    try {
        $response = Invoke-WebRequest -Uri $Script:VerdaccioUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# ============================================================================
# Main
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verdaccio Local Registry Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Step "Checking Verdaccio status..."

if (Test-VerdaccioRunning) {
    Write-Success "Verdaccio is already running at $Script:VerdaccioUrl"
    exit 0
}

Write-Step "Starting Verdaccio..."

# 检查 verdaccio 命令是否存在
$verdaccioCmd = Get-Command "verdaccio" -ErrorAction SilentlyContinue
if (-not $verdaccioCmd) {
    Write-Fail "Verdaccio not found. Please install it first:"
    Write-Host "  npm install -g verdaccio" -ForegroundColor Yellow
    exit 1
}

# 启动 Verdaccio 后台进程
$verdaccioProcess = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "verdaccio") -WindowStyle Minimized -PassThru

# 等待启动
$maxWait = 30
$waited = 0
Write-Host "Waiting for Verdaccio to start" -NoNewline
while (-not (Test-VerdaccioRunning) -and $waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "." -NoNewline
}
Write-Host ""

if (Test-VerdaccioRunning) {
    Write-Success "Verdaccio started at $Script:VerdaccioUrl"
    Write-Host ""
    Write-Host "  Web UI: $Script:VerdaccioUrl" -ForegroundColor Cyan
    Write-Host "  Stop:   .\stop-verdaccio.ps1" -ForegroundColor White
    Write-Host ""
    
    # 配置 npm scope (使用正确的引号包裹)
    $registryUrl = "http://localhost:$Script:VerdaccioPort"
    $configResult = & npm config set "@brix:registry" $registryUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Configured @brix:registry -> $registryUrl"
    } else {
        Write-Warn "Could not configure @brix:registry (non-critical)"
    }
    
    if ($Wait) {
        Write-Host "Press any key to exit (Verdaccio will keep running)..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
    exit 0
} else {
    Write-Fail "Failed to start Verdaccio after $maxWait seconds"
    exit 1
}
