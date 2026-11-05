# Brix Platform 运行壳架构蓝图 — 变更日志

> 记录运行壳根蓝图和校验器控制面的变更。当前生效的版本见 [docs/README.md](README.md)，历史版本在 `docs/archived/`。蓝图正文不再内嵌历史版本日志。

---

## v3.3.0-changelog-gate（2026-11-05）— ACTIVE 版本必须有变更记录

- 来源：`BRX-RS-GOVERNANCE-009` 要求每次修订都有 Changelog，但 2026-10-28 那批 5 个版本都漏记了，一周多没有检查发现。
- `validate_changelogs`：每个 ACTIVE 蓝图的完整 SHA-256 必须出现在对应的日志里，根蓝图看本文，专项看 `CHANGELOG-architecture-specialized.md`。写的是别的版本的哈希不算。每次运行都执行。
- 不检查退役版本：frontend 1.0、super-admin 2.0、multi-tenant 3.1.3 和未获批准的 3.0.11 早于这种写法，它们的条目不补。

---

## v3.3.0-line-endings（2026-11-05）— Git 不再改写锁定蓝图的换行

- 来源：蓝图按字节锁定，而 Git 会按 `core.autocrlf` 转换换行。`core.autocrlf=input` 时，用 `mv` 加 `git add` 移动 CRLF 蓝图，提交里的字节变成 LF，本地校验通过，干净检出才失败。`core.autocrlf=true`（Git for Windows 的默认值）时，LF 蓝图检出成 CRLF，校验器直接失败。两种情况都在当时的 `main` 上复现过。
- `.gitattributes`：`docs/*.md` 和 `docs/archived/**` 设为 `-text`，覆盖 lock schema 允许的全部蓝图路径。
- `validate_line_endings_protected`：每条注册蓝图都必须是 `-text`，否则校验失败。每次运行都执行。
- `architecture-check.yml` 的触发路径加上 `.gitattributes`，只改这个文件的提交也会经过校验。

---

## v3.3.0-docs-gates（2026-11-05）— 校验器守住入口页和历史索引

- 来源：`docs-dev/README.md` 曾把退役的 v3.0.10 写成当前唯一入口，没有检查发现。负责人 2026-11-05 同意由校验器守住入口，防止文档再堆积。
- `validate_blueprint`：退役蓝图必须在 `docs/archived/`，所以新版本发布时旧版要在同一次改动里搬走。
- `validate_entry_page`：`docs/README.md` 的蓝图表必须与 ACTIVE 记录一一对应，版本、生效日期、实施状态和待重基线都要一致；页面不得链接非 ACTIVE 的蓝图和 `docs/archived/` 下的文档（`BRX-RS-AUTH-007`），也不得有死链。
- `validate_archive_index`：`docs/archived/README.md` 必须把目录下的文件各列一次，注册记录的版本和状态要一致。
- 这些检查每次运行都执行，不需要新参数。发版时的步骤写在 `AGENTS.md`。

---

## v3.3.0-archive-move（2026-11-05）— 退役蓝图可以搬进 archived

- 来源：负责人 2026-11-05 要求收敛 `docs/` 下的蓝图，只保留当前生效的文档。校验器此前把 `path` 当作不可变字段，退役蓝图不能移动。同日负责人批准放开这一种移动（`user-authorization:2026-11-05:archive-retired-blueprints`，负责人回复 `同意，开始第 1 点`）。
- `validate_transition`：改动后状态为 `SUPERSEDED` 或 `ARCHIVED` 的记录，可以从 `docs/` 搬进 `docs/archived/`，文件名不变。新版本发布时，被取代的记录可以在同一次改动里搬。
- `validate_blueprint`：退役记录在 `docs/archived/` 时，到冻结提交的 `docs/<文件名>` 核对登记的字节。
- 不变：改名、搬到别处、搬回来、移动 ACTIVE 记录、改 `sha256`、`gitBlob` 或 `version`、删除记录都仍然失败；蓝图内容、版本、状态、批准记录和 lock schema 都不改。
- 搬移：校验器合入后，13 份退役蓝图搬进 `docs/archived/`，注册表只改这 13 条记录的 `path`。ACTIVE 蓝图里指向旧版的 7 条链接（超管 5 条、前端 1 条、多租户 1 条）因此失效；冻结文件不能改，要等下一版修。

---

## v3.3.0（2026-10-28）— 受托写入登记与 Runtime 策略审计写入器

> 本条是 2026-11-05 补记的。冻结时漏记了变更日志，这里依据 lock、`docs/architecture-freeze-evidence/runtime-shell-3.3.0.md` 和两版蓝图的文本差异写成。

- 来源：`docs/rfc/RFC-008-运行壳-受托写入登记与策略审计写入器（Draft）.md`，负责人 2026-10-28 批准（`user-authorization:2026-10-28:rfc-008`）。multi-tenant §6.3、§6.4 要求跨租户访问写平台审计，根蓝图此前没有定义受托写入的登记格式和审计失败语义。
- 替代 v3.2.0。Minor 修订，`compatibilityEpoch` 保持 1。
- 新增 §7.8：`BRX-RS-DATA-045`（Owner 在 Manifest `data.custodialWrites` 的登记是受托写入的唯一授权，只允许 INSERT）、`BRX-RS-DATA-046`（受托记录 Schema 的版本与兼容）、`BRX-RS-DATA-047`（Runtime 策略审计写入器 `runtime.tenant-policy-audit`，写不进去即本次使用失败）、`BRX-RS-MANIFEST-031`（Manifest 校验）。
- 附录 A 增加 `manifest.custodialWrites` 定义，附录 B 增加说明，`BRX-RS-GOVERNANCE-026` 记录裁决，其中确认 super-admin §1.3a 约束的是 `platform-admin` 的写入，不排除登记的受托写入。其余正文沿用 v3.2.0。
- 四份专项各发布一个只改继承版本的 Patch：identity-auth 1.0.1、frontend 1.2.1、super-admin 4.0.1、multi-tenant 5.1.3，见 `CHANGELOG-architecture-specialized.md`。
- 状态：Architecture Frozen，自 2026-10-28 生效。Architecture Committee、Security、SRE 三个批准角色均由 `jsq` 明确批准（`user-authorization:2026-10-28:runtime-shell-3.3.0-freeze`）；冻结正文 commit 为 `00b2f8fa9c019cd6a487bc8480998876b305e91a`，raw bytes SHA-256 为 `2ab132bfde67330e161b3b53bf3d03de8b7066864f1850cb71efc23ed47d769b`，Git blob 为 `996ff8270cf9fb56a9196b70498b7ab353addd9d`。v3.2.0 转为 SUPERSEDED，字节不变。

---

## v3.2.0（2026-10-22）— 统一身份认证与登录架构

- 来源：`docs/rfc/RFC-002-身份认证-统一登录架构与认证专项（Draft）.md`。负责人裁决：Q1 托管登录 + 授权码 + PKCE + BFF；Q5 全体租户员工强制双因素；Q7 首批第三方登录只接 Google，并实现第三方登录通用层；其余问题（Q2 内嵌 Spring Authorization Server 作为 L2C Adapter、Q3 新增 identity-auth 专项、Q4 超管只用防钓鱼认证器、Q6 会话默认值、Q8 保留前缀、Q9 托管登录页为独立前端模块、Q10 Spring Boot 4.1、Q11 版本号、Q12 第三方登录归 Open Core）按 RFC 建议采纳。
- §10.1 新增 `BRX-RS-SECURITY-011`～`015`：身份协议面（`MANIFEST-021` 的唯一例外，保留前缀 `/oauth2/**`、`/.well-known/**`、`/auth/**`、`/bff/**`）、Web 客户端 BFF、特权访问防钓鱼、失败防护（不得跨入口全局锁定）、敏感操作再验证。
- §9.4 新增 `BRX-RS-UI-018`（凭证只在托管登录页输入）；§2 新增 6 个术语；§11.2 新增 S-19、S-20（S-12～S-18 曾在已归档 super-admin v2.0 中使用，不予分配）；§13 新增 3 条否决方案；§0.6、§12.2、附录 A/B/C 同步；新增 `BRX-RS-GOVERNANCE-025` 裁决记录。
- 状态：Architecture Frozen，自 2026-10-22 生效。Architecture Committee、Security、SRE 三个批准角色均由 `jsq` 明确批准；冻结正文 commit 为 `289fe504f511bca2cb3d92038b1eff77c3dd4d1e`，raw bytes SHA-256 为 `38c2db6645cec798c33b2c0371fa92f098ea89e764cad16caabc757258278139`。v3.1.0 转为 SUPERSEDED；identity-auth 1.0、frontend 1.2、super-admin 4.0、multi-tenant 5.0 同批生效并继承 v3.2.0，其中 super-admin 4.0 与 multi-tenant 5.0 因 §7 复核未完成保持 `rebaseRequired=true`；`requiredActiveDomains` 增加 `identity-auth`。`compatibilityEpoch` 保持 1。

---

## v3.1.0（2026-10-21）— 持久化抽象与数据库可移植性

- 来源：`docs/rfc/RFC-001-运行壳-持久化抽象与数据库可移植性（Draft）.md`。负责人裁决：Q1 插件持久化编程模型采用 JPA 映射 + Spring Data Repository 接口（仅 JPQL），经 `PersistenceCapability` 取得；Q2/Q4 人大金仓适配暂缓，只保留 DCP 扩展口；Q3 schema-per-Owner 与 Owner 最小权限身份为 SHOULD；Q5 版本号 3.1.0。
- §7 重写：废止 `BRX-RS-DATA-007`（ID 保留）；新增 `BRX-RS-DATA-020`～`044`，覆盖持久化编程模型与禁用 API、Owner 持久化单元、Runtime 管理的入口级 Unit of Work、锁与异常转换、迁移变体与可移植 DDL 子集、ORM 自动建表禁令、数据库兼容档案（DCP）、数据库层所有权、租户隔离接口点、`DatabaseCapability` 弃用和 L2A 最小签名。
- 红线：A-13 含义不变、证明方式改为禁用 API 扫描 + Repository 创建校验；A-8、A-15 补充证据；新增 A-27（DCP 一致性测试矩阵、禁止共享/正式环境 ORM 自动建表）。GOVERNANCE-021 增加 3 个持久化负例。
- 修正 §0.6 关联专项表（改为 frontend 1.1、super-admin 3.0、multi-tenant 4.0）；§3.2、§4.7、§5.1、§12.2、§13、附录 A/B/C 同步更新；新增 GOVERNANCE-024 裁决记录。
- 状态：Architecture Frozen，自 2026-10-21 生效。Architecture Committee、Security、SRE 三个批准角色均由 `jsq` 明确批准；冻结正文 commit 为 `b98383bde6d31a57b4906a332142236f78157e18`，raw bytes SHA-256 为 `33016713f2c6dd5638d32fce4772725718fd73d23cdea715688d9b72b3412d33`。v3.0.10 转为 SUPERSEDED；runtime-shell 3.0.11 候选转为 ARCHIVED；frontend 1.1、super-admin 3.0、multi-tenant 4.0 改为继承 v3.1.0 并标记 `rebaseRequired=true`。`compatibilityEpoch` 保持 1。

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
