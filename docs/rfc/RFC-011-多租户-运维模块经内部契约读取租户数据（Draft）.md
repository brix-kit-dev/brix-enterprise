# RFC-011：运维模块经内部契约读取租户数据（Draft）

> **文档类型**：RFC（多租户专项 Patch 修订提案）
> **状态**：Draft。2026-11-08 负责人同意方向（方案 A），正式审批（architecture、security、SRE）与 multi-tenant 5.1.4 的发布同 RFC-009、RFC-010 一起，排在标准链路收尾方案 §11.1 的单向门队列里。批准前**不指导施工**。现行施工以根为准（根 `BRX-RS-AUTH-003`、multi-tenant 文首"冲突裁决"）：运维模块只经内部契约访问数据，代码已经这样做
> **起草日期**：2026-11-08
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；multi-tenant 5.1.3（ACTIVE，`rebaseRequired=true`）；identity-auth 1.0.1、super-admin 4.0.1、frontend 1.2.1（ACTIVE）
> **来源**：[同步查询通道标准化设计方案](../v3.3.0-运行壳-同步查询通道标准化-设计方案.md) §9.2 R1 与 D36（2026-11-02 负责人同意 D36～D63 按推荐落实）；[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §11 第 13 点、§8 第 2 项
> **拟修订**：multi-tenant §6.3 第 4 点、§11.2 `TenantUsageQuery` 行、`BRX-TENANT-CONTRACT-005`、§11.5 第 2 条、T-3；不修订根蓝图与其他专项

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. multi-tenant 5.1.3 有五处写着平台运维模块（`platform-admin`）经 typed Query 读取租户数据。根的规定不同：
   - 运维模块的平台数据访问只经对应 Data Owner 的内部契约（LAYER-016）；
   - 运维描述文件里没有 `queries.consumes`（HOST-014）；
   - `OperationalContext` 的方法是冻结的，拿不到查询客户端（HOST-024）。
2. 按根 AUTH-003 与 multi-tenant 文首的"冲突裁决"，以根为准。本 RFC 把这五处改成内部契约，与根、super-admin 4.0.1 §2.1、multi-tenant 自己的 §6.4 与 §10.1 第 3 条以及现有代码一致。
3. 只改文字：DDL、Token、权限码、T-1～T-30 的编号和隔离语义都不变，T-3 仍是"阻断发布"。
4. 建议与 RFC-009、RFC-010 同一批发布：multi-tenant 5.1.4 同时改继承的根（3.4.0）和本 RFC 的五处。

---

## 1. 背景

### 1.1 冲突的五处

| 位置 | 现文 | 与根的冲突 |
|---|---|---|
| §6.3 第 4 点 | "只读数据由租户 Data Owner 发布 typed Query；平台运维动作由 `platform-admin` 通过 descriptor 已声明且 privilege allowlist 批准的内部契约执行" | 运维模块的读取也只经内部契约（LAYER-016） |
| §11.2 `TenantUsageQuery` 行 | "当前 tenant，或经批准的 platform-operational 调用方的类型化用量" | 运维模块不是查询的调用方（HOST-014） |
| `BRX-TENANT-CONTRACT-005` | "平台只读租户数据使用 descriptor 声明的 typed Query；平台运维写使用 `brix.internal.tenant.administration`" | 同上 |
| §11.5 第 2 条 | "跨租户只读查询/聚合必须由对应 Data Owner 发布版本化 typed Query；`platform-admin` 只能按 descriptor 的 `queries.consumes`……调用" | 运维描述文件没有 `queries.consumes`，`OperationalContext` 拿不到查询客户端（HOST-014、HOST-024） |
| T-3 | "跨租户读取必须是 Owner typed Query；platform-operational 写入必须是 allowlist internal contract，并记录平台审计" | 同上 |

### 1.2 根与其他条款的现文

- 根 `BRX-RS-LAYER-016`："其平台数据访问 MUST 仅经对应 Data Owner 的内部契约，MUST NOT 因“平台模块”身份直接注入任意 Repository/Service。"
- 根 `BRX-RS-HOST-014`：运维描述文件声明 module id、SemVer、`moduleKind`、owner、L2B runtime range、`internalContracts.provides/requires`、特权 allowlist、`endpoints.provides` 和 `tasks.provides`，没有查询。
- 根 `BRX-RS-HOST-024`：`OperationalContext` "MUST 只暴露 module identity、只读 Runtime 运维视图，以及同时满足“descriptor 已声明”和“该 module privilege allowlist 已批准”的版本化 operational/internal contract"。
- super-admin 4.0.1 §2.1 的冻结内部契约目录：`brix.internal.tenant.administration` 负责"PENDING 租户、FIRST_OWNER 邀请和生命周期运维"，`brix.internal.platform.audit` 负责"平台审计写入和受限查询"。
- multi-tenant 自己的条款已经按内部契约写：
  - §6.4"平台超管定向操作"一行：访问键是"内部契约请求中的类型化目标租户"；
  - §10.1 第 3 条：`sys_platform_audit_log`"仅 `platform-admin` 可通过 descriptor 声明并经 privilege allowlist 批准的内部契约读取"。

### 1.3 现状

- `platform-admin` 的 `platform-operational.yaml` 只声明 `internalContracts.requires`：租户管理、Bootstrap 管理、身份管理、认证流程、平台审计，没有查询。
- 运维描述文件的 Schema 不允许 `queries`：顶层 `additionalProperties: false`，属性里没有它，写了就在加载时失败。没有测试专门钉住这一点。
- 读取都经内部契约：租户列表 `TenantAdministration.listTenants`、实例配额 `installationQuota`、平台审计 `PlatformAuditAdministration`。这些读的都是 §6.1 白名单里的平台全局表（`sys_tenant`、`sys_installation_quota`、`sys_platform_audit_log`），不是跨租户读取租户表。
- `TenantUsageQuery`、`TenantDirectoryQuery` 还没有发布（查询方案 D44），只有 `TenantReferenceQuery`。
- typed Query 的作用域只有两种：在调用方当前租户内，或只读平台全局数据。typed Query 不跨租户。

### 1.4 业界做法

2026-11-08 查阅：

- [Azure RBAC 的角色定义](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-definitions)把控制面（管理资源，`Actions`）与数据面（读写资源里的数据，`DataActions`）分成两套权限，管理权限不会自动带来数据访问。
- [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) 的 AC-6（最小权限）只给完成任务必需的访问；其增强项 AC-6(9) 要求记录特权功能的使用。

对到这里：`platform-admin` 是控制面，typed Query 是插件之间的数据面。运维模块经 Data Owner 的内部契约读写，特权入口只有 allowlist 批准的这几条，并且有平台审计。插件的查询通道不必为它开一个跨租户的特权作用域。

---

## 2. 方案比较

| 方案 | 内容 | 结论 |
|---|---|---|
| A | 按根：`platform-admin` 读写都经内部契约；typed Query 只用于插件之间（D36） | **推荐** |
| B | 改根：运维描述文件加 `queries.consumes`，`OperationalContext` 加查询客户端 | 否决。要 Root RFC，改冻结的 HOST-014、HOST-017、HOST-024；插件的查询通道要加一个跨租户的平台特权作用域，与"typed Query 不跨租户"相反 |
| C | 不改，专项保留两种写法 | 否决。照专项写的人会给运维模块建查询调用，加载时被描述文件 Schema 拒绝；T-3 的门禁也没法照文字实现 |

---

## 3. 条款修订（写入 multi-tenant 5.1.4）

1. §6.3 第 4 点改为："**PlatformAdmin 跨租户访问属独立特权链路**：`platform-admin` 的只读与运维动作都经 descriptor 已声明且 privilege allowlist 批准的内部契约执行；涉及租户表的访问按 §6.4 登记。它与本登录发现**互不等同**，不得再表述'登录查询是系统唯一跨租户访问'。"
2. §11.2 `TenantUsageQuery` 行的"作用域与语义"改为："当前 tenant 的类型化用量；`platform-admin` 经 `brix.internal.tenant.administration` 读取"。
3. `BRX-TENANT-CONTRACT-005` 改为："`platform-admin` 读写租户数据都使用 `brix.internal.tenant.administration`。`platform-admin` 的 descriptor 必须声明 `internalContracts.requires`、Brix Range v1、`required` 和 privilege allowlist，O1/H3 缺失、重复、越权或版本不匹配均 fail-fast。"
4. §11.5 第 2 条改为："**跨租户只读查询与聚合由对应 Data Owner 经版本化内部契约提供给 `platform-admin`**，每次调用记 Platform Audit（§10.1），涉及租户表的访问按 §6.4 登记。插件的 typed Query 不跨租户：作用域由 Runtime 从调用方的 Invocation Context 派生（§11.1）。"
5. T-3 改为："platform-operational 的跨租户读写必须是 allowlist internal contract，并记录平台审计；其余跨租户访问只能是 §6.4 登记的项"。门禁列改为"descriptor Schema（运维描述文件不能声明查询）+ access-policy test"，"阻断发布"不变。

不变：DDL、Token、权限码目录与默认授予、T-1～T-30 的编号与隔离语义、§6.4 各行、`TenantReferenceQuery` 与 `TenantDirectoryQuery` 的行。

与 D36 推荐文字的出入：D36 给 T-3 的推荐写法是"插件不得跨租户读取"。§6.4 已登记了平台插件按 Runtime 绑定的访问键做的跨租户访问（登录期 Actor 发现、FIRST_OWNER 邀请解析、受邀人设置完成后补发），照搬那句会与 §6.4 冲突，所以改为"其余跨租户访问只能是 §6.4 登记的项"，与 §6.4"表外的跨租户访问一律禁止"一致。

---

## 4. 治理与版本

| 文档 | 新版本 | 类型 | 理由 |
|---|---|---|---|
| multi-tenant | 5.1.4 | Patch（根 §12.2"纠错但不改变可观察契约/红线"），兼容代际保持 `3` | 消除与根的冲突，使五处与根、super-admin 4.0.1 和本专项 §6.4、§10.1 一致；DDL、Token、权限码、红线编号与隔离语义不变 |
| 根与其他专项 | 不因本 RFC 改版 | — | 不涉及 |

与 RFC-009 同批发布时，multi-tenant 5.1.4 同时含 RFC-009 §3 的继承版本改动。RFC-009 §3 写的是专项"只改继承版本"，发布前要把本 RFC 的五处写进去，批准范围一并覆盖。

`rebaseRequired=true` 不变：根 v3.1.0 起要求的 §7 持久化复核不在本次范围。

按 multi-tenant §13 处理：

1. 负责人定方向；
2. 写出 multi-tenant 5.1.4（Freeze Candidate），在 lock 中登记为不指导施工的 CANDIDATE；
3. 架构、安全、SRE 批准；
4. 同步门禁与正反例：补一个反例测试，运维描述文件声明 `queries` 时加载失败（Schema 已经拒绝，现在没有测试）；
5. 在 lock 中登记哈希、commit 与批准记录，5.1.3 转为 SUPERSEDED。

---

## 5. 兼容性、迁移与回滚

- **兼容性**：代码已经按根做，没有代码、数据或插件依赖旧写法。`TenantUsageQuery` 还没发布；发布时只给当前租户内的插件调用方用。
- **迁移**：无数据库或数据变更。
- **回滚**：只涉及文档。本 RFC 未批准时 5.1.3 保持 ACTIVE，施工继续以根为准（AUTH-003）。

---

## 6. 审批

需要 architecture、security、SRE 批准。批准范围：§3 的五处修订与 multi-tenant 5.1.4 的发布。批准记录写入本文状态行和 lock。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | 待批 | — |
| security | 待批 | — |
| sre | 待批 | — |
