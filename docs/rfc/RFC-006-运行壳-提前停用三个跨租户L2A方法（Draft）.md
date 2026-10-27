# RFC-006：提前停用三个跨租户 L2A 方法（Draft）

> **文档类型**：RFC（根级安全 RFC，按 `BRX-RS-CAP-023` 的安全例外缩短弃用期）
> **状态**：Draft，待 architecture、security、SRE 批准
> **起草日期**：2026-10-27
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；multi-tenant 5.1.1（ACTIVE，`rebaseRequired=true`）；identity-auth 1.0（ACTIVE）
> **来源**：[租户隔离下沉持久化适配器设计方案](../v5.1.1-多租户-租户隔离下沉持久化适配器-设计方案.md) §8 R2
> **拟决定**：`TenantAccessCapability`（runtime-sdk-api）的三个方法不走完整弃用期，在本次施工中立即停用，下一个 Major 删除。不修订根蓝图、专项蓝图或任何红线

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 下面三个方法只有靠跨租户访问才能工作：
   - `getActivePrincipalships(Long identityId)`
   - `touchMemberAccess(Long memberId)`
   - `touchPrincipalAccess(Long principalId)`
2. 本 RFC 申请按 CAP-023 的安全例外，在本次施工中立即停用它们：标注弃用（CAP-022），调用立即失败（fail-closed），不再访问数据；下一个 Major 删除。
3. 它们当前都没有运行中的调用方。迁移说明见 §3。

## 1. 背景

按根 `BRX-RS-DATA-040`，租户过滤下沉到持久化 Adapter 之后：

- 没有租户范围的数据访问一律拒绝；
- 跨租户访问只能按 multi-tenant §6.4（5.1.2 Freeze Candidate）的登记授予。

这三个方法都需要登记之外的跨租户访问：

| 方法 | 为什么需要跨租户 | 冲突的条款 |
|---|---|---|
| `getActivePrincipalships(identityId)` | 列出该身份在全部租户中的 Subject | multi-tenant §9.2：C 端发现必须限定在当前租户，不允许跨租户聚合 |
| `touchMemberAccess(memberId)` | 只凭 id 修改成员行，没有租户 | 根 DATA-040、multi-tenant T-9 |
| `touchPrincipalAccess(principalId)` | 只凭 id 修改主体行，没有租户 | 同上 |

CAP-023 规定：弃用方法要保留到下一个 Major，弃用期至少覆盖两个 Minor 发布周期和六个月中较长的一个；安全问题可以经安全 RFC 缩短，但必须提供迁移说明。

若照常保留这三个方法，新机制就要另开三个跨租户豁免。这正是本次改造要消除的东西。

## 2. 影响

**调用方**：2026-10-27 在 brix 与 brix-enterprise 中全量搜索，三个方法的调用方都只在 platform-auth 的遗留代码里，没有入口能到达它们：

| 调用方 | 状态 |
|---|---|
| `AuthFlowCapabilityImpl` 的租户登录方法（`login`、`loginActor`、`loginSubject`、`selectTenant`、`selectContext`） | 托管登录上线后不再被调用；仍在使用的只有 `loginPlatformAdmin`（EX-2026-002），它不调用这三个方法 |
| `OAuth2FederationCapabilityImpl` | 只注册了 Bean，没有任何调用方 |

**对外影响**：`TenantAccessCapability` 只供身份协议面和平台令牌校验使用，multi-tenant §6.3 规定它不得暴露给普通业务插件，因此没有外部使用方。

## 3. 迁移说明

| 停用的方法 | 替代 |
|---|---|
| `getActivePrincipalships(identityId)` | `findPrincipalship(identityId, tenantId)`。C 端的租户由品牌应用客户端绑定（multi-tenant §9.2） |
| `touchMemberAccess(memberId)` | `touchMemberAccess(tenantId, memberId)`（新增的 `default` 方法） |
| `touchPrincipalAccess(principalId)` | `touchPrincipalAccess(tenantId, principalId)`（新增的 `default` 方法） |

弃用标注写明替代项、引入版本、弃用版本和移除版本（CAP-022）。停用后，调用以稳定错误码失败；Dispatcher 按稳定错误目录映射，响应中不出现内部细节。

## 4. 风险与回滚

- **风险**：将来若有调用方需要这些能力，必须使用带租户的替代方法，或按 multi-tenant §13 在 §6.4 增加登记。
- **回滚**：这些方法在本次施工中才停用；若不批准本 RFC，就改用设计方案 §8 中的备选做法——为它们各登记一条"遗留"策略，保留到下一个 Major，并记为技术债。

## 5. 审批

需要 architecture、security、SRE 批准。批准记录写入本文状态行，并在施工提交中引用本 RFC。
