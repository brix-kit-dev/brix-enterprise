# ============================================================
# Brix Platform - 产品模式运行壳 Dockerfile
# ============================================================
# 
# 用途：构建产品模式运行壳容器镜像
# 模块：host-shell-standalone
#
# 构建命令：
#   docker build -t brix/host-shell-standalone:3.0.0 .
#
# 运行命令：
#   docker run -p 8081:8081 brix/host-shell-standalone:3.0.0
#
# ============================================================

FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="Brix Platform Team"
LABEL version="3.0.0-SNAPSHOT"
LABEL description="Brix Platform - Standalone Mode Runtime Shell"

# 创建非 root 用户
RUN addgroup -S brix && adduser -S brix -G brix
USER brix

WORKDIR /app

# 复制预构建的 JAR
COPY --chown=brix:brix target/host-shell-standalone-*-exec.jar app.jar

# 暴露端口
EXPOSE 8081

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# JVM 优化参数
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

# Spring Profile
ENV SPRING_PROFILES_ACTIVE="standalone"

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
