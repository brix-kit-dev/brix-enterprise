# RFC-009：命令幂等的请求指纹、结果与状态（Draft）

> **文档类型**：RFC（根级 Minor RFC，按根 §12.2"新增向后兼容 Capability/Manifest/红线"）
> **状态**：Draft。2026-11-04 负责人同意方向，正式审批（architecture-committee、security、SRE）与根 3.4.0 的发布排在标准链路收尾方案 §11 末尾。批准前**不指导施工**；施工依据是现行根蓝图 v3.3.0 与[幂等记录与命令结果设计方案](../v3.3.0-运行壳-幂等记录与命令结果-设计方案.md)
> **起草日期**：2026-11-04
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；identity-auth 1.0.1、frontend 1.2.1、super-admin 4.0.1、multi-tenant 5.1.3（ACTIVE；super-admin、multi-tenant `rebaseRequired=true`）
> **来源**：[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §11 第 6 点；设计方案 §8
> **拟决定**：改写 MESSAGE-014；新增 MESSAGE-030（命令结果）、MESSAGE-031（命令状态），发布根 v3.4.0；四份 ACTIVE 专项各发布一个只改继承版本的 Patch

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
5. 批准后发布根 v3.4.0（Minor，`compatibilityEpoch` 保持 1）。校验器要求每份 ACTIVE 专项继承当前 ACTIVE 根，所以四份专项同时各发布一个只改继承版本的 Patch，与 RFC-008 的做法相同。

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
  1. `idempotencyScope` MUST 由 Runtime 按已验证的发送方插件、tenant 与命令类型派生。发送方 MUST NOT 指定它，也 MUST NOT 能占用其他发送方或其他 tenant 的键；
  2. 键由第一个以 `SUCCEEDED`（MESSAGE-030）结束的命令占用。占用记录 MUST 与该命令的本地事务一起提交，并保存请求指纹：规范化载荷的 SHA-256。规范化按 RFC 8785，并去掉值为 null 的对象成员；信封字段、`schemaVersion` 与发起人不计入；
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
  3. 其他失败是暂时性失败，按 MESSAGE-015 重试、按 MESSAGE-028 停放；
  4. 结果记录只保存终态、稳定错误码与相关 commandId，MUST NOT 保存异常消息、细节参数、载荷或个人信息。

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

## 3. 专项蓝图的 Patch 版本

| 现行 ACTIVE | 新版本 | 改动 |
|---|---|---|
| identity-auth 1.0.1 | 1.0.2 | 继承的根改为 3.4.0；文首与文末状态 |
| frontend 1.2.1 | 1.2.2 | 同上 |
| super-admin 4.0.1 | 4.0.2 | 同上；`rebaseRequired=true` 不变 |
| multi-tenant 5.1.3 | 5.1.4 | 同上；`rebaseRequired=true` 不变 |

这些版本不改任何规则、红线、DDL 或契约，`compatibilityEpoch` 不变。按根 §12.2，它们属于"纠错但不改变可观察契约"的 Patch，由本 RFC 的批准一并覆盖。旧版本原字节保留，转为 SUPERSEDED。

---

## 4. 影响

| 层 / 模块 | 影响 |
|---|---|
| L2A runtime-sdk-api | `CommandClient.status(String)`（default 方法）与 `CommandStatus`；稳定错误码 `command.idempotency_conflict` |
| L2B runtime-orchestrator | 命令投递加上指纹、冲突、拒绝与结果记录；状态查询；平台迁移（键表 V2、结果表 V1）与启动期表结构检查 |
| L2C infra-adapter-persistence-jpa | 键表与结果表的 JDBC 实现；占键改为 `INSERT ... ON CONFLICT DO NOTHING`，同一个键并发时等待，不再让事务作废 |
| L2C infra-adapter-kafka | Owner 一侧丢弃停放的命令时记 `DISCARDED`；停放视图供状态查询使用 |
| 插件 | 不需要改代码。要表达拒绝的 Handler，抛出业务类别的 `BrixException` |
| 样例与文档 | sample-orders、sample-shipping 的状态、冲突、拒绝场景；作者文档 |

---

## 5. 兼容、风险与回滚

- **兼容**：
  - Handler 签名、Envelope、Manifest 不变。
  - 新表只给提供命令的 Owner 建。
  - V2 之前的占键记录没有指纹，按重复处理。
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

需要 architecture-committee、security、SRE 批准。批准范围：§2 的根蓝图改动与 v3.4.0 发布、§3 的四个 Patch 版本。批准记录写入本文状态行和 lock，施工提交引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | 待批 | — |
| security | 待批 | — |
| sre | 待批 | — |
