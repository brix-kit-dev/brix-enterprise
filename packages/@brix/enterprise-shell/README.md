# Shinwa Platform

> **版本**: 3.0.0  
> **许可**: PROPRIETARY（专有）  
> **品牌**: Shinwa（信和）

---

## 架构定位

**Layer 2.5: 平台能力层（非开源）**

本仓库是信和自研的平台能力层，与 `platform-commons` 功能和层次一致，但不开源。

```text
Layer 3: Host 层（组装层）           ← 引用本层
    ↓
Layer 2.5: 平台能力层 ★ 本仓库 ★     ← 实现平台能力（非开源）
Layer 2.5: platform-commons          ← 实现平台能力（开源）
    ↓
Layer 2: 能力契约层                  ← 依赖（仅接口）
```

### 架构红线

| 规则 | 说明 |
|------|------|
| ❌ 禁止依赖 shinwa-solutions | 不依赖业务层 |
| ✅ 依赖 runtime-sdk-api | 实现能力契约接口 |
| ✅ 可依赖 platform-commons | 复用开源平台能力 |
| ✅ 实现商业专有能力 | 布局、主题、OAuth 等 |

---

## 📦 模块结构

```
shinwa-platform/
├── package.json                    # 根配置
├── pnpm-workspace.yaml
│
├── shinwa-platform-shell-web/      # Web 登录基座
│   ├── src/
│   │   ├── pages/                  # Dashboard、Error Pages
│   │   ├── layouts/                # ConsoleLayout、PortalLayout
│   │   │   ├── ConsoleLayout.tsx   # 后台管理布局
│   │   │   ├── PortalLayout.tsx    # 门户布局
│   │   │   └── MinimalLayout.tsx   # 极简布局
│   │   ├── components/             # LayoutContainer
│   │   ├── hooks/                  # useLayout、useResponsive
│   │   ├── theme/                  # 主题能力实现
│   │   └── oauth/                  # OAuth 认证
│   └── package.json
│
└── shinwa-platform-shell-mobile/   # Mobile 登录基座（待开发）
    └── package.json
```

---

## 与 platform-commons 的关系

| 仓库 | 定位 | 开源状态 | 内容 |
|------|------|----------|------|
| **platform-commons** | 基础平台能力 | ✅ 开源 | 鉴权、事件总线、导航、状态管理 |
| **shinwa-platform** | 商业平台能力 | ❌ 非开源 | 布局、主题、OAuth、品牌定制 |

本仓库依赖 platform-commons，在其基础上提供商业增值能力。

---

## 核心能力

| 能力 | 模块 | 说明 |
|------|------|------|
| **布局能力** | LayoutCapability | 控制台布局、门户布局、极简布局 |
| **主题能力** | ThemeCapability | 亮/暗主题、主题预设、动态切换 |
| **OAuth 能力** | GoogleOAuthService | Google OAuth 2.0 登录 |
| **响应式** | useResponsive | 断点检测、设备适配 |

---

## 快速开始

### 依赖

```bash
pnpm add @shinwa/platform-shell-web
```

### 使用布局

```tsx
import { ConsoleLayout, useLayout } from '@shinwa/platform-shell-web';

function App() {
  const { layoutState } = useLayout(layoutCapability);
  
  return (
    <ConsoleLayout 
      layoutState={layoutState}
      header={<Header />}
      sidebar={<Sidebar />}
    >
      <Outlet />
    </ConsoleLayout>
  );
}
```

---

## ⚠️ 已知问题

**@brix 依赖**：当前仍依赖 `@brix/runtime-sdk-api-web`，需要决定是否迁移到 `@shinwa` 命名空间。

---

## 📄 License

PROPRIETARY - 版权所有 © Shinwa
