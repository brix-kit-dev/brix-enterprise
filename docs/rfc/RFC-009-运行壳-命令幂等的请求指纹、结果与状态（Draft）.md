# RFC-009：命令幂等的请求指纹、结果与状态（Draft）

> **文档类型**：RFC（根级 Minor RFC，按根 §12.2"新增向后兼容 Capability/Manifest/红线"）
> **状态**：已批准（2026-11-13，architecture-committee、security、SRE，决定记录 `user-authorization:2026-11-13:rfc-009`）。条款随根 3.4.0 那一批写进蓝图、生效（标准链路收尾方案 §10.53 第 2 项的 9c～9i）；生效前本文是决策背景，**不指导施工**，施工依据仍是现行根蓝图 v3.3.0 与[幂等记录与命令结果设计方案](../v3.3.0-运行壳-幂等记录与命令结果-设计方案.md)
> **起草日期**：2026-11-04
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；identity-auth 1.0.1、frontend 1.2.1、super-admin 4.0.1、multi-tenant 5.1.3（ACTIVE；super-admin、multi-tenant `rebaseRequired=true`）
> **来源**：[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §11 第 6 点；设计方案 §8
> **拟决定**：改写 MESSAGE-014；新增 MESSAGE-030（命令结果）、MESSAGE-031（命令状态），发布根 v3.4.0；§3 是这一批（RFC-009～RFC-013）的发布清单：根 3.4.0 与四份专项的新版本

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. MESSAGE-014 要求业务幂等"保留结果"，重复提交不得重复产生副作用。但它没有规定：
   - 幂等范围由谁决定；
   - 同一个键、内容不同的命令算什么；
   - 保留的是什么结果；
   - 被拒绝的命令占不占键。

   MESSAGE-013 之后一句允许"可查询状态"，但没有规定有哪些状态、谁能看到。
2. 现行实现因此有两处缺口（2026-11-01 评审）：
   - 同一个键、内容不同的命令被当成重复，静默丢弃；
   - 没有命令状态，也不保留结果。
3. 本 RFC 补上四项：
   - 幂等范围由 Runtime 派生（L4 已经这样实现，这里写成条款）；
   - 请求指纹与冲突拒绝；
   - 两种终态，只有成功的命令占键；
   - 发送方按 commandId 查询状态，以及可见范围与保留期。
4. 这些都是向后兼容的新增或细化：
   - Handler 签名、Envelope、Manifest 字段不变；
   - 新的 L2A 方法以 default 方法加入（CAP-019）；
   - 新增一个稳定错误码（CAP-021 的 Minor 扩展）；
   - 红线不变。
5. 批准后发布根 v3.4.0（Minor，`compatibilityEpoch` 保持 1）。校验器要求每份 ACTIVE 专项继承当前 ACTIVE 根，所以四份专项同时各发布一个新版本，与 RFC-008 的做法相同。RFC-010～RFC-013 与本 RFC 同一批发布，有的专项因此不只改继承版本：§3 是这一批的完整清单。

---

## 1. 背景

### 1.1 现行条款

- MESSAGE-013 之后一句："Owner 可通过结果 Event 或可查询状态表达完成/拒绝"。
- [BRX-RS-MESSAGE-014]："Handler MUST 使用 `(handlerId, commandId)` Inbox 唯一键，并在同一 Owner 本地事务内写去重记录、变更自身数据及需要的结果 Event outbox；业务幂等另以 `(handlerId, idempotencyScope, idempotencyKey)` 保留结果，重复提交 MUST NOT 重复产生副作用；"

### 1.2 缺口

| 问题 | 现行条款 | 后果 |
|---|---|---|
| 幂等范围由谁定 | 只写了 `idempotencyScope` | 如果由发送方填写，不同租户、不同发送方用同一个键会互相占用。L4 已改为由 Runtime 派生（标准链路方案 D54），但条款没有要求 |
| 同一个键、内容不同 | 没有定义 | 后一个命令被静默丢弃，发送方以为它已经执行 |
| 保留什么结果 | "保留结果" | 实现只记 `ACCEPTED`；拒绝怎么记、占不占键，都没有定义 |
| 失败与拒绝 | 没有区分 | 业务拒绝按暂时性失败重试 6 次，然后停放，要运维处理 |
| 状态 | "可查询状态"（MAY） | 发送方无从知道命令有没有执行 |

### 1.3 业界做法

- 同一个键、请求内容不同时，服务端比较请求指纹并拒绝：[IETF Idempotency-Key 草案](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header)（422）、[Stripe](https://docs.stripe.com/api/idempotent_requests)、[Powertools for AWS Lambda](https://docs.aws.amazon.com/powertools/python/1.17.1/utilities/idempotency)。
- 只有开始执行后才保存结果：Stripe。Handler 抛异常时删除幂等记录，同一载荷再来会重新执行：Powertools。
- 键至少保留一段时间（Stripe 至少 24 小时），过后再用同一个键算新请求。

---

## 2. 根蓝图的改动（v3.4.0）

### 2.1 改写 MESSAGE-014

- **[BRX-RS-MESSAGE-014]** Handler MUST 使用 `(handlerId, commandId)` Inbox 唯一键，并在同一 Owner 本地事务内写去重记录、变更自身数据及需要的结果 Event outbox。业务幂等另以 `(handlerId, idempotencyScope, idempotencyKey)` 记录：
  1. `idempotencyScope` MUST 由 Runtime 派生，并包含已验证的发送方插件与 tenant：发送方 MUST NOT 能占用其他发送方或其他 tenant 的键。类型化客户端的范围是发送方、tenant 与命令类型，发送方不能指定；
  2. 键由第一个以 `SUCCEEDED`（MESSAGE-030）结束的命令占用。占用记录 MUST 与该命令的本地事务一起提交，并保存请求指纹：规范化载荷的 SHA-256。规范化的结构按 RFC 8785，数字取精确的十进制值、不转成双精度，并去掉值为 null 的对象成员；信封字段、`schemaVersion` 与发起人不计入；
  3. 同一个键、同一指纹的后续命令是重复：Handler MUST NOT 执行，其结果 MUST 指向占用该键的命令；
  4. 同一个键、不同指纹的后续命令 MUST 以稳定错误 `command.idempotency_conflict` 结束：Handler MUST NOT 执行，Runtime MUST NOT 重试或停放它，结果 MUST 在 MESSAGE-031 的状态中可见；
  5. 幂等记录 MUST NOT 保存载荷；重复提交 MUST NOT 重复产生副作用。

### 2.2 新增 MESSAGE-030：命令结果

- **[BRX-RS-MESSAGE-030]** Command 的终态只有 `SUCCEEDED` 与 `REJECTED`：
  1. `SUCCEEDED`：Handler 正常完成，Owner 本地事务已提交；
  2. `REJECTED`：Handler 以 `INVALID`、`DENIED`、`NOT_FOUND` 或 `CONFLICT` 类别的稳定 `BrixException` 结束。
     - Owner 本地事务 MUST 回滚。Runtime 随后在独立的短事务中记录拒绝与错误码；这个事务在前一个结束之后才开始，不是 DATA-029 禁止的嵌套事务。
     - Runtime MUST NOT 重试或停放被拒绝的命令。
     - 被拒绝的命令 MUST NOT 占用幂等键：之后同一个键的新命令会重新执行；
  3. 其他失败按 MESSAGE-015 重试、按 MESSAGE-028 停放。重试也不会成功的投递失败（例如载荷解不开、发送方没有声明这个命令）MAY 不重试、直接停放；
  4. 结果记录保存终态、稳定错误码、相关 commandId，以及按发送方查询所需的幂等范围、键、tenant 与时间；MUST NOT 保存异常消息、细节参数、载荷或个人信息。

### 2.3 新增 MESSAGE-031：命令状态

- **[BRX-RS-MESSAGE-031]** Runtime MUST 为发送方提供按 commandId 查询命令状态的 L2A 能力：
  1. 状态至少区分：
     - `QUEUED`；
     - `SUCCEEDED`；
     - `REJECTED`，带错误码；
     - `DUPLICATE`，带占键的 commandId；
     - `CONFLICT`；
     - `PARKED`；
     - `DISCARDED`；
     - `UNKNOWN`；
  2. 状态 MUST 只对提交该命令的发送方、在同一 tenant 的调用中可见。其他情况 MUST 返回 `UNKNOWN`，MUST NOT 透露命令是否存在；
  3. 结果记录与占键记录 MUST 至少保留到 Inbox 保留期，过后返回 `UNKNOWN`；
  4. 状态所依据的记录是平台受托记录（DATA-004），插件 MUST NOT 直接读写。

### 2.4 其余同步

- MESSAGE-013 之后一句改为："Owner 的完成或拒绝由 MESSAGE-031 的命令状态表达；Owner MAY 另外发布结果 Event"。
- 稳定错误目录（ERROR-013）新增 `command.idempotency_conflict`，类别 `CONFLICT`。
- 附录 A 机器可读基线：版本 3.4.0，`supersedes: 3.3.0`。命令的 `handlerMethod` 与 `invocationFields` 不变；MESSAGE 组的 gate 不变。
- Changelog 记录本次 Minor 修订；§12.2 的说明改为"v3.4.0 是对 v3.3.0 的 Minor 修订（命令幂等的请求指纹、结果与状态，RFC-009）"。
- 其余正文不变。端点的结果重放沿用 MANIFEST-018，不在本 RFC 内。

---

## 3. 这一批的发布清单

RFC-009～RFC-013 一起审批，根与四份 ACTIVE 专项同一次生效：校验器要求 ACTIVE 专项继承 ACTIVE 根，根和专项不能分开生效。各文档的新版本和同一版里的全部改动：

| 文档 | 现行 ACTIVE | 新版本 | 类型（根 §12.2） | 兼容代际 | `rebaseRequired` | 同一版里的全部改动 |
|---|---|---|---|---|---|---|
| runtime-shell（根） | 3.3.0 | 3.4.0 | Minor | 1，不变 | `false`，不变 | 本 RFC §2；RFC-010 §2；RFC-012 §2；下文的过期引用 |
| identity-auth | 1.0.1 | 1.1.0 | Minor | 1，不变 | `false`，不变 | 继承根 3.4.0；RFC-013 §3 |
| frontend | 1.2.1 | 1.2.2 | Patch | 1，不变 | `false`，不变 | 继承根 3.4.0；下文的过期引用 |
| super-admin | 4.0.1 | 5.0.0 | Major | 3 → 4 | `true`，不变 | 继承根 3.4.0；RFC-013 §2；RFC-012 §3；D95；下文的过期引用 |
| multi-tenant | 5.1.3 | 5.1.4 | Patch | 3，不变 | `true`，不变 | 继承根 3.4.0；RFC-011 §3；下文的过期引用 |

frontend、multi-tenant 只改继承版本、引用和 RFC-011 的文字，不改规则的可观察语义、DDL 或契约，按根 §12.2 属于"纠错但不改变可观察契约"的 Patch。identity-auth 新增条款与契约，是 Minor。super-admin 删一个 Runtime 入口、改会话的交付方式，是 Major（RFC-013 §5）。`rebaseRequired=true` 的两份，根 v3.1.0 起要求的 §7 持久化复核仍不在这一批。

D95（标准链路收尾方案 §10.32，负责人 2026-11-08 批准）写进 super-admin 5.0.0 的 BOOT-004：会话"成功消费后全部失效"指不能再写。已消费、未过期的 Bootstrap 会话只能取回消费它的那次 `create-first-admin` 的答案；过期答 401，不重放。

过期引用，只改引用，不改规则：

| 文档 | 位置（现行版本） | 改法 |
|---|---|---|
| 根 | §0.6 的专项表、附录 A、附录 B：专项还写着 v1.0、v1.2、v4.0、v5.0 的文件名和版本 | 改为这一批的新版本 |
| 根 | §0.6、附录 A、附录 B：多租户开发计划 `v3.1.3-多租户功能最小实现-开发落地计划（v4.0）.md` | 去掉；这份计划随这一批移进 `docs/archived` |
| 根 | §0.6 的"T-1～T-28"、附录 A 的两处 `end: 28` | 自 multi-tenant v5.1 起是 T-1～T-30 |
| 根 | AUTH-014："本 v3.2.0 根基线" | 改为"本根基线"，复核范围仍以附录 B 为准 |
| super-admin | 第 12、15、846～848 行：五条链接指向已移进 `docs/archived` 的旧版（身份认证 v1.0、超管 v3.0、前端 v1.2） | 改为现行版本，或 `archived/` 下的路径 |
| super-admin | 第 94～97 行：四条 brix 源码链接解析不到（相对路径不对，其中两个类已移到 platform-identity）；第 110 行：`docs-dev/archived/...` 是占位链接 | 改为不带链接的现行 brix 路径；第 110 行只留说明 |
| frontend | 第 9 行：身份认证 v1.0 的链接失效；附录 A：列的 4 份 `docs-dev/archived/` 文档已不在 | 链接改为现行版本；附录 A 删去这 4 份 |
| multi-tenant | 第 10 行：身份认证 v1.0 的链接失效 | 改为现行版本 |
| multi-tenant | §9.8.4："平台超管授权的统一，由 super-admin 下一版评估" | "下一版"改为"后续版本"：super-admin 5.0.0 不做这件事（见下） |

不在这一批：

- 平台权限 ID 只有一个来源（RFC-003 Q8；标准链路收尾方案 §11.1 单向门队列第 18 项）：方向牵涉超管，开工前另定；要改超管时，出 5.0.0 之后的版本。
- setup-token 由谁校验（同一队列第 1 项）：随身份认证 M1 切片 4 关闭。

登记：每份先写出 Freeze Candidate，在 lock 里登记为不指导施工的 CANDIDATE；负责人批准五份的最终字节后，一起转为 ACTIVE，旧版本原字节保留，转为 SUPERSEDED（标准链路收尾方案 §10.53 第 2 项的 9c～9i）。

---

## 4. 影响

| 层 / 模块 | 影响 |
|---|---|
| L2A runtime-sdk-api | `CommandClient.status(String)`（default 方法）与 `CommandStatus`；稳定错误码 `command.idempotency_conflict` |
| L2B runtime-orchestrator | 命令投递加上指纹、冲突、拒绝与结果记录；状态查询；运维丢弃停放的命令时记 `DISCARDED`；平台迁移（键表 V2、结果表 V1）与启动期表结构检查 |
| L2C infra-adapter-persistence-jpa | 键表与结果表的 JDBC 实现；占键改为 `INSERT ... ON CONFLICT DO NOTHING`，同一个键并发时等待，不再让事务作废 |
| L2C infra-adapter-kafka | 停放视图供状态查询读停放的命令 |
| 插件 | 不需要改代码。要表达拒绝的 Handler，抛出业务类别的 `BrixException` |
| 样例与文档 | sample-orders、sample-shipping 的状态、冲突、拒绝场景；作者文档 |

---

## 5. 兼容、风险与回滚

- **兼容**：
  - Handler 签名、Envelope、Manifest 不变。
  - 新表只给提供命令的 Owner 建。
  - V2 之前的占键记录没有指纹，按重复处理。
  - 弃用的按字符串提交（`CommandCapability.submit(CommandRequest)`，SDK 4.0.0 删除）在删除前仍按发送方给的范围占键；范围前面照样是 Runtime 填的发送方与 tenant（§2.1 第 1 项）。
- **行为变化**：Handler 抛出业务类别的 `BrixException` 时，命令不再重试 6 次后停放，而是立即 `REJECTED`。两仓现有的命令 Handler 只有样例中的一个。
- **风险**：

  | 风险 | 对策 |
  |---|---|
  | 暂时性错误被错判成拒绝，命令不再重试 | 只认四个业务类别；`UNAVAILABLE`、`DEADLINE_EXCEEDED`、`INTERNAL` 和非 `BrixException` 都按暂时性；一致性测试覆盖每个类别 |
  | 同一个请求被判成冲突 | 规范化后再取指纹；去掉 null 成员；版本与发起人不计入；冲突可见，发送方可以换键重发；冲突有指标 |
  | 状态泄露别人的命令 | 用调用方算出的范围比对，查不到一律 `UNKNOWN` |

- **回滚**：
  - 代码退回 3.3.0 的行为，不需要数据迁移，新表可以保留。
  - 蓝图层面的回滚需要新的 RFC，不能静默改回（GOVERNANCE-009）。

---

## 6. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的根蓝图改动与 v3.4.0 发布；§3 的发布清单（各文档的版本与类型、D95、过期引用）。RFC-010～RFC-013 各自的改动由各自的批准覆盖。批准记录写入本文状态行和 lock，施工提交引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-13:rfc-009:architecture-committee` | `2026-11-13T21:06:32+09:00` |
| security | `user-authorization:2026-11-13:rfc-009:security` | `2026-11-13T21:06:32+09:00` |
| sre | `user-authorization:2026-11-13:rfc-009:sre` | `2026-11-13T21:06:32+09:00` |

批准人：`jsq`。负责人 2026-11-13 答"全部批准，合并推送"（标准链路收尾方案 §10.54）。
