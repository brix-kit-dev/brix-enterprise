# Contributing to Shinwa Platform - Solutions

> **版本**: v3.2.0  
> **最后更新**: 2026-02-13

感谢您对 Shinwa Solutions 的贡献！本文档提供了参与项目开发所需的指南。

## 目录

1. [开发环境设置](#开发环境设置)
2. [架构指南](#架构指南)
3. [开发规范](#开发规范)
4. [提交流程](#提交流程)

---

## 开发环境设置

### 环境要求

- **Java**: JDK 17+
- **Maven**: 3.8+
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/shinwa/shinwa-solutions.git
cd shinwa-solutions

# 2. 安装依赖并构建
mvn clean install
pnpm install

# 3. 运行特定插件测试
cd shinwa-app-identity
mvn test

# 4. 运行前端测试
cd shinwa-app-identity/identity-ui-web
pnpm test
```

### 项目结构

```
shinwa-solutions/
├── shinwa-app-identity/              # 身份认证插件
│   ├── identity-server/              # 后端服务
│   │   ├── src/main/java/
│   │   │   └── com/shinwa/identity/
│   │   │       ├── domain/           # 领域层
│   │   │       ├── application/      # 应用层
│   │   │       └── infra/            # 基础设施层
│   │   └── pom.xml
│   └── identity-ui-web/              # Web 前端
│       ├── src/
│       │   ├── domain/               # 领域层
│       │   ├── repository/           # 数据仓库层
│       │   ├── hooks/                # Hooks 层
│       │   ├── pages/                # 页面层
│       │   └── manifest.json         # 插件声明
│       └── package.json
├── shinwa-app-booking/               # 预约管理插件
├── shinwa-app-messenger/             # 消息插件
├── shinwa-app-partners/              # 合作伙伴插件
├── shinwa-app-products/              # 产品管理插件
├── shinwa-app-storage/               # 存储插件
├── shinwa-app-carousel/              # 轮播图插件
├── shinwa-app-contracts/             # 合同管理插件
└── pom.xml
```

---

## 架构指南

### Solutions 职责

shinwa-solutions 是**业务插件层 (Layer 4)**，包含所有业务模块：

- 每个 `shinwa-app-xxx` 是一个独立业务插件
- 插件包含前端 (xxx-ui-web) 和后端 (xxx-server)
- 插件遵循 DDD 分层架构

### 极薄Host架构原则 (Extreme Thin Host)

```
┌─────────────────────────────────────────────────────────────────┐
│  Host Shell (Layer 3)                                           │
│  • 仅组装，不实现                                                │
└─────────────────────────────────────────────────────────────────┘
                              │ @Import / 加载
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  业务插件 (Layer 4) - 独立业务模块                              │  ← 本仓库
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ identity          │  │ booking          │  ...              │
│  │ ├─ server         │  │ ├─ server        │                    │
│  │ └─ ui-web         │  │ └─ ui-web        │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │ 依赖
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  runtime-sdk-api (Layer 2) - 统一能力接口                       │
└─────────────────────────────────────────────────────────────────┘
```

### 架构红线 (Architecture Red Lines)

| 红线编号 | 插件层规则 |
|---------|-----------|
| **R1** | 禁止循环依赖（插件间不能相互依赖） |
| **R2** | 禁止依赖 Host 层实现 |
| **R3** | 通过 SDK 接口访问能力，不直接使用技术 API |
| **R4** | 路由/权限/组件必须在 Manifest 声明 |
| **R6** | 配置必须外部化 |
| **R7** | 前端路由只能在 Manifest 声明 |

### DDD 分层架构 (每个插件内部)

```
┌─────────────────────────────────────────────────────────────────┐
│  表现层 (Presentation)                                          │
│  • Controller (后端)                                            │
│  • Pages/Components (前端)                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  应用层 (Application)                                           │
│  • Service (后端)                                               │
│  • Hooks (前端)                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  领域层 (Domain)                                                │
│  • Entity, ValueObject, DomainService                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  基础设施层 (Infrastructure)                                    │
│  • Repository (后端)                                            │
│  • Repository (前端 - API 调用)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 开发规范

### 后端 Service 规范

```java
/**
 * 用户管理服务
 * 
 * 【架构说明】
 * 应用层服务，编排领域对象完成业务用例。
 * 不包含业务规则，业务规则在领域层。
 * 
 * 【架构红线 R3 合规】
 * 通过 CacheCapability 接口访问缓存，
 * 不直接使用 RedisTemplate。
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final CacheCapability cacheCapability;  // ✅ 通过接口访问
    
    /**
     * 根据 ID 获取用户
     * 
     * @param id 用户 ID
     * @return 用户信息
     * @throws UserNotFoundException 如果用户不存在
     */
    public User findById(Long id) {
        // 优先从缓存获取
        return cacheCapability.get("user:" + id, User.class)
            .orElseGet(() -> {
                User user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));
                cacheCapability.put("user:" + id, user);
                return user;
            });
    }
}
```

### 前端分层规范

```typescript
// ===== domain/User.ts - 领域层 =====
/**
 * 用户实体
 * 
 * 【领域层】纯业务类型定义
 */
export interface User {
    id: string;
    username: string;
    email: string;
    status: UserStatus;
}

// ===== repository/userRepository.ts - 基础设施层 =====
/**
 * 用户数据仓库
 * 
 * 【基础设施层】封装 HTTP 调用
 * 【架构红线 R3 合规】通过 HttpCapability 接口发起请求
 */
export function createUserRepository(http: HttpCapability): UserRepository {
    return {
        async findById(id: string): Promise<User> {
            return http.get(`/api/identity/users/${id}`);
        }
    };
}

// ===== hooks/useUser.ts - 应用层 =====
/**
 * 用户查询 Hook
 * 
 * 【应用层】编排数据获取和状态管理
 */
export function useUser(id: string) {
    const repository = useUserRepository();
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => repository.findById(id)
    });
}

// ===== pages/UserDetail.tsx - 表现层 =====
/**
 * 用户详情页面
 * 
 * 【表现层】纯 UI 渲染，调用 Hook 获取数据
 */
export const UserDetail: React.FC = () => {
    const { id } = useParams();
    const { data: user, isLoading } = useUser(id!);
    
    if (isLoading) return <Loading />;
    return <UserCard user={user} />;
};
```

### Manifest 声明规范

```json
{
    "name": "identity-ui-web",
    "version": "3.2.0",
    "displayName": "身份认证模块",
    
    "routes": [
        {
            "path": "/users",
            "component": "UserList",
            "permissions": ["identity:read"]
        },
        {
            "path": "/users/:id",
            "component": "UserDetail",
            "permissions": ["identity:read"]
        }
    ],
    
    "permissions": [
        {
            "code": "identity:read",
            "name": "查看用户"
        },
        {
            "code": "identity:write",
            "name": "编辑用户"
        }
    ]
}
```

---

## 提交流程

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `refactor/xxx` - 重构
- `test/xxx` - 测试

### Commit 规范

```
feat(identity-server): add user batch import

实现用户批量导入功能。

Refs: #123
```

### Pull Request 检查清单

- [ ] 插件间无相互依赖
- [ ] 通过 SDK 接口访问能力
- [ ] Manifest 声明完整
- [ ] 单元测试覆盖
- [ ] 架构测试通过

---

## 联系方式

- **Issue 追踪**: GitHub Issues
- **技术讨论**: GitHub Discussions
- **安全问题**: security@shinwa.io

---

感谢您的贡献！
