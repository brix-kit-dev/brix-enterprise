<#
.SYNOPSIS
    Brix Platform v3.0 Runtime Shell Architecture Compliance Check Script.

.DESCRIPTION
    This script checks code repositories for compliance with the 8 architecture red lines
    defined in the v3.0 Runtime Shell Architecture Design Blueprint.
    
    Checks include:
    1. Red Line 1: Infrastructure adapter direct dependency check
    2. Red Line 2: Middleware client direct usage check (Kafka/Redis)
    3. Red Line 3: HTTP client direct usage check (RestTemplate/WebClient)
    4. Red Line 4: Cross-module direct call check (NEW)
    5. Red Line 5: Spring container API direct usage check
    6. Red Line 6: Configuration retrieval method check
    7. Red Line 7: Generic exception + Logger in domain layer check (NEW)
    8. Red Line 8: Event publish/subscribe method check (NEW)

    TypeScript Frontend Checks (NEW):
    - Direct fetch() usage
    - Direct localStorage/sessionStorage access
    - Direct @brix/infra-adapter-* imports

.PARAMETER RepositoryPath
    The root directory path of the code repository to check.

.PARAMETER OutputFormat
    Output format: Console, JSON, or Markdown. Defaults to Console.

.PARAMETER ShowDetails
    Whether to show detailed check process.

.PARAMETER IncludeTypeScript
    Whether to include TypeScript/TSX file scanning. Defaults to true.

.EXAMPLE
    .\architecture-compliance-check.ps1 -RepositoryPath "D:\1.Sources\plugins"
    
    Check the plugins repository for architecture compliance.

.EXAMPLE
    .\architecture-compliance-check.ps1 -RepositoryPath "D:\1.Sources\plugins" -IncludeTypeScript $false
    
    Check only Java files, skip TypeScript scanning.

.NOTES
    Version: 3.1.0
    Author: Brix Architecture Team / Brix Architecture Team
    Date: 2026-02-14
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$RepositoryPath,

    [Parameter(Mandatory = $false)]
    [ValidateSet("Console", "JSON", "Markdown")]
    [string]$OutputFormat = "Console",

    [Parameter(Mandatory = $false)]
    [switch]$ShowDetails,

    [Parameter(Mandatory = $false)]
    [bool]$IncludeTypeScript = $true
)

# Script version
$Script:Version = "3.1.0"

# Violation pattern definitions
$Script:ViolationPatterns = @{
    # Red Line 2: Direct Kafka usage
    "Kafka_KafkaTemplate" = @{
        Pattern     = "KafkaTemplate"
        RedLine     = 2
        Severity    = "Critical"
        Description = "Direct KafkaTemplate usage forbidden"
        Suggestion  = "Use EventBusCapability to publish events"
        FileType    = "Java"
    }
    "Kafka_KafkaListener" = @{
        Pattern     = "@KafkaListener"
        RedLine     = 2
        Severity    = "Critical"
        Description = "KafkaListener annotation forbidden"
        Suggestion  = "Declare event subscriptions in module-manifest.yaml"
        FileType    = "Java"
    }
    "Kafka_Import" = @{
        Pattern     = "import\s+org\.springframework\.kafka\."
        RedLine     = 2
        Severity    = "Critical"
        Description = "Spring Kafka package import forbidden"
        Suggestion  = "Remove Kafka dependency, use EventBusCapability"
        FileType    = "Java"
    }
    "Kafka_ApacheImport" = @{
        Pattern     = "import\s+org\.apache\.kafka\."
        RedLine     = 2
        Severity    = "Critical"
        Description = "Apache Kafka package import forbidden"
        Suggestion  = "Remove Kafka dependency, use EventBusCapability"
        FileType    = "Java"
    }

    # Red Line 2: Direct Redis usage
    "Redis_RedisTemplate" = @{
        Pattern     = "RedisTemplate"
        RedLine     = 2
        Severity    = "Critical"
        Description = "Direct RedisTemplate usage forbidden"
        Suggestion  = "Use CacheCapability for cache operations"
        FileType    = "Java"
    }
    "Redis_StringRedisTemplate" = @{
        Pattern     = "StringRedisTemplate"
        RedLine     = 2
        Severity    = "Critical"
        Description = "Direct StringRedisTemplate usage forbidden"
        Suggestion  = "Use CacheCapability for cache operations"
        FileType    = "Java"
    }
    "Redis_Import" = @{
        Pattern     = "import\s+org\.springframework\.data\.redis\."
        RedLine     = 2
        Severity    = "Critical"
        Description = "Spring Data Redis package import forbidden"
        Suggestion  = "Remove Redis dependency, use CacheCapability"
        FileType    = "Java"
    }
    "Redis_Jedis" = @{
        Pattern     = "import\s+redis\.clients\.jedis\."
        RedLine     = 2
        Severity    = "Critical"
        Description = "Jedis package import forbidden"
        Suggestion  = "Remove Jedis dependency, use CacheCapability"
        FileType    = "Java"
    }
    "Redis_Lettuce" = @{
        Pattern     = "import\s+io\.lettuce\.core\."
        RedLine     = 2
        Severity    = "Critical"
        Description = "Lettuce package import forbidden"
        Suggestion  = "Remove Lettuce dependency, use CacheCapability"
        FileType    = "Java"
    }

    # Red Line 3: Direct HTTP client usage
    "Http_RestTemplate" = @{
        Pattern     = "RestTemplate"
        RedLine     = 3
        Severity    = "Critical"
        Description = "Direct RestTemplate usage forbidden"
        Suggestion  = "Use HttpCapability for HTTP requests"
        FileType    = "Java"
    }
    "Http_WebClient" = @{
        Pattern     = "WebClient"
        RedLine     = 3
        Severity    = "Critical"
        Description = "Direct WebClient usage forbidden"
        Suggestion  = "Use HttpCapability for HTTP requests"
        FileType    = "Java"
    }
    "Http_FeignClient" = @{
        Pattern     = "@FeignClient"
        RedLine     = 3
        Severity    = "Critical"
        Description = "FeignClient annotation forbidden"
        Suggestion  = "Use HttpCapability for HTTP requests"
        FileType    = "Java"
    }
    "Http_OkHttp" = @{
        Pattern     = "import\s+okhttp3\."
        RedLine     = 3
        Severity    = "Critical"
        Description = "OkHttp package import forbidden"
        Suggestion  = "Remove OkHttp dependency, use HttpCapability"
        FileType    = "Java"
    }
    "Http_ApacheHttp" = @{
        Pattern     = "import\s+org\.apache\.http\."
        RedLine     = 3
        Severity    = "Critical"
        Description = "Apache HttpClient package import forbidden"
        Suggestion  = "Remove Apache HttpClient dependency, use HttpCapability"
        FileType    = "Java"
    }

    # Red Line 4: Cross-module direct call (NEW)
    "CrossModule_DirectImport" = @{
        Pattern     = "import\s+io\.brix\.enterprise\.app\.(?!(?:common|shared))[a-z]+\."
        RedLine     = 4
        Severity    = "Critical"
        Description = "Direct import from another business module forbidden"
        Suggestion  = "Use EventBusCapability or HttpCapability for cross-module communication"
        FileType    = "Java"
    }
    "CrossModule_ServiceCall" = @{
        Pattern     = "@Autowired.*(?:Booking|Identity|Products|Partners|Contracts|Carousel|Messenger)Service"
        RedLine     = 4
        Severity    = "Critical"
        Description = "Direct autowiring of another module's service forbidden"
        Suggestion  = "Use event-driven communication or HTTP API calls via Capability"
        FileType    = "Java"
    }

    # Red Line 5: Direct Spring container API usage
    "Spring_ApplicationContext" = @{
        Pattern     = "ApplicationContext"
        RedLine     = 5
        Severity    = "Warning"
        Description = "Direct ApplicationContext usage not recommended"
        Suggestion  = "Use constructor injection for dependencies"
        FileType    = "Java"
    }
    "Spring_BeanFactory" = @{
        Pattern     = "BeanFactory"
        RedLine     = 5
        Severity    = "Warning"
        Description = "Direct BeanFactory usage not recommended"
        Suggestion  = "Use constructor injection for dependencies"
        FileType    = "Java"
    }

    # Red Line 1: Direct infrastructure adapter dependency
    "Infra_KafkaAdapter" = @{
        Pattern     = "import\s+io\.brix\.infra\.adapter\.kafka\."
        RedLine     = 1
        Severity    = "Critical"
        Description = "Kafka adapter package import forbidden"
        Suggestion  = "Business modules can only depend on runtime-sdk-api"
        FileType    = "Java"
    }
    "Infra_RedisAdapter" = @{
        Pattern     = "import\s+io\.brix\.infra\.adapter\.redis\."
        RedLine     = 1
        Severity    = "Critical"
        Description = "Redis adapter package import forbidden"
        Suggestion  = "Business modules can only depend on runtime-sdk-api"
        FileType    = "Java"
    }
    "Infra_WebhookAdapter" = @{
        Pattern     = "import\s+io\.brix\.infra\.adapter\.webhook\."
        RedLine     = 1
        Severity    = "Critical"
        Description = "Webhook adapter package import forbidden"
        Suggestion  = "Business modules can only depend on runtime-sdk-api"
        FileType    = "Java"
    }
    "Infra_OtelAdapter" = @{
        Pattern     = "import\s+io\.brix\.infra\.adapter\.otel\."
        RedLine     = 1
        Severity    = "Critical"
        Description = "OTEL adapter package import forbidden"
        Suggestion  = "Business modules can only depend on runtime-sdk-api"
        FileType    = "Java"
    }

    # Red Line 6: Configuration retrieval method
    "Config_SystemGetenv" = @{
        Pattern     = "System\.getenv\("
        RedLine     = 6
        Severity    = "Warning"
        Description = "Direct environment variable reading not recommended"
        Suggestion  = "Use ConfigCapability to get configuration"
        FileType    = "Java"
    }
    "Config_SystemGetProperty" = @{
        Pattern     = "System\.getProperty\("
        RedLine     = 6
        Severity    = "Warning"
        Description = "Direct system property reading not recommended"
        Suggestion  = "Use ConfigCapability to get configuration"
        FileType    = "Java"
    }

    # Red Line 7: Generic exception + Logger in domain layer (NEW)
    "Exception_Generic" = @{
        Pattern     = "throw\s+new\s+(Exception|RuntimeException|Throwable)\s*\("
        RedLine     = 7
        Severity    = "Warning"
        Description = "Throwing generic exception not recommended"
        Suggestion  = "Use specific business exception types (e.g., BookingNotFoundException)"
        FileType    = "Java"
    }
    "Logger_InDomain_Entity" = @{
        Pattern     = "LoggerFactory\.getLogger.*(?:Entity|ValueObject|DomainEvent)"
        RedLine     = 7
        Severity    = "Warning"
        Description = "Logger in domain entity/value object not recommended"
        Suggestion  = "Domain layer should be pure, logging should be in service layer"
        FileType    = "Java"
    }
    "Logger_InDomain_Package" = @{
        Pattern     = "package\s+io\.brix\.enterprise\.app\.[a-z]+\.(?:domain|entity|model);"
        RedLine     = 7
        Severity    = "Info"
        Description = "Domain package detected - will check for Logger usage"
        Suggestion  = "Ensure no Logger usage in domain layer"
        FileType    = "Java"
        FollowUp    = "Logger_InDomain_Check"
    }

    # Red Line 8: Event publish/subscribe method (NEW)
    "Event_ApplicationEventPublisher" = @{
        Pattern     = "ApplicationEventPublisher"
        RedLine     = 8
        Severity    = "Critical"
        Description = "Direct ApplicationEventPublisher usage forbidden"
        Suggestion  = "Use EventBusCapability to publish events"
        FileType    = "Java"
    }
    "Event_PublishEvent" = @{
        Pattern     = "\.publishEvent\("
        RedLine     = 8
        Severity    = "Critical"
        Description = "Direct publishEvent() call forbidden"
        Suggestion  = "Use EventBusCapability.publish() instead"
        FileType    = "Java"
    }
    "Event_EventListener" = @{
        Pattern     = "@EventListener"
        RedLine     = 8
        Severity    = "Critical"
        Description = "@EventListener annotation forbidden in business modules"
        Suggestion  = "Declare event subscriptions in module-manifest.yaml"
        FileType    = "Java"
    }
    "Event_TransactionalEventListener" = @{
        Pattern     = "@TransactionalEventListener"
        RedLine     = 8
        Severity    = "Critical"
        Description = "@TransactionalEventListener annotation forbidden"
        Suggestion  = "Use EventBusCapability with transactional outbox pattern"
        FileType    = "Java"
    }

    # ==================== TypeScript Patterns (NEW) ====================

    # Red Line 1: Direct infrastructure adapter import (TypeScript)
    "TS_InfraAdapter" = @{
        Pattern     = "from\s+['\"]@brix/infra-adapter-"
        RedLine     = 1
        Severity    = "Critical"
        Description = "Direct infra-adapter import forbidden (TypeScript)"
        Suggestion  = "Business modules can only depend on @brix/runtime-sdk-api-web"
        FileType    = "TypeScript"
    }

    # Red Line 3: Direct HTTP fetch (TypeScript)
    "TS_DirectFetch" = @{
        Pattern     = "\bfetch\s*\("
        RedLine     = 3
        Severity    = "Critical"
        Description = "Direct fetch() usage forbidden (TypeScript)"
        Suggestion  = "Use HttpCapability for HTTP requests"
        FileType    = "TypeScript"
    }
    "TS_Axios" = @{
        Pattern     = "from\s+['\"]axios['\"]"
        RedLine     = 3
        Severity    = "Critical"
        Description = "Direct axios import forbidden (TypeScript)"
        Suggestion  = "Use HttpCapability for HTTP requests"
        FileType    = "TypeScript"
    }

    # Red Line 6: Direct localStorage/sessionStorage (TypeScript)
    "TS_LocalStorage" = @{
        Pattern     = "\blocalStorage\b"
        RedLine     = 6
        Severity    = "Warning"
        Description = "Direct localStorage usage not recommended (TypeScript)"
        Suggestion  = "Use StateCapability for state management"
        FileType    = "TypeScript"
    }
    "TS_SessionStorage" = @{
        Pattern     = "\bsessionStorage\b"
        RedLine     = 6
        Severity    = "Warning"
        Description = "Direct sessionStorage usage not recommended (TypeScript)"
        Suggestion  = "Use StateCapability for state management"
        FileType    = "TypeScript"
    }

    # Red Line 8: Direct EventEmitter (TypeScript)
    "TS_EventEmitter" = @{
        Pattern     = "from\s+['\"]events['\"]"
        RedLine     = 8
        Severity    = "Critical"
        Description = "Direct EventEmitter import forbidden (TypeScript)"
        Suggestion  = "Use @brix/platform-eventbus-web for event communication"
        FileType    = "TypeScript"
    }
    "TS_Mitt" = @{
        Pattern     = "from\s+['\"]mitt['\"]"
        RedLine     = 8
        Severity    = "Critical"
        Description = "Direct mitt import forbidden (TypeScript)"
        Suggestion  = "Use @brix/platform-eventbus-web for event communication"
        FileType    = "TypeScript"
    }
}

# Excluded directories
$Script:ExcludeDirs = @(
    "target",
    "build",
    "node_modules",
    ".git",
    ".idea",
    ".gradle",
    "bin",
    "out",
    "dist",
    ".next",
    ".nuxt"
)

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error")]
        [string]$Type = "Info"
    )
    
    $icon = switch ($Type) {
        "Info"    { "[i]"; "Cyan" }
        "Success" { "[OK]"; "Green" }
        "Warning" { "[!]"; "Yellow" }
        "Error"   { "[X]"; "Red" }
    }
    
    Write-ColorText "$($icon[0]) $Message" $icon[1]
}

function Test-FileViolations {
    param(
        [string]$FilePath,
        [string]$FileType = "Java"
    )
    
    $violations = @()
    $content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
    
    if ([string]::IsNullOrEmpty($content)) {
        return $violations
    }
    
    $lines = Get-Content -Path $FilePath -ErrorAction SilentlyContinue
    $lineNumber = 0
    
    foreach ($line in $lines) {
        $lineNumber++
        
        foreach ($patternName in $Script:ViolationPatterns.Keys) {
            $patternInfo = $Script:ViolationPatterns[$patternName]
            
            # 检查文件类型匹配（如果指定了 FileType）
            $patternFileType = $patternInfo.FileType
            if ($null -eq $patternFileType) {
                $patternFileType = "Java"  # 默认为 Java
            }
            
            # 跳过不匹配的文件类型
            if ($patternFileType -ne $FileType) {
                continue
            }
            
            if ($line -match $patternInfo.Pattern) {
                $violation = [PSCustomObject]@{
                    File        = $FilePath
                    Line        = $lineNumber
                    PatternName = $patternName
                    RedLine     = $patternInfo.RedLine
                    Severity    = $patternInfo.Severity
                    Description = $patternInfo.Description
                    Suggestion  = $patternInfo.Suggestion
                    MatchedText = $line.Trim()
                    FileType    = $FileType
                }
                $violations += $violation
            }
        }
    }
    
    return $violations
}

function Get-JavaFiles {
    param(
        [string]$Path
    )
    
    $files = @()
    
    Get-ChildItem -Path $Path -Recurse -File -Filter "*.java" -ErrorAction SilentlyContinue | ForEach-Object {
        $skip = $false
        foreach ($excludeDir in $Script:ExcludeDirs) {
            if ($_.FullName -like "*\$excludeDir\*") {
                $skip = $true
                break
            }
        }
        
        if (-not $skip) {
            $files += $_.FullName
        }
    }
    
    return $files
}

function Get-TypeScriptFiles {
    param(
        [string]$Path
    )
    
    $files = @()
    
    # 获取 .ts 和 .tsx 文件（排除 .d.ts 类型定义文件和测试文件）
    Get-ChildItem -Path $Path -Recurse -File -Include "*.ts", "*.tsx" -ErrorAction SilentlyContinue | ForEach-Object {
        $skip = $false
        
        # 排除目录
        foreach ($excludeDir in $Script:ExcludeDirs) {
            if ($_.FullName -like "*\$excludeDir\*") {
                $skip = $true
                break
            }
        }
        
        # 排除类型定义文件
        if ($_.Name -like "*.d.ts") {
            $skip = $true
        }
        
        # 排除测试文件
        if ($_.Name -like "*.test.ts" -or $_.Name -like "*.test.tsx" -or $_.Name -like "*.spec.ts" -or $_.Name -like "*.spec.tsx") {
            $skip = $true
        }
        
        if (-not $skip) {
            $files += $_.FullName
        }
    }
    
    return $files
}

function Write-ConsoleReport {
    param(
        [array]$Violations,
        [int]$TotalJavaFiles,
        [int]$TotalTsFiles,
        [double]$Duration
    )
    
    $TotalFiles = $TotalJavaFiles + $TotalTsFiles
    
    Write-Host ""
    Write-ColorText "========================================" "Cyan"
    Write-ColorText "  Brix Platform v3.0 Architecture" "Cyan"
    Write-ColorText "  Compliance Check Report" "Cyan"
    Write-ColorText "========================================" "Cyan"
    Write-Host ""
    
    Write-Host "Check Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Repository: $RepositoryPath"
    Write-Host "Files Scanned: $TotalJavaFiles Java files, $TotalTsFiles TypeScript files"
    Write-Host "Duration: $([math]::Round($Duration, 2)) seconds"
    Write-Host ""
    
    if ($Violations.Count -eq 0) {
        Write-Status "Congratulations! No architecture violations found" "Success"
        Write-Host ""
        return
    }
    
    # Group by red line
    $byRedLine = $Violations | Group-Object -Property RedLine | Sort-Object Name
    
    Write-ColorText "Violation Summary (by Red Line):" "Yellow"
    Write-Host ""
    
    foreach ($group in $byRedLine) {
        $redLineNum = $group.Name
        $count = $group.Count
        Write-ColorText "  Red Line $redLineNum : $count violations" "Red"
    }
    
    # Group by file type
    Write-Host ""
    Write-ColorText "Violation Summary (by File Type):" "Yellow"
    $javaViolations = ($Violations | Where-Object { $_.FileType -eq "Java" }).Count
    $tsViolations = ($Violations | Where-Object { $_.FileType -eq "TypeScript" }).Count
    Write-Host "  Java: $javaViolations violations"
    Write-Host "  TypeScript: $tsViolations violations"
    
    Write-Host ""
    Write-ColorText "----------------------------------------" "Gray"
    Write-ColorText "Detailed Violation List:" "Yellow"
    Write-Host ""
    
    # Sort by severity and file
    $sortedViolations = $Violations | Sort-Object @{Expression = {$_.Severity -eq "Critical"}; Descending = $true}, File, Line
    
    $currentFile = ""
    foreach ($v in $sortedViolations) {
        if ($v.File -ne $currentFile) {
            $currentFile = $v.File
            $relativePath = $v.File.Replace($RepositoryPath, "").TrimStart("\", "/")
            Write-Host ""
            $fileTypeLabel = if ($v.FileType -eq "TypeScript") { "[TS]" } else { "[Java]" }
            Write-ColorText "File: $fileTypeLabel $relativePath" "White"
        }
        
        $severityColor = if ($v.Severity -eq "Critical") { "Red" } else { "Yellow" }
        $severityIcon = if ($v.Severity -eq "Critical") { "X" } else { "!" }
        
        Write-Host "  [$severityIcon] Line $($v.Line): " -NoNewline
        Write-ColorText "[Red Line $($v.RedLine)] $($v.Description)" $severityColor
        Write-Host "      Suggestion: $($v.Suggestion)" -ForegroundColor Gray
        
        if ($ShowDetails) {
            Write-Host "      Code: $($v.MatchedText)" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    Write-ColorText "----------------------------------------" "Gray"
    
    $criticalCount = ($Violations | Where-Object { $_.Severity -eq "Critical" }).Count
    $warningCount = ($Violations | Where-Object { $_.Severity -eq "Warning" }).Count
    
    Write-Host ""
    Write-ColorText "Total: $($Violations.Count) violations (Critical: $criticalCount, Warning: $warningCount)" "Yellow"
    Write-Host ""
    
    if ($criticalCount -gt 0) {
        Write-Status "Critical violations found! Please fix before committing." "Error"
    } else {
        Write-Status "Only warnings found. Recommended to fix but not blocking." "Warning"
    }
}

function Write-JsonReport {
    param(
        [array]$Violations,
        [int]$TotalJavaFiles,
        [int]$TotalTsFiles,
        [double]$Duration
    )
    
    $TotalFiles = $TotalJavaFiles + $TotalTsFiles
    
    $report = @{
        metadata = @{
            version        = $Script:Version
            timestamp      = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            repository     = $RepositoryPath
            totalFiles     = $TotalFiles
            javaFiles      = $TotalJavaFiles
            typeScriptFiles = $TotalTsFiles
            duration       = [math]::Round($Duration, 2)
        }
        summary = @{
            totalViolations = $Violations.Count
            criticalCount   = ($Violations | Where-Object { $_.Severity -eq "Critical" }).Count
            warningCount    = ($Violations | Where-Object { $_.Severity -eq "Warning" }).Count
            javaViolations  = ($Violations | Where-Object { $_.FileType -eq "Java" }).Count
            tsViolations    = ($Violations | Where-Object { $_.FileType -eq "TypeScript" }).Count
            byRedLine       = @{}
        }
        violations = @()
    }
    
    # Group by red line
    $byRedLine = $Violations | Group-Object -Property RedLine
    foreach ($group in $byRedLine) {
        $report.summary.byRedLine["redLine$($group.Name)"] = $group.Count
    }
    
    # Add violation details
    foreach ($v in $Violations) {
        $report.violations += @{
            file        = $v.File.Replace($RepositoryPath, "").TrimStart("\", "/")
            line        = $v.Line
            redLine     = $v.RedLine
            severity    = $v.Severity
            description = $v.Description
            suggestion  = $v.Suggestion
            matchedText = $v.MatchedText
            fileType    = $v.FileType
        }
    }
    
    $report | ConvertTo-Json -Depth 10
}

function Write-MarkdownReport {
    param(
        [array]$Violations,
        [int]$TotalJavaFiles,
        [int]$TotalTsFiles,
        [double]$Duration
    )
    
    $TotalFiles = $TotalJavaFiles + $TotalTsFiles
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $durationRounded = [math]::Round($Duration, 2)
    $javaViolations = ($Violations | Where-Object { $_.FileType -eq "Java" }).Count
    $tsViolations = ($Violations | Where-Object { $_.FileType -eq "TypeScript" }).Count
    
    $md = @"
# Brix Platform v3.0 Architecture Compliance Report

## Basic Information

| Item | Value |
|------|-------|
| Check Time | $timestamp |
| Repository | ``$RepositoryPath`` |
| Java Files Scanned | $TotalJavaFiles files |
| TypeScript Files Scanned | $TotalTsFiles files |
| Total Files | $TotalFiles files |
| Duration | $durationRounded seconds |

## Violation Summary

"@

    if ($Violations.Count -eq 0) {
        $md += @"

OK **Congratulations! No architecture violations found**

Code complies with v3.0 Runtime Shell Architecture specifications.

"@
    } else {
        $criticalCount = ($Violations | Where-Object { $_.Severity -eq "Critical" }).Count
        $warningCount = ($Violations | Where-Object { $_.Severity -eq "Warning" }).Count
        
        $md += @"

| Level | Count |
|-------|-------|
| Critical | $criticalCount |
| Warning | $warningCount |
| **Total** | **$($Violations.Count)** |

### By File Type

| File Type | Count |
|-----------|-------|
| Java | $javaViolations |
| TypeScript | $tsViolations |

### By Red Line

| Red Line | Count | Description |
|----------|-------|-------------|
"@
        
        $byRedLine = $Violations | Group-Object -Property RedLine | Sort-Object Name
        foreach ($group in $byRedLine) {
            $redLineDesc = switch ($group.Name) {
                "1" { "Infrastructure adapter dependency" }
                "2" { "Middleware client direct usage" }
                "3" { "HTTP client direct usage" }
                "4" { "Cross-module communication" }
                "5" { "Spring container API usage" }
                "6" { "Configuration retrieval method" }
                "7" { "Logging method" }
                "8" { "Event publish/subscribe method" }
                default { "Other" }
            }
            $md += "| Red Line $($group.Name) | $($group.Count) | $redLineDesc |`n"
        }
        
        $md += @"

## Detailed Violation List

"@
        
        # Group by file
        $byFile = $Violations | Group-Object -Property File
        foreach ($fileGroup in $byFile) {
            $relativePath = $fileGroup.Name.Replace($RepositoryPath, "").TrimStart("\", "/")
            $fileType = $fileGroup.Group[0].FileType
            $fileTypeLabel = if ($fileType -eq "TypeScript") { "TypeScript" } else { "Java" }
            $md += "`n### ``$relativePath`` ($fileTypeLabel)`n`n"
            
            foreach ($v in $fileGroup.Group | Sort-Object Line) {
                $icon = if ($v.Severity -eq "Critical") { "X" } else { "!" }
                $md += "- $icon **Line $($v.Line)**: [Red Line $($v.RedLine)] $($v.Description)`n"
                $md += "  - Suggestion: $($v.Suggestion)`n"
            }
        }
        
        $md += @"

## Fix Recommendations

Please refer to the following documents for code fixes:

1. v3.0-Runtime-Shell-Architecture-Blueprint.md - Architecture design principles
2. v3.0-Code-Transformation-Checklist.md - Specific transformation steps

"@
    }
    
    Write-Output $md
}

# Main script
Write-Status "Starting repository scan: $RepositoryPath" "Info"

$startTime = Get-Date

# Get all Java files
$javaFiles = Get-JavaFiles -Path $RepositoryPath
$totalJavaFiles = $javaFiles.Count
Write-Status "Found $totalJavaFiles Java files" "Info"

# Get all TypeScript files (if enabled)
$tsFiles = @()
$totalTsFiles = 0
if ($IncludeTypeScript) {
    $tsFiles = Get-TypeScriptFiles -Path $RepositoryPath
    $totalTsFiles = $tsFiles.Count
    Write-Status "Found $totalTsFiles TypeScript files" "Info"
}

# Check each Java file
$allViolations = @()
$processedCount = 0
$totalFiles = $totalJavaFiles + $totalTsFiles

foreach ($file in $javaFiles) {
    $processedCount++
    
    if ($ShowDetails) {
        $percentage = [math]::Round(($processedCount / $totalFiles) * 100, 1)
        Write-Progress -Activity "Scanning Java files..." -Status "$processedCount / $totalFiles ($percentage%)" -PercentComplete $percentage
    }
    
    $violations = Test-FileViolations -FilePath $file -FileType "Java"
    $allViolations += $violations
}

# Check each TypeScript file (if enabled)
if ($IncludeTypeScript) {
    foreach ($file in $tsFiles) {
        $processedCount++
        
        if ($ShowDetails) {
            $percentage = [math]::Round(($processedCount / $totalFiles) * 100, 1)
            Write-Progress -Activity "Scanning TypeScript files..." -Status "$processedCount / $totalFiles ($percentage%)" -PercentComplete $percentage
        }
        
        $violations = Test-FileViolations -FilePath $file -FileType "TypeScript"
        $allViolations += $violations
    }
}

if ($ShowDetails) {
    Write-Progress -Activity "Scanning..." -Completed
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

# Output report
switch ($OutputFormat) {
    "Console" {
        Write-ConsoleReport -Violations $allViolations -TotalJavaFiles $totalJavaFiles -TotalTsFiles $totalTsFiles -Duration $duration
    }
    "JSON" {
        Write-JsonReport -Violations $allViolations -TotalJavaFiles $totalJavaFiles -TotalTsFiles $totalTsFiles -Duration $duration
    }
    "Markdown" {
        Write-MarkdownReport -Violations $allViolations -TotalJavaFiles $totalJavaFiles -TotalTsFiles $totalTsFiles -Duration $duration
    }
}

# Set exit code
if (($allViolations | Where-Object { $_.Severity -eq "Critical" }).Count -gt 0) {
    exit 1
} else {
    exit 0
}
