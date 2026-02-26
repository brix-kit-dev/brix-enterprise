# Shinwa Solutions

> **版本**: 3.0.0  
> **日期**: 2026-01-27

---

## 架构定位

**Layer 1: 插件能力层（Plugin Layer）**

本仓库包含所有业务插件模块，每个插件仅依赖 runtime-sdk-api 能力契约。

```text
Layer 3: Host 层（组装层）        ← 加载本层插件
    ↓
Layer 2.5: 能力实现层            ← 本层不依赖
    ↓
Layer 2: 能力契约层              ← 仅依赖此层
    ↑
Layer 1: 插件能力层 ★ 本仓库 ★    ← 业务实现
```

### 架构红线

| 规则 | 说明 |
|------|------|
| ❌ 禁止依赖 infra-adapters | 不直接依赖适配器层 |
| ❌ 禁止依赖 Kafka/Redis 等 | 不直接依赖基础设施 |
| ❌ 禁止依赖其他插件内部类 | 插件间通过事件通信 |
| ✅ 仅依赖 runtime-sdk-api | 能力契约接口 |
| ✅ 可依赖 JPA/标准持久化 | spring-boot-starter-data-jpa |

---

## 概述

Shinwa Solutions 是基于 Runtime Shell 架构的商业业务模块集合。所有模块仅依赖 `runtime-sdk-api` 能力契约，不直接依赖任何基础设施（Kafka/Redis/等）。

## 模块列表

| 模块 | 说明 | 优先级 | 状态 |
|------|------|:------:|:----:|
| shinwa-app-booking | 预约管理 | P0 | ✅ 已迁移 |
| shinwa-app-identity | 用户身份 | P1 | ✅ 已迁移 |
| shinwa-app-messenger | 消息通知 | P1 | ✅ 已迁移 |
| shinwa-app-carousel | 轮播组件 | P2 | ✅ 已迁移 |
| shinwa-app-partners | 合作方目录 | P2 | ✅ 已迁移 |
| shinwa-app-products | 产品目录 | P2 | ✅ 已迁移 |
| shinwa-app-storage | 存储服务 | P3 | ✅ 已迁移 |
| shinwa-app-contracts | 合同管理 | P3 | ✅ 已迁移 |

## 架构原则

### 依赖约束

```text
┌─────────────────────────────────────────────────────────────┐
│  ✅ 允许依赖                                                │
│  ─────────────────────────────────────────────────────────  │
│  • io.brix:runtime-sdk-api (能力契约)                       │
│  • org.springframework.boot:spring-boot-starter-data-jpa    │
│  • jakarta.persistence:jakarta.persistence-api              │
│  • 业务无关的工具类 (Lombok, MapStruct, Jackson)            │
├─────────────────────────────────────────────────────────────┤
│  ❌ 禁止依赖                                                │
│  ─────────────────────────────────────────────────────────  │
│  • org.springframework.kafka:spring-kafka                   │
│  • org.springframework.data:spring-data-redis               │
│  • io.brix:infra-adapter-* (基础设施适配器)                 │
│  • io.brix:host-* (Host 实现)                               │
│  • 任何其他 shinwa-app-* 模块的内部类                       │
└─────────────────────────────────────────────────────────────┘
```

### 模块结构

每个业务模块遵循统一的目录结构：

```text
shinwa-app-xxx/
├── pom.xml                     # 模块 POM
├── module-manifest.yaml        # 模块声明文件
├── xxx-api/                    # API 层
│   └── src/main/java/
│       └── com/shinwa/app/xxx/api/
│           ├── dto/            # 数据传输对象
│           ├── event/          # 事件定义
│           └── request/        # 请求对象
├── xxx-core/                   # 核心层
│   └── src/main/java/
│       └── com/shinwa/app/xxx/
│           ├── controller/     # REST 控制器
│           ├── service/        # 业务服务
│           ├── domain/         # 领域模型
│           │   ├── entity/     # 实体
│           │   └── repository/ # 仓储接口
│           └── handler/        # 事件处理器
└── xxx-ui/                     # UI 层（可选）
    ├── ui-manifest.yaml
    └── src/
```

## 开发环境

### 快速启动

使用统一开发脚本启动任意模块：

**Windows (PowerShell)**:
```powershell
# 启动 identity 模块（包含 Docker 基础设施）
.\scripts\start-dev.ps1 -Module identity

# 启动 products 模块（跳过 Docker，假设已运行）
.\scripts\start-dev.ps1 -Module products -SkipDocker

# 启动 contracts 后端（跳过前端，强制重新构建）
.\scripts\start-dev.ps1 -Module contracts -SkipFrontend -Rebuild
```

**Linux/Mac**:
```bash
# 启动 identity 模块
./scripts/start-dev.sh identity

# 启动 products 模块（跳过 Docker）
./scripts/start-dev.sh products --skip-docker

# 启动 contracts 后端（强制重新构建）
./scripts/start-dev.sh contracts --skip-frontend --rebuild
```

### 开发基础设施

开发环境提供以下服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 数据库 (brix/brix123) |
| Redis | 6379 | 缓存/会话 |
| Adminer | 8092 | 数据库管理 UI |
| MailHog | 8025 | 邮件测试服务 |

单独启动基础设施：
```bash
docker compose -f scripts/docker-compose-dev.yml up -d
```

---

## 构建

```bash
# 编译所有模块
mvn clean install

# 编译单个模块
mvn clean install -pl shinwa-app-booking -am

# 跳过测试
mvn clean install -DskipTests
```

## 架构验证

每个模块都包含 ArchUnit 测试，确保依赖约束：

```java
// 运行架构测试
mvn test -Dtest=ArchitectureTest
```

## 迁移指南

从旧 `plugins/plugin-xxx` 迁移到新架构，请参考 [v3.0-代码改造清单.md](../platform-host-web/docs/v3.0-代码改造清单.md) 中的"改造五：业务模块迁移"章节。

## 许可证

商业许可证 - Shinwa Platform
