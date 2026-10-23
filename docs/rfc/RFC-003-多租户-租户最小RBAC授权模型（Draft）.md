# RFC-003：租户最小 RBAC 授权模型（Draft）

> **文档类型**：RFC（多租户专项授权条款修订提案）
> **状态**：已裁决（2026-10-23）。条款已并入 multi-tenant 5.1 Freeze Candidate，批准并登记 lock 后生效；本文是决策背景，**不指导施工**
> **起草日期**：2026-10-23
> **修订**：2026-10-23 第 2 稿：C 端 Subject（CUSTOMER、GUEST）纳入同一授予机制，范围只允许 `SELF`（§3.6、Q7）；Q1 补充同一角色内不能按岗位区分的已知限制。2026-10-23 第 3 稿：记录裁决；按 multi-tenant §8.1 第 3 条与 T-11 改为员工接口与 C 端接口分开声明、一个权限只授予一类角色（§3.6、`BRX-TENANT-AUTHZ-003`/`004`/`011`/`012`）；更正访问判定的现状（§8 第 4 条）；写明与 super-admin 角色分配表的边界（`BRX-TENANT-AUTHZ-002`）；补充兼容性、迁移与回滚（§12）
> **依据基线**：runtime-shell 3.2.0（ACTIVE 根蓝图）；identity-auth 1.0、frontend 1.2（ACTIVE）；multi-tenant 5.0、super-admin 4.0（ACTIVE，均为 `rebaseRequired=true`，本文不能作为它们 Implementation Accepted 的依据）
> **来源**：identity-auth 1.0 §13「前置」阶段中的"租户最小 RBAC（另起 RFC）"；RFC-002 §8 差距 11、附录 C.4
> **拟修订**：multi-tenant §4.1、§8、§9.6、§11.2、§11.3、§12、§16（目标版本见 §10）；不修订根蓝图条款
> **裁决**：2026-10-23 负责人裁决，Q1～Q10 全部采纳 §11 的建议；Q5 的附带问题同意（若评审认定涉及根级契约，先走根级 RFC）

本文沿用根蓝图的 RFC 2119 关键词约定。条款编号是拟定编号，冻结前可以调整，但不得与已发布 ID 冲突：multi-tenant 红线当前到 T-28，本文新红线从 T-29 起编；新条款组暂定为 `BRX-TENANT-AUTHZ-0xx`。

---

## 0. 结论（建议）

1. **权限码只在代码里定义**：租户内可授予的权限码，只来自已装配插件在 Plugin Manifest 中声明的 `permissions` 目录（根 §5.1 已有该段）。数据库里不再维护第二份可编辑的租户权限目录。
2. **最小实现只用内置角色**：员工（Actor）用 OWNER、ADMIN、MEMBER，即 `sys_tenant_member.member_type`；C 端用户（Subject）用 CUSTOMER、GUEST，即 `sys_tenant_principal.principal_type`。两组都是 multi-tenant 已冻结的取值。租户自定义角色留到后续版本。
3. **默认授予写在声明权限的模块里**：每条权限在同一 Manifest 条目中声明"默认授予哪些内置角色、数据范围是什么"。Runtime 启动时把所有模块的声明汇总成一张不可变的授予表。
4. **权限在请求时计算，不写进 Token**：Actor Token 只带角色（`mtype`）和授权版本（`mver`），Subject Token 只带 `ptype` 和 `pver`，这些 multi-tenant §8 已经规定。Dispatcher 用授予表把已验证的角色展开成权限，再按 Endpoint 声明的权限判定。
5. **数据范围最小两档**：`TENANT`（本租户全部对象）和 `SELF`（与当前调用者关联的对象：员工按 `mid`，C 端用户按 `pid`）。命中的范围随访问判定（AccessDecision）交给 Handler，由资源 Owner 在自己的 Repository 查询里施加，落实 T-22。
6. **C 端用户纳入同一机制，但只能拿到 `SELF`**：CUSTOMER、GUEST 与员工角色用同一种 `grants` 声明；Subject 角色只能授予 `SELF`，授予表里出现 Subject 的 `TENANT` 即启动失败。员工接口与 C 端接口分开：租户 Endpoint 只接受 Actor Token 或只接受 Subject Token，一个权限只授予一类角色（落实 multi-tenant §8.1 第 3 条与 T-11）。资源 Owner 认定为对 C 端公开的数据（服务目录、可预约时段等）由不声明权限码的 C 端接口提供。
7. **OWNER 专属动作用专属权限码表达**：例如修改 `mfa_policy`、转移所有权，只授予 OWNER；不在业务代码里写 `if (role == OWNER)`。
8. **前端只用 BFF 返回的有效权限**：BFF 会话接口用同一张授予表、按当前上下文计算有效权限，员工控制台和品牌应用的 Route Guard、按钮显隐只看它（frontend 1.2 已规定）。
9. **不新增 Capability，也不新增表**：角色就是成员表现有的 `member_type` 和主体表现有的 `principal_type`，权限目录和授予都在制品里。`RbacResolver` 内部 SPI 不再需要。
10. **平台超管授权不在本文范围**：super-admin 4.0 §3.3 的平台权限目录与授予保持现状，见 §7 与 Q8。

---

## 1. 背景

### 1.1 业务目标

- 租户员工控制台（identity-auth M1 的"租户员工控制台外壳"）需要按权限区分功能：OWNER、ADMIN、MEMBER 看到和能做的事不同。
- 业务插件的 Endpoint 已经可以声明所需权限，但租户员工和 C 端用户目前都拿不到任何权限，凡是声明了权限的 Endpoint 都会拒绝他们（见 §1.4）。
- 医疗等行业要求员工只能看到与自己相关的业务数据，管理员才能看全租户数据（multi-tenant §9.6，红线 T-22）。
- 品牌应用（C 端，identity-auth M3）里，客户和访客能用的功能不同（例如访客只能浏览、客户才能预约），而且都只能操作自己的数据。同一个人可以在同一租户既是员工又是客户（multi-tenant §3），两个身份的权限互不影响。

### 1.2 现行条款

| 条款 | 内容 |
|---|---|
| 根 §5.1 | Plugin Manifest 有 `permissions` 段（插件权限目录）；`endpoints.provides[].authorization` 引用目录中的权限 ID，并声明 `all`/`any` 判定和资源授权策略引用 |
| 根 `BRX-RS-MANIFEST-022` | Dispatcher 在调用 Handler 前完成 permission/resource authorization；拒绝 fail-closed |
| 根 `BRX-RS-SECURITY-001`、S-2 | 每个入口有显式访问策略；授权在资源 Owner/边界执行，权限来自版本化目录 |
| multi-tenant §3、§4.1 | Actor 角色为 `member_type ∈ {OWNER, ADMIN, MEMBER}`，Subject 角色为 `principal_type ∈ {CUSTOMER, GUEST}`，基座层零行业语义；同一 identity 可在同一租户同时持有 Member 与 Principal 记录 |
| multi-tenant §8、§8.2 | Actor Token 携带 `mtype`、`roles`、`mver`；Subject Token 携带 `ptype`、`pver`，没有 `roles` 和 `permissions`；状态、角色、权限绑定变更使对应行的 `authz_version` 自增，Token 中的快照不一致即 401 `STALE_AUTHZ_VERSION` |
| multi-tenant §8.1 第 3 条、T-11 | 管理 API 强制要求 `aud=brix-actor`，C 端 API 强制 `aud=brix-subject`；B/C 权限靠 audience/scope 区分，不靠 URL 路径 |
| multi-tenant §9.6、T-22 | Subject 默认只能访问与自己 `principal_id` 关联的对象，访问他人对象须有显式授权关系（如家庭共享、代理）；Actor 访问业务对象须同时校验操作权限和数据范围；Dispatcher 先执行 Manifest 声明的 permission/resource policy，Plugin Owner 再在自身 Repository 判定对象归属与数据范围；不得新增未登记的 `AuthorizationCapability` |
| multi-tenant `BRX-TENANT-AUTH-001` | 修改 `mfa_policy` 只能由 ACTIVE OWNER 执行 |
| super-admin `BRX-SA-AUTH-006` | 使用版本化目录和具体权限 ID；不存在通用 bypass；不得以角色名替代 Endpoint 授权 |
| frontend `BRX-FE-ROUTE-002`、`BRX-FE-AUTH-002` | Route Guard 只依据 AuthCapability 的已验证 scope/permissions；会话中的权限只来自 BFF 会话接口 |
| identity-auth §0.3 | 不定义权限码目录和 RBAC，由授权模型另行定义 |
| identity-auth `BRX-IA-CLIENT-001`、`BRX-IA-CLIENT-003` | 品牌应用是独立注册的客户端，上下文为 subject，audience 为 `brix-subject`；终端用户所属租户由客户端注册锁定 |

### 1.3 现行条款的空白

现行蓝图规定了"Endpoint 按权限码授权"和"Actor 要校验权限 + 数据范围"，但没有规定：

1. 租户员工和 C 端用户的权限从哪里来：角色与权限码的对应关系由谁定义、存在哪里；
2. 权限在 Token 签发时确定，还是在请求时计算；
3. 数据范围有哪几档、由谁决定、怎样交给 Handler；
4. OWNER 专属动作怎样表达；
5. 租户控制台自身（成员管理、安全设置、审计查看）的权限码目录；
6. C 端怎样区分客户与访客，以及不属于任何个人的租户公开数据怎样开放给 C 端。

### 1.4 现状证据（2026-10-23 盘点）

| 位置 | 现状 |
|---|---|
| platform-auth `internal/RbacResolver.java` | 只有接口，两个仓库都没有实现。注释写明 RBAC 数据"目前在 app-identity 插件里"；app-identity 对 `auth_*` 表的映射已于 2026-10-23 移除（brix-enterprise `d0d942c`） |
| platform-auth `AuthFlowCapabilityImpl` | 没有 `RbacResolver` 时，Actor Token 的 `roles` 取 `[member_type]`，`permissions` 为空列表。Subject 登录只有内部方法 `loginSubject`；platform-auth Manifest 只声明了 `/api/auth/login/actor`，C 端登录入口属于 identity-auth M3 |
| platform-auth `JwtIssuerCapabilityImpl` | Actor Token 写入 `roles`、`permissions`、`mtype`、`mver` 等 claims；Subject Token 写入 `ptype`、`pver`，另写了空的 `roles` 和 `permissions`（multi-tenant §8 的 Subject Token 没有这两项） |
| platform-auth `JwtValidator` | 每次校验比对 `mver`/`pver` 与成员/主体当前 `authz_version`（§8.2 已落地） |
| runtime-orchestrator `EndpointAccessPolicy`/`EndpointAccessGuard`（brix `f77b612`、`27ab273`） | 在 Handler 前按 `authorization.permissions` 判定；权限取自已验证 Token 的 `permissions` claim；`authenticated-user` 同时接受 Actor 与 Subject Token，还没有只接受其中一类的认证策略（multi-tenant §8.1 第 3 条尚未落地）；Subject 的权限为空，因此声明了权限的 Endpoint 一律拒绝 Subject；声明 `acr`/`max_age` 的入口在启动时拒绝 |
| L2A `AuthenticatedPrincipal.getPermissions()` | 默认返回空集合 |
| L2A `AuthCapability` | 继承已标记弃用（since 3.2.0, forRemoval）的 `AuthContextCapability`，后者提供 `hasPermission()` 与 `getAuthorizedScopes()`；`DataScope` 有 department/organization/region/self/all 五种 |
| app-booking `plugin-manifest.yaml` | 声明权限 `app-booking:template:read`，其 Endpoint 要求该权限（`authenticated-user`）。租户员工和 C 端用户的权限都为空，因此一律被拒绝 |
| platform-tenant `plugin-manifest.yaml` | 只声明 `platform:tenant:create`、`platform:tenant:first-owner-invite`、`tenant:first-owner:accept`，没有租户控制台权限码 |
| app-tenant（enterprise）`plugin-manifest.yaml` | 声明旧的 `tenant:admin:*` 目录，配合旧路由 `/api/v1/tenants`（super-admin C-3 已指出其职责错位） |
| 共享库 `auth_role` | `TENANT_ADMIN`、`USER`（tenant_id=`default`，旧数据）与 `PLATFORM_SUPER_ADMIN`、`BOOTSTRAP`（PLATFORM） |
| 共享库 `auth_permission` | 20 条，全部 tenant_id=`PLATFORM`（super-admin §3.3 平台目录） |
| 共享库 `auth_user_role` | 外键指向旧表 `auth_user`，不是多租户模型中的 `sys_tenant_member` |
| `sys_tenant_member` | 已有 `member_type`、`status`、`authz_version`、`context_id`（共享库当前 1 名 ACTIVE OWNER） |
| `sys_tenant_principal` | 已有 `principal_type`、`status`、`authz_version`、`context_id`，并有 `UNIQUE (tenant_id, identity_id)`（共享库当前 0 行） |
| 前端 | platform-admin-web 已按平台权限码使用 `hasPermission`；租户员工控制台尚未建立 |

### 1.5 外部依据

- NIST RBAC 模型（ANSI/INCITS 359）：权限分配给角色，角色分配给用户；本文的最小实现对应其中的 Core RBAC。
- OWASP Authorization Cheat Sheet：默认拒绝、最小权限、每个请求在服务端校验、不依赖客户端隐藏。
- OWASP ASVS V4（Access Control）：访问控制在可信的服务端执行，并对对象级访问（IDOR）做校验。
- 常见做法：权限码由提供 API 的一方在代码中定义；角色是数据或配置；Token 只放粗粒度的身份与角色，细粒度授权由资源服务端在请求时判定，避免 Token 随权限数量膨胀，也避免权限变更必须等 Token 过期。

---

## 2. 目标与非目标

**目标**

1. 让租户员工和 C 端用户在每个请求上得到确定、可审计的有效权限，未授予即在 Handler 前拒绝；
2. 让资源 Owner 拿到明确的数据范围，落实 T-22；
3. 为 M1 的租户员工控制台提供权限码目录、默认授予和前端可用的有效权限，M3 的品牌应用沿用同一机制；
4. 不新增 Capability、不新增表、不改变已冻结的成员、主体、Token 和隔离语义。

**非目标**

1. 租户自定义角色、角色继承、权限组合编辑器（后续版本）；
2. 部门、组织、区域等数据范围（后续版本，依赖组织结构建模）；
3. ABAC/ReBAC、对象级共享和代理授权（multi-tenant §16 已列为 ⏳）；
4. 平台超管的授权模型（super-admin 4.0）；
5. Subject 访问本人以外的对象（家庭共享、代理，归入第 3 条）；只对 CUSTOMER 开放、又不属于任何个人的租户数据（需要新的授予类型，后续版本）。

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
| **A. 只用内置角色（建议）**：Actor 为 OWNER/ADMIN/MEMBER，Subject 为 CUSTOMER/GUEST | 角色 = `member_type` / `principal_type`，已在成员表、主体表与 Token 中 | 不新增表和管理界面；满足员工控制台和品牌应用的最小需求；与 multi-tenant 冻结语义一致。限制：同一角色内不能按岗位区分（见 Q1） |
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
| **A. 请求时由 Dispatcher 用授予表展开（建议）** | Token 只带角色和授权版本（Actor 为 `mtype`、`mver`，Subject 为 `ptype`、`pver`）；授予表在 Host 启动时构建、内存查询 | Token 小；模块升级后的新授予在 Host 重启后立即生效，无需重签 Token；角色或状态变更由 `mver`/`pver` 校验及时失效（§8.2 已落地） |
| B. 签发时把权限写进 Token | Token 携带 `permissions` | 权限多时 Token 膨胀；授予变化要等 Token 过期或强制刷新；Dispatcher 需要信任签发方写入的权限列表 |

### 3.5 数据范围

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 两档：`TENANT`、`SELF`（建议）** | 授予时声明；Dispatcher 取命中的最宽范围交给 Handler | 覆盖"管理员看全部、员工和客户只看自己的"这一最常见需求；不依赖组织结构 |
| B. 现在就支持部门/组织/区域 | 沿用 `DataScope` 的五种类型 | 需要组织结构 Owner 和成员-部门关系，目前不存在 |

`SELF` 的含义由资源 Owner 定义（例如员工的"创建人或经办人是当前成员"、C 端用户的"下单人是当前主体"），并写在其 Manifest 的权限说明中；Runtime 只负责传递，不猜测业务关联。

### 3.6 C 端 Subject 是否纳入同一机制

| 方案 | 说明 | 评价 |
|---|---|---|
| **A. 纳入同一授予表，Subject 只能授予 `SELF`（建议）** | CUSTOMER、GUEST 与员工角色写在同一 `grants` 里；Dispatcher 对 Subject Token 用 `ptype` 展开；没有授予 GUEST 的权限，访客一律拿不到 | 一套机制覆盖员工和 C 端用户；客户与访客的功能差异有地方声明、可审计；"给 C 端授予全租户数据"这类错误声明在启动时就被拦下 |
| B. 不纳入，只靠 audience 与本人数据（第 1 稿建议） | Subject 不经权限判定，由 Handler 按 `pid` 过滤 | 声明了权限的 Endpoint 会拒绝全部 Subject，C 端 Endpoint 只能不声明权限；客户与访客无法区分；"谁能调用"散落在各 Handler 里 |

Subject 只能授予 `SELF`，是 T-22"Subject 默认仅访问自身 `principal_id` 关联对象"在授予表上的落实。

员工接口与 C 端接口分开（multi-tenant §8.1 第 3 条：管理 API 强制 `aud=brix-actor`，C 端 API 强制 `aud=brix-subject`；T-11）。租户 Endpoint 的认证策略二选一：`tenant-actor` 只接受 Actor Token，`tenant-subject` 只接受 Subject Token。一个权限只授予一类角色：同一业务概念对员工和客户分别声明权限与接口，例如员工用 `example:order:read`（管理接口），客户用 `example:my-order:read`（C 端接口）。这样 B/C 边界在授予表上也能在启动时检查，一条错误授予不会把管理功能暴露给 C 端。

资源 Owner 认定为对 C 端公开的数据（服务目录、门店信息、可预约时段等）不需要授予：由 C 端接口提供，认证策略为 `tenant-subject`（或经 allowlist 审批的匿名访问），只声明资源策略、不声明权限码。这类接口不得返回个人数据或个人的业务对象（病例、订单、文件等）。员工访问同一数据走声明权限码的管理接口；修改公开数据的接口仍按权限码授权。

同一个 identity 在同一租户既是员工又是客户时（multi-tenant §3），两个身份各用一张 Token（T-5），各自按 `mtype` 或 `ptype` 计算有效权限，互不合并。员工能否用员工身份访问自己作为客户的对象（例如医护人员查看自己的病历），属于业务规则，由资源 Owner 判定并写审计，不在授予表中表达。

---

## 4. 架构总览

```text
构建期：各插件 Manifest 声明权限和默认授予（权限 ID 为示例）
  permissions:
    - id: example:order:read            # 管理接口用，只授予 Actor 角色
      grants:
        - {role: OWNER,  scope: TENANT}
        - {role: ADMIN,  scope: TENANT}
        - {role: MEMBER, scope: SELF}
    - id: example:my-order:read         # C 端接口用，只授予 Subject 角色，只能 SELF
      grants:
        - {role: CUSTOMER, scope: SELF} # 未列出的 GUEST 拿不到
  endpoints.provides:
    - authentication: {policyRef: tenant-actor}     # 只接受 Actor Token
      authorization: {permissions: [example:order:read]}
    - authentication: {policyRef: tenant-subject}   # 只接受 Subject Token
      authorization: {permissions: [example:my-order:read]}

启动期（H3/B2）：Runtime 汇总已选插件的声明 → 不可变授予表 role → {permission → scope}
  校验：权限唯一；grants 只引用已知角色和范围；一个权限只授予一类角色；
        Subject 角色只用 SELF；授予的角色类别与引用它的 Endpoint 认证策略一致；
        Endpoint 引用的权限已登记；租户 Endpoint 认证策略二选一（失败即 fail-fast）

请求期：Dispatcher（根 MANIFEST-022 顺序）
  1. 认证：按 Endpoint 认证策略只接受 Actor Token（tid、mid、mtype、mver）
          或只接受 Subject Token（tid、pid、ptype、pver）
  2. 租户上下文
  3. 授权：mtype 或 ptype → 有效权限；按 all/any 判定；拒绝 → 403 + 审计；命中范围放入访问判定
  4. Handler：资源 Owner 按范围查询（Actor 的 SELF 按 mid 关联，Subject 的 SELF 按 pid 关联）

BFF 会话接口：用同一授予表、按当前上下文返回有效权限 → 员工控制台 / 品牌应用的 Route Guard
```

角色或状态变更（`member_type`、`principal_type` 或 `status`）使对应行的 `authz_version` 自增，旧 Token 在下一次请求被拒绝（`mver`/`pver` 校验），客户端刷新后得到新角色；模块升级带来的授予变化随 Host 重启生效。

---

## 5. 条款草案（拟加入 multi-tenant 新版本）

[BRX-TENANT-AUTHZ-001] 租户内可授予的权限码 MUST 只来自已装配插件的 Plugin Manifest `permissions` 目录（平台权限按 super-admin 另行管理，不在此列）。权限 ID 在 Host 内 MUST 唯一，重复声明 MUST 在 P0/O0 fail-fast；Endpoint `authorization.permissions` 引用未登记的权限 MUST 在 P3/B2 fail-fast。新增权限 ID SHOULD 以声明模块的命名空间开头。MUST NOT 在数据库中维护第二份可编辑的租户权限目录。

[BRX-TENANT-AUTHZ-002] 本版本租户角色只有内置角色：Actor 角色为 OWNER、ADMIN、MEMBER，取值即 `sys_tenant_member.member_type`；Subject 角色为 CUSTOMER、GUEST，取值即 `sys_tenant_principal.principal_type`。不提供租户自定义角色；租户范围的角色分配（包括 super-admin 4.0 §3.1 规划的 `sys_identity_role_assignment` 租户范围）在本专项定义自定义角色之前 MUST NOT 参与租户授权。Actor Token 的 `roles` claim 不是授权依据。Endpoint 需要按调用者区分访问时 MUST 以权限码声明，MUST NOT 以角色名替代（与 super-admin `BRX-SA-AUTH-006` 一致）。

[BRX-TENANT-AUTHZ-003] 声明权限的模块 MUST 在同一目录条目中声明该权限的默认授予 `grants: [{role, scope}]`。一个权限的授予 MUST 只包含一类角色：全部为 Actor 角色，或全部为 Subject 角色。未声明 `grants` 的权限不授予任何租户角色（默认拒绝）。模块 MUST 只能为自己声明的权限声明授予。

[BRX-TENANT-AUTHZ-004] Runtime MUST 在 H3/B2 期间由已选模块的声明汇总出不可变授予表，与 Host 入口准入快照属于同一代次；相同输入 MUST 得到相同结果（根 `BRX-RS-BOOT-008`）。下列情况 MUST fail-fast：`grants` 引用未知角色或未知范围；重复授予；一个权限的授予混用 Actor 与 Subject 角色；Subject 角色的授予范围不是 `SELF`；`tenant-actor` Endpoint 引用的权限授予了 Subject 角色，或 `tenant-subject` Endpoint 引用的权限授予了 Actor 角色。

[BRX-TENANT-AUTHZ-005] Dispatcher 的授权步骤 MUST 用已验证的角色查授予表得到有效权限与范围（Actor Token 用 `mtype`，Subject Token 用 `ptype`），再按 Endpoint `authorization` 的 `all`/`any` 判定；租户的 Actor Token 与 Subject Token MUST NOT 携带可被下游信任的权限列表；即使出现权限 claim 也 MUST 忽略。拒绝 MUST 在 Handler 前以稳定错误码返回并写安全审计。

[BRX-TENANT-AUTHZ-006] 数据范围本版本只定义 `TENANT`（当前租户的全部对象）与 `SELF`（与当前调用者关联的对象：Actor 为当前成员，Subject 为当前主体；关联口径由资源 Owner 在权限说明中定义）。Subject 角色只能获得 `SELF`（T-22）；Subject 访问本人以外的对象需要显式授权关系（如家庭共享、代理），不在本版本范围。Dispatcher MUST 把命中的最宽范围随 AccessDecision 交给 Handler；资源 Owner MUST 在自身 Repository 查询中施加该范围，MUST NOT 把 `SELF` 当作 `TENANT` 处理；声明了权限的 Endpoint 拿不到访问判定时 MUST 拒绝（fail-closed）。插件 MUST NOT 以已弃用的 `AuthContextCapability.getAuthorizedScopes()` 或自行解析的角色作为数据范围来源。

[BRX-TENANT-AUTHZ-007] 仅 OWNER 可执行的动作（修改 `mfa_policy`、转移所有权、任命 OWNER）MUST 以只授予 OWNER 的权限码表达。"ADMIN 不得管理 OWNER"等对象关系约束 MUST 由资源 Owner 的 resource policy 判定，MUST NOT 只靠前端隐藏。

[BRX-TENANT-AUTHZ-008] `member_type`、`principal_type` 或 `status` 变更 MUST 使对应行的 `authz_version` 自增（§8.2）。授予表随 Host 制品变化；模块升级后的授予在 Host 重启后生效，不触发 `authz_version` 自增，也不要求重签 Token。

[BRX-TENANT-AUTHZ-009] BFF 会话接口 MUST 返回由同一授予表、按当前上下文（Actor 或 Subject）计算的有效权限集合，MUST NOT 合并同一 identity 其他上下文的权限；员工控制台与品牌应用的 Route Guard 和操作入口显隐只依据它（frontend `BRX-FE-ROUTE-002`、`BRX-FE-AUTH-002`）。前端隐藏 MUST NOT 被当作授权。

[BRX-TENANT-AUTHZ-010] 成员与主体的角色变更、被拒绝的授权判定 MUST 写租户审计（T-25），MUST NOT 记录 Token 原文或其他凭证材料。

[BRX-TENANT-AUTHZ-011] 资源 Owner 认定为对 C 端公开的数据（如服务目录、门店信息、可预约时段）MAY 由不声明权限码的 C 端 Endpoint 提供：认证策略为 `tenant-subject`，或经版本化 allowlist 审批的匿名访问。这类 Endpoint MUST NOT 返回或修改个人数据及个人的业务对象（如病例、订单、文件）。员工访问同一数据 MUST 走声明权限码的管理接口；修改公开数据的 Endpoint MUST 按权限码授权。

[BRX-TENANT-AUTHZ-012] 要求租户上下文的 Endpoint（`tenantContext.mode=required`）MUST 在 `authentication.policyRef` 中二选一：`tenant-actor`（管理接口，只接受 Actor Token）或 `tenant-subject`（C 端接口，只接受 Subject Token），落实 multi-tenant §8.1 第 3 条与 T-11。同时接受 Actor 与 Subject Token 的认证策略 MUST NOT 用于租户 Endpoint。

**拟新增红线**

| ID | 唯一含义 | 最低证明门禁 | 失败处置 |
|---|---|---|---|
| T-29 | 租户权限码只来自已装配模块的声明目录；Endpoint 的权限判定只用权限码、不用角色名；声明的权限未授予即拒绝 | Manifest/授予表校验 + Dispatcher 负例测试 | 启动阻断 / 403 |
| T-30 | 租户 Actor 与 Subject 的有效权限只由 Runtime 授予表根据已验证角色（`mtype`/`ptype`）计算；Token 中的权限列表不得作为授权依据 | 签发与校验负例测试 | 签发拒绝 / 校验拒绝 |

**拟修改红线**（含义不变，只加门禁）：T-22 在"越权用例 E2E + Code Review"之外增加"授予表启动校验：Subject 角色只能授予 `SELF`"（`BRX-TENANT-AUTHZ-004`）；T-11 在"授权过滤 + 集成测试"之外增加"Manifest 认证策略校验：租户 Endpoint 二选一"（`BRX-TENANT-AUTHZ-012`）。

---

## 6. 被否决或暂缓的方案

| 议题 | 建议方案 | 被否决或暂缓的方案 | 理由 |
|---|---|---|---|
| 权限目录 | 插件 Manifest 声明 | 数据库可编辑目录 | 第二份目录会与代码漂移 |
| 角色 | 内置角色（Actor 三个、Subject 两个） | 本期自定义角色（暂缓） | 需要新 Data Owner 与管理入口；可在本方案上演进 |
| 授予位置 | 模块 Manifest 默认授予 | Composition 集中配置 | Composition 不应了解插件内部权限 |
| 计算时机 | 请求时展开 | 权限写进 Token | Token 膨胀；授予变化生效慢 |
| 数据范围 | `TENANT`/`SELF` | 部门/组织/区域（暂缓） | 组织结构尚无 Owner |
| C 端授权 | Subject 纳入同一授予表 | 只靠 audience 与本人数据（第 1 稿建议） | 声明了权限的 Endpoint 会拒绝全部 Subject；客户与访客无法区分；C 端"谁能调用"散落在各 Handler 里，无法审计 |
| 接口类别 | 员工接口与 C 端接口分开，一个权限只授予一类角色 | 同一 Endpoint 同时接受 Actor 与 Subject Token（第 2 稿曾允许） | 违反 multi-tenant §8.1 第 3 条与 T-11 的 B/C 分离；一条错误授予就会把管理功能暴露给 C 端 |
| Subject 范围 | 只能 `SELF` | 允许 Subject 获得 `TENANT` | 一条错误声明就会让所有客户看到全租户数据；T-22 要求 Subject 只访问与自己关联的对象 |
| 实现形态 | Runtime 授予表 + Dispatcher | 新增 `AuthorizationCapability` | multi-tenant §9.6 明确禁止；根 Catalog 未登记 |
| 旧数据 | 不用于租户 RBAC | 复用 `auth_role` 的 `TENANT_ADMIN`/`USER` 与 `auth_user_role` | 它们挂在旧 `auth_user` 上，不是多租户成员模型 |

---

## 7. 与其他蓝图的关系

| 蓝图 | 关系 |
|---|---|
| runtime-shell 3.2.0（根） | 不修订条款。Manifest `permissions` 条目增加可选 `grants` 属于 Manifest Schema 的 Minor 扩展；AccessDecision 增加数据范围属于 L2A 契约的 Minor 扩展（根 `BRX-RS-CAP-019`/`020`，须有兼容性测试）。若评审认为后者改变了根冻结的 Invocation ABI，需先走根级 RFC（见 Q5） |
| multi-tenant 5.0 | 本文的条款与红线落在其新版本；不改变成员、主体、Token、`authz_version` 与隔离语义；T-22 只加门禁，含义不变 |
| identity-auth 1.0 | 本文完成 §13「前置」中的"租户最小 RBAC"；新签发方（身份提供方 Adapter）的 Actor Token 只带 `mtype`、`mver`，Subject Token 只带 `ptype`、`pver`，都不带权限列表；M3 的品牌应用沿用同一授予表 |
| super-admin 4.0 | 不改变平台授权。平台权限 ID 目前分散在 platform-admin descriptor 的 Endpoint 声明、platform-auth 的 `PlatformPermissions` 常量与 `auth_permission` 种子三处；是否统一到本文模型见 Q8。super-admin 4.0 §3.1 规划把 `auth_user_role` 改造成支持平台与租户两种范围的 `sys_identity_role_assignment`；按本文，租户角色只来自 `member_type`/`principal_type`，该表的租户范围在本专项定义自定义角色之前不参与租户授权（`BRX-TENANT-AUTHZ-002`），由 super-admin 下一版一并处理 |
| frontend 1.2 | 已规定 Guard 只看 AuthCapability 的权限、权限只来自 BFF；本文补充"有效权限由授予表按当前上下文计算"，员工控制台和品牌应用都适用 |

---

## 8. 对现有实现的影响（只登记差距，本 RFC 不改代码）

| # | 差距 | 位置 | 处理方向 |
|---|---|---|---|
| 1 | 权限条目没有 `grants` | brix runtime-manifest 模型、校验器与 Manifest Schema | 增加可选字段与校验（含 Subject 角色只能 `SELF`）；Endpoint 引用未登记权限 fail-fast |
| 2 | 没有授予表 | brix runtime-orchestrator | 启动时汇总、不可变、进入入口快照代次 |
| 3 | Dispatcher 只信任 Token 中的 `permissions` | `EndpointAccessPolicy`/`EndpointAccessGuard` | 租户 Actor Token 按 `mtype`、Subject Token 按 `ptype` 展开；平台 Token 维持现状 |
| 4 | 业务代码拿不到访问判定：L2A `EndpointInvocation` 现在只有租户、调用者和 Token 角色等字段，没有命中的权限与数据范围（根 ABI 中的 `AccessDecision` 尚未实现） | brix runtime-sdk-api（L2A） | 增加可选的访问判定字段（Minor 扩展，根 `BRX-RS-CAP-019`/`020`），补兼容性测试 |
| 5 | `AuthCapability` 继承已弃用的 `AuthContextCapability`，`DataScope` 有五种类型 | brix runtime-sdk-api | 明确 `hasPermission()` 读取当前调用的判定；本版本只支持 `TENANT`/`SELF`，其余类型标注不支持 |
| 6 | Actor Token 带空的 `permissions`；Subject Token 带空的 `roles` 和 `permissions`；`RbacResolver` 无实现 | platform-auth `AuthFlowCapabilityImpl`、`JwtIssuerCapabilityImpl`、`RbacResolver` | 删除这些空 claim 与 `RbacResolver`（Actor Token 的 `roles` 按 §8 保留）；M1、M3 的新签发方遵循同一 claims 契约 |
| 7 | 没有租户控制台权限码与成员管理入口 | brix platform-tenant | 按附录 A 声明目录与授予；入口随 M1 租户员工控制台实现 |
| 8 | 业务插件的权限没有授予 | enterprise app-booking 等 | 补 `grants`，C 端用到的权限同时授予 Subject 角色 |
| 9 | 旧 `auth_role`（`TENANT_ADMIN`/`USER`）与 `auth_user_role` | platform-auth 数据 | 不用于租户 RBAC；清理随 super-admin 的 `sys_identity_role_assignment` 迁移 |
| 10 | app-tenant 的旧 `tenant:admin:*` 目录与 `/api/v1/tenants` 路由 | enterprise app-tenant | 不在本文范围；按 super-admin C-3 另行处理 |
| 11 | Subject 没有对外登录入口 | platform-auth、identity-auth M3 | 不在本文范围；M3 之前 Subject 授予只能用集成测试验证 |
| 12 | 没有只接受 Actor 或只接受 Subject 的认证策略；app-booking 的 2 个 Endpoint 使用同时接受两类 Token 的 `authenticated-user` | runtime-orchestrator `EndpointAccessPolicy`；enterprise app-booking | 增加 `tenant-actor`、`tenant-subject`，租户 Endpoint 必须二选一；app-booking 迁移到 `tenant-actor` 并补 `grants` |

---

## 9. 落地顺序建议（非规范）

1. 负责人裁决 §11（2026-10-23 已完成）；
2. 写出 multi-tenant 5.1（Freeze Candidate，2026-10-23 已写出），架构、安全、SRE 批准后登记 lock；
3. 施工（identity-auth §13「前置」最后一项，一个垂直切片）：Manifest `grants` 与认证策略校验 → 授予表与 Dispatcher 展开（Actor 与 Subject）→ AccessDecision 数据范围 → Token claims 清理 → platform-tenant 目录与业务插件授予 → 负例与端到端测试；
4. 前置验收：全量测试通过；未授予的权限在 Handler 前被拒绝；`SELF` 范围不越权；Subject 只能得到 `SELF`；角色变更后旧 Token 返回 `STALE_AUTHZ_VERSION`。C 端登录入口上线前，Subject 部分以集成测试验收，端到端验收随 M3；
5. 之后进入 M1，租户员工控制台使用 BFF 返回的有效权限。

---

## 10. 治理与版本

| 文档 | 新版本 | 类型 | 理由 |
|---|---|---|---|
| multi-tenant | 5.1 | Minor，`compatibilityEpoch` 不变 | 新增授权条款与 T-29、T-30，T-22 增加门禁；不改变已冻结的成员、主体、Token 与隔离语义 |
| runtime-shell | 不变 | — | 不新增 Capability；Manifest Schema 与 L2A 的变化均为向后兼容扩展（见 §7、Q5） |
| identity-auth | 不变 | — | 只登记前置项完成情况 |
| super-admin、frontend | 不变 | — | 不涉及 |

**流程**：

1. 评审本 Draft，并对 §11 作出裁决（2026-10-23 已完成）；
2. 写出 multi-tenant 新版本文件（Freeze Candidate：`docs/v5.1-多租户功能最小实现-设计蓝图.md`）；
3. 架构、安全、SRE 批准；
4. 在 lock 中登记哈希、commit 与批准记录，旧版本转为 SUPERSEDED；
5. 按 §9 施工。

---

## 11. 待决问题

**裁决（2026-10-23）**：负责人全部采纳下表建议。Q5 的附带问题同意：若架构评审认定访问判定的扩展涉及根级契约，先走根级 RFC；multi-tenant 5.1 依据根 §5.4 与 `BRX-RS-CAP-019`/`020` 认定它属于 L2A Minor 扩展。

| # | 问题 | 建议 |
|---|---|---|
| Q1 | 角色模型：只用内置角色，还是本期就做租户自定义角色 | 只用内置角色（§3.2 A）。**已知限制**：同一角色的权限完全相同。医生、中介员工等不同岗位在本期都是 MEMBER：与对象有关的操作可以用 `SELF` 加资源 Owner 定义的关联来区分（例如只有被指派的医生能修改病历）；与对象无关的功能（例如查看业绩报表）无法按岗位区分，只能所有 MEMBER 都有或都没有。需要按岗位区分时，在本方案上增加租户自定义角色（§3.2 B），另起 RFC |
| Q2 | 默认授予写在哪里：模块 Manifest、Host Composition，还是数据库 | 模块 Manifest（§3.3 A） |
| Q3 | 权限计算时机：请求时展开，还是写进 Token | 请求时展开（§3.4 A） |
| Q4 | 数据范围：只做 `TENANT`/`SELF`，还是本期引入部门/组织 | 只做两档（§3.5 A） |
| Q5 | 数据范围怎样交给 Handler：扩展 AccessDecision（L2A Minor），还是沿用已弃用的 `AuthCapability.getAuthorizedScopes()`；若前者被认定为根 ABI 变更，是否接受先走根级 Patch/Minor RFC | 扩展 AccessDecision |
| Q6 | 附录 A 的租户控制台权限码与默认授予是否采纳；其中 MEMBER 能否查看成员列表、ADMIN 能否重置成员 MFA | 按附录 A：MEMBER 只能看自己；ADMIN 可在再验证后重置非 OWNER 成员的 MFA |
| Q7 | C 端 Subject 是否纳入同一授予机制（CUSTOMER/GUEST 作为角色） | 纳入，Subject 角色只能授予 `SELF`；本租户公开数据不按角色授予（§3.6 A、`BRX-TENANT-AUTHZ-011`）。负责人已于 2026-10-23 同意按此修订草案 |
| Q8 | 平台超管授权是否后续也统一到本文模型，以消除平台权限 ID 分散在 descriptor、`PlatformPermissions` 常量与 `auth_permission` 种子三处的问题 | 本文不改；在 super-admin 下一版评估 |
| Q9 | 条款落在 multi-tenant 5.1，还是新建 `authorization` 专项 1.0；是否借此版本一并完成 multi-tenant 的 §7 重基线复核 | 落在 multi-tenant 5.1；§7 复核单独进行，避免本版本范围过大 |
| Q10 | 旧 `auth_role` 的 `TENANT_ADMIN`/`USER` 与 `auth_user_role` 的去留 | 不用于租户 RBAC；随 super-admin 的 `sys_identity_role_assignment` 迁移清理 |

---

## 12. 兼容性、迁移与回滚

multi-tenant §13 要求涉及红线与契约的 RFC 写明兼容性、迁移与回滚/恢复策略。

**兼容性**

| 对象 | 变化 | 兼容性 |
|---|---|---|
| Plugin Manifest | 权限条目增加可选 `grants` | 旧 Manifest 仍然有效；没有 `grants` 的权限不授予任何租户角色。现在租户 Token 的权限本来就是空的，行为不变 |
| 租户 Endpoint 认证策略 | 必须声明 `tenant-actor` 或 `tenant-subject` | 不兼容：同时接受两类 Token 的 `authenticated-user` 不能再用于租户 Endpoint。目前只有 app-booking 的 2 个 Endpoint 使用，随本次施工迁移 |
| 租户 Actor/Subject Token | 不再携带 `permissions`，Subject Token 也不再带 `roles` | 这些字段现在都是空列表，没有消费者依赖其内容；multi-tenant §8 冻结的 Token 结构本来就没有这两项；平台 Token 不变 |
| L2A `EndpointInvocation` | 增加可选的访问判定（命中的权限与数据范围） | Minor 扩展（根 `BRX-RS-CAP-019`/`020`）；现有 Handler 不改代码即可编译运行 |
| 兼容代际 | 保持 `3` | 不改变成员、主体、Token 结构与隔离语义 |

**迁移**

- 数据库：无。不新增表或列，不改 `member_type`/`principal_type` 的取值。
- 代码与声明：按 §8 差距清单施工；platform-tenant 按附录 A 声明权限码与授予；app-booking 的 Endpoint 改为 `tenant-actor` 并补 `grants`；platform-auth 停止写入空的 `permissions`/`roles` claim。
- 共享环境：随 Host 制品发布生效，不需要回填数据。

**回滚与恢复**

- 授予表只存在于制品中，没有持久化状态。回滚就是重新部署上一个 Host 制品，不需要恢复数据。
- 回滚后旧 Dispatcher 读取 Token 的 `permissions`；新 Token 不再带这个字段，等同于空列表，声明了权限的租户 Endpoint 会拒绝访问（fail-closed，和本次变更前一致），不会放宽权限。
- 紧急收紧：删除某条授予或关闭某个 Endpoint 后重启 Host（multi-tenant §13 允许先收紧运行策略）；不得在冻结蓝图之外放宽授权。

---

## 附录 A：platform-tenant 租户控制台权限码与默认授予（已采纳）

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

附录 A 的权限只授予 Actor 角色，对应 Endpoint 声明 `tenant-actor`。C 端用到的权限由各业务插件另行声明并只授予 Subject 角色，范围只能是 `SELF`（例如预约插件为 C 端接口声明"查看、取消自己的预约"并授予 CUSTOMER）。

---

## 附录 B：工作量估算（人日）

估算口径与 RFC-002 附录 C 相同：一名熟悉代码的全职开发者，用 Claude Code 辅助；含测试，不含等待评审的时间。

| 工作包 | 估算 |
|---|---|
| Manifest `grants` 字段、认证策略二选一、Schema 与校验 | 1.5–2 |
| 授予表、Dispatcher 展开、AccessDecision 数据范围与兼容性测试 | 1.5–2 |
| Actor 与 Subject Token claims 清理、删除 `RbacResolver` | 0.5 |
| platform-tenant 目录与授予、业务插件补授予 | 1 |
| Subject 角色：`ptype` 展开、只能 `SELF` 的校验与负例 | 0.5–1 |
| 负例与端到端测试 | 1–1.5 |
| 写出 multi-tenant 新版本并冻结 | 1 |
| **合计** | **7–9** |

比 RFC-002 附录 C.5 对"租户最小 RBAC"的估算（5–8 人日）上限多 1 人日，来自 Subject 纳入与员工/C 端接口分离。成员管理入口和控制台页面计入 M1。

---

## 附录 C：外部资料

- NIST Role Based Access Control：<https://csrc.nist.gov/projects/role-based-access-control>
- OWASP Authorization Cheat Sheet：<https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- OWASP Application Security Verification Standard（V4 Access Control）：<https://owasp.org/www-project-application-security-verification-standard/>
