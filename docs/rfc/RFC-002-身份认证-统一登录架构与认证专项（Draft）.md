# RFC-002：统一身份认证与登录架构（Draft）

> **文档类型**：RFC（根蓝图修订 + 新增身份认证专项 + 相关专项重基线提案）
> **状态**：已并入根蓝图 v3.2.0 与 identity-auth 1.0、super-admin 4.0、multi-tenant 5.0、frontend 1.2（Architecture Frozen，自 2026-10-22 生效），条款以各蓝图正文为准；本文保留为决策背景，**不指导施工**
> **起草日期**：2026-10-22
> **依据基线**：runtime-shell 3.1.0（ACTIVE）；super-admin 3.0、multi-tenant 4.0、frontend 1.1（ACTIVE，均为 `rebaseRequired=true`）
> **拟修订**：根蓝图 §2 术语、§5.4（`BRX-RS-MANIFEST-021` 增加身份协议面例外）、§10.1、§11.2；新增身份认证专项 `identity-auth` 1.0；super-admin §0.0、§0、§6、§7、§8.1、§9、§10、§12、§15、§17 中的登录、MFA、会话条款；multi-tenant §8、§9.2–§9.5、§11.3、§16、§16.1；frontend §2.3
> **目标版本**：根蓝图 3.2.0、identity-auth 1.0、super-admin 4.0、multi-tenant 5.0、frontend 1.2（见 §10）
> **裁决**：§11 全部已决。Q1、Q5、Q7 由负责人逐项确认；其余由负责人确认按本文建议采纳（均为 2026-10-22）

## 并入新版蓝图时的调整

本 RFC 已按负责人裁决并入五份新版蓝图（2026-10-22 冻结生效）。并入时相对下文的调整如下，冲突时以各蓝图正文为准：

- 新增 RFC 正文未列出的条款：identity-auth `BRX-IA-LAYER-001`～`003`、`BRX-IA-FLOW-006`、`BRX-IA-ONBOARD-003`、`BRX-IA-SESSION-006`、`BRX-IA-GOV-001`～`002`；frontend `BRX-FE-AUTH-005`（重申根 `BRX-RS-UI-018`）；super-admin `BRX-SA-SEC-013`、`BRX-SA-SEC-014` 与红线 SA-13；multi-tenant 实施验收项 I10；根 `BRX-RS-GOVERNANCE-025`（v3.2.0 裁决记录）；
- 新安全红线编号为 S-19、S-20；S-12～S-18 曾在已归档的 super-admin v2.0 中使用，不予分配；
- super-admin 4.0 同时删除 `/api/platform/admins/me/change-password`，自身凭证改在身份协议面管理；权限 ID `platform:admin:change-own-password` 保留，不得复用；
- super-admin 4.0 与 multi-tenant 5.0 保持 `rebaseRequired=true`：认证条款已对齐，自 v3.1.0 起的 §7 持久化复核尚未完成；
- 新专项领域名为 `identity-auth`；各新版文件名不带状态后缀。

本文沿用根蓝图的 RFC 2119 关键词约定。条款编号是拟定编号，冻结前可以调整，但不得与已发布 ID 冲突：根蓝图 SECURITY 组当前最大为 `BRX-RS-SECURITY-010`，UI 组为 `BRX-RS-UI-017`，安全红线为 S-11（S-12～S-18 曾在已归档的 super-admin v2.0 中以不同含义使用，为避免追溯混淆，本文新红线从 S-19 起编）；super-admin AUTH 组为 `BRX-SA-AUTH-006`，红线为 SA-12；frontend AUTH 组为 `BRX-FE-AUTH-001`，红线为 FE-12；multi-tenant 红线为 T-28。

---

## 0. 结论

1. **一个认证服务，多个客户端**：平台控制台、租户员工控制台、终端用户品牌应用都是同一个认证服务（OIDC Provider）的客户端。每个客户端单独配置允许的登录方式、认证强度和会话时长。
2. **登录页由认证服务托管**：浏览器端统一使用授权码 + PKCE（`BRX-RS-SECURITY-002` 不变）。控制台和业务前端不再出现密码、TOTP、passkey 等凭证输入页面。
3. **Web 控制台使用 BFF**：Access/Refresh Token 只保存在服务端，浏览器只持有 `HttpOnly`、`Secure` 的会话 Cookie（RFC 10017 §6.1）。
4. **按风险分级**：平台超管强制使用防钓鱼认证（passkey 或硬件安全密钥）；租户员工（OWNER、ADMIN、MEMBER）一律强制双因素；终端用户以低门槛为主，访问敏感数据时再验证。
5. **用 passkey、受信设备和敏感操作再验证，取代"每次登录输 TOTP"**。"手机扫码登录"用 passkey 的跨设备方式实现，不自建 App 扫码。
6. **失败防护以限流、渐进延迟和人机验证为主**。临时锁定只作用于发生失败的入口并自动解除，不允许跨入口的全局锁定。
7. **认证规则集中到新的 `identity-auth` 专项**。super-admin 和 multi-tenant 保留各自的领域语义（平台授权、租户上下文），登录方式与会话规则改为引用该专项。
8. **默认实现**：Spring Authorization Server + Spring Security WebAuthn，作为 L2C 身份提供方 Adapter 随 Host 组装；以后可以替换为外部 IdP。

---

## 1. 背景

### 1.1 业务目标

Brix 面向三类用户：

| 用户 | 典型身份 | 访问范围 |
|---|---|---|
| 平台超管 | 平台运营方 | 跨租户的运维控制面 |
| 租户员工（B 端 Actor） | OWNER、ADMIN、MEMBER（医生、前台、运营等） | 所属租户的管理与业务后台；一个人可以属于多个租户 |
| 终端用户（C 端 Subject） | 患者、学员、买家等 | 单个租户的品牌应用 |

首批租户是医疗机构。登录方案要同时做到：商用级安全、低使用成本、能分阶段落地，并满足医疗行业的认证要求（§1.5）。

### 1.2 现行条款

| 条款 | 内容摘要 |
|---|---|
| 根 `BRX-RS-SECURITY-002` | 浏览器/公共客户端 MUST 使用授权码 + PKCE S256；ROPC MUST NOT 使用 |
| 根 §10.1 | 用户认证 SHOULD 通过标准 OIDC Provider Adapter；Brix 不自建非标准协议 |
| 根 `BRX-RS-MANIFEST-021` | 插件与 `/api/platform/**` 的 HTTP Endpoint MUST 由唯一的 L2B Dispatcher 发布；不得自建 Servlet/Filter 链 |
| 根 `BRX-RS-UI-016` | Host MUST NOT 把原始 bearer/refresh token 暴露给 WebView、iframe 或插件 JS |
| super-admin Δ1、§8.1、§15.6 | 平台控制台在 `/platform/login` 输入密码 → `/api/platform/auth/login` → `/login/totp` → 前端拿到 Platform Token |
| super-admin Δ3、§12.1 第 3 条 | 标准 TOTP 首次绑定，并在每次正式平台登录时强制校验 |
| super-admin §12.2 第 2 条 | WebAuthn/FIDO2 列为"不做" |
| multi-tenant §9.2、§9.3 | `/api/auth/login/actor`、`/api/auth/login/subject` 接收凭证，`select-context` 直接向客户端签发 Actor/Subject Token 与 Refresh Token |
| multi-tenant §9.5 | Access/Refresh/selection ticket 永不持久化到浏览器通用存储 |
| multi-tenant §16 | 完整的 settings/密码/MFA 策略列为后续 |
| frontend `BRX-FE-LAYER-004` | 业务前端不得取得裸 bearer/refresh token |

### 1.3 现行条款的问题

1. **专项与根蓝图冲突**：super-admin 和 multi-tenant 定义的登录都是"浏览器提交密码、直接拿到 Token"，这正是 `BRX-RS-SECURITY-002` 禁止的 ROPC 形态。控制面里没有任何对此的裁决记录。
2. **防钓鱼能力不足**：TOTP 可以被实时钓鱼转发。业界对特权账号的要求是防钓鱼认证器（FIDO2/WebAuthn），见 CISA 指南和 NIST SP 800-63B-4。
3. **使用成本高，又没有降低的手段**：每次登录都要 TOTP；没有受信设备、敏感操作再验证这类机制，只能在"每次都验"和"不验"之间二选一。
4. **Token 落在浏览器**：现在平台会话（含 Access Token）存放在 `sessionStorage`，与 multi-tenant §9.5、frontend `BRX-FE-LAYER-004` 的原则不一致。而且只有一个存储 key，平台会话和租户会话会互相覆盖；也没有刷新和服务端注销。
5. **锁定可以被滥用**：任何人在平台登录入口连续输错某个租户员工的密码，就能锁住这名员工的全局身份。2026-10-21 已实际发生。
6. **规则分散**：认证规则分布在根、super-admin、multi-tenant、frontend 四份蓝图里，没有单一 SSoT，修改时容易漂移。

### 1.4 现状证据（2026-10-22 盘点）

| 层面 | 现状 |
|---|---|
| 平台登录 | `POST /api/platform/auth/login` + `/login/totp`（platform-admin `platform-operational.yaml`）。权限由 `PlatformPermissions.defaultPermissionsFor(role)` 按角色硬编码签发，不读 `auth_role_permission` |
| 平台会话 | `standalone-web-runtime-profile` 把会话（含 Access Token）写入 `sessionStorage`，key 为 `brix:standalone-web-runtime:auth-session:v1`；没有 Refresh Token，没有服务端注销 |
| 员工登录 | 只对外发布了 `POST /api/auth/login/actor`；select-context、refresh、logout、修改密码都没有发布；登录成功的响应缺少 tenantId、memberId、成员类型和 contextId |
| 员工权限 | 没有 `RbacResolver` 实现，Actor Token 的 `permissions` 为空 |
| 员工 MFA | 登录时写死 `mfaRequired=false`；但首位 OWNER 设置账号时已经绑定了 TOTP；`sys_tenant.mfa_policy` 没有被使用 |
| 失败计数 | 只有平台登录计数；密码校验发生在"是否是超管"的判断之前，所以能锁住非超管身份；员工登录既不计数也不限流 |
| 受邀人页面 | 设置页复用平台超管的 `/platform/setup`；接受页在 `/platform/first-owner/accept`，它声明的 actor guard 没有生效 |
| 协议基础 | 没有授权服务器；PKCE 只用在"Brix 作为客户端登录 Google"；`auth_oauth_client` 表已存在，但没有用于本平台的客户端 |
| 授权执行 | Dispatcher 不校验 descriptor 的 `policyRef`；平台 Handler 只检查"有数字 actor、无租户上下文" |
| 技术栈 | 两个仓库都是 Spring Boot 3.2.2（Spring Security 6.2）。Spring Security 6.4 起内置 passkey；Spring Authorization Server 自 Spring Security 7.0 起并入 Spring Security，1.5.x 是最后一个独立版本线 |

### 1.5 外部依据

检索于 2026-10-22，进入 Freeze Candidate 前须复核原文。链接见附录 B。

- **RFC 10017 / BCP 212《OAuth 2.0 for Browser-Based Applications》（2026-08）**：三种模式中 BFF 安全性最高，强烈推荐用于业务应用、敏感应用和处理个人数据的应用。BFF 必须是机密客户端；Cookie 必须设置 `Secure` 和 `HttpOnly`，宜使用 `SameSite=Strict` 和 `__Host-` 前缀；必须有 CSRF 防护（§6.1）。
- **RFC 9700（OAuth 2.0 安全最佳实践）**：不得使用 ROPC。
- **NIST SP 800-63B-4（2025-07 定稿）**：可同步的 passkey 在满足条件时可用于 AAL2；硬件绑定的认证器可以达到 AAL3。密码单独作为认证因素时最短 15 位，作为多因素的一部分时最短 8 位；不得强制定期更换密码或规定字符组合。
- **CISA《Implementing Phishing-Resistant MFA》**：FIDO/WebAuthn 是唯一广泛可用的防钓鱼 MFA；短信和语音只作为最后手段。
- **厚生劳动省《医療情報システムの安全管理に関するガイドライン》第 7.0 版（2026 年公布）**：据二次资料，系统运用编 14.1.1 明确二要素认证要在终端应用登录（如电子病历）和服务器侧同时实施；删除了定期改密的要求；要求禁止在不同系统间复用密码，并在一定次数认证失败后临时禁止登录。本文未能解析原文 PDF，冻结前必须以厚生劳动省原文复核。

---

## 2. 目标与非目标

**目标**

- G1 合规：浏览器端只使用授权码 + PKCE；不自建协议，不使用 ROPC。
- G2 分级：三类用户使用不同的认证强度、会话时长和再验证策略。
- G3 防钓鱼：特权访问使用防钓鱼认证器。
- G4 低摩擦：用 passkey、受信设备和敏感操作再验证来减少重复验证。
- G5 Token 不落浏览器：Web 端使用 BFF。
- G6 单一 SSoT：认证规则集中在一个专项。
- G7 可替换：默认使用内置身份提供方，可以替换为外部 IdP，插件和业务前端不感知。
- G8 可分阶段：先跑通租户员工登录，再逐步补齐其他部分。

**非目标**

- 不自研认证器 App，本期不提供"自家 App 扫码登录"；
- 短信、邮件验证码不作为特权账号的认证因素；
- 不定义权限码目录和 RBAC 模型（另起 RFC，租户控制台依赖它）；
- 本期不实现 SAML、SCIM 和企业 IM 登录（列为商业版后续）；
- 不改变 multi-tenant 的成员、主体、上下文和租户隔离语义；
- 不改变 super-admin 的 Bootstrap 两阶段模型和平台授权（`sys_platform_admin`）语义。

---

## 3. 方案比较

### 3.1 登录协议

| 方案 | 做法 | 根 SECURITY-002 | 防钓鱼 | Token 位置 | 工作量 |
|---|---|---|---|---|---|
| **A 托管登录 + 授权码 + PKCE + BFF（已定方向，Q1）** | 控制台跳转到认证服务的登录页，认证和选上下文都在认证服务完成；客户端用授权码换 Token，Token 存在服务端 | 符合 | 支持 passkey | 服务端 | 中 |
| B 第一方密码接口（现状） | 前端把密码提交到 `/api/.../login`，响应直接返回 Token | 冲突，需要修订根蓝图 | 依赖 TOTP，可以被钓鱼 | 浏览器 | 小 |
| C 托管登录 + 授权码 + PKCE，Token 存浏览器 | 同 A，但 SPA 作为公共客户端自己持有 Token | 符合 | 支持 | 浏览器内存 | 中 |

C 是 RFC 10017 三种模式中安全性最低的一种。A 比 C 多一个服务端会话层，换来的是 Token 不暴露给前端 JS，刷新页面也能保持登录。

### 3.2 身份提供方实现

| 方案 | 优点 | 缺点 |
|---|---|---|
| **内嵌 Spring Authorization Server，作为 L2C Adapter（建议）** | 能直接复用现有的身份、成员、上下文模型；随 Host 自托管，符合 Open Core 和医疗数据驻留要求；Spring Security 原生支持 passkey | 需要升级 Spring Boot；协议端点需要根蓝图例外（§5.1） |
| 外部 Keycloak / Zitadel 独立部署 | 功能全、成熟，自带 SSO、社交登录和组织模型 | 用户和凭证分在两个系统，需要同步；actor/subject 上下文要定制；部署上多一个服务 |
| 商业 CIAM（Auth0、Entra External ID、Cognito 等） | 运维最省 | 违背自托管和数据驻留；按用户计费；与 Open Core 冲突 |

外部 IdP 保留为可替换实现，供企业版或大客户使用。

### 3.3 特权账号的认证因素

| 方案 | 防钓鱼 | 体验 | 结论 |
|---|---|---|---|
| **Passkey（本机生物识别，或手机跨设备扫码）** | 是：凭证与站点绑定，跨设备时要求蓝牙近距离 | 一步完成 | 主方式 |
| 硬件安全密钥 | 是 | 需要随身携带 | 可选，适合不方便用手机的管理员 |
| TOTP | 否：可以被实时转发 | 每次输 6 位码 | 只作备用和恢复 |
| 自家 App 扫码 | 否：二维码可以被转发到钓鱼页 | 好 | 本期不做 |
| 短信 / 邮件验证码 | 否；短信还有换卡风险 | 一般 | 禁止用于特权账号 |

---

## 4. 架构总览

```text
浏览器（平台控制台 / 租户员工控制台 / 品牌 Web）
   │  同源会话 Cookie（__Host- 前缀，HttpOnly，Secure，SameSite）+ CSRF 自定义请求头
   ▼
BFF 会话层（身份协议面的一部分）
   │  机密客户端；授权码 + PKCE；Token 只在服务端，会话存储加密
   ├──────▶ L2B Dispatcher：authentication 步骤从会话取得 Token 并按 SECURITY-004 校验，
   │         其余拦截顺序不变（MANIFEST-022）
   ▼
认证服务（身份协议面，L2C 身份提供方 Adapter，默认 Spring Authorization Server）
   ├─ 托管登录页：先识别账号 → passkey / 密码 / TOTP / 短信 / 第三方
   ├─ 认证后选择上下文：员工 = 所属租户；终端用户 = 品牌应用绑定的租户
   └─ 只经 L2A 能力契约访问身份与租户数据
   ▼
platform-identity（身份、凭证、MFA 因子、受信设备、恢复码）
platform-tenant（成员、主体、上下文、登录期发现）

原生 App：系统浏览器 + 授权码 + PKCE（RFC 8252），Token 存系统安全存储
```

新概念：

- **身份协议面**：OIDC/OAuth 协议端点、托管登录页及其接口、BFF 会话端点的总称。由一个 L2C Adapter 持有，是 `BRX-RS-MANIFEST-021` 的唯一例外（§5.1）。
- **客户端策略**：每个客户端允许的登录方式、认证强度要求、会话时长和上下文类型（platform / actor / subject）。
- **认证强度**：Token 和会话记录本次认证达到的等级和方式（`acr`、`amr`、`auth_time`），供敏感操作再验证使用。
- **受信设备**：完成过第二因素的设备凭据。它只能免除非特权账号的第二因素，不能免除第一因素。

### 4.1 分层落位

| 位置 | 模块（拟定） | 职责 |
|---|---|---|
| L2A 契约 | `runtime-sdk-api` | 现有 `AuthCapability`、`IdentityAccountCapability` 等按需扩展：凭证校验、MFA 因子、受信设备、外部身份关联、上下文发现；新增第三方登录提供方 SPI |
| L2C Adapter（新） | `infra-adapter-identity-provider` | 内嵌 Spring Authorization Server，承载身份协议面：OIDC 端点、托管登录页、BFF 会话端点，以及第三方登录通用层（Spring Security OAuth2 Client） |
| L2C Adapter（已有） | `infra-adapter-redis` | BFF 会话和授权记录的服务端存储（加密） |
| 身份 Data Owner | platform-identity | 身份、凭证、MFA 因子、受信设备、外部身份关联；实现 L2A 身份契约 |
| 租户 Data Owner | platform-tenant | 成员、主体、上下文和登录期发现 |
| L2B | Dispatcher | authentication 步骤经 L2A 契约读取 BFF 会话并校验 Token；授权和再验证照常执行 |
| L3 | Host | 在 Composition 中显式选择身份提供方 Adapter，不包含认证代码 |

依赖方向：身份提供方 Adapter 只依赖 L2A 契约和 Spring Security 等基础设施 SDK（根 §3.2），不依赖 platform-identity、platform-tenant 的实现类，读写身份和租户数据一律经 L2A 契约。换成外部 IdP 时只替换这个 Adapter，插件、控制台和 Owner 都不变。

Spring Authorization Server 的协议端点由 Servlet Filter 实现，不经过 Dispatcher；这正是根蓝图需要 SECURITY-011 例外的原因。

---

## 5. 条款草案

### 5.1 根蓝图（3.1.0 → 3.2.0）

[BRX-RS-SECURITY-011] **身份协议面**：OIDC/OAuth 协议端点（authorize、token、revocation、jwks、discovery、end-session）、托管登录页及其接口、BFF 会话端点统称"身份协议面"。它 MUST 由 Host Composition 显式选择的唯一一个 L2C 身份提供方 Adapter 持有，并使用保留前缀（拟定 `/oauth2/**`、`/.well-known/**`、`/auth/**`、`/bff/**`）。身份协议面是 `BRX-RS-MANIFEST-021` 的唯一例外，并且 MUST 满足：

1. 只承载认证协议，MUST NOT 承载业务 Endpoint；
2. 有独立且固定的安全链：CSRF、严格 CSP、`frame-ancestors 'none'`、`Referrer-Policy: no-referrer`、限流和审计；
3. 只经 L2A 能力契约访问身份与租户数据，MUST NOT 注入任何 Owner 的 Repository 或 Service；
4. 与 Dispatcher 使用同一份入口快照做保留前缀冲突校验；Plugin 和 Platform Operational Module MUST NOT 声明这些前缀。

[BRX-RS-SECURITY-012] **Web 客户端使用 BFF**：浏览器中运行的控制台和业务前端 MUST 作为 BFF 背后的应用接入。Access/Refresh Token MUST 只保存在服务端会话中，并加密存储；浏览器只持有满足 RFC 10017 §6.1.3.2 的会话 Cookie；改变状态的请求 MUST 有 CSRF 防护。Dispatcher 的 authentication 步骤从服务端会话取得 Token 后，MUST 按 `BRX-RS-SECURITY-004` 完整校验。原生 App MUST 按 RFC 8252 使用系统浏览器和授权码 + PKCE，Token 存平台安全存储。

[BRX-RS-SECURITY-013] **特权访问防钓鱼**：平台超管以及任何可以跨租户的身份，MUST 使用防钓鱼认证器（FIDO2/WebAuthn passkey 或硬件安全密钥）完成认证。TOTP MAY 仅用于恢复；短信、语音、邮件验证码 MUST NOT 作为特权访问的认证因素。

[BRX-RS-SECURITY-014] **失败防护**：认证失败的处置 MUST 以"账号 + 来源"维度的限流、渐进延迟和人机验证为主。临时锁定 MUST 只作用于发生失败的入口和凭证，自动到期解除，并通知身份持有人；MUST NOT 允许一个入口的失败锁住该身份在其他入口的访问。

[BRX-RS-SECURITY-015] **敏感操作再验证**：资源 Owner MAY 在 access policy 中为 Endpoint 声明最低认证强度（`acr`）和认证有效期（`max_age`）。Dispatcher MUST 在调用 Handler 前校验；不满足时返回稳定错误 `auth.step_up_required`，由前端经身份协议面重新认证。

[BRX-RS-UI-018] 业务前端和控制台 MUST NOT 提供密码、TOTP、passkey、恢复码等凭证的输入页面；凭证只在托管登录页输入。

§2 术语新增：身份协议面、托管登录、BFF、passkey、受信设备、认证强度（`acr`/`amr`）、敏感操作再验证。

`BRX-RS-SECURITY-002` 保持不变。§10.1 中"SHOULD 通过标准 OIDC Provider Adapter"由 SECURITY-011 的身份提供方 Adapter 落实。

新增安全红线：

| ID | 唯一含义 | 最低证明门禁 | 失败处置 |
|---|---|---|---|
| S-19 | 特权访问 MUST 使用防钓鱼认证器；特权 Token 的 `amr` MUST 含防钓鱼因子 | 认证集成测试 + Token 负例测试 | CI/安全阻断 |
| S-20 | Web 客户端 MUST NOT 收到 Access/Refresh Token（响应体、URL、可被脚本读取的 Cookie、浏览器存储）；原生 App 只存于系统安全存储 | 前端制品扫描 + 响应 DLP + E2E 存储检查 | CI/发布阻断 |

### 5.2 新增 identity-auth 专项 1.0

条款前缀 `BRX-IA-*`，红线前缀 `IA-*`，继承根蓝图 3.2.0。

#### 5.2.1 所有权

[BRX-IA-OWNER-001] platform-identity 是身份数据的唯一 Data Owner，包括：全局身份、密码凭证、passkey 公钥凭证、TOTP 因子、恢复码、受信设备和认证事件。身份协议面 Adapter 持有协议数据：客户端注册、授权码、授权记录和会话；它只经 L2A 能力契约读写身份数据。

[BRX-IA-OWNER-002] platform-tenant 仍是成员、主体、上下文和登录期发现的唯一 Owner（multi-tenant §0.5、§9.2）。身份协议面通过它的 L2A 契约完成上下文发现与选择，不直接读租户表。

[BRX-IA-OWNER-003] 平台授权（`sys_platform_admin`）仍按 super-admin 定义。身份协议面只读取"是否有有效平台授权"的结果，不修改它。

#### 5.2.2 客户端

[BRX-IA-CLIENT-001] 平台客户端分三类，各自独立注册，audience 和上下文类型互不相同：

| 客户端 | 类型 | 上下文 | Token audience |
|---|---|---|---|
| `platform-console` | 机密（BFF） | platform | 平台 audience |
| `tenant-console` | 机密（BFF） | actor | `brix-actor` |
| 品牌应用（每个租户或品牌一个） | Web 为机密（BFF）；原生为公共 + PKCE | subject | `brix-subject` |

[BRX-IA-CLIENT-002] 客户端策略 MUST 声明：允许的登录方式、认证强度要求、会话时长上限、是否允许受信设备、上下文类型。redirect URI MUST 精确登记（根 SECURITY-003）。

[BRX-IA-CLIENT-003] 品牌应用客户端绑定唯一租户。终端用户所属的租户由客户端注册决定，不由 Header、子域名或请求参数决定（multi-tenant T-13）。

#### 5.2.3 登录流程

[BRX-IA-FLOW-001] 托管登录页采用"先识别账号"：先输入邮箱或手机号，再按该身份已登记的凭证和客户端策略决定下一步（passkey、密码、第三方、企业 SSO）。账号不存在时，流程、响应内容和响应时间 MUST 与账号存在时不可区分。

[BRX-IA-FLOW-002] 认证完成后，按客户端的上下文类型选择上下文：

- actor：调用 `discoverActor`。0 个上下文时显示"尚未加入任何租户"；1 个时自动选中；2 个及以上时显示租户选择页。选择使用一次性 selection ticket，multi-tenant §9.3 的 ticket 硬约束全部保留；
- subject：只发现客户端所绑定租户的主体，不显示选择页；
- platform：校验有效的平台授权，不涉及租户。

[BRX-IA-FLOW-003] 授权码 MUST 绑定所选上下文（`cid`）、客户端、PKCE challenge 和 nonce。Token 由 token 端点签发给 BFF（或原生 App），MUST NOT 由登录页直接返回给浏览器。

[BRX-IA-FLOW-004] 员工切换租户时，由控制台经 BFF 发起重新授权（`prompt=none` + 目标上下文），只能切换到同一身份的其他 Actor 上下文（T-26）。切换后 BFF 替换会话中的 Token，前端清空缓存和页面状态。

[BRX-IA-FLOW-005] 平台登录与员工、终端用户登录使用同一个认证服务，但客户端、托管页品牌和 Token audience 互相隔离。平台登录页 MUST NOT 链接或自动跳转到员工登录，反之亦然（super-admin §17）。

#### 5.2.4 凭证

[BRX-IA-CRED-001] 密码：哈希算法和参数来自安全 Profile。密码单独作为认证因素时最短 15 位，作为多因素的一部分时最短 8 位；MUST 检查已泄露密码库；MUST NOT 强制定期更换密码或规定字符组合。

[BRX-IA-CRED-002] Passkey：使用 WebAuthn，要求用户验证（`userVerification=required`）和可发现凭证。每个身份 MAY 登记多把；服务端只保存公钥和元数据；同时支持本机认证和跨设备（扫码）认证。特权账号 SHOULD 至少登记两把。

[BRX-IA-CRED-003] TOTP：遵循 RFC 6238，密钥由 platform-identity 加密保存；对特权账号只作恢复用途。

[BRX-IA-CRED-004] 恢复码：一次性使用，只存哈希，生成时只展示一次。

[BRX-IA-CRED-005] 短信/邮件验证码：只用于终端用户登录、账号找回和非特权再验证。MUST 按号码、来源、国家限流，防止短信轰炸和计费欺诈。

[BRX-IA-CRED-006] 第三方登录（OIDC/OAuth 联合登录）通过统一的通用层接入：

1. 通用层负责提供方注册、发起授权（授权码 + PKCE，带 state 和 nonce）、回调校验（签名、issuer、audience、nonce、有效期），并把提供方返回的用户信息映射为统一的外部身份（提供方 ID、提供方用户 ID、已验证的邮箱或手机号）。标准 OIDC 提供方只需配置；非标准的 OAuth2 提供方（如微信）实现同一个提供方 SPI 接入；
2. 外部身份与 Brix 身份的关联由 platform-identity 保存，"提供方 + 提供方用户 ID"唯一。只有提供方声明邮箱或手机号已验证时，才自动找出候选身份；关联到已有身份前 MUST 先用该身份的现有凭证确认；
3. 第三方登录只算第一因素（`brix:aal1`）。客户端要求 `brix:aal2` 时 MUST 再完成 Brix 的第二因素；`platform-console` MUST NOT 启用第三方登录；
4. 每个客户端是否启用某个提供方由客户端策略决定。首批只接入 Google，默认只对终端用户客户端启用（Q7）；
5. 提供方的 client secret 经 `SecretCapability` 管理，MUST NOT 进入普通配置或前端。

[BRX-IA-CRED-007] 按租户配置的企业 SSO（SAML/OIDC）属于商业版，由后续 RFC 定义。

#### 5.2.5 认证强度与再验证

[BRX-IA-MFA-001] 认证强度分为三级，写入 `acr`：

| `acr` | 含义 | 满足方式 |
|---|---|---|
| `brix:aal1` | 单因素 | 密码、第三方登录、短信/邮件验证码 |
| `brix:aal2` | 双因素 | passkey；密码 + TOTP；密码 + 受信设备（仅非特权账号，`amr` 记为 `pwd` 与 `tdev`） |
| `brix:aal2-phr` | 防钓鱼双因素 | passkey 或硬件安全密钥 |

[BRX-IA-MFA-002] 各类用户的最低要求（具体数值来自安全 Profile，初始建议见附录 A）：

- 平台超管：每次认证都要达到 `brix:aal2-phr`；不允许受信设备；
- 租户员工（OWNER、ADMIN、MEMBER）：一律强制 `brix:aal2`；允许受信设备，最长 30 天。租户的 `mfa_policy` 只能在此基础上加强（例如要求防钓鱼因子、缩短受信设备期限），MUST NOT 关闭 MFA（Q5）；
- 终端用户：`brix:aal1`；访问客户端策略中标记为敏感的数据时，再验证到 `brix:aal2`。

[BRX-IA-MFA-003] 受信设备：完成第二因素后才能登记。设备凭据是随机值，只存哈希，绑定身份和客户端类别；它只免除第二因素。修改密码、变更 MFA、重置凭证或管理员撤销时，该身份的受信设备 MUST 全部失效。用户可以在"设备管理"中查看和移除。

[BRX-IA-MFA-004] 敏感操作再验证：Endpoint 按根 SECURITY-015 声明 `acr`/`max_age`。以下操作 MUST 声明再验证：平台超管的新增/撤销超管、修改平台安全设置、跨租户操作；租户内的成员权限变更、数据导出、安全策略变更。

#### 5.2.6 会话与 Token

[BRX-IA-SESSION-001] Access Token 有效期不超过 15 分钟。Refresh Token 每次使用都轮换并检测重放；发现重放时撤销整个 Family（与 multi-tenant §9.3 Phase 5 一致）。

[BRX-IA-SESSION-002] 会话分三层：认证服务的登录会话（SSO）、BFF 会话（每个客户端一个）、Token。闲置超时和绝对时长按客户端策略设定（附录 A）。

[BRX-IA-SESSION-003] Token 在 multi-tenant §8 和 super-admin §7 的 claims 基础上，增加 `acr`、`amr`、`auth_time`、`sid`。Identity Token（`aud=brix-identity`）只在认证服务内部使用，MUST NOT 交给浏览器应用。

[BRX-IA-SESSION-004] 用户 MUST 能查看自己的活跃会话和受信设备，并逐个撤销。撤销 MUST 在一个 Access Token 有效期内生效（通过 `sid` 与 `mver`/`pver` 校验实现）。

[BRX-IA-SESSION-005] 注销 MUST 同时撤销 BFF 会话、Refresh Token 和认证服务的登录会话（RP-Initiated Logout）。

#### 5.2.7 首次设置、邀请与恢复

[BRX-IA-ONBOARD-001] 平台超管首次设置（super-admin §15）：setup 链接打开托管设置页 → 登记 passkey（必须）→ 生成恢复码 → 可选设置密码和 TOTP。Bootstrap 两阶段模型不变。

[BRX-IA-ONBOARD-002] FIRST_OWNER 和后续成员邀请：邀请或设置链接打开托管设置页（不在 `/platform/**` 下）→ 新身份设置凭证（passkey，或密码 + TOTP）→ 接受邀请仍走租户 Owner 的接受接口（multi-tenant §5.7）→ 跳转到租户员工控制台。

[BRX-IA-RECOVERY-001] 平台超管：使用恢复码，或由另一位超管协助重置（需要再验证，并写平台审计）。MUST NOT 提供邮件自助重置。

[BRX-IA-RECOVERY-002] 租户员工：使用恢复码；OWNER/ADMIN 可以重置成员的 MFA 因子（需要再验证，并写租户审计）；OWNER 本人的重置走平台受理流程。

[BRX-IA-RECOVERY-003] 终端用户：通过已验证的手机号或邮箱找回，加风控；更换手机号、邮箱等敏感变更 MAY 设置冷静期。

#### 5.2.8 防滥用与审计

[BRX-IA-ABUSE-001] 按根 SECURITY-014 实施："账号 + 来源"限流、渐进延迟、多次失败后人机验证。临时锁定只作用于发生失败的客户端类别和凭证，到期自动解除（时长来自安全 Profile），并通知身份持有人。

[BRX-IA-ABUSE-002] 新设备登录、凭证变更、MFA 重置、会话撤销 MUST 通知身份持有人。

[BRX-IA-AUDIT-001] 认证事件 MUST 写审计，包括：登录成功/失败、因子登记/移除、再验证、恢复、受信设备变更、会话撤销、锁定。平台客户端的事件和跨租户事件写平台审计；员工在租户内的事件写租户审计（multi-tenant T-25）。审计 MUST NOT 记录密码、验证码、恢复码、凭证私密材料或完整 Token。

#### 5.2.9 红线（拟定）

| ID | 唯一含义 | 最低证明门禁 | 失败处置 |
|---|---|---|---|
| IA-1 | 所有用户登录只经托管登录 + 授权码 + PKCE；不存在"接收凭证并返回 Token"的接口 | 端点清单扫描 + 安全集成测试 | CI 阻断 |
| IA-2 | 凭证只在托管登录页输入；控制台和业务前端不出现凭证输入 | 前端制品扫描 + 页面清单 | CI 阻断 |
| IA-3 | 特权访问只接受 `brix:aal2-phr` | 认证集成测试 + Token 负例测试 | CI/安全阻断 |
| IA-4 | 受信设备不得免除第一因素或特权访问的认证要求 | 认证负例测试 | CI 阻断 |
| IA-5 | 失败处置不得形成跨入口的全局锁定 | 锁定负例测试 | CI 阻断 |
| IA-6 | 三类客户端的 Token 不能互用（audience 校验） | 跨客户端负例测试 | CI 阻断 |
| IA-7 | 无法通过登录、找回接口的响应内容或响应时间判断账号是否存在 | 账号枚举负例测试 | 安全阻断 |

### 5.3 super-admin 重基线（3.0 → 4.0）

| 条款 | 现行 | 拟改 |
|---|---|---|
| Δ1、§0 登录入口、§8.1 | `/platform/login` → `/api/platform/auth/login` → `/login/totp` | 平台控制台是 `platform-console` 客户端，登录走托管登录页；删除上述两个 Runtime Entry |
| Δ2、§15.5 | setup 页设置密码 + 绑定 TOTP | 托管设置页登记 passkey（必须）+ 生成恢复码；密码和 TOTP 可选（BRX-IA-ONBOARD-001） |
| Δ3、§0 MFA、§12.1 第 3 条 | TOTP 首次绑定 + 每次登录强制 | 每次认证达到 `brix:aal2-phr`；TOTP 只作恢复 |
| §6 Runtime Entry | 含 `/api/platform/auth/login`、`/login/totp`、`/setup/*` | 删除；setup token 校验迁入身份协议面；Bootstrap 的三个 Endpoint 不变 |
| §7 Platform Token | `mfa: "TOTP"` | 改为 `acr`、`amr`、`auth_time`、`sid`；仍禁止租户上下文（AUTH-001 不变） |
| `BRX-SA-AUTH-002` | 平台登录使用 `/api/platform/auth/**` | 平台登录经身份协议面与 `platform-console` 客户端完成 |
| `BRX-SA-AUTH-003` | 密码 + TOTP 通过后签发 | Identity ACTIVE + PlatformAdmin ACTIVE + 达到 `brix:aal2-phr` 后签发 |
| §9 前端 | 登录页、TOTP 页、setup 页、`PlatformMfaChallengeGuard`、`SetupOnlyGuard` | 删除凭证页面和对应 Guard；保留 Bootstrap 页；`PlatformAuthGuard` 改为读取 BFF 会话 |
| `BRX-SA-SEC-002` | 登录锁定由身份 Owner 和 rate limit 负责 | 按根 SECURITY-014 与 BRX-IA-ABUSE-001 |
| §12.2 第 2 条 | 不做 WebAuthn/FIDO2 | 移出"不做"；仍然不做自研认证器和短信 MFA |
| §15.3 | 身份 Owner 持有加密的 MFA secret | 扩展为全部 MFA 因子（passkey 公钥、TOTP、恢复码），归 platform-identity |
| 新增 `BRX-SA-AUTH-007` | — | 新增/撤销超管、重置他人凭证、修改平台安全设置 MUST 声明再验证（`max_age` 来自安全 Profile） |

### 5.4 multi-tenant 重基线（4.0 → 5.0）

| 条款 | 现行 | 拟改 |
|---|---|---|
| §8 Token | Actor、Subject、Identity、Refresh 四类 | claims 语义不变，增加 `acr`、`amr`、`auth_time`、`sid`；Identity Token 只在认证服务内部使用；Web 端的 Refresh Token 只在 BFF |
| §9.2 登录入口 | `/api/auth/login/actor`、`/api/auth/login/subject` | 由 `tenant-console` 和品牌应用客户端的托管登录取代；`discoverActor`（可跨租户）和 `discoverSubject`（强制单租户）的语义与审计不变 |
| §9.3 选择上下文 | Phase 2 直接签发 Token | ticket 硬约束不变，改在认证服务内执行；Phase 2 改为签发绑定 `cid` 的授权码；Phase 4 切换经 BFF 重新授权；Phase 5 刷新由 BFF 执行 |
| §9.4 B/C 分离 | 两个独立入口 | 不变：两类客户端、两套托管页品牌 |
| §9.5 设备记忆 | 上下文偏好 | 不变；另增受信设备（BRX-IA-MFA-003），两者分开存储 |
| §11.3 前端 | `ActorContextSelector` 在前端 | 选择页移入托管登录；控制台只保留切换入口 |
| §16 范围 | MFA 策略列为后续 | 最小 MFA 策略进入本期：全体员工强制双因素，`mfa_policy` 只能加强；企业 SSO 仍属商业版 |
| §16.1 否决方案 | B/C 登录入口冻结为两个独立接口 | "独立入口"的语义保留，载体由两个 API 改为两类客户端和两套托管页；新增否决项"浏览器提交密码直接换 Token" |
| 新增 `BRX-TENANT-AUTH-001` | — | `sys_tenant.mfa_policy` 只能在平台基线（全体员工强制双因素）之上加强，MUST NOT 关闭 MFA；只能由 ACTIVE OWNER 修改，并写租户审计 |
| 新增 `BRX-TENANT-AUTH-002` | — | OWNER/ADMIN 重置成员的 MFA 时须再验证、写租户审计，并使该成员的全部会话和受信设备失效 |

### 5.5 frontend 重基线（1.1 → 1.2）

| 条款 | 拟改 |
|---|---|
| `BRX-FE-ROUTE-003` | 保留上下文隔离；补充：控制台路由只消费 BFF 会话，不处理凭证 |
| `BRX-FE-ROUTE-004` | setup、reset、invite 页面迁入托管登录，规则本身不变 |
| 新增 `BRX-FE-AUTH-002` | AuthCapability 的会话状态（身份、上下文、权限、`acr`、过期时间）只来自 BFF 会话接口，不来自 Token；前端不持有 Token |
| 新增 `BRX-FE-AUTH-003` | HttpCapability 对同源 API 使用会话 Cookie + CSRF 自定义请求头；收到 `auth.step_up_required` 或会话过期时，统一跳转托管登录，完成后返回原页面 |
| 新增 `BRX-FE-AUTH-004` | 托管登录页属于身份协议面的 UI，遵守 BrixUI、i18n 和页面状态规则；另外 MUST 禁止第三方脚本并使用严格 CSP |
| 新增 FE-13 | 前端制品和浏览器存储中不得出现 Access/Refresh Token（对应 S-20） |

---

## 6. 被否决或暂缓的方案

| 方案 | 结论 | 原因 |
|---|---|---|
| 浏览器提交密码直接换 Token（现状） | 否决 | 违反根 SECURITY-002 和 RFC 9700；Token 落在浏览器 |
| SPA 作为公共客户端自己持有 Token | 否决（Web） | RFC 10017 中安全性最低，且与 S-20 冲突；原生 App 不在此列 |
| 每次登录强制 TOTP | 否决 | 由 passkey、受信设备和再验证取代；TOTP 本身可以被钓鱼 |
| 自家 App 扫码登录 | 暂缓 | 需要自研 App；二维码可以被转发钓鱼。等有了 Brix App 再另起 RFC，届时必须有号码比对、设备绑定和请求来源展示 |
| 短信/邮件验证码作为特权 MFA | 否决 | CISA 建议只作最后手段；短信有换卡风险 |
| 全局硬锁定 | 否决 | 可以被第三方触发，形成拒绝服务 |
| 外部 IdP 作为默认实现 | 暂缓 | 作为可替换实现保留，企业版或大客户可以接入 |
| 商业 CIAM 作为默认实现 | 否决 | 与自托管、数据驻留和 Open Core 冲突 |
| SAML、SCIM、企业 IM 登录 | 暂缓 | 商业版后续 RFC |

---

## 7. 与专项蓝图的关系

- 新增 identity-auth 专项后，super-admin 和 multi-tenant 只保留各自的领域语义：super-admin 保留平台授权与 Bootstrap；multi-tenant 保留成员、主体、上下文和登录期发现。登录方式、MFA、会话、恢复和防滥用一律引用 identity-auth。
- frontend 增加 BFF 会话、托管登录和再验证跳转的前端规则。
- 根蓝图 3.2.0 生效后，所有专项都继承新根，按 `BRX-RS-AUTH-013` 标记 `rebaseRequired=true`，完成复核后解除。

---

## 8. 对现有实现的影响（只登记差距，本 RFC 不改代码）

| # | 差距 | 位置 | 处理方向 |
|---|---|---|---|
| 1 | 平台密码/TOTP 登录的 Runtime Entry | platform-admin `platform-operational.yaml`、`PlatformLoginHandler`、`PlatformTotpLoginHandler` | 迁入身份协议面后删除 |
| 2 | 平台登录、TOTP、setup 页面及对应 Guard | platform-admin-web `PlatformLoginPage`、`PlatformLoginTotpPage`、`PlatformSetupPage` | 删除；改为跳转托管登录 |
| 3 | 会话（含 Token）存在 `sessionStorage`，只有一个 key | standalone-web-runtime-profile | 改为读取 BFF 会话 |
| 4 | 员工登录只有 `/api/auth/login/actor`，没有 select-context、refresh、logout | platform-auth `plugin-manifest.yaml`、`AuthFlowCapabilityImpl` | 发现与 ticket 逻辑迁入认证服务后删除该入口 |
| 5 | 没有授权服务器；PKCE 只用于 Google 客户端 | platform-auth | 引入身份提供方 Adapter；`auth_oauth_client` 用作客户端注册，或按 Spring Authorization Server 的模型重建 |
| 6 | 没有 passkey、恢复码、受信设备、会话相关的表 | platform-identity | 新增前滚迁移和 Owner 契约 |
| 7 | 失败计数顺序导致跨入口锁定；员工登录不计数、不限流 | `AuthFlowCapabilityImpl.authenticateIdentity` | 按 SECURITY-014 重写 |
| 8 | 员工登录写死 `mfaRequired=false`；`mfa_policy` 未使用 | `AuthFlowCapabilityImpl`、platform-tenant | 按 BRX-IA-MFA-002 与 BRX-TENANT-AUTH-001 实现 |
| 9 | 受邀人的设置页、接受页在 `/platform/**` 下，guard 未生效 | platform-tenant-web；`IdentityFirstOwnerInviteeSetupCapabilityImpl` 的 setup-base-url | 迁入托管登录（BRX-IA-ONBOARD-002） |
| 10 | Dispatcher 不校验 `policyRef` | runtime-orchestrator `DefaultPluginEndpointDispatcher` | 前置条件：先实现权限执行，再叠加再验证（SECURITY-015） |
| 11 | Actor 权限为空（没有 `RbacResolver` 实现） | platform-auth | 由授权模型 RFC 解决；租户控制台依赖它 |
| 12 | Spring Boot 3.2.2 | 两个仓库的 `pom.xml` | 按 Q10 升级 |
| 13 | 平台审计缺少登录类事件 | platform-identity、platform-audit | 按 BRX-IA-AUDIT-001 补齐 |
| 14 | 现有 Google 登录是 Google 专用实现：前端直接向 Google 取 ID Token，再提交给后端换平台 Token；按邮箱匹配身份，没有关联表 | 前端 platform-auth-service-web 的 `GoogleOAuthService`；L2A `OAuth2FederationCapability`；platform-auth `OAuth2FederationCapabilityImpl` | 迁入第三方登录通用层（BRX-IA-CRED-006）后删除；`OAuth2FederationCapability` 按根蓝图 CAP-022/023 标注弃用后移除 |

---

## 9. 落地顺序建议（非规范）

1. **前置**：升级 Spring Boot；修复 Dispatcher 的权限执行；并行起草租户授权模型 RFC。
2. **M1 认证骨架**：身份提供方 Adapter（授权码 + PKCE、客户端注册）、托管登录页（先识别账号；密码 + 现有 TOTP）、BFF 会话。跑通"员工登录 → 选租户 → 进入控制台"，平台控制台一并迁入。
3. **M2 Passkey 与策略**：passkey 和恢复码（超管必须，管理员推荐）、受信设备、敏感操作再验证、限流取代锁定、会话与设备管理；受邀人页面迁入托管登录。
4. **M3 终端用户**：品牌应用客户端、第三方登录通用层（首批 Google）、手机号验证码、账号关联、敏感数据再验证。
5. **M4 商业版**：租户 SSO（SAML/OIDC）、SCIM、企业 IM 登录、风险引擎。

---

## 10. 治理与版本

**变更类型判断**：

| 文档 | 新版本 | 类型 | 理由 |
|---|---|---|---|
| runtime-shell | 3.2.0 | Minor；如评审认定身份协议面改变了分层语义，则升为 Major，`compatibilityEpoch` 加 1 | 新增 SECURITY-011～015、UI-018 和 S-19、S-20；`MANIFEST-021` 增加一个受限例外；`SECURITY-002` 不变 |
| identity-auth | 1.0 | 新增专项 | 新领域；lock 的 `requiredActiveDomains` 增加 `identity-auth` |
| super-admin | 4.0 | Major，专项 `compatibilityEpoch` 加 1 | 删除平台密码/TOTP 登录入口，Platform Token 的交付方式改变 |
| multi-tenant | 5.0 | Major，专项 `compatibilityEpoch` 加 1 | 删除 `/api/auth/login/actor` 与 `/api/auth/login/subject` 入口，Token 的交付方式改变 |
| frontend | 1.2 | Minor | 新增 BFF 会话和托管登录规则 |

**流程**：

1. 评审本 Draft，并对 §11 的问题作出裁决；
2. 写出新文件：根 3.2.0、identity-auth 1.0、super-admin 4.0、multi-tenant 5.0、frontend 1.2，状态为 Freeze Candidate；
3. 架构、安全、SRE 三方批准；
4. 在 lock 中登记哈希、commit 和批准记录，旧版本转为 SUPERSEDED；`requiredActiveDomains` 增加 `identity-auth`，同步更新校验器和指令检查；
5. 新专项继承新根；其余专项完成复核后解除 `rebaseRequired`；
6. 按 §9 分阶段施工。

**进展（2026-10-22）**：第 1～4 步已完成：§11 全部裁决；写出五份新版蓝图；负责人以架构委员会、安全、SRE 三个角色批准冻结；已登记 lock 并生效，旧版本转为 SUPERSEDED。新版文件：

- `docs/v3.2.0-运行壳架构设计蓝图.md`
- `docs/v1.0-身份认证功能最小实现-设计蓝图.md`
- `docs/v4.0-平台超管功能最小实现-设计蓝图.md`
- `docs/v5.0-多租户功能最小实现-设计蓝图.md`
- `docs/v1.2-前端架构-设计蓝图.md`

候选稿文件名不带状态后缀，冻结时路径保持不变（lock 中 `path` 不可变）。§9 前置中的 Spring Boot 4.1 升级与 Dispatcher 权限执行已在独立会话中开工。

---

## 11. 待决问题

全部问题均已于 2026-10-22 由负责人裁决：Q1、Q5、Q7 逐项确认，其余确认按本文建议采纳。

| # | 问题 | 裁决 |
|---|---|---|
| Q1 | 登录协议方向 | 托管登录 + 授权码 + PKCE + BFF（§3.1 方案 A） |
| Q2 | 身份提供方的实现方式 | 内嵌 Spring Authorization Server，作为 L2C Adapter（落位见 §4.1）；外部 IdP 作为可替换实现 |
| Q3 | 治理结构：新增 identity-auth 专项，还是分别修订现有四份蓝图 | 新增 identity-auth 专项。现有控制面没有独立的身份认证专项，认证规则分散在根、super-admin、multi-tenant、frontend 四份蓝图里 |
| Q4 | 平台超管日常登录是否允许"密码 + TOTP" | 不允许，只作恢复。管理员的设备不支持 passkey 时，登记硬件安全密钥 |
| Q5 | 租户 MEMBER 的默认 MFA 策略 | 全体租户员工强制双因素；租户 `mfa_policy` 只能加强，不能关闭 |
| Q6 | 会话时长的默认值 | 按附录 A |
| Q7 | 终端用户首批第三方登录 | 首批只接 Google；同时实现第三方登录通用层（BRX-IA-CRED-006），以后的提供方通过配置或提供方 SPI 接入 |
| Q8 | 身份协议面的保留前缀 | `/oauth2/**`、`/.well-known/**`、`/auth/**`、`/bff/**`，与 `/api/**` 不重叠 |
| Q9 | 托管登录页的模块归属 | platform-commons 下独立的前端模块，由身份协议面在 `/auth/**` 下提供 |
| Q10 | Spring Boot 升级目标 | 4.1。3.5 的开源支持已于 2026-06 结束，4.0 将于 2026-12 结束（第三方汇总，以 spring.io 为准）；Spring Security 7 已内置授权服务器和 passkey |
| Q11 | 各文档的版本号和变更类型 | 按 §10 表 |
| Q12 | 第三方登录属于 Open Core 还是商业版 | 属于 Open Core；按租户配置的企业 SSO 属于商业版 |

---

## 附录 A：默认策略（安全 Profile 初始值建议）

| | 平台超管 | 租户 OWNER/ADMIN | 租户 MEMBER | 终端用户 |
|---|---|---|---|---|
| 主要登录方式 | passkey（本机或跨设备扫码）、硬件安全密钥 | passkey，或密码 + TOTP | 同左 | 手机号验证码、第三方、邮箱 + 密码、passkey |
| 认证强度 | 每次 `brix:aal2-phr` | `brix:aal2` | `brix:aal2`（租户可加强） | `brix:aal1`；敏感数据 `brix:aal2` |
| 受信设备 | 不允许 | 最长 30 天 | 最长 30 天 | 不适用（长会话） |
| 闲置超时 | 15–30 分钟 | 1–2 小时 | 1–2 小时 | App 不设；Web 按品牌配置 |
| 绝对时长 | 8–12 小时 | 不超过 30 天（经 Refresh） | 不超过 30 天 | 数周至数月 |
| 再验证 `max_age` | 5 分钟 | 15 分钟 | 15 分钟 | 按操作设定 |
| 失败处置 | 限流 + 人机验证；该入口临时锁定 15 分钟 | 同左 | 同左 | 限流 + 人机验证 |
| 入口 | 独立域名，可加 IP 白名单，每次登录发告警 | 员工控制台域名 | 同左 | 品牌应用 |

## 附录 B：外部资料

- RFC 10017 / BCP 212, OAuth 2.0 for Browser-Based Applications（2026-08）：https://www.rfc-editor.org/rfc/rfc10017.html
- RFC 9700, Best Current Practice for OAuth 2.0 Security：https://www.rfc-editor.org/rfc/rfc9700.html
- RFC 7636, Proof Key for Code Exchange：https://www.rfc-editor.org/rfc/rfc7636.html
- RFC 8252, OAuth 2.0 for Native Apps：https://www.rfc-editor.org/rfc/rfc8252.html
- NIST SP 800-63B-4（2025-07）：https://csrc.nist.gov/pubs/sp/800/63/b/4/final
- CISA, Implementing Phishing-Resistant MFA：https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf
- Spring Security 6.4 GA（passkey 支持）：https://spring.io/blog/2024/11/19/spring-security-6-4-goes-ga
- Spring Security 参考文档：Passkeys：https://docs.spring.io/spring-security/reference/servlet/authentication/passkeys.html
- Spring Authorization Server moving to Spring Security 7.0（2025-09-11）：https://spring.io/blog/2025/09/11/spring-authorization-server-moving-to-spring-security-7-0
- Spring Boot 各版本支持期（第三方汇总，以 spring.io 为准）：https://eosl.date/eol/product/spring-boot/
- 厚生劳动省指南第 7.0 版的二次解说（原文须另行复核）：https://www.pfu.ricoh.com/inetsec/products/blog/blog26001.html
- 同上，三宅事务所解说 PDF：https://www.miyake.gr.jp/wp-content/uploads/2026/07/デジタル・ガバナンス／サイバーセキュリティニュースNo2_医療情報システム安全管理ガイドライン第7.0版.pdf

## 附录 C：实施评估（2026-10-22 盘点，非规范）

估算口径：一名熟悉代码的全职开发者，用 Claude Code 辅助；包含测试、端到端验证和蓝图治理，不包含等待评审的时间。

### C.1 可直接复用（逻辑不动，只换调用方）

| 现有代码 | 新方案里的用途 |
|---|---|
| 身份模型：`sys_identity`（状态、失败计数、锁定、MFA 字段）、平台授权、setup token、Bootstrap | 身份 Data Owner，原样保留 |
| L2A `TotpCapability` + `TotpCapabilityImpl` | TOTP 因子 |
| L2A `PasswordCapability` + `BCryptPasswordCapability` | 密码校验 |
| `ContextSelectionTicketService`（5 分钟有效、存哈希、绑定 identity token 的 jti） | 托管登录里的选租户步骤 |
| `TenantAccessCapabilityImpl.getActiveMemberships`（已有跨租户审批标注） | 登录后发现员工所属租户 |
| FIRST_OWNER 邀请与接受、受邀人设置、邮件模板、SMTP Adapter | 不变，只改链接地址和页面位置 |
| RS256 签名密钥（PEM） | 作为授权服务器的签名密钥 |
| Bootstrap 接口和页面 | 不变 |
| 前端 `AuthCapabilityImpl`（上下文类型、权限判断）、auth 类型定义、`ProtectedLayout` / `AppSidebar` / `AppHeader`、BrixUI | 控制台继续使用，只换会话来源 |
| `infra-adapter-redis` | BFF 会话存储 |

### C.2 需要改造（规则保留，换实现方式）

| 现有代码 | 规模 | 改法 |
|---|---|---|
| `AuthFlowCapabilityImpl`（登录编排） | 861 行 | 凭证校验、租户发现、ticket 的规则搬进授权服务器的认证流程；"直接返回 Token"的部分删除 |
| `JwtIssuerCapabilityImpl`、`JwtValidator`（基于 jjwt） | 794 行 | claims 规则（tid/cid/mid/mtype/mver、`STALE_AUTHZ_VERSION`）迁到授权服务器的 Token 定制和校验里 |
| 失败计数与锁定（`authenticateIdentity`） | — | 改为"按入口锁定 + 限流" |
| Dispatcher、`RuntimeShellEndpointController` | — | 增加会话 Cookie 认证、CSRF、权限码执行、再验证 |
| `standalone-web-runtime-profile` 的会话管理 | 771 行 | 改为从 BFF 读取会话，不再写 sessionStorage |
| Google 登录（后端 `GoogleIdTokenVerifier`、`OAuth2FederationCapabilityImpl`，前端 `GoogleOAuthService`） | — | 由第三方登录通用层取代；"只认已验证邮箱"的规则保留 |

### C.3 删除或基本重写

- 平台登录页、TOTP 页、setup 页及其 hook 和 repository，约 1,855 行；
- 平台登录 Handler，以及 `/api/auth/login/actor` 入口；
- `platform-auth-ui-web`（5,511 行旧版登录组件，没有挂载到任何 Host）：只作参考，托管登录页按 BrixUI 重写；
- 受邀人接受页：迁入托管登录。

### C.4 全新编写

- `infra-adapter-identity-provider`：授权服务器配置、客户端注册、认证流程、BFF 端点、第三方登录通用层；
- 托管登录的前端模块；
- platform-identity 的新表和契约：passkey 凭证、恢复码、受信设备、外部身份关联；
- 租户员工控制台外壳；租户最小 RBAC（另起 RFC）；
- 红线负例测试。

### C.5 工作量（人日）

| 阶段 | 工作包 | 估算 |
|---|---|---|
| 前置（不依赖本 RFC 冻结） | Spring Boot 3.2.2 → 4.1（两个仓库） | 8–15 |
| | Dispatcher 执行权限码 | 3–5 |
| | 租户最小 RBAC（另起 RFC） | 5–8 |
| | 写出五份新版本蓝图并冻结 | 3–5 |
| | **小计** | **19–33** |
| M1 认证骨架 | 身份提供方 Adapter（授权服务器、三类客户端、Token 定制） | 5–8 |
| | 托管登录后端（识别账号、密码 + TOTP、选租户、setup） | 6–10 |
| | BFF 会话、Dispatcher 会话认证、CSRF | 4–6 |
| | 托管登录前端页面 | 5–8 |
| | 控制台接入 BFF，删除平台旧登录页 | 3–5 |
| | 租户员工控制台外壳（路由、菜单、切换租户） | 4–6 |
| | 测试与端到端回归 | 4–6 |
| | **小计** | **31–49** |
| M2 passkey 与安全策略 | passkey（注册、登录、跨设备扫码、凭证管理） | 6–9 |
| | 恢复码、受信设备 | 3–5 |
| | 敏感操作再验证 | 3–5 |
| | 限流取代锁定、登录通知 | 3–4 |
| | 会话与设备管理页面 | 3–4 |
| | 受邀人页面迁入托管登录 | 2–3 |
| | 红线负例测试 | 4–6 |
| | **小计** | **24–36** |
| M3 终端用户 | 第三方登录通用层 + Google | 4–6 |
| | 外部身份关联 | 2–4 |
| | 短信验证码（含短信服务商 Adapter、防刷） | 4–6 |
| | 品牌应用客户端、敏感数据再验证 | 3–5 |
| | 测试 | 2–4 |
| | **小计** | **15–25** |

合计约 89–143 人日。到"租户员工能登录、选租户、进入控制台"（前置 + M1）约 50–82 人日。

### C.6 风险与安排

- Spring Boot 升级的估算最不确定：两个仓库共 98 个 pom、约 15.7 万行 Java；Boot 4 默认使用 Jackson 3，涉及 98 个引用 Jackson 2 的文件，另有 17 个文件引用 Hibernate、4 个文件使用 Spring Security 7 已移除的写法。
- 前置中的 Spring Boot 升级与 Dispatcher 权限执行不依赖本 RFC 冻结，已于 2026-10-22 在独立会话中开工。
- 租户控制台"按权限区分功能"依赖租户最小 RBAC，需另起 RFC，可与 M1 并行。
- 如需提前交付员工登录，平台超管登录可放到 M1 末尾迁移；过渡期新旧两套平台登录并存，须按根蓝图 `BRX-RS-GOVERNANCE-013` 登记有到期日的临时豁免。
