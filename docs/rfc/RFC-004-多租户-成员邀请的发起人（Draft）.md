# RFC-004：成员邀请的发起人（Draft）

> **文档类型**：RFC（多租户专项 Patch 修订提案）
> **状态**：已裁决（2026-10-27）。条款已并入 multi-tenant 5.1.1（2026-10-27 Architecture Frozen / ACTIVE）；本文是决策背景，**不指导施工**
> **起草日期**：2026-10-27
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；multi-tenant 5.1（ACTIVE，`rebaseRequired=true`）；identity-auth 1.0、super-admin 4.0、frontend 1.2（ACTIVE）
> **来源**：2026-10-27 按 multi-tenant 5.1 盘点下一步改造时发现的条款冲突；它阻断租户成员管理切片
> **拟修订**：multi-tenant §5.5「邀请用途铁律」、§5.7 第 3 条、§9.8.2 的对象关系约束；不修订根蓝图与其他专项
> **裁决**：2026-10-27 负责人选择方案 A（§2）

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 租户成员邀请（`TENANT_MEMBER`）由该租户持有 `tenant:member:invite` 的 `ACTIVE` 成员发起。按 §9.8.2 的默认授予，即 OWNER 与 ADMIN。
2. 目标角色为 `OWNER` 的邀请等同任命 OWNER：创建、重发和撤销这类邀请，还须持有只授予 OWNER 的 `tenant:owner:transfer`（`BRX-TENANT-AUTHZ-007`）。因此 ADMIN 只能邀请 ADMIN 或 MEMBER。
3. 判定由 platform-tenant 的 resource policy 执行，不能只靠前端隐藏。权限码目录与默认授予、DDL、红线和 Token 都不变。

## 1. 背景

multi-tenant 5.1 对"谁能发起租户成员邀请"有两种写法：

| 位置 | 原文要点 |
|---|---|
| §5.5「邀请用途铁律」 | `TENANT_MEMBER` 只能由该租户 `ACTIVE OWNER` 发起，可邀请 `OWNER` / `ADMIN` / `MEMBER` |
| §5.7 第 3 条 | 首位 OWNER 接管后，租户内 `ACTIVE OWNER` 发起 `TENANT_MEMBER` 邀请，可邀请 `OWNER` / `ADMIN` / `MEMBER` |
| §9.8.2 | `tenant:member:invite`（邀请、重发、撤销成员邀请）授予 OWNER 与 ADMIN，范围 `TENANT` |

§5.5 与 §5.7 的写法来自 v4.0。RFC-003 裁决时采纳了附录 A（Q6），把 `tenant:member:invite` 授予 ADMIN；v5.1 加入 §9.8 时没有同步修改这两处。按 §5.5 实现，ADMIN 持有的权限无法使用；按 §9.8.2 实现，又违反 §5.5 的铁律。

三处都没有写明 ADMIN 能否邀请 OWNER。`BRX-TENANT-AUTHZ-007` 规定"任命 OWNER"只能用只授予 OWNER 的权限码表达，而 `tenant:owner:transfer` 的用途正是"任命 OWNER、转移所有权"。

现状：租户成员邀请尚未实现，platform-tenant 只实现了 `FIRST_OWNER`；没有代码或数据依赖任何一种写法。

## 2. 方案比较

| 方案 | 内容 | 结论 |
|---|---|---|
| A | 按 §9.8.2：OWNER 与 ADMIN 都能邀请；邀请 OWNER 还须 `tenant:owner:transfer`，即只有 OWNER 能邀请 OWNER | **采纳**。ADMIN 负责日常人员管理（加人、停用、调角色、重置 MFA），OWNER 保留所有权和安全设置；与 RFC-003 的裁决一致 |
| B | 按 §5.5、§5.7：只有 OWNER 能邀请，去掉 ADMIN 的 `tenant:member:invite` | 否决。ADMIN 能停用、调整成员却不能加人，每个新成员都要 OWNER 亲自邀请；还要改已裁决的权限目录 |
| C | 取消 ADMIN 角色 | 否决。管理人员的人只能被任命为 OWNER，随之获得任命 OWNER、转移所有权、修改安全设置和降级其他 OWNER 的能力，违反最小权限；还会改变 `BRX-TENANT-AUTHZ-002` 的内置角色集合 |

## 3. 条款修订（写入 multi-tenant 5.1.1）

1. §5.5「邀请用途铁律」中 `TENANT_MEMBER` 一句改为：只能由该租户持有 `tenant:member:invite` 的 `ACTIVE` 成员发起（默认授予 OWNER 与 ADMIN，§9.8.2），可邀请 `ADMIN` / `MEMBER`；`target_role = OWNER` 的邀请等同任命 OWNER，创建、重发与撤销还须持有只授予 OWNER 的 `tenant:owner:transfer`（`BRX-TENANT-AUTHZ-007`）。
2. §5.7 第 3 条按同一规则改写。
3. §9.8.2 的对象关系约束增加：ADMIN 只能邀请 ADMIN 或 MEMBER；目标角色为 OWNER 的邀请只有 OWNER 能创建、重发和撤销。

不变：§5.5 的 DDL（`chk_invite_actor` 本来只要求发起人是本租户成员）、§9.8.2 的权限码与默认授予、T-1～T-30、Token、接受时按 `invitation_purpose` 选择处理器的规则。

## 4. 治理与版本

| 文档 | 新版本 | 类型 | 理由 |
|---|---|---|---|
| multi-tenant | 5.1.1 | Patch（根 §12.2「纠错但不改变可观察契约/红线」），`compatibilityEpoch` 保持 `3` | 消除 v5.1 内部的条款冲突，使 §5.5、§5.7 与已裁决、已冻结的 §9.8.2 一致；权限码目录、红线、DDL 与 Token 不变 |
| 其他蓝图 | 不变 | — | 不涉及 |

`rebaseRequired=true` 不变：根 v3.1.0 起要求的 §7 持久化复核不在本次范围。

本次按 multi-tenant §13 的完整流程处理：

1. 负责人裁决（2026-10-27 已完成，选方案 A）；
2. 写出 `docs/v5.1.1-多租户功能最小实现-设计蓝图.md`（Freeze Candidate），在 lock 中登记为不指导施工的 CANDIDATE（2026-10-27 已完成）；
3. 架构、安全、SRE 批准（2026-10-27 已完成）；
4. 在 lock 中登记哈希、commit 与批准记录，v5.1 转为 SUPERSEDED（2026-10-27 已完成）。

## 5. 兼容性、迁移与回滚

- **兼容性**：租户成员邀请尚未实现，没有代码或数据依赖旧写法；platform-tenant Manifest 的权限码与授予不变。
- **迁移**：无数据库或数据变更。施工租户成员管理切片时，platform-tenant 的 resource policy 按 §3 判定，并补正反例：ADMIN 邀请 ADMIN 或 MEMBER 放行；ADMIN 邀请 OWNER，或重发、撤销目标为 OWNER 的邀请，返回 403；MEMBER 没有 `tenant:member:invite`，由 Dispatcher 在 Handler 前拒绝。
- **回滚**：只涉及文档。5.1.1 未批准时 v5.1 保持 ACTIVE，成员邀请切片在冲突裁决生效前不得开工。
