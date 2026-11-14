# RFC-013：Bootstrap 会话交给 BFF（Draft）

> **文档类型**：RFC（super-admin Major 修订、identity-auth Minor 修订的提案；不修订根蓝图）
> **状态**：已批准（2026-11-13，architecture-committee、security、SRE，决定记录 `user-authorization:2026-11-13:rfc-013`）。公示期按 §5（D128）。2026-11-09 负责人按推荐批准[Bootstrap 会话交付决定稿](../v3.3.0-运行壳-Bootstrap会话交付-设计方案.md)的 D109～D113，本 RFC 按决定稿 §6 起草。修订已并入 super-admin 5.0.0 与 identity-auth 1.1.0，2026-11-14 生效（标准链路收尾方案 §10.63），公示期到此结束；按 §4 施工是单向门队列第 2 项，完成前开会话的旧入口仍在，由豁免 EX-2026-005 覆盖。本文是决策背景，**不指导施工**，施工依据是 super-admin 5.0.0 与 identity-auth 1.1.0
> **起草日期**：2026-11-09
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；super-admin 4.0.1（ACTIVE，`rebaseRequired=true`）、identity-auth 1.0.1、frontend 1.2.1、multi-tenant 5.1.3（ACTIVE）
> **来源**：决定稿 D109～D113 与 §6、§8 第 1 项；[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §10.41、§11.1
> **拟修订**：super-admin 的 §6、§9、UI-002 共五处，下一版为 5.0.0，兼容代际 3 → 4；identity-auth 新增 `BRX-IA-ONBOARD-004` 并在 §2 的 L2A 契约里加一项，下一版为 1.1.0；根、frontend、multi-tenant 不因本 RFC 改动

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 决定稿已经定了做法：Bootstrap 会话交给 BFF（D109）；去掉 `/api` 下开会话的 Runtime 入口（D110）；开会话不做结果重放（D111）；开会话用身份协议面的限流，建首位超管用 BFF 的同步 CSRF 令牌（D112）。本 RFC 把它写进两份专项。
2. 决定稿留给本 RFC 定的一件事（D110）：BFF 怎样请身份 Owner 开会话。本 RFC 推荐新加一个只管 Bootstrap 会话的窄 L2A 能力，不在 `IdentityAccountCapability` 上加方法（§3）。
3. 版本（§5）：
   - super-admin 下一版是 5.0.0，兼容代际由 3 升为 4：删掉一个 Runtime 入口，会话的交付方式也变了，调用方（控制台、脚本）都要改。v4.0 删除平台登录和 setup 的 Runtime 入口时，就是这样升的兼容代际；
   - identity-auth 下一版是 1.1.0：只新增条款和契约，兼容代际仍是 1；
   - RFC-009 §3、RFC-012 §3 原来写的 super-admin 4.0.2、identity-auth 1.0.2，2026-11-13 已改为 5.0.0 和 1.1.0（标准链路收尾方案 §11.1 单向门队列第 9 项的 9b）。
4. 根不改：S-20、SECURITY-011、SECURITY-012 已经覆盖。新能力是平台内部的 L2A 契约，不在 CAP-001 的插件能力目录里。

---

## 1. 背景

### 1.1 要改的现文

super-admin 4.0.1：

| 位置 | 现文 |
|---|---|
| §6 表 | 开会话一行：`POST /api/platform/bootstrap/session`，认证 approved anonymous policy + rate limit，授权 setup-code policy，tenantContext forbidden，idempotency required |
| §6 表下说明 | "平台登录、setup 与自身凭证管理自 v4.0 起不再是 `/api/platform/**` Runtime Entry，由身份协议面（根 SECURITY-011）提供，规则见身份认证专项。" |
| §9 页面表 `BootstrapOnlyGuard` 行 | "后端状态为 Stage A；session 只保存在内存态" |
| §9 前端架构红线 | "Bootstrap 页面设置 `Referrer-Policy: no-referrer`，Bootstrap session 只在内存；平台控制台不持有 Access/Refresh Token（根 S-20）" |
| UI-002 | "Bootstrap session 只保存在完成当前流程所需的最小内存态；setup 与 MFA 流程在托管登录中完成（身份认证专项 BRX-IA-ONBOARD-003）。页面设置 `Referrer-Policy: no-referrer`；不得进入持久化存储、URL 分析、错误上报或埋点。" |

identity-auth 1.0.1：

| 位置 | 现文 |
|---|---|
| §2 表 L2A 契约行 | "`AuthCapability`、`IdentityAccountCapability` 等按需扩展：凭证校验、MFA 因子、受信设备、外部身份关联、上下文发现；第三方登录提供方 SPI" |
| LAYER-001 | 身份提供方 Adapter 只依赖 L2A 契约；读写身份和租户数据一律经 L2A 契约 |
| §9 | ONBOARD-001～003 写超管首次设置、FIRST_OWNER 邀请和链接里的令牌，没有 Bootstrap 开会话 |

### 1.2 不改的现文

| 位置 | 为什么不改 |
|---|---|
| super-admin BOOT-004："只允许 status/session/create-first-admin" | 这三步仍在，只是开会话移到身份协议面；会话令牌仍只用于建首位超管 |
| super-admin SEC-004、§6 末段 | 改完之后正好符合 |
| super-admin §7："BOOTSTRAP_SETUP 是独立的短期一次性 session，不是 Platform Token" | 不变 |
| frontend 1.2.1 ROUTE-003："`BOOTSTRAP_SETUP` 只进入显式 bootstrap/setup 路由" | 会话令牌由 BFF 转交，只有 Bootstrap 入口收它（第 10b-7a 点 D97）；ROUTE-003 末条写 Platform、Actor、Subject 会话经 BFF，并没有不许 Bootstrap 会话经 BFF |
| multi-tenant 5.1.3 | 不涉及 |
| 根 3.3.0 | S-20、SECURITY-011、SECURITY-012 已经要求这样做 |

---

## 2. super-admin 的修订（写入下一版 5.0.0）

1. §6 表删掉开会话一行。
2. §6 表下说明改为："平台登录、setup 与自身凭证管理自 v4.0 起不再是 `/api/platform/**` Runtime Entry，由身份协议面（根 SECURITY-011）提供，规则见身份认证专项。开 Bootstrap 会话自 v5.0 起也在身份协议面（`POST /bff/bootstrap/session`，身份认证专项 BRX-IA-ONBOARD-004）：会话由 BFF 持有，`create-first-admin` 的 BOOTSTRAP_SETUP 认证经 BFF 会话完成。表中 Platform Token 指经 BFF 会话取得、由 Dispatcher 校验的平台 Token。"
3. §9 页面表 `BootstrapOnlyGuard` 行的条件改为："后端状态为 Stage A；会话由 BFF 持有，页面不接触会话令牌"。
4. §9 前端架构红线那一条改为："Bootstrap 页面设置 `Referrer-Policy: no-referrer`；Bootstrap 会话由 BFF 持有，页面只留流程状态和 CSRF 令牌；平台控制台不持有任何 Token（根 S-20）"。
5. UI-002 改为："Bootstrap 会话由 BFF 持有（身份认证专项 BRX-IA-ONBOARD-004），页面只保存完成当前流程所需的最小状态（表单与 CSRF 令牌），不接触会话令牌；setup 与 MFA 流程在托管登录中完成（身份认证专项 BRX-IA-ONBOARD-003）。页面设置 `Referrer-Policy: no-referrer`；setup code 与流程状态不得进入持久化存储、URL 分析、错误上报或埋点。"

文首的兼容代际改为 `4`，"不兼容点"一行写明：v5.0 删除开 Bootstrap 会话的 Runtime Entry，Bootstrap 会话改由 BFF 交付，兼容代际由 3 升为 4。§18 新增"v5.0 相对 v4.0.1 的变更"，列出同一版里的全部改动（§5）。

---

## 3. identity-auth 的修订（写入下一版 1.1.0）

1. §9 新增：
   - **[BRX-IA-ONBOARD-004]** 平台 Bootstrap 的开会话在身份协议面完成（super-admin §15）：`POST /bff/bootstrap/session` 收 setup code，BFF 经身份 Owner 的 L2A 契约核对 setup code、签发 BOOTSTRAP_SETUP 会话；令牌 MUST 只保存在加密的服务端 BFF 会话里，浏览器只拿到会话 Cookie 和 CSRF 令牌，回答里只有有效期和 CSRF 令牌。这个 BFF 会话只用于 super-admin 的 `create-first-admin`，与令牌同时到期；它不是登录会话，不签发 Access/Refresh Token。开会话 MUST 按来源限流（根 SECURITY-011），MUST 只收同源的 JSON 请求，MUST NOT 保存或重放答案。
2. §2 表 L2A 契约行加一项："Bootstrap 会话的开启（`BootstrapSessionCapability`，由 platform-identity 实现，只给身份协议面用）"。
3. 新增附录 C"v1.1.0 相对 v1.0.1 的变更"：继承的根改为 3.4.0（RFC-009 §3）；本节两处；兼容代际（`1`）与 `rebaseRequired=false` 不变。

`BootstrapSessionCapability` 的要点：一个方法，收 setup code，返回会话令牌和有效期；setup code 不对、Bootstrap 已关闭或未开启时，抛带稳定错误码的异常，由 BFF 转成稳定的错误回答；platform-identity 照旧在自己的 Unit of Work 里核对、签发、记单例行和平台审计。

为什么不在 `IdentityAccountCapability` 上加方法：

| 方案 | 结论 |
|---|---|
| A（推荐）：新加窄能力 `BootstrapSessionCapability` | 只给身份协议面用，权限最小；Bootstrap 没有身份，不属于"身份账户"；替换身份提供方时（LAYER-002）边界清楚 |
| B：在 `IdentityAccountCapability` 上加方法 | 它管身份凭证、令牌版本、登录锁定和平台授权查询（接口说明），Bootstrap 会话不是这些；所有拿到它的地方都多了开会话的能力 |

---

## 4. 影响与施工（批准、发布之后）

| 层 / 模块 | 影响 |
|---|---|
| L2A `runtime-sdk-api` | 新增 `BootstrapSessionCapability`（只加不改） |
| platform-identity | 实现新能力，沿用现有的核对、签发与审计；内部契约 `PlatformBootstrapAdministration` 的开会话方法没有调用方了，去掉它，契约升 Major |
| platform-admin | 去掉开会话的 Runtime 入口、Handler 和描述符一行；`create-first-admin` 不变 |
| 身份提供方 Adapter（BFF） | 新端点 `POST /bff/bootstrap/session`；BFF 会话里能存 Bootstrap 会话（没有 Refresh Token，与令牌同时到期）；同源与 JSON 检查 |
| 控制台 | Bootstrap 页面先调 BFF 开会话，再调建首位超管，带 `X-Brix-CSRF` 和 `Idempotency-Key`，不再接触令牌 |
| 测试与回归 | 浏览器拿不到令牌（S-20 的存储检查）；`/api/platform/bootstrap/session` 不再存在；缺 CSRF 令牌答 403；开会话限流；建首位超管的重放不变。一次性回归的 Bootstrap 段和企业仓的 `scripts/remote-deploy/bootstrap-e2e.sh` 改为走 BFF |
| 文档 | 端点指南、变更记录、超管 Bootstrap 运维手册（§11.1 待办里那一项） |

施工按标准链路收尾的做法单独成一点：代码、测试、两种传输的一次性回归、反证、文档，部署要负责人批准。施工完成时关闭过渡期豁免（D113）。

---

## 5. 治理与版本

| 文档 | 下一版 | 类型 | 同一版里的全部改动 |
|---|---|---|---|
| super-admin | 5.0.0 | Major，兼容代际 3 → 4 | 继承根 3.4.0（RFC-009 §3）；D95 对 BOOT-004 的解读（标准链路收尾方案 §10.32、§11.1）；RFC-012 §3 的三处；本 RFC §2 的五处；过期引用（RFC-009 §3） |
| identity-auth | 1.1.0 | Minor，兼容代际 1 不变 | 继承根 3.4.0（RFC-009 §3）；本 RFC §3 的两处 |
| frontend、multi-tenant | 1.2.2、5.1.4 | 同 RFC-009 §3 与 RFC-011 | 本 RFC 不改 |
| 根 | 3.4.0 | 同 RFC-009 | 本 RFC 不改 |

为什么 super-admin 是 Major：根 §12.2 把"纠错但不改变可观察契约"算 Patch、"新增向后兼容"算 Minor、"破坏兼容"算 Major。代码违反的虽然是 super-admin 自己的 SEC-004 和 §6 末段，但 §6 表里的入口要删、会话的交付方式要变，控制台和脚本都得改，这是可观察契约的不兼容变化。v4.0 删除平台登录和 setup 的 Runtime 入口、改变 Platform Token 的交付方式时，兼容代际就由 2 升为 3（super-admin 文首）。

`rebaseRequired=true` 不变：根 v3.1.0 起要求的 §7 持久化复核不在本次范围。

公示期：根 GOVERNANCE-008 要求 Major 有迁移计划和公示期，迁移计划见 §4、§6。公示期从本 RFC 草稿推送到 main（2026-11-09）起，到 super-admin 5.0.0 随根 3.4.0 生效为止，不另设等待。理由：
- 开会话的调用方只有同仓的控制台和两个脚本（一次性回归的 Bootstrap 段、企业仓的 `scripts/remote-deploy/bootstrap-e2e.sh`），没有仓外的调用方，它们随施工同一次改；
- 5.0.0 生效后旧入口仍在，直到单向门队列第 2 项施工完成，期间由过渡期豁免 EX-2026-005 覆盖；
- 共享环境已在 Stage B，开会话只会答 409。

按 super-admin §18.2、identity-auth §15 的做法登记：先写出两个新版本（Freeze Candidate），在 lock 中登记为不指导施工的 CANDIDATE；架构、安全、SRE 批准后登记哈希、commit 与批准记录，旧版本转为 SUPERSEDED。

---

## 6. 兼容性、迁移与回滚

- **兼容性**：不兼容的只有开会话这一步。共享环境已在 Stage B，开会话只会答 409；只有全新安装用得到，控制台和后端同一次发布。
- **迁移**：没有数据迁移。脚本按新流程改（§4）。
- **回滚**：代码退回旧入口即可。蓝图层面的回滚要新的 RFC（根 GOVERNANCE-009）。本 RFC 未批准时，super-admin 4.0.1、identity-auth 1.0.1 保持 ACTIVE，过渡期豁免（D113）继续生效。

---

## 7. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的 super-admin 5.0.0 五处、§3 的 identity-auth 1.1.0 两处与 `BootstrapSessionCapability`、§5 的版本类型与公示期，随根 v3.4.0 那一批发布。批准记录写入本文状态行和 lock。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-13:rfc-013:architecture-committee` | `2026-11-13T21:06:32+09:00` |
| security | `user-authorization:2026-11-13:rfc-013:security` | `2026-11-13T21:06:32+09:00` |
| sre | `user-authorization:2026-11-13:rfc-013:sre` | `2026-11-13T21:06:32+09:00` |

批准人：`jsq`。负责人 2026-11-13 答"全部批准，合并推送"（标准链路收尾方案 §10.54）。
