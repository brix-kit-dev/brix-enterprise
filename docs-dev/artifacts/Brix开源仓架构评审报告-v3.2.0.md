# Brix 开源仓架构评审报告（v3.2.0）

> 评审对象：`d:\1.Sources\brix`（开源仓，不含 brix-enterprise）
> 评审依据：《v3.0.10-运行壳架构设计蓝图》《架构评审可执行清单 v1.7》《评审提示》
> 评审标准：**最佳实践的最小实现**（非大厂满配标准）
> 评审方式：4 路并行全量代码审计（SDK 契约 / 后端实现链路 / 前端包与链路 / 开源就绪度）+ 人工抽查复核
> 所有结论均基于实际代码证据（文件路径 + 关键行为）

---

## 一、总体结论（TL;DR）

**总评级：B+（良好，接近 A-）—— 开源就绪、治理体系领先，但蓝图中若干"目标态机制"尚未落地，蓝图与代码存在命名漂移。**

| 维度 | 得分(0-10) | 一句话评语 |
|---|---|---|
| 架构合规性 | 8.0 | 红线绝大多数通过，22 条 ArchUnit 规则 + CI 门禁机器化执法；但蓝图 §4.3 跨插件查询机制整体缺失 |
| 解耦程度 | 8.5 | Capability 契约层干净（runtime-sdk-api 仅依赖 jakarta.annotation + slf4j-api），插件零直连中间件 |
| 可扩展性 | 7.5 | 插件 SPI / 适配器 / manifest 体系完整；但缺 @CapabilityVersion 与 API 兼容性门禁，演进护栏不足 |
| 可观测性 | 7.0 | 事件链 6 项 Micrometer 指标 + traceId 自动注入完整；但 Capability 层 AOP 自动埋点未实现 |
| 商业化/开源成熟度 | 8.5 | License 一致、零密钥泄露、CI 四件套、版本 3.2.0 全对齐、create-brix 脚手架完整 |
| 代码质量 | 8.0 | 113 个测试文件、覆盖率门禁 80/70、Git 卫生干净；少量中文注释与 localStorage 直用 |

**关键判断：**
1. **多租户功能：链路完整但未"全部落地"** —— 解析→过滤→上下文→SQL 注入拦截全链路存在且正确，但租户状态（ACTIVE/SUSPENDED）校验、TenantCapability 部分方法缺失，生产环境 SQL 守卫为"告警不阻断"。
2. **超管功能：与用户描述一致**，开源侧防伪装基础设施（@Profile("!production") 兜底、banned-tokens 扫描、NoStringRoleLiteralRule）齐备。
3. **v3.0.10 蓝图：可以作为总设计蓝图**，但必须先做一次"现状 vs 目标态"标注修订（详见第六章）。

---

## 二、架构红线逐条结论（开源仓适用范围）

> 标注说明：✅ 通过 ｜ ⚠️ 部分通过 ｜ ❌ 不通过 ｜ N/A 属商业仓/插件侧范围

### 2.1 通过项（核心红线）

| 红线 | 结论 | 证据 |
|---|---|---|
| R3 事件模型 | ✅ | `IntegrationEvent` 含全部强制字段（eventId/eventType/timestamp/traceId@Nonnull/tenantId/schemaVersion/correlationId/causationId）；`ensureTraceId()` 自动注入 |
| R6 Outbox | ✅ | `OutboxEventPublisher` + `CriticalEventOutboxAspect`（AOP 拦截 `@CriticalEvent(outbox=true)`），位于 infra-adapter-kafka-outbox |
| R9 中间件隔离 | ✅ | 全仓无插件层 `@KafkaListener`；`NoMiddlewareClientsRule` + `NoDirectHttpClientsRule` 机器执法 |
| R10 极薄宿主 | ✅ | `HostUltraThinRule`（≤30 行业务逻辑）+ 单测 |
| R11 开源/商业边界 | ✅(源码级) | 全仓零 `import io.brix.enterprise`（终端复核确认）；`NoEnterpriseToPlatformAdminRule` 存在。⚠️ 但 Maven enforcer 无 bannedDependencies 规则，未在构建期机器化封死 |
| R12 超管防伪装 | ✅ | RS256 非对称 JWT（密钥走 env/classpath，未提交）、tokenVersion=2、refresh token family 轮换、`NoStringRoleLiteralRule`、CI banned-tokens 扫描 |
| R13 数据隔离 | ✅ | Hibernate `TenantInterceptor`（StatementInspector 注入 tenant_id，白名单仅 sys_* 表）+ `TenantSqlGuardInterceptor` + `@CrossTenantAccess` 显式豁免 |
| R14 前端共享依赖 | ✅ | 全部 web 包 react/react-dom/router/zustand 均为 peerDependencies；`mf-shared-config.ts` 提供 host/remote 共享配置 |
| A-16 Capability 粒度 | ✅ | 27 个 Java Capability 接口均 ≤12 方法 |
| A-23 Fallback 防线 | ✅(等效实现) | `@Profile("!production")` 注解于 `FallbackCapabilitiesAutoConfiguration`，以 Spring Profile 机制等效实现（非蓝图所述独立 H-0 校验器，可接受） |

### 2.2 不通过 / 部分通过项（按严重度排序）

| # | 红线/条款 | 结论 | 问题描述 | 严重度 |
|---|---|---|---|---|
| 1 | **A-22 / R2.10 跨插件同步查询** | ❌ | `QueryCapability`、`QueryClientFactory`、`PluginQueryGateway`、类型化查询客户端**整体未实现**（终端复核确认零匹配）。蓝图 §4.3 整章为目标态 | **高** |
| 2 | **R17.7 @CapabilityVersion** | ❌ | 注解不存在 → 蓝图 H-1 启动期版本校验不可能执行 | **高** |
| 3 | **R17.6 brix-bom** | ❌ | 无 brix-bom 模块，直接用 spring-boot-dependencies BOM。蓝图 §3.3.1 为目标态 | 中 |
| 4 | **R17.8 BrixException 统一错误模型** | ❌ | 不存在；现状为零散 RuntimeException 子类（如 EventPublishException） | 中 |
| 5 | **R17.9 BrixPlugin/PluginContext SPI** | ❌(有等效物) | 蓝图 SPI 未实现；实际为 `AbstractModule` + `RuntimeContext` + `@Module` + `ModuleState` 状态机（REGISTERED→…→DESTROYED，与蓝图 DISCOVERED→…→STOPPED 命名不一致） | 中 |
| 6 | **S-9 / R12.11 ImpersonationCapability** | ❌ | 不存在；伪装语义散落在 `ViewModeCapability` 注释中，无独立契约约束"仅平台内部可调用" | 中 |
| 7 | **R16.1b TenantCapability 完整性** | ⚠️ | 有 getCurrentTenantId/getCurrentRole/isActor/isSubject，**缺** getCurrentRoleType/getCurrentRefId/getCurrentUserId | 中 |
| 8 | **R16.10 租户状态校验** | ❌ | 开源仓 platform-tenant 主链路（filter/interceptor）**无 SUSPENDED 租户拦截**（SUSPENDED 仅出现在 entity/enum/controller，过滤链不校验）→ 被暂停租户的存量 token 仍可访问 | **高** |
| 9 | **租户 SQL 守卫生产策略** | ⚠️ | `TenantSqlGuardInterceptor` dev 抛异常、**production 仅 WARN 日志**（fail-safe 而非 fail-closed）。最小实现可接受，但与"零容忍"语义不符 | 中 |
| 10 | **A-17 manifest 治理** | ⚠️ | plugin-manifest.schema.json 存在且严格（draft-07, additionalProperties:false），但**无 apiVersion 字段校验**；字段名与蓝图不一致（schema 用 `capabilities.required`/`events.publish`，蓝图用 `requires`/`publishes`） | 中 |
| 11 | **架构守卫规则覆盖缺口** | ⚠️ | 22 条规则已实现，但蓝图点名的 5 条缺失：plugin-no-l2b-back、query-typed-only、oss-no-enterprise(Maven级)、capability-version-monotonic、impersonation-internal-only | 中 |
| 12 | **PasswordCapability.needsRehash()** | ⚠️ | 蓝图 §4.2 要求，实际只有 hash/verify | 低 |
| 13 | **前端 localStorage 直用** | ⚠️ | `useLastTenant.ts`(L94/102/111)、`useTenantSwitch.ts`(L121)、`StateStore.ts`(L324/395) 直接调用 localStorage，无存储适配器；ESLint 仅靠 no-restricted-globals 模式拦截，且这些文件已违规存在 | 中 |
| 14 | **前端 ESLint 规则缺口** | ⚠️ | 8 条自定义规则已实现，缺 no-direct-ui-import、frontend-layered-arch 具名规则 | 低 |
| 15 | **R16.8 切租户后 token 刷新** | ⚠️ | `useTenantSwitch` 清缓存+导航，但未显式重新获取带新 tid 的 token | 中 |
| 16 | **Capability 层 AOP 自动埋点** | ❌ | infra-adapter-otel 存在（OTel 1.32.0），但蓝图 §4.2 L2B-Back 的 Capability 级自动 span/metric 拦截器未实现 | 中 |
| 17 | **中文残留** | ⚠️ | OAuth2FederationCapability/IdentityTenantCapability 中文 Javadoc；PlatformAdminBanner.tsx 中文 UI 默认值（有注释声明可 i18n 覆盖，属有意设计）；social-providers.ts（微信/支付宝登录，业务合理） | 低 |
| 18 | **shared-runtime-mobile / infra-adapter-rabbitmq** | ❌ | 蓝图列出但仓内不存在（mobile 系列均为 stub，可视为 WIP） | 低 |

### 2.3 开源就绪度（OS1~OS11）

全部通过，亮点突出：

- **OS-Git 卫生** ✅：无 dist/target/node_modules/.class/.pem/.env 入库；pre-commit 钩子 + .gitignore 含密钥防护段
- **OS-密钥** ✅：零真实密钥；key-export-tool 仅读 `JWT_KEYSTORE_PASSWORD` 环境变量
- **OS-License** ✅：Apache-2.0 在 LICENSE/README/package.json/全部 pom.xml 完全一致
- **OS-CI** ✅：architecture-check（lint/typecheck/ArchUnit/madge 循环依赖/banned-tokens）、dependency-scan（OWASP DC CVSS≥7 fail + pnpm audit high + GPL/AGPL 拒入）、code-coverage（JaCoCo 80/70 + Vitest 80%）、deploy-docs（Docusaurus→GitHub Pages）
- **OS-版本** ✅：全仓 3.2.0 完美对齐；Changesets + check-version-consistency.mjs 守护
- **OS-文档** ✅：Docusaurus 英文站 + TypeDoc API；README 与实际模块一一对应
- **OS-脚手架** ✅：create-brix 141 个模板文件（React/Rspack 前端 + Spring Boot 后端 + Docker + K8s）
- **OS-发布** ✅：npm 分 5 阶段发布（6/27 已发布），publish-all.ps1 按依赖序执行
- ⚠️ 改进点：pom 缺 spotless/checkstyle（可接受）、缺 japicmp/revapi（API 兼容性无构建期门禁，v4.0 前建议补）

---

## 三、链路级验证结论

### 3.1 多租户链路（后端）：✅ 完整且实现正确（含 2 处缺口）

```
JwtTenantResolver(优先级0, tid claim)
  → HeaderTenantResolver(优先级100, X-Tenant-ID)
  → TenantResolverChain(冲突检测 → TenantMismatchException)
  → TenantFilter(OncePerRequestFilter, Order=HIGHEST+100, finally{TenantContext.clear()} ✅)
  → TenantContext(ThreadLocal)
  → TenantInterceptor(Hibernate StatementInspector, SQL 注入 tenant_id, 白名单 sys_*)
  → TenantSqlGuardInterceptor(dev 抛异常 / prod 仅 WARN ⚠️)
```

- ✅ multi 模式下 defaultTenantId 被忽略，防跨租户兜底污染（TenantFilter L134，终端复核确认）
- ✅ 还有 PathTenantResolver/SubdomainTenantResolver 共 4 种解析器，无 Query 参数解析（安全）
- ❌ 缺口1：链路中无租户状态（SUSPENDED）校验
- ⚠️ 缺口2：生产 SQL 守卫 fail-safe 非 fail-closed

### 3.2 事件链路：✅ 完整

发布（EventBusCapability.publishIntegration）→ AOP Outbox 路由（@CriticalEvent）→ Kafka 适配器 → 消费（@EventHandler）。
可观测性：`event.published name=… tenantId=… traceId=… eventId=…` 结构化日志 + 6 项 Micrometer 指标（published/error/duration/consumed/retry/dlq）。
⚠️ 蓝图的 `@IntegrationEvent(reliability=…)` 三级可靠性注解未实现，现状为二元 `@CriticalEvent`。

### 3.3 前端链路：✅ 完整（中风险 2 项）

- 三层结构（api/components/hooks 或 pages/repositories/hooks/guards）在 platform-tenant-web、platform-admin-web 落地；fetch 仅存在于 infra-adapter-http-web ✅
- UIAdapter 契约 + ui-mui（39 组件）/ ui-native（纯 CSS 同集）双实现 ✅
- 租户链：TenantProvider→useTenant→TenantSelector/TenantSwitcher→useTenantSwitch ✅（token 刷新缺口见 2.2#15）
- 前端 EventBus：publish/subscribe + traceId + EventLatencyTracker(Prometheus 导出) + 背压指标 ✅
- ⚠️ localStorage 直用（2.2#13）

### 3.4 i18n 链路：✅ 完整

I18nCapability → I18nCapabilityImpl(platform-i18n-web) → useI18n → UI；zh-CN(默认)/zh-TW/en-US 三语。

---

## 四、文档对齐性评审（蓝图 ↔ 清单 ↔ 代码）

**结论：清单 v1.7 与蓝图 v3.0.10 对齐良好（清单忠实编码了蓝图条款），但两者与代码存在系统性"命名漂移 + 目标态混入"，共 8 处：**

| # | 文档说法 | 代码现实 | 性质 |
|---|---|---|---|
| 1 | 蓝图 §3.3.1 `brix-bom` | 不存在，用 spring-boot-dependencies | 目标态未落地 |
| 2 | 蓝图 §4.3 QueryCapability/类型化查询客户端/query-client-codegen | 全部不存在 | 目标态未落地 |
| 3 | 蓝图 L2B-Back 模块名 `runtime-sdk-runtime`/`capability-runtime` | 实际为 `runtime-orchestrator` | 命名漂移 |
| 4 | 蓝图插件 SPI `BrixPlugin`/`PluginContext`，状态机 DISCOVERED→RESOLVED→WIRED→STARTING→READY→DRAINING→STOPPED | 实际 `AbstractModule`/`RuntimeContext`/`@Module`，`ModuleState`=REGISTERED→INITIALIZING→…→DESTROYED；但 `CapabilityRegistry.State` 枚举与蓝图完全一致 | 部分漂移 |
| 5 | 蓝图 `PersistenceCapability` | 实际 `DataAccessCapability` + `DatabaseCapability` | 命名漂移 |
| 6 | 清单/蓝图 manifest 字段 `capabilities.requires`/`events.publishes`，文件名 plugin-manifest.yaml | schema 实际为 `capabilities.required`/`events.publish`，schema 文件为 .json | 字段名漂移 |
| 7 | Java 包名约定 io.brix.* | SDK 实际为 `io.runtime.sdk.*`、编排器 `io.runtime.orchestrator.*`、适配器 `io.infra.adapter.*` | 命名漂移（npm 包已发布，改名成本需评估） |
| 8 | 蓝图 §6.3 infra-adapter-rabbitmq、shared-runtime-mobile | 不存在 | 目标态/WIP |

✅ 对齐良好的部分：清单 R13.5 `{plugin_id}_outbox` 表名模式、CapabilityRegistry 状态枚举、事件信封强制字段、红线 A-1~A-23 绝大多数条款、启动校验 H-0 语义（以 @Profile 等效）。

---

## 五、工程质量评审（14 维摘要）

| 维度 | 评价 |
|---|---|
| 分层与依赖 | ✅ 优秀。runtime-sdk-api 零框架依赖；22 条 ArchUnit 规则含循环依赖/跨层/中间件直连全覆盖 |
| 测试 | ✅ 良好。86 Java + 27 TS 测试文件；JaCoCo 80/70 + Vitest 80% CI 门禁；ArchUnit 规则自身有 11 个测试 |
| 安全 | ✅ 良好。RS256、BCrypt(10-14)、refresh token 轮换、OWASP DC、无硬编码密钥。⚠️ 租户状态校验缺失为最大安全缺口 |
| 可观测性 | ⚠️ 中等。事件链完整，Capability AOP 埋点缺失，HTTP 链路追踪未验证 |
| 数据库治理 | ✅ Flyway 版本无冲突（tenant V001-V019, auth V1-V2 分目录） |
| 弹性 | ✅ Resilience4j 2.1.0（熔断/限流/隔板）已集成 |
| 前端工程化 | ✅ pnpm workspace + peerDependencies 纪律 + Rspack + Module Federation 共享配置 |
| 文档工程 | ✅ Docusaurus + TypeDoc + Mermaid，全英文面向国际社区 |
| 版本治理 | ✅ 3.2.0 全对齐 + Changesets + 一致性脚本 |
| CI/CD | ✅ 四工作流齐备，含每周定时 CVE 扫描 |
| 代码整洁 | ✅ 无 System.out（除 CLI 工具）、无死文件、无构建产物入库 |
| 国际化纪律 | ⚠️ ~10-15% Capability 接口含中文 Javadoc；2 处中文 UI 默认值（有意设计） |
| API 演进 | ❌ 弱项。无 @CapabilityVersion、无 japicmp、无统一错误模型 |
| 移动端 | ⚠️ 全为 stub，诚实标注 WIP，可接受 |

---

## 六、v3.0.10 蓝图评估：能否作为 Brix 总设计蓝图？

### 结论：**可以，但需先做一次 v3.0.11 修订**，否则"文档即真相"会变成"文档即愿望"。

**蓝图的设计水准（优点）：**
1. 原则→约束→红线（P-1~P-9 → C-1~C-11 → A-1~A-23/S-1~S-9）三级可追溯体系，这是大厂级文档结构
2. Capability 三维分级、L2B-Back/L2B-Front 对称拆分、启动校验 H-0→P-2 相位设计，逻辑自洽
3. 红线绝大多数有对应机器化执法（ArchUnit/ESLint/CI），"架构即代码"落实程度高于多数开源框架
4. 事件信封强制字段 + Outbox + 可靠性分级的事件治理设计完整
5. Ultra-Thin Host + 单向开源/商业边界，商业模式与架构耦合设计清晰

**设计漏洞 / 不符合最佳实践的点：**
1. **目标态与现状混排，无标注**——QueryCapability、brix-bom、@CapabilityVersion、BrixException、BrixPlugin SPI 等约 20% 内容代码中不存在。国际大厂蓝图惯例是明确标注 `Status: Implemented / Accepted / Proposed`（如 Rust RFC、Kubernetes KEP）。**这是蓝图最大的"漏洞"——不是设计错误，而是状态管理缺失。**
2. **版本演进设计有断点**：要求 H-1 做版本校验，但 @CapabilityVersion 不存在且无单调性守卫规则、无 japicmp 类工具兜底——版本治理仅停留在文字层面。
3. **错误模型章节薄弱**：BrixException 只有一句定义，缺错误码命名空间、跨插件错误传播、前端错误映射的设计。
4. **租户生命周期设计不完整**：蓝图聚焦租户隔离（解析/SQL 注入）但未规定租户状态机（ACTIVE/SUSPENDED/DELETED）在请求链路中的强制校验点——这直接导致了代码缺口 R16.10。
5. **生产环境守卫策略未明确 fail-closed vs fail-safe**：TenantSqlGuard 生产仅告警的决策在蓝图中找不到依据，应显式声明并给出风险接受记录。
6. **单 ClassLoader 取舍已声明但缺乏隔离故障的恢复设计**（插件 OOM/死循环对宿主的影响未讨论）。
7. **A-1 自己承认无声明式端点契约**——诚实，但建议给出 roadmap（如 OpenAPI 生成或 manifest 内嵌 endpoint 声明）。

---

## 七、设计亮点与时代性评价

### 7.1 亮点（领先或符合当下潮流）

1. **"运行壳 + Capability 契约"模式踩在潮流上**。与 Backstage 插件模型、VS Code Extension Host、Shopify App 平台同构：宿主极薄、契约先行、manifest 声明式注册。在 Java 生态中做到这个完成度的开源框架不多（对标 Spring Modulith 但治理更强）。
2. **架构即代码（Architecture-as-Code）执行度高**：22 条 ArchUnit + 8 条自定义 ESLint + banned-tokens CI 扫描 + 极薄宿主行数检查——红线不靠评审靠机器，这是 2024+ 的正确姿势。
3. **事件治理成熟**：强制信封字段 + traceId 自动注入 + Outbox AOP 透明化 + DLQ/retry 指标，超过多数同体量项目。
4. **开源/商业单向边界设计**干净（OSS 不知商业存在），符合 GitLab/Grafana 的 open-core 最佳实践。
5. **前端 peerDependencies + Module Federation 共享配置纪律**严格，微前端工程化到位。

### 7.2 不足（落后于时代或缺位）

1. **AI 能力完全缺位**（见 7.3）。
2. **API 演进护栏缺失**：对一个以"契约"为核心卖点的框架，没有版本注解、没有二进制兼容性门禁、没有统一错误模型，是最不应该的短板。
3. **声明式端点契约缺位**：当下潮流是 schema-first（OpenAPI/gRPC/TypeSpec），Brix 插件 REST 端点仍是命令式注册。
4. **可观测性停留在事件层**：缺 Capability 级自动埋点；尚未对齐 OTel Semantic Conventions。
5. **移动端承诺超前于实现**（全 stub），蓝图应降级表述。

### 7.3 AI 时代优化建议（重点）

Brix 的 Capability + manifest 体系**天然适合 AI 集成**，这是它最大的潜在红利：

1. **新增 LlmCapability / AgentCapability 契约**（L2A 层）：与 PasswordCapability 同级的一等公民契约，定义 complete/embed/tool-call 接口，infra-adapter-openai / infra-adapter-ollama 做适配器。插件由此获得"零厂商绑定"的 AI 能力——这与 Brix 中间件隔离哲学完全同构。
2. **把 CapabilityRegistry 暴露为 MCP Server**：Capability 接口 ≤12 方法、有 Javadoc、有 manifest 声明——这就是现成的 tool schema。一个 `brix-mcp-bridge` 模块可让任何 AI Agent 直接发现并调用宿主能力，Brix 立即变成"Agent 可编程平台"。
3. **manifest 即 AI 上下文**：plugin-manifest 已声明 capabilities/events 依赖关系，可直接生成 AGENTS.md / llms.txt，让 AI 编码助手秒懂插件边界。建议 create-brix 模板默认生成 AGENTS.md。
4. **AI 辅助插件脚手架**：create-brix 已有 141 个模板，下一步是 `create-brix --prompt "做一个工单插件"` —— 用 LLM 填充模板槽位，配合 ArchUnit 规则做生成后验证（红线规则成为 AI 生成代码的自动质检器，这是 Brix 治理体系在 AI 时代的独特优势）。
5. **事件流 + AI**：IntegrationEvent 信封已有 correlationId/causationId，天然适合喂给 AI 做异常检测/根因分析；建议对齐 OTel GenAI Semantic Conventions 预留 AI 调用追踪字段。
6. **租户级 AI 配额/审计**：多租户体系 + AI 能力结合时，TenantContext 应贯穿 LlmCapability 调用（per-tenant token 计量），这是商业版的天然卖点。

---

## 八、分阶段整改清单

> 原则：增量修改、不破坏现有功能、最小实现优先。每项标注 ⚠️ = 涉及行为变化需回归测试。

### Phase 1 — 阻断性（安全/正确性，建议 1-2 周内）

| # | 事项 | 修改方式 | 涉及模块 | 影响现有功能 |
|---|---|---|---|---|
| 1.1 | **租户状态校验**：TenantFilter 解析成功后校验租户 ACTIVE（带本地缓存），SUSPENDED 返回 403 | 新增校验步骤，可配置开关（默认开） | platform-tenant | ⚠️ 被暂停租户将立即失效（预期行为） |
| 1.2 | **生产 SQL 守卫 fail-closed 可配置**：新增 `brix.tenant.sql-guard.mode=warn\|block`，默认保持 warn，文档声明风险 | 加配置分支 | platform-tenant | 否（默认不变） |
| 1.3 | **补 TenantCapability 缺失方法**：getCurrentUserId/getCurrentRoleType/getCurrentRefId（default 方法返回 Optional.empty 保兼容） | 接口加 default 方法 | runtime-sdk-api | 否 |
| 1.4 | **Maven enforcer 加 bannedDependencies**：封死 io.brix.enterprise:* | 根 pom 加一条 enforcer 规则 | 根 pom | 否 |
| 1.5 | **切租户后 token 刷新**：useTenantSwitch 成功后触发 token 重取 | hooks 内补一次调用 | platform-tenant-web | ⚠️ 需前端回归 |

### Phase 2 — 治理性（蓝图对齐，建议 1-2 月内）

| # | 事项 | 修改方式 | 涉及模块 | 影响现有功能 |
|---|---|---|---|---|
| 2.1 | **蓝图 v3.0.11 修订**：所有未实现机制标注 `[目标态-Roadmap]`；命名全部对齐代码现实（runtime-orchestrator、AbstractModule/RuntimeContext、DataAccessCapability、ModuleState、capabilities.required/events.publish）；补租户状态机校验点设计；声明 SQL 守卫 fail-safe 决策 | 纯文档 | docs | 否 |
| 2.2 | **@CapabilityVersion 最小实现**：注解 + H-1 期 SemVer 校验 + capability-version-monotonic 守卫规则 | 新增注解+校验器 | runtime-sdk-api, runtime-orchestrator, architecture-guard | 否（增量校验，默认告警模式起步） |
| 2.3 | **BrixException 最小实现**：基类 + errorCode 命名空间（`{plugin}.{domain}.{error}`）+ 现有异常逐步继承 | 新增基类，旧异常改父类 | runtime-sdk-api | 否（继承链兼容） |
| 2.4 | **ImpersonationCapability 独立契约** + impersonation-internal-only 守卫规则 | 从 ViewModeCapability 提取 | runtime-sdk-api, architecture-guard | 否 |
| 2.5 | **manifest schema 补 apiVersion 字段**（whitelist: brix.io/v1）；蓝图字段名以 schema 为准回写 | schema + 文档 | platform-devtools/schemas | 否（新增可选字段） |
| 2.6 | **补 5 条缺失守卫规则**（见 2.2#11）| 新增 ArchUnit/ESLint 规则 | architecture-guard, eslint-config | 否（CI 新增检查，违规处先白名单） |
| 2.7 | **前端存储适配器**：StorageCapability + infra-adapter-storage-web，替换 5 处 localStorage 直用 | 新契约+适配器+改 3 文件 | runtime-sdk-api-web, infra-adapters, platform-tenant-web, platform-state-web | ⚠️ 需前端回归（key 不变可平滑） |
| 2.8 | **PasswordCapability.needsRehash()** default 实现 | 接口加 default 方法 | runtime-sdk-api | 否 |

### Phase 3 — 优化性（建议 1-2 季度内）

| # | 事项 | 涉及模块 |
|---|---|---|
| 3.1 | QueryCapability 跨插件类型化查询最小实现（或蓝图正式降级为 v4 roadmap） | runtime-sdk-api, runtime-orchestrator |
| 3.2 | brix-bom 模块（聚合自有 artifact 版本） | 新模块 |
| 3.3 | Capability 层 AOP 自动埋点（span + 调用计数），对齐 OTel Semantic Conventions | infra-adapter-otel |
| 3.4 | japicmp/revapi 接入 CI（v4.0 前的 API 兼容性门禁） | 根 pom + CI |
| 3.5 | LlmCapability/AgentCapability 契约 + 一个参考适配器（AI 时代核心投资，见 §7.3） | runtime-sdk-api, infra-adapters |
| 3.6 | brix-mcp-bridge：CapabilityRegistry → MCP Server | 新模块 |
| 3.7 | create-brix 生成 AGENTS.md + AI prompt 模式 | platform-devtools |
| 3.8 | 中文 Javadoc 英文化（OAuth2FederationCapability 等）；PlatformAdminBanner 默认值接入 i18n 资源 | runtime-sdk-api, platform-tenant-web |
| 3.9 | @IntegrationEvent 三级可靠性注解（或蓝图降级为二元 @CriticalEvent 现状） | runtime-sdk-api |
| 3.10 | shared-runtime-mobile / rabbitmq 适配器：实现或从蓝图移除 | — |

---

## 九、最终评语

Brix 开源仓是一个**治理体系超前、契约完成度滞后于蓝图**的项目。它最值钱的不是某个具体功能，而是"红线靠机器执法"的工程文化——22 条 ArchUnit 规则、CI 四道门禁、版本一致性脚本、pre-commit 密钥防护，这套体系放在国内开源项目中属于第一梯队，达到甚至部分超过"最佳实践的最小实现"标准。

短板同样清晰：**作为一个以"Capability 契约"为立身之本的框架，恰恰是契约的版本治理（@CapabilityVersion）、错误治理（BrixException）、查询治理（QueryCapability）三块没有落地**；多租户链路完整但租户状态校验缺失是唯一真正的安全级缺口。

v3.0.10 蓝图**有资格作为总设计蓝图**——前提是完成 v3.0.11 修订，把"已实现/目标态"分离，把命名对齐代码。否则清单执行者（包括 AI 评审工具）会持续产生本报告 2.2 节中约 40% 的"假性不合规"。

AI 时代的机会窗口真实存在：Brix 的 manifest + Capability ≤12 方法 + 机器化红线，恰好是"Agent 可编程平台"的三个前置条件，建议把 §7.3 的 MCP 桥接与 LlmCapability 列为 v3.3 的战略投资。

**总评级：B+。完成 Phase 1 + 蓝图修订后可升 A-。**

---

*评审完成日期：2026-06-12 ｜ 评审范围：d:\1.Sources\brix（开源仓）｜ 证据均可在对应文件路径复核*
