# Brix Enterprise Host

> **版本**: 3.0.0-SNAPSHOT  
> **许可**: Apache License 2.0

---

## 架构定位

**Layer 3: 运行壳组装层（Host Assembly）**

本仓库是运行壳的**组装层**，负责将各能力实现组合成完整的可部署运行壳。

```text
Layer 4: 售卖层                   ← 产品包装
    ↓
Layer 3: 运行壳组装层 ★ 本仓库 ★   ← 组装能力
    ↓
Layer 2.5: 能力实现层            ← 引用（infra-adapters + platform-commons）
    ↓
Layer 2: 能力契约层              ← 引用（runtime-sdk-api）
```

### 🔴 架构红线（严格遵守）

| 规则 | 说明 |
|------|------|
| ❌ **禁止包含任何 Capability 实现代码** | Host 只做组装，不做实现 |
| ❌ 禁止包含 `implements XxxCapability` | 所有实现应在 infra-adapters 或 platform-commons |
| ❌ 禁止包含业务逻辑 | 业务逻辑在 enterprise-solutions |
| ✅ 只做依赖注入和能力编排 | Spring 配置、条件装配 |
| ✅ 引用 infra-adapters | 选择具体的适配器实现 |
| ✅ 引用 platform-commons | 选择平台能力实现 |

---

## 📦 模块结构

```
enterprise-host/
├── pom.xml                      # 父 POM（依赖管理）
├── host-shell-standalone/       # 产品模式运行壳
│   ├── pom.xml
│   ├── Dockerfile
│   ├── docker-compose.yml       # 完整基础设施编排
│   └── src/main/
│       ├── java/.../            # Spring Boot 入口 + 配置
│       └── resources/
│           └── application.yml
│
├── host-shell-embedded/         # 嵌入模式运行壳
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│
└── host-shell-standalone-web/   # 前端运行壳
    ├── package.json
    ├── rspack.config.mjs
    └── src/
```

---

## Host 模式对比

| 模式 | 仓库模块 | 能力组装 | 适用场景 |
|------|----------|----------|----------|
| **Standalone** | host-shell-standalone | Kafka + Redis + OTel | 完整产品部署 |
| **Embedded** | host-shell-embedded | Webhook + InMemory | 嵌入客户系统 |
| **Web** | host-shell-standalone-web | 路由 + Auth + EventBus | 浏览器端 Host |

---

## 能力组装示例

### Standalone Host 组装

```yaml
# application.yml
brix:
  shell:
    standalone:
      capabilities:
        required:
          - io.runtime.sdk.capability.EventBusCapability
          - io.runtime.sdk.capability.StateStoreCapability
          - io.runtime.sdk.capability.AuthCapability
        auto-discovery: true
        validate-on-startup: true
```

### 依赖引用（仅引用，不实现）

```xml
<!-- Host 层 pom.xml -->
<dependencies>
    <!-- 能力契约 -->
    <dependency>
        <groupId>io.brix</groupId>
        <artifactId>runtime-sdk-api</artifactId>
    </dependency>
    
    <!-- 适配器实现（选择性引入） -->
    <dependency>
        <groupId>io.brix</groupId>
        <artifactId>infra-adapter-kafka</artifactId>
    </dependency>
    <dependency>
        <groupId>io.brix</groupId>
        <artifactId>infra-adapter-redis</artifactId>
    </dependency>
    
    <!-- 平台能力 -->
    <dependency>
        <groupId>io.brix.platform</groupId>
        <artifactId>platform-common-starter</artifactId>
    </dependency>
</dependencies>
```

---

## 🚀 快速启动

### 本地开发

```bash
# 启动基础设施
docker-compose -f host-shell-standalone/docker-compose.yml up -d

# 启动 Host
cd host-shell-standalone
mvn spring-boot:run
```

### 容器部署

```bash
# 构建镜像
docker build -t brix-host-standalone:latest ./host-shell-standalone

# 运行容器
docker run -p 8080:8080 brix-host-standalone:latest
```

---

## ⚠️ 已知问题

**DefaultCapabilitiesConfig 违规**：当前 `host-shell-standalone` 包含默认能力实现，需要迁移到 `infra-adapter-fallback` 模块。

---

## 📄 License

Apache License 2.0 - 详见 [LICENSE](LICENSE)
