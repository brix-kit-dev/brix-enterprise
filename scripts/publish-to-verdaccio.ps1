<#
.SYNOPSIS
    发布 Brix 包到 Verdaccio 本地 npm registry

.DESCRIPTION
    此脚本执行以下步骤:
    1. 确保 Verdaccio 正在运行
    2. 按依赖顺序构建并发布所有 Brix 前端核心包
    3. 验证发布结果

.PARAMETER PackageFilter
    可选：仅发布匹配的包名（支持通配符）

.PARAMETER SkipBuild
    跳过构建步骤，直接发布

.PARAMETER Force
    强制重新发布（即使版本已存在）

.PARAMETER DryRun
    仅显示将要发布的包，不实际执行

.EXAMPLE
    .\publish-to-verdaccio.ps1
    发布所有核心包

.EXAMPLE
    .\publish-to-verdaccio.ps1 -PackageFilter "*react*"
    仅发布包含 react 的包

.EXAMPLE
    .\publish-to-verdaccio.ps1 -SkipBuild
    跳过构建，直接发布已编译的包

.EXAMPLE
    .\publish-to-verdaccio.ps1 -DryRun
    预览将要发布的包

.NOTES
    Version: 1.0.0
    Requires: verdaccio, pnpm
#>

param(
    [string]$PackageFilter = "*",
    [switch]$SkipBuild,
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================

$Script:VerdaccioPort = 4873
$Script:VerdaccioUrl = "http://localhost:$Script:VerdaccioPort"
$Script:SourceRoot = Split-Path -Parent $PSScriptRoot
$Script:BrixPath = Join-Path $Script:SourceRoot "brix"
$Script:BrixEnterprisePath = Join-Path $Script:SourceRoot "brix-enterprise"

# 需要发布的核心包 (按依赖顺序排列)
$Script:PackagesToPublish = @(
    # Layer 1: Runtime SDK (API contracts - no dependencies)
    @{
        Path = "packages\@brix\runtime-sdk\runtime-sdk-api-web"
        Name = "@brix/runtime-sdk-api-web"
        Layer = 1
    },
    
    # Layer 2: Runtime SDK React (depends on api-web)
    @{
        Path = "packages\@brix\runtime-sdk\runtime-sdk-react"
        Name = "@brix/runtime-sdk-react"
        Layer = 2
    },
    
    # Layer 3: Platform DevTools
    @{
        Path = "packages\@brix\platform-devtools\eslint-config-architecture"
        Name = "@brix/eslint-config-architecture"
        Layer = 3
    }
)

# ============================================================================
# Helper Functions
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

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

function Get-PackageInfo {
    param([string]$PackagePath)
    
    $packageJson = Join-Path $PackagePath "package.json"
    if (-not (Test-Path $packageJson)) {
        return $null
    }
    
    $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
    return @{
        Name = $pkg.name
        Version = $pkg.version
        Private = $pkg.private -eq $true
    }
}

function Test-PackagePublished {
    param([string]$PackageName, [string]$Version)
    
    try {
        $response = Invoke-WebRequest -Uri "$Script:VerdaccioUrl/$PackageName/$Version" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Build-Package {
    param([string]$PackagePath)
    
    Push-Location $PackagePath
    try {
        $result = & cmd /c "pnpm build" 2>&1
        return $LASTEXITCODE -eq 0
    } finally {
        Pop-Location
    }
}

function Publish-Package {
    param([string]$PackagePath, [bool]$Force = $false)
    
    Push-Location $PackagePath
    try {
        $args = @("publish", "--registry", $Script:VerdaccioUrl, "--no-git-checks")
        if ($Force) {
            # 删除已存在的版本后重新发布
            $args += "--force"
        }
        
        $result = & npm @args 2>&1
        $success = $LASTEXITCODE -eq 0
        
        if (-not $success) {
            # 检查是否是版本已存在的"错误"（其实是成功的）
            if ($result -match "cannot publish over" -or $result -match "already exists") {
                return @{ Success = $true; AlreadyExists = $true }
            }
        }
        
        return @{ Success = $success; AlreadyExists = $false; Output = $result }
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Main
# ============================================================================

Write-Header "Brix Package Publisher"

# 检查 Verdaccio
Write-Step "Checking Verdaccio status..."
if (-not (Test-VerdaccioRunning)) {
    Write-Warn "Verdaccio is not running. Starting it now..."
    $startScript = Join-Path $PSScriptRoot "start-verdaccio.ps1"
    if (Test-Path $startScript) {
        & $startScript
        if (-not (Test-VerdaccioRunning)) {
            Write-Fail "Failed to start Verdaccio"
            exit 1
        }
    } else {
        Write-Fail "Verdaccio is not running. Please start it first:"
        Write-Host "  .\start-verdaccio.ps1" -ForegroundColor Yellow
        exit 1
    }
}
Write-Success "Verdaccio is running at $Script:VerdaccioUrl"

# 过滤要发布的包
$packagesToProcess = $Script:PackagesToPublish | Where-Object { $_.Name -like $PackageFilter }

if ($packagesToProcess.Count -eq 0) {
    Write-Warn "No packages match filter: $PackageFilter"
    exit 0
}

Write-Host ""
Write-Info "Packages to publish ($($packagesToProcess.Count)):"
foreach ($pkg in $packagesToProcess) {
    Write-Host "  - $($pkg.Name)" -ForegroundColor White
}
Write-Host ""

if ($DryRun) {
    Write-Info "DryRun mode - exiting without changes"
    exit 0
}

# 按 Layer 顺序处理
$results = @()
$packagesToProcess = $packagesToProcess | Sort-Object { $_.Layer }

foreach ($pkgDef in $packagesToProcess) {
    $fullPath = Join-Path $Script:BrixPath $pkgDef.Path
    
    if (-not (Test-Path $fullPath)) {
        Write-Warn "Package not found: $fullPath"
        $results += @{ Name = $pkgDef.Name; Status = "NotFound" }
        continue
    }
    
    $pkgInfo = Get-PackageInfo -PackagePath $fullPath
    if (-not $pkgInfo) {
        Write-Warn "Invalid package.json: $fullPath"
        $results += @{ Name = $pkgDef.Name; Status = "InvalidPackage" }
        continue
    }
    
    if ($pkgInfo.Private) {
        Write-Info "Skipping private package: $($pkgInfo.Name)"
        $results += @{ Name = $pkgInfo.Name; Status = "Private" }
        continue
    }
    
    Write-Step "Processing $($pkgInfo.Name)@$($pkgInfo.Version)..."
    
    # 检查是否已发布
    if (-not $Force) {
        if (Test-PackagePublished -PackageName $pkgInfo.Name -Version $pkgInfo.Version) {
            Write-Info "  Already published, skipping"
            $results += @{ Name = $pkgInfo.Name; Status = "AlreadyPublished" }
            continue
        }
    }
    
    # 构建包
    if (-not $SkipBuild) {
        Write-Info "  Building..."
        $distPath = Join-Path $fullPath "dist"
        if (-not (Test-Path $distPath) -or $Force) {
            if (-not (Build-Package -PackagePath $fullPath)) {
                Write-Fail "  Build failed"
                $results += @{ Name = $pkgInfo.Name; Status = "BuildFailed" }
                continue
            }
        } else {
            Write-Info "  Using existing build"
        }
    }
    
    # 发布包
    Write-Info "  Publishing..."
    $publishResult = Publish-Package -PackagePath $fullPath -Force $Force
    
    if ($publishResult.Success) {
        if ($publishResult.AlreadyExists) {
            Write-Info "  Already exists"
            $results += @{ Name = $pkgInfo.Name; Status = "AlreadyPublished" }
        } else {
            Write-Success "  Published successfully"
            $results += @{ Name = $pkgInfo.Name; Status = "Published" }
        }
    } else {
        Write-Fail "  Publish failed: $($publishResult.Output)"
        $results += @{ Name = $pkgInfo.Name; Status = "PublishFailed" }
    }
}

# 输出摘要
Write-Header "Publish Summary"

$published = ($results | Where-Object { $_.Status -eq "Published" }).Count
$alreadyPublished = ($results | Where-Object { $_.Status -eq "AlreadyPublished" }).Count
$failed = ($results | Where-Object { $_.Status -match "Failed" }).Count
$skipped = ($results | Where-Object { $_.Status -in @("Private", "NotFound") }).Count

Write-Host "  Published:         $published" -ForegroundColor Green
Write-Host "  Already Published: $alreadyPublished" -ForegroundColor Cyan
Write-Host "  Failed:            $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Skipped:           $skipped" -ForegroundColor Gray
Write-Host ""

if ($failed -gt 0) {
    Write-Fail "Some packages failed to publish"
    exit 1
} else {
    Write-Success "All packages processed successfully"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run 'pnpm install' in brix-enterprise" -ForegroundColor White
    Write-Host "  2. Run '.\build-backend.ps1' to build" -ForegroundColor White
    Write-Host ""
    exit 0
}
