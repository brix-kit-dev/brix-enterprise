#!/bin/bash
# ============================================================
# Shinwa Platform - 产品模式启动脚本
# ============================================================
# 
# 用途：构建并启动产品模式运行壳及所有依赖服务
# 模块：host-shell-standalone
#
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "  Shinwa Platform - 产品模式启动"
echo "============================================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 构建 Maven 项目（如果需要）
if [ "$1" == "--build" ] || [ ! -f "target/host-shell-standalone-*.jar" ]; then
    echo "📦 构建 Maven 项目..."
    cd ..
    mvn clean package -pl host-shell-standalone -am -DskipTests
    cd "$SCRIPT_DIR"
fi

# 启动服务
echo ""
echo "🚀 启动服务..."
docker compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📋 服务状态："
docker compose ps

echo ""
echo "============================================================"
echo "  服务启动完成！"
echo "============================================================"
echo ""
echo "🌐 访问地址："
echo "   - 运行壳 API:      http://localhost:8081"
echo "   - Grafana:         http://localhost:3000 (admin/\$GRAFANA_ADMIN_PASSWORD)"
echo "   - Prometheus:      http://localhost:9090"
echo "   - Jaeger:          http://localhost:16686"
echo ""
echo "📝 常用命令："
echo "   - 查看日志: docker compose logs -f host-shell"
echo "   - 停止服务: docker compose down"
echo "   - 重启服务: docker compose restart"
echo ""
