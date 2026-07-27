# Phase 0 环境与供应链证据操作手册

本目录承载 Phase 0 的可审计证据，不承载样例、假数据或环境凭据。当前工具覆盖
`platform-tenant` 与 `app-tenant` 两个迁移域，以及 standalone Host JAR 的构建供应链证据。
只有所有实际目标环境均完成下述流程，最终校验才可判定 `PASS`。

## 0. Pre-release Reset 适用分支

若项目从未上线、没有正式/共享/长期集成环境、没有外部消费者、没有必须保留的数据或已部署
制品，项目 Owner 可在版本化 Phase 0 事实记录中批准 `Pre-release Reset`。此模式下：

1. 不生成空 Flyway history、空 deployment record、假 JAR 或假 attestation；
2. 当前开发数据库不是迁移历史来源，只允许销毁并按当前根蓝图 fresh install；
3. 第 2～5 节作为首个受控共享环境或首个候选发布制品的自动恢复门禁，不阻断此前的架构施工；
4. 两个仓库的源码事实仍必须形成 clean、不可变 commit，Phase 仍须单独验收；
5. 一旦产生首个受控环境、需保留数据或候选发布制品，本模式自动且不可逆地结束。

任何已被跨团队、演示、测试或外部系统持续消费的环境都属于共享环境，不能通过改名为
`development` 绕过取证。无法确认时必须采用完整门禁。

## 1. 前置条件

- 先确定实际目标环境清单，例如 `development`、`staging`、`production`。校验命令必须逐个列出，
  不得遗漏暂时离线或尚未核验的环境。
- PostgreSQL 客户端须使用 `PGSERVICE`；账号仅拥有连接、schema usage 和两张 Flyway history
  表的 `SELECT` 权限。不得把密码写入命令、脚本、Git 或生成的 JSON。
- 最终闭环机须安装并认证 GitHub CLI，`gh attestation verify` 必须能读取
  `brix-kit-dev/brix-enterprise` 的 attestation；不能用离线 JSON 浏览代替密码学验证。
- GitHub Actions 必须允许 `id-token: write`、`attestations: write` 和
  `artifact-metadata: write`。私有或内部仓库使用 GitHub Artifact Attestations 时，
  组织必须具备 GitHub Enterprise Cloud。
- 如果 `brix-kit-dev/brix` 是私有仓库，在 `brix-enterprise` 仓库 Actions secrets 中创建
  `BRIX_READ_TOKEN`；它只需该仓库 contents read 权限。公开仓库无需该 secret。

## 2. 为每个目标环境导出脱敏 Flyway history

数据库管理员先创建独立只读账号。账号不得拥有 DDL、DML、role 管理或绕过 RLS 权限，只授予：

```sql
GRANT CONNECT ON DATABASE brix TO brix_phase0_auditor;
GRANT USAGE ON SCHEMA public TO brix_phase0_auditor;
GRANT SELECT ON TABLE public.flyway_schema_history_platform_tenant
  TO brix_phase0_auditor;
GRANT SELECT ON TABLE public.flyway_schema_history_app_tenant
  TO brix_phase0_auditor;
```

如果实际数据库名或 schema 不是 `brix` / `public`，数据库管理员应只替换对应标识符，
权限范围仍须保持为上述两张 history 表。非 `public` schema 还须在采集前设置
`PHASE0_FLYWAY_SCHEMA`；其值只接受小写 PostgreSQL 标识符。账号密码由现有 secrets manager
或受控 PostgreSQL passfile 管理。

在执行机的 PostgreSQL service file 中配置环境连接，并确保文件权限为 `0600`。然后对每个
真实环境执行两次只读采集：

```bash
export PGSERVICE=phase0-production
export PHASE0_FLYWAY_SCHEMA=public
scripts/collect_phase0_flyway_history.sh \
  production platform-tenant \
  docs/phase0-evidence/flyway/production/platform-tenant.json
scripts/collect_phase0_flyway_history.sh \
  production app-tenant \
  docs/phase0-evidence/flyway/production/app-tenant.json
```

把 `production` 和 `phase0-production` 分别改为真实的非敏感环境 ID 与本机 service 名，
并对目标环境清单逐一重复。脚本只查询九个批准字段，临时 CSV 在退出时删除；输出明确排除
host、database、user、`installed_by` 和凭据。原始 CSV 不得提交或长期保存。

人工复核每个 JSON：

```bash
rg -n '"(installed_by|password|host|database|user)"[[:space:]]*:' \
  docs/phase0-evidence/flyway
```

该命令应无命中。出现命中必须停止，不得靠手工删字段后继续；应检查采集脚本或输入来源。

## 3. 在可信 CI 生成 digest、SBOM、签名和 provenance

1. 将本次变更合入需要出证的 `brix-enterprise` commit。
2. 在 GitHub 打开 Actions，运行 **Phase 0 supply-chain evidence**。
3. 输入构建所使用的 `brix` 完整 40 位 commit；分支名、tag 和短 SHA 都会被拒绝。
4. 等待 workflow 的构建、SPDX SBOM、SLSA provenance、SBOM attestation 和两次
   `gh attestation verify` 全部成功。
5. 下载名为 `phase0-host-{enterprise commit}` 的 evidence pack，保存到组织受控、
   不可变且有保留策略的审计存储。
6. 将 evidence pack 完整解压到本地 `docs/phase0-evidence/artifacts/` 后再执行第 4、5 节；
   该目录已被 Git 忽略，不能只复制 binding JSON 而遗漏其所绑定的 JAR、SBOM 和 bundles。

workflow 将 GitHub Action 固定到完整 commit SHA，将 Syft 固定到明确版本，并产生：

- Host JAR 及 `SHA256SUMS`；
- SPDX JSON SBOM；
- Sigstore 签名的 SLSA v1 provenance bundle；
- Sigstore 签名的 SPDX 2.3 SBOM attestation bundle；
- 强制校验 source commit、signer workflow、predicate type 和非 self-hosted runner 的
  JSON 验证输出；
- `artifact-binding.json`，包含制品/SBOM/attestation/验证输出 digest、两个仓库 commit，
  以及两个仓库根 BOM/lock 输入的 digest。
- `artifact-binding.sigstore.json`，把上述 binding JSON 作为外置、自定义 predicate 再次签名，
  防止 commit/BOM 绑定记录脱离制品后被改写。

GitHub 的 90 天 Actions artifact 仅用于交付，不替代组织的长期不可变审计存储。

## 4. 将实际部署字节绑定到 CI 制品

不能用本地构建 JAR 代替已部署 JAR。由具备目标环境读取权限的运维人员，从正在运行的
实例或其只读制品仓库取回实际字节，保存到本目录下被忽略的 `artifacts/`。例如 systemd
部署可从发布目录复制；容器部署应从运行镜像内复制启动 JAR。记录工单或变更单编号作为
`capture-method`，但不得写主机名、账号或凭据：

```bash
python3 scripts/phase0_evidence.py record-deployment \
  --environment production \
  --binding docs/phase0-evidence/artifacts/artifact-binding.json \
  --deployed-artifact docs/phase0-evidence/artifacts/production-host.jar \
  --capture-method change-record-2026-0727 \
  --output docs/phase0-evidence/deployments/production.json
```

digest 不一致时命令必定失败。此时应回滚/重新部署已签名制品，或针对实际部署 commit 重新运行
可信 CI；不得修改 JSON 或以重新打包后的“等价文件”替代。

如果实际部署清单还包含独立 frontend bundle、OCI image、Plugin 或 Adapter 发布物，本 workflow
生成的单个 Host JAR 证据不足以通过 Phase 0。必须对每个独立部署物执行同等的
digest + SBOM + signed provenance + commit/BOM 绑定，并在 Phase 0 审核清单中逐项核销。

## 5. 执行 Phase 0 闭环校验

先从 `artifact-binding.json` 的 `repositories` 字段读取两个完整 commit，在不存在的专用目录
创建 detached 审计 worktree。以下 `<BRIX_COMMIT>` 与 `<ENTERPRISE_COMMIT>` 必须原样替换为
binding 中对应值，不能使用当前分支、tag 或短 SHA：

```bash
git -C ../brix worktree add --detach \
  /tmp/brix-phase0-audit/brix <BRIX_COMMIT>
git worktree add --detach \
  /tmp/brix-phase0-audit/brix-enterprise <ENTERPRISE_COMMIT>
```

两个 worktree 的 `git status --porcelain=v1 --untracked-files=all` 都必须无输出。证据文件继续
保存在当前工作目录；commit、BOM 与 migration source 则只从审计 worktree 读取。以下命令中的
每个 `--environment` 都必须来自经部署控制面确认的完整目标环境清单：

```bash
python3 scripts/phase0_evidence.py verify \
  --evidence-root docs/phase0-evidence \
  --binding docs/phase0-evidence/artifacts/artifact-binding.json \
  --binding-attestation \
    docs/phase0-evidence/artifacts/artifact-binding.sigstore.json \
  --repository brix=/tmp/brix-phase0-audit/brix \
  --repository brix-enterprise=/tmp/brix-phase0-audit/brix-enterprise \
  --environment production \
  --migration-source \
    platform-tenant=/tmp/brix-phase0-audit/brix/packages/@brix/platform-commons/packages/server/platform-tenant/src/main/resources/db/migration/platform-tenant \
  --migration-source \
    app-tenant=/tmp/brix-phase0-audit/brix-enterprise/packages/@brix/enterprise-solutions/app-tenant/tenant-core/src/main/resources/db/migration/app-tenant \
  --output docs/phase0-evidence/phase0-verification.json
```

每增加一个真实目标环境，就增加一个 `--environment`。校验器要求：

- 每个环境同时具备两个迁移域的 history；
- history 中全部记录成功，每条版本、脚本和 Flyway checksum 均与当前 commit 的迁移源一致；
- 每个环境的实际部署 digest 与同一份 artifact binding 一致；
- deployment record 绑定的 binding 文件本身未被修改；
- 两个 `--repository` 都是 clean checkout，且 origin、完整 commit 与根 BOM/lock 输入 digest
  和签名 binding 完全一致；因此迁移源不能来自任意或已修改的工作树；
- `gh attestation verify` 实时校验 provenance、SBOM 和 binding 三份 Sigstore bundle 的证书、
  时间戳、source commit、signer workflow、predicate type 与 artifact digest；
- 当前迁移 SQL 的 raw-byte SHA-256 被写入最终 verification record。

不得把日常开发工作树作为 `--repository`，也不得通过隐藏 untracked files 或复制 SQL 到
临时目录绕过 commit/BOM 绑定。

未执行但存在于当前源代码的 migration 会记录在 `environmentMigrations.*.*.notApplied`，不会被
工具擅自解释为错误或已发布；审核人须据此冻结每个环境的实际发布状态和后续前滚版本。

最后提交前只纳入脱敏 Flyway JSON、deployment JSON 和 verification JSON。JAR、原始 CSV、
数据库连接配置、密码、私钥均不得提交。SBOM、Sigstore bundle、验证输出和 binding record
应保存在不可变审计存储，并按审计策略决定是否同时纳入受限证据仓库。

`PASS` 只表示传入命令的环境和 standalone Host JAR 已闭环，不自动证明未列出的环境或其他
部署物。Phase 0 审核人必须先把部署控制面的环境/制品清单与命令参数逐项对账。
