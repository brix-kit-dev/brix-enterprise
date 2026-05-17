# B2B2C 多租户模型 — 讨论定稿

> **版本**: 2.0（路线 B — Actor/Subject 分离表）  
> **日期**: 2026-04-01  
> **状态**: 待评审  
> **前置**: v1.1-多租户基础功能完整设计方案.md、v3.0.9-运行壳架构设计蓝图.md  
> **目标**: 补齐 B2B2C 场景中 **Subject（终端用户/消费者）** 的模型设计，确保平台不被任何行业语义锁死

---

## 0. 核心共识（讨论结论）

在讨论中达成以下关键共识，作为本文档的设计基石：

**共识 1：Actor 与 Subject 分离存储（路线 B）**
- 原始提案建议"Subject 禁止进入 sys_tenant_member"，初版定稿将 Subject 以 CUSTOMER 放入 sys_tenant_member
- 经过二次讨论，识别出统一表的长期风险：语义污染、生命周期纠缠、"同一人在同一租户既是员工又是客户"场景无法优雅处理
- **最终结论**：新增 `sys_tenant_principal` 表，专门存储 Subject（C 端）的准入凭证，与 `sys_tenant_member`（B 端组织成员）物理分离
- JWT 认证链适配：Actor 用 `mid`（membership_id），Subject 用 `pid`（principal_id），TenantFilter 只依赖 `tid`，不受影响

**共识 2：Membership ≠ Principal ≠ 业务关系**
- `sys_tenant_member` = 组织成员表，回答"谁是这个租户的员工/管理者"
- `sys_tenant_principal` = 访问主体表，回答"谁有权作为外部用户访问这个租户"
- BusinessObject（Case/Order/Enrollment）= 业务关系，回答"为什么来？做什么？"
- 三者各司其职，互不污染

**共识 3：基座层只用通用词汇**
- sys_tenant_member.member_type：`OWNER | ADMIN | MEMBER`（仅 B 端角色）
- sys_tenant_principal.principal_type：`CUSTOMER | GUEST`（仅 C 端角色）
- Patient、Student、Buyer 等行业语义只在 Layer 1 插件中出现

**共识 4：B2B2C 分离模型对齐业界最佳实践**
- Salesforce（User ≠ Contact）、Stripe（Account ≠ Customer）、Shopify（Staff ≠ Customer）、Microsoft Entra ID（Member ≠ Guest）均采用 Actor/Subject 分离模式
- 纯 B2B 产品（Slack、Notion）用统一表，但 Brix 定位是 B2B2C，参考对象应是前者

---

## 1. 角色分类（与原始提案对齐）

### 1.1 四类角色定义

```
Platform
  ├── PlatformAdmin       — 平台运维（sys_platform_admin）
  │
  └── Tenant
       ├── Actor          — 租户运营方（B端）
       │   ├── OWNER      — 租户创建者 / 所有者
       │   ├── ADMIN      — 管理员
       │   └── MEMBER     — 普通职员（医生、店员、教练...）
       │
       ├── Subject        — 被服务方（C端）
       │   └── CUSTOMER   — 终端用户（患者、学员、买家...）
       │
       └── Guest          — 匿名/受限访问者
           └── GUEST      — 未注册但被赋予有限权限的角色
```

### 1.2 角色与存储表的映射

```
角色         存储表                    type 字段          说明
─────────────────────────────────────────────────────────────────────────
Owner        sys_tenant_member         OWNER              租户所有者，1 个租户仅 1 个
Admin        sys_tenant_member         ADMIN              管理员，可管理配置和成员
Member       sys_tenant_member         MEMBER             B 端职员（行业语义由插件定义）
Customer     sys_tenant_principal      CUSTOMER           C 端用户（行业语义由插件定义）
Guest        sys_tenant_principal      GUEST              受限访客（可选，按需启用）
```

> **关键**：Actor 和 Subject 不仅是概念分类，**也是物理分离**。
> Actor → `sys_tenant_member`（组织成员），Subject → `sys_tenant_principal`（访问主体）。

---

## 2. 数据模型

### 2.1 核心结构（Actor/Subject 分离）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 0: sys_identity                                                  │
│  ─────────────────────                                                  │
│  全局唯一身份，1 人 = 1 条记录                                          │
│  字段: id, phone, email, password_hash, status, created_at             │
│  特征: 与租户无关，跨租户共享                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 1A: sys_tenant_member（B 端 — 组织成员）                         │
│  ─────────────────────────────────────────────                          │
│  Actor × 租户 的交叉表                                                  │
│  字段: id, tenant_id, identity_id, member_type, status,                │
│         display_name, joined_at, last_access_at                        │
│  特征:                                                                  │
│   • member_type = OWNER | ADMIN | MEMBER（仅 B 端角色）                │
│   • 1 个 Identity 在每个 Tenant 有 0~1 条 member 记录                  │
│   • 语义: "谁是这个组织的员工/管理者"                                   │
│   • JWT: { sub, tid, mid, mtype=ADMIN, uid }                           │
│   • 准入流程: 邀请 → 审批 → 加入（偏重管理流程）                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 1B: sys_tenant_principal（C 端 — 访问主体）  ← 新增              │
│  ─────────────────────────────────────────────────                      │
│  Subject × 租户 的交叉表                                                │
│  字段: id, tenant_id, identity_id, principal_type, status,             │
│         display_name, joined_at, last_access_at                        │
│  特征:                                                                  │
│   • principal_type = CUSTOMER | GUEST（仅 C 端角色）                   │
│   • 1 个 Identity 在每个 Tenant 有 0~1 条 principal 记录               │
│   • 语义: "谁有权作为外部用户访问这个租户"                              │
│   • JWT: { sub, tid, pid, ptype=CUSTOMER, uid }                        │
│   • 准入流程: 扫码/预约/链接 → 自动创建（偏重自动化）                  │
│   • 与 member 表完全独立 — 同一人可同时是 A 租户的 MEMBER              │
│     和 A 租户的 CUSTOMER（如：医生在自己诊所看病）                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 2: biz_user_profile                                              │
│  ──────────────────────────                                             │
│  租户内用户档案（每租户独立记录）                                        │
│  字段: id, tenant_id, ref_type, ref_id, nickname, avatar_url,          │
│         preferences, metadata, created_at, updated_at                  │
│  特征:                                                                  │
│   • ref_type = 'MEMBER' | 'PRINCIPAL'（指向来源表）                    │
│   • ref_id = member_id 或 principal_id                                 │
│   • UNIQUE(tenant_id, ref_type, ref_id) — 防止重复 profile            │
│   • 同一人在不同租户有不同 profile（张三在 A 租户叫"张三",              │
│     在 B 租户叫"三哥"）                                               │
│   • preferences: JSONB，存储该用户在该租户的个人偏好                     │
│   • metadata: JSONB，存储扩展信息（插件可往里写）                       │
│   • tenant_id 隔离: TenantInterceptor 自动保障                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 sys_tenant_principal 表定义

```sql
-- Flyway: V007__create_sys_tenant_principal.sql

CREATE TABLE IF NOT EXISTS sys_tenant_principal (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    identity_id     BIGINT NOT NULL,
    
    principal_type  VARCHAR(20) NOT NULL,  -- CUSTOMER | GUEST
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DISABLED | REVOKED
    display_name    VARCHAR(100),
    
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    last_access_at  TIMESTAMP,
    
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uk_principal_tenant_identity UNIQUE (tenant_id, identity_id),
    CONSTRAINT fk_principal_tenant FOREIGN KEY (tenant_id) REFERENCES sys_tenant(id),
    CONSTRAINT fk_principal_identity FOREIGN KEY (identity_id) REFERENCES sys_identity(id),
    CONSTRAINT chk_principal_type CHECK (principal_type IN ('CUSTOMER', 'GUEST'))
);

CREATE INDEX idx_principal_tenant ON sys_tenant_principal(tenant_id);
CREATE INDEX idx_principal_identity ON sys_tenant_principal(identity_id);
```

### 2.3 JWT 认证链适配（双轨并行）

```
Actor（B 端）签发链 — 不变:
  sys_identity (sub) + sys_tenant_member (tid, mid, mtype) + biz_user_profile (uid)
  → JWT: { sub, tid, mid, mtype=ADMIN, uid, role=actor }

Subject（C 端）签发链 — 新增:
  sys_identity (sub) + sys_tenant_principal (tid, pid, ptype) + biz_user_profile (uid)
  → JWT: { sub, tid, pid, ptype=CUSTOMER, uid, role=subject }

收请求时（统一处理）:
  JWT → TenantFilter(解析 tid)             ← 只依赖 tid，两种 Token 都有
     → TenantContext.set(tid)              ← 不受影响
     → AuthFilter(验证 mid 或 pid 有效)    ← 多一个 IF 分支
     → SecurityContext                     ← 不受影响
     → TenantInterceptor                   ← 只依赖 tenant_id，不受影响
     → SQL WHERE tenant_id = ?             ← 不受影响

登录时判断逻辑:
  1. 验证凭证 → 获得 identity_id
  2. 查询 sys_tenant_member WHERE identity_id = ?  → actor_list
  3. 查询 sys_tenant_principal WHERE identity_id = ? → subject_list
  4. 合并: available_tenants = actor_list ∪ subject_list（标注角色类型）
  5. 用户选择租户 → 根据来源表签发对应类型的 JWT

同租户双身份展示规则:
  • 若同一 identity 在同一 tenant 下同时存在 member + principal 记录，
    租户选择器展示为**同一租户两个入口**，而非两个重复租户卡片
  • 例如:
      ┌─────────────────────────────────┐
      │  A 诊所（员工身份 — MEMBER）     │
      │  A 诊所（客户身份 — CUSTOMER）   │
      │  B 医院（客户身份 — CUSTOMER）   │
      └─────────────────────────────────┘
  • 前端按 tenant_id 分组，每个身份单独一行，角色标签区分

JWT 互斥规则（硬约束）:
  • JWT 中 mid 与 pid **必须互斥**，不允许同时存在
  • mid 存在 → Actor Token（B 端身份）
  • pid 存在 → Subject Token（C 端身份）
  • 签发时二选一，校验时按存在的字段分派，不存在第三种混合态
```

### 2.4 三表关系 — Member vs Principal vs BusinessObject

```
┌──────────────────────┬────────────────────────┬──────────────────────┬────────────────────┐
│                      │  Member（组织成员）     │  Principal（访问主体）│  BusinessObject    │
│                      │  sys_tenant_member      │  sys_tenant_principal│  （业务关系）       │
├──────────────────────┼────────────────────────┼──────────────────────┼────────────────────┤
│  存储谁              │  B 端: 员工/管理者     │  C 端: 客户/访客     │  业务: 病例/订单   │
│  回答的问题          │  "谁管理这个租户？"    │  "谁来消费服务？"    │  "为什么来？"      │
│  创建方式            │  邀请 → 审批 → 加入   │  扫码/预约 → 自动   │  业务行为触发      │
│  生命周期            │  与雇佣关系共存亡      │  与服务关系共存亡   │  可独立结束        │
│  基座层感知          │  ✅ 平台内核依赖       │  ✅ 平台内核依赖    │  ❌ 只有插件知道   │
│  行业语义            │  无                    │  无                  │  有                │
│  同一租户可共存      │  1 人最多 1 条         │  1 人最多 1 条      │  不限              │
│  与另一表冲突        │  不冲突 — 独立表       │  不冲突 — 独立表    │  N/A               │
└──────────────────────┴────────────────────────┴──────────────────────┴────────────────────┘

关键优势: 同一人可同时持有 member + principal 记录（如医生在自己诊所看病）
```

### 2.5 行业映射示例

```
行业       Actor(MEMBER)     Subject(CUSTOMER)   BusinessObject
─────────────────────────────────────────────────────────────────
医疗       医生/药师          患者                 Case（病例）
教育       教师/教练          学员                 Enrollment（报名）
电商       店铺运营           买家                 Order（订单）
法律       律师/助理          当事人               LegalCase（案件）
健身       教练               会员                 Membership（会籍）
```

> 上表中的 BusinessObject 均由 **Layer 1 行业插件** 定义，基座层完全不感知。

---

## 3. BusinessObject 的设计原则（契约式，非基座表）

### 3.1 原始提案的调整

原始提案建议在基座层创建 `biz_object` 表，存储所有业务对象的公共字段。经讨论认为此方案有风险：

- 基座层一旦有 `biz_object` 表，就必须定义 `object_type`、`status` 等字段，这些字段的枚举值不可避免地染上行业色彩
- 违反蓝图约束 C-5："Base 层零行业名词"

### 3.2 推荐方案：Capability Contract（能力契约）

```java
/**
 * 位于 runtime-sdk-api（Layer 2A）
 * 
 * 基座层不定义 BusinessObject 的表结构，
 * 而是提供一个可选的 Capability Contract，
 * 让行业插件自行决定是否实现。
 */
public interface BusinessObjectCapability {

    /**
     * 查询某个 Subject（CUSTOMER）在当前租户下的业务对象摘要
     * 
     * 用途：
     * - 通用 UI 可以展示"我的业务" 列表
     * - 不需要知道具体是什么类型的业务
     */
    List<BusinessObjectSummary> listBySubject(String principalId);

    /**
     * 检查某个 Subject 是否有活跃的业务关系
     * 
     * 用途：
     * - 判断 Subject 是否可以被停用（有活跃业务则不可）
     */
    boolean hasActiveBusinessRelation(String principalId);
}

/**
 * 通用摘要 — 字段全部是中性的
 */
class BusinessObjectSummary {
    String id;
    String objectType;    // 插件自定义: "medical_case" | "enrollment" | "order"
    String title;         // 显示标题（插件自行格式化）
    String status;        // 插件自定义状态
    Instant createdAt;
    Instant updatedAt;
    Map<String, Object> metadata;  // 插件自由扩展
}
```

### 3.3 行业插件的具体表由插件自己创建

```sql
-- 医疗插件创建（enterprise-solutions 层）
CREATE TABLE medical_case (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    patient_principal_id BIGINT NOT NULL, -- 指向 sys_tenant_principal(CUSTOMER)
    doctor_member_id  BIGINT,            -- 指向 sys_tenant_member(MEMBER)
    case_number     VARCHAR(50),
    diagnosis       TEXT,
    status          VARCHAR(20),         -- OPEN | IN_PROGRESS | CLOSED
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    -- ... 更多医疗特有字段
    CONSTRAINT fk_mc_tenant FOREIGN KEY (tenant_id) REFERENCES sys_tenant(id),
    CONSTRAINT fk_mc_patient FOREIGN KEY (patient_principal_id) REFERENCES sys_tenant_principal(id),
    CONSTRAINT fk_mc_doctor FOREIGN KEY (doctor_member_id) REFERENCES sys_tenant_member(id)
);

-- 教育插件创建（另一个 enterprise-solutions 层）
CREATE TABLE enrollment (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    student_principal_id BIGINT NOT NULL, -- 指向 sys_tenant_principal(CUSTOMER)
    course_id       BIGINT NOT NULL,
    status          VARCHAR(20),         -- ENROLLED | COMPLETED | DROPPED
    enrolled_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    -- ... 更多教育特有字段
    CONSTRAINT fk_enroll_tenant FOREIGN KEY (tenant_id) REFERENCES sys_tenant(id),
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_principal_id) REFERENCES sys_tenant_principal(id)
);
```

> **要点**：C 端业务表通过外键 `xxx_principal_id → sys_tenant_principal(id)` 关联，
> B 端业务表通过外键 `xxx_member_id → sys_tenant_member(id)` 关联。
> 两张表各司其职，语义清晰。

---

## 4. Subject 的全生命周期

### 4.1 Subject 进入租户的流程

```
Step 1: Subject 注册/登录
  └─ 验证手机号/邮箱 → 获取或创建 sys_identity

Step 2: Subject 首次接触某租户
  └─ 触发方式（择一）：
     a) 租户员工手动邀请（后台添加患者/学员）
     b) Subject 接受邀请 / 确认加入租户
     c) Subject 完成注册并绑定租户
     d) 业务行为触发（如提交预约、完成报名时自动创建）
  └─ ⚠️ 硬规则：sys_tenant_principal 仅在"完成有效准入动作"后创建。
     单纯浏览品牌页、扫码预览、访问公开链接，不自动创建 principal。
     有效准入动作 = 提交预约 | 接受邀请 | 确认加入 | 完成注册并绑定租户。
  └─ 系统自动创建：
     • sys_tenant_principal (identity_id, tenant_id, principal_type=CUSTOMER, status=ACTIVE)
     • biz_user_profile (ref_type=PRINCIPAL, ref_id=principal_id, tenant_id, nickname=...)
  └─ 发布领域事件: PrincipalJoinedEvent { tenantId, principalId, principalType=CUSTOMER }

Step 3: 行业插件监听事件，创建业务对象
  └─ 医疗插件监听 PrincipalJoinedEvent → 创建 medical_case（如果有预约触发）
  └─ 教育插件监听 PrincipalJoinedEvent → 创建 enrollment（如果有报名触发）
  └─ 或者：不立即创建，等具体业务行为发生再创建

Step 4: Subject 日常使用
  └─ JWT: { sub=identity_id, tid=tenant_id, pid=principal_id, ptype=CUSTOMER, uid=profile_id }
  └─ 所有 API 调用自动带 TenantContext → 数据隔离
  └─ 可在不同租户间切换（同一人在多个机构就医/学习/购物）

Step 5: Subject 偏好管理（每租户独立）
  └─ PATCH /api/v1/user/preferences
     Body: { "locale": "en-US", "theme": "dark" }
  └─ 写入 biz_user_profile.preferences（当前租户的那条记录）
  └─ 在 A 租户设置英文，不影响 B 租户的中文设置
```

### 4.2 多租户 Subject 的数据隔离

```
张三（身份: id_001, 手机: 138xxxx）

在 A 医疗的数据:
  sys_tenant_principal: { id: p_001, tenant_id: t_a, principal_type: CUSTOMER }
  biz_user_profile:     { id: up_001, tenant_id: t_a, ref_type: PRINCIPAL, ref_id: p_001,
                           nickname: "张三", preferences: { locale: "zh-CN" } }
  medical_case:         { id: mc_001, tenant_id: t_a, patient_principal_id: p_001,
                           case_number: "A-2024-001" }

在 B 医疗的数据:
  sys_tenant_principal: { id: p_002, tenant_id: t_b, principal_type: CUSTOMER }
  biz_user_profile:     { id: up_002, tenant_id: t_b, ref_type: PRINCIPAL, ref_id: p_002,
                           nickname: "三哥", preferences: { locale: "ja-JP" } }
  medical_case:         { id: mc_002, tenant_id: t_b, patient_principal_id: p_002,
                           case_number: "B-2024-088" }

隔离保障:
  • 张三登录 A 医疗 → JWT.tid = t_a → TenantInterceptor → 只能看到 t_a 的数据
  • 张三切换到 B 医疗 → 换发 JWT.tid = t_b → 只能看到 t_b 的数据
  • A 医疗的管理员无法看到张三在 B 医疗的任何数据

特殊场景 — 李医生在自己诊所看病:
  sys_tenant_member:    { id: m_010, tenant_id: t_c, member_type: MEMBER }    ← 职员身份
  sys_tenant_principal: { id: p_010, tenant_id: t_c, principal_type: CUSTOMER } ← 患者身份
  biz_user_profile:     两条记录，分别指向 m_010 和 p_010
  → 登录时可选择"以员工身份进入"或"以患者身份进入"，分别签发不同 JWT
```

### 4.3 Principal 生命周期硬约束

> **硬规则**：Principal 的生命周期独立于单个 BusinessObject。
> Case/Order/Enrollment 结束时，**不自动删除或失效** Principal 记录。
> Principal 仅在以下情况失效：
> - Subject 显式退出租户（主动解绑）
> - 租户侧管理员解绑/停用该 Principal
> - Principal 状态被设为 `DISABLED` 或 `REVOKED`
>
> 理由：一个 Subject 可能在同一租户有多次业务往来（多次就医、多次购物），
> Principal 代表的是"准入权"而非"单次业务关系"。

### 4.4 跨租户聚合能力（预留）

> 平台保留基于 `identity_id` 聚合多个 Principal 的能力，用于未来跨租户 Subject 视图。
> 例如：Subject 登录后查看"我在所有机构的业务汇总"。
>
> 实现路径（不在当前版本实施，仅预留数据结构）：
> - `sys_tenant_principal` 已有 `identity_id` 字段
> - 查询: `SELECT * FROM sys_tenant_principal WHERE identity_id = ? AND status = 'ACTIVE'`
> - 即可获得该身份在所有租户的 Principal 列表，无需额外表

---

## 5. 与 v3.0.9 蓝图的约束对齐检查

### 5.1 逐项对照

```
蓝图约束                    本方案的合规性                           结论
────────────────────────────────────────────────────────────────────────
C-1: 契约→实现分离          BusinessObjectCapability 在 Layer 2A,     ✅
                            实现在 Layer 1 插件
                            
C-2: Host 不含业务代码      Host 只处理通用准入主体（Member /            ✅
                            Principal）的认证上下文，不感知具体
                            业务对象（Case / Enrollment / Order）
                            
C-3: 插件可独立部署         医疗插件、教育插件各自独立，                ✅
                            各自创建自己的表
                            
C-5: Base 层零行业名词      sys_tenant_member 只有 OWNER|ADMIN|        ✅
                            MEMBER，sys_tenant_principal 只有
                            CUSTOMER|GUEST，没有 PATIENT/
                            STUDENT/BUYER
                            
C-6: 所有状态通过契约暴露   TenantCapability 暴露 membership，         ✅
                            BusinessObjectCapability 暴露业务摘要
                            
C-9: 前端 Hook ≤ 15 个     useTenant() + useTenantConfig() 现有      ✅
                            无需新增更多 Hook
```

### 5.2 与当前代码库的兼容性

```
现有实现                         需要的变更                          影响
──────────────────────────────────────────────────────────────────────────
sys_identity           无变更                                      无
sys_tenant             无变更                                      无
sys_tenant_member      移除 CUSTOMER/GUEST（只保留 B 端角色）    小
                       member_type CHECK 约束调整
sys_tenant_principal   新建表（V007 Flyway）                     新增
biz_user_profile       新增 ref_type/ref_id 替代 member_id      小
TenantFilter           无变更（只依赖 tid）                      无
TenantContext          无变更                                      无
TenantInterceptor      无变更（只依赖 tenant_id）                无
JWT 签发逻辑           新增 principal 分支（pid/ptype）       中
AuthFilter             新增 pid 验证分支                         中
enterprise-solutions   外键从 member_id 改为 principal_id    小
```

> **结论**：基座层需要新增 `sys_tenant_principal` 表 + 调整 JWT/Auth 双轨逻辑。
> TenantContext/TenantFilter/TenantInterceptor 核心链路不受影响。

---

## 6. 需要新增的内容（按优先级）

### P0 — 基座层变更（平台内核）

```sql
-- 1. 新建 sys_tenant_principal 表（V007 Flyway）
-- 2. sys_tenant_member 移除 CUSTOMER/GUEST，CHECK 约束调整为 (OWNER|ADMIN|MEMBER)
-- 3. biz_user_profile 新增 ref_type + ref_id 字段，替代原 member_id
--    新增 UNIQUE(tenant_id, ref_type, ref_id) 约束，防止重复 profile
```

```java
// 4. JWT 签发 — 新增 principal 分支
//    Actor:   claims.put("mid", member.getId());  claims.put("mtype", member.getType());
//    Subject: claims.put("pid", principal.getId()); claims.put("ptype", principal.getType());

// 5. AuthFilter — 新增 pid 验证
//    if (claims.has("mid"))  → 查 sys_tenant_member
//    if (claims.has("pid"))  → 查 sys_tenant_principal

// 6. 登录流程 — 合并查询 member + principal 列表
//    租户选择器展示时标注角色类型（员工 vs 客户）
```

### P1 — 契约层新增（runtime-sdk-api）

```java
// 1. BusinessObjectCapability — 可选契约
//    让通用 UI 能展示 Subject 的业务列表，不依赖具体行业类型
public interface BusinessObjectCapability {
    List<BusinessObjectSummary> listBySubject(String principalId);
    boolean hasActiveBusinessRelation(String principalId);
}

// 2. PrincipalJoinedEvent / PrincipalLeftEvent — 领域事件
//    让插件能响应 Subject 加入/离开租户
public record PrincipalJoinedEvent(
    String tenantId,
    String principalId,
    String principalType,   // CUSTOMER | GUEST
    String identityId,
    Instant joinedAt
) {}

// 3. MemberJoinedEvent / MemberLeftEvent — 保留（B 端专用）
public record MemberJoinedEvent(
    String tenantId,
    String memberId,
    String memberType,   // OWNER | ADMIN | MEMBER
    String identityId,
    Instant joinedAt
) {}
```

### P2 — 行业插件层新增（enterprise-solutions）

以医疗行业为例：
```java
// MedicalCasePlugin 监听通用事件，创建行业数据
@EventListener
public void onPrincipalJoined(PrincipalJoinedEvent event) {
    if ("CUSTOMER".equals(event.principalType())) {
        patientService.ensurePatientRecord(event.tenantId(), event.principalId());
    }
}

// 实现 BusinessObjectCapability
@Component
public class MedicalBusinessObjectProvider implements BusinessObjectCapability {
    @Override
    public List<BusinessObjectSummary> listBySubject(String principalId) {
        return medicalCaseRepo.findByPatientPrincipalId(principalId)
            .stream()
            .map(c -> new BusinessObjectSummary(
                c.getId(), "medical_case", c.getCaseNumber(), c.getStatus(), ...))
            .toList();
    }
}
```

### P3 — 前端 Subject 体验（可选增强）

```typescript
// 通用的"我的业务"页面 — 位于 platform-web（基座前端）
function MyBusinessObjects() {
  const { principalId } = useTenant();
  const { data } = useQuery(['businessObjects', principalId],
    () => api.get('/api/v1/business-objects/mine'));

  return (
    <List>
      {data?.map(obj => (
        <ListItem
          key={obj.id}
          title={obj.title}
          subtitle={obj.objectType}
          status={obj.status}
          onClick={() => navigate(`/biz/${obj.objectType}/${obj.id}`)}
        />
      ))}
    </List>
  );
}
```

---

## 7. 原始提案逐项对照与最终决策

| # | 原始提案观点 | 讨论结论 | 最终决策 |
|---|-------------|---------|---------|
| 1 | Subject 禁止进入 sys_tenant_member | 原始提案的担忧合理：统一表有语义污染和抽象层级下降风险 | **采纳**：新建 `sys_tenant_principal` 表，Subject 不进入 member 表，Actor/Subject 物理分离 |
| 2 | 新建 subject_profile 表（平台层） | biz_user_profile 已支持 per-tenant 独立记录，新增 ref_type 区分来源 | **复用+扩展**：biz_user_profile 新增 ref_type/ref_id，同时服务 member 和 principal |
| 3 | 新建 biz_object 基座表 | 在基座层定义 object_type 枚举会引入行业耦合 | **调整**：改为 BusinessObjectCapability 契约，插件自建表 |
| 4 | subject_app_preference 独立表 | biz_user_profile.preferences JSONB 已覆盖此需求 | **复用**：直接使用 preferences 字段 |
| 5 | Actor/Subject 概念区分 | 不仅概念区分，应该物理分离 | **升级**：概念区分 + 数据层分离（两张表） |
| 6 | Case 作为业务关系载体 | 完全认同，Case/BusinessObject 是行业语义，不属于基座 | **保留**：由行业插件实现，基座层通过可选契约桥接 |
| 7 | 平台通用性不被行业锁死 | 这是第一优先级 | **达成**：分离表比统一表更彻底地防止语义污染 |

---

## 8. 通用性验证 — 行业切换测试

> 假设 Brix 平台从医疗行业切换到在线教育行业，需要改什么？

```
需要改的（全在插件层）：
  ✅ 卸载 enterprise-solutions/medical 插件
  ✅ 安装 enterprise-solutions/education 插件
  ✅ 教育插件自建 course, enrollment, lesson_record 等表
  ✅ 教育插件实现 BusinessObjectCapability（返回报名记录）

不需要改的（基座层不动）：
  ✗ sys_identity — 不动
  ✗ sys_tenant — 不动
  ✗ sys_tenant_member — 不动（只存 B 端，与行业无关）
  ✗ sys_tenant_principal — 不动（CUSTOMER 还是 CUSTOMER）
  ✗ biz_user_profile — 不动（换了 nickname 内容，结构不变）
  ✗ JWT 签发逻辑 — 不动（pid/ptype 与行业无关）
  ✗ TenantFilter / TenantContext / TenantInterceptor — 不动
  ✗ 前端 useTenant() / useTenantConfig() — 不动
```

**结论**：行业切换 = 插件热替换，基座层零修改。通用性已保障。

---

## 9. 路线 B vs 路线 A 的决策依据

```
筛选维度                    路线 A（统一表）            路线 B（分离表）  ← 采纳
─────────────────────────────────────────────────────────────────────────
同人同租户双角色         ⚠️ 打破唯一约束          ✅ 天然支持
语义污染风险             ⚠️ "member" 含 C 端      ✅ 各司其职
生命周期独立             ⚠️ 混在一起管理        ✅ 独立演进
C 端百万级扩展           ⚠️ 污染 B 端查询        ✅ 物理隔离
行业对齐                  Slack/Notion(B2B)       Salesforce/Stripe/Shopify(B2B2C)
基座改动成本             ✅ 零                    ⚠️ 新建表 + JWT 双轨
```

**最终决策：采用路线 B**。短期多一张表和一个 JWT 分支的成本，换取长期的语义清晰、扩展安全、行业对齐。

---

## 10. 下一步行动

1. **评审本文档** — 确认路线 B 方案无遗漏
2. **将本文档结论写入 v1.2 设计方案** — 作为新增章节（第 13 章：B2B2C 模型扩展）
3. **创建 V007 Flyway** — sys_tenant_principal 建表迁移
4. **调整 sys_tenant_member** — 移除 CUSTOMER/GUEST，收窄 CHECK 约束
5. **调整 biz_user_profile** — 新增 ref_type/ref_id，替代 member_id
6. **JWT/AuthFilter 双轨适配** — mid 和 pid 并行支持
7. **定义 PrincipalJoinedEvent** — 在 runtime-sdk-api 中声明（P1）
8. **定义 BusinessObjectCapability** — 在 runtime-sdk-api 中声明（P1）
9. **医疗插件适配** — 外键从 member_id 调整为 principal_id（P2）
