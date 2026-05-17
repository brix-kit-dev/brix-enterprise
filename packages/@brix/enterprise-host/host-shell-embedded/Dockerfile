# ============================================================
# Brix Platform - 嵌入模式运行壳 Dockerfile
# ============================================================
# 
# 用途：构建嵌入模式运行壳容器镜像
# 模块：host-shell-embedded
#
# 构建命令：
#   docker build -t brix/host-shell-embedded:3.0.0 .
#
# 运行命令：
#   docker run -p 8082:8082 brix/host-shell-embedded:3.0.0
#
# ============================================================

FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="Brix Platform Team"
LABEL version="3.0.0-SNAPSHOT"
LABEL description="Brix Platform - Embedded Mode Runtime Shell"

# 创建非 root 用户
RUN addgroup -S brix && adduser -S brix -G brix
USER brix

WORKDIR /app

# 复制预构建的 JAR
COPY --chown=brix:brix target/host-shell-embedded-*-exec.jar app.jar

# 暴露端口
EXPOSE 8082

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

# JVM 优化参数（嵌入模式使用更小的内存配置）
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=50.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

# Spring Profile
ENV SPRING_PROFILES_ACTIVE="embedded"

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
