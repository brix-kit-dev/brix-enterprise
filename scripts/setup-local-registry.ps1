<#
.SYNOPSIS
    启动 Verdaccio 本地 npm registry 并发布 Brix 核心包

.DESCRIPTION
    此脚本执行以下步骤:
    1. 启动 Verdaccio 服务 (如果未运行)
    2. 配置 npm/pnpm 使用本地 registry
    3. 发布 brix 核心包到本地 registry

.EXAMPLE
    .\setup-local-registry.ps1
    .\setup-local-registry.ps1 -StartOnly
    .\setup-local-registry.ps1 -PublishOnly

.NOTES
    Version: 1.0.0
    Requires: verdaccio (npm install -g verdaccio)
#>

param(
    [switch]$StartOnly,
    [switch]$PublishOnly,
    [switch]$StopRegistry
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================

$Script:VerdaccioPort = 4873
$Script:VerdaccioUrl = "http://localhost:$Script:VerdaccioPort"
$Script:BrixPath = "D:\1.Sources\brix"

# 需要发布的核心包 (按依赖顺序)
$Script:PackagesToPublish = @(
    "packages\@brix\runtime-sdk\runtime-sdk-api-web",
    "packages\@brix\runtime-sdk\runtime-sdk-react",
    "packages\@brix\platform-devtools\@brix\eslint-config-architecture"
)

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

function Start-Verdaccio {
    Write-Step "Starting Verdaccio registry..."
    
    if (Test-VerdaccioRunning) {
        Write-Success "Verdaccio is already running at $Script:VerdaccioUrl"
        return $true
    }
    
    # 启动 Verdaccio 后台进程
    $verdaccioProcess = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "verdaccio") -WindowStyle Minimized -PassThru
    
    # 等待启动
    $maxWait = 30
    $waited = 0
    while (-not (Test-VerdaccioRunning) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    if (Test-VerdaccioRunning) {
        Write-Success "Verdaccio started at $Script:VerdaccioUrl"
        return $true
    } else {
        Write-Fail "Failed to start Verdaccio"
        return $false
    }
}

function Stop-Verdaccio {
    Write-Step "Stopping Verdaccio registry..."
    
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
        Where-Object { $_.MainModule.FileName -match "verdaccio" -or $_.CommandLine -match "verdaccio" }
    
    if ($processes) {
        $processes | Stop-Process -Force
        Write-Success "Verdaccio stopped"
    } else {
        # 尝试通过端口查找
        $netstat = netstat -ano | Select-String ":$Script:VerdaccioPort\s"
        if ($netstat) {
            $pid = ($netstat -split '\s+')[-1]
            if ($pid -match '^\d+$') {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Success "Verdaccio stopped (PID: $pid)"
            }
        } else {
            Write-Info "Verdaccio not running"
        }
    }
}

function Publish-BrixPackage {
    param([string]$PackagePath)
    
    $fullPath = Join-Path $Script:BrixPath $PackagePath
    if (-not (Test-Path $fullPath)) {
        Write-Warn "Package not found: $fullPath"
        return $false
    }
    
    $packageJson = Join-Path $fullPath "package.json"
    $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    $packageName = $pkg.name
    $packageVersion = $pkg.version
    
    Write-Info "Publishing $packageName@$packageVersion..."
    
    Push-Location $fullPath
    try {
        # 首先确保包已构建
        if (-not (Test-Path (Join-Path $fullPath "dist"))) {
            Write-Info "  Building package..."
            $buildResult = & cmd /c "pnpm build" 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warn "  Build may have issues, attempting publish anyway..."
            }
        }
        
        # 发布到本地 registry
        $result = & cmd /c "npm publish --registry $Script:VerdaccioUrl" 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $result -match "already exists") {
            Write-Success "  Published $packageName@$packageVersion"
            return $true
        } else {
            # 检查是否是版本已存在
            if ($result -match "cannot publish over" -or $result -match "already exists") {
                Write-Info "  $packageName@$packageVersion already published"
                return $true
            }
            Write-Fail "  Failed to publish: $result"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Configure-NpmRegistry {
    Write-Step "Configuring npm registry..."
    
    # 为 @brix scope 设置本地 registry
    & npm config set @brix:registry $Script:VerdaccioUrl
    Write-Success "Set @brix:registry=$Script:VerdaccioUrl"
}

# ============================================================================
# Main Entry
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Brix Local Registry Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($StopRegistry) {
    Stop-Verdaccio
    exit 0
}

if (-not $PublishOnly) {
    # 启动 Verdaccio
    if (-not (Start-Verdaccio)) {
        exit 1
    }
    
    # 配置 npm registry
    Configure-NpmRegistry
}

if (-not $StartOnly) {
    Write-Step "Publishing Brix core packages..."
    
    $allSuccess = $true
    foreach ($package in $Script:PackagesToPublish) {
        if (-not (Publish-BrixPackage -PackagePath $package)) {
            $allSuccess = $false
        }
    }
    
    if ($allSuccess) {
        Write-Host ""
        Write-Success "All packages published successfully!"
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Run 'pnpm install' in brix-enterprise" -ForegroundColor White
        Write-Host "  2. Run the build script" -ForegroundColor White
    } else {
        Write-Fail "Some packages failed to publish"
    }
}

Write-Host ""
Write-Host "Verdaccio UI: $Script:VerdaccioUrl" -ForegroundColor Cyan
Write-Host ""
