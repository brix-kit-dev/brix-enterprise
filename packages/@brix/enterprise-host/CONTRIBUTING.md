# Contributing to Brix Enterprise - Host Assembly

> **版本**: v3.2.0  
> **最后更新**: 2026-02-13

感谢您对 Brix Enterprise Host 的贡献！本文档提供了参与项目开发所需的指南。

## 目录

1. [开发环境设置](#开发环境设置)
2. [架构指南](#架构指南)
3. [开发规范](#开发规范)
4. [提交流程](#提交流程)

---

## 开发环境设置

### 环境要求

- **Java**: JDK 17+
- **Maven**: 3.8+
- **Docker**: 20.10+ (可选，用于容器化部署)

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/brix-platform/brix-enterprise.git
cd enterprise-host

# 2. 安装依赖并构建
mvn clean install

# 3. 启动 Host Shell
cd host-shell-standalone
mvn spring-boot:run

# 4. 使用 Docker 启动 (可选)
docker-compose up -d
```

### 项目结构

```
enterprise-host/
├── host-shell-embedded/              # 嵌入式 Shell (测试用)
│   ├── src/main/java/
│   │   └── io/brix/enterprise/host/
│   │       ├── HostShellApplication.java
│   │       └── config/
│   └── pom.xml
├── host-shell-standalone/            # 独立部署 Shell
│   ├── src/main/java/
│   │   └── io/brix/enterprise/host/
│   │       ├── HostShellApplication.java
│   │       └── config/
│   │           └── HostConfiguration.java
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── pom.xml
├── host-shell-standalone-web/        # 前端资源 Shell
│   └── ...
└── pom.xml
```

---

## 架构指南

### Host Assembly 职责

enterprise-host 是**后端 Host 壳层 (Layer 3)**，职责：

- 组装所有模块
- 提供应用入口
- 配置外部化
- 不包含任何实现代码

### 极薄Host架构原则 (Extreme Thin Host)

```
┌─────────────────────────────────────────────────────────────────┐
│  Host Shell (Layer 3) - 纯组装层                                │  ← 本仓库
│  • @SpringBootApplication                                       │
│  • @Import 导入各模块配置                                        │
│  • @Bean 组装第三方集成                                          │
│  • 零实现代码                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │ @Import
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  业务插件 (Layer 4)                                             │
│  • identity-server, booking-server, ...                         │
└─────────────────────────────────────────────────────────────────┘
                              │ 依赖
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  runtime-sdk-api (Layer 2) + infra-adapters (Layer 2.5)        │
└─────────────────────────────────────────────────────────────────┘
```

### 架构红线 (Architecture Red Lines)

| 红线编号 | Host 层规则 |
|---------|-------------|
| **R1** | 禁止循环依赖 |
| **R2** | 禁止 Host 依赖业务实现细节 |
| **R6** | 所有配置必须外部化 (application.yml) |

### Host 的最小代码量

```java
// ✅ Host 主类 - 仅启动入口
@SpringBootApplication
@Import({
    IdentityServerAutoConfiguration.class,
    BookingServerAutoConfiguration.class,
    RedisCacheAutoConfiguration.class
})
public class HostShellApplication {
    public static void main(String[] args) {
        SpringApplication.run(HostShellApplication.class, args);
    }
}
```

```java
// ✅ Host 配置类 - 仅组装第三方
@Configuration
public class HostConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .build();
    }
}
```

---

## 开发规范

### 主类规范

```java
/**
 * Host Shell 应用入口
 * 
 * 【架构说明】
 * 极薄 Host 主类，仅包含：
 * - SpringBoot 启动注解
 * - 模块配置导入
 * 
 * 【架构红线合规】
 * 本类不包含任何业务逻辑或实现代码，
 * 符合极薄 Host 架构原则。
 * 
 * @author Brix Team
 * @since 3.0.0
 */
@SpringBootApplication
@Import({
    // SDK 适配器
    RedisCacheAutoConfiguration.class,
    KafkaEventBusAutoConfiguration.class,
    
    // 业务插件
    IdentityServerAutoConfiguration.class,
    BookingServerAutoConfiguration.class,
    MessengerServerAutoConfiguration.class
})
public class HostShellApplication {
    
    /**
     * 应用入口方法
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(HostShellApplication.class, args);
    }
}
```

### 配置规范

```yaml
# application.yml - 外部化配置
# 【架构红线 R6 合规】
# 所有配置项都在此处定义，插件通过 @Value 或 @ConfigurationProperties 注入

spring:
  application:
    name: brix-host
    
# 业务插件配置
brix:
  identity:
    jwt:
      secret: ${JWT_SECRET:changeme}  # ⚠️ 生产环境必须通过环境变量配置
      expiration: 3600000
      
  booking:
    max-slots-per-day: 20
    
# 基础设施配置
redis:
  host: ${REDIS_HOST:localhost}
  port: ${REDIS_PORT:6379}
```

### Docker 配置规范

```yaml
# docker-compose.yml
# 【安全说明】敏感配置通过环境变量注入
version: '3.8'

services:
  host-shell:
    build: .
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=${JWT_SECRET}          # 从 .env 或 CI/CD 注入
      - REDIS_HOST=${REDIS_HOST:-redis}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - postgres
```

---

## 提交流程

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `config/xxx` - 配置变更
- `deps/xxx` - 依赖更新

### Commit 规范

```
feat(host-shell-standalone): add Kafka event bus configuration

添加 Kafka 事件总线自动配置。

Refs: #890
```

### Pull Request 检查清单

- [ ] Host 层无实现代码
- [ ] 仅使用 @Import/@Bean 进行组装
- [ ] 所有配置外部化到 application.yml
- [ ] 敏感配置使用环境变量
- [ ] 架构测试通过

---

## 联系方式

- **Issue 追踪**: GitHub Issues
- **技术讨论**: GitHub Discussions
- **安全问题**: security@brix.io

---

感谢您的贡献！
