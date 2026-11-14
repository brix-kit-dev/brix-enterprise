# RFC-010：Dispatcher 先做访问检查、再校验请求（Draft）

> **文档类型**：RFC（根级 Minor RFC，按根 §12.2"新增向后兼容 Capability/Manifest/红线"一行：改写 MANIFEST-022 的拦截顺序，通过访问检查的调用不受影响）
> **状态**：已批准（2026-11-13，architecture-committee、security、SRE，决定记录 `user-authorization:2026-11-13:rfc-010`）。条款已并入根蓝图 v3.4.0 的 MANIFEST-022，2026-11-14 生效（标准链路收尾方案 §10.63）；按 §4 的施工是单向门队列第 10 项，2026-11-14 完成（标准链路收尾方案 §10.65、§10.66），豁免 EX-2026-007 随之移除。本文是决策背景，**不指导施工**，施工依据是根蓝图 v3.4.0
> **起草日期**：2026-11-08
> **依据基线**：runtime-shell 3.3.0（ACTIVE 根蓝图）；identity-auth 1.0.1、frontend 1.2.1、super-admin 4.0.1、multi-tenant 5.1.3（ACTIVE）
> **来源**：[标准链路收尾方案](../v3.3.0-运行壳-标准链路收尾-设计方案.md) §11 第 12 点、§8 第 13 项、§10.7 第 3 项
> **拟决定**：改写 MANIFEST-022：访问检查（认证、tenant context、权限）排在请求规范化与 Schema 校验之前；与 [RFC-009](RFC-009-运行壳-命令幂等的请求指纹、结果与状态（Draft）.md) 一起发布根 v3.4.0

本文沿用根蓝图的 RFC 2119 关键词约定。

---

## 0. 结论

1. 根 MANIFEST-022 把"请求规范化 + Schema 校验"排在认证之前，现行实现照做。没有有效身份的调用（没带令牌，或令牌无效、过期）：
   - 请求合格，答 401；
   - 请求不合格，答 400 `endpoint.invalid_request`，正文列出违反的字段路径和规则名。
2. 这带来三个问题：
   - 没有身份的人也能逐字段试出入口的请求结构，超管和运维入口也一样；
   - 没有身份、没有权限的请求也要做解析、Schema 校验和类型转换，这些都是白做的；
   - 回答的先后颠倒：调用方先把请求改对，才知道自己没有身份或权限。
3. 业界的做法是先认证、授权，再校验请求：Google AIP-211 要求服务在校验任何请求之前检查授权；Kubernetes API Server 依次做认证、授权、准入，最后才校验对象。
4. 本 RFC 把整段访问检查（认证、tenant context、权限）移到请求规范化与 Schema 校验之前，其余各步的先后不变。请求正文的解析属于请求规范化，也排在访问检查之后。
5. 通过访问检查的调用，回答与现在相同。变的只是访问检查不通过、请求又不合格的调用：现在答 400，改后答 401 或 403，不再给出违反项。
6. 现行的访问检查只用 Runtime 验证过的调用方属性，不读请求正文。改顺序不用改插件代码、Manifest、Handler 签名或错误码。
7. 建议与 RFC-009 一起发布根 v3.4.0（Minor，`compatibilityEpoch` 保持 1）。四份专项的新版本由 RFC-009 §3 的清单统一安排，本 RFC 不另出。

---

## 1. 背景

### 1.1 现行条款

[BRX-RS-MANIFEST-022]："Dispatcher 的拦截顺序固定为："

```text
route snapshot + in-flight admission
 -> trace context extract/validate and server span
 -> request normalization + schema validation
 -> authentication
 -> tenant context resolution
 -> permission/resource authorization
 -> deadline + rate limit + bulkhead + cancellation
 -> idempotency admission/replay
 -> EndpointHandler
 -> response schema validation
 -> stable error mapping + security audit + telemetry finalization
```

紧接着的一条："认证失败、tenant context 不满足声明、权限拒绝、请求 Schema 无效、deadline 超限或幂等冲突 MUST 在 Handler 调用前 fail-closed"。它只要求在 Handler 之前拒绝，不规定这几种拒绝谁先谁后。

根蓝图里只有 MANIFEST-022 写了这个顺序。四份 ACTIVE 专项都不依赖它；multi-tenant CONTRACT-007 引用的是 MANIFEST-022 交给 Handler 的访问判定，与顺序无关。

### 1.2 现行实现

| 环节 | 现在怎么做 | 出处 |
|---|---|---|
| 令牌 | 主机的 `SecurityContextFilter` 校验 Bearer 令牌。令牌无效或过期时只记 debug、不拒绝，请求按"没有已验证身份"往下走。所以没带令牌和令牌无效走的是同一条路 | brix `platform-auth-servlet`，过滤器挂在 `/api/*`；企业主机 `host-shell-standalone` 依赖这个模块 |
| 正文解析 | Spring 在 Dispatcher 之前把 JSON 正文解析成对象。单向门队列第 7 项（D123）起同时留下原文字节，类型化 Handler 的请求按原文读数字 | `RuntimeShellEndpointController` 的 `@RequestBody(required = false) Object body`；`EndpointJsonBodyAdvice` |
| 顺序 | Dispatcher 先做请求规范化与 Schema 校验，再做访问检查（认证、令牌策略、tenant context、权限），然后是截止时间、并发上限、幂等、Handler | `DefaultPluginEndpointDispatcher.dispatch` |
| 访问检查的输入 | 只有 Runtime 验证过的调用方属性：身份、tenant、令牌的角色、类型和范围、权限、tenant 角色类型和成员 id。不读请求正文、路径参数或查询参数 | `EndpointAccessGuard.enforce(route, caller, grants)` |
| 400 的回答 | `errorCode`、`message`、`violations`、`traceId`。每条违反项是字段路径和规则名，不带值，例如 `additionalProperties`、`maximum`、`minLength` | `RuntimeShellEndpointController.failure`；`TypedEndpointDispatcherTest` |
| 共享环境 | 第 10b-1 点部署后（2026-11-05），经 HTTPS 入口不带身份调用首位 OWNER 接受入口：请求合法答 401 `ENDPOINT_AUTHENTICATION_REQUIRED`，请求不合法答 400 `endpoint.invalid_request` | 标准链路收尾方案 §10.22 |

### 1.3 问题

| 问题 | 现在 | 后果 |
|---|---|---|
| 请求结构外泄 | 没有身份的调用也做 Schema 校验，并列出违反项 | 任何人都能逐字段试出入口的字段名、必填项、长度和取值范围、许不许多余字段，超管和运维入口也一样 |
| 白做的工作 | 访问检查不通过的请求，也要解析、校验、类型转换 | 匿名流量照样消耗这些资源；截止时间和并发上限都排在访问检查之后，挡不住这一段 |
| 回答先后颠倒 | 400 先于 401、403 | 调用方先改请求，改对了才发现没有身份或权限 |

### 1.4 业界做法

2026-11-08 查阅：

- [Google AIP-211](https://google.aip.dev/211)（Authorization checks）："Services **must** check authorization before validating any request, to ensure both a secure API surface and a consistent user experience." 授权不通过一律答 `PERMISSION_DENIED`（HTTP 403），以免泄露资源是否存在。
- [Kubernetes：Controlling Access to the Kubernetes API](https://kubernetes.io/docs/concepts/security/controlling-access/)：请求依次经过认证（不通过答 401）、授权（拒绝答 403）、准入控制，通过之后才按对象的校验规则校验，然后写入存储。

两者都把"你是谁、能不能做"放在"请求对不对"之前。

---

## 2. 根蓝图的改动（v3.4.0）

### 2.1 改写 MANIFEST-022 的顺序

```text
route snapshot + in-flight admission
 -> trace context extract/validate and server span
 -> authentication
 -> tenant context resolution
 -> permission/resource authorization
 -> request normalization + schema validation
 -> deadline + rate limit + bulkhead + cancellation
 -> idempotency admission/replay
 -> EndpointHandler
 -> response schema validation
 -> stable error mapping + security audit + telemetry finalization
```

只移动"request normalization + schema validation"一行，其余各步的先后不变。

### 2.2 MANIFEST-022 新增两条

- 认证、tenant context 与权限检查 MUST 只使用 Runtime 验证过的调用方属性，MUST NOT 读取请求正文；协议适配器 MUST NOT 在访问检查之前解析请求正文，正文不能解析时按请求无效处理（`endpoint.invalid_request`）。需要请求内容的资源级判断，仍由 Handler 按 Dispatcher 交给它的访问判定执行（multi-tenant CONTRACT-007）。
- 访问检查不通过的调用 MUST 以认证或授权错误拒绝（401 或 403），MUST NOT 得到请求 Schema 的违反项。

### 2.3 其余同步

- 附录 A 不变：MANIFEST 组的 gate 和登记方式不变，版本号随 RFC-009 改为 3.4.0。
- 勘误（2026-11-13，9c，负责人确认）：附录 A 的 `rootConstraints.httpDispatcher.interceptorOrder` 是 MANIFEST-022 顺序的机器可读副本，随 §2.1 一起改，`request-schema-validation` 挪到 `authorization` 之后，否则根自相矛盾。上一条说的不变，指 MANIFEST 组的 gate 和登记方式（标准链路收尾方案 §10.55）。
- Changelog 记录本次修订；§12.2 的说明与 RFC-009 合写为"v3.4.0 是对 v3.3.0 的 Minor 修订（命令幂等的请求指纹、结果与状态，RFC-009；Dispatcher 先做访问检查、再校验请求，RFC-010）"。
- 其余正文不变。

---

## 3. 专项蓝图

不另出版本。四份 ACTIVE 专项都不依赖这个顺序（§1.1）。与 RFC-009 一起发布时，RFC-009 §3 的清单已经让四份专项都继承根 3.4.0。如果本 RFC 单独发布，四份专项要各出一个只改继承版本的 Patch。

---

## 4. 影响与施工（批准、发布之后）

| 层 / 模块 | 影响 |
|---|---|
| L2B runtime-orchestrator | Dispatcher 先做访问检查，再规范化和校验请求；协议适配器把正文原样交给 Dispatcher，在访问检查之后解析，类型化端点仍按原文读数字（D123）；正文不能解析时答 400 `endpoint.invalid_request` |
| 插件 | 不用改。Handler 拿到的仍是校验后的输入和访问判定 |
| 测试 | 新增：没有身份、请求不合格时答 401；没有权限的答 403；两者都不带违反项；通过访问检查的仍答 400 并列出违反项；没有身份、正文不是 JSON 时答 401。现有断言 `endpoint.invalid_request` 的测试和回归脚本，调用方都通过了访问检查或入口是匿名的，不用改 |
| 一次性回归 | 加一项：经入口不带身份、请求不合格，答 401 |
| 文档 | 作者文档的错误一节写明回答的先后；变更记录 |
| 指标与日志 | 访问检查不通过、请求又不合格的调用，结果从"请求无效"变成"认证或授权拒绝"；403 记 WARN，这类调用的 WARN 会略多 |

施工按标准链路收尾的做法单独成一点：代码、测试、两种传输的一次性回归、反证、文档，部署要负责人批准。

---

## 5. 兼容、风险与回滚

- **兼容**：Manifest、Handler 签名、错误码、Envelope 都不变；通过访问检查的调用，回答不变。
- **行为变化**：

  | 调用 | 现在 | 改后 |
  |---|---|---|
  | 没有身份，请求合格 | 401 | 401 |
  | 没有身份，请求不合格 | 400，带违反项 | 401 |
  | 没有身份，正文不是 JSON | 500 `PLATFORM-S-001`（见 §6） | 401 |
  | 有身份，但令牌不被接受、tenant 不符或没有权限，请求不合格 | 400，带违反项 | 403 |
  | 通过访问检查，请求不合格 | 400，带违反项 | 不变 |
  | 匿名入口、tenant context 符合声明，请求不合格 | 400，带违反项 | 不变（匿名入口没有认证这一步） |

- **风险**：

  | 风险 | 对策 |
  |---|---|
  | 客户端靠 400 的违反项排错，没带身份时就看不到了 | 先带上身份；带身份的调用照常拿到违反项 |
  | 解析挪到访问检查之后，坏正文的回答出错（例如答成 500） | 测试覆盖坏 JSON、空正文，有身份和没有身份各一遍 |
  | 访问检查将来想读请求内容 | §2.2 不允许；需要请求内容的判断留在 Handler，按访问判定的数据范围做 |

- **回滚**：代码退回 3.3.0 的顺序即可，没有数据迁移。蓝图层面的回滚要新的 RFC，不能静默改回（GOVERNANCE-009）。

---

## 6. 相关发现（不在本 RFC 内）

- **坏 JSON 答 500**：正文由 Spring 在 Dispatcher 之前解析，解析失败落到主机的全局兜底异常处理，答 500 `PLATFORM-S-001`"Internal server error"，记一行带堆栈的 ERROR，也不是运行壳的错误信封。2026-11-08 用临时探针在 MockMvc 上实测（用的是主机同一个异常处理器），主机上没有实测。本 RFC 施工时会一并改掉（§2.2）；本 RFC 不批准的话，单独修。记在标准链路收尾方案 §11.1 的待办。
- **请求正文没有大小上限**：HTTPS 入口（Caddy）和主机配置里都没有找到 JSON 正文的上限，只有 multipart 有。没有实测。同样记在待办。
- 单向门队列里"类型化端点的小数是否丢位"（第 10a 点发现）也出在 Spring 先解析正文这一步，已由该队列第 7 项解决（D123、D124，标准链路收尾方案 §10.50）：Spring 照旧先解析，同时留下原文，类型化端点按原文读数字。本 RFC 施工、改由 Dispatcher 解析正文时，要保住这一点。

---

## 7. 备选

| 方案 | 做法 | 不选的理由 |
|---|---|---|
| A（推荐） | 整段访问检查排在请求规范化（含正文解析）与 Schema 校验之前 | — |
| B | 只把认证提前，tenant 与权限检查仍在校验之后 | 有身份、没有权限的人（例如任何租户成员）仍能试出平台入口的结构；与 AIP-211 不符 |
| C | 正文仍由 Spring 先解析，只把 Schema 校验挪到访问检查之后 | 改动最小；但没有身份的人发坏 JSON 仍先得到 400，大正文仍在访问检查之前解析 |
| D | 顺序不变，没有身份时 400 不带违反项 | 结构不再外泄，但校验仍是白做，回答先后仍然颠倒 |
| E | 保持现状 | §1.3 的三个问题都还在 |

---

## 8. 审批

需要 architecture-committee、security、SRE 批准。批准范围：§2 的根蓝图改动，随根 v3.4.0 发布。批准记录写入本文状态行和 lock，施工提交引用本 RFC。

| 角色 | 记录 | 批准时间 |
|---|---|---|
| architecture-committee | `user-authorization:2026-11-13:rfc-010:architecture-committee` | `2026-11-13T21:06:32+09:00` |
| security | `user-authorization:2026-11-13:rfc-010:security` | `2026-11-13T21:06:32+09:00` |
| sre | `user-authorization:2026-11-13:rfc-010:sre` | `2026-11-13T21:06:32+09:00` |

批准人：`jsq`。负责人 2026-11-13 答"全部批准，合并推送"（标准链路收尾方案 §10.54）。
