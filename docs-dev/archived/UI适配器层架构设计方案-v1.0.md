# UI 适配器层架构设计方案

> **版本**: 1.0  
> **日期**: 2026-02-23  
> **状态**: 草案  
> **基于**: v3.0.4 运行壳架构设计蓝图

---

## 1. 背景与目标

### 1.1 当前问题

| 问题 | 说明 |
|------|------|
| **配色不一致** | 登录页用 MUI 风格 (`#1976d2`)，基座用 Ant Design 风格 (`#001529`) |
| **样式硬编码** | AppSidebar、AppHeader 直接写死颜色，无法统一切换 |
| **无法替换** | 若要切换 UI 库（MUI → Ant Design），需要大量代码改动 |
| **玩具感图标** | 使用 emoji (📊⚙️) 而非专业矢量图标 |

### 1.2 设计目标

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  核心目标：引入 MUI 同时保持 UI 库可替换性                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 定义 UICapability 契约（纯接口，零依赖）                                  │
│  2. 实现 MUI 适配器（基于 @mui/material）                                     │
│  3. 保留 Native 适配器（当前 CSS-in-JS 实现）                                 │
│  4. Host 层一行配置切换 UI 实现                                               │
│  5. 插件独立——可使用任意 UI 库                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 架构定位

### 2.1 在 v3.0.4 蓝图中的位置

```text
Layer 2: 能力契约层（Capability Contract）
═══════════════════════════════════════════════════════════════════════════════

runtime-sdk/runtime-sdk-api-web/src/types/
├── auth.ts                         # 已有 - 认证契约
├── navigation.ts                   # 已有 - 导航契约
├── theme.ts                        # 已有 - 主题契约
├── layout.ts                       # 已有 - 布局契约
└── ui.ts                           # 【新增】UI 能力契约定义（UIAdapter 接口）


Layer 2.5: UI 能力实现层（Capability Implementation）
═══════════════════════════════════════════════════════════════════════════════

infra-adapters/packages/web/
├── infra-adapter-mf-web/           # 已有 - Module Federation 适配器
├── infra-adapter-router-web/       # 已有 - 路由适配器
├── infra-adapter-state-web/        # 已有 - 状态适配器
│
├── infra-adapter-ui-mui/           # 【新增】MUI 适配器实现
├── infra-adapter-ui-native/        # 【新增】原生 CSS-in-JS 适配器
└── infra-adapter-ui-antd/          # 【可选】Ant Design 适配器
```

### 2.2 依赖关系图

```text
                    ┌───────────────────────────┐
                    │   Host Layer              │
                    │   (host-standalone-web)   │
                    │                           │
                    │   ui: 'mui' | 'native'    │  ← 一行配置切换
                    └─────────────┬─────────────┘
                                  │ 注入
                                  ▼
                    ┌───────────────────────────┐
                    │   Shell Layer             │
                    │   (shinwa-platform-shell) │
                    │                           │
                    │   AppSidebar, AppHeader   │  ← 使用原子组件组装布局
                    │   ProtectedLayout         │
                    │   useUI() → UIAdapter     │
                    └─────────────┬─────────────┘
                                  │ 使用
                    ┌─────────────┴─────────────┐
                    │                           │
        ┌───────────▼───────────┐   ┌───────────▼───────────┐
        │ infra-adapter-ui-mui  │   │ infra-adapter-ui-native│
        │                       │   │                        │
        │ 【只提供原子组件】       │   │ 【只提供原子组件】       │
        │ MuiButton, MuiInput   │   │ NativeButton, NativeInput│
        │ MuiIcon, MuiCard      │   │ NativeIcon, NativeCard │
        │ MuiMenu, MuiModal     │   │ NativeMenu, NativeModal│
        │                       │   │                        │
        │ 【禁止布局组件】         │   │ 【禁止布局组件】        │
        │ ✗ Sidebar, Header     │   │ ✗ Sidebar, Header      │
        │                       │   │                        │
        │ 依赖: @mui/material   │   │ 依赖: 无               │
        └───────────┬───────────┘   └───────────┬────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │ implements
                    ┌─────────────▼─────────────┐
                    │  runtime-sdk-api-web      │
                    │  /src/types/ui.ts         │
                    │                           │
                    │  【只定义原子组件契约】      │
                    │  • ButtonProps, InputProps│
                    │  • IconProps, CardProps   │
                    │  • MenuProps, ModalProps  │
                    │  • ThemeTokens            │
                    │                           │
                    │  【禁止布局组件契约】       │
                    │  ✗ SidebarProps, HeaderProps│
                    │                           │
                    │  依赖: 无 (Pure Types)    │
                    └───────────────────────────┘
```

> **⚠️ 重要约束**：根据蓝图 v3.0.4，`infra-adapters` 只封装技术选型，`Shell 层`负责布局模板。  
> 因此 **Sidebar, Header, Layout 等布局组件在 Shell 层实现**，不在 UIAdapter 中。

---

## 3. 详细设计

### 3.1 runtime-sdk-api-web 契约扩展

**职责**：在现有 types 目录下新增 UI 组件的抽象接口，零依赖，纯 TypeScript 类型

**目录结构**：
```
runtime-sdk/runtime-sdk-api-web/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # 统一导出（需更新）
│   ├── types/
│   │   ├── auth.ts                 # 已有
│   │   ├── capability.ts           # 已有
│   │   ├── navigation.ts           # 已有
│   │   ├── theme.ts                # 已有
│   │   ├── layout.ts               # 已有
│   │   └── ui.ts                   # 【新增】UI 能力契约
│   └── ...
```

**新增文件 ui.ts**：

```typescript
// runtime-sdk-api-web/src/types/ui.ts

import type { ReactNode, FC, ComponentType, MouseEvent, CSSProperties } from 'react';

// ============================================================================
// 基础组件 Props
// ============================================================================

/**
 * 按钮变体
 */
export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

/**
 * 按钮尺寸
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * 按钮 Props（UI 库无关）
 */
export interface ButtonProps {
  /** 按钮变体 */
  variant?: ButtonVariant;
  
  /** 按钮尺寸 */
  size?: ButtonSize;
  
  /** 是否加载中 */
  loading?: boolean;
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 是否全宽 */
  fullWidth?: boolean;
  
  /** 前置图标名称 */
  startIcon?: string;
  
  /** 后置图标名称 */
  endIcon?: string;
  
  /** 点击事件 */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  
  /** 自定义样式 */
  style?: CSSProperties;
  
  /** 自定义类名 */
  className?: string;
  
  /** 子元素 */
  children: ReactNode;
}

// ============================================================================
// 菜单组件 Props（供 Shell 层组装布局使用）
// ============================================================================

/**
 * 菜单项定义
 */
export interface MenuItem {
  /** 唯一标识 */
  key: string;
  
  /** 显示文本 */
  label: string;
  
  /** 图标名称 */
  icon?: string;
  
  /** 路由路径 */
  path?: string;
  
  /** 子菜单 */
  children?: MenuItem[];
  
  /** 是否隐藏 */
  hidden?: boolean;
  
  /** 排序权重 */
  order?: number;
}

/**
 * 菜单组件 Props（原子组件，非布局组件）
 */
export interface MenuProps {
  /** 菜单项列表 */
  items: MenuItem[];
  
  /** 当前选中的 key */
  selectedKey?: string;
  
  /** 选中回调 */
  onSelect?: (key: string, item: MenuItem) => void;
  
  /** 是否折叠模式 */
  collapsed?: boolean;
  
  /** 自定义样式 */
  style?: CSSProperties;
}

// ============================================================================
// 主题系统
// ============================================================================

/**
 * 设计令牌（MUI 标准配色）
 */
export interface ThemeTokens {
  // 品牌色
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContrastText: string;
  
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryContrastText: string;
  
  // 语义色
  error: string;
  warning: string;
  info: string;
  success: string;
  
  // 中性色
  background: string;
  paper: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  divider: string;
  
  // 布局色（Sidebar/Header 专用）
  sidebarBackground: string;
  sidebarText: string;
  sidebarActiveBackground: string;
  sidebarHoverBackground: string;
  headerBackground: string;
  headerText: string;
  
  // 形状
  borderRadiusSmall: number;
  borderRadiusMedium: number;
  borderRadiusLarge: number;
}

export interface ThemeProviderProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

// ============================================================================
// 图标系统
// ============================================================================

export interface IconProps {
  name: string;
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

// ============================================================================
// UIAdapter 主接口
// ============================================================================

/**
 * UI 适配器接口
 * 
 * 定义 UI **原子组件**的统一契约，不同 UI 库实现此接口。
 * 
 * ⚠️ 注意：根据蓝图 v3.0.4，此接口只包含原子组件。
 * 布局组件（Sidebar, Header, Layout）在 Shell 层使用这些原子组件组装。
 * 
 * @example
 * ```typescript
 * // MUI 适配器
 * export const muiAdapter: UIAdapter = {
 *   Button: MuiButton,
 *   Icon: MuiIcon,
 *   Menu: MuiMenu,
 *   // ...
 * };
 * ```
 */
export interface UIAdapter {
  // ========================================
  // 基础表单组件
  // ========================================
  Button: FC<ButtonProps>;
  Input: FC<InputProps>;
  Select: FC<SelectProps>;
  
  // ========================================
  // 显示组件
  // ========================================
  Card: FC<CardProps>;
  Avatar: FC<AvatarProps>;
  Badge: FC<BadgeProps>;
  Tooltip: FC<TooltipProps>;
  
  // ========================================
  // 导航组件（原子级，供 Shell 组装布局）
  // ========================================
  Menu: FC<MenuProps>;          // 菜单列表
  MenuItem: FC<MenuItemProps>;  // 单个菜单项
  
  // ========================================
  // 反馈组件
  // ========================================
  Modal: FC<ModalProps>;
  message: MessageAPI;
  
  // ========================================
  // 主题系统
  // ========================================
  ThemeProvider: FC<ThemeProviderProps>;
  getThemeTokens: () => ThemeTokens;
  
  // ========================================
  // 图标系统
  // ========================================
  Icon: FC<IconProps>;
}

// ⚠️ 【禁止在此接口定义的组件】
// ✗ Sidebar - 在 Shell 层组装
// ✗ Header  - 在 Shell 层组装  
// ✗ Layout  - 在 Shell 层组装

/**
 * UI 适配器配置
 */
export interface UIAdapterConfig {
  defaultTheme?: 'light' | 'dark';
  primaryColor?: string;
  borderRadius?: number;
  fontFamily?: string;
}

/**
 * 创建 UI 适配器的工厂函数类型
 */
export type UIAdapterFactory = (config?: UIAdapterConfig) => UIAdapter;

/**
 * MUI 标准主题令牌（默认值）
 */
export const MUI_THEME_TOKENS: ThemeTokens = {
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  primaryContrastText: '#ffffff',
  
  secondary: '#9c27b0',
  secondaryLight: '#ba68c8',
  secondaryDark: '#7b1fa2',
  secondaryContrastText: '#ffffff',
  
  error: '#d32f2f',
  warning: '#ed6c02',
  info: '#0288d1',
  success: '#2e7d32',
  
  background: '#f5f5f5',
  paper: '#ffffff',
  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  textDisabled: 'rgba(0, 0, 0, 0.38)',
  divider: 'rgba(0, 0, 0, 0.12)',
  
  sidebarBackground: '#1e293b',
  sidebarText: 'rgba(255, 255, 255, 0.87)',
  sidebarActiveBackground: '#1976d2',
  sidebarHoverBackground: 'rgba(255, 255, 255, 0.08)',
  headerBackground: '#ffffff',
  headerText: 'rgba(0, 0, 0, 0.87)',
  
  borderRadiusSmall: 4,
  borderRadiusMedium: 8,
  borderRadiusLarge: 12,
};
```

---

### 3.2 infra-adapter-ui-mui（MUI 实现）

**职责**：基于 @mui/material 实现 UIAdapter 契约（仅原子组件）

**目录结构**：
```
infra-adapters/packages/web/infra-adapter-ui-mui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # 导出 muiAdapter
│   ├── adapter.ts                  # UIAdapter 实现
│   ├── components/
│   │   ├── MuiButton.tsx           # 按钮
│   │   ├── MuiInput.tsx            # 输入框
│   │   ├── MuiSelect.tsx           # 下拉选择
│   │   ├── MuiCard.tsx             # 卡片
│   │   ├── MuiMenu.tsx             # 菜单（原子组件）
│   │   ├── MuiMenuItem.tsx         # 菜单项
│   │   ├── MuiModal.tsx            # 模态框
│   │   ├── MuiAvatar.tsx           # 头像
│   │   ├── MuiBadge.tsx            # 徽章
│   │   ├── MuiTooltip.tsx          # 提示
│   │   └── index.ts
│   │   ⚠️ 【禁止】MuiSidebar.tsx, MuiHeader.tsx（布局组件在 Shell 层）
│   │   └── index.ts
│   ├── theme/
│   │   ├── MuiThemeProvider.tsx
│   │   ├── createMuiTheme.ts
│   │   └── index.ts
│   └── icons/
│       ├── MuiIcon.tsx             # 使用 @mui/icons-material
│       └── index.ts
```

**package.json**：
```json
{
  "name": "@brix/infra-adapter-ui-mui",
  "version": "3.0.0",
  "description": "MUI implementation of UIAdapter",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@shinwa/runtime-sdk-api-web": "workspace:*",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**核心实现示例**：

```typescript
// src/adapter.ts

import type { UIAdapter, UIAdapterConfig, MUI_THEME_TOKENS } from '@shinwa/runtime-sdk-api-web';

import { MuiButton } from './components/MuiButton';
import { MuiInput } from './components/MuiInput';
import { MuiSelect } from './components/MuiSelect';
import { MuiCard } from './components/MuiCard';
import { MuiMenu } from './components/MuiMenu';
import { MuiMenuItem } from './components/MuiMenuItem';
import { MuiAvatar } from './components/MuiAvatar';
import { MuiBadge } from './components/MuiBadge';
import { MuiTooltip } from './components/MuiTooltip';
import { MuiModal } from './components/MuiModal';
import { MuiThemeProvider } from './theme/MuiThemeProvider';
import { MuiIcon } from './icons/MuiIcon';
import { createMessage } from './feedback/message';

// ⚠️ 注意：不导入 MuiSidebar, MuiHeader - 这些在 Shell 层组装

/**
 * 创建 MUI 适配器（仅原子组件）
 */
export function createMuiAdapter(config?: UIAdapterConfig): UIAdapter {
  const tokens = {
    ...MUI_THEME_TOKENS,
    ...(config?.primaryColor && { primary: config.primaryColor }),
  };
  
  return {
    // 基础表单组件
    Button: MuiButton,
    Input: MuiInput,
    Select: MuiSelect,
    
    // 显示组件
    Card: MuiCard,
    Avatar: MuiAvatar,
    Badge: MuiBadge,
    Tooltip: MuiTooltip,
    
    // 导航组件（原子级，供 Shell 组装布局）
    Menu: MuiMenu,
    MenuItem: MuiMenuItem,
    
    // 反馈组件
    Modal: MuiModal,
    message: createMessage(),
    
    // 主题系统
    ThemeProvider: MuiThemeProvider,
    getThemeTokens: () => tokens,
    
    // 图标系统
    Icon: MuiIcon,
    
    // ⚠️ 【禁止】Sidebar, Header - 在 Shell 层组装
  };
}

// 默认导出
export const muiAdapter = createMuiAdapter();
```

```typescript
// src/components/MuiButton.tsx

import React from 'react';
import { Button as MuiMaterialButton, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@shinwa/runtime-sdk-api-web';
import { MuiIcon } from '../icons/MuiIcon';

const VARIANT_MAP = {
  primary: 'contained',
  secondary: 'outlined',
  text: 'text',
  danger: 'contained',
} as const;

const SIZE_MAP = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const;

export const MuiButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  style,
  className,
  children,
}) => {
  return (
    <MuiMaterialButton
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      style={style}
      className={className}
      color={variant === 'danger' ? 'error' : 'primary'}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : startIcon ? (
          <MuiIcon name={startIcon} size="small" />
        ) : undefined
      }
      endIcon={endIcon ? <MuiIcon name={endIcon} size="small" /> : undefined}
    >
      {children}
    </MuiMaterialButton>
  );
};
```

---

### 3.3 infra-adapter-ui-native（原生实现）

**职责**：基于内联样式的轻量实现，无第三方 UI 库依赖（仅原子组件）

**目录结构**：
```
infra-adapters/packages/web/infra-adapter-ui-native/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── adapter.ts
│   ├── components/
│   │   ├── NativeButton.tsx
│   │   ├── NativeInput.tsx
│   │   ├── NativeMenu.tsx
│   │   ├── NativeMenuItem.tsx
│   │   ├── NativeCard.tsx
│   │   ├── NativeModal.tsx
│   │   └── ...
│   │   ⚠️ 【禁止】NativeSidebar.tsx, NativeHeader.tsx（布局组件在 Shell 层）
│   ├── theme/
│   │   └── NativeThemeProvider.tsx
│   └── icons/
│       └── NativeIcon.tsx          # SVG 内联图标
```

**package.json**（零外部依赖）：
```json
{
  "name": "@brix/infra-adapter-ui-native",
  "version": "3.0.0",
  "description": "Native CSS-in-JS implementation of UIAdapter (atomic components only)",
  "dependencies": {
    "@shinwa/runtime-sdk-api-web": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

---

### 3.4 Shell 层布局组装（⭐ 关键）

> **根据蓝图 v3.0.4**：`shinwa-platform-shell-web` 负责布局模板（ConsoleLayout / ProtectedLayout）。  
> Shell 层使用 UIAdapter 提供的原子组件**组装**布局，而不是由 infra-adapter 实现布局。

**目录结构**：
```
shinwa-platform/shinwa-platform-shell-web/
├── src/
│   ├── layouts/
│   │   ├── ProtectedLayout.tsx     # 使用 UIAdapter 组装
│   │   ├── PublicLayout.tsx
│   │   └── MinimalLayout.tsx
│   ├── components/
│   │   ├── AppSidebar.tsx          # 使用 UIAdapter.Menu, UIAdapter.Icon 组装
│   │   ├── AppHeader.tsx           # 使用 UIAdapter.Avatar, UIAdapter.Button 组装
│   │   └── ...
│   ├── ui/
│   │   ├── UIContext.tsx           # UIProvider + useUI hook
│   │   └── index.ts
```

**AppSidebar 示例（Shell 层使用原子组件组装）**：

```typescript
// shinwa-platform-shell-web/src/components/AppSidebar.tsx

import React from 'react';
import { useUI } from '../ui/UIContext';
import type { MenuItem } from '@shinwa/runtime-sdk-api-web';

interface AppSidebarProps {
  menuItems: MenuItem[];
  currentPath: string;
  collapsed: boolean;
  branding?: {
    appName?: string;
    logo?: string;
  };
  onNavigate: (path: string) => void;
  onCollapse?: (collapsed: boolean) => void;
}

/**
 * AppSidebar - Shell 层布局组件
 * 
 * 使用 UIAdapter 的原子组件（Menu, Icon, Avatar）组装侧边栏。
 * 这样无论底层是 MUI、Ant Design 还是 Native，布局逻辑保持一致。
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  menuItems,
  currentPath,
  collapsed,
  branding,
  onNavigate,
}) => {
  // ✅ 通过 useUI 获取原子组件，不直接依赖 MUI
  const { Menu, Icon, Avatar } = useUI();
  const tokens = useUI().getThemeTokens();
  
  const handleSelect = (key: string, item: MenuItem) => {
    if (item.path) {
      onNavigate(item.path);
    }
  };
  
  const sidebarStyle: React.CSSProperties = {
    width: collapsed ? 72 : 256,
    height: '100vh',
    backgroundColor: tokens.sidebarBackground,
    color: tokens.sidebarText,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease-in-out',
  };
  
  const logoAreaStyle: React.CSSProperties = {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    padding: collapsed ? 0 : '0 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  };
  
  return (
    <aside style={sidebarStyle}>
      {/* Logo 区域 */}
      <div style={logoAreaStyle}>
        {branding?.logo ? (
          <img src={branding.logo} alt={branding.appName} style={{ height: 32 }} />
        ) : (
          <Avatar>{branding?.appName?.charAt(0) || 'B'}</Avatar>
        )}
        {!collapsed && (
          <span style={{ marginLeft: 12, fontWeight: 600, fontSize: 18 }}>
            {branding?.appName || 'Brix'}
          </span>
        )}
      </div>
      
      {/* 菜单区域 - 使用 UIAdapter.Menu 原子组件 */}
      <Menu
        items={menuItems}
        selectedKey={currentPath}
        onSelect={handleSelect}
        collapsed={collapsed}
        style={{ flex: 1, paddingTop: 8 }}
      />
    </aside>
  );
};
```

**ProtectedLayout 示例（Shell 层组装完整布局）**：

```typescript
// shinwa-platform-shell-web/src/layouts/ProtectedLayout.tsx

import React from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { AppHeader } from '../components/AppHeader';
import { useUI } from '../ui/UIContext';

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  menuItems,
  user,
  children,
  onNavigate,
  onLogout,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { ThemeProvider, getThemeTokens } = useUI();
  const tokens = getThemeTokens();
  
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* 侧边栏 - Shell 组件，使用 UIAdapter 原子组件组装 */}
        <AppSidebar
          menuItems={menuItems}
          currentPath={location.pathname}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigate}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 顶栏 - Shell 组件，使用 UIAdapter 原子组件组装 */}
          <AppHeader
            user={user}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onLogout={onLogout}
          />
          
          {/* 内容区 */}
          <main style={{ flex: 1, padding: 24, backgroundColor: tokens.background }}>
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};
```

---

### 3.5 UIContext 实现

**修改 `shinwa-platform-shell-web`**：

```typescript
// shinwa-platform-shell-web/src/ui/UIContext.tsx

import { createContext, useContext, type ReactNode } from 'react';
import type { UIAdapter } from '@shinwa/runtime-sdk-api-web';

const UIContext = createContext<UIAdapter | null>(null);

export interface UIProviderProps {
  adapter: UIAdapter;
  children: ReactNode;
}

export function UIProvider({ adapter, children }: UIProviderProps) {
  return (
    <UIContext.Provider value={adapter}>
      {adapter.ThemeProvider ? (
        <adapter.ThemeProvider>{children}</adapter.ThemeProvider>
      ) : (
        children
      )}
    </UIContext.Provider>
  );
}

export function useUI(): UIAdapter {
  const adapter = useContext(UIContext);
  if (!adapter) {
    throw new Error('useUI must be used within UIProvider');
  }
  return adapter;
}
```

---

### 3.6 Host 层配置

**修改 `host-standalone-web/src/App.tsx`**：

```typescript
import { UIProvider } from '@shinwa/shinwa-platform-shell-web';

// 根据配置选择适配器
import { muiAdapter } from '@brix/infra-adapter-ui-mui';
// 或者
// import { nativeAdapter } from '@brix/infra-adapter-ui-native';

const uiAdapter = muiAdapter; // ← 一行切换！

export function App() {
  return (
    <UIProvider adapter={uiAdapter}>
      <BrowserRouter>
        {/* ... 路由配置 ... */}
      </BrowserRouter>
    </UIProvider>
  );
}
```

**更优雅的配置方式（通过环境变量）**：

```typescript
// host-standalone-web/src/config/ui.config.ts

import type { UIAdapter } from '@shinwa/runtime-sdk-api-web';

const UI_ADAPTER_MAP: Record<string, () => Promise<{ default: UIAdapter }>> = {
  mui: () => import('@brix/infra-adapter-ui-mui').then(m => ({ default: m.muiAdapter })),
  native: () => import('@brix/infra-adapter-ui-native').then(m => ({ default: m.nativeAdapter })),
};

export async function loadUIAdapter(): Promise<UIAdapter> {
  const adapterName = import.meta.env.VITE_UI_ADAPTER || 'mui';
  const loader = UI_ADAPTER_MAP[adapterName];
  
  if (!loader) {
    throw new Error(`Unknown UI adapter: ${adapterName}`);
  }
  
  const { default: adapter } = await loader();
  return adapter;
}
```

```env
# .env
VITE_UI_ADAPTER=mui

# .env.lightweight
VITE_UI_ADAPTER=native
```

---

## 4. 实施路线图

### 4.1 阶段划分

| 阶段 | 内容 | 预计时间 | 可交付物 |
|------|------|----------|----------|
| **Phase 1** | 定义 UIAdapter 契约 | 1 天 | `runtime-sdk-api-web/src/types/ui.ts` |
| **Phase 2** | 迁移现有组件到 Native 适配器 | 3 天 | `infra-adapter-ui-native` 包 |
| **Phase 3** | 实现 MUI 适配器 | 5 天 | `infra-adapter-ui-mui` 包 |
| **Phase 4** | Shell 层集成 | 2 天 | `UIProvider` + `useUI` |
| **Phase 5** | Host 层配置切换 | 1 天 | 环境变量配置 |

### 4.2 Phase 1 详细任务

```markdown
□ 在 runtime-sdk-api-web 中新增 UI 契约
  □ 创建 src/types/ui.ts
  □ 定义 UIAdapter 接口
  □ 定义组件 Props（Button, Input, Sidebar, Header 等）
  □ 定义 ThemeTokens（MUI 标准配色）
  □ 定义 IconProps
  □ 更新 src/index.ts 导出新类型

□ 更新 @brix/design-tokens
  □ 统一为 MUI 标准色值
  □ 添加布局专用色（sidebar, header）
```

### 4.3 Phase 2 详细任务

```markdown
□ 创建 infra-adapter-ui-native 包
  □ 实现 NativeButton, NativeInput 基础组件
  □ 实现 NativeMenu, NativeMenuItem 菜单组件
  □ 实现 NativeIcon（SVG 内联图标）
  □ 使用 ThemeTokens 实现主题支持
  □ 替换 emoji 图标为 SVG 内联图标

□ 更新 Shell 层布局组件
  □ 修改 AppSidebar 使用 useUI() 获取 Menu, Icon 原子组件
  □ 修改 AppHeader 使用 useUI() 获取 Button, Avatar 原子组件
  □ 确保布局组件不直接依赖任何 UI 库
```

### 4.4 Phase 3 详细任务

```markdown
□ 创建 infra-adapter-ui-mui 包
  □ 安装 @mui/material, @mui/icons-material, @emotion
  □ 实现 MuiButton, MuiInput, MuiCard 基础组件
  □ 实现 MuiMenu, MuiMenuItem 菜单组件
  □ 实现 MuiIcon（包装 @mui/icons-material）
  □ 实现 MuiAvatar, MuiBadge, MuiTooltip
  □ 实现 MuiThemeProvider（桥接 ThemeTokens → MUI Theme）

注意：布局组件（Sidebar, Header）在 Shell 层，不在此处实现
```

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| MUI 包体积大（~300KB） | 首屏加载变慢 | 1. 使用 Tree Shaking<br>2. 动态导入 MUI 适配器<br>3. 后台系统可接受 |
| MUI 版本升级 | 组件 API 变更 | 适配器层隔离，影响仅限 `infra-adapter-ui-mui` |
| 迁移工作量 | 开发资源占用 | 渐进式迁移，先 Native 后 MUI |
| 插件兼容性 | 插件可能依赖特定 UI 库 | 插件层完全独立，不受 Host UIAdapter 影响 |

---

## 6. 总结

### 6.1 架构优势

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✓ 可替换性    一行配置切换 MUI / Native / Ant Design                       │
│  ✓ 符合蓝图    完全遵循 v3.0.4 infra-adapters 模式                           │
│  ✓ 插件独立    插件可使用任意 UI 库，不受 Host 约束                          │
│  ✓ 渐进采用    先用 Native，需要时切换 MUI                                   │
│  ✓ 测试友好    Mock UIAdapter 即可测试 Shell 逻辑                            │
│  ✓ 风格统一    通过 ThemeTokens 保证登录页与基座风格一致                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 与业界对标

| 项目 | 做法 | 我们的方案 |
|------|------|------------|
| **Radix UI** | Headless + Styled | `runtime-sdk`（契约）+ `infra-adapter-ui-*`（实现） |
| **TanStack** | Adapter Pattern | 相同模式 |
| **Backstage (Spotify)** | 直接用 MUI | 我们更灵活，可切换 |
| **AWS Amplify** | Headless + Connected | 相同理念 |

---

**下一步行动**：确认方案后，我将开始 Phase 1 实施，在 `runtime-sdk-api-web/src/types/ui.ts` 中定义 UIAdapter 契约。
