# RFC-008：受托写入登记与 Runtime 策略审计写入器（Draft）

> **文档类型**：RFC（根级 Minor RFC，按根 §12.2"新增向后兼容的 Manifest"）
> **状态**：已批准（2026-10-28，architecture-committee、security、SRE，决定记录 `user-authorization:2026-10-28:rfc-008`）。条款已并入根蓝图 v3.3.0；本文是决策背景，**不指导施工**，施工依据是根蓝图 v3.3.0 与设计方案
> **起草日期**：2026-10-28
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；super-admin 4.0、multi-tenant 5.1.2（ACTIVE，`rebaseRequired=true`）；identity-auth 1.0、frontend 1.2（ACTIVE）
> **来源**：[平台审计 Owner 拆分与策略使用审计设计方案](../v4.0-平台超管-平台审计Owner拆分与策略使用审计-设计方案.md) §8 R1。§7 的 D1～D6 已于 2026-10-28 由负责人确认按推荐项执行（D1 选路线 D）
> **拟决定**：根蓝图新增受托写入登记（Manifest `data.custodialWrites`）、Runtime 策略审计写入器和跨租户策略审计的失败语义，发布根 v3.3.0；四份 ACTIVE 专项蓝图各发布一个只改继承版本的 Patch 版本；确认 super-admin §1.3a 一处红线的适用范围

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. multi-tenant §6.3、§6.4 要求登录期发现（P-1）和受邀人设置完成后补发（P-3）每次使用都写平台审计。super-admin AUDIT-001 要求审计失败语义、同步阻断范围和受托写入边界由根蓝图与审计 Owner 唯一定义。根蓝图目前没有定义这三件事。
2. 本 RFC 在根蓝图中补上四项：
   - 受托写入的登记格式：Owner 在 Manifest `data.custodialWrites` 中逐项登记谁能写、写哪张表、哪些列、哪些操作和动作；
   - Runtime 策略审计写入器：DATA-006 所说的"审计写入器"，登记为 `runtime.tenant-policy-audit`；
   - 跨租户策略审计的失败语义：写不进去，这次使用就失败；
   - 受托记录 Schema 的版本与兼容规则。
3. 这些都是向后兼容的新增：`custodialWrites` 可选，现有 Manifest 不受影响，不新增 Capability，不改任何红线。
4. 批准后发布根蓝图 v3.3.0（Minor，`compatibilityEpoch` 保持 1）。校验器要求每份 ACTIVE 专项蓝图继承当前 ACTIVE 根，所以 identity-auth、frontend、super-admin、multi-tenant 同时各发布一个 Patch 版本，只把继承的根改为 3.3.0，正文规则不变。
5. 确认解读：super-admin §1.3a 红线"所有审计写入只能经已声明、已授权的内部契约"约束的是 `platform-admin` 的审计写入，不排除本 RFC 登记的受托写入。

---

## 1. 背景

- **要求**：multi-tenant §6.3、§6.4；identity-auth AUDIT-001（跨租户事件写平台审计）；super-admin AUDIT-001（不得吞异常或降级为日志）。
- **已有依据**：根 DATA-004 把平台审计列为平台受托表；DATA-006 允许审计写入器作为 Manifest/Contract Schema Registry 显式登记的 Custodian，按列和操作最小授权。
- **缺口**：
  - Manifest `data` 段只能登记 outbox/inbox，没有通用的受托写入登记；
  - 没有规定审计写入失败时调用怎么办；
  - 没有规定 Owner 演进表结构时，受托写入怎样保持兼容。
- **现状**：P-1、P-3 只写结构化日志，在使用之后写，写失败也不阻断（租户隔离方案 §13.1 第 2 条）。
- **为什么不用内部契约或新 Capability**：
  - 内部契约只能由 platform-operational 经 `OperationalContext` 消费（根 HOST-021、HOST-022），L2B 也不能引用 L1 的契约类型；
  - 新增 L2A Capability 会成为插件面接口，还要另定"只给平台调用方"的可见性（设计方案 §5.1 路线 A、C）。

---

## 2. 根蓝图的改动（v3.3.0）

### 2.1 Manifest `data.custodialWrites`

§4 Manifest 字段表的 `data` 一行增加"受托写入登记（DATA-045）"。每一项的字段：

| 字段 | 规范语义 |
|---|---|
| `table` | 本 Owner 的表，MUST 由本 Owner 的迁移创建或接管 |
| `custodian` | 受托写入方 ID，格式 `runtime.<name>`，只能是根蓝图登记的 Runtime Custodian |
| `operations` | 允许的操作。本版本只允许 `[INSERT]` |
| `columns` | 允许写入的列，按最小授权列出 |
| `actions` | 审计类表允许写入的动作 ID；不在其中的动作 MUST 被拒绝 |
| `recordSchemaRef` | 受托记录 Schema 的版本化引用，例如 `brix://schemas/platform-audit/policy-use-record/1.0.0` |

新增规则：

- **[BRX-RS-DATA-045]** Custodian 对受托表的写入 MUST 以 Owner 在 Manifest `data.custodialWrites` 中的登记为唯一授权：只能执行登记的操作，只能写登记的列和动作。登记不授予读权限，Custodian 也不因此成为共同 Owner。主机启动时 MUST 校验每个启用的 Custodian 都能解析到覆盖其写入的登记，解析不到即启动失败。Owner SHOULD 另用数据库约束兜底登记中的动作与必填列。
- **[BRX-RS-DATA-046]** 受托记录 Schema 遵循 SemVer（§4.4），并 MUST 标记各字段的数据分类（SECURITY-008）。Owner 在同一 Major 内演进表结构时 MUST 保持登记的受托 INSERT 有效：新列可空或有默认值，不删除、不收紧登记的列。破坏兼容 MUST 发布新的记录 Schema Major，并与 Custodian 实现在同一发布列车上线。Owner 的迁移测试 MUST 包含受托 INSERT。
- **[BRX-RS-MANIFEST-031]** Manifest 校验器 MUST 校验 `data.custodialWrites`：必填字段齐全；`operations` 只含 `INSERT`；`custodian` 在根蓝图登记的 Runtime Custodian 目录内；`table` 属于声明它的 Owner；`recordSchemaRef` 可解析；同一 `(table, custodian)` 只登记一次。

### 2.2 Runtime 策略审计写入器

**[BRX-RS-DATA-047]** Runtime 策略审计写入器是 DATA-006 所说的审计写入器，Custodian ID 为 `runtime.tenant-policy-audit`，只为专项蓝图登记的跨租户访问（multi-tenant §6.4）写平台审计：

1. L2B 定义写入端口，L2C 持久化 Adapter 实现。端口不进入 L2A，插件不可见；L2B 不引用 L1 模块。
2. 每条记录在只写受托表的独立本地事务中提交，调用方事务挂起（DATA-029、HOST-020）。
3. **失败语义**：对登记的跨租户策略，审计写入失败即本次使用失败（fail-closed），以稳定错误码 `audit.policy_use_write_failed` 结束。MUST NOT 吞掉异常或降级为日志。
4. **同步阻断范围**：
   - 只读的策略，在把结果交给调用方之前写入；
   - 修改数据的策略，在被访问 Owner 的事务提交之前写入，写入失败则该事务回滚；
   - 策略的业务处理失败时，Runtime SHOULD 尽力补写一条失败记录。补写失败只记错误日志，不覆盖原始异常。
5. 只记录类型化字段，不接受自由文本。不得记录密码、token、完整邮箱、完整 URL（super-admin AUDIT-001）；来源 IP 按安全 Profile 的请求元数据策略脱敏。
6. 主机含有会使用登记策略的组件时，启动期 MUST 能解析到对应的受托写入登记（DATA-045）。
7. 写入失败 MUST 计数，指标标签只含策略与原因（OTEL-006）。

### 2.3 其余同步

- 附录 A 机器可读基线：版本 3.3.0、`supersedes: 3.2.0`；增加 Runtime Custodian 目录（`runtime.tenant-policy-audit`）和 `data.custodialWrites` 的字段定义。
- Changelog 记录本次 Minor 修订；§12.2 的说明改为"v3.3.0 是对 v3.2.0 的 Minor 修订"。
- 其余正文不变。

---

## 3. 专项蓝图的 Patch 版本

| 现行 ACTIVE | 新版本 | 改动 |
|---|---|---|
| identity-auth 1.0 | 1.0.1 | 继承的根改为 3.3.0；文首与文末状态 |
| frontend 1.2 | 1.2.1 | 同上 |
| super-admin 4.0 | 4.0.1 | 同上；`rebaseRequired=true` 不变 |
| multi-tenant 5.1.2 | 5.1.3 | 同上；`rebaseRequired=true` 不变 |

这些版本不改任何规则、红线、DDL 或契约，`compatibilityEpoch` 不变。按根 §12.2 属于"纠错但不改变可观察契约"的 Patch，由本 RFC 的批准一并覆盖；旧版本原字节保留，转为 SUPERSEDED。

---

## 4. super-admin §1.3a 红线的解读

- 红线原文："所有审计写入只能经已声明、已授权的内部契约"。
- 本 RFC 确认：这句话的主语，与 §1.3a 表中的调用方一样，都是 `platform-admin`，约束的是 platform-admin 的审计写入。按 DATA-045、DATA-047 登记的受托写入不在其内。
- 依据：
  - 同一蓝图的 AUDIT-001 写明，受托写入边界由根蓝图和审计 Owner 定义；
  - 根 DATA-006 点名审计写入器可作 Custodian；
  - 若理解为"任何写入都必须经内部契约"，multi-tenant §6.3、§6.4 的要求在任何路线下都无法实现（设计方案 §2.1）。
- super-admin 正文本次不改，这条解读在 super-admin 下次重基线复核时写入正文。

---

## 5. 影响

| 层 / 模块 | 影响 |
|---|---|
| runtime-manifest | Manifest Schema 与校验器支持 `data.custodialWrites` |
| L2B runtime-orchestrator | 策略审计写入端口；P-1、P-3 按 DATA-047 接入；启动期校验；指标 |
| L2C infra-adapter-persistence-jpa | 端口的 JDBC 实现；读取受托写入登记 |
| L2A runtime-sdk-api | 新稳定错误码（CAP-021 的 Minor 扩展）；`TenantAccessCapability` 增加带来源信息的发现方法（CAP-019 的默认方法） |
| platform-audit（新） | 登记 `runtime.tenant-policy-audit` 的受托写入；表结构约束 |
| 其他插件 | 无影响 |

现有 Manifest、Capability、Event 和红线都不受影响。

---

## 6. 风险与回滚

| 风险 | 对策 |
|---|---|
| 审计写入失败使登录失败 | 平台审计与业务表在同一数据库，数据库不可用时登录本来就失败；写入失败计数并告警 |
| 同一张表两条写入路径，演进时受托 INSERT 失效 | DATA-046 的版本与兼容规则；Owner 的迁移测试包含受托 INSERT |
| 受托写入被滥用 | 只能 INSERT，只能写登记的列与动作；数据库 CHECK 兜底；Custodian 只能是根蓝图登记的 Runtime Custodian |

回滚：代码退回 3.2.0 的行为（策略使用只写日志）不需要数据迁移，新增的列都可空或有默认值。蓝图层面的回滚需要新的 RFC，不能静默改回（GOVERNANCE-009）。

---

## 7. 同时申请的豁免（R2）

拆分平台审计期间，platform-identity 继续在自己的事务里直接写自己的平台审计行（设计方案 §3.4 E 期、D3）。登记为 EX-2026-003：

| 项 | 内容 |
|---|---|
| 规则 | 根 DATA-001、DATA-027；super-admin §1.3a（这张表的唯一 Owner 是 platform-audit） |
| 制品 | brix platform-identity 的 `PlatformAuditLogEntry`、`PlatformAuditLogRepository`、`RepositoryPlatformIdentityAuditService`、`AuditService`、`AuditEvent` |
| 理由 | 身份的审计行要与变更一起提交。改为同步调用 platform-audit，变更回滚时会留下错误的记录；不丢不错的做法是身份 Owner 的 Outbox（P4），现在还没有 |
| 风险 | 两个持久化单元映射同一张表；platform-identity 的写入绕过 platform-audit 的写规则 |
| 补偿控制 | 数据库默认值把这些行的 `writer` 标为 `platform-identity`；实体全部列不可更新，Repository 只有 `save`；platform-audit 的 CHECK 禁止它写策略动作；P4 删除这些组件并关闭豁免 |
| 到期 | 2027-02-28 |
| 退出条件 | P4 完成：身份 Owner 经 Outbox 发出审计事实，platform-audit 订阅入库；platform-identity 的审计组件删除，`writer` 去掉默认值 |

---

## 8. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的根蓝图改动与 v3.3.0 发布、§3 的四个 Patch 版本、§4 的解读、§7 的豁免。批准记录写入本文状态行和 lock，施工提交引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-28:rfc-008:architecture-committee` | `2026-10-28T13:18:15+09:00` |
| security | `user-authorization:2026-10-28:rfc-008:security` | `2026-10-28T13:18:15+09:00` |
| sre | `user-authorization:2026-10-28:rfc-008:sre` | `2026-10-28T13:18:15+09:00` |

批准人：`jsq`。
