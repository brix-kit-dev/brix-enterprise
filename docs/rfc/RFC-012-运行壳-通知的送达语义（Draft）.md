# RFC-012：通知的送达语义（Draft）

> **文档类型**：RFC（根级 Minor RFC，按根 §12.2"新增向后兼容 Capability/Manifest/红线"一行：给已有的 `NotificationCapability` 写明送达语义，插件面的方法签名不变）
> **状态**：Draft。2026-11-08 负责人按推荐批准[通知送达语义决定稿](../v3.3.0-运行壳-通知送达语义-设计方案.md)的 D103～D108，本 RFC 按 D108 起草；2026-11-09 负责人同意本 RFC 的方向（方案 A）。正式审批（architecture-committee、security、SRE）与根 3.4.0 的发布同 RFC-009、RFC-010、RFC-011 一起，排在标准链路收尾方案 §11.1 的单向门队列里。批准前**不指导施工**；施工依据仍是现行根蓝图 v3.3.0。其中 RESILIENCE-001 已经要求的发送时间上限和决定稿 D107 的指标，已在标准链路第 14a 点施工
> **起草日期**：2026-11-09
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；identity-auth 1.0.1、frontend 1.2.1、super-admin 4.0.1、multi-tenant 5.1.3（ACTIVE）
> **来源**：通知送达语义决定稿 D103～D108、§6 第 2 项；[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §11 第 14b 点
> **拟决定**：根 §4.7 加 Notification 一行和新条款 `BRX-RS-ERROR-017`，附录 A 的 ERROR 组加一个 gate；super-admin 4.0.2 的 NOTIFY-003、§15.4 末段和 §18 关系表的通知一行改为引用它；与 [RFC-009](RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md)、[RFC-010](RFC-010-运行壳-先做访问检查再校验请求（Draft）.md)、[RFC-011](RFC-011-多租户-运维模块经内部契约读取租户数据（Draft）.md) 一起发布根 v3.4.0

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 通知怎样算发成功、失败了怎么办，现在没有一份 ACTIVE 文档写明：
   - 根 3.3.0 只在 Capability 目录里列出 `NotificationCapability`（CAP-001），没有写送达语义；
   - super-admin 4.0.1 有三处把它交给"活动通知专项"：NOTIFY-003、§15.4 末段、§18 关系表。这份专项不存在。
2. 负责人 2026-11-08 批准了决定稿 D103～D108。按 D108，本 RFC 把 D103～D107 的要点写成根的一条新条款 `BRX-RS-ERROR-017`，放在 §4.7（Capability 特殊边界）：
   - 同步、fail-closed，在 Unit of Work 提交前的最后一刻发出（D103）；
   - 每一步有超时，整次发送不超过调用的截止时间（D104）；
   - 写明残余窗口，通知能力自己不重试（D105）；
   - 令牌和内容不外泄（D106）；
   - 按模板和结果计数、计时，失败记日志（D107）。
3. 起草时核对了代码和根的原文，有两处要写得比决定稿更准：
   - **跨 Owner 发信**：首位 OWNER 受邀人的身份设置邮件，是 platform-tenant 调用 platform-identity 时，由 platform-identity 在自己的 Unit of Work 里发出的。按 DATA-029，这个 Unit of Work 先于调用方提交。调用方之后失败，邮件里的链接是有效的，不是 D105 说的"从没生效"。新条款的残余窗口按"发信的 Owner 自己的 Unit of Work"来写，两种情况都写明；并要求同一用途重发时作废旧令牌，现有代码已经这样做（§1.2）。
   - **DATA-029 说的通知**：DATA-029 写着"需要独立于主事务提交的副作用（如审计、通知）MUST 经 Outbox / Integration Event"。新条款的通知不独立于主事务：发送失败就让它回滚，所以不在这句的范围内。要独立于主事务的通知（例如身份认证 ABUSE-002 将来的安全通知）仍按 DATA-029 走事件，由 Event Handler 在自己的 Unit of Work 里按新条款发送。新条款写明了这一点，两条不冲突。
4. 插件面的方法签名不变。三处发信的 Owner 代码都不捕获 `NotificationException`，不用改。
5. 建议与 RFC-009、RFC-010、RFC-011 一起发布根 v3.4.0（Minor，`compatibilityEpoch` 保持 1）。super-admin 4.0.2 同时含 RFC-009 §3 的继承版本改动和本 RFC 的三处；另外三份专项不因本 RFC 改动。

---

## 1. 背景

### 1.1 现行条款

| 文档 | 条款 | 现文（摘） |
|---|---|---|
| 根 3.3.0 | CAP-001 | Capability 目录"外部集成"一行列出 `NotificationCapability`，全文再没有提到它 |
| 根 3.3.0 | RESILIENCE-001 | "所有同步边界 MUST 有 deadline、并发上限、bulkhead 和取消传播" |
| 根 3.3.0 | DATA-029 | "需要独立于主事务提交的副作用（如审计、通知）MUST 经 Outbox / Integration Event，或经对应 Data Owner 的契约完成"；"调用其他 Owner 时 MUST 挂起当前事务" |
| 根 3.3.0 | ERROR-013 | Error Boundary 把非空 traceId 写入外部 Error Envelope、结构化日志和审计记录 |
| super-admin 4.0.1 | NOTIFY-001 | 安全链接只经 NotificationCapability 的受管侧信道发送；HTTP 响应、日志、审计、Trace、指标和前端持久化里不得含 raw token、完整 URL、正文或 variables |
| super-admin 4.0.1 | NOTIFY-003 | "邮件不是 MFA。SMTP 接受不等于送达；同步 fail-closed 和提交后残余窗口由活动通知专项唯一声明，不得同时保留隐式 Outbox/重试方案。" |
| super-admin 4.0.1 | §15.4 末段 | "邮件提交失败和事务提交后残余窗口必须只按活动通知专项处理。不得通过返回 URL、日志打印或假通知 Adapter 补偿。" |
| super-admin 4.0.1 | §18 关系表 | "通知活动计划/未来专项"：NotificationCapability、投递失败、SMTP 与安全链接投递语义；不得被本文重定义 |
| multi-tenant 5.1.3 | §5.7 第 4 条 | 邀请 token 一次性、带有效期，数据库只存 hash；重发后旧 token 失效；邀请链接只能经 `NotificationCapability` 发送 |
| frontend 1.2.1 | ROUTE-004、FE-7 | 安全 Token 不得进入查询串、存储、日志和遥测 |
| identity-auth 1.0.1 | ABUSE-002 | 新设备登录、凭证变更、MFA 重置、会话撤销 MUST 通知身份持有人 |

### 1.2 现行实现（2026-11-09 核实）

| 环节 | 现在 | 出处 |
|---|---|---|
| 接口 | L2A `NotificationCapability` 有 `send(NotificationRequest)` 和旧的 `sendSetupLink`；失败抛 `NotificationException`，发送失败的错误码是 `notification.delivery.failed` | runtime-sdk-api |
| 发送 | 在调用方线程上渲染模板、经 SMTP 发出；`send` 返回时，邮件已经交给 SMTP | `NotificationApplicationService` |
| 时间上限与指标 | 连接 5 秒、读写各 10 秒的超时，整次发送不超过调用的截止时间，到点关连接；按模板和结果计数、计时，失败记 WARN（第 14a 点，D104、D107） | SMTP 适配器、通知服务 |
| 三处发信 | 都在 Owner 的 Unit of Work 里、提交之前：建首位超管（发信之后还要消费 Bootstrap 会话、写两条审计事实）；建邀请、重发邀请（之后由端点保存答案）；受邀人设置完成后补发邀请（事件 Handler，之后与 Inbox 一起提交）。没有一处捕获 `NotificationException` | platform-identity、platform-tenant |
| 跨 Owner | 建邀请、重发邀请时，如果受邀邮箱还没有已激活的身份，platform-tenant 调用 platform-identity 的契约，由它发身份设置邮件。platform-identity 的 Unit of Work 挂起调用方的事务、另开一个，返回时就提交。这一步是 platform-tenant 服务方法的最后一步 | `IdentityFirstOwnerInviteeSetupCapabilityImpl`、`OwnerUnitOfWork`、`FirstOwnerInvitationService` |
| 重发作废旧令牌 | platform-identity 签发新的设置令牌之前，先把同一用途的有效令牌标为已用；邀请的重发也作废旧邀请（multi-tenant §5.7） | `issueTenantOwnerSetupToken`、`FirstOwnerInvitationService.resend` |
| 链接里的令牌 | 邀请邮件、身份设置邮件放在片段 `#token=`；首位超管的设置链接放在查询串 `?token=`（决定稿 §5，已在标准链路收尾方案 §11.1 的待办） | 同上；`PlatformBootstrapAdministrationService` |

### 1.3 问题

| 问题 | 后果 |
|---|---|
| 送达语义没有 ACTIVE 依据 | 插件作者不知道 `send` 返回意味着什么、失败后怎么办；super-admin 指向的专项不存在 |
| 发信之后还有写入 | 后面的写入或提交失败时，邮件已经发出，令牌从没生效；同一个键重试会再发一封（决定稿 §1.3） |
| 时间上限只有 RESILIENCE-001 的笼统要求 | 第 14a 点已经补上，但通知的条款里没有写 |

### 1.4 业界做法

见决定稿 §2（2026-11-08 查阅）：事务性 Outbox、Spring 的事务绑定事件、OWASP 对一次性令牌的要求，以及 JavaMail 默认无限等待引起的故障。

---

## 2. 根蓝图的改动（v3.4.0）

### 2.1 §4.7 的表加一行

| Capability | MUST 暴露 | MUST NOT 暴露 |
|---|---|---|
| Notification | 按模板键、收件人和变量发送一条通知；送达语义见 ERROR-017 | 发送渠道的客户端（如 SMTP Transport）、服务器配置与凭证、渲染后的正文、送达回执、自动重试 |

### 2.2 新增 ERROR-017：通知的送达语义

- **[BRX-RS-ERROR-017]** `NotificationCapability` 的送达语义：
  1. **同步、fail-closed，提交前最后一刻发出**。实现 MUST 在 `send` 时校验请求和模板，有错立即抛出。在 Unit of Work 里调用时，交给发送渠道这一步 MUST 挂到调用所在的 Unit of Work，在它提交前的最后一刻进行：这个 Unit of Work 的全部写入（包括 Runtime 代 Owner 写入的端点答案、Inbox、Outbox 与审计记录）都已写入数据库之后、提交之前。同一个 Unit of Work 里的多次发送按调用顺序进行，前一次失败时后面的不再发送。任何一次被拒收、出错或超时，这个 Unit of Work MUST 回滚，调用方得到稳定错误 `notification.delivery.failed`；Unit of Work 因别的原因回滚时，挂着的发送 MUST 丢弃。不在 Unit of Work 里调用时，实现 MUST 立即发送，失败时抛出同一错误。`send` 返回不表示已经发出。
  2. **时间上限**。与发送渠道的每次连接、读、写 MUST 有超时，整次发送 MUST 在这次调用的截止时间内结束（RESILIENCE-001）；超时按发送失败处理。
  3. **残余窗口**。已经发出、提交还没完成时，如果提交失败或进程崩溃，通知已经发出而写入回滚，其中的令牌从未生效。Owner 被另一个 Owner 调用、在自己的 Unit of Work 里发送通知时（DATA-029），它先于调用方提交，调用方之后失败也不会撤回它，这时链接有效。两种情况下，调用方重试都会再发一次。Owner 在同一用途重发时 MUST 作废此前签发的令牌，使只有最新一次通知里的链接有效。
  4. **不自动重试**。实现 MUST NOT 自动重试，MUST NOT 经 Outbox 或其他持久队列延后发送。重试只来自调用方：入口按结果重放，提交之后的重试取回原答案、不再发送；Event Handler 按事件的重试策略重试，次数用完后停放（MESSAGE-028）。需要独立于主事务的通知按 DATA-029 经 Integration Event，由 Event Handler 在自己的 Unit of Work 里按本条发送。
  5. **接收不等于送达**。发送成功只表示发送渠道（例如 SMTP 服务器）已经接收，不表示已经送达收件人。
  6. **令牌与内容**。原始令牌只存在于内存和通知正文里；带一次性令牌的链接 MUST 把令牌放在 URL 片段，MUST NOT 放在查询串。通知的变量、渲染后的正文、链接和令牌 MUST NOT 进入回答、日志、审计、Trace 和指标。
  7. **可观测**。实现 MUST 按模板键和结果计数并计时，结果至少分为送出、拒收、超时和其他失败，标签只用这两项。发送失败 MUST 记一条结构化日志，带脱敏的收件人、模板键、结果和非空 traceId（ERROR-013），不带正文、变量、链接和令牌。

告警属于主机运维：第 14a 点已经加了 `BrixNotificationDeliveryFailing`，不写进根。

### 2.3 其余同步

- 附录 A：版本随 RFC-009 改为 3.4.0；ERROR 组的 gate 加 `notification-delivery-test`，覆盖 ERROR-017 的七项。
- Changelog 记录本次修订；§12.2 的说明与 RFC-009、RFC-010 合写为"v3.4.0 是对 v3.3.0 的 Minor 修订（命令幂等的请求指纹、结果与状态，RFC-009；Dispatcher 先做访问检查、再校验请求，RFC-010；通知的送达语义，RFC-012）"。
- DATA-029 不改：§0 第 3 项的解读写在 ERROR-017 第 4 项里。其余正文不变。

---

## 3. 专项蓝图

| 现行 ACTIVE | 新版本 | 本 RFC 的改动 |
|---|---|---|
| super-admin 4.0.1 | 4.0.2 | 三处改为引用根 ERROR-017（见下）；继承版本的改动同 RFC-009 §3 |
| identity-auth 1.0.1、frontend 1.2.1、multi-tenant 5.1.3 | 1.0.2、1.2.2、5.1.4 | 不因本 RFC 改动：ABUSE-002、ROUTE-004 与 FE-7、§5.7 都与新条款一致 |

super-admin 4.0.2 的三处：

1. NOTIFY-003 改为："邮件不是 MFA。SMTP 接受不等于送达。同步 fail-closed、提交后的残余窗口和不自动重试按根 `BRX-RS-ERROR-017` 执行，本文不另行声明，也不得保留隐式 Outbox/重试方案。"
2. §15.4 末段改为："邮件提交失败和事务提交后的残余窗口按根 `BRX-RS-ERROR-017` 处理。不得通过返回 URL、日志打印或假通知 Adapter 补偿。"
3. §18 关系表的"通知活动计划/未来专项"一行：文档一栏改为"根 `BRX-RS-ERROR-017`（RFC-012）"，关系一栏改为"NotificationCapability 的送达语义；渠道、偏好与退信处理等到需要时另立通知专项。不得被本文重定义"。

规则编号、红线与兼容代际（`3`）不变，`rebaseRequired=true` 不变。按根 §12.2，这是"纠错但不改变可观察契约/红线"的 Patch，由本 RFC 的批准一并覆盖。RFC-009 §3 写的是专项"只改继承版本"，发布前要把这三处写进去，做法与 RFC-011 的五处相同。登记按 super-admin §18.2 的做法：先写出 4.0.2（Freeze Candidate），在 lock 中登记为不指导施工的 CANDIDATE；批准后登记哈希、commit 与批准记录，4.0.1 转为 SUPERSEDED。

---

## 4. 影响与施工（批准、发布之后）

| 层 / 模块 | 影响 |
|---|---|
| 通知能力的实现（platform-notification、持久化适配器） | 在 Unit of Work 里调用时，校验、渲染后把发送登记到这个 Unit of Work 的提交前一步：先把写入刷到数据库，再按顺序发送；失败抛出，Unit of Work 回滚。不在 Unit of Work 里时立即发送。超时和指标第 14a 点已经做了，不变 |
| L2B Dispatcher、事件与命令投递 | 提交时抛出的发送失败：入口按 `notification.delivery.failed` 回答，端点答案随回滚丢弃；事件、命令按 Handler 失败处理（重试、停放） |
| 插件（platform-identity、platform-tenant） | 不用改 |
| 测试 | 发送排在最后一次写入之后（审计事实、端点答案、Inbox）；发送失败时这些写入都回滚；Unit of Work 因别的原因回滚时不发送；不在 Unit of Work 里立即发送；同一个 Unit of Work 的两次发送按顺序，第一次失败时不发第二次；模板错误在 `send` 时立即抛出；跨 Owner 时在被调用方的 Unit of Work 提交前发出；提交前的发送仍受调用的截止时间约束；不自动重试 |
| 一次性回归 | 第 14a 点的"邮件服务器不回话"一段照旧通过；加一项：发信之后的写入失败时，没有邮件发出 |
| 文档 | 作者文档的通知一节写明送达语义；变更记录 |

施工按标准链路收尾的做法单独成一点（§11.1 队列里"通知能力在 Unit of Work 里改为提交前最后一刻发信"那一项）：代码、测试、两种传输的一次性回归、反证、文档，部署要负责人批准。之后三种通知各按新语义核对一次（决定稿 §6 第 4～6 项）。

---

## 5. 兼容、风险与回滚

- **兼容**：方法签名、错误码不变；发送成功和失败时，调用方得到的回答不变；Owner 代码不捕获 `NotificationException`，不用改。
- **行为变化**：

  | 情形 | 现在 | 改后 |
  |---|---|---|
  | 发信之后的写入失败 | 邮件已发出，令牌从没生效，链接打不开 | 邮件不发 |
  | 发出之后提交失败或进程崩溃 | 邮件已发出，令牌从没生效 | 不变（残余窗口，ERROR-017 第 3 项） |
  | 跨 Owner：被调用方已经提交，调用方之后失败 | 邮件已发出，链接有效 | 不变（第 3 项写明；重发作废旧令牌） |
  | `send` 返回时 | 邮件已经交给 SMTP | 在 Unit of Work 里时还没发出 |

- **风险**：

  | 风险 | 对策 |
  |---|---|
  | 提交前发信时，SMTP 慢会拉长持锁的时间 | 第 14a 点的超时和截止时间已经限住（读超时 10 秒；建、重发首位 OWNER 邀请的截止时间 15 秒） |
  | 提交前还有别的挂点，发信不是最后一步 | 实现把发信排在提交前的最后一步，测试覆盖 |
  | 提交阶段读不到这次调用的截止时间 | 施工时核对；读不到就按 `send-timeout` 封顶 |
  | 首位超管的设置链接把令牌放在查询串，根 3.4.0 生效后它也违反 ERROR-017 第 6 项 | 负责人 2026-11-13 选登记豁免（标准链路收尾方案 §10.53，D127）：EX-2026-006 豁免 FE-7、ROUTE-004，到身份认证 M1 切片 4；本 RFC 生效的同一次改动把本条（`BRX-RS-ERROR-017`）补进它的规则清单 |

- **回滚**：代码退回立即发送即可，没有数据迁移。蓝图层面的回滚要新的 RFC，不能静默改回（GOVERNANCE-009）。

---

## 6. 备选

| 方案 | 做法 | 不选的理由 |
|---|---|---|
| A（推荐） | §2：同步、fail-closed，在发信 Owner 自己的 Unit of Work 提交前的最后一刻发出 | — |
| B | 提交后再发，加送达记录和显式重发 | SMTP 失败时写入已经提交，调用方拿到成功；每个 Owner 要加送达记录表和"未送达、重发"界面（决定稿 D103 的备选 B） |
| C | 事务性 Outbox 加自动重试 | 原始令牌要么落库，要么发信时回调 Owner 重签；NOTIFY-003 也不许隐式的 Outbox 或重试（D103 的备选 C） |
| D | 跨 Owner 时，被调用方的邮件推迟到最外层 Unit of Work 提交前再发 | 把一个 Owner 的副作用绑到另一个 Owner 的事务上，与 DATA-029 让各 Owner 事务分开的做法相反；被调用方的写入照样已经提交；现在唯一的跨 Owner 发信是 platform-tenant 服务方法的最后一步，窗口差别很小 |
| E | 另立通知专项蓝图 v1.0 | 要新的蓝图、注册表领域和整套审批，而内容现在只有这几条（D108 的备选） |
| F | 只改 super-admin | 多租户、身份认证的通知没有依据（D108 的备选） |
| G | 保持现状 | §1.3 的问题都还在 |

---

## 7. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的根蓝图改动与 §3 的 super-admin 4.0.2 三处，随根 v3.4.0 发布。批准记录写入本文状态行和 lock，施工提交引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | 待批 | — |
| security | 待批 | — |
| sre | 待批 | — |
