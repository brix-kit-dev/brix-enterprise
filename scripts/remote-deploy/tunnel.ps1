# ============================================================
# SSH Tunnel - 安全访问远程内部服务
# ============================================================
#
# Purpose: 把远程服务器上仅绑定 127.0.0.1 的内部端口
#          (PostgreSQL/Redis/Kafka/MinIO/Observability)
#          安全转发到本地 localhost，供 DBeaver、RedisInsight、
#          MinIO Console、Jaeger UI 等客户端连接。
#
# Usage:
#   .\tunnel.ps1                    # 启动核心隧道（DB/Redis/Kafka/MinIO）
#   .\tunnel.ps1 -IncludeFull       # 同时转发 observability（Jaeger/Prometheus/Grafana/OTLP）
#   .\tunnel.ps1 -LocalPortOffset 1000  # 本地端口加偏移避免冲突，例 5432→6432
#
# 关闭：直接 Ctrl+C 终止此脚本（或关窗口）SSH 通道随之关闭
# ============================================================

param(
    [string]$SshTarget = "shinwa-vps",
    [switch]$IncludeFull,
    [int]$LocalPortOffset = 0
)

$ErrorActionPreference = "Stop"

# 端口映射表：(本地端口偏移基, 远端端口, 服务名, 客户端连接示例)
$Tunnels = @(
    @{ Local = 5432;  Remote = 5432;  Name = "PostgreSQL";    Hint = "DBeaver: localhost:{LOCAL} db=brix user=brix" },
    @{ Local = 6379;  Remote = 6379;  Name = "Redis";         Hint = "redis-cli -h localhost -p {LOCAL}" },
    @{ Local = 9092;  Remote = 9092;  Name = "Kafka";         Hint = "bootstrap.servers=localhost:{LOCAL}" },
    @{ Local = 9000;  Remote = 9000;  Name = "MinIO S3";      Hint = "S3 endpoint http://localhost:{LOCAL}" },
    @{ Local = 9001;  Remote = 9001;  Name = "MinIO Console"; Hint = "http://localhost:{LOCAL}  (minioadmin / .env)" }
)

if ($IncludeFull) {
    $Tunnels += @(
        @{ Local = 16686; Remote = 16686; Name = "Jaeger UI";   Hint = "http://localhost:{LOCAL}" },
        @{ Local = 9090;  Remote = 9090;  Name = "Prometheus";  Hint = "http://localhost:{LOCAL}" },
        @{ Local = 3000;  Remote = 3000;  Name = "Grafana";     Hint = "http://localhost:{LOCAL} (admin / .env)" },
        @{ Local = 4317;  Remote = 4317;  Name = "OTLP gRPC";   Hint = "OTLP gRPC localhost:{LOCAL}" },
        @{ Local = 4318;  Remote = 4318;  Name = "OTLP HTTP";   Hint = "OTLP HTTP localhost:{LOCAL}" }
    )
}

# 构造 ssh -L 参数
$LArgs = @()
foreach ($t in $Tunnels) {
    $localPort = $t.Local + $LocalPortOffset
    $LArgs += "-L"
    $LArgs += "${localPort}:localhost:$($t.Remote)"
    $t.LocalActual = $localPort
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SSH Tunnel -> $SshTarget" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "本机端口映射（数据全程经 SSH 加密通道）:" -ForegroundColor Yellow
foreach ($t in $Tunnels) {
    $hint = $t.Hint -replace '\{LOCAL\}', $t.LocalActual
    Write-Host ("  127.0.0.1:{0,-6} -> {1,-15} | {2}" -f $t.LocalActual, $t.Name, $hint) -ForegroundColor White
}
Write-Host ""
Write-Host "保持此窗口运行；Ctrl+C 关闭隧道" -ForegroundColor Gray
Write-Host ""

# -N: 不执行远端命令，仅做端口转发
# -T: 不分配 TTY
# ServerAliveInterval=30: 防止空闲断连
& ssh -N -T `
    -o ServerAliveInterval=30 `
    -o ServerAliveCountMax=3 `
    -o ExitOnForwardFailure=yes `
    @LArgs `
    $SshTarget
