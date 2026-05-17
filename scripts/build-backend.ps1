<#
.SYNOPSIS
    Brix Platform 全栈编译脚本
    
.DESCRIPTION
    编译 Brix Platform 所有后端 Java 模块和前端模块，包括：
    - brix (开源核心): runtime-sdk, infra-adapters, platform-commons, platform-devtools
    - brix-enterprise (企业版): enterprise-host, enterprise-solutions
    
    支持运行架构守护测试，确保代码符合 v3.0 运行壳架构蓝图约束。

.PARAMETER Mode
    编译模式：
    - Full: 完整编译（默认）
    - Core: 仅编译 brix 核心
    - Enterprise: 仅编译 brix-enterprise
    - Quick: 跳过测试的快速编译

.PARAMETER SkipTests
    跳过单元测试

.PARAMETER SkipFrontend
    跳过前端编译

.PARAMETER RunArchGuard
    运行架构守护测试（ArchUnit 规则检查）

.PARAMETER RunComplianceCheck
    运行架构合规检查脚本

.PARAMETER Clean
    执行 clean 操作

.PARAMETER Parallel
    启用并行编译

.EXAMPLE
    .\build-backend.ps1
    完整编译所有模块

.EXAMPLE
    .\build-backend.ps1 -Mode Quick
    快速编译（跳过测试）

.EXAMPLE
    .\build-backend.ps1 -RunArchGuard
    编译并运行架构守护测试

.EXAMPLE
    .\build-backend.ps1 -Mode Core -Clean
    清理并编译核心模块

.NOTES
    版本: 1.1.0
    作者: Brix Platform Team
    日期: 2026-03-01
    
    依赖项:
    - JDK 17+
    - Maven 3.8+
    - Node.js 18+
    - pnpm 8+
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("Full", "Core", "Enterprise", "Quick")]
    [string]$Mode = "Full",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipTests,

    [Parameter(Mandatory = $false)]
    [switch]$SkipFrontend,
    
    [Parameter(Mandatory = $false)]
    [switch]$RunArchGuard,
    
    [Parameter(Mandatory = $false)]
    [switch]$RunComplianceCheck,
    
    [Parameter(Mandatory = $false)]
    [switch]$Clean,
    
    [Parameter(Mandatory = $false)]
    [switch]$Parallel,
    
    [Parameter(Mandatory = $false)]
    [Alias("h", "?")]
    [switch]$Help
)

# ============================================================================
# 使用方法
# ============================================================================

function Show-Usage {
    $usage = @"
═══════════════════════════════════════════════════════════════════════════════
                    Brix Platform 后端编译脚本 使用指南
═══════════════════════════════════════════════════════════════════════════════

【基本语法】
    .\build-backend.ps1 [参数]

【编译模式 -Mode】
    Full        完整编译所有后端模块（默认）
    Core        仅编译 brix 开源核心模块
    Enterprise  仅编译 brix-enterprise 企业版模块
    Quick       快速编译（自动跳过所有测试）

【可选参数】
    -SkipTests          跳过单元测试
    -RunArchGuard       运行架构守护测试（ArchUnit 规则检查）
    -RunComplianceCheck 运行架构合规检查脚本
    -SkipFrontend       跳过前端编译
    -Clean              编译前执行 Maven clean
    -Parallel           启用并行编译（加速构建）
    -Help, -h, -?       显示此帮助信息

【常用示例】

    1. 完整编译所有后端模块（推荐首次使用）：
       .\build-backend.ps1

    2. 快速编译（跳过测试，日常开发推荐）：
       .\build-backend.ps1 -Mode Quick

    3. 清理后完整编译：
       .\build-backend.ps1 -Clean

    4. 并行编译加速：
       .\build-backend.ps1 -Parallel

    5. 仅编译核心模块：
       .\build-backend.ps1 -Mode Core

    6. 仅编译企业版模块：
       .\build-backend.ps1 -Mode Enterprise

    7. 完整编译 + 架构守护测试：
       .\build-backend.ps1 -RunArchGuard

    8. 完整编译 + 架构合规检查：
       .\build-backend.ps1 -RunComplianceCheck

    9. 清理后并行快速编译：
       .\build-backend.ps1 -Mode Quick -Clean -Parallel

    10. 完整构建 + 所有架构检查：
        .\build-backend.ps1 -RunArchGuard -RunComplianceCheck

【编译范围说明】

    本脚本编译以下模块：
    
    ┌─────────────────────────────────────────────────────────────────┐
    │  brix (开源核心)                                                │
    │    ├── runtime-sdk          运行时 SDK                         │
    │    ├── infra-adapters       基础设施适配器                      │
    │    ├── platform-commons     平台公共组件                        │
    │    └── platform-devtools    开发者工具                          │
    ├─────────────────────────────────────────────────────────────────┤
    │  brix-enterprise (企业版)                                       │
    │    ├── enterprise-host      企业版运行壳                        │
    │    └── enterprise-solutions 解决方案模块                        │
    └─────────────────────────────────────────────────────────────────┘

【环境要求】
    - JDK 17 或更高版本
    - Maven 3.8 或更高版本
    - Node.js 18 或更高版本
    - pnpm 8 或更高版本
    - 确保 java、mvn、node 和 pnpm 命令在 PATH 中

【注意事项】
    - 首次编译建议使用默认的 Full 模式
    - 日常开发可使用 Quick 模式加速
    - 提交代码前建议运行 -RunArchGuard 确保架构合规
    - 默认会执行前端编译；可通过 -SkipFrontend 跳过

═══════════════════════════════════════════════════════════════════════════════
"@
    Write-Host $usage -ForegroundColor Cyan
}

# ============================================================================
# 配置
# ============================================================================

$ErrorActionPreference = "Stop"
$Script:StartTime = Get-Date
$Script:Version = "1.1.0"

# 项目路径
$Script:SourceRoot = Split-Path -Parent $PSScriptRoot
$Script:BrixPath = Join-Path $Script:SourceRoot "brix"
$Script:BrixEnterprisePath = Join-Path $Script:SourceRoot "brix-enterprise"
$Script:ArchComplianceScript = Join-Path $Script:BrixEnterprisePath "packages\@brix\enterprise-solutions\scripts\architecture-compliance-check.ps1"

# 颜色输出
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
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

# ============================================================================
# Maven 构建函数
# ============================================================================

function Invoke-MavenBuild {
    param(
        [string]$ProjectPath,
        [string]$ProjectName,
        [bool]$SkipTests = $false,
        [bool]$Clean = $false,
        [bool]$Parallel = $false,
        [bool]$IncludeArchGuard = $false
    )
    
    Write-Step "Building $ProjectName..."
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Fail "Project path not found: $ProjectPath"
        return $false
    }
    
    Push-Location $ProjectPath
    try {
        # 构建 Maven 命令
        $mvnArgs = @()
        
        if ($Clean) {
            $mvnArgs += "clean"
        }
        
        $mvnArgs += "install"
        
        if ($SkipTests -and -not $IncludeArchGuard) {
            $mvnArgs += "-DskipTests"
        }
        
        if ($Parallel) {
            $mvnArgs += "-T", "1C"  # 每核心 1 个线程
        }
        
        # 添加常用优化参数
        $mvnArgs += "-B"  # 批处理模式
        $mvnArgs += "--no-transfer-progress"  # 减少输出
        
        Write-Info "Running: mvn $($mvnArgs -join ' ')"
        
        $process = Start-Process -FilePath "mvn" -ArgumentList $mvnArgs -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Success "$ProjectName build successful"
            return $true
        } else {
            Write-Fail "$ProjectName build failed (exit code: $($process.ExitCode))"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Test-ArchitectureGuard {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    Write-Step "Running ArchUnit architecture tests for $ProjectName..."
    
    Push-Location $ProjectPath
    try {
        # 运行带有特定 profile 的测试（假设有 arch-guard profile）
        $mvnArgs = @(
            "test",
            "-Dtest=*ArchitectureTest,*ArchGuardTest,*RedLineTest",
            "-DfailIfNoTests=false",
            "-B"
        )
        
        Write-Info "Running: mvn $($mvnArgs -join ' ')"
        
        $process = Start-Process -FilePath "mvn" -ArgumentList $mvnArgs -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Success "Architecture tests passed for $ProjectName"
            return $true
        } else {
            Write-Fail "Architecture tests failed for $ProjectName"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# Verdaccio 检查
# ============================================================================

$Script:VerdaccioPort = 4873
$Script:VerdaccioUrl = "http://localhost:$Script:VerdaccioPort"

function Test-VerdaccioRunning {
    try {
        $response = Invoke-WebRequest -Uri $Script:VerdaccioUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Ensure-VerdaccioRunning {
    <#
    .SYNOPSIS
        确保 Verdaccio 正在运行，前端构建需要它来解析 @brix/* 包
    #>
    
    if (Test-VerdaccioRunning) {
        Write-Info "Verdaccio is running at $Script:VerdaccioUrl"
        return $true
    }
    
    Write-Warn "Verdaccio is not running. Frontend build requires it for @brix/* packages."
    
    # 尝试自动启动
    $startScript = Join-Path $PSScriptRoot "start-verdaccio.ps1"
    if (Test-Path $startScript) {
        Write-Info "Attempting to start Verdaccio..."
        & $startScript
        
        if (Test-VerdaccioRunning) {
            return $true
        }
    }
    
    Write-Fail "Verdaccio is required for frontend build."
    Write-Host ""
    Write-Host "To fix this, run one of the following:" -ForegroundColor Yellow
    Write-Host "  1. .\start-verdaccio.ps1           # Start Verdaccio only" -ForegroundColor White
    Write-Host "  2. .\publish-to-verdaccio.ps1      # Start + publish packages" -ForegroundColor White
    Write-Host "  3. .\build-backend.ps1 -SkipFrontend  # Skip frontend build" -ForegroundColor White
    Write-Host ""
    
    return $false
}

function Invoke-FrontendBuild {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )

    Write-Step "Building frontend for $ProjectName..."

    if (-not (Test-Path $ProjectPath)) {
        Write-Fail "Project path not found: $ProjectPath"
        return $false
    }

    try {
        # 对于 brix-core，按依赖顺序分步构建
        if ($ProjectName -eq "brix-core") {
            Write-Info "Building brix-core frontend in dependency order..."
            
            # Layer 1: runtime-sdk (API contracts)
            $sdkPath = Join-Path $ProjectPath "packages\@brix\runtime-sdk"
            if (Test-Path $sdkPath) {
                Write-Info "Building runtime-sdk..."
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $sdkPath
                if ($proc.ExitCode -ne 0) {
                    Write-Fail "runtime-sdk build failed"
                    return $false
                }
            }
            
            # Layer 2: infra-adapters (implementations)
            $adapterPath = Join-Path $ProjectPath "packages\@brix\infra-adapters"
            if (Test-Path $adapterPath) {
                Write-Info "Building infra-adapters..."
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $adapterPath
                if ($proc.ExitCode -ne 0) {
                    Write-Fail "infra-adapters build failed"
                    return $false
                }
            }
            
            # Layer 3: platform-commons (client packages)
            $commonsPath = Join-Path $ProjectPath "packages\@brix\platform-commons"
            if (Test-Path $commonsPath) {
                Write-Info "Building platform-commons..."
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $commonsPath
                if ($proc.ExitCode -ne 0) {
                    Write-Fail "platform-commons build failed"
                    return $false
                }
            }
            
            # Layer 4: platform-devtools
            $devtoolsPath = Join-Path $ProjectPath "packages\@brix\platform-devtools"
            if (Test-Path $devtoolsPath) {
                Write-Info "Building platform-devtools..."
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $devtoolsPath
                if ($proc.ExitCode -ne 0) {
                    Write-Fail "platform-devtools build failed"
                    return $false
                }
            }
            
            Write-Success "brix-core frontend build successful"
            return $true
        }
        # 对于 brix-enterprise，按依赖顺序分步构建
        elseif ($ProjectName -eq "brix-enterprise") {
            Write-Info "Building brix-enterprise frontend in dependency order..."
            
            # Layer 1: enterprise-commons packages (migrated to platform-commons in task 3.11)
            # enterprise-frame-web → @brix-sdk/platform-frame-web (built in brix-core)
            # enterprise-frame-mobile → @brix-sdk/platform-frame-mobile (built in brix-core)
            
            # Layer 2: enterprise-host (directly build the frontend package)
            $hostWebPath = Join-Path $ProjectPath "packages\@brix\enterprise-host\host-shell-standalone-web"
            if (Test-Path $hostWebPath) {
                Write-Info "Building host-shell-standalone-web..."
                $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $hostWebPath
                if ($proc.ExitCode -ne 0) {
                    Write-Fail "host-shell-standalone-web build failed"
                    return $false
                }
            }
            
            # Layer 4: enterprise-solutions (逐个构建每个插件包)
            $solutionsPath = Join-Path $ProjectPath "packages\@brix\enterprise-solutions"
            if (Test-Path $solutionsPath) {
                Write-Info "Building enterprise-solutions plugins..."
                
                # 获取所有 app-* 目录并构建对应的 *-ui-web 前端包
                $appDirs = Get-ChildItem $solutionsPath -Directory | Where-Object { $_.Name -like "app-*" }
                foreach ($appDir in $appDirs) {
                    $appName = $appDir.Name -replace "^app-", ""
                    $uiWebPath = Join-Path $appDir.FullName "$appName-ui-web"
                    
                    if (Test-Path $uiWebPath) {
                        $pluginName = "$appName-ui-web"
                        Write-Info "  Building $pluginName..."
                        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow -WorkingDirectory $uiWebPath
                        if ($proc.ExitCode -ne 0) {
                            Write-Fail "$pluginName build failed"
                            return $false
                        }
                    }
                }
            }
            
            Write-Success "brix-enterprise frontend build successful"
            return $true
        }
        else {
            # Generic fallback
            Write-Info "Running: pnpm build"
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "pnpm", "build") -Wait -PassThru -NoNewWindow

            if ($process.ExitCode -eq 0) {
                Write-Success "$ProjectName frontend build successful"
                return $true
            } else {
                Write-Fail "$ProjectName frontend build failed (exit code: $($process.ExitCode))"
                return $false
            }
        }
    }
    catch {
        Write-Fail "$ProjectName frontend build error: $_"
        return $false
    }
}

# ============================================================================
# 架构合规检查
# ============================================================================

function Invoke-ComplianceCheck {
    Write-Step "Running architecture compliance check..."
    
    if (-not (Test-Path $Script:ArchComplianceScript)) {
        Write-Fail "Compliance check script not found: $Script:ArchComplianceScript"
        return $false
    }
    
    # 检查 enterprise-solutions
    $solutionsPath = Join-Path $Script:BrixEnterprisePath "packages\@brix\enterprise-solutions"
    
    Write-Info "Checking: $solutionsPath"
    
    try {
        & $Script:ArchComplianceScript -RepositoryPath $solutionsPath -OutputFormat Console
        Write-Success "Architecture compliance check completed"
        return $true
    }
    catch {
        Write-Fail "Architecture compliance check failed: $_"
        return $false
    }
}

# ============================================================================
# 主流程
# ============================================================================

function Main {
    # 检查是否显示帮助
    if ($Help) {
        Show-Usage
        return
    }
    
    Write-Header "Brix Platform Backend Build Script v$($Script:Version)"
    
    Write-Info "Mode: $Mode"
    Write-Info "Skip Tests: $SkipTests"
    Write-Info "Skip Frontend: $SkipFrontend"
    Write-Info "Run ArchGuard: $RunArchGuard"
    Write-Info "Run Compliance Check: $RunComplianceCheck"
    Write-Info "Clean: $Clean"
    Write-Info "Parallel: $Parallel"
    Write-Host ""
    
    # 检查环境
    Write-Step "Checking environment..."
    
    # ========================================================================
    # 自动配置 JAVA_HOME 和 PATH
    # ========================================================================
    $javaCmd = Get-Command "java" -ErrorAction SilentlyContinue
    if (-not $javaCmd) {
        # java 不在 PATH，尝试从 JAVA_HOME 修复
        if ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
            $javaBin = Join-Path $env:JAVA_HOME "bin"
            if (Test-Path $javaBin) {
                Write-Info "Adding JAVA_HOME\bin to PATH: $javaBin"
                $env:PATH = "$javaBin;$env:PATH"
            }
        }
        else {
            # 尝试常见 JDK 位置
            $commonJdkPaths = @(
                "D:\DevCache\.jdk\jdk-17.0.16",
                "C:\Program Files\Java\jdk-17",
                "C:\Program Files\Eclipse Adoptium\jdk-17*",
                "C:\Program Files\Microsoft\jdk-17*"
            )
            foreach ($pattern in $commonJdkPaths) {
                $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($found -and (Test-Path (Join-Path $found.FullName "bin\java.exe"))) {
                    $env:JAVA_HOME = $found.FullName
                    $env:PATH = (Join-Path $found.FullName "bin") + ";$env:PATH"
                    Write-Info "Auto-detected JAVA_HOME: $($found.FullName)"
                    break
                }
            }
        }
    }
    
    # ========================================================================
    # 自动配置 MAVEN_HOME 和 PATH
    # ========================================================================
    $mvnCmd = Get-Command "mvn" -ErrorAction SilentlyContinue
    if (-not $mvnCmd) {
        if ($env:MAVEN_HOME -and (Test-Path $env:MAVEN_HOME)) {
            $mvnBin = Join-Path $env:MAVEN_HOME "bin"
            if (Test-Path $mvnBin) {
                Write-Info "Adding MAVEN_HOME\bin to PATH: $mvnBin"
                $env:PATH = "$mvnBin;$env:PATH"
            }
        }
        elseif ($env:M2_HOME -and (Test-Path $env:M2_HOME)) {
            $mvnBin = Join-Path $env:M2_HOME "bin"
            if (Test-Path $mvnBin) {
                Write-Info "Adding M2_HOME\bin to PATH: $mvnBin"
                $env:PATH = "$mvnBin;$env:PATH"
            }
        }
        else {
            # 尝试常见 Maven 位置
            $commonMvnPaths = @(
                "D:\DevCache\.mvn\apache-maven-*",
                "C:\Program Files\Apache\Maven\apache-maven-*",
                "C:\apache-maven-*"
            )
            foreach ($pattern in $commonMvnPaths) {
                $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($found -and (Test-Path (Join-Path $found.FullName "bin\mvn.cmd"))) {
                    $env:MAVEN_HOME = $found.FullName
                    $env:PATH = (Join-Path $found.FullName "bin") + ";$env:PATH"
                    Write-Info "Auto-detected MAVEN_HOME: $($found.FullName)"
                    break
                }
            }
        }
    }
    
    # 临时允许错误继续（java -version 输出到 stderr）
    $ErrorActionPreference = "Continue"
    $javaVersion = & java -version 2>&1 | Select-String "version"
    $ErrorActionPreference = "Stop"
    
    if (-not $javaVersion) {
        Write-Fail "Java not found. Please install JDK 17+ or set JAVA_HOME."
        Write-Info "Hint: Set JAVA_HOME to your JDK installation directory."
        exit 1
    }
    Write-Info "Java: $javaVersion"
    Write-Info "JAVA_HOME: $env:JAVA_HOME"
    
    $ErrorActionPreference = "Continue"
    $mvnVersion = & mvn --version 2>&1 | Select-Object -First 1
    $ErrorActionPreference = "Stop"
    
    if (-not $mvnVersion) {
        Write-Fail "Maven not found. Please install Maven 3.8+ or set MAVEN_HOME."
        Write-Info "Hint: Set MAVEN_HOME to your Maven installation directory."
        exit 1
    }
    Write-Info "Maven: $mvnVersion"

    if (-not $SkipFrontend) {
        $ErrorActionPreference = "Continue"
        $nodeVersion = & node --version 2>&1
        $ErrorActionPreference = "Stop"

        if (-not $nodeVersion) {
            Write-Fail "Node.js not found. Please install Node.js 18+"
            exit 1
        }
        Write-Info "Node.js: $nodeVersion"

        $ErrorActionPreference = "Continue"
        $pnpmVersion = & pnpm --version 2>&1
        $ErrorActionPreference = "Stop"

        if (-not $pnpmVersion) {
            Write-Fail "pnpm not found. Please install pnpm 8+"
            exit 1
        }
        Write-Info "pnpm: $pnpmVersion"
    }
    
    $buildResults = @{}
    $overallSuccess = $true
    
    # ========================================================================
    # 1. 编译 Brix Core
    # ========================================================================
    if ($Mode -in @("Full", "Core", "Quick")) {
        Write-Header "Building Brix Core (Open Source)"
        
        $skipTestsForCore = ($Mode -eq "Quick") -or $SkipTests
        
        $result = Invoke-MavenBuild `
            -ProjectPath $Script:BrixPath `
            -ProjectName "brix-core" `
            -SkipTests $skipTestsForCore `
            -Clean $Clean `
            -Parallel $Parallel `
            -IncludeArchGuard $RunArchGuard
        
        $buildResults["brix-core"] = $result
        if (-not $result) { $overallSuccess = $false }
    }
    
    # ========================================================================
    # 2. 编译 Brix Enterprise
    # ========================================================================
    if ($Mode -in @("Full", "Enterprise", "Quick")) {
        Write-Header "Building Brix Enterprise"
        
        $skipTestsForEnterprise = ($Mode -eq "Quick") -or $SkipTests
        
        $result = Invoke-MavenBuild `
            -ProjectPath $Script:BrixEnterprisePath `
            -ProjectName "brix-enterprise" `
            -SkipTests $skipTestsForEnterprise `
            -Clean $Clean `
            -Parallel $Parallel `
            -IncludeArchGuard $RunArchGuard
        
        $buildResults["brix-enterprise"] = $result
        if (-not $result) { $overallSuccess = $false }
    }
    
    # ========================================================================
    # 3. 编译前端
    # ========================================================================
    if (-not $SkipFrontend) {
        Write-Header "Building Frontend"
        
        # 检查 Verdaccio 是否运行（前端构建需要它来解析 @brix/* 包）
        if (-not (Ensure-VerdaccioRunning)) {
            Write-Fail "Frontend build skipped due to Verdaccio not running"
            $buildResults["frontend"] = $false
            $overallSuccess = $false
        } else {

        if ($Mode -in @("Full", "Core", "Quick")) {
            $result = Invoke-FrontendBuild `
                -ProjectPath $Script:BrixPath `
                -ProjectName "brix-core"
            $buildResults["frontend-brix-core"] = $result
            if (-not $result) { $overallSuccess = $false }
        }

        if ($Mode -in @("Full", "Enterprise", "Quick")) {
            $result = Invoke-FrontendBuild `
                -ProjectPath $Script:BrixEnterprisePath `
                -ProjectName "brix-enterprise"
            $buildResults["frontend-brix-enterprise"] = $result
            if (-not $result) { $overallSuccess = $false }
        }
        
        } # end Verdaccio check
    }

    # ========================================================================
    # 4. 运行架构守护测试
    # ========================================================================
    if ($RunArchGuard -and $overallSuccess) {
        Write-Header "Running Architecture Guard Tests"
        
        # 测试 Core 架构规则
        if ($Mode -in @("Full", "Core")) {
            $result = Test-ArchitectureGuard -ProjectPath $Script:BrixPath -ProjectName "brix-core"
            $buildResults["arch-guard-core"] = $result
            if (-not $result) { $overallSuccess = $false }
        }
        
        # 测试 Enterprise 架构规则
        if ($Mode -in @("Full", "Enterprise")) {
            $result = Test-ArchitectureGuard -ProjectPath $Script:BrixEnterprisePath -ProjectName "brix-enterprise"
            $buildResults["arch-guard-enterprise"] = $result
            if (-not $result) { $overallSuccess = $false }
        }
    }
    
    # ========================================================================
    # 5. 运行架构合规检查
    # ========================================================================
    if ($RunComplianceCheck -and $overallSuccess) {
        Write-Header "Running Architecture Compliance Check"
        
        $result = Invoke-ComplianceCheck
        $buildResults["compliance-check"] = $result
        if (-not $result) { $overallSuccess = $false }
    }
    
    # ========================================================================
    # 输出结果摘要
    # ========================================================================
    Write-Header "Build Summary"
    
    $duration = (Get-Date) - $Script:StartTime
    
    foreach ($key in $buildResults.Keys) {
        $status = if ($buildResults[$key]) { "PASSED" } else { "FAILED" }
        $color = if ($buildResults[$key]) { "Green" } else { "Red" }
        Write-Host "  $key : $status" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "Duration: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
    
    if ($overallSuccess) {
        Write-Host ""
        Write-Host "  ============================================" -ForegroundColor Green
        Write-Host "  ||                                        ||" -ForegroundColor Green
        Write-Host "  ||       *** BUILD SUCCESSFUL ***        ||" -ForegroundColor Green
        Write-Host "  ||                                        ||" -ForegroundColor Green
        Write-Host "  ============================================" -ForegroundColor Green
        Write-Host ""
        exit 0
    } else {
        Write-Host ""
        Write-Host "  ############################################" -ForegroundColor Red
        Write-Host "  ##                                        ##" -ForegroundColor Red
        Write-Host "  ##         *** BUILD FAILED ***          ##" -ForegroundColor Red
        Write-Host "  ##                                        ##" -ForegroundColor Red
        Write-Host "  ############################################" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
}

# 执行主流程
Main
