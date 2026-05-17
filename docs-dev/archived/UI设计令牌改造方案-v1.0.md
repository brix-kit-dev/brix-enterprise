# UI 设计令牌改造方案

> **版本**: 2.0  
> **日期**: 2026-03-28  
> **状态**: 草案  
> **依据**: v3.0.9 运行壳架构设计蓝图 — 约束 9（BrixUI 统一治理）、ThemeCapability 合约  
> **前置**: BrixUI 组件扩展与治理改造计划-v1.0、UI 适配器层架构设计方案-v1.0  
> **评审发现**: 架构评审报告-v1.0 遗漏项（LL 层次不符 / Medium）  
> **v2.0 变更**: DesignTokens 从"MUI 语义"升级为"Brix 语义"，彻底去 UI 库耦合

---

## 1. 背景与目标

### 1.1 问题诊断

| 问题 | 现状 | 违规证据 | 影响 |
|------|------|---------|------|
| **插件自建 MUI 令牌** | `partnerThemeTokens` / `caseThemeTokens` 定义完整的 palette/shape/typography | `PartnerCard.tsx:31` — `const { palette, shape } = partnerThemeTokens` | UI 库不可替换，主题切换失效 |
| **ThemeCapability API 粒度不足** | 仅暴露 `getColor(key)` / `getConfig()`，不提供完整设计令牌 | `theme.ts` — ThemeCapability 无 `getDesignTokens()` | 插件被迫自建令牌以获取 spacing/shape/typography |
| **design-tokens 包未被插件消费** | `@brix-sdk/design-tokens` 仅被 platform 层使用 | enterprise-solutions 零 import | 原语令牌无法传递到业务层 |
| **蓝图声明 vs 实现断裂** | 蓝图 `ThemeCapability.getDesignTokens(): DesignTokens` 未实现 | runtime-sdk-api-web 无 DesignTokens 类型 | 架构书面约定未落地 |

### 1.2 影响范围扫描

```
违规模式: 插件内部定义 xxxThemeTokens 对象（MUI palette/shape/typography 结构）
─────────────────────────────────────────────────────────────────────────────
app-partners/partners-ui-web/src/theme/partnerTheme.ts
  └── partnerThemeTokens（palette + typography + shape + components）
  └── 消费文件: PartnerCard.tsx, PartnerListPageV2.tsx

app-case/case-ui-web/src/theme/caseTheme.ts
  └── caseThemeTokens（palette + typography + shape + components）
  └── 消费文件: (待统计)

潜在风险: 新插件会复制此模式继续扩散
```

### 1.3 改造目标

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UI 设计令牌改造目标                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 定义 Brix 语义令牌合约 — DesignTokens 使用平台自有词汇                  │
│     • colors: brand / surface / text / border / status / layout 分类       │
│     • typography: displayLarge → bodySmall → label（去 h1/body1 等 MUI 语义）│
│     • space: xs ~ xxl 语义间距 + spacing(factor) 底层引擎                   │
│     • shape: borderRadius 统一为 string 类型（'4px' / '8px' / '12px'）      │
│     • motion: duration + easing（原 transitions 重命名）                     │
│     • shadows / breakpoints / zIndex                                         │
│                                                                              │
│  2. 补齐实现层 — infra-adapter 提供 UI 库 → DesignTokens 映射              │
│     • MuiDesignTokenResolver: MUI Theme → Brix DesignTokens                │
│     • NativeDesignTokenResolver: ThemeTokens → Brix DesignTokens            │
│     • platform-frame-web 通过 DI 注入 resolver，零 UI 库依赖              │
│                                                                              │
│  3. 补齐 Hook 层 — useTheme() 返回 tokens: DesignTokens                     │
│     • 插件通过 useTheme().tokens 获取全部设计令牌                            │
│     • 响应暗色模式切换 & 租户品牌定制                                        │
│                                                                              │
│  4. 插件瘦身 — 删除插件中冗余的平台级令牌                                    │
│     • 仅保留业务语义色（PARTNER_TYPE_COLORS 等）                              │
│     • 平台级样式全部改用 useTheme().tokens                                   │
│                                                                              │
│  5. 治理闭环 — ESLint 规则防止回退                                           │
│     • 禁止插件定义平台级 ThemeTokens 结构                                    │
│     • 禁止插件 import MUI / palette / theme 相关符号                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 架构设计

### 2.1 三层设计令牌体系

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Brix 设计令牌三层体系                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Primitive Tokens（原语令牌）                                       │
│  📦 @brix-sdk/design-tokens（已有，不改动）                                  │
│  ─────────────────────────────────────────────────────────────────────────── │
│  • brandColors / semanticColors / neutralColors                              │
│  • spacing / borderRadius / shadows                                          │
│  • fontFamily / fontSize / fontWeight / lineHeight                           │
│  • breakpoints / breakpointValues                                            │
│  • duration / easing                                                         │
│                                                                              │
│  【消费者】仅限 platform-frame-web、infra-adapter-ui-*                       │
│  【插件禁止直接导入】— 静态值不响应暗色模式/租户品牌                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 2: Semantic Tokens 合约（语义令牌）                                   │
│  📦 runtime-sdk-api-web（已有 ThemeTokens 接口，增强为 DesignTokens）        │
│  ─────────────────────────────────────────────────────────────────────────── │
│  • DesignTokens 接口 ← 聚合 ThemeTokens + Typography + Spacing + Shadows   │
│  • ThemeCapability.getDesignTokens(): DesignTokens                           │
│  • useTheme() hook 扩展返回 tokens: DesignTokens                            │
│                                                                              │
│  【消费者】所有插件通过 useTheme().tokens 获取                               │
│  【运行时响应】暗色/亮色自动切换，租户品牌色自动应用                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 3: Component Tokens（业务语义令牌）                                   │
│  📦 各插件内部 theme/ 目录（瘦身后仅保留业务色）                              │
│  ─────────────────────────────────────────────────────────────────────────── │
│  • PARTNER_TYPE_COLORS — 客户类型语义色（红/蓝/紫/琥珀）                      │
│  • CASE_STATUS_COLORS — 案例状态语义色（草稿灰/进行中蓝/完成绿）             │
│  • 业务特有的 icon 配色、徽章色等                                            │
│                                                                              │
│  【原则】只定义平台不知道的业务领域语义                                      │
│  【引用平台令牌】statusConfig.dot 可引用 tokens.colors.error 等             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```text
@brix-sdk/design-tokens (静态原语)
         │
         ▼
infra-adapter-ui-mui (MUI ThemeProvider + Resolver)
  │
  │ 已有: createMuiTheme(ThemeTokens → MUI Theme)  // 正向：喂给 MUI
  │ 新增: MuiDesignTokenResolver(MUI Theme → DesignTokens)  // 反向：喂给插件
  │
  │ 通过 DesignTokenResolver 接口注入
  ▼
platform-frame-web / ThemeCapabilityImpl
  │
  │ getDesignTokens() ← 委托给注入的 resolver
  ▼
useTheme() hook → { tokens, isDark, toggleMode, ... }
         │
         ▼
Plugin View Layer（Brix 语义令牌，零 MUI 概念）
  ├── tokens.colors.brand.primary        (代替 palette.primary.main)
  ├── tokens.colors.surface.card         (代替 palette.background.paper)
  ├── tokens.colors.text.secondary       (代替 palette.text.secondary)
  ├── tokens.shape.md                    (代替 shape.borderRadius)
  ├── tokens.space.md                    (代替 hardcoded '16px')
  ├── tokens.typography.bodyMedium       (代替 typography.body1)
  └── PARTNER_TYPE_COLORS.HOSPITAL       (业务语义色，保留在插件内)
```

### 2.3 映射器归属决策

> **核心问题**: `mapMuiThemeToDesignTokens()` 应该放在哪里？

| 方案 | 位置 | 优点 | 缺点 |
|------|------|------|------|
| ~~方案 A~~ | ~~platform-frame-web~~ | ~~实现简单~~ | ~~platform 层依赖 MUI 类型，换 UI 库需改 platform~~ |
| **方案 B ✅** | **infra-adapter-ui-mui** | **platform 层零 MUI 依赖，完全对称** | 需要依赖注入接口 |

**选择方案 B 的理由**：

1. **对称性** — `infra-adapter-ui-mui` 已有反向映射 `createMuiTheme(ThemeTokens → MUI Theme)`，  
   正向映射 `mapMuiThemeToDesignTokens(MUI Theme → DesignTokens)` 天然归属同一模块

2. **关注点分离** — `platform-frame-web` 的 `ThemeCapabilityImpl` 管理主题状态（mode/preset/event），  
   不应该知道 MUI Theme 的内部结构（`palette.primary.main`、`shadows[4]` 等）

3. **可替换性** — 换 UI 库时：
   - `infra-adapter-ui-antd` 写自己的 `mapAntThemeToDesignTokens()`
   - `platform-frame-web` 零改动
   - Host 层切换适配器注入即可

4. **与后端对标** — 后端 `infra-adapter-otel` 实现 `ObservabilityCapability`，  
   前端 `infra-adapter-ui-mui` 实现设计令牌解析，架构对称

```text
【依赖关系】

  runtime-sdk-api-web          ← 定义 DesignTokens + DesignTokenResolver 接口
        ▲                ▲
        │                │
  platform-frame-web     infra-adapter-ui-mui
  (ThemeCapabilityImpl)  (MuiDesignTokenResolver)
        │                        │
        │   注入 resolver        │
        ◄────────────────────────┘
```

### 2.4 与大厂对标

| 维度 | Shopify Polaris | Ant Design 5 | MUI | Salesforce Lightning | **Brix（改造后）** |
|------|-----------------|---------------|-----|---------------------|-------------------|
| 原语层 | Polaris Tokens | Seed Tokens | MUI Theme defaults | Design Tokens | `@brix-sdk/design-tokens` |
| 语义层 | CSS Custom Properties | Map Tokens via ConfigProvider | `useTheme()` | Design Tokens → LWC | `ThemeCapability.getDesignTokens()` |
| 消费方式 | `var(--p-color-bg)` | `token.colorPrimary` | `theme.palette.primary.main` | `var(--lwc-colorBrand)` | `tokens.colors.brand.primary` |
| 色彩分类 | bg/text/border/icon | colorBrand/colorText/colorBg | palette.primary/text/background | colorBrand/colorText | **brand/surface/text/border/status** |
| 字体命名 | headingLg/bodySm | — (fontSize scale) | h1~h6 / body1 | heading/body | **displayLarge~labelSmall** |
| 间距模型 | space-1 ~ space-12 | marginXS ~ marginXXL | spacing(factor) | spacingSmall~Large | **space.xs~xxl + spacing()** |
| 圆角类型 | string ('4px') | number (4) | number (4) | string ('0.25rem') | **string ('4px')** |
| UI 库耦合度 | 无（CSS 变量） | 弱（token 对象） | 强（MUI Theme 对象） | 无（CSS 变量） | **无**（Brix 语义合约） |
| 暗色模式 | CSS 变量切换 | ConfigProvider.algorithm | ThemeProvider | CSS 变量切换 | `ThemeCapability` 运行时切换 |
| 令牌可替换 | ✅ | ✅ | ❌ | ✅ | ✅（换 resolver 即可） |

---

## 3. DesignTokens 合约定义

### 3.1 类型定义

```typescript
// runtime-sdk-api-web/src/types/ui/design-tokens.ts

/**
 * Brix Design Tokens — 平台语义设计令牌合约
 *
 * 【架构定位】
 * - 定义在 Layer 2A（能力契约层）
 * - 插件通过 useTheme().tokens 消费
 * - infra-adapter-ui-* 提供 UI 库 → DesignTokens 映射实现
 * - 换 UI 库只需替换 resolver，合约不变
 *
 * 【v2.0 设计原则】
 * - Brix 自有语义词汇（非 MUI / Ant / Tailwind 术语）
 * - 所有值为 resolved 值（已应用 light/dark 模式），非 CSS 变量引用
 * - 严格类型、无任意扩展口（[key: string]: unknown 禁止）
 * - readonly + Object.freeze — shallow freeze 足够（嵌套对象也为 readonly 类型）
 * - 粒度对齐 Figma Design System，设计师与开发者共用一套词汇
 */
export interface DesignTokens {
  // ══════════════════════════════════════════════════════════
  //  COLOR TOKENS — 按用途分类，非 UI 库命名
  // ══════════════════════════════════════════════════════════

  readonly colors: {
    /** 品牌色 — 视觉识别 */
    readonly brand: {
      readonly primary: string;
      readonly primaryLight: string;
      readonly primaryDark: string;
      readonly primaryContrast: string;
      readonly secondary: string;
      readonly secondaryLight: string;
      readonly secondaryDark: string;
      readonly secondaryContrast: string;
    };

    /** 表面色 — 背景层次 */
    readonly surface: {
      /** 页面底色（最底层） */
      readonly page: string;
      /** 卡片/面板表面（第二层） */
      readonly card: string;
      /** 弹层/Popover/Modal（第三层） */
      readonly elevated: string;
      /** 半透明遮罩层 */
      readonly overlay: string;
    };

    /** 文字色 */
    readonly text: {
      readonly primary: string;
      readonly secondary: string;
      readonly disabled: string;
      /** 反色文字（用于深色背景上） */
      readonly inverse: string;
    };

    /** 边框/分隔线色 */
    readonly border: {
      /** 默认边框 */
      readonly default: string;
      /** 弱边框（微妙分隔） */
      readonly subtle: string;
      /** 强边框（强调分隔） */
      readonly strong: string;
    };

    /** 状态语义色 — 功能性色彩 */
    readonly status: {
      readonly success: string;
      readonly warning: string;
      readonly error: string;
      readonly info: string;
    };

    /** 布局色 — Shell 层专用 */
    readonly layout: {
      readonly sidebarBackground: string;
      readonly sidebarText: string;
      readonly sidebarActiveBackground: string;
      readonly sidebarHoverBackground: string;
      readonly headerBackground: string;
      readonly headerText: string;
    };
  };

  // ══════════════════════════════════════════════════════════
  //  TYPOGRAPHY — Brix 语义命名（非 h1~h6 / body1~body2）
  // ══════════════════════════════════════════════════════════

  readonly typography: {
    readonly fontFamily: string;

    /** 展示级 — 大标题、Hero 区域 */
    readonly displayLarge: TypographyVariant;
    readonly displayMedium: TypographyVariant;

    /** 标题级 — 页面标题、卡片标题 */
    readonly titleLarge: TypographyVariant;
    readonly titleMedium: TypographyVariant;
    readonly titleSmall: TypographyVariant;

    /** 正文级 — 段落文本 */
    readonly bodyLarge: TypographyVariant;
    readonly bodyMedium: TypographyVariant;
    readonly bodySmall: TypographyVariant;

    /** 标签级 — 按钮标签、表单标签、辅助说明 */
    readonly label: TypographyVariant;
    readonly labelSmall: TypographyVariant;
  };

  // ══════════════════════════════════════════════════════════
  //  SPACING — 语义间距 + 底层公式引擎
  // ══════════════════════════════════════════════════════════

  /** 语义间距 — 推荐插件使用 */
  readonly space: {
    readonly xs: string;   // 4px   — 紧凑间距（icon 与文字间距）
    readonly sm: string;   // 8px   — 小间距（列表项间距）
    readonly md: string;   // 16px  — 标准间距（卡片内边距）
    readonly lg: string;   // 24px  — 大间距（区块间距）
    readonly xl: string;   // 32px  — 加大间距（页面分区）
    readonly xxl: string;  // 48px  — 最大间距（章节分隔）
  };

  /** 底层间距函数 — spacing(2) → '16px'，作为 space 的 fallback */
  readonly spacing: SpacingFn;

  // ══════════════════════════════════════════════════════════
  //  SHAPE — 边角圆弧（统一 string 类型）
  // ══════════════════════════════════════════════════════════

  readonly shape: {
    /** '0px' — 无圆角 */
    readonly none: string;
    /** '4px' — chips, tags */
    readonly sm: string;
    /** '8px' — buttons, inputs, cards */
    readonly md: string;
    /** '12px' — modals, large cards */
    readonly lg: string;
    /** '9999px' — 全圆/Pill 形 */
    readonly full: string;
  };

  // ══════════════════════════════════════════════════════════
  //  SHADOWS — 高程投影
  // ══════════════════════════════════════════════════════════

  readonly shadows: {
    readonly none: string;
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
    readonly xl: string;
  };

  // ══════════════════════════════════════════════════════════
  //  BREAKPOINTS — 响应式断点
  // ══════════════════════════════════════════════════════════

  readonly breakpoints: {
    readonly xs: number;
    readonly sm: number;
    readonly md: number;
    readonly lg: number;
    readonly xl: number;
  };

  // ══════════════════════════════════════════════════════════
  //  MOTION — 动效令牌（原 transitions，对齐 Material Design 3）
  // ══════════════════════════════════════════════════════════

  readonly motion: {
    /** 短动效 — 150ms（tooltip, ripple） */
    readonly durationShort: string;
    /** 标准动效 — 300ms（展开/折叠） */
    readonly durationStandard: string;
    /** 复杂动效 — 375ms（页面过渡） */
    readonly durationComplex: string;
    /** 缓动函数 — cubic-bezier(0.4, 0, 0.2, 1) */
    readonly easing: string;
  };

  // ══════════════════════════════════════════════════════════
  //  Z-INDEX — 层级令牌（平台保留，插件只读参考）
  // ══════════════════════════════════════════════════════════
  //
  //  ⚠️ 插件不应自行创造 z-index 值。如需弹层，使用 BrixUI 的
  //  Dialog / Popover / Drawer 组件，它们已正确管理层级。
  //  此处值仅供插件在极端场景下参考（如自定义 overlay）。

  readonly zIndex: {
    readonly appBar: number;   // 1100
    readonly drawer: number;   // 1200
    readonly modal: number;    // 1300
    readonly snackbar: number; // 1400
    readonly tooltip: number;  // 1500
  };

  // ══════════════════════════════════════════════════════════
  //  LAYOUT — 布局令牌（P2 阶段增强）
  // ══════════════════════════════════════════════════════════

  readonly layout: {
    /** 内容区最大宽度 — '1200px' */
    readonly containerMaxWidth: string;
    /** 侧边栏宽度 — '240px' */
    readonly sidebarWidth: string;
    /** 侧边栏折叠宽度 — '64px' */
    readonly sidebarCollapsedWidth: string;
    /** 顶栏高度 — '64px' */
    readonly headerHeight: string;
  };

  // ══════════════════════════════════════════════════════════
  //  DENSITY — 密度令牌（P2 阶段增强，可选）
  // ══════════════════════════════════════════════════════════

  readonly density: {
    /** 当前密度模式 */
    readonly mode: 'compact' | 'comfortable' | 'spacious';
    /** 行高缩放因子 — compact: 0.8, comfortable: 1.0, spacious: 1.2 */
    readonly scale: number;
  };
}

// ── 辅助类型 ─────────────────────────────────────────────────

/**
 * Spacing function — maps numeric factor to pixel string.
 * Base unit: 8px (Material Design grid)
 *
 * @example
 * spacing(1)  → '8px'
 * spacing(2)  → '16px'
 * spacing(0.5) → '4px'
 */
export type SpacingFn = (factor: number) => string;

/**
 * Typography variant definition.
 */
export interface TypographyVariant {
  readonly fontSize: string;
  readonly fontWeight: number;
  readonly lineHeight: number;
  readonly letterSpacing?: string;
}
```

#### 3.1.1 命名对照表（MUI → Brix 语义）

| MUI 旧命名 | Brix 新命名 | 分类 | 说明 |
|-------------|-------------|------|------|
| `primary` | `colors.brand.primary` | brand | 品牌主色 |
| `primaryContrastText` | `colors.brand.primaryContrast` | brand | 品牌主色对比文字 |
| `secondary` | `colors.brand.secondary` | brand | 品牌辅色 |
| `background` | `colors.surface.page` | surface | 页面底色 |
| `paper` | `colors.surface.card` | surface | 卡片表面 |
| — | `colors.surface.elevated` | surface | 弹层表面（新增） |
| — | `colors.surface.overlay` | surface | 遮罩层（新增） |
| `textPrimary` | `colors.text.primary` | text | 主要文字 |
| `textSecondary` | `colors.text.secondary` | text | 次要文字 |
| `textDisabled` | `colors.text.disabled` | text | 禁用文字 |
| `divider` | `colors.border.default` | border | 默认边框 |
| — | `colors.border.subtle` | border | 弱边框（新增） |
| — | `colors.border.strong` | border | 强边框（新增） |
| `error` / `warning` / `info` / `success` | `colors.status.*` | status | 状态语义色 |
| `sidebarBackground` 等 | `colors.layout.*` | layout | 布局色（Shell 层） |
| `h1` | `typography.displayLarge` | typography | 展示大标题 |
| `h2` | `typography.displayMedium` | typography | 展示中标题 |
| `h3` | `typography.titleLarge` | typography | 页面标题 |
| `h4` | `typography.titleMedium` | typography | 卡片标题 |
| `h5` | `typography.titleSmall` | typography | 小标题 |
| `subtitle1` | `typography.bodyLarge` | typography | 大正文 |
| `body1` | `typography.bodyMedium` | typography | 标准正文 |
| `body2` | `typography.bodySmall` | typography | 小正文 |
| `subtitle2` | `typography.label` | typography | 标签 |
| `caption` / `overline` | `typography.labelSmall` | typography | 小标签/辅助说明 |
| `borderRadiusSmall: number` | `shape.sm: string` | shape | '4px'（类型也变了） |
| `borderRadiusMedium: number` | `shape.md: string` | shape | '8px' |
| `borderRadiusLarge: number` | `shape.lg: string` | shape | '12px' |
| — | `shape.none / shape.full` | shape | '0px' / '9999px'（新增） |
| `transitions.*` | `motion.*` | motion | 重命名分组 |

### 3.2 DesignTokenResolver 接口（依赖注入点）

```typescript
// runtime-sdk-api-web/src/types/ui/design-tokens.ts — 在 DesignTokens 接口下方追加

/**
 * Design Token Resolver — 由 infra-adapter 实现的令牌解析接口
 *
 * 【架构定位】
 * - 定义在 Layer 2A（能力契约层），与 DesignTokens 同文件
 * - infra-adapter-ui-mui 提供 MuiDesignTokenResolver
 * - infra-adapter-ui-native 提供 NativeDesignTokenResolver
 * - platform-frame-web 的 ThemeCapabilityImpl 通过构造注入 resolver
 *
 * 【设计模式】
 * Strategy Pattern — ThemeCapabilityImpl 不知道具体 UI 库，
 * 通过 resolver 委托令牌解析给 infra-adapter。
 * 与后端 ObservabilityCapability ← OTelObservabilityCapability 模式对称。
 */
export interface DesignTokenResolver {
  /**
   * 解析当前模式下的完整设计令牌
   *
   * @param mode - 已解析的主题模式（light 或 dark）
   * @returns 冻结的 DesignTokens 对象
   */
  resolve(mode: 'light' | 'dark'): DesignTokens;
}
```

### 3.3 ThemeCapability 合约扩展

```typescript
// runtime-sdk-api-web/src/types/theme.ts — 在现有 ThemeCapability 接口中追加

import type { DesignTokens } from './ui/design-tokens';

export interface ThemeCapability {
  // ...existing methods (getMode, setMode, toggleMode, getConfig, getColor, etc.)...

  /**
   * 获取完整设计令牌（UI 库无关）
   *
   * 返回当前主题模式（light/dark）下的 resolved 令牌值。
   * 主题切换时自动更新。
   *
   * 【实现机制】
   * ThemeCapabilityImpl 委托给注入的 DesignTokenResolver。
   * MUI 适配器注入 MuiDesignTokenResolver，
   * Native 适配器注入 NativeDesignTokenResolver。
   *
   * 【使用场景】
   * - 插件 inline style 需要平台色彩/间距/形状
   * - 业务语义色引用平台令牌（如 statusDot 使用 tokens.colors.error）
   * - 响应式布局使用 tokens.breakpoints
   *
   * @returns 当前主题下的完整设计令牌
   */
  getDesignTokens(): DesignTokens;
}
```

### 3.4 useTheme() Hook 扩展

```typescript
// runtime-sdk-react/src/hooks/useTheme.ts — 扩展返回值

export interface UseThemeResult {
  // ...existing fields (mode, resolvedMode, isDark, config, primaryColor, setMode, toggleMode, getColor)...

  /**
   * 完整设计令牌（Brix 语义）
   *
   * 替代插件内 xxxThemeTokens 的统一出口。
   * 随主题切换自动更新（light ↔ dark）。
   *
   * @example
   * ```tsx
   * const { tokens } = useTheme();
   *
   * <Card style={{
   *   borderRadius: tokens.shape.md,
   *   backgroundColor: tokens.colors.surface.card,
   *   padding: tokens.space.md,
   *   boxShadow: tokens.shadows.sm,
   *   color: tokens.colors.text.primary,
   * }}>
   *   <Typography style={tokens.typography.titleMedium}>
   *     {title}
   *   </Typography>
   *   <Typography style={tokens.typography.bodyMedium}>
   *     {description}
   *   </Typography>
   * </Card>
   * ```
   */
  tokens: DesignTokens;
}
```

---

## 4. 实现层设计

### 4.1 MUI → DesignTokens 映射器（位于 infra-adapter-ui-mui）

```text
位置: infra-adapter-ui-mui/src/theme/MuiDesignTokenResolver.ts
职责: 唯一知道 MUI Theme 内部结构的令牌解析器
对称: 与同模块已有的 createMuiTheme(ThemeTokens → MUI Theme) 形成正反映射对
```

```typescript
// infra-adapter-ui-mui/src/theme/MuiDesignTokenResolver.ts

import type { Theme as MuiTheme } from '@mui/material/styles';
import type {
  DesignTokens,
  DesignTokenResolver,
  TypographyVariant,
  ThemeTokens,
} from '@brix-sdk/runtime-sdk-api-web';
import { MUI_THEME_TOKENS, MUI_DARK_THEME_TOKENS } from '@brix-sdk/runtime-sdk-api-web';
import { createMuiTheme } from './MuiThemeProvider';

/**
 * MUI Design Token Resolver
 *
 * 【架构约束】
 * 这是整个平台中唯一允许读取 MUI Theme 内部结构并映射到 DesignTokens 的文件。
 * 与同模块的 createMuiTheme() 形成对称的正反映射对：
 *   - createMuiTheme: ThemeTokens → MUI Theme（用于 MuiThemeProvider）
 *   - resolve:        MUI Theme → DesignTokens（用于 ThemeCapability）
 *
 * 【映射规则 — MUI 结构 → Brix 语义】
 * palette.primary.main        → colors.brand.primary
 * palette.background.default  → colors.surface.page
 * palette.background.paper    → colors.surface.card
 * palette.text.primary        → colors.text.primary
 * palette.divider             → colors.border.default
 * palette.error.main          → colors.status.error
 * typography.h1               → typography.displayLarge
 * typography.body1            → typography.bodyMedium
 * shape.borderRadius          → shape.md
 * shadows[4]                  → shadows.md
 * transitions.duration        → motion.durationStandard
 */
export class MuiDesignTokenResolver implements DesignTokenResolver {
  /** 缓存：避免同一 mode 下重复映射 */
  private cache = new Map<'light' | 'dark', DesignTokens>();

  resolve(mode: 'light' | 'dark'): DesignTokens {
    const cached = this.cache.get(mode);
    if (cached) return cached;

    const tokens = mode === 'dark' ? MUI_DARK_THEME_TOKENS : MUI_THEME_TOKENS;
    const muiTheme = createMuiTheme(tokens, mode);
    const designTokens = Object.freeze(this.mapMuiTheme(muiTheme, tokens));

    this.cache.set(mode, designTokens);
    return designTokens;
  }

  private mapMuiTheme(muiTheme: MuiTheme, tokens: ThemeTokens): DesignTokens {
    return {
      // ── Colors（Brix 语义分组）──────────────────────────
      colors: {
        brand: {
          primary: muiTheme.palette.primary.main,
          primaryLight: muiTheme.palette.primary.light,
          primaryDark: muiTheme.palette.primary.dark,
          primaryContrast: muiTheme.palette.primary.contrastText,
          secondary: muiTheme.palette.secondary.main,
          secondaryLight: muiTheme.palette.secondary.light,
          secondaryDark: muiTheme.palette.secondary.dark,
          secondaryContrast: muiTheme.palette.secondary.contrastText,
        },
        surface: {
          page: muiTheme.palette.background.default,
          card: muiTheme.palette.background.paper,
          elevated: muiTheme.palette.background.paper, // MUI 无区分，同 paper
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        text: {
          primary: muiTheme.palette.text.primary,
          secondary: muiTheme.palette.text.secondary,
          disabled: muiTheme.palette.text.disabled,
          inverse: muiTheme.palette.primary.contrastText,
        },
        border: {
          default: muiTheme.palette.divider,
          subtle: muiTheme.palette.action?.disabledBackground ?? muiTheme.palette.divider,
          strong: muiTheme.palette.text.secondary,
        },
        status: {
          success: muiTheme.palette.success.main,
          warning: muiTheme.palette.warning.main,
          error: muiTheme.palette.error.main,
          info: muiTheme.palette.info.main,
        },
        layout: {
          sidebarBackground: tokens.sidebarBackground,
          sidebarText: tokens.sidebarText,
          sidebarActiveBackground: tokens.sidebarActiveBackground,
          sidebarHoverBackground: tokens.sidebarHoverBackground,
          headerBackground: tokens.headerBackground,
          headerText: tokens.headerText,
        },
      },

      // ── Typography（Brix 语义命名）──────────────────────
      typography: {
        fontFamily: muiTheme.typography.fontFamily!,
        displayLarge: this.mapVariant(muiTheme.typography.h1),
        displayMedium: this.mapVariant(muiTheme.typography.h2),
        titleLarge: this.mapVariant(muiTheme.typography.h3),
        titleMedium: this.mapVariant(muiTheme.typography.h4),
        titleSmall: this.mapVariant(muiTheme.typography.h5),
        bodyLarge: this.mapVariant(muiTheme.typography.subtitle1),
        bodyMedium: this.mapVariant(muiTheme.typography.body1),
        bodySmall: this.mapVariant(muiTheme.typography.body2),
        label: this.mapVariant(muiTheme.typography.subtitle2),
        labelSmall: this.mapVariant(muiTheme.typography.caption),
      },

      // ── Space（语义间距）──────────────────────────────────
      space: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },

      // ── Spacing 函数（底层引擎 fallback）──────────────────
      spacing: (factor: number) => `${factor * 8}px`,

      // ── Shape（string 类型，含 none / full）────────────────
      shape: {
        none: '0px',
        sm: `${tokens.borderRadiusSmall}px`,
        md: `${tokens.borderRadiusMedium}px`,
        lg: `${tokens.borderRadiusLarge}px`,
        full: '9999px',
      },

      // ── Shadows ────────────────────────────────────────────
      shadows: {
        none: 'none',
        sm: muiTheme.shadows[1],
        md: muiTheme.shadows[4],
        lg: muiTheme.shadows[8],
        xl: muiTheme.shadows[16],
      },

      // ── Breakpoints ────────────────────────────────────────
      breakpoints: muiTheme.breakpoints.values,

      // ── Motion（原 transitions）────────────────────────────
      motion: {
        durationShort: `${muiTheme.transitions.duration.short}ms`,
        durationStandard: `${muiTheme.transitions.duration.standard}ms`,
        durationComplex: `${muiTheme.transitions.duration.complex}ms`,
        easing: muiTheme.transitions.easing.easeInOut,
      },

      // ── Z-Index ────────────────────────────────────────────
      zIndex: {
        appBar: muiTheme.zIndex.appBar,
        drawer: muiTheme.zIndex.drawer,
        modal: muiTheme.zIndex.modal,
        snackbar: muiTheme.zIndex.snackbar,
        tooltip: muiTheme.zIndex.tooltip,
      },

      // ── Layout ─────────────────────────────────────────────
      layout: {
        containerMaxWidth: '1200px',
        sidebarWidth: '240px',
        sidebarCollapsedWidth: '64px',
        headerHeight: '64px',
      },

      // ── Density ────────────────────────────────────────────
      density: {
        mode: 'comfortable',
        scale: 1.0,
      },
    };
  }

  private mapVariant(muiVariant: Record<string, unknown>): TypographyVariant {
    return {
      fontSize: String(muiVariant.fontSize ?? '1rem'),
      fontWeight: Number(muiVariant.fontWeight ?? 400),
      lineHeight: Number(muiVariant.lineHeight ?? 1.5),
      letterSpacing: muiVariant.letterSpacing
        ? String(muiVariant.letterSpacing)
        : undefined,
    };
  }
}
```

### 4.2 Native 适配器的 Resolver（同步补齐）

```typescript
// infra-adapter-ui-native/src/theme/NativeDesignTokenResolver.ts

import type { DesignTokens, DesignTokenResolver } from '@brix-sdk/runtime-sdk-api-web';
import { MUI_THEME_TOKENS, MUI_DARK_THEME_TOKENS } from '@brix-sdk/runtime-sdk-api-web';

/**
 * Native (CSS-in-JS) Design Token Resolver
 *
 * 直接将 ThemeTokens 映射为 DesignTokens，无 MUI Theme 中间层。
 * 用于 Native 适配器场景（无 MUI 依赖的轻量级部署）。
 */
export class NativeDesignTokenResolver implements DesignTokenResolver {
  private cache = new Map<'light' | 'dark', DesignTokens>();

  resolve(mode: 'light' | 'dark'): DesignTokens {
    const cached = this.cache.get(mode);
    if (cached) return cached;

    const tokens = mode === 'dark' ? MUI_DARK_THEME_TOKENS : MUI_THEME_TOKENS;
    const designTokens = Object.freeze({
      colors: tokens,
      spacing: (factor: number) => `${factor * 8}px`,
      shape: {
        borderRadiusSmall: tokens.borderRadiusSmall,
        borderRadiusMedium: tokens.borderRadiusMedium,
        borderRadiusLarge: tokens.borderRadiusLarge,
      },
      // typography, shadows, breakpoints, transitions, zIndex
      // 使用 @brix-sdk/design-tokens 原语值直接填充
      // ...（省略，结构与 MUI Resolver 一致，但不经过 MUI Theme）
    } as DesignTokens);

    this.cache.set(mode, designTokens);
    return designTokens;
  }
}
```

### 4.3 ThemeCapabilityImpl 通过注入获取令牌

```typescript
// platform-frame-web/src/theme/ThemeCapabilityImpl.ts — 改造点

import type { DesignTokens, DesignTokenResolver } from '@brix-sdk/runtime-sdk-api-web';

export interface ThemeCapabilityConfig extends ThemeStoreConfig {
  themeStore?: ThemeStore;
  /**
   * 设计令牌解析器 — 由 infra-adapter 注入
   *
   * 【注入时机】Host 层组装时传入
   * 【MUI】new ThemeCapabilityImpl({ resolver: new MuiDesignTokenResolver() })
   * 【Native】new ThemeCapabilityImpl({ resolver: new NativeDesignTokenResolver() })
   */
  designTokenResolver?: DesignTokenResolver;
}

export class ThemeCapabilityImpl implements ThemeCapability {
  // ...existing fields...
  private designTokenResolver: DesignTokenResolver | null;

  constructor(config: ThemeCapabilityConfig = {}) {
    // ...existing constructor...
    this.designTokenResolver = config.designTokenResolver ?? null;
  }

  getDesignTokens(): DesignTokens {
    if (!this.designTokenResolver) {
      throw new Error(
        '[ThemeCapabilityImpl] DesignTokenResolver is not configured. ' +
        'Ensure Host injects a resolver (e.g., MuiDesignTokenResolver) via config.'
      );
    }
    return this.designTokenResolver.resolve(this.getResolvedMode());
  }
}
```

### 4.4 Host 层组装示例

```typescript
// host-shell-standalone-web/src/bootstrap.ts（伪代码）

import { ThemeCapabilityImpl } from '@brix-sdk/platform-frame-web';
import { MuiDesignTokenResolver } from '@brix-sdk/infra-adapter-ui-mui';

const themeCapability = new ThemeCapabilityImpl({
  defaultMode: 'system',
  presets: [defaultPreset],
  // 注入 MUI 设计令牌解析器
  designTokenResolver: new MuiDesignTokenResolver(),
});

runtime.registerCapability(ThemeCapabilityType, themeCapability);
```

---

## 5. 分阶段执行计划

> **执行顺序**: P0（结构重构）→ P1（稳定性）→ P2（增强）→ 插件迁移 + ESLint 治理

### Phase 1: P0 — 合约层 Brix 语义结构定义（无破坏性变更）

| 序号 | 任务 | 涉及文件 | 验证标准 |
|:----:|------|---------|---------|
| 1.1 | 新建 `DesignTokens` 接口（Brix 语义：colors.brand/surface/text/border/status/layout + typography.display/title/body/label + space + shape + motion） | `runtime-sdk-api-web/src/types/ui/design-tokens.ts` | 类型编译通过，无 MUI 术语（无 h1/body1/paper/divider/transitions） |
| 1.2 | 新建 `DesignTokenResolver` 接口 | `runtime-sdk-api-web/src/types/ui/design-token-resolver.ts` | Strategy Pattern DI 点 |
| 1.3 | `ThemeCapability` 接口追加 `getDesignTokens()` | `runtime-sdk-api-web/src/types/theme.ts` | 合约接口新增方法 |
| 1.4 | index.ts 导出新类型 | `runtime-sdk-api-web/src/index.ts` | `import { DesignTokens, DesignTokenResolver } from '@brix-sdk/runtime-sdk-api-web'` 可用 |
| 1.5 | 单元测试 — 类型结构验证 | `runtime-sdk-api-web/src/__tests__/design-tokens.test.ts` | 验证 colors.brand/surface/text 结构完整性 |

**改动量**: ~3 个新文件 + 2 个文件追加 export  
**风险**: 零 — 纯新增接口，不影响现有代码  
**验收**: `pnpm build` 通过

---

### Phase 2: P0 — 实现层 Brix 语义映射（无破坏性变更）

| 序号 | 任务 | 涉及文件 | 验证标准 |
|:----:|------|---------|---------|
| 2.1 | MUI Resolver — 新建 `MuiDesignTokenResolver` | `infra-adapter-ui-mui/src/theme/MuiDesignTokenResolver.ts` | MUI palette → colors.brand/surface/text/border/status；typography.h1 → displayLarge 等 |
| 2.2 | Native Resolver — 新建 `NativeDesignTokenResolver` | `infra-adapter-ui-native/src/theme/NativeDesignTokenResolver.ts` | ThemeTokens → Brix DesignTokens（无 MUI 中间层） |
| 2.3 | ThemeCapabilityImpl — 注入 resolver + 实现 `getDesignTokens()` | `platform-frame-web/src/theme/ThemeCapabilityImpl.ts` | 构造函数接受 `DesignTokenResolver`，委托调用 |
| 2.4 | Host 层组装 — 注入 `MuiDesignTokenResolver` | `host-shell-standalone-web/src/bootstrap.ts` | `new ThemeCapabilityImpl({ designTokenResolver: new MuiDesignTokenResolver() })` |
| 2.5 | 单元测试 — MUI 语义映射 | `infra-adapter-ui-mui/src/__tests__/MuiDesignTokenResolver.test.ts` | 断言: `tokens.colors.surface.card === muiTheme.palette.background.paper` 等 |
| 2.6 | 单元测试 — ThemeCapabilityImpl 委托 | `platform-frame-web/src/__tests__/ThemeCapabilityImpl.test.ts` | resolver 注入 → getDesignTokens 委托正确 |

**改动量**: ~3 个新文件 + 2 个文件修改（ThemeCapabilityImpl + Host bootstrap）  
**风险**: 低 — 新增实现 + DI 注入，现有调用路径不受影响  
**验收**: `pnpm test` 通过，手动验证 `getDesignTokens()` 返回完整 Brix 语义结构

---

### Phase 3: P0 — Hook 层透出（向后兼容）

| 序号 | 任务 | 涉及文件 | 验证标准 |
|:----:|------|---------|---------|
| 3.1 | `UseThemeResult` 接口追加 `tokens` 字段 | `runtime-sdk-react/src/hooks/useTheme.ts` | 类型扩展，向后兼容 |
| 3.2 | `useTheme()` 实现中调用 `getDesignTokens()` | 同上 | useMemo 缓存，随主题切换更新 |
| 3.3 | 单元测试 | `runtime-sdk-react/src/__tests__/useTheme.test.ts` | 验证 `tokens.colors.brand.primary` 存在且随 mode 变化 |

**改动量**: ~1 个文件修改  
**风险**: 极低 — 新增返回字段，现有解构 `const { isDark } = useTheme()` 不受影响  
**验收**: 现有 useTheme 测试全部通过 + 新增测试通过

---

### Phase 4: P1 — 稳定性加固

| 序号 | 任务 | 涉及文件 | 验证标准 |
|:----:|------|---------|---------|
| 4.1 | shape 值确认为 string 类型 | `design-tokens.ts` | `shape.md` 类型为 `string`，值为 `'8px'` |
| 4.2 | 移除 DesignTokens 任意扩展口 | `design-tokens.ts` | 无 `[key: string]: unknown`，严格类型守护 |
| 4.3 | 明确 freeze 策略：shallow freeze | `MuiDesignTokenResolver.ts` / FAQ 文档 | `Object.freeze()` 浅冻结 + TypeScript readonly 静态保护 |
| 4.4 | zIndex 使用约束文档化 | `design-tokens.ts` JSDoc | 注释明确：插件不应自创层级，使用 BrixUI 组件管理 |

**改动量**: ~2 个文件微调  
**风险**: 零 — 文档化 + 类型收紧  
**验收**: TypeScript 严格模式编译通过

---

### Phase 5: P2 — 增强令牌（可选，按需启用）

| 序号 | 任务 | 涉及文件 | 验证标准 |
|:----:|------|---------|---------|
| 5.1 | 增加 layout 令牌 | `design-tokens.ts` + `MuiDesignTokenResolver.ts` | `tokens.layout.containerMaxWidth` / `sidebarWidth` 等 |
| 5.2 | 增加 density 令牌 | `design-tokens.ts` + `MuiDesignTokenResolver.ts` | `tokens.density.mode` = 'compact' / 'comfortable' / 'spacious' |
| 5.3 | motion 确认（已在 P0 完成，原 transitions 重命名） | — | `tokens.motion.durationStandard` 已存在 |

**改动量**: ~2 个文件追加字段  
**风险**: 极低 — 纯新增可选字段  
**验收**: 类型编译通过

---

### Phase 6: 插件瘦身（逐插件迁移）

> **原则**: 逐插件迁移，每个插件一个 PR，可并行进行。

#### 6.1 app-partners 迁移

| 序号 | 任务 | 涉及文件 | 改动说明 |
|:----:|------|---------|---------|
| 6.1.1 | PartnerCard.tsx — 替换 partnerThemeTokens | `components/PartnerCard.tsx` | `const { tokens } = useTheme()` 替代顶层解构 |
| 6.1.2 | PartnerListPageV2.tsx — 替换 partnerThemeTokens | `pages/PartnerListPageV2.tsx` | 同上 |
| 6.1.3 | partnerTheme.ts — 删除 partnerThemeTokens | `theme/partnerTheme.ts` | 仅保留 PARTNER_TYPE_COLORS / PARTNER_STATUS_COLORS / helper 函数 |
| 6.1.4 | theme/index.ts — 调整导出 | `theme/index.ts` | 移除 partnerThemeTokens 导出 |

**Before → After 示例**:

```typescript
// ❌ Before (PartnerCard.tsx) — MUI 语义耦合
import { partnerThemeTokens } from '../theme';
const { palette, shape } = partnerThemeTokens;
// ...
backgroundColor: palette.background.paper,
borderRadius: shape.borderRadius,
color: palette.text.secondary,
padding: '16px',
fontSize: '0.875rem',

// ✅ After (PartnerCard.tsx) — Brix 语义令牌
import { useTheme } from '@brix-sdk/runtime-sdk-react';
import { getPartnerTypeConfig, getPartnerStatusConfig } from '../theme';
// ...（在组件函数体内）
const { tokens } = useTheme();
// ...
backgroundColor: tokens.colors.surface.card,
borderRadius: tokens.shape.md,
color: tokens.colors.text.secondary,
padding: tokens.space.md,
fontSize: tokens.typography.bodySmall.fontSize,
```

#### 6.2 app-case 迁移

| 序号 | 任务 | 涉及文件 | 改动说明 |
|:----:|------|---------|---------|
| 6.2.1 | 消费文件 — 替换 caseThemeTokens | 所有引用 caseThemeTokens 的文件 | `const { tokens } = useTheme()` |
| 6.2.2 | caseTheme.ts — 删除 caseThemeTokens | `theme/caseTheme.ts` | 仅保留 CASE_STATUS_COLORS / NODE_STATUS_COLORS / TEMPLATE_TYPE_COLORS |

#### 6.3 其他插件扫描

| 序号 | 任务 |
|:----:|------|
| 6.3.1 | `grep -r "ThemeTokens\|themeTokens\|palette\.\w\+\.main\|MUI\|@mui" enterprise-solutions/` 扫描其他插件 |
| 6.3.2 | 逐一迁移发现的违规文件 |

**验收标准（每个插件 PR）**:  
- [ ] `pnpm build` 通过  
- [ ] `pnpm test` 通过  
- [ ] 视觉走查 — 页面样式无变化  
- [ ] 插件代码中无 `palette` / `theme.` / `@mui` / `h1` ~ `h6` / `body1` / `paper` 等 MUI 术语
- [ ] 插件 `theme/` 目录中不再包含 palette/typography/shape/components 定义  

---

### Phase 7: ESLint 治理规则

| 序号 | 任务 | 涉及文件 | 说明 |
|:----:|------|---------|------|
| 7.1 | 新增规则 `no-plugin-theme-tokens` | `eslint-config-architecture/rules/` | 禁止插件内定义 palette/typography/shape 结构的 ThemeTokens 对象 |
| 7.2 | 新增规则 `no-direct-design-tokens-import` | 同上 | 禁止 enterprise-solutions 直接 import `@brix-sdk/design-tokens` |
| 7.3 | 新增规则 `no-mui-in-plugins` | 同上 | 禁止 enterprise-solutions import `@mui/*`、`palette`、`theme.` 等 MUI 术语 |
| 7.4 | CI 卡点 | `.github/workflows/` | ESLint 违规阻塞 PR 合入 |

**规则逻辑**:

```javascript
// no-plugin-theme-tokens
// 检测模式: 在 enterprise-solutions 目录下，禁止 export 包含
// palette.primary / palette.background / shape.borderRadius / typography.fontFamily 结构的对象
{
  patterns: [
    /export const \w+[Tt]heme[Tt]okens\s*=/,      // 命名匹配
    /palette:\s*\{[\s\S]*primary:\s*\{/,            // 结构匹配
    /typography:\s*\{[\s\S]*fontFamily:/,            // 结构匹配
  ],
  message: 'Plugin must use useTheme().tokens instead of defining local theme tokens. See: UI设计令牌改造方案-v2.0.md'
}

// no-mui-in-plugins
// 检测模式: 在 enterprise-solutions 目录下，禁止 MUI 相关导入和术语
{
  patterns: [
    /import .* from ['"]@mui\//,                    // 直接导入 MUI
    /palette\.\w+\.main/,                            // MUI palette 访问
    /theme\.palette/,                                // MUI theme 引用
    /muiTheme|MuiTheme/,                             // MUI 变量名
  ],
  message: 'Plugin must not reference MUI directly. Use useTheme().tokens (Brix semantic tokens).'
}
```

---

## 6. 关键设计决策 FAQ

### Q1: 为何不让插件直接 `import from '@brix-sdk/design-tokens'`？

`@brix-sdk/design-tokens` 是**静态原语值**，存在三个问题：
1. 不响应 dark mode 切换（`brandColors.primary` 始终是 `#1976d2`）
2. 不响应租户品牌定制（SaaS 场景每个租户可能有自己的品牌色）
3. 违反蓝图约束 — 插件应通过能力契约获取运行时状态

### Q2: 为何 DesignTokens 不复用 MUI 的 Theme 类型？

蓝图约束 9 明确要求 UI 库可替换：
- `DesignTokens` 是 UI 无关合约，使用 Brix 自有语义词汇
- MUI Theme → DesignTokens 映射封装在 `infra-adapter-ui-mui`
- 若换 Ant Design，只需在 `infra-adapter-ui-antd` 实现 `AntDesignTokenResolver`

### Q3: 业务语义色为何保留在插件内？

`PARTNER_TYPE_COLORS`（医院红、翻译蓝、酒店紫）是**业务领域知识**：
- 平台无法预知每个业务插件的语义色需求
- 蓝图 BrixUI 分层中 Layer 3（业务组件）明确由各插件自行封装
- 但业务色中的通用部分（如 statusDot）应引用 `tokens.colors.status.error`

### Q4: Object.freeze — shallow 还是 deep？

采用 **shallow freeze** + TypeScript `readonly` 双重保护：
- `Object.freeze()` 冻结顶层属性，运行时防御
- TypeScript `readonly` 递归标记，编译时防御
- Deep freeze 的性能开销（递归遍历所有嵌套对象）不值得 — 嵌套对象已是 readonly 类型
- 如果插件绕过 TypeScript 强行修改嵌套属性，shallow freeze 不拦截，但这属于恶意行为而非误操作

### Q5: 缓存策略考量？

DesignTokenResolver 按 `mode` 缓存 DesignTokens：
- 同一 mode 下多次调用返回同一冻结对象（O(1)）
- mode 切换时重新映射（仅 light → dark 或 dark → light 时触发）
- `useTheme()` 中使用 `useMemo` 进一步避免 React 重渲染

### Q6: 为何 colors 不直接用 `ThemeTokens`（flat 结构），而要分组？

v1.0 的 `colors: ThemeTokens` 是**扁平的 28 字段结构**，存在三个问题：
1. **MUI 语义残留** — `paper` / `divider` / `textPrimary` 是 MUI 特有术语，换 Ant Design 时语义不对
2. **无分类** — 28 个字段全部扁平排列，插件开发者需要记忆全部字段名
3. **无法表达层级** — `background` 和 `paper` 的层级关系不直观

分组后 `brand/surface/text/border/status/layout`：
- 每组 2~8 个字段，符合认知负荷（Miller's Law 7±2）
- 命名自解释：`surface.card` 不需要注释，`paper` 需要
- 与 Polaris / Lightning / Material Design 3 的分类方式对齐

### Q7: 为何 typography 不用 h1~h6？

`h1` ~ `h6` 是 **HTML 标签名称**，不是设计语义：
- HTML `<h1>` 表示文档结构层级，不表示视觉样式
- 同一个 `<h3>` 在 Hero 区可能是 40px，在卡片内可能是 18px
- Material Design 3 已将 `headline` 改为 `display/title/body/label` 四档
- Brix 采用相同分类，但保留 Large/Medium/Small 粒度

映射关系：
```
MUI h1         → displayLarge   （展示大标题：Hero、Landing）
MUI h2         → displayMedium  （展示中标题：Section Header）
MUI h3         → titleLarge     （页面标题）
MUI h4         → titleMedium    （卡片标题）
MUI h5         → titleSmall     （小标题、Sidebar Section）
MUI subtitle1  → bodyLarge      （大正文、Lead Paragraph）
MUI body1      → bodyMedium     （标准正文）
MUI body2      → bodySmall      （小正文、辅助文字）
MUI subtitle2  → label          （按钮标签、表单标签）
MUI caption    → labelSmall     （小标签、辅助说明、Overline）
```

### Q8: 为何 borderRadius 从 number 改为 string？

| 类型 | 优点 | 缺点 |
|------|------|------|
| `number` (4) | 可做算术运算 `radius * 2` | 赋值 style 时需要 `${n}px` 拼接 |
| `string` ('4px') | **直接赋值** `borderRadius: tokens.shape.md` | 不可算术运算 |

选择 string 的理由：
1. **插件消费场景 99% 是直接赋值**，不需要算术运算
2. **减少 bug** — `borderRadius: 8`（number）在 CSS-in-JS 中部分引擎不自动加 `px`
3. **与 Polaris / Lightning 对齐** — 都使用 string 类型
4. **Pill 形状** — `'9999px'` 无法用 number 合理表达

### Q9: 为何保留 spacing(factor) 且新增 space 对象？

两层并存，各有定位：

| 层级 | API | 用途 | 示例 |
|------|-----|------|------|
| 语义层 | `tokens.space.md` | 90% 场景快捷使用 | `padding: tokens.space.md` |
| 公式层 | `tokens.spacing(1.5)` | 非标间距 fallback | `gap: tokens.spacing(1.5)` → '12px' |

ESLint 规则推荐优先使用 `space.*`，`spacing()` 仅在语义间距无法覆盖时使用。

---

## 7. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|---------|
| Phase 6 视觉回退 | 中 | 低 | 每个插件 PR 附 screenshot diff |
| 语义命名不够直觉 | 低 | 低 | 3.1.1 命名对照表 + IDE 自动补全 + JSDoc 注释 |
| 性能影响 | 极低 | 低 | Object.freeze + useMemo 缓存，无运行时开销 |
| 与 BrixUI 治理计划冲突 | 低 | 低 | 本方案与 BrixUI 治理互补（BrixUI 管组件，本方案管令牌） |
| colors 分组后路径变长 | 低 | 低 | `tokens.colors.surface.card` vs 旧 `tokens.colors.paper` — 多一级但更清晰 |

---

## 8. 验收标准

### 8.1 全局验收

- [ ] `runtime-sdk-api-web` 导出 `DesignTokens` 类型（Brix 语义，无 MUI 术语）
- [ ] `ThemeCapability.getDesignTokens()` 接口存在且有实现
- [ ] `useTheme().tokens` 返回完整 DesignTokens 对象
- [ ] enterprise-solutions 中无 `xxxThemeTokens` 对象（仅保留业务语义色）
- [ ] enterprise-solutions 中无 `@mui` import、`palette`、`theme.palette` 引用
- [ ] DesignTokens 接口无 `[key: string]: unknown`（严格类型）
- [ ] ESLint 规则激活（含 `no-mui-in-plugins`），违规代码无法通过 CI
- [ ] 所有现有页面视觉走查无回退

### 8.2 Brix 语义验收

- [ ] `tokens.colors` 使用 `brand/surface/text/border/status/layout` 分组，无 `paper/divider/textPrimary` 等 MUI 术语
- [ ] `tokens.typography` 使用 `displayLarge~labelSmall`，无 `h1~h6/body1/subtitle1` 等 HTML/MUI 术语
- [ ] `tokens.shape` 值为 string 类型（`'4px'` / `'8px'`），非 number
- [ ] `tokens.space` 提供 `xs~xxl` 语义间距
- [ ] `tokens.motion` 替代旧 `transitions`

### 8.3 架构守护

- [ ] 评审报告新增此条违规记录（LL 层次不符 / Medium）
- [ ] 架构评审可执行清单新增检查项：
  - `LL-New: 插件是否通过 useTheme().tokens 获取设计令牌（禁止自建平台级 ThemeTokens）`
  - `LL-New: 插件是否使用 Brix 语义令牌（禁止 MUI 术语：palette/paper/divider/h1~h6/body1）`

---

## 9. 附录

### 9.1 涉及模块清单

| 仓库 | 包 | Phase | 改动类型 |
|------|-----|:-----:|---------|
| brix | `@brix/runtime-sdk-api-web` | 1 (P0) | 新增 DesignTokens（Brix 语义）+ DesignTokenResolver 接口 |
| brix | `@brix/infra-adapter-ui-mui` | 2 (P0) | 新增 MuiDesignTokenResolver（MUI → Brix 映射） |
| brix | `@brix/infra-adapter-ui-native` | 2 (P0) | 新增 NativeDesignTokenResolver |
| brix | `@brix/platform-frame-web` | 2 (P0) | ThemeCapabilityImpl 注入 resolver |
| brix | `@brix/host-shell-standalone-web` | 2 (P0) | Host 组装注入 |
| brix | `@brix/runtime-sdk-react` | 3 (P0) | useTheme() Hook 扩展 |
| brix | `@brix/runtime-sdk-api-web` | 4 (P1) | 类型收紧（shape: string, 移除扩展口） |
| brix | `@brix/runtime-sdk-api-web` | 5 (P2) | layout / density 令牌 |
| brix | `@brix/eslint-config-architecture` | 7 | 新增 3 条规则 |
| brix-enterprise | `app-partners/partners-ui-web` | 6 | 瘦身 |
| brix-enterprise | `app-case/case-ui-web` | 6 | 瘦身 |
| brix-enterprise | 其他插件 (视扫描结果) | 6 | 瘦身 |

### 9.2 映射参照表（MUI → Brix 语义令牌）

| 插件中原用法（MUI 耦合） | 改造后用法（Brix 语义） | 类别 |
|--------------------------|------------------------|------|
| `palette.primary.main` | `tokens.colors.brand.primary` | brand |
| `palette.primary.light` | `tokens.colors.brand.primaryLight` | brand |
| `palette.primary.contrastText` | `tokens.colors.brand.primaryContrast` | brand |
| `palette.secondary.main` | `tokens.colors.brand.secondary` | brand |
| `palette.background.default` | `tokens.colors.surface.page` | surface |
| `palette.background.paper` | `tokens.colors.surface.card` | surface |
| `palette.text.primary` | `tokens.colors.text.primary` | text |
| `palette.text.secondary` | `tokens.colors.text.secondary` | text |
| `palette.text.disabled` | `tokens.colors.text.disabled` | text |
| `palette.divider` | `tokens.colors.border.default` | border |
| `palette.error.main` | `tokens.colors.status.error` | status |
| `palette.warning.main` | `tokens.colors.status.warning` | status |
| `palette.info.main` | `tokens.colors.status.info` | status |
| `palette.success.main` | `tokens.colors.status.success` | status |
| `shape.borderRadius` (number) | `tokens.shape.md` (string `'8px'`) | shape |
| `shape.borderRadius * 0.5` | `tokens.shape.sm` (`'4px'`) | shape |
| `'16px'` (hardcoded padding) | `tokens.space.md` | space |
| `'24px'` (hardcoded margin) | `tokens.space.lg` | space |
| `spacing(2)` (MUI spacing) | `tokens.space.md` 或 `tokens.spacing(2)` | space |
| `typography.fontFamily` | `tokens.typography.fontFamily` | typography |
| `typography.h1` | `tokens.typography.displayLarge` | typography |
| `typography.h3` | `tokens.typography.titleLarge` | typography |
| `typography.h4` | `tokens.typography.titleMedium` | typography |
| `typography.body1` | `tokens.typography.bodyMedium` | typography |
| `typography.body2` | `tokens.typography.bodySmall` | typography |
| `typography.caption` | `tokens.typography.labelSmall` | typography |
| `'0.875rem'` (hardcoded fontSize) | `tokens.typography.bodySmall.fontSize` | typography |
| `'0 1px 3px rgba(0,0,0,0.06)'` | `tokens.shadows.sm` | shadows |
| `transitions.duration.standard` | `tokens.motion.durationStandard` | motion |
| `transitions.easing.easeInOut` | `tokens.motion.easing` | motion |
