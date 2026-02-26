# Contributing to Shinwa Platform - Platform Shell

> **版本**: v3.2.0  
> **最后更新**: 2026-02-13

感谢您对 Shinwa Platform Shell 的贡献！本文档提供了参与项目开发所需的指南。

## 目录

1. [开发环境设置](#开发环境设置)
2. [架构指南](#架构指南)
3. [开发规范](#开发规范)
4. [提交流程](#提交流程)

---

## 开发环境设置

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/shinwa/shinwa-platform.git
cd shinwa-platform

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 运行测试
pnpm test

# 5. 运行 lint 检查
pnpm lint
```

### 项目结构

```
shinwa-platform/
├── shinwa-platform-shell-mobile/    # 移动端 Shell
│   ├── src/
│   │   ├── bootstrap/               # 应用引导
│   │   ├── layout/                  # 布局组件
│   │   └── navigation/              # 导航配置
│   └── package.json
├── shinwa-platform-shell-web/       # Web 端 Shell
│   ├── src/
│   │   ├── bootstrap/               # 应用引导
│   │   ├── layout/                  # 布局组件
│   │   ├── router/                  # 路由配置
│   │   └── manifest-loader/         # Manifest 加载器
│   └── package.json
├── eslint.config.cjs                # ESLint 架构规则
├── tsconfig.base.json
└── package.json
```

---

## 架构指南

### Shell 职责

shinwa-platform 是**前端 Host 壳层**，职责：

- 应用入口和引导
- Manifest 加载和解析  
- 路由注册
- 布局渲染
- 插件加载协调

### 极薄Host架构原则 (Extreme Thin Host)

```
┌─────────────────────────────────────────────────────────────────┐
│  Shell (Platform Host) - 纯组装层                               │  ← 本仓库
│  • 加载 Manifest                                                │
│  • 注册路由                                                     │
│  • 渲染布局                                                     │
│  • 不包含业务逻辑                                                │
│  • 不包含 UI 组件实现                                            │
└─────────────────────────────────────────────────────────────────┘
                              │ 加载
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  业务插件 (Layer 4) - 独立部署                                  │
│  • identity-ui-web, booking-ui-web, ...                         │
└─────────────────────────────────────────────────────────────────┘
```

### 架构红线 (Architecture Red Lines)

| 红线编号 | Shell 层规则 |
|---------|-------------|
| **R1** | 禁止循环依赖 |
| **R2** | 禁止依赖业务插件代码 |
| **R3** | 通过接口访问能力，不直接使用技术 API |
| **R4** | 路由/权限/组件必须通过 Manifest 声明 |
| **R7** | 路由只能在 Manifest 中声明 |

### Manifest 驱动

```typescript
// ✅ Shell 从 Manifest 读取路由配置
const manifest: PluginManifest = await loadManifest('identity-ui-web');

// 注册路由
manifest.routes.forEach(route => {
    router.addRoute({
        path: route.path,
        component: () => loadRemoteComponent(manifest.name, route.component),
        meta: { permissions: route.permissions }
    });
});
```

---

## 开发规范

### Shell 组件规范

```typescript
/**
 * 应用布局组件
 * 
 * 【架构说明】
 * Shell 层布局组件，负责页面整体结构。
 * 不包含业务逻辑，仅提供布局容器。
 * 
 * 【架构红线 R2 合规】
 * 布局组件不依赖任何业务插件，
 * 插件内容通过 router-view 渲染。
 * 
 * @component AppLayout
 * @version 3.2.0
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                {children}
            </main>
        </div>
    );
};
```

### Manifest 加载器规范

```typescript
/**
 * Manifest 加载器
 * 
 * 【架构说明】
 * 负责加载和解析插件 Manifest 配置。
 * 支持静态导入和远程加载两种模式。
 * 
 * 【架构红线 R4 合规】
 * 所有插件配置通过 Manifest 声明，
 * Shell 不硬编码任何插件信息。
 * 
 * @module manifest-loader
 * @version 3.2.0
 */
export async function loadManifest(pluginId: string): Promise<PluginManifest> {
    // 实现
}

export function registerManifest(manifest: PluginManifest): void {
    // 注册路由
    manifest.routes?.forEach(registerRoute);
    
    // 注册组件
    manifest.components?.forEach(registerComponent);
    
    // 注册权限
    manifest.permissions?.forEach(registerPermission);
}
```

### 命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 布局组件 | `Xxx + Layout` | `AppLayout`, `SidebarLayout` |
| 引导模块 | `bootstrap` | `bootstrap/index.ts` |
| 路由配置 | `router` | `router/index.ts` |

---

## 提交流程

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `refactor/xxx` - 重构
- `perf/xxx` - 性能优化

### Commit 规范

```
feat(shell-web): add dynamic manifest loading

支持运行时动态加载插件 Manifest。

Refs: #567
```

### Pull Request 检查清单

- [ ] 不包含业务逻辑
- [ ] 不直接依赖业务插件
- [ ] 配置通过 Manifest 驱动
- [ ] ESLint 架构规则通过

---

## 联系方式

- **Issue 追踪**: GitHub Issues
- **技术讨论**: GitHub Discussions
- **安全问题**: security@shinwa.io

---

感谢您的贡献！
