#!/bin/bash
# ============================================================
# Shinwa Platform - 嵌入模式启动脚本
# ============================================================
# 
# 用途：构建并启动嵌入模式运行壳（轻量级部署）
# 模块：host-shell-embedded
#
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "  Shinwa Platform - 嵌入模式启动"
echo "============================================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 构建 Maven 项目（如果需要）
if [ "$1" == "--build" ] || [ ! -f "target/host-shell-embedded-*.jar" ]; then
    echo "📦 构建 Maven 项目..."
    cd ..
    mvn clean package -pl host-shell-embedded -am -DskipTests
    cd "$SCRIPT_DIR"
fi

# 启动服务
echo ""
echo "🚀 启动服务..."
docker compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

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
echo "   - 运行壳 API:      http://localhost:8082"
echo ""
echo "📝 常用命令："
echo "   - 查看日志: docker compose logs -f host-shell"
echo "   - 停止服务: docker compose down"
echo "   - 重启服务: docker compose restart"
echo ""
