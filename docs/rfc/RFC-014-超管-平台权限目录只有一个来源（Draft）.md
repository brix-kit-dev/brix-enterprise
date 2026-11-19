# RFC-014：平台权限目录只有一个来源（Draft）

> **文档类型**：RFC（super-admin Minor 修订的提案；不修订根蓝图和其他专项）
> **状态**：Draft。2026-11-19 负责人按推荐批准[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §10.100 的 D156～D161，本 RFC 按 D161 起草。正式审批（architecture-committee、security、SRE）随 super-admin 下一版（方案 §11.1 待办"下次出 super-admin 新版本时"）。批准前**不指导施工**；施工依据仍是 super-admin 5.0.0，单向门队列第 18 项按 5.0.0 现有条款施工（§3）
> **起草日期**：2026-11-19
> **依据基线**：runtime-shell 3.4.0（ACTIVE 根蓝图）；super-admin 5.0.0（ACTIVE，`rebaseRequired=true`）、identity-auth 1.1.0、frontend 1.2.2、multi-tenant 5.1.4（ACTIVE）
> **来源**：标准链路收尾方案 §10.46 第 6 项、§10.47 第 6 项、§10.100（D156～D161）、§11.1 单向门队列第 18 项；[RFC-003](RFC-003-多租户-租户最小RBAC授权模型（Draft）.md) Q8
> **拟修订**：super-admin 的 §0、§3.3、§6、§12.2、§14.2 共五处，下一版为 5.1.0，兼容代际 4 不变；根、identity-auth、frontend、multi-tenant 不因本 RFC 改动

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 平台权限 ID 只在 super-admin §4 的版本化契约 `PermissionCode` 里定义。种子、Platform Token、端点声明和前端常量都是它的副本，每处由测试与契约核对，不一致就构建失败（D156、D160）。本 RFC 把这一条写成 `BRX-SA-AUTH-008`。
2. RFC-003 Q8（平台授权是否并入租户的授予表模型）的评估结论：不并入。Platform Token 照 §7 继续携带权限列表；平台控制台改经 BFF 登录（身份认证 M1 切片 4）时再评估（D156）。
3. §6 补上两个已上线、只用目录里的 ID 的只读入口：安装级配额（`platform:tenant:read`，D157），首位 OWNER 邀请的当前一条（`platform:tenant:first-owner-invite`）。
4. §3.3 列出 10 个退役 ID：它们曾被 seed 或签发，不在目录里，永不复用（D158）。
5. §0、§12.2 写明：只读查看安装级配额在做，配额的管理与计量不做。
6. 版本：super-admin 5.1.0，Minor，兼容代际 4 不变（§4）。

---

## 1. 背景

### 1.1 施工前的现状（2026-11-19 调查，方案 §10.100 第 2 项）

- 目录：§3.3、§4 的 10 个 ID，代码里是 `platform-auth-api` 的 `PermissionCode`，有钉住测试（方案 §10.46，D118）。
- 目录外还有 10 个 ID，都在 platform-auth 的 `PlatformPermissions` 和 V1、V2 迁移的 seed 里：
  - `platform:bypass`：seed 并授给超管角色；签发时滤掉，不进令牌；`PermissionAspect` 仍认它。§3.3、Δ7 不许。
  - 6 个旧的粗粒度 ID（`platform:tenant:manage`、`platform:tenant:view`、`platform:admin:manage`、`platform:audit:view`、`platform:system:config`、`platform:data:recovery`）：seed 并授给超管，每个超管令牌都带，没有入口用。
  - `platform:license:read`：seed 并授给超管，令牌带；`GET /api/platform/license/quota` 用它授权，违反 `BRX-SA-AUTH-006`；控制台的首页卡片、配额页和菜单也用它。
  - `platform:bootstrap:read`、`platform:bootstrap:create-first-admin`：seed 并授给 `BOOTSTRAP` 角色，没有令牌、没有入口用。真正的 Bootstrap 会话令牌带的是 `bootstrap:status`、`bootstrap:session`、`bootstrap:create-first-admin`，属于 §7 说的由安全 Profile 管理的会话权限集合，不在平台目录里。
- 没有代码读 `auth_role`、`auth_permission`、`auth_role_permission`；令牌里的 ID 来自代码。
- 端点声明、令牌、seed、前端常量都不与目录核对。前端常量文件的注释说有集成测试比对前后端，实际没有。
- 两个已上线的只读入口不在 §6 表里：
  - `GET /api/platform/license/quota`：返回安装级配额（已用、上限、License 状态、能否再建租户），数据由 platform-tenant 经 `TenantAdministration` 提供，语义按多租户专项 §1.2。租户列表的每一行已经在 `platform:tenant:read` 下带着同样的已用、上限和 License 状态。
  - `GET /api/platform/tenants/{tenantId}/first-owner-invitations/current`：控制台的邀请对话框用它读当前邀请，授权用 `platform:tenant:first-owner-invite`。
- RFC-003 Q8 把"平台授权是否统一到租户的授予表模型"留给 super-admin 下一版评估；5.0.0 只做了 RFC-013，没有评估。

### 1.2 要改的现文

super-admin 5.0.0：

| 位置 | 现文 |
|---|---|
| §0 表"不做"一行 | "自定义角色编辑、自研认证器、计费/配额、删除超管、短信通知" |
| §3.3 末两段 | "`platform:admin:change-own-password` 自 v4.0 起不再对应 Runtime Entry（自身凭证在身份协议面的账户安全页管理），ID 保留，不得复用。"以及 `BRX-SA-AUTH-006` |
| §6 表 | 13 行，没有安装级配额和首位 OWNER 邀请的当前一条 |
| §12.2 第 4 条 | "计费、订阅、配额和跨租户业务数据查询。" |
| §14.2 "身份安全"一行 | 专项条款"BRX-SA-AUTH-001..007、SA-7/8/10/13；身份认证专项"，验证证据"token/passkey/step-up/profile tests" |

### 1.3 不改的现文

| 位置 | 为什么不改 |
|---|---|
| §4 的 `RoleCode`、`PermissionCode` | 目录不增不减，仍是 10 个 ID |
| §7 Platform Token 示意与 `BRX-SA-AUTH-001` | 令牌继续带 `permissions`（D156）；不带 bypass 的要求不变 |
| `BRX-SA-AUTH-006`、§0.0.1 Δ7 | 施工后正好符合 |
| `BRX-SA-TENANT-004` | 配额的语义仍由多租户专项定义，platform-admin 只读 |
| 多租户专项 §1.2、§9.8 | 不涉及 |
| 根 3.4.0 | 不涉及 |

---

## 2. super-admin 的修订（写入下一版 5.1.0）

1. §0 表"不做"一行的"计费/配额"改为"计费/配额管理"。
2. §3.3 在 `BRX-SA-AUTH-006` 之后新增：
   - **[BRX-SA-AUTH-008]** 平台权限 ID 只在 §4 的版本化契约 `PermissionCode` 中定义。`auth_permission` 的平台目录与 `PLATFORM_SUPER_ADMIN` 的授予 MUST 与契约逐项相同（MVP 的超管拥有目录中的全部 ID）；Platform Token 的 `permissions`、descriptor 的 `authorization.permissions` 和前端常量里的平台权限 ID MUST 都在契约里。这些核对 MUST 由测试执行，不一致 MUST 使构建失败。
   - 下列 ID 曾在 v5.1 之前的实现中被 seed 或签发，不在目录里，已退役，MUST NOT 再用作任何权限 ID：`platform:bypass`、`platform:tenant:manage`、`platform:tenant:view`、`platform:admin:manage`、`platform:audit:view`、`platform:system:config`、`platform:data:recovery`、`platform:license:read`、`platform:bootstrap:read`、`platform:bootstrap:create-first-admin`。
   - 平台授权不采用多租户专项 §9.8 的授予表模型：Platform Token 照 §7 携带权限列表，Dispatcher 按 descriptor 的具体 ID 判定（RFC-003 Q8 的评估结论，RFC-014）。
3. §6 表新增两行：
   - 在 `GET /api/platform/tenants` 之后：`| GET /api/platform/license/quota | Platform Token | platform:tenant:read | forbidden | not-applicable |`
   - 在 `POST /api/platform/tenants/{tenantId}/first-owner-invitations` 之后：`| GET /api/platform/tenants/{tenantId}/first-owner-invitations/current | Platform Token | platform:tenant:first-owner-invite | forbidden | not-applicable |`

   表下说明加一句："安装级配额只读：计数范围、哪些状态计入和 License 到期的处理由多租户专项 §1.2 定义（BRX-SA-TENANT-004），本入口只返回租户 Owner 的类型化快照，用查看租户的权限。"
4. §12.2 第 4 条改为："计费、订阅、配额的管理与计量，以及跨租户业务数据查询；只读查看安装级配额在做（§6）。"
5. §14.2 "身份安全"一行：专项条款改为"BRX-SA-AUTH-001..008、SA-7/8/10/13；身份认证专项"，验证证据加"权限 ID 与契约核对的测试（seed、token、descriptor、前端常量）"。

文首版本改为 5.1.0，兼容代际 `4` 与 `rebaseRequired=true` 不变；§18 新增"v5.1 相对 v5.0.0 的变更"，列出同一版里的全部改动（§4）。

---

## 3. 施工（不等本 RFC 批准）

单向门队列第 18 项按 5.0.0 现有条款（`BRX-SA-AUTH-006`、Δ7、§3.3）施工，方案 §10.100 第 4 项切成七点：

| 点 | 内容 |
|---|---|
| 18a | 本 RFC |
| 18b | 端点声明只用目录里的 ID：安装级配额入口改用 `platform:tenant:read`，控制台改看 `TENANT_READ` |
| 18c | 前端常量与契约核对，进会挡构建的 CI 作业 |
| 18d | 删除 `PermissionAspect`、`@RequirePermission`、`@Anonymous` 和 `AuthorizationExceptionAdvice` |
| 18e | 超管令牌只带目录里的 10 个 ID |
| 18f | 前滚迁移删除目录外的 seed 和 `BOOTSTRAP` 角色行 |
| 18g | 红线扫描禁止 `platform:bypass` |

施工修的是 5.0.0 已有条款下的旧问题；本 RFC 新增的 `BRX-SA-AUTH-008` 在发布前就已满足，不需要过渡期豁免。

---

## 4. 治理与版本

| 文档 | 下一版 | 类型 | 同一版里的改动 |
|---|---|---|---|
| super-admin | 5.1.0 | Minor，兼容代际 4 不变 | 本 RFC §2 的五处；同一版的其他改动在发布时登记（方案 §11.1 待办"下次出 super-admin 新版本时"） |
| 根、identity-auth、frontend、multi-tenant | 不变 | — | 本 RFC 不改 |

为什么是 Minor：根 §12.2 把"新增向后兼容 Capability/Manifest/红线"算 Minor。本 RFC 新增一条 MUST（`BRX-SA-AUTH-008`）和两个已上线的只读入口，不删也不改任何入口和 ID，调用方不用改。

`rebaseRequired=true` 不变：§7 的持久化复核不在本次范围。

按 §18.2 的做法登记：先写出 5.1.0 候选稿，在 lock 中登记为不指导施工的 CANDIDATE；architecture-committee、security、SRE 批准后登记哈希、commit 与批准记录，5.0.0 转为 SUPERSEDED。

---

## 5. 兼容性、迁移与回滚

- **兼容性**：安装级配额入口的授权由 `platform:license:read` 改为 `platform:tenant:read`。只有一个角色，直到 18e 令牌去掉目录外的 ID 之前，它两个都有；控制台同时改看 `TENANT_READ`（18b），没有仓外的调用方。令牌少了目录外的 7 个 ID，没有任何入口和页面用它们。
- **迁移**：前滚迁移删除目录外的 seed 行和 `BOOTSTRAP` 角色行（18f）；没有代码读这三张表，已执行的迁移不改。
- **回滚**：代码退回旧镜像即可；迁移删掉的行不会回来，但旧代码同样不读这些表。蓝图层面的回滚要新的 RFC（根 GOVERNANCE-009）。本 RFC 未批准时，super-admin 5.0.0 保持 ACTIVE。

---

## 6. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的 super-admin 5.1.0 五处与 §4 的版本类型。批准记录写入本文状态行和 lock。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | 待批准 | — |
| security | 待批准 | — |
| sre | 待批准 | — |
