# RFC-003：租户最小 RBAC 授权模型（Draft）

> **文档类型**：RFC（多租户专项授权条款修订提案）
> **状态**：Draft，待负责人裁决（见 §11）。本文是决策背景，**不指导施工**；裁决结果登记进新版蓝图后才生效
> **起草日期**：2026-10-23
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；identity-auth 1.0、frontend 1.2（ACTIVE）；multi-tenant 5.0、super-admin 4.0（ACTIVE，均为 `rebaseRequired=true`，本文不能作为它们 Implementation Accepted 的依据）
> **来源**：identity-auth 1.0 §13「前置」阶段中的"租户最小 RBAC（另起 RFC）"；RFC-002 §8 差距 11、附录 C.4
> **拟修订**：multi-tenant §4.1、§8、§9.6、§11.2、§11.3、§12、§16（目标版本见 §10）；不修订根蓝图条款
> **裁决**：待定

本文沿用根蓝图的 RFC 2119 关键词约定。条款编号是拟定编号，冻结前可以调整，但不得与已发布 ID 冲突：multi-tenant 红线当前到 T-28，本文新红线从 T-29 起编；新条款组暂定为 `BRX-TENANT-AUTHZ-0xx`。

---

## 0. 结论（建议）

1. **权限码只在代码里定义**：租户内可授予的权限码，只来自已装配插件在 Plugin Manifest 中声明的 `permissions` 目录（根 §5.1 已有该段）。数据库里不再维护第二份可编辑的租户权限目录。
2. **最小实现只用三个内置角色**：OWNER、ADMIN、MEMBER，即 multi-tenant 已冻结的 `sys_tenant_member.member_type`。租户自定义角色留到后续版本。
3. **默认授予写在声明权限的模块里**：每条权限在同一 Manifest 条目中声明"默认授予哪些内置角色、数据范围是什么"。Runtime 启动时把所有模块的声明汇总成一张不可变的授予表。
4. **权限在请求时计算，不写进 Token**：Actor Token 只带角色（`mtype`）和授权版本（`mver`），这两项 multi-tenant §8 已经规定。Dispatcher 用授予表把已验证的角色展开成权限，再按 Endpoint 声明的权限判定。
5. **数据范围最小两档**：`TENANT`（本租户全部对象）和 `SELF`（与当前成员关联的对象）。命中的范围随访问判定（AccessDecision）交给 Handler，由资源 Owner 在自己的 Repository 查询里施加，落实 T-22。
6. **OWNER 专属动作用专属权限码表达**：例如修改 `mfa_policy`、转移所有权，只授予 OWNER；不在业务代码里写 `if (role == OWNER)`。
7. **前端只用 BFF 返回的有效权限**：BFF 会话接口用同一张授予表计算有效权限，Route Guard 和按钮显隐只看它（frontend 1.2 已规定）。
8. **不新增 Capability，也不新增表**：角色就是成员表现有的 `member_type`，权限目录和授予都在制品里。`RbacResolver` 内部 SPI 不再需要。
9. **平台超管授权不在本文范围**：super-admin 4.0 §3.3 的平台权限目录与授予保持现状，见 §7 与 Q8。

---

## 1. 背景

### 1.1 业务目标

- 租户员工控制台（identity-auth M1 的"租户员工控制台外壳"）需要按权限区分功能：OWNER、ADMIN、MEMBER 看到和能做的事不同。
- 业务插件的 Endpoint 已经可以声明所需权限，但租户员工目前拿不到任何权限，凡是声明了权限的 Endpoint 都会拒绝他们（见 §1.4）。
- 医疗等行业要求员工只能看到与自己相关的业务数据，管理员才能看全租户数据（multi-tenant §9.6，红线 T-22）。

### 1.2 现行条款

| 条款 | 内容 |
|---|---|
| 根 §5.1 | Plugin Manifest 有 `permissions` 段（插件权限目录）；`endpoints.provides[].authorization` 引用目录中的权限 ID，并声明 `all`/`any` 判定和资源授权策略引用 |
| 根 `BRX-RS-MANIFEST-022` | Dispatcher 在调用 Handler 前完成 permission/resource authorization；拒绝 fail-closed |
| 根 `BRX-RS-SECURITY-001`、S-2 | 每个入口有显式访问策略；授权在资源 Owner/边界执行，权限来自版本化目录 |
| multi-tenant §3、§4.1 | Actor 角色为 `member_type ∈ {OWNER, ADMIN, MEMBER}`，基座层零行业语义 |
| multi-tenant §8、§8.2 | Actor Token 携带 `mtype`、`roles`、`mver`；状态、角色、权限绑定变更使 `authz_version` 自增，Token 中的快照不一致即 401 `STALE_AUTHZ_VERSION` |
| multi-tenant §9.6、T-22 | Actor 访问业务对象须同时校验操作权限和数据范围；Dispatcher 先执行 Manifest 声明的 permission/resource policy，Plugin Owner 再在自身 Repository 判定对象归属与数据范围；不得新增未登记的 `AuthorizationCapability` |
| multi-tenant `BRX-TENANT-AUTH-001` | 修改 `mfa_policy` 只能由 ACTIVE OWNER 执行 |
| super-admin `BRX-SA-AUTH-006` | 使用版本化目录和具体权限 ID；不存在通用 bypass；不得以角色名替代 Endpoint 授权 |
| frontend `BRX-FE-ROUTE-002`、`BRX-FE-AUTH-002` | Route Guard 只依据 AuthCapability 的已验证 scope/permissions；会话中的权限只来自 BFF 会话接口 |
| identity-auth §0.3 | 不定义权限码目录和 RBAC，由授权模型另行定义 |

### 1.3 现行条款的空白

现行蓝图规定了"Endpoint 按权限码授权"和"Actor 要校验权限 + 数据范围"，但没有规定：

1. 租户员工的权限从哪里来：角色与权限码的对应关系由谁定义、存在哪里；
2. 权限在 Token 签发时确定，还是在请求时计算；
3. 数据范围有哪几档、由谁决定、怎样交给 Handler；
4. OWNER 专属动作怎样表达；
5. 租户控制台自身（成员管理、安全设置、审计查看）的权限码目录。

### 1.4 现状证据（2026-10-23 盘点）

| 位置 | 现状 |
|---|---|
| platform-auth `internal/RbacResolver.java` | 只有接口，两个仓库都没有实现。注释写明 RBAC 数据"目前在 app-identity 插件里"；app-identity 对 `auth_*` 表的映射已于 2026-10-23 移除（brix-enterprise `d0d942c`） |
| platform-auth `AuthFlowCapabilityImpl` | 没有 `RbacResolver` 时，Actor Token 的 `roles` 取 `[member_type]`，`permissions` 为空列表 |
| platform-auth `JwtIssuerCapabilityImpl` | Actor Token 写入 `roles`、`permissions`、`mtype`、`mver` 等 claims |
| platform-auth `JwtValidator` | 每次校验比对 `mver`/`pver` 与成员/主体当前 `authz_version`（§8.2 已落地） |
| runtime-orchestrator `EndpointAccessPolicy`/`EndpointAccessGuard`（brix `f77b612`、`27ab273`） | 在 Handler 前按 `authorization.permissions` 判定；权限取自已验证 Token 的 `permissions` claim；声明 `acr`/`max_age` 的入口在启动时拒绝 |
| L2A `AuthenticatedPrincipal.getPermissions()` | 默认返回空集合 |
| L2A `AuthCapability` | 继承已标记弃用（since 3.2.0, forRemoval）的 `AuthContextCapability`，后者提供 `hasPermission()` 与 `getAuthorizedScopes()`；`DataScope` 有 department/organization/region/self/all 五种 |
| app-booking `plugin-manifest.yaml` | 声明权限 `app-booking:template:read`，其 Endpoint 要求该权限（`authenticated-user`）。租户员工的权限为空，因此一律被拒绝 |
| platform-tenant `plugin-manifest.yaml` | 只声明 `platform:tenant:create`、`platform:tenant:first-owner-invite`、`tenant:first-owner:accept`，没有租户控制台权限码 |
| app-tenant（enterprise）`plugin-manifest.yaml` | 声明旧的 `tenant:admin:*` 目录，配合旧路由 `/api/v1/tenants`（super-admin C-3 已指出其职责错位） |
| 共享库 `auth_role` | `TENANT_ADMIN`、`USER`（tenant_id=`default`，旧数据）与 `PLATFORM_SUPER_ADMIN`、`BOOTSTRAP`（PLATFORM） |
| 共享库 `auth_permission` | 20 条，全部 tenant_id=`PLATFORM`（super-admin §3.3 平台目录） |
| 共享库 `auth_user_role` | 外键指向旧表 `auth_user`，不是多租户模型中的 `sys_tenant_member` |
| `sys_tenant_member` | 已有 `member_type`、`status`、`authz_version`、`context_id`（共享库当前 1 名 ACTIVE OWNER） |
| 前端 | platform-admin-web 已按平台权限码使用 `hasPermission`；租户员工控制台尚未建立 |

### 1.5 外部依据

- NIST RBAC 模型（ANSI/INCITS 359）：权限分配给角色，角色分配给用户；本文的最小实现对应其中的 Core RBAC。
- OWASP Authorization Cheat Sheet：默认拒绝、最小权限、每个请求在服务端校验、不依赖客户端隐藏。
- OWASP ASVS V4（Access Control）：访问控制在可信的服务端执行，并对对象级访问（IDOR）做校验。
- 常见做法：权限码由提供 API 的一方在代码中定义；角色是数据或配置；Token 只放粗粒度的身份与角色，细粒度授权由资源服务端在请求时判定，避免 Token 随权限数量膨胀，也避免权限变更必须等 Token 过期。

---

## 2. 目标与非目标

**目标**

1. 让租户员工在每个请求上得到确定、可审计的有效权限，未授予即在 Handler 前拒绝；
2. 让资源 Owner 拿到明确的数据范围，落实 T-22；
3. 为 M1 的租户员工控制台提供权限码目录、默认授予和前端可用的有效权限；
4. 不新增 Capability、不新增表、不改变已冻结的成员、Token 和隔离语义。

**非目标**

1. 租户自定义角色、角色继承、权限组合编辑器（后续版本）；
2. 部门、组织、区域等数据范围（后续版本，依赖组织结构建模）；
3. ABAC/ReBAC、对象级共享和代理授权（multi-tenant §16 已列为 ⏳）；
4. 平台超管的授权模型（super-admin 4.0）；
5. C 端 Subject 的细粒度授权（本期仍以 audience + 本人数据为准，见 Q7）。

---

## 3. 方案比较

### 3.1 权限码目录放在哪里

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 插件 Manifest 的 `permissions` 段（建议）** | 已有机制；随制品版本化；与 Endpoint 声明双向校验 | 权限码是代码概念，和使用它的 Endpoint 一起发布；不会出现"目录里有、代码里没有"的漂移 |
| B. 数据库表（如复用 `auth_permission`） | 运行时可编辑 | 形成第二份目录；需要同步机制；租户可改目录违背"权限由 API 提供方定义" |

### 3.2 角色模型

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 只用 OWNER/ADMIN/MEMBER 三个内置角色（建议）** | 角色 = `member_type`，已在成员表与 Token 中 | 不新增表和管理界面；满足员工控制台的最小需求；与 multi-tenant 冻结语义一致 |
| B. 现在就支持租户自定义角色 | 新增租户角色表、角色-权限表、成员-角色表和管理界面 | 工作量大（需要新的 Data Owner 与管理入口）；可在 A 之上演进，不影响 A 的契约 |

### 3.3 授予关系放在哪里

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 声明权限的模块在 Manifest 中声明默认授予（建议）** | `permissions[].grants: [{role, scope}]` | 和权限定义放在一起，模块作者最清楚语义；随模块升级自动带上新权限的授予 |
| B. Host Composition 集中配置 | 部署时为每个角色列出全部权限 | 需要 Composition 了解所有插件内部权限；新增插件必须同步修改 Composition |
| C. 数据库配置 | 平台或租户在运行时配置 | 等同于自定义角色（3.2 B）的前提；最小实现不需要 |

后续需要按部署调整时，可以在 A 之上增加 Composition 级的收紧覆盖（只减不加），不改变 A 的契约。

### 3.4 权限在什么时候计算

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 请求时由 Dispatcher 用授予表展开（建议）** | Token 只带 `mtype`、`mver`；授予表在 Host 启动时构建、内存查询 | Token 小；模块升级后的新授予在 Host 重启后立即生效，无需重签 Token；角色或状态变更由 `mver` 校验及时失效（§8.2 已落地） |
| B. 签发时把权限写进 Token | Token 携带 `permissions` | 权限多时 Token 膨胀；授予变化要等 Token 过期或强制刷新；Dispatcher 需要信任签发方写入的权限列表 |

### 3.5 数据范围

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 两档：`TENANT`、`SELF`（建议）** | 授予时声明；Dispatcher 取命中的最宽范围交给 Handler | 覆盖"管理员看全部、员工看自己的"这一最常见需求；不依赖组织结构 |
| B. 现在就支持部门/组织/区域 | 沿用 `DataScope` 的五种类型 | 需要组织结构 Owner 和成员-部门关系，目前不存在 |

`SELF` 的含义由资源 Owner 定义（例如"创建人或经办人是当前成员"），并写在其 Manifest 的权限说明中；Runtime 只负责传递，不猜测业务关联。

---

## 4. 架构总览

```text
构建期                              启动期（H3/B2）                       请求期
───────────────────────────────    ───────────────────────────────    ──────────────────────────────────────
各插件 Manifest                     Runtime 汇总已选插件的声明            Dispatcher（根 MANIFEST-022 顺序）
  permissions:                      → 不可变授予表                         1. 认证：已验证 Actor Token
    - id: tenant:member:read          role → {permission → scope}            （tid、mid、mtype、mver 已校验）
      grants:                       校验：权限唯一、grants 合法、             2. 租户上下文
        - {role: OWNER, scope: TENANT}      Endpoint 引用的权限已登记         3. 授权：mtype → 有效权限
        - {role: ADMIN, scope: TENANT}      （失败即 fail-fast）                按 all/any 判定；拒绝 → 403 + 审计
        - {role: MEMBER, scope: SELF}                                          命中范围放入 AccessDecision
  endpoints.provides:                                                       4. Handler：资源 Owner 按范围查询
    - authorization:
        permissions: [tenant:member:read]                                 BFF 会话接口：用同一授予表返回
                                                                           有效权限 → 前端 Route Guard
```

角色变更（`member_type` 或 `status`）使 `authz_version` 自增，旧 Token 在下一次请求被拒绝，客户端刷新后得到新角色；模块升级带来的授予变化随 Host 重启生效。

---

## 5. 条款草案（拟加入 multi-tenant 新版本）

[BRX-TENANT-AUTHZ-001] 租户内可授予的权限码 MUST 只来自已装配插件的 Plugin Manifest `permissions` 目录（平台权限按 super-admin 另行管理，不在此列）。权限 ID 在 Host 内 MUST 唯一，重复声明 MUST 在 P0/O0 fail-fast；Endpoint `authorization.permissions` 引用未登记的权限 MUST 在 P3/B2 fail-fast。新增权限 ID SHOULD 以声明模块的命名空间开头。MUST NOT 在数据库中维护第二份可编辑的租户权限目录。

[BRX-TENANT-AUTHZ-002] 本版本租户 Actor 的角色只有 OWNER、ADMIN、MEMBER，取值即 `sys_tenant_member.member_type`；不提供租户自定义角色。Endpoint 授权 MUST 以权限码声明，MUST NOT 以角色名替代（与 super-admin `BRX-SA-AUTH-006` 一致）。

[BRX-TENANT-AUTHZ-003] 声明权限的模块 MUST 在同一目录条目中声明该权限的默认授予 `grants: [{role, scope}]`。未声明 `grants` 的权限不授予任何租户角色（默认拒绝）。模块 MUST 只能为自己声明的权限声明授予。

[BRX-TENANT-AUTHZ-004] Runtime MUST 在 H3/B2 期间由已选模块的声明汇总出不可变授予表，与 Host 入口准入快照属于同一代次；相同输入 MUST 得到相同结果（根 `BRX-RS-BOOT-008`）。`grants` 引用未知角色、未知范围或重复授予 MUST fail-fast。

[BRX-TENANT-AUTHZ-005] Dispatcher 的授权步骤对 Actor Token MUST 用已验证的 `mtype` 查授予表得到有效权限与范围，再按 Endpoint `authorization` 的 `all`/`any` 判定；Actor Token MUST NOT 携带可被下游信任的权限列表。拒绝 MUST 在 Handler 前以稳定错误码返回并写安全审计。

[BRX-TENANT-AUTHZ-006] 数据范围本版本只定义 `TENANT`（当前租户的全部对象）与 `SELF`（与当前成员关联的对象，关联口径由资源 Owner 在权限说明中定义）。Dispatcher MUST 把命中的最宽范围随 AccessDecision 交给 Handler；资源 Owner MUST 在自身 Repository 查询中施加该范围，MUST NOT 把 `SELF` 当作 `TENANT` 处理。

[BRX-TENANT-AUTHZ-007] 仅 OWNER 可执行的动作（修改 `mfa_policy`、转移所有权、任命 OWNER）MUST 以只授予 OWNER 的权限码表达。"ADMIN 不得管理 OWNER"等对象关系约束 MUST 由资源 Owner 的 resource policy 判定，MUST NOT 只靠前端隐藏。

[BRX-TENANT-AUTHZ-008] `member_type` 或 `status` 变更 MUST 使 `authz_version` 自增（§8.2）。授予表随 Host 制品变化；模块升级后的授予在 Host 重启后生效，不要求重签 Token。

[BRX-TENANT-AUTHZ-009] BFF 会话接口 MUST 返回由同一授予表计算的有效权限集合；前端 Route Guard 与操作入口显隐只依据它（frontend `BRX-FE-ROUTE-002`、`BRX-FE-AUTH-002`）。前端隐藏 MUST NOT 被当作授权。

[BRX-TENANT-AUTHZ-010] 成员角色变更与被拒绝的授权判定 MUST 写租户审计（T-25），MUST NOT 记录 Token 原文或其他凭证材料。

**拟新增红线**

| ID | 唯一含义 | 最低证明门禁 | 失败处置 |
|---|---|---|---|
| T-29 | 租户权限码只来自已装配模块的声明目录；Endpoint 只按权限码授权、不按角色名；未授予即拒绝 | Manifest/授予表校验 + Dispatcher 负例测试 | 启动阻断 / 403 |
| T-30 | Actor 的有效权限只由 Runtime 授予表根据已验证角色计算；Token 中的权限列表不得作为授权依据 | 签发与校验负例测试 | 签发拒绝 / 校验拒绝 |

---

## 6. 被否决或暂缓的方案

| 议题 | 建议方案 | 被否决或暂缓的方案 | 理由 |
|---|---|---|---|
| 权限目录 | 插件 Manifest 声明 | 数据库可编辑目录 | 第二份目录会与代码漂移 |
| 角色 | 三个内置角色 | 本期自定义角色（暂缓） | 需要新 Data Owner 与管理入口；可在本方案上演进 |
| 授予位置 | 模块 Manifest 默认授予 | Composition 集中配置 | Composition 不应了解插件内部权限 |
| 计算时机 | 请求时展开 | 权限写进 Token | Token 膨胀；授予变化生效慢 |
| 数据范围 | `TENANT`/`SELF` | 部门/组织/区域（暂缓） | 组织结构尚无 Owner |
| 实现形态 | Runtime 授予表 + Dispatcher | 新增 `AuthorizationCapability` | multi-tenant §9.6 明确禁止；根 Catalog 未登记 |
| 旧数据 | 不用于租户 RBAC | 复用 `auth_role` 的 `TENANT_ADMIN`/`USER` 与 `auth_user_role` | 它们挂在旧 `auth_user` 上，不是多租户成员模型 |

---

## 7. 与其他蓝图的关系

| 蓝图 | 关系 |
|---|---|
| runtime-shell 3.2.0（根） | 不修订条款。Manifest `permissions` 条目增加可选 `grants` 属于 Manifest Schema 的 Minor 扩展；AccessDecision 增加数据范围属于 L2A 契约的 Minor 扩展（根 `BRX-RS-CAP-019`/`020`，须有兼容性测试）。若评审认为后者改变了根冻结的 Invocation ABI，需先走根级 RFC（见 Q5） |
| multi-tenant 5.0 | 本文的条款与红线落在其新版本；不改变成员、Token、`authz_version` 与隔离语义 |
| identity-auth 1.0 | 本文完成 §13「前置」中的"租户最小 RBAC"；新签发方（身份提供方 Adapter）的 Actor Token 只带 `mtype`、`mver`，不带权限列表 |
| super-admin 4.0 | 不改变平台授权。平台权限 ID 目前分散在 platform-admin descriptor 的 Endpoint 声明、platform-auth 的 `PlatformPermissions` 常量与 `auth_permission` 种子三处；是否统一到本文模型见 Q8 |
| frontend 1.2 | 已规定 Guard 只看 AuthCapability 的权限、权限只来自 BFF；本文补充"有效权限由授予表计算" |

---

## 8. 对现有实现的影响（只登记差距，本 RFC 不改代码）

| # | 差距 | 位置 | 处理方向 |
|---|---|---|---|
| 1 | 权限条目没有 `grants` | brix runtime-manifest 模型、校验器与 Manifest Schema | 增加可选字段与校验；Endpoint 引用未登记权限 fail-fast |
| 2 | 没有授予表 | brix runtime-orchestrator | 启动时汇总、不可变、进入入口快照代次 |
| 3 | Dispatcher 只信任 Token 中的 `permissions` | `EndpointAccessPolicy`/`EndpointAccessGuard` | Actor Token 改为按 `mtype` 展开；平台 Token 维持现状 |
| 4 | AccessDecision 不含数据范围 | brix runtime-sdk-api（L2A） | Minor 扩展并补兼容性测试 |
| 5 | `AuthCapability` 继承已弃用的 `AuthContextCapability`，`DataScope` 有五种类型 | brix runtime-sdk-api | 明确 `hasPermission()` 读取当前调用的判定；本版本只支持 `TENANT`/`SELF`，其余类型标注不支持 |
| 6 | Actor Token 带空的 `permissions`；`RbacResolver` 无实现 | platform-auth `AuthFlowCapabilityImpl`、`JwtIssuerCapabilityImpl`、`RbacResolver` | 删除 `permissions` claim 与 `RbacResolver`；M1 的新签发方遵循同一 claims 契约 |
| 7 | 没有租户控制台权限码与成员管理入口 | brix platform-tenant | 按附录 A 声明目录与授予；入口随 M1 租户员工控制台实现 |
| 8 | 业务插件的权限没有授予 | enterprise app-booking 等 | 补 `grants` |
| 9 | 旧 `auth_role`（`TENANT_ADMIN`/`USER`）与 `auth_user_role` | platform-auth 数据 | 不用于租户 RBAC；清理随 super-admin 的 `sys_identity_role_assignment` 迁移 |
| 10 | app-tenant 的旧 `tenant:admin:*` 目录与 `/api/v1/tenants` 路由 | enterprise app-tenant | 不在本文范围；按 super-admin C-3 另行处理 |

---

## 9. 落地顺序建议（非规范）

1. 负责人裁决 §11；
2. 写出 multi-tenant 新版本（Freeze Candidate），架构、安全、SRE 批准后登记 lock；
3. 施工（identity-auth §13「前置」最后一项，一个垂直切片）：Manifest `grants` 与校验 → 授予表与 Dispatcher 展开 → AccessDecision 数据范围 → Token claims 清理 → platform-tenant 目录与业务插件授予 → 负例与端到端测试；
4. 前置验收：全量测试通过；未授予的权限在 Handler 前被拒绝；`SELF` 范围不越权；角色变更后旧 Token 返回 `STALE_AUTHZ_VERSION`；
5. 之后进入 M1，租户员工控制台使用 BFF 返回的有效权限。

---

## 10. 治理与版本

| 文档 | 新版本 | 类型 | 理由 |
|---|---|---|---|
| multi-tenant | 5.1 | Minor，`compatibilityEpoch` 不变 | 新增授权条款与 T-29、T-30；不改变已冻结的成员、Token 与隔离语义 |
| runtime-shell | 不变 | — | 不新增 Capability；Manifest Schema 与 L2A 的变化均为向后兼容扩展（见 §7、Q5） |
| identity-auth | 不变 | — | 只登记前置项完成情况 |
| super-admin、frontend | 不变 | — | 不涉及 |

**流程**：

1. 评审本 Draft，并对 §11 作出裁决；
2. 写出 multi-tenant 新版本文件（Freeze Candidate）；
3. 架构、安全、SRE 批准；
4. 在 lock 中登记哈希、commit 与批准记录，旧版本转为 SUPERSEDED；
5. 按 §9 施工。

---

## 11. 待决问题

| # | 问题 | 建议 |
|---|---|---|
| Q1 | 角色模型：只用三个内置角色，还是本期就做租户自定义角色 | 只用内置角色（§3.2 A） |
| Q2 | 默认授予写在哪里：模块 Manifest、Host Composition，还是数据库 | 模块 Manifest（§3.3 A） |
| Q3 | 权限计算时机：请求时展开，还是写进 Token | 请求时展开（§3.4 A） |
| Q4 | 数据范围：只做 `TENANT`/`SELF`，还是本期引入部门/组织 | 只做两档（§3.5 A） |
| Q5 | 数据范围怎样交给 Handler：扩展 AccessDecision（L2A Minor），还是沿用已弃用的 `AuthCapability.getAuthorizedScopes()`；若前者被认定为根 ABI 变更，是否接受先走根级 Patch/Minor RFC | 扩展 AccessDecision |
| Q6 | 附录 A 的租户控制台权限码与默认授予是否采纳；其中 MEMBER 能否查看成员列表、ADMIN 能否重置成员 MFA | 按附录 A：MEMBER 只能看自己；ADMIN 可在再验证后重置非 OWNER 成员的 MFA |
| Q7 | C 端 Subject 是否纳入同一授予机制（CUSTOMER/GUEST 作为角色） | 本期不纳入，仍以 audience 与本人数据为准；需要时用同一机制扩展 |
| Q8 | 平台超管授权是否后续也统一到本文模型，以消除平台权限 ID 分散在 descriptor、`PlatformPermissions` 常量与 `auth_permission` 种子三处的问题 | 本文不改；在 super-admin 下一版评估 |
| Q9 | 条款落在 multi-tenant 5.1，还是新建 `authorization` 专项 1.0；是否借此版本一并完成 multi-tenant 的 §7 重基线复核 | 落在 multi-tenant 5.1；§7 复核单独进行，避免本版本范围过大 |
| Q10 | 旧 `auth_role` 的 `TENANT_ADMIN`/`USER` 与 `auth_user_role` 的去留 | 不用于租户 RBAC；随 super-admin 的 `sys_identity_role_assignment` 迁移清理 |

---

## 附录 A：platform-tenant 租户控制台权限码与默认授予（建议）

表中填写的是授予的数据范围，`—` 表示不授予。

| 权限码 | 用途 | OWNER | ADMIN | MEMBER |
|---|---|---|---|---|
| `tenant:profile:read` | 查看本租户基本信息 | TENANT | TENANT | TENANT |
| `tenant:member:read` | 查看成员 | TENANT | TENANT | SELF |
| `tenant:member:invite` | 邀请、重发、撤销成员邀请 | TENANT | TENANT | — |
| `tenant:member:update-role` | 在 ADMIN 与 MEMBER 之间调整 | TENANT | TENANT | — |
| `tenant:member:disable` | 停用、恢复成员 | TENANT | TENANT | — |
| `tenant:member:reset-mfa` | 重置成员的 MFA 因子（须再验证，`BRX-TENANT-AUTH-002`） | TENANT | TENANT | — |
| `tenant:owner:transfer` | 任命 OWNER、转移所有权（受 T-18 约束） | TENANT | — | — |
| `tenant:security:update` | 修改 `mfa_policy` 等安全设置（`BRX-TENANT-AUTH-001`） | TENANT | — | — |
| `tenant:audit:read` | 查看租户审计 | TENANT | TENANT | — |

对象关系约束由 platform-tenant 的 resource policy 判定：ADMIN 不能调整、停用或重置 OWNER；任何人不能降级或停用最后一个 ACTIVE OWNER（T-18）；OWNER 本人的 MFA 重置走平台受理流程（identity-auth `BRX-IA-RECOVERY-002`）。

---

## 附录 B：工作量估算（人日）

估算口径与 RFC-002 附录 C 相同：一名熟悉代码的全职开发者，用 Claude Code 辅助；含测试，不含等待评审的时间。

| 工作包 | 估算 |
|---|---|
| Manifest `grants` 字段、Schema 与校验 | 1–1.5 |
| 授予表、Dispatcher 展开、AccessDecision 数据范围与兼容性测试 | 1.5–2 |
| Actor Token claims 清理、删除 `RbacResolver` | 0.5 |
| platform-tenant 目录与授予、业务插件补授予 | 1 |
| 负例与端到端测试 | 1–1.5 |
| 写出 multi-tenant 新版本并冻结 | 1 |
| **合计** | **6–7.5** |

与 RFC-002 附录 C.5 对"租户最小 RBAC"的估算（5–8 人日）一致。成员管理入口和控制台页面计入 M1。

---

## 附录 C：外部资料

- NIST Role Based Access Control：<https://csrc.nist.gov/projects/role-based-access-control>
- OWASP Authorization Cheat Sheet：<https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- OWASP Application Security Verification Standard（V4 Access Control）：<https://owasp.org/www-project-application-security-verification-standard/>
