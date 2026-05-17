<#
.SYNOPSIS
    Brix Platform 前端编译脚本

.DESCRIPTION
    编译 Brix Platform 所有前端库包和应用，包括：
    - brix (开源核心): runtime-sdk, shared-runtime, infra-adapters, platform-commons
    - brix-enterprise (企业版): enterprise-commons, enterprise-host

    编译顺序遵循依赖拓扑（Dependency Topology Order）：
    ┌─────────────────────────────────────────────────────────────────┐
    │  Layer 1  runtime-sdk (接口定义 + 共享运行时)                    │
    │  Layer 2  infra-adapters (基础设施适配器: UI, HTTP, MF, Router) │
    │  Layer 3  platform-commons (平台能力: Auth, I18n, Navigation)   │
    │  Layer 4  enterprise-commons (企业级公共模块)                    │
    │  Layer 5  enterprise-host (运行壳宿主应用, 仅 production 模式)   │
    └─────────────────────────────────────────────────────────────────┘

    插件（Partners、Products 等）使用 rspack dev server 热重载，
    无需预编译——它们在 dev server 启动时实时转译源码。
    插件只需确保其依赖的 SDK 库包（Layer 1-4）已编译即可。

.PARAMETER Mode
    编译模式：
    - Full: 完整编译核心 + 企业版（默认）
    - Core: 仅编译 brix 开源核心包
    - Enterprise: 仅编译 brix-enterprise 包（需核心包已编译）
    - Libs: 仅编译库包（Layer 1-3），跳过企业版和宿主应用

.PARAMETER Clean
    编译前删除所有 dist/ 目录，确保干净构建

.PARAMETER Parallel
    启用 pnpm 并行编译（默认已启用 pnpm 拓扑排序）

.PARAMETER SkipInstall
    跳过 pnpm install（依赖已安装时使用）

.PARAMETER Verbose
    显示详细编译输出

.EXAMPLE
    .\build-frontend.ps1
    完整编译所有前端模块

.EXAMPLE
    .\build-frontend.ps1 -Mode Core
    仅编译 brix 核心库包

.EXAMPLE
    .\build-frontend.ps1 -Clean
    清理后完整编译

.EXAMPLE
    .\build-frontend.ps1 -Mode Libs -SkipInstall
    快速编译库包（跳过依赖安装）

.NOTES
    版本: 1.0.0
    作者: Brix Platform Team
    日期: 2026-03-25

    依赖项:
    - Node.js 18+
    - pnpm 8+

    构建工具:
    - tsup: 所有库包（runtime-sdk, infra-adapters, platform-commons）
    - rspack: 企业版宿主应用（host-shell-standalone-web）
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("Full", "Core", "Enterprise", "Libs")]
    [string]$Mode = "Full",

    [Parameter(Mandatory = $false)]
    [switch]$Clean,

    [Parameter(Mandatory = $false)]
    [switch]$Parallel,

    [Parameter(Mandatory = $false)]
    [switch]$SkipInstall,

    [Parameter(Mandatory = $false)]
    [Alias("h", "?")]
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$Script:StartTime = Get-Date
$Script:Version = "1.0.0"

# ============================================================================
# 路径配置
# ============================================================================

$Script:SourceRoot      = Split-Path -Parent $PSScriptRoot
$Script:BrixRoot        = Join-Path $Script:SourceRoot "brix"
$Script:EnterpriseRoot  = Join-Path $Script:SourceRoot "brix-enterprise"
$Script:LogRoot         = Join-Path $PSScriptRoot "logs"

# ============================================================================
# 构建配置
# ============================================================================

# Node.js V8 堆内存上限（MB）。
# tsup DTS 生成（tsc --declaration）极耗内存，默认 V8 堆（~1.7GB）在多包并行编译时不足。
# 4096MB 可支撑 workspace-concurrency=2 下的并行 DTS 构建。
$Script:NodeMaxHeapMB = 4096

# 聚合包排除过滤器。
# Brix monorepo 采用扁平 pnpm workspace（所有包注册在根 pnpm-workspace.yaml）。
# 聚合包（workspace root packages）的 build 脚本为 "pnpm -r build"，
# 在根级 pnpm -r 触发时会产生级联递归子进程，指数级消耗内存直至 OOM。
# 仅叶子包（build 脚本为 tsup / rspack）需要实际编译，聚合包应跳过。
#
# 排除策略：动态检测 + 已知模式双重保护
#   已知聚合包模式：
#   - brix:        *-workspace, @brix-sdk/platform-commons, platform-devtools
#   - enterprise:  @brix/enterprise-commons, @brix/enterprise-*-app（solutions 聚合根）
#   - 根 monorepo: @brix/monorepo, @brix/enterprise-monorepo

# ============================================================================
# 输出函数
# ============================================================================

function Show-Usage {
    $usage = @"
═══════════════════════════════════════════════════════════════════════════════
                  Brix Platform 前端编译脚本 使用指南
═══════════════════════════════════════════════════════════════════════════════

【基本语法】
    .\build-frontend.ps1 [参数]

【编译模式 -Mode】
    Full        完整编译核心 + 企业版（默认）
    Core        仅编译 brix 开源核心包（Layer 1-3）
    Enterprise  仅编译 brix-enterprise 企业版包（Layer 4-5）
    Libs        仅编译库包（Layer 1-3），跳过企业版和宿主应用

【可选参数】
    -Clean              编译前清理所有 dist/ 目录
    -Parallel           启用并行编译
    -SkipInstall        跳过 pnpm install
    -Help, -h, -?       显示此帮助信息

【编译顺序（依赖拓扑）】

    Layer 1: runtime-sdk
      ├── runtime-sdk-api-web       接口定义 + 能力类型
      ├── runtime-sdk-react         React 绑定 (useUI, useI18n, ...)
      ├── runtime-orchestrator-web  运行时编排器
      ├── runtime-manifest-web      插件清单管理
      └── shared-runtime-web        共享运行时 + MF 配置

    Layer 2: infra-adapters
      ├── infra-adapter-ui-mui      MUI 适配器
      ├── infra-adapter-ui-native   原生 CSS 适配器
      ├── infra-adapter-http-web    HTTP 适配器
      ├── infra-adapter-mf-web      Module Federation 适配器
      ├── infra-adapter-router-web  路由适配器
      └── infra-adapter-state-web   状态管理适配器

    Layer 3: platform-commons
      ├── platform-auth-web         认证能力
      ├── platform-auth-service-web OAuth 服务
      ├── platform-auth-ui-web      认证 UI
      ├── platform-config-web       配置管理
      ├── platform-eventbus-web     事件总线
      ├── platform-i18n-web         国际化
      ├── platform-navigation-web   导航能力
      └── platform-router-web       路由能力

    Layer 4: enterprise-commons     企业级公共模块

    Layer 5: enterprise-host        运行壳宿主应用 (rspack)

【常用示例】

    1. 首次编译（完整清理构建）：
       .\build-frontend.ps1 -Clean

    2. 日常开发（仅编译核心库包）：
       .\build-frontend.ps1 -Mode Core -SkipInstall

    3. 仅编译库包（不含企业版）：
       .\build-frontend.ps1 -Mode Libs -SkipInstall

    4. 企业版增量编译：
       .\build-frontend.ps1 -Mode Enterprise -SkipInstall

    5. 并行快速编译：
       .\build-frontend.ps1 -Parallel -SkipInstall

【注意事项】
    - 插件（Partners、Products 等）使用 rspack dev server，无需预编译
    - 插件的 dev server 会自动使用最新编译的 SDK 库包
    - 修改 SDK 源码后，需重新运行此脚本编译库包
    - 修改后建议重启插件 dev server 以加载新的 dist/ 产物

═══════════════════════════════════════════════════════════════════════════════
"@
    Write-Host $usage -ForegroundColor Cyan
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
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

function Format-Duration {
    param([TimeSpan]$Duration)
    if ($Duration.TotalMinutes -ge 1) {
        return "{0:N0}m {1:N0}s" -f [Math]::Floor($Duration.TotalMinutes), $Duration.Seconds
    }
    return "{0:N1}s" -f $Duration.TotalSeconds
}

# ============================================================================
# 环境检查
# ============================================================================

function Test-Prerequisites {
    Write-Step "Checking prerequisites..."

    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Fail "Node.js not found. Please install Node.js 18+."
        return $false
    }
    $nodeVersion = & node --version 2>&1
    Write-Info "Node.js: $nodeVersion"

    $pnpmCmd = Get-Command "pnpm" -ErrorAction SilentlyContinue
    if (-not $pnpmCmd) {
        Write-Fail "pnpm not found. Please install pnpm 8+."
        return $false
    }
    $pnpmVersion = & pnpm --version 2>&1
    Write-Info "pnpm: v$pnpmVersion"

    Write-Success "Prerequisites OK"
    return $true
}

# ============================================================================
# 清理函数
# ============================================================================

function Invoke-CleanDist {
    param(
        [string]$ProjectRoot,
        [string]$ProjectName
    )

    Write-Step "Cleaning dist/ in $ProjectName..."

    $distDirs = Get-ChildItem -Path $ProjectRoot -Directory -Recurse -Filter "dist" |
        Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\.git"
        }

    $count = 0
    foreach ($dir in $distDirs) {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $count++
    }

    Write-Success "Cleaned $count dist/ directories in $ProjectName"
}

# ============================================================================
# 依赖安装
# ============================================================================

function Invoke-PnpmInstall {
    param(
        [string]$ProjectRoot,
        [string]$ProjectName
    )

    Write-Step "Installing dependencies for $ProjectName..."

    Push-Location $ProjectRoot
    try {
        & pnpm install --frozen-lockfile 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) {
            # Retry without --frozen-lockfile (lockfile may be outdated)
            Write-Info "Retrying pnpm install without --frozen-lockfile..."
            & pnpm install 2>&1 | Write-Host
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Dependencies installed for $ProjectName"
            return $true
        } else {
            Write-Fail "pnpm install failed for $ProjectName (exit code: $LASTEXITCODE)"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# 编译函数
# ============================================================================

# 动态发现聚合包：扫描 workspace 中所有 package.json，
# 识别 build 脚本包含 "pnpm -r" 或 "pnpm run -r" 的包为聚合包。
# 返回聚合包名称数组。
function Get-AggregatorPackageNames {
    param(
        [string]$ProjectRoot
    )

    $names = @()
    $packageFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "package.json" |
        Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\.git" -and
            $_.FullName -notmatch "dist[\\/]"
        }

    foreach ($file in $packageFiles) {
        try {
            $rawContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
            $pkg = $rawContent | ConvertFrom-Json
            $buildScript = $null
            if ($pkg.scripts -and $pkg.scripts.build) {
                $buildScript = $pkg.scripts.build
            }
            # 聚合包特征：build 脚本调用 pnpm -r（产生级联递归）
            if ($buildScript -and $buildScript -match 'pnpm\s+(-r|--recursive|run\s+-r)') {
                $pkgName = $pkg.name
                if ($pkgName) {
                    $names += $pkgName
                    Write-Info "  Excluding aggregator: $pkgName ($buildScript)"
                }
            }
        } catch {
            # JSON 解析失败时（如编码问题），用正则文本匹配作为降级策略
            try {
                $rawText = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
                if ($rawText -match '"build"\s*:\s*"([^"]*pnpm\s+(-r|--recursive)[^"]*)"') {
                    $nameMatch = [regex]::Match($rawText, '"name"\s*:\s*"([^"]+)"')
                    if ($nameMatch.Success) {
                        $pkgName = $nameMatch.Groups[1].Value
                        $names += $pkgName
                        Write-Info "  Excluding aggregator (text fallback): $pkgName"
                    }
                }
            } catch {
                # 完全无法读取的文件，跳过
            }
        }
    }

    if ($names.Count -eq 0) {
        Write-Info "  No aggregator packages detected"
    }

    return $names
}

# 将聚合包名称列表转换为 pnpm --filter 排除参数字符串。
# pnpm.ps1 shim 在传递 PowerShell 数组参数时会合并为单个字符串，
# 因此必须构建完整命令字符串，通过 Invoke-Expression 执行。
function Build-PnpmFilterString {
    param(
        [string[]]$AggregatorNames
    )

    $filterParts = @()
    foreach ($name in $AggregatorNames) {
        $filterParts += "--filter `"!$name`""
    }
    return $filterParts -join " "
}

function Invoke-PnpmBuild {
    param(
        [string]$ProjectRoot,
        [string]$ProjectName,
        [string]$BuildCommand = "build",
        [string]$Filter = $null,
        [string[]]$ExcludePatterns = @(),
        [bool]$UseParallel = $false
    )

    $stepStart = Get-Date
    Write-Step "Building $ProjectName..."

    Push-Location $ProjectRoot
    try {
        # 动态发现并排除所有聚合包，防止级联递归 OOM
        Write-Info "Scanning for aggregator packages to exclude..."
        $aggregatorNames = Get-AggregatorPackageNames -ProjectRoot $ProjectRoot
        $excludeStr = Build-PnpmFilterString -AggregatorNames $aggregatorNames

        # 追加额外排除模式（如 MF 远程插件）
        if ($ExcludePatterns.Count -gt 0) {
            $extraExcludes = ($ExcludePatterns | ForEach-Object { "--filter `"!$_`"" }) -join " "
            $excludeStr = "$excludeStr $extraExcludes".Trim()
        }

        if ($Filter) {
            # Phase 1: 先编译依赖根包（如 runtime-sdk 契约层）
            # 注意：必须同时排除聚合包，否则 --filter 匹配到聚合包会触发级联递归
            $phase1Cmd = "pnpm --filter `"$Filter`" $excludeStr --workspace-concurrency=2 run $BuildCommand"
            Write-Info "Phase 1: $phase1Cmd"
            Invoke-Expression "$phase1Cmd 2>&1" | Write-Host
            if ($LASTEXITCODE -ne 0) {
                Write-Fail "Filtered build failed for $ProjectName [$Filter]"
                return $false
            }

            # Phase 2: 编译剩余叶子包（排除聚合包，pnpm 会自动跳过已编译成功的包）
            $phase2Cmd = "pnpm -r $excludeStr --workspace-concurrency=2 run $BuildCommand"
            Write-Info "Phase 2: $phase2Cmd"
            Invoke-Expression "$phase2Cmd 2>&1" | Write-Host
        } else {
            # 无 Filter：直接编译所有叶子包（排除聚合包）
            $buildCmd = "pnpm -r $excludeStr --workspace-concurrency=2 run $BuildCommand"
            Write-Info "Running: $buildCmd"
            Invoke-Expression "$buildCmd 2>&1" | Write-Host
        }

        $elapsed = (Get-Date) - $stepStart
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$ProjectName build completed ($(Format-Duration $elapsed))"
            return $true
        } else {
            Write-Fail "$ProjectName build failed (exit code: $LASTEXITCODE)"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# 主函数
# ============================================================================

function Main {
    if ($Help) {
        Show-Usage
        return
    }

    Write-Header "Brix Platform Frontend Builder v$Script:Version"
    Write-Info "Mode: $Mode"
    Write-Info "Clean: $Clean"
    Write-Info "SkipInstall: $SkipInstall"
    Write-Info "Parallel: $Parallel"

    # ---- Prerequisites ----
    if (-not (Test-Prerequisites)) {
        exit 1
    }

    # ---- Validate paths ----
    $buildCore = $Mode -in @("Full", "Core", "Libs")
    $buildEnterprise = $Mode -in @("Full", "Enterprise")

    if ($buildCore -and -not (Test-Path $Script:BrixRoot)) {
        Write-Fail "brix repository not found at: $Script:BrixRoot"
        exit 1
    }
    if ($buildEnterprise -and -not (Test-Path $Script:EnterpriseRoot)) {
        Write-Fail "brix-enterprise repository not found at: $Script:EnterpriseRoot"
        exit 1
    }

    # ---- Clean ----
    if ($Clean) {
        Write-Header "Phase 0: Clean"
        if ($buildCore) {
            Invoke-CleanDist -ProjectRoot $Script:BrixRoot -ProjectName "brix"
        }
        if ($buildEnterprise) {
            Invoke-CleanDist -ProjectRoot $Script:EnterpriseRoot -ProjectName "brix-enterprise"
        }
    }

    # ---- Install dependencies ----
    if (-not $SkipInstall) {
        Write-Header "Phase 1: Install Dependencies"
        if ($buildCore) {
            if (-not (Invoke-PnpmInstall -ProjectRoot $Script:BrixRoot -ProjectName "brix")) {
                exit 1
            }
        }
        if ($buildEnterprise) {
            if (-not (Invoke-PnpmInstall -ProjectRoot $Script:EnterpriseRoot -ProjectName "brix-enterprise")) {
                exit 1
            }
        }
    }

    # ---- Set NODE_OPTIONS for DTS memory ----
    $origNodeOptions = $env:NODE_OPTIONS
    $env:NODE_OPTIONS = "--max-old-space-size=$($Script:NodeMaxHeapMB) $origNodeOptions".Trim()
    Write-Info "NODE_OPTIONS: $($env:NODE_OPTIONS)"

    # ---- Build brix core ----
    if ($buildCore) {
        Write-Header "Phase 2: Build brix Core Packages"
        Write-Info "Strategy: runtime-sdk first (dependency root), then all leaf packages"

        # Phase 1: Build runtime-sdk contracts first (Layer 1 dependency root)
        # Phase 2: Build all remaining leaf packages with aggregator exclusion
        # Package scope: @brix-sdk/ (not @brix/ which is the directory path)
        $result = Invoke-PnpmBuild `
            -ProjectRoot $Script:BrixRoot `
            -ProjectName "brix (Layer 1-3)" `
            -Filter "@brix-sdk/runtime-sdk-*"

        if (-not $result) {
            Write-Fail "brix core build failed. Aborting."
            exit 1
        }
    }

    # ---- Build brix-enterprise ----
    if ($buildEnterprise) {
        Write-Header "Phase 3: Build brix-enterprise Packages"
        Write-Info "Building enterprise-commons + enterprise-host + solution shared packages"
        Write-Info "Skipping enterprise-solutions UI plugins (use dev server per architecture)"

        # 企业版解决方案 UI 插件（web + mobile）依赖宿主运行时的共享依赖
        # （@brix-sdk/* 来自 brix 仓库），无法在 enterprise 仓库内独立编译。
        # 按蓝图设计："插件使用 rspack dev server 热重载，无需预编译"
        #
        # 编译范围：
        #   ✓ enterprise-commons（企业框架包，tsup 叶子包）
        #   ✓ enterprise-host-standalone-web（宿主应用，rspack production）
        #   ✓ enterprise-solutions/*-shared（类型契约包，tsup，无运行时依赖）
        #   ✓ tenant-shared（租户类型包，tsc）
        #   ✗ enterprise-solutions UI 包（web/mobile，依赖跨仓库 MF 共享依赖）
        $solutionUiExcludes = @()
        $solutionDir = Join-Path $Script:EnterpriseRoot "packages\@brix\enterprise-solutions"
        if (Test-Path $solutionDir) {
            $solutionPkgFiles = Get-ChildItem -Path $solutionDir -Recurse -Filter "package.json" |
                Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "dist[\\/]" }
            foreach ($file in $solutionPkgFiles) {
                try {
                    $rawContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
                    $pkg = $rawContent | ConvertFrom-Json
                    $pkgName = $pkg.name
                    # 仅保留 *-shared 类型契约包，排除所有 UI 包（web/mobile/rspack/tsup）
                    if ($pkgName -and $pkgName -notmatch '-shared$') {
                        $solutionUiExcludes += $pkgName
                        Write-Info "  Skipping solution plugin: $pkgName"
                    }
                } catch {
                    try {
                        $rawText = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
                        $nameMatch = [regex]::Match($rawText, '"name"\s*:\s*"([^"]+)"')
                        if ($nameMatch.Success -and $nameMatch.Groups[1].Value -notmatch '-shared$') {
                            $solutionUiExcludes += $nameMatch.Groups[1].Value
                            Write-Info "  Skipping solution plugin (text fallback): $($nameMatch.Groups[1].Value)"
                        }
                    } catch {}
                }
            }
        }

        $result = Invoke-PnpmBuild `
            -ProjectRoot $Script:EnterpriseRoot `
            -ProjectName "brix-enterprise (Layer 4-5)" `
            -ExcludePatterns $solutionUiExcludes

        if (-not $result) {
            Write-Fail "brix-enterprise build failed. Aborting."
            exit 1
        }
    }

    # ---- Restore NODE_OPTIONS ----
    $env:NODE_OPTIONS = $origNodeOptions

    # ---- Summary ----
    $totalElapsed = (Get-Date) - $Script:StartTime

    Write-Header "Build Summary"

    $layerSummary = switch ($Mode) {
        "Full"       { "Layer 1-5 (Core + Enterprise)" }
        "Core"       { "Layer 1-3 (Core Packages)" }
        "Enterprise" { "Layer 4-5 (Enterprise Packages)" }
        "Libs"       { "Layer 1-3 (Library Packages)" }
    }

    Write-Success "Mode: $Mode - $layerSummary"
    Write-Success "Total time: $(Format-Duration $totalElapsed)"
    Write-Host ""

    if ($Mode -in @("Full", "Core", "Libs")) {
        Write-Info "Built libraries:"
        Write-Info "  Layer 1: runtime-sdk-api-web, runtime-sdk-react, runtime-orchestrator-web"
        Write-Info "           runtime-manifest-web, shared-runtime-web"
        Write-Info "  Layer 2: infra-adapter-ui-mui, infra-adapter-ui-native, infra-adapter-http-web"
        Write-Info "           infra-adapter-mf-web, infra-adapter-router-web, infra-adapter-state-web"
        Write-Info "  Layer 3: platform-auth-web, platform-i18n-web, platform-navigation-web"
        Write-Info "           platform-eventbus-web, platform-config-web, platform-router-web"
    }
    if ($Mode -in @("Full", "Enterprise")) {
        Write-Info "  Layer 4: enterprise-commons"
        Write-Info "  Layer 5: enterprise-host (rspack production build)"
    }

    Write-Host ""
    Write-Info "Next steps:"
    Write-Info "  - Start dev servers: .\start-frontend.ps1 -Plugin partners"
    Write-Info "  - Start all:         .\start-frontend.ps1"
    Write-Info "  - Stop servers:      .\stop-frontend.ps1 -Force"
}

Main
