# RFC-007：提前停用两个按 contextId 查找的 L2A 方法（Draft）

> **文档类型**：RFC（根级安全 RFC，按 `BRX-RS-CAP-023` 的安全例外缩短弃用期；RFC-006 的补充）
> **状态**：已批准（2026-10-27，architecture-committee、security、SRE，决定记录 `user-authorization:2026-10-27:rfc-007`）。本文是决策背景，**不指导施工**；施工依据是设计方案与本文 §3 的迁移说明
> **起草日期**：2026-10-27
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；multi-tenant 5.1.2（ACTIVE，`rebaseRequired=true`）；identity-auth 1.0（ACTIVE）
> **来源**：[租户隔离下沉持久化适配器设计方案](../archived/v5.1.1-多租户-租户隔离下沉持久化适配器-设计方案.md) §6.1 的更正（§13 第 1 条）
> **拟决定**：`TenantAccessCapability`（runtime-sdk-api）的两个按 contextId 查找的方法不走完整弃用期，在本次施工中立即停用，下一个 Major 删除。不修订根蓝图、专项蓝图或任何红线

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 下面两个方法只凭 contextId 查找，不带租户：
   - `findMembershipByContextId(String contextId)`
   - `findPrincipalshipByContextId(String contextId)`
2. 设计方案 §6.1 原计划：弃用这两个方法，弃用期内由 L2B 映射到策略 P-1，继续可用。这一点不成立：
   - multi-tenant 5.1.2 §6.4 中，P-1 `login-tenant-discovery` 的键是 `identity_id`，只能读 `sys_tenant_member`；
   - 按 contextId 查找时没有 `identity_id` 这个键；`findPrincipalshipByContextId` 读的 `sys_tenant_principal` 也不在 P-1 可读的表内；
   - §6.4 没有其他可用的登记。
3. 因此，新机制下这两个方法没有租户范围，调用即以 `persistence.tenant_scope_required` 失败（fail-closed）。这等于在弃用的同时停用，缩短了 CAP-023 规定的弃用期，需要本 RFC。
4. 平台内的全部 6 个调用点已在同一变更中改用带租户的新方法；没有其他使用方。迁移说明见 §3。

## 1. 背景

按根 `BRX-RS-DATA-040`，租户过滤下沉到持久化 Adapter 之后：

- 没有租户范围的数据访问一律拒绝；
- 跨租户访问只能按 multi-tenant §6.4 的登记授予。

这两个方法都需要登记之外的跨租户访问：

| 方法 | 为什么需要跨租户 | 冲突的条款 |
|---|---|---|
| `findMembershipByContextId(contextId)` | 只凭 contextId 在全部租户中查找员工上下文 | 根 DATA-040；multi-tenant §6.4（没有对应登记）、T-9 |
| `findPrincipalshipByContextId(contextId)` | 只凭 contextId 在全部租户中查找 C 端主体 | 同上；另见 §9.2：C 端发现限定在当前租户 |

保留这两个方法有两种做法，都不可取：

- 在 §6.4 增加一条以 `context_id` 为键的策略。这要走 multi-tenant 专项 §13 的 RFC，并且会为一种查找开出跨租户豁免，而它的调用方其实都知道租户（§2）。这与本次改造的目标相反。
- 让它们在弃用期内绕过 Adapter。这违反 DATA-040，不考虑。

CAP-023 规定：弃用方法要保留到下一个 Major，弃用期至少覆盖两个 Minor 发布周期和六个月中较长的一个；安全问题可以经安全 RFC 缩短，但必须提供迁移说明。

## 2. 影响

**调用方**：2026-10-27 在 brix 与 brix-enterprise 中全量搜索。主干上有 6 个调用点，都在平台的身份协议面和令牌校验中，而且都是运行中的路径。它们在分支 `claude/tenant-isolation-l2c` 中都已改为在确定的租户内查找：

| 调用点（主干行号） | 用途 | 租户从哪里来 | 改用 |
|---|---|---|---|
| `HostedLoginController:301` | 选择租户时兑换 ticket | ticket 签发时一并保存的 tenantId | `findMembershipByContext` |
| `ActorTokenGenerator:131` | 签发员工令牌 | 登录主体的 tenantId | `findMembershipByContext` |
| `BffController:140` | BFF 回调 | ID 令牌的 `tid` | `findMembershipByContext` |
| `HostedLoginSessionFilter:108` | 切换租户生效 | 切换意图记录时一并保存的 tenantId | `findMembershipByContext` |
| `JwtValidator:281` | 每次请求校验员工令牌 | 令牌的租户声明 | `findMembershipByContext` |
| `JwtValidator:291` | 每次请求校验 Subject 令牌 | 令牌的租户声明 | `findPrincipalshipByContext` |

brix-enterprise 中没有调用方。

**对外影响**：`TenantAccessCapability` 只供身份协议面和平台令牌校验使用，multi-tenant §6.3 规定它不得暴露给普通业务插件，因此没有外部使用方。

**上线影响**：部署瞬间尚未兑换的选择 ticket 和切换意图（有效期 5 分钟）不带 tenantId，兑换会失败，用户重新选择租户即可。已签发的令牌本来就带租户声明，不受影响。

## 3. 迁移说明

| 停用的方法 | 替代 |
|---|---|
| `findMembershipByContextId(contextId)` | `findMembershipByContext(tenantId, contextId)`（3.3.0 新增的 `default` 方法） |
| `findPrincipalshipByContextId(contextId)` | `findPrincipalshipByContext(tenantId, contextId)`（3.3.0 新增的 `default` 方法） |

- 租户取自调用方已经确定的来源：令牌的租户声明、登录主体，或登录事务在给出该上下文时一并保存的租户。
- 弃用标注写明替代项、引入版本、弃用版本和移除版本（CAP-022）：`@Deprecated(since = "3.3.0", forRemoval = true)`，4.0.0 删除。
- 停用后，调用以稳定错误码 `persistence.tenant_scope_required` 失败；Dispatcher 按稳定错误目录映射，响应中不出现内部细节。

## 4. 风险与回滚

- **风险**：将来若有调用方需要只凭 contextId 查找，必须先取得租户，或按 multi-tenant §13 在 §6.4 增加登记。
- **若不批准**：两个方法在新机制下仍然无法工作，因为 5.1.2 §6.4 没有能覆盖它们的登记。届时只能二选一：
  - 按 multi-tenant §13 提交 Patch，登记一条以 `context_id` 为键的"遗留"策略，保留到下一个 Major，并记为技术债；
  - 推迟合并整个租户隔离分支。

## 5. 审批

需要 architecture、security、SRE 批准。批准记录写入本文状态行，并在施工提交中引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | `user-authorization:2026-10-27:rfc-007:architecture-committee` | `2026-10-27T20:47:00+09:00` |
| security | `user-authorization:2026-10-27:rfc-007:security` | `2026-10-27T20:47:00+09:00` |
| sre | `user-authorization:2026-10-27:rfc-007:sre` | `2026-10-27T20:47:00+09:00` |

批准人：`jsq`。
