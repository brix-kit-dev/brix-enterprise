# Brix Platform 运行壳架构蓝图 — 变更日志

> 与 [v3.0.10-运行壳架构设计蓝图.md](./v3.0.10-运行壳架构设计蓝图.md) 配套；蓝图正文不再内嵌历史版本日志。

---

## v3.0.10-freeze-governance（2026-07-27）— 根蓝图冻结门禁

- 新增 `architecture-baselines.lock.yaml` 和 JSON Schema，以原始字节 SHA-256、Git commit、三方批准记录和 ISO-8601 生效日期绑定活动根基线。
- 新增 fail-closed 校验器、单元测试和 CI；文档状态、机器元数据、lock、工作区字节和 Git 历史不一致时阻断。
- 根蓝图已登记为 `Architecture Frozen`，自 2026-07-27 生效；冻结正文 commit 为 `38f9e9790241627517f185d5afc47d6b5ba20028`，raw bytes SHA-256 为 `ccd55421dc27f82c69e276fbc2009cf0b07777923b64b06725168d2b391e5e8d`。
- Architecture Committee、Security、SRE 三个批准角色均由 `jsq` 明确批准，记录引用和批准时间见 `architecture-baselines.lock.yaml`。

---

## v3.0.10-super-admin-phase5（2026-05-21）— 平台超管 v2.0 治理闭环

- **Phase 5 红线自动化**：新增平台超管禁词扫描、旧平台角色码闭环扫描，并接入 `architecture-check` 质量门。
- **ArchUnit / 单测闭环**：新增 Identity / PlatformAdmin 状态枚举、旧 `disabled_*` 命名、登录布尔身份标记、JWT permissions claim 不含 `platform:bypass` 的回归保护。
- **ESLint 治理**：新增 `no-temp-password-in-response-type`、`no-platform-admin-mode-flag`、`no-permission-or-true` 三条前端架构红线规则。
- **生产 profile 响应扫描**：平台超管响应体黑名单 Advice 支持 `prod` profile 集成测试，防止 setup link、MFA secret、TOTP code 等字段出现在 `/api/platform/**` 响应 JSON。
- **运维手册更新**：`super-admin-bootstrap` runbook 更新为 v2.0 bootstrap / TOTP 灾难恢复 / setup-token 重发流程。

---

## v3.0.10（2026-04-26）— 蓝图结构治理与风险修复

### 结构性重构（治理性变更）

- **重构文档骨架**：明确"设计原则 / 设计约束 / 架构红线"三层定位，消除 v3.0.9 中三套清单的重叠与漂移。
  - 设计原则（Why）：§1 设计原则
  - 设计约束（How the system works）：§2 设计约束
  - 架构红线（What is forbidden + 如何机器化校验）：§10 架构红线
- **统一红线编号**：`A-x`（架构）/ `T-x`（多租户）/ `S-x`（安全），消除 v3.0.9 红线重号问题。
- **删除 §10 关键设计原则**：内容并入 §1 设计原则，避免与 §1.2 / §9 三处真相源。
- **抽离版本日志**：v3.0.x 历史日志由蓝图正文迁出至本文件。
- **抽离 ArchUnit / ESLint 代码**：示例代码迁至 `architecture-guard` / `eslint-config-architecture` 模块；蓝图仅描述被强制的规则集合。
- **抽离实施路线图与待讨论问题**：迁至 `docs/roadmap-runtime-shell.md` 与 GitHub Issues。
- **删除 "⭐ New / ⭐ Updated" 标记**：信息归 CHANGELOG 承载，正文不留时效性标记。
- **附录新增 "红线变更治理"**：明确红线变更必须 RFC + 双人评审 + 公示期。

### 章节独立

- **§14 多租户**：抽离为 [v3.0-多租户架构蓝图.md](./v3.0-多租户架构蓝图.md)，与运行壳蓝图并列。主蓝图仅保留指针 + `TenantCapability` 在能力契约清单中的指针条目。
- **§15 高可用与容灾**：抽离为 [v1.0-高可用与容灾架构设计.md](./v1.0-高可用与容灾架构设计.md)（占位文档）。

### 风险修复（P0）

- **T-2 / T-9 一致性修复**：`TenantSqlGuardInterceptor` 在 dev / prod 均 fail-closed（抛异常并阻断请求），告警仅作为审计兜底；与 T-9 "零容忍" 语义对齐。
- **TenantCapability 接口演进规则机制化**：`isFeatureEnabled` / `checkQuota` 等可选方法补充 `default` 实现 + `@since` 标注；演进规则上升为契约红线。
- **新增 §10 红线 A-14（API 兼容）/ A-15（故障隔离）/ A-16（无循环依赖）/ S-* 安全红线**：原 v3.0.9 红线 9/10/11/12 重新归类与编号。

### 风险修复（P1）

- **EventBus Adapter Outbox 矩阵**：在 §3 能力契约清单为 `EventBusCapability` 增加"实现矩阵"子表（同库 / 跨库 / Webhook），明确 Outbox 仅在同库 Adapter 启用，关键事件不得选用非 Outbox Adapter。
- **租户解析冲突处理**：在多租户蓝图 §4.1 增加 `TENANT_CONFLICT` 拒绝规则，沉默覆盖被列为越权攻击面。
- **视角切换接口契约**：在多租户蓝图 §5 新增 `POST /auth/switch-context` 契约，配套 jti 黑名单。
- **Capability SLO + 降级行为**：多租户蓝图 §7.1 给出示例；运行壳蓝图 §3 要求每个核心 Capability 文档化 SLO 字段。
- **前端共享运行时执行点**：约束 8 明确"由 ESLint + 构建期 webpack/rspack plugin 双重校验"。
- **Host 极薄度量改为定性约束**：A-6 把 "≤ 30 行" 降为软指标（warning），核心硬约束改为"无 `@Service` / `@Configuration` / `@Bean` / `@Component`"。

### 可读性

- 修正文件名 / 文档头版本号一致性（统一为 v3.0.10）。
- §1.2、§9.1、§10 的 ASCII 边框框图改为标准 Markdown 表格。
- 重生成 TOC，覆盖所有二级 / 三级章节及附录。
- 合并 §1.1 与附录 A 术语表：术语只在附录 A 出现，正文以引用方式使用。

---

## v3.0.9（2026-03-19）

- **新增章节**：第 14 章 — 多租户架构设计（整合 v1.0-多租户架构设计方案.md）
- **新增章节**：第 15 章 — 高可用与容灾架构设计

## v3.0.8（2026-03-18）

- **新增约束**：约束 9 — BrixUI 组件统一治理原则，插件 UI 组件必须通过 UIAdapter 获取
- **新增**：BrixUI 组件契约扩展设计（Table、Tabs、Alert、Spin 等 20+ 组件）
- **架构强化**：enterprise-solutions 插件禁止直接 import MUI/Ant Design
- **治理工具**：新增 ESLint 规则 `no-direct-ui-import`

## v3.0.7（2026-03-02）

- **架构重构**：层次命名专业化 — Layer 2 拆分为 2A / 2B / 2C 三个子领域
- **新增约束**：约束 8 — 前端运行时唯一真相源原则
- **新增**：2.1.2 节前端共享运行时层设计
- **新增**：`@brix-sdk/shared-runtime-web` 模块设计
- **问题修复**：解决多插件场景下 React 多实例导致的 Hooks 失效问题

## v3.0.6（2026-02-27）

- **新增**：7.2.5 节 Manifest 发现与多平台声明机制
- **新增**：后端 Plugin Manifest 规范（META-INF/plugin-manifest.json）
- **新增**：前端 UI Manifest 规范（技术无关，Web + Mobile 通用）
- **更新**：7.3 节改为 UI Manifest 加载时序
- **新增**：声明式配置红线（禁止在 Manifest 中指定加载技术）

## v3.0.5（2026-02-26）

- **重要变更**：代码仓库从 7 个合并为 2 个（brix + brix-enterprise）
- **品牌更新**：Shinwa 品牌统一更名为 Brix
- **命名调整**：shinwa-solutions → enterprise-solutions，shinwa-host-assembly → enterprise-host
- **改进**：更新代码库与架构层次映射图，反映 2 仓库结构

## v3.0.4（2026-02-14）

- **重要强化**：前后端**完全分离架构**
- **新增约束**：约束 7 — 前后端完全分离原则

## v3.0.3（2026-02-14）

- **重要强化**：Host 层采用**极薄设计（Ultra-Thin Host）**
- **新增约束**：约束 6 — Host 极薄原则
- **改进**：Host 代码量度量标准——仅含 Spring Boot 启动类 + 依赖声明 + YAML 配置

## v3.0.2（2026-02-05）

- **重要修正**：明确 Host 层为**能力组装层**，不含任何能力实现代码
- **新增**：能力实现层设计
- **命名调整**：Full Product 统一改为 Standalone（独立部署模式）

## v3.0.1（2026-01-24）

- **新增**：Capability Registry 设计模式
- **改进**：RuntimeContext 采用 Registry-Based Default Methods 设计
- **改进**：支持配置驱动的能力声明式装配
