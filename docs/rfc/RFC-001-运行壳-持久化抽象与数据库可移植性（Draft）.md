# RFC-001：运行壳持久化抽象与数据库可移植性（Draft）

> **文档类型**：RFC（根蓝图修订提案）
> **状态**：已并入根蓝图 v3.1.0（Architecture Frozen，自 2026-10-21 生效），条款以 v3.1.0 正文为准；本文保留为决策背景，**不指导施工**
> **起草日期**：2026-10-21
> **依据基线**：runtime-shell 3.0.10（ACTIVE）；相关专项 multi-tenant 4.0、super-admin 3.0（ACTIVE）
> **拟修订**：根蓝图 §4.7 Persistence 行、§7.1–§7.4、`BRX-RS-DATA-007`、红线 A-8 / A-13 / A-15 的证明方式；弃用 L2A `DatabaseCapability`；新增 `BRX-RS-DATA-020`～`BRX-RS-DATA-040`、红线 A-27
> **目标版本**：根蓝图下一版本（建议 3.1.0，见 §10）
> **待决**：§11 列出需要负责人拍板的问题；Q1、Q2、Q4 已于 2026-10-21 裁决（Q1 采用方案 C；金仓适配暂缓，只预留扩展口）

## 并入 v3.1.0 时的调整

本 RFC 已按负责人裁决并入 `docs/v3.1.0-运行壳架构设计蓝图.md`（Architecture Frozen）。并入时相对下文的调整如下，冲突时以 v3.1.0 为准：

- 人大金仓适配暂缓（Q2/Q4）：只登记平台参考 DCP（PostgreSQL），新增 DCP 无需修订蓝图（DATA-044）；
- schema-per-Owner 与 Owner 最小权限身份降为 SHOULD（Q3），权限负例测试只在已实施的环境中强制（DATA-039）；
- `data.databaseProfiles` 改为可选声明，缺省视为只支持参考 DCP（DATA-023）；只支持一个 DCP 时允许保留单一迁移目录（DATA-032）；
- 持久化 API 白名单补充生命周期回调、`MappedSuperclass`、`LockModeType`、`Persistable`、`PageRequest` 和 `JdbcTypeCode(SqlTypes.JSON)`，并要求 `@Modifying(clearAutomatically = true)` 同时设置 `flushAutomatically = true`（DATA-024）；
- 新增异常转换（DATA-042）、L2A 最小签名（DATA-043）和 `DatabaseCapability` 弃用（DATA-041）。

本文沿用根蓝图的 RFC 2119 关键词约定。条款编号是拟定编号，冻结前可以调整，但不得与 3.0.10 已发布的 ID 冲突（3.0.10 中 DATA 组最大为 `BRX-RS-DATA-019`，红线最大为 A-26）。

---

## 0. 结论

不自研 ORM。插件使用"标准 JPA 映射 + 声明式 Repository 接口 + Runtime 管理的事务"，这三样都只能经 `PersistenceCapability` 取得。数据库差异集中在三处：

1. **L2C 持久化 Adapter**：JDBC 驱动、连接池、ORM 方言、Owner 持久化单元、迁移引擎；
2. **迁移脚本**：可移植的公共脚本加上按数据库区分的方言变体；
3. **数据库兼容档案（DCP）**：登记每种受支持数据库的版本、模式、驱动、方言和已知差异，并用一致性测试证明"真的能跑"。

数据库可替换性靠**一致性测试矩阵**来证明，而不是靠禁用 JPA。

---

## 1. 背景

### 1.1 业务目标

同一套插件要能在 PostgreSQL 和人大金仓 KingbaseES 上运行。切换数据库时只改 Host Profile（选哪个数据库、连接参数），插件代码不改。

### 1.2 3.0.10 的现行条款

| 条款 | 内容摘要 |
|---|---|
| §4.7 Persistence | 暴露"绑定 plugin identity 的 Repository/Unit of Work"；不暴露 `DataSource`、`Connection`、`JdbcTemplate`、原生 SQL、跨插件 schema |
| `BRX-RS-DATA-007` | 插件只能依赖 Jakarta Persistence **映射注解**和 Brix 发布的 Repository contract；不得依赖 `EntityManager`、`Query`、Spring Boot Data starter、Hibernate 厂商 API、JDBC、原生 SQL、Flyway runtime。声明式 migration SQL 是例外 |
| A-13 | 插件数据库访问必须经 PersistenceCapability，不得持有裸句柄或执行原生 SQL |
| multi-tenant T-2 | 数据访问必须经唯一 Owner Repository/PersistenceCapability 的 tenant policy；插件不得取得 DataSource、Connection、EntityManager、JdbcTemplate 或原生 SQL 执行器 |

### 1.3 现行条款的三个问题

1. **过严，而且缺了替代品**：DATA-007 连 Spring Data 和 JPQL 都禁止，却没有定义"Brix Repository contract"的样子（查询、分页、锁、投影）。照字面实施等于自研 ORM。代码里至今没有 `PersistenceCapability`，所有用到数据库的插件都处于违规状态。
2. **不对症**：数据库可移植性的主要风险在迁移脚本（DDL）和基础设施配置，而 DATA-007 恰好把"声明式 migration SQL"整体列为例外，对方言没有任何约束。
3. **没有证明手段**：A-13 只能证明"没用某些 API"，证明不了"能在金仓上跑通"。蓝图里没有"在目标数据库上实测"的门禁。

### 1.4 现状证据（2026-10-21 盘点）

| 层面 | 现状 | 对可移植性的影响 |
|---|---|---|
| Java 查询 | platform-identity / tenant / auth 的查询全部是 JPQL 或派生查询，两个仓的主代码里没有 `nativeQuery = true`，也没有 `createNativeQuery` | **已基本可移植** |
| Java 访问方式 | Spring 容器注入 Spring Data Repository（tenant 13、identity 4、auth 2 个文件），服务层 `@Transactional`（tenant 10、identity 7、auth 2 个文件）；identity 用 `JdbcTemplate` 写审计；auth 2 个、tenant 1 个文件直接用 `EntityManager` | 按 3.0.10 条文违反 DATA-007 / A-13 / T-2；跨 Owner 共享事务（FIRST_OWNER）也是由"插件自己控制事务"引起的 |
| 主键 | 平台模块不用 `@GeneratedValue`，主键是应用侧生成的 `BIGINT`；只有 `context_id` 依赖数据库默认值 `gen_random_uuid()` | 基本可移植 |
| DDL | tenant V001 使用 `CREATE EXTENSION pgcrypto`、`gen_random_uuid()`、3 个 PL/pgSQL 函数 + 4 个触发器、`pg_advisory_xact_lock(hashtext(...))`、`ON CONFLICT`、`::` 类型转换；auth V1/V2 有 14 处部分索引、6 处 `ON CONFLICT`；三个模块都大量使用 JSONB 和 `TIMESTAMPTZ`（明细见附录 A） | **主要锁定点** |
| 配置 | host-shell-standalone 写死 `org.postgresql.Driver` 和 `PostgreSQLDialect`；`ddl-auto: update`，即由 Hibernate 在迁移治理之外改表结构 | 换库时不可控 |
| 所有权落地 | 所有模块共用一个库、一个 schema、一个数据库账号，只是每个模块有各自的 Flyway 历史表 | 数据所有权在数据库层不设防 |

外部事实（检索于 2026-10-21，进入 Freeze Candidate 前须以金仓官方文档和实测复核，来源见附录 B）：

- Spring Boot 没有内置金仓驱动识别（相关 PR 于 2025-04 被拒）；
- 金仓官方提供 Hibernate 方言（`org.hibernate.dialect.Kingbase8Dialect`，方言包按 Hibernate 版本区分，含 6.x）和 JDBC 驱动（`com.kingbase8.Driver`，URL 形如 `jdbc:kingbase8://host:port/db`）；
- Flyway 官方支持列表不含金仓；金仓发布了自己的 Flyway 使用指南；
- 金仓的兼容模式在 `initdb` 时用 `-m pg|oracle|mysql` 指定，之后**不能更改**；
- 项目当前使用 Spring Boot 3.2.2，自带 Hibernate 6.4.1。金仓方言包按 Hibernate 版本发布，是否覆盖 6.4 需要在金仓 DCP 的一致性测试中确认；以后升级 Spring Boot 时 Hibernate 版本随之变化，要重新确认方言包。

---

## 2. 目标与非目标

**目标**

- G1 可替换：插件代码与数据库产品无关；换库只换 DCP 与 Host Profile。
- G2 可证明：每个受支持的数据库都有自动化一致性测试作为证据。
- G3 所有权：每个 Owner 只能访问自己的表，并且在数据库层可证明。
- G4 事务正确：事务只覆盖一个 Owner，由 Runtime 统一划定边界。
- G5 不重复造轮子：复用 Jakarta Persistence、Spring Data、Flyway 等成熟组件。

**非目标**

- 不自研 ORM 或查询 DSL；
- 不承诺支持任意数据库，只支持登记并通过测试的 DCP；
- 不承诺各数据库的 DDL 完全相同，差异由迁移变体承担；
- 不在本 RFC 规定多租户隔离细节，租户规则仍由多租户专项负责；
- 不在本 RFC 定义跨 Owner 同步写流程的范式，另起 RFC。

---

## 3. 方案比较

| 方案 | 做法 | 可移植性 | 工作量 | 与现有代码差距 | 边界可证明性 |
|---|---|---|---|---|---|
| A 现行条文 | 自研 Brix Repository 契约，插件只用映射注解 | 只覆盖查询，不管 DDL | 很大（等于自研 ORM） | 全部重写 | 强，但要先造出来 |
| B 完全放开 | 插件自由使用 JDBC、EntityManager、原生 SQL | 差：方言散落在每个插件 | 小 | 无 | 弱 |
| **C 受治理的标准 JPA（已选定，见 Q1）** | 映射注解 + Spring Data Repository 接口（仅 JPQL）+ Runtime 事务，只经 PersistenceCapability 获取；DDL 分公共脚本与方言变体；DCP 一致性测试 | 好：查询靠 ORM 方言，DDL 靠变体，两者都有测试兜底 | 中 | Repository 接口大多保留，改获取方式和事务方式 | 强：禁用 API 清单 + 启动校验 + 数据库权限 |
| D Jakarta Data | 用 Jakarta Data 标准 Repository 代替 Spring Data | 同 C | 中偏大 | 要改写 Repository | 同 C |

业界参照：Keycloak 用 JPA 加数据库无关的迁移格式，并在 CI 中对多种数据库跑测试矩阵；Camunda、Flowable 等流程引擎为每种数据库维护各自的建表脚本和方言化 SQL；Atlassian Active Objects 为插件自研 ORM，并为每种数据库自动生成 DDL，这条路只有在平台规模很大时才值得。本 RFC 采用方案 C，与第一种做法最接近。

---

## 4. 架构总览

```text
plugin-core      @Entity 映射 + Repository 接口（JPQL / 派生查询）
     │ 只经
PluginContext.require(PersistenceCapability.class)
     │
L2B Runtime      入口级 Unit of Work：开启/提交/回滚、跨 Owner 调用时挂起、
                 Inbox 去重 + 业务写入 + Outbox 同一事务
     │
L2C 持久化 Adapter（按 DCP 选择）
                 JDBC 驱动、连接池、ORM 方言、Owner 持久化单元与默认 schema、
                 Owner 数据库身份、迁移引擎、DCP 启动校验、超时与指标
     │
数据库           PostgreSQL（平台参考 DCP） │ KingbaseES（PG 兼容模式） │ …
```

插件只依赖 L2A 接口，运行时拿到的是 L2B 注入的策略代理，永远不直接接触 L2C 适配器（CAP-006）。L2C 适配器是通用实现，不包含任何插件专属代码：插件"声明"实体和 Repository，适配器"通用地实现"它们。

三个新概念：

- **数据库兼容档案（DCP）**：一种受支持数据库的完整登记与测试证据（§5.1）；
- **Owner 持久化单元**：每个 Owner 只看得到自己的实体、自己的 schema（§5.2、§5.5）；
- **可移植 DDL 子集**：所有受支持数据库都实测通过的 DDL 写法集合，子集之外的写法只能放进方言变体（§5.4）。

---

## 5. 条款草案

### 5.1 数据库兼容档案（DCP）

[BRX-RS-DATA-020] 数据库兼容档案（Database Compatibility Profile，DCP）是与 BOM 一起版本化发布的构建资产，与 Capability Catalog 同类，不是运行期服务。平台参考 DCP 为 PostgreSQL。每个 DCP MUST 登记：

| 字段 | 含义 |
|---|---|
| `dcpId` | 全局唯一、发布后不可变，如 `postgresql-16`、`kingbase-v9-pg` |
| `product` / `versionRange` | 数据库产品与受支持版本范围（Brix Range v1） |
| `compatibilityMode` | 数据库兼容模式（如金仓 `database_mode=pg`）；不适用时写 `n/a` |
| `jdbcDriver` | 驱动制品坐标、精确版本和驱动类 |
| `ormDialect` | ORM 方言制品和类名 |
| `migrationEngine` | 迁移引擎、版本以及在该数据库上的接入方式 |
| `portableDdlProfile` | 该 DCP 已验证的可移植 DDL 子集版本（§5.4） |
| `identityModel` | Owner 数据库身份的实现方式（§5.5） |
| `knownDifferences` | 已知行为差异（标识符大小写、空串与 NULL、时间精度、锁行为、保留字等）及处置方式 |
| `conformanceSuite` | 一致性测试套件版本和最近一次通过的证据 |
| `status` | `candidate` / `supported` / `deprecated` |

[BRX-RS-DATA-021] Host Profile MUST 为每个数据源引用且只引用一个 `dcpId`，另加外部化的连接参数。驱动类、ORM 方言、迁移引擎 MUST 由 DCP 决定，MUST NOT 在 Host 配置中重复声明，以免形成第二 SSoT。Production Profile MUST 只引用 `status=supported` 的 DCP。

[BRX-RS-DATA-022] 持久化 Adapter MUST 在 H2 阶段校验实际数据库与所选 DCP 一致，校验项包括产品、版本、兼容模式，以及 DCP 登记的关键参数（如字符集、时区、标识符大小写策略）。任何不一致 MUST fail-fast，MUST NOT 依赖驱动自动探测或"尽力运行"。

[BRX-RS-DATA-023] 声明了 `data` 段的插件 MUST 在 Manifest 的 `data.databaseProfiles` 中列出其已通过一致性测试的 DCP；未声明时，只视为支持平台参考 DCP。Host 所选 DCP 不在某插件的声明集合内时，该插件 MUST Resolve Failed；如果它是 required 插件，Host 启动失败。

### 5.2 插件持久化编程模型

[BRX-RS-DATA-024]（取代 DATA-007）插件 `plugin-core` MAY 编译依赖且只依赖以下持久化 API：

1. Jakarta Persistence 映射注解白名单：`Entity`、`Table`、`Id`、`EmbeddedId`、`Column`、`Embeddable`、`Embedded`、`Enumerated`、`Version`、`Convert`/`Converter`（转换器只能是纯 Java 逻辑）、`Transient`，以及同一 Owner 实体之间的关联注解（`ManyToOne`、`OneToMany`、`OneToOne`、`JoinColumn` 等）。`GeneratedValue` 不在白名单内，主键 MUST 由应用侧经 `IdGeneratorCapability` 生成；
2. Spring Data 声明式 Repository：`Repository`、`CrudRepository`、`ListCrudRepository`、`PagingAndSortingRepository`、`ListPagingAndSortingRepository`、`JpaRepository`、`JpaSpecificationExecutor` 接口；方法级 `@Query`（只允许 JPQL）、`@Modifying`、`@Lock`、`@Param`；`Pageable`、`Sort`、`Page`、`Slice` 和接口投影；
3. Jakarta Persistence Criteria API，只能经 `Specification` 使用。

[BRX-RS-DATA-025] 插件代码 MUST NOT 依赖或调用：

- `java.sql` / `javax.sql` API；
- `JdbcTemplate`、`NamedParameterJdbcTemplate`、`JdbcClient` 等 JDBC 模板；
- `EntityManager`、`EntityManagerFactory`、Hibernate `Session` / `StatelessSession`，以及任何 `unwrap()`；
- 任何形式的原生 SQL：`@Query(nativeQuery = true)`、`@NativeQuery`、`createNativeQuery`、`@Procedure`、存储过程和数据库函数调用；
- 白名单之外的 Hibernate 或其他厂商注解与 API；
- Spring 事务 API：`@Transactional`、`TransactionTemplate`、`PlatformTransactionManager`；
- `@EnableJpaRepositories`、ComponentScan，或任何由 Spring 容器创建、注入 Repository 的方式；
- 数据库驱动、连接池、迁移引擎的 API；
- 硬编码的 schema 名，或按数据库产品分支的逻辑。

[BRX-RS-DATA-026] Repository 实例 MUST 只能在 `HandlerFactory.create(PluginContext)`（或 Internal Contract Provider Factory 的 owner-scoped context）中经 `PersistenceCapability.repository(Class)` 取得。Runtime/Adapter MUST 为调用方 Owner 的持久化单元创建该实例（实现 MAY 使用 Spring Data `JpaRepositoryFactory` 等程序化 API），并在创建时校验三件事：接口属于该 Owner 的 `plugin-core`；所有 JPQL 能被该 Owner 的元模型解析；没有原生查询。任何一项失败 MUST 在 P4/O4 阻断启动。

[BRX-RS-DATA-027] 每个 Owner 的持久化单元 MUST 只登记该 Owner 自己的实体和表。引用其他 Owner 实体的 JPQL、跨 Owner 的关联映射、映射到其他 Owner schema 的实体，MUST 在启动期失败。实现 MAY 为每个 Owner 建立独立的 EntityManagerFactory，也 MAY 采用能给出同等证明的其他机制。

L2A 签名草案（冻结前可调整；L2A 不引用任何 Spring 类型，"必须是 Spring Data Repository 接口"由 Adapter 在运行期校验）：

```java
public interface PersistenceCapability {
    /** 返回绑定调用方 Owner 持久化单元的 Repository；只接受该 Owner plugin-core 中声明的接口。 */
    <R> R repository(Class<R> repositoryType);

    /** 编程式 Unit of Work，只作用于调用方 Owner。 */
    UnitOfWork unitOfWork();
}

public interface UnitOfWork {
    /** 加入当前 Owner 的活动读写事务；没有时开启一个。 */
    <T> T required(Supplier<T> work);

    /** 在只读事务中执行；其中的写入 MUST 失败。 */
    <T> T readOnly(Supplier<T> work);
}
```

### 5.3 事务与锁

[BRX-RS-DATA-028] 事务边界由 Runtime 管理。Runtime MUST 在调用 Handler 之前为该 Handler 所属 Owner 开启本地 Unit of Work，在 Handler 返回的 `CompletionStage` 正常完成后提交，异常完成时回滚。Repository 访问 MUST 发生在 Runtime 分配给本次调用的执行上下文中。缺省规则如下：

| 入口 | 缺省 Unit of Work | 是否可在 Manifest 覆盖 |
|---|---|---|
| Query Provider | 只读 | 否 |
| Command Handler / Event Handler | 读写；Inbox 去重、业务写入、Outbox 在同一事务（MESSAGE-014/025） | 否 |
| HTTP Endpoint | `GET`/`HEAD` 只读，其他方法读写 | 可，`endpoints.provides[].transaction: required / read-only / none` |
| Task | 读写 | 可，`tasks.provides[].transaction` |

新增的 `transaction` 字段是可选字段，缺省值即上表规则。

[BRX-RS-DATA-029] 插件 MAY 经 `PersistenceCapability.unitOfWork()` 在入口 Unit of Work 之内划出更小的读写或只读范围，但 MUST NOT 在同一 Owner 内开启嵌套的独立事务（平台不提供 requires-new 语义）。需要独立于主事务提交的副作用（如审计、通知）MUST 经 Outbox / Integration Event，或经对应 Data Owner 的契约完成。

本 RFC 不改变 DATA-008、DATA-009、DATA-010、DATA-012、MESSAGE-008 和 HOST-020。Runtime 管理的 Unit of Work 是这些条款的实施机制：调用其他 Owner 时挂起当前事务，任何跨 Owner 写流程都不得共享物理事务、连接或持久化上下文。

[BRX-RS-DATA-030] 并发控制规则：

- 行级悲观锁 MUST 经 Repository 的 `@Lock(PESSIMISTIC_WRITE / PESSIMISTIC_READ)` 表达；乐观并发 MUST 经 `@Version` 表达；
- 命名锁或跨实例互斥 MUST 经 `LockCapability`；
- 锁等待 MUST 有上限（锁超时提示或 Profile 缺省值），符合 RESILIENCE-001；
- 插件 MUST NOT 使用 `SELECT ... FOR UPDATE` 原生语句或数据库专有的锁函数（如 `pg_advisory_xact_lock`）；
- 专项蓝图要求的 `SELECT ... FOR UPDATE` 语义（如多租户 T-27）由 JPA 悲观写锁满足；专项给出"advisory lock 或行锁"两种选择时，应用层 MUST 选择行锁，数据库专有锁只允许出现在 DCP 的迁移变体中（如触发器里的兜底锁）。

### 5.4 迁移与 DDL 可移植性

[BRX-RS-DATA-031] 迁移由 Owner 编写，由 L2B/L2C 的迁移执行器执行，并 MUST 在该 Owner 进入 P4/O4 之前完成且通过 schema 校验；失败按 required/optional 规则处置。插件 MUST NOT 调用迁移引擎 API。迁移引擎是 DCP 的实现选择（当前为 Flyway）；更换引擎 MUST NOT 要求插件改变已发布迁移的语义。

[BRX-RS-DATA-032] Manifest 声明的 migration location 下分两类目录：

- `common/`：只使用可移植 DDL 子集的脚本，所有 DCP 共用；
- `{dcpId}/`：该 DCP 的方言变体。

同一迁移版本 MUST 要么只出现在 `common/`，要么在 `data.databaseProfiles` 声明的每一个 DCP 目录中都出现。两处同时出现、缺少某个 DCP 的变体、或各 DCP 的版本序列不一致，MUST 在构建期失败。各 DCP 的版本序列 MUST 相同，以保证升级路径一致。

[BRX-RS-DATA-033] 可移植 DDL 子集（Portable DDL Profile）是版本化的平台 Schema 资产。一项写法只有在全部 `supported` DCP 上通过一致性测试后才能加入子集。v1 候选内容分三类：

| 类别 | 内容 |
|---|---|
| 子集内（v1） | 标识符为小写 snake_case、不超过 63 字节、不是任一受支持 DCP 的保留字、不依赖引号保持大小写；类型 `BIGINT`、`INTEGER`、`SMALLINT`、`BOOLEAN`、`NUMERIC(p,s)`、`VARCHAR(n)`、`TEXT`、`DATE`、`TIMESTAMP WITH TIME ZONE`；主键、唯一约束、同一 Owner 内的外键、只用比较 / `IN` / `IS NULL` 的简单 `CHECK`；普通 B-tree 索引和唯一索引；默认值只用常量和 `CURRENT_TIMESTAMP`；标准 `CAST(x AS t)`；幂等种子数据用 `INSERT ... SELECT ... WHERE NOT EXISTS` |
| 待验证后可纳入 | `UUID`、`JSONB`、部分索引、`COMMENT ON`：在金仓 DCP 实测通过后再决定 |
| 只允许出现在 `{dcpId}/` 变体 | `CREATE EXTENSION`；函数、存储过程、触发器；数据库专有函数与锁（如 `gen_random_uuid()`、`pg_advisory_xact_lock`）；`ON CONFLICT` 等方言 upsert；`::` 类型转换；表达式索引；RLS 策略；序列、自增列 |

[BRX-RS-DATA-034] 专项蓝图中的 SQL/DDL 片段表达的是规范语义，以平台参考 DCP（PostgreSQL）的方言书写。每个受支持 DCP 的变体 MUST 实现相同语义，并 MUST 通过同一组语义测试。涉及并发或不变量保护的语义（如多租户 T-18 最后 OWNER 保护、T-20 `context_id` 不可变、T-27 配额行锁）MUST 有并发和负例测试，不能只验证脚本能执行。

[BRX-RS-DATA-035] ORM 自动建表（Hibernate `ddl-auto` / `hbm2ddl` 的 `create`、`create-drop`、`update`）MUST NOT 用于任何共享或正式环境。Standalone、Embedded 和 Production Profile MUST 使用 `validate`（或 `none` 加等价的启动期 schema 校验），校验失败 MUST fail-fast。Local Profile MAY 在一次性测试库中使用 `create-drop`，但 MUST NOT 以此替代迁移一致性测试。

[BRX-RS-DATA-036] 迁移哈希台账（A-15）MUST 按 `(storageId, version, dcpId)` 分别登记。同一版本在不同 DCP 上的变体内容可以不同，但任何变体一旦在共享或正式环境执行过，就 MUST NOT 再修改（DATA-013、DATA-014 对每个变体分别适用）。

### 5.5 数据所有权在数据库层的落实

[BRX-RS-DATA-037] 每个 Owner MUST 使用独立的数据库 schema，schema 名由 Manifest 的 `storageId` 派生；该 Owner 的业务表和 canonical Outbox/Inbox 表（MESSAGE-023）都位于这个 schema。插件代码和映射 MUST NOT 硬编码 schema 名，默认 schema 由 Adapter 绑定到 Owner 持久化单元。

[BRX-RS-DATA-038] 在共享或正式环境中，数据库身份按以下规则划分：

- 每个 Owner 的运行期身份 MUST 只对自身 schema 拥有 DML 权限，不拥有 DDL 权限；
- 迁移 MUST 使用独立的迁移身份；
- Relay、审计写入等 Custodian（DATA-006）MUST 使用只覆盖受托表和所需操作的身份；
- 实现方式（每个 Owner 一个连接池，或共享连接池并在 Unit of Work 开始时切换到 Owner 角色）由持久化 Adapter 选择，并登记在 DCP 的 `identityModel` 中；
- Local Profile MAY 使用单一身份。

[BRX-RS-DATA-039] A-8 的必需证据 MUST 包含数据库权限负例集成测试：用 Owner A 的运行期身份读写 Owner B 的表、执行 DDL，都 MUST 被数据库拒绝。

### 5.6 租户隔离的接口点

[BRX-RS-DATA-040] 租户过滤 MUST 由持久化 Adapter 在 ORM 层以可移植方式自动施加（实现 MAY 使用 Hibernate 的租户鉴别列或过滤器）；插件 Repository MUST NOT 依赖手写的 tenant 条件来保证隔离。数据库专有的行级安全（如 PostgreSQL RLS，见多租户专项 §14.2）只能作为对应 DCP 的可选第二道防线，任何 DCP 上的隔离正确性 MUST NOT 以它为前提。具体租户规则仍由多租户专项规定。

### 5.7 红线与条款变更

| 变更 | 内容 |
|---|---|
| 废止 `BRX-RS-DATA-007` | 由 DATA-024～027 取代 |
| 修订 §4.7 Persistence 行 | "MUST 暴露"改为：经 PersistenceCapability 取得的 Owner 作用域 Repository 与 Unit of Work；"MUST NOT 暴露"保持并补充 `EntityManager`、`Session`、Spring 事务 API |
| 修订 A-13 证明方式 | 含义不变：插件数据库访问 MUST 只经 PersistenceCapability 提供的 Repository 与 Unit of Work，MUST NOT 持有连接、DataSource、EntityManager、Session，不得使用 JDBC 模板、原生 SQL 或 Spring 事务 API。证明：DATA-025 禁用 API 清单的字节码/ArchUnit 扫描 + P4 Repository 创建校验 + 运行期 schema 权限 |
| 补充 A-8 证据 | 增加 DATA-039 的数据库权限负例测试 |
| 补充 A-15 | 迁移台账按 DCP 分别登记（DATA-036） |
| 弃用 L2A `DatabaseCapability` | 它向插件暴露数据库方言、库名和 schema 名，与 DATA-025"不得硬编码 schema、不得按数据库产品分支"冲突，也不在 §4.1 Capability 目录中；由 `PersistenceCapability` 取代，按 CAP-022/023 标注弃用后移除 |
| 新增 A-27 | 见下表 |

| ID | 唯一含义 | 最低证明门禁 | 失败处置 |
|---|---|---|---|
| A-27 | 声明了 `data` 的插件 MUST 在其 `data.databaseProfiles` 的每个 DCP 上通过：全新安装迁移、从每个仍受支持版本升级、ORM schema validate、Repository 契约测试、专项语义测试；Production Composition MUST NOT 使用 `status` 不是 `supported` 的 DCP | DCP 一致性测试矩阵（容器或专用测试实例）+ 启动期 DCP 指纹校验（DATA-022） | CI/发布/启动阻断 |

附录 A `requirementGovernance` 中 DATA 组的 gate 拟增加 `dcp-conformance-matrix`，enforcementStatus 维持 `partial`，直到上述门禁真正生效。

---

## 6. 被否决或暂缓的方案

| 方案 | 结论 | 原因 |
|---|---|---|
| 自研 Repository 契约或查询 DSL（现行 DATA-007 的隐含要求） | 否决 | 等于自研 ORM，成本高，而且对 DDL 可移植性没有帮助 |
| 完全放开（插件直接用 JDBC、EntityManager、原生 SQL） | 否决 | 方言差异散落到每个插件，所有权与租户隔离无法证明 |
| 插件内受控原生 SQL（每个 DCP 提供变体） | 暂缓 | 与多租户 T-2"不得取得原生 SQL 执行器"冲突；如出现报表、递归查询等真实需求，另起 RFC |
| Jakarta Data 作为 Repository 标准 | 暂缓 | 方向正确，但 Spring 生态支持有限；两者都是接口式 Repository，以后可经 RFC 迁移 |
| MyBatis / MyBatis-Plus 作为插件持久化框架 | 否决 | 需要在插件里手写 SQL，换库时要逐条检查改写或维护按数据库区分的 SQL 变体；与 DATA-025 和多租户 T-2 禁止原生 SQL 冲突 |
| 依赖 RLS 作为主要租户隔离手段 | 否决 | 不可移植，只作可选第二道防线 |
| 每个 DCP 维护整套迁移，不设 `common/` | 否决 | 重复量大，容易漂移 |
| 用 Liquibase 替换 Flyway | 暂缓 | 对 PG 家族收益有限，触发器等仍要写方言 SQL；迁移引擎是 DCP 字段，保留替换空间 |
| 跨 Owner 同步写流程的标准范式 | 另起 RFC | 本 RFC 只保证不共享事务；流程编排加可查询状态的范式单独定义 |

---

## 7. 与专项蓝图的关系

- **multi-tenant 4.0**：
  - 与 T-2 一致：插件仍不得取得 DataSource、Connection、EntityManager、JdbcTemplate 或原生 SQL 执行器；
  - T-1 要求的 `tenant_id BIGINT NOT NULL` 加索引在可移植子集内；
  - 专项中以 PostgreSQL 书写的 DDL（`gen_random_uuid()`、触发器、`pg_advisory_xact_lock`）按 DATA-034 解释为规范语义，各 DCP 用变体实现，并用同一组语义测试验收；
  - 应用层锁按 DATA-030 选择行锁；
  - §14.2 RLS 按 DATA-040 只是 PostgreSQL DCP 的可选项。
- **super-admin 3.0**：BRX-SA-MIGRATION-001/002 与 DATA-036 一致；BRX-SA-BOOT-001（Bootstrap singleton 由前滚迁移建立）在每个 DCP 变体中保持相同语义。
- **frontend 1.1**：内容不受影响。
- 新根蓝图生效后，三个专项都继承自新根，按 AUTH-013 标记 `rebaseRequired=true`，完成复核后解除。

---

## 8. 对现有实现的影响（只登记差距，本 RFC 不改代码）

| # | 差距 | 位置 | 处理方向 |
|---|---|---|---|
| 1 | Spring 容器创建/注入 Repository；服务层 `@Transactional` | platform-tenant、platform-identity、platform-auth、全部 app-* | Repository 接口大多可以保留（都是 JPQL 或派生查询），改为经 PersistenceCapability 获取；事务改由入口 Unit of Work 管理 |
| 2 | `JdbcTemplate` 写审计 | platform-identity `JdbcPlatformIdentityAuditService` | 迁入 platform-audit Owner，与已知的审计缺口一起处理 |
| 3 | 直接使用 `EntityManager` | platform-auth 2 个文件，platform-tenant 1 个文件 | 改为 Repository |
| 4 | PostgreSQL 专有 DDL | tenant V001、auth V1/V2、identity V001（附录 A） | 拆成 `common/` 加 `postgresql-*/` 变体；`context_id` 改为应用侧生成；种子数据改用可移植写法；为金仓编写变体并跑语义测试 |
| 5 | `ddl-auto: update` | host-shell-standalone `application.yml` | 先为遗留实体补齐迁移脚本，再改为 `validate` |
| 6 | 驱动类与方言写死 | host-shell-standalone `application.yml` | 改为引用 `dcpId` |
| 7 | 单库、单 schema、单账号 | 全部模块 | 按 `storageId` 拆 schema，建立 Owner 角色；需要单独的迁移计划 |
| 8 | 跨 Owner 外键 | app-identity V100 引用 platform-auth 的表（见 Host 配置注释） | 已违反 DATA-003；拆 schema 时会暴露，改为 ID 引用加契约查询 |
| 9 | 测试用 H2（`MODE=MySQL`）；app-products 用 `MySQLDialect` | 多个 app-* 模块 | 测试改为在 DCP 上运行（如 Testcontainers PostgreSQL） |
| 10 | `@Modifying(clearAutomatically = true)` 未配 `flushAutomatically` 导致邀请记录丢失 | platform-identity `SetupTokenRepository` | 建议加入 guard 规则：两者必须同时使用 |
| 11 | L2A `DatabaseCapability` 暴露 `getDialect()`（枚举含 POSTGRESQL、KINGBASE、MYSQL、ORACLE）和 `getSchemaName()`；适配器实现类 `HikariDatabaseCapability` 另外公开了 `getDataSource()` 和 `executeNative(String sql, ...)` | runtime-sdk-api；infra-adapter-database | 目前没有插件使用；按 §5.7 弃用移除；`getDataSource`、`executeNative` 收为适配器内部方法 |

---

## 9. 落地顺序建议（非规范）

1. **先止血**：补齐遗留实体的迁移，把 `ddl-auto` 改为 `validate`；登记第一个 DCP（PostgreSQL），Host 改为引用 `dcpId`；
2. **迁移拆分**：迁移目录拆成 `common/` 与 PostgreSQL 变体，专有写法移入变体，`context_id` 改为应用侧生成；
3. **编程模型**：实现 `PersistenceCapability`（Repository + Unit of Work）和入口级事务，平台模块逐个迁移，guard 加入 DATA-025 禁用 API 规则；
4. **所有权落地**：schema-per-Owner、Owner 数据库角色、权限负例测试；
5. **金仓 DCP**：以 `candidate` 状态登记，准备测试实例，跑一致性测试和语义测试，补写触发器等变体，通过后转为 `supported`。第 2 步完成后，第 5 步即可并行启动。

---

## 10. 治理与版本

**变更类型判断**：

1. 放宽 DATA-007 是向后兼容的：原来合规的插件仍然合规；
2. A-13 的含义保持不变，只修订证明方式；
3. 新增条款和 A-27 属于新增约束；
4. Manifest 新字段（`data.databaseProfiles`、`transaction`）都是可选字段，并有安全缺省值。

按根蓝图 §12.2，本 RFC 属于 **Minor RFC**（架构、安全、SRE 评审 + 兼容测试），不增加 `compatibilityEpoch`。如果评审认为 DATA-037/038（schema 与数据库身份）改变了数据所有权语义，则升级为 Major RFC，`compatibilityEpoch` 加 1。

**版本号**：建议 3.1.0，避开已被候选稿占用的 3.0.11。同时建议在控制平面把 3.0.11 候选转为 lock schema 允许的非活动终态，减少混淆。

**流程**：

1. 本 Draft 评审，并对 §11 的问题作出裁决；
2. 把条款写入新的根蓝图正文（新文件），状态为 Freeze Candidate；
3. 架构、安全、SRE 三方批准；
4. 在 lock 中登记哈希、commit 和批准记录；3.0.10 转为 SUPERSEDED；
5. 三个专项标记 `rebaseRequired=true`，完成复核后解除。

---

## 11. 待决问题

| # | 问题 | 本 RFC 建议 |
|---|---|---|
| Q1 | Repository 编程模型：Spring Data JPA 接口、Brix 自定义接口，还是 Jakarta Data？ | **已决（2026-10-21，负责人）**：采用 §3 方案 C。`PersistenceCapability` 只负责发放 Repository 和管理事务，插件用标准 JPA 注解与 Spring Data 接口（仅 JPQL）描述数据；不自定义全套数据访问 API |
| Q2 | 金仓的目标版本（V8R6 / V9）与兼容模式 | **已决（2026-10-21，负责人）**：暂缓。先在 PostgreSQL 上把业务跑通；本版本只保留 DCP 机制和适配器扩展口，不登记金仓 DCP。启动金仓适配时再定版本与模式（届时仍建议只支持 PG 兼容模式：Oracle 模式会模拟空字符串与 NULL 等 Oracle 行为，适配成本明显更高；兼容模式在 `initdb` 时确定、之后不能改） |
| Q3 | 是否接受 schema-per-Owner 和 Owner 最小权限数据库身份 | 接受。蓝图 MESSAGE-023、DATA-015 已经隐含"每个插件有自己的 schema"，这里只是写明并让它可证明 |
| Q4 | 金仓测试环境由谁提供（授权、镜像或专用实例） | **已决（2026-10-21，负责人）**：随 Q2 暂缓，启动金仓适配时再提供；在此之前金仓 DCP 不登记，更不能进入生产 Composition |
| Q5 | 新根蓝图版本号 | 3.1.0 |

---

## 附录 A：现有迁移脚本的方言写法清单（2026-10-21）

数字是 `grep` 命中的行数，只用于判断规模，不是精确统计。

| 写法 | tenant V001 | identity V001 | auth V1 / V2 | 建议归类 |
|---|---:|---:|---:|---|
| `CREATE EXTENSION pgcrypto` | 1 | – | – | 变体；`context_id` 改为应用侧生成后可删除 |
| `gen_random_uuid()` | 2 | – | – | 改为应用侧生成 |
| PL/pgSQL 函数 / 触发器 | 3 / 4 | – | – | 变体，并用 T-18、T-20 语义测试验收 |
| `pg_advisory_xact_lock(hashtext(...))` | 1 | – | – | 变体（触发器兜底）；应用层改为行锁 |
| `ON CONFLICT` | 1 | 1 | 4 / 2 | 种子数据改用 `WHERE NOT EXISTS`；其余放入变体 |
| `::` 类型转换 | 8 | 1 | – | 改为 `CAST(...)` |
| JSON / JSONB | 13 | 2 | 12 | 待金仓验证 |
| 带时区时间戳 | 32 | 20 | 6 | 统一写成 `TIMESTAMP WITH TIME ZONE`；验证金仓上的精度与时区行为 |
| 部分索引（`CREATE INDEX ... WHERE`） | 1 | 1 | 14 | 待金仓验证 |
| `COMMENT ON` | 8 | – | 4 | 待金仓验证（风险低） |
| `CHECK` 约束 | 26 | 5 | 1 | 逐条确认只用简单谓词 |

## 附录 B：外部资料

- 金仓 Hibernate 配置（V9 文档）：https://bbs.kingbase.com.cn/kingbase-html/v9/development/client-interfaces-frame/hibernate/hibernate-2.html
- 金仓客户端编程开发框架：Hibernate（PDF）：https://help.kingbase.com.cn/v8.6.7.12/PDF/KingbaseES客户端编程开发框架-Hibernate.pdf
- 金仓客户端编程开发框架：Flyway（PDF）：https://help.kingbase.com.cn/v8.6.7.12/PDF/KingbaseES客户端编程开发框架-Flyway.pdf
- Spring Boot PR #44710 "Detect Kingbase JDBC driver"（2025-04-02 以 declined 关闭）：https://github.com/spring-projects/spring-boot/pull/44710
- 金仓兼容模式通过 `initdb -m` 指定（第三方安装记录，需以官方文档复核）：https://juejin.cn/post/7646618302571642926
