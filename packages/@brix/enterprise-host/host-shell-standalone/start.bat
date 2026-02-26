@echo off
REM ============================================================
REM Shinwa Platform - 产品模式启动脚本 (Windows)
REM ============================================================
REM 
REM 用途：构建并启动产品模式运行壳及所有依赖服务
REM 模块：host-shell-standalone
REM
REM ============================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ============================================================
echo   Shinwa Platform - 产品模式启动
echo ============================================================
echo.

REM 检查 Docker 是否运行
docker info > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未运行，请先启动 Docker
    exit /b 1
)

REM 构建 Maven 项目（如果需要）
if "%1"=="--build" (
    echo 📦 构建 Maven 项目...
    cd ..
    call mvn clean package -pl host-shell-standalone -am -DskipTests
    cd host-shell-standalone
)

REM 启动服务
echo.
echo 🚀 启动服务...
docker compose up -d

echo.
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak > nul

REM 检查服务状态
echo.
echo 📋 服务状态：
docker compose ps

echo.
echo ============================================================
echo   服务启动完成！
echo ============================================================
echo.
echo 🌐 访问地址：
echo    - 运行壳 API:      http://localhost:8081
echo    - Grafana:         http://localhost:3000 (admin/$GRAFANA_ADMIN_PASSWORD)
echo    - Prometheus:      http://localhost:9090
echo    - Jaeger:          http://localhost:16686
echo.
echo 📝 常用命令：
echo    - 查看日志: docker compose logs -f host-shell
echo    - 停止服务: docker compose down
echo    - 重启服务: docker compose restart
echo.

endlocal
