# Capability 命名对称表 — Java / TypeScript 交叉参考

> **版本**: v1.0  
> **日期**: 2025-07  
> **关联**: 架构评审 M2 (Java/TS Capability 命名不对称), Blueprint NM3  
> **规范**: Java 端与 TypeScript 端能力接口名称应一一对应

---

## 1. 命名不对称清单（需修正）

| # | Java 端名称 | TypeScript 端名称 | 差异类型 | 建议统一名称 | 优先级 |
|---|------------|-------------------|---------|-------------|-------|
| 1 | `StateStoreCapability` | `PluginStateCapability` | 语义差异 | `StateStoreCapability` | High |
| 2 | `AuthContextCapability` | `AuthCapability` | Java 更具体 | `AuthCapability`（Java 端重命名） | High |
| 3 | `ConfigStoreCapability` | `ConfigStoreCapability` + `ConfigCapability` | TS 端有包装层 | `ConfigStoreCapability`（移除 ConfigCapability 别名） | Medium |

### 1.1 详细说明

#### #1 StateStore vs PluginState

- **Java**: `io.brix.sdk.runtime.api.capability.StateStoreCapability` — 通用状态存储
- **TS**: `PluginStateCapability` (state.ts) — 命名暗示仅限插件状态
- **修正方向**: TS 端重命名为 `StateStoreCapability`（与 Java 对齐）
- **影响范围**: runtime-sdk-api-web/types/state.ts + 所有消费者 import
- **配套**: `PluginStateCapabilityConfig` → `StateStoreCapabilityConfig`

#### #2 AuthContext vs Auth

- **Java**: `AuthContextCapability` — 强调"认证上下文"管理
- **TS**: `AuthCapability` — 简洁但缺少 Context 语义
- **修正方向**: Java 端重命名为 `AuthCapability`（与 TS 对齐，Context 为实现细节）
- **影响范围**: runtime-sdk-api Java 接口 + 所有后端消费者
- **注意**: Java 端同时存在 `AuthCapability`（无状态验证）和 `AuthContextCapability`（有状态上下文），需合并或明确区分

#### #3 ConfigStore vs Config 包装层

- **Java**: `ConfigStoreCapability` — 唯一接口
- **TS**: `ConfigStoreCapability`（核心）+ `ConfigCapability`（便捷包装）
- **修正方向**: 移除 `ConfigCapability` 别名，消费者直接使用 `ConfigStoreCapability`
- **影响范围**: runtime-sdk-api-web/types/config.ts

---

## 2. 已对齐的能力（无需修改）

| Java 端 | TypeScript 端 | 状态 |
|---------|--------------|------|
| `EventBusCapability` | `EventBusCapability` | ✅ 对齐 |
| `HttpCapability` | `HttpCapability` | ✅ 对齐 |
| `TenantCapability` | `TenantCapability` | ✅ 对齐 |

---

## 3. 平台专属能力（无跨端对应，无需对齐）

### 3.1 Java 后端专属

| 能力名称 | 说明 | 无 TS 对应原因 |
|----------|------|---------------|
| `DataAccessCapability` | 数据库访问抽象 | 后端 ORM 层 |
| `DatabaseCapability` | 数据库连接管理 | 后端基础设施 |
| `FileStorageCapability` | 文件存储（OSS/本地） | 后端 I/O |
| `IdGeneratorCapability` | 分布式 ID 生成 | 后端雪花算法 |
| `LifecycleCapability` | 插件生命周期管理 | 后端容器管理 |
| `LockCapability` | 分布式锁 | 后端并发控制 |
| `ObservabilityCapability` | 可观测性（metrics/tracing） | 后端 APM |
| `ResilienceCapability` | 弹性（熔断/限流） | 后端 Resilience4j |
| `SchedulingCapability` | 定时任务调度 | 后端 cron |

### 3.2 TypeScript 前端专属

| 能力名称 | 说明 | 无 Java 对应原因 |
|----------|------|----------------|
| `I18nCapability` | 国际化 | 前端 UI 文案翻译 |
| `LayoutCapability` | 布局管理 | 前端 Shell 布局 |
| `NavigationCapability` | 路由导航 | 前端 SPA 路由 |
| `PluginLoaderCapability` | 远程模块加载 | 前端 Module Federation |
| `ThemeCapability` | 主题/设计令牌 | 前端 CSS 变量 |
| `GovernedEventBusCapability` | 治理增强事件总线 | 前端事件治理扩展 |

---

## 4. 命名规范（NM3 对齐规则）

1. **同一概念使用相同名称** — 跨 Java/TS 的能力接口名必须完全一致
2. **后缀统一**: 均使用 `Capability` 后缀（不使用 `Service`/`Provider`/`Manager`）
3. **Config 后缀**: `{CapabilityName}Config`（如 `AuthCapabilityConfig`）
4. **平台专属能力允许不对称** — 仅限后端/前端特有基础设施能力
5. **修改优先级**: 先改消费者少的一端（通常是 Java 端改动影响范围更小）

---

## 5. 执行计划

| 步骤 | 内容 | 影响仓库 |
|------|------|---------|
| 1 | TS: `PluginStateCapability` → `StateStoreCapability` | brix + brix-enterprise |
| 2 | Java: `AuthContextCapability` → `AuthCapability`（合并） | brix |
| 3 | TS: 移除 `ConfigCapability` 别名 | brix |
| 4 | 更新所有 import 和 capability-config 类型名 | 两个仓库 |
| 5 | 全量构建验证 | 两个仓库 |
