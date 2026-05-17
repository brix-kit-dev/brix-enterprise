# BrixUI 组件扩展与治理改造计划

> **版本**: 1.0  
> **日期**: 2026-03-18  
> **状态**: 草案  
> **依据**: v3.0.8 运行壳架构设计蓝图 - 约束9

---

## 1. 背景与目标

### 1.1 当前问题

| 问题 | 现状 | 影响 |
|------|------|------|
| **UI 组件散落** | enterprise-solutions 插件直接 import MUI 组件 | 无法整体替换 UI 库 |
| **违规引用量** | 105+ 处直接 import `@mui/material` | 架构红线失效 |
| **涉及插件** | 7 个插件（booking, case, carousel, partners, identity, messenger, products） | 全部核心业务插件 |
| **与后端不对齐** | 后端插件只依赖能力契约，前端插件直接依赖 MUI | 前后端架构不对称 |

### 1.2 改造目标

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BrixUI 改造目标                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 扩展 UIAdapter 组件集                                                    │
│     • 从当前 13 个原子组件 → 扩展至 35+ 个组件                               │
│     • 覆盖 enterprise-solutions 实际使用的全部 MUI 组件                      │
│                                                                              │
│  2. 消除插件违规引用                                                         │
│     • 7 个插件全部改为使用 useUI() 获取组件                                  │
│     • 插件 package.json 移除 @mui/material 依赖                              │
│                                                                              │
│  3. 建立治理机制                                                             │
│     • ESLint 规则防止回退                                                    │
│     • CI 卡点阻止违规代码合入                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 违规现状分析

### 2.1 涉及插件清单

| 插件 | 违规文件数 | 主要使用组件 |
|------|-----------|-------------|
| **app-case** | 5 | Table, Tabs, Chip, Alert, Accordion, CircularProgress |
| **app-partners** | 7 | Box, Typography, TextField, Dialog, Chip, Avatar |
| **app-products** | 9 | Table, Card, TextField, Dialog, Chip, Select |
| **app-booking** | 7 | Box, Paper, Chip, Stack, Typography |
| **app-carousel** | 3 | Paper, Typography, TextField, Switch, Dialog |
| **app-identity** | 6 | Table, TextField, Dialog, Chip, Avatar |
| **app-messenger** | 3 | Box, Paper, Typography, TextField, Chip |

### 2.2 需扩展的 MUI 组件

根据扫描结果，需要纳入 UIAdapter 的组件：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  需扩展组件（按类别）                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  【布局组件】                                                                │
│  ├── Box          — 通用容器（对应 div + sx）                               │
│  ├── Stack        — Flex 布局容器                                           │
│  ├── Paper        — 卡片底板                                                │
│  ├── Container    — 响应式容器                                              │
│  ├── Grid         — 栅格布局                                                │
│  └── Divider      — 分割线                                                  │
│                                                                              │
│  【排版组件】                                                                │
│  └── Typography   — 文本排版（h1-h6, body, caption 等）                     │
│                                                                              │
│  【数据展示组件】                                                            │
│  ├── Table        — 表格（含 TableHead, TableBody, TableRow, TableCell）    │
│  ├── Tag/Chip     — 标签                                                    │
│  ├── List         — 列表（含 ListItem, ListItemText）                       │
│  ├── Timeline     — 时间线                                                  │
│  ├── Empty        — 空状态                                                  │
│  └── Pagination   — 分页                                                    │
│                                                                              │
│  【表单组件】                                                                │
│  ├── TextField    — 输入框（带标签、验证状态）→ 可扩展 Input                 │
│  ├── Checkbox     — 复选框                                                  │
│  ├── Switch       — 开关                                                    │
│  ├── Radio        — 单选框                                                  │
│  ├── Form         — 表单容器                                                │
│  ├── FormItem     — 表单项（标签 + 控件 + 错误提示）                         │
│  ├── DatePicker   — 日期选择器                                              │
│  └── TimePicker   — 时间选择器                                              │
│                                                                              │
│  【反馈组件】                                                                │
│  ├── Alert        — 警告提示                                                │
│  ├── Spin/Loading — 加载中                                                  │
│  ├── Progress     — 进度条                                                  │
│  ├── Skeleton     — 骨架屏                                                  │
│  └── Result       — 结果页                                                  │
│                                                                              │
│  【导航组件】                                                                │
│  ├── Tabs         — 标签页（含 TabPane）                                    │
│  ├── Breadcrumb   — 面包屑                                                  │
│  ├── Steps        — 步骤条                                                  │
│  └── Dropdown     — 下拉菜单                                                │
│                                                                              │
│  【容器组件】                                                                │
│  ├── Drawer       — 抽屉                                                    │
│  ├── Collapse     — 折叠面板 / Accordion                                    │
│  └── Popover      — 气泡卡片                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1：扩展 UIAdapter 契约定义

### 3.1 目录结构扩展

```
runtime-sdk-api-web/src/types/ui/
├── index.ts              # Barrel export（更新）
├── adapter.ts            # UIAdapter 接口（扩展）
├── common.ts             # 公共类型
│
├── # === 现有组件（13 个）===
├── button.ts
├── input.ts
├── select.ts
├── card.ts
├── avatar.ts
├── badge.ts
├── tooltip.ts
├── menu.ts
├── modal.ts
├── message.ts
├── icon.ts
├── theme-tokens.ts
│
├── # === 新增组件定义（22 个）===
├── box.ts                # 【新增】Box 布局容器
├── stack.ts              # 【新增】Stack Flex 布局
├── paper.ts              # 【新增】Paper 卡片底板
├── divider.ts            # 【新增】Divider 分割线
├── typography.ts         # 【新增】Typography 排版
├── table.ts              # 【新增】Table 表格
├── tag.ts                # 【新增】Tag/Chip 标签
├── list.ts               # 【新增】List 列表
├── empty.ts              # 【新增】Empty 空状态
├── pagination.ts         # 【新增】Pagination 分页
├── checkbox.ts           # 【新增】Checkbox 复选框
├── switch.ts             # 【新增】Switch 开关
├── radio.ts              # 【新增】Radio 单选
├── form.ts               # 【新增】Form + FormItem
├── alert.ts              # 【新增】Alert 警告
├── spin.ts               # 【新增】Spin 加载
├── progress.ts           # 【新增】Progress 进度
├── tabs.ts               # 【新增】Tabs 标签页
├── breadcrumb.ts         # 【新增】Breadcrumb 面包屑
├── drawer.ts             # 【新增】Drawer 抽屉
├── collapse.ts           # 【新增】Collapse 折叠
└── popover.ts            # 【新增】Popover 气泡
```

### 3.2 UIAdapter 接口扩展

```typescript
// adapter.ts 扩展
export interface UIAdapter {
  // ========================================
  // 现有组件（保持不变）
  // ========================================
  Button: FC<ButtonProps>;
  Input: FC<InputProps>;
  Select: FC<SelectProps>;
  Card: FC<CardProps>;
  Avatar: FC<AvatarProps>;
  Badge: FC<BadgeProps>;
  Tooltip: FC<TooltipProps>;
  Menu: FC<MenuProps>;
  MenuItem: FC<MenuItemProps>;
  Modal: FC<ModalProps>;
  message: MessageAPI;
  ThemeProvider: FC<ThemeProviderProps>;
  getThemeTokens: () => ThemeTokens;
  Icon: FC<IconProps>;

  // ========================================
  // 新增：布局组件
  // ========================================
  Box: FC<BoxProps>;
  Stack: FC<StackProps>;
  Paper: FC<PaperProps>;
  Divider: FC<DividerProps>;

  // ========================================
  // 新增：排版组件
  // ========================================
  Typography: FC<TypographyProps>;

  // ========================================
  // 新增：数据展示组件
  // ========================================
  Table: FC<TableProps>;
  Tag: FC<TagProps>;
  List: FC<ListProps>;
  ListItem: FC<ListItemProps>;
  Empty: FC<EmptyProps>;
  Pagination: FC<PaginationProps>;

  // ========================================
  // 新增：表单组件
  // ========================================
  Checkbox: FC<CheckboxProps>;
  Switch: FC<SwitchProps>;
  Radio: FC<RadioProps>;
  RadioGroup: FC<RadioGroupProps>;
  Form: FC<FormProps>;
  FormItem: FC<FormItemProps>;

  // ========================================
  // 新增：反馈组件
  // ========================================
  Alert: FC<AlertProps>;
  Spin: FC<SpinProps>;
  Progress: FC<ProgressProps>;

  // ========================================
  // 新增：导航组件
  // ========================================
  Tabs: FC<TabsProps>;
  TabPane: FC<TabPaneProps>;
  Breadcrumb: FC<BreadcrumbProps>;

  // ========================================
  // 新增：容器组件
  // ========================================
  Drawer: FC<DrawerProps>;
  Collapse: FC<CollapseProps>;
  CollapsePanel: FC<CollapsePanelProps>;
  Popover: FC<PopoverProps>;
}
```

### 3.3 组件 Props 设计原则

| 原则 | 说明 |
|------|------|
| **最小公共集** | Props 只包含 MUI + Ant Design + Element Plus 都支持的属性 |
| **语义化命名** | 使用 `variant="primary"` 而非 `variant="contained"` |
| **扩展友好** | 预留 `className`, `style`, `data-*` 属性 |
| **受控优先** | 表单组件提供 `value` + `onChange` 受控模式 |

---

## 4. Phase 2：MUI Adapter 实现

### 4.1 实现清单（infra-adapter-ui-mui）

```
infra-adapter-ui-mui/src/
├── adapter.ts              # 更新：导出完整 muiUIAdapter
├── index.ts                # 更新：re-export
│
├── components/
│   ├── # 现有组件
│   ├── MuiButton.tsx
│   ├── MuiInput.tsx
│   ├── MuiSelect.tsx
│   ├── MuiCard.tsx
│   ├── MuiAvatar.tsx
│   ├── MuiBadge.tsx
│   ├── MuiTooltip.tsx
│   ├── MuiMenu.tsx
│   ├── MuiMenuItem.tsx
│   ├── MuiModal.tsx
│   ├── MuiMessage.tsx
│   │
│   ├── # 新增组件
│   ├── MuiBox.tsx          # 【新增】
│   ├── MuiStack.tsx        # 【新增】
│   ├── MuiPaper.tsx        # 【新增】
│   ├── MuiDivider.tsx      # 【新增】
│   ├── MuiTypography.tsx   # 【新增】
│   ├── MuiTable.tsx        # 【新增】
│   ├── MuiTag.tsx          # 【新增】封装 Chip
│   ├── MuiList.tsx         # 【新增】
│   ├── MuiEmpty.tsx        # 【新增】
│   ├── MuiPagination.tsx   # 【新增】
│   ├── MuiCheckbox.tsx     # 【新增】
│   ├── MuiSwitch.tsx       # 【新增】
│   ├── MuiRadio.tsx        # 【新增】
│   ├── MuiForm.tsx         # 【新增】
│   ├── MuiAlert.tsx        # 【新增】
│   ├── MuiSpin.tsx         # 【新增】封装 CircularProgress
│   ├── MuiProgress.tsx     # 【新增】
│   ├── MuiTabs.tsx         # 【新增】
│   ├── MuiBreadcrumb.tsx   # 【新增】
│   ├── MuiDrawer.tsx       # 【新增】
│   ├── MuiCollapse.tsx     # 【新增】封装 Accordion
│   └── MuiPopover.tsx      # 【新增】
```

### 4.2 工作量估算

| 组件类别 | 数量 | 复杂度 | 工时 |
|---------|------|-------|------|
| 布局组件 | 4 | 低 | 1 天 |
| 排版组件 | 1 | 低 | 0.5 天 |
| 数据展示 | 6 | 中-高 | 3 天 |
| 表单组件 | 6 | 中 | 2 天 |
| 反馈组件 | 3 | 低 | 1 天 |
| 导航组件 | 3 | 中 | 1.5 天 |
| 容器组件 | 4 | 中 | 1.5 天 |
| **合计** | **27** | - | **10.5 天** |

---

## 5. Phase 3：Native Adapter 实现

> 同步实现 `infra-adapter-ui-native`，确保两套适配器组件集一致。

工时估算：**8 天**（Native 实现相对简单，主要是 CSS-in-JS）

---

## 6. Phase 4：插件迁移

### 6.1 迁移步骤

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  插件迁移标准流程                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: 更新 package.json                                                  │
│  ═══════════════════════════════════════════════════════════════════════   │
│  - 移除 dependencies 中的 @mui/material、@mui/icons-material                │
│  - 添加 peerDependencies: @brix/runtime-sdk-react                           │
│                                                                              │
│  Step 2: 替换 import 语句                                                   │
│  ═══════════════════════════════════════════════════════════════════════   │
│  - 删除: import { Box, Typography } from '@mui/material';                   │
│  + 新增: import { useUI } from '@brix/runtime-sdk-react';                   │
│  + 组件获取: const { Box, Typography } = useUI();                           │
│                                                                              │
│  Step 3: 调整组件调用                                                       │
│  ═══════════════════════════════════════════════════════════════════════   │
│  - MUI 特有属性（如 sx）→ 转为 style 或 className                           │
│  - 组件名映射（如 Chip → Tag）                                              │
│                                                                              │
│  Step 4: 验证功能                                                           │
│  ═══════════════════════════════════════════════════════════════════════   │
│  - 本地运行验证 UI 渲染                                                     │
│  - 运行单元测试                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 插件迁移清单

| 插件 | 优先级 | 文件数 | 预计工时 | 负责人 |
|------|-------|-------|---------|-------|
| app-case | P0 | 5 | 2 天 | TBD |
| app-partners | P0 | 7 | 2 天 | TBD |
| app-products | P0 | 9 | 2.5 天 | TBD |
| app-booking | P1 | 7 | 2 天 | TBD |
| app-identity | P1 | 6 | 1.5 天 | TBD |
| app-carousel | P2 | 3 | 1 天 | TBD |
| app-messenger | P2 | 3 | 1 天 | TBD |
| **合计** | - | **40** | **12 天** | - |

### 6.3 违规文件详细清单

#### app-case

| 文件 | 行号 | 违规组件 |
|------|-----|---------|
| `src/App.tsx` | 31-32 | ThemeProvider, CssBaseline |
| `src/pages/CaseListPageV2.tsx` | 42-65 | Box, Card, Typography, TextField, Table, Chip, Tabs, Alert, CircularProgress |
| `src/pages/CaseDetailPageV2.tsx` | 42-58 | Box, Card, Typography, Chip, Tabs, Divider, Accordion, Avatar, Tooltip |
| `src/components/NewCaseDialog.tsx` | 41-57 | Dialog, Box, Typography, TextField, Button, FormControl, Select, Alert |
| `src/components/NodeProgressBar.tsx` | 42-44 | Box, Tooltip, Typography |

#### app-partners

| 文件 | 行号 | 违规组件 |
|------|-----|---------|
| `src/pages/PartnerListPage.tsx` | 56 | Box, Typography, Table, Chip, Avatar, IconButton |
| `src/pages/PartnerListPageV2.tsx` | 43 | Box, Typography, Table, Chip, TextField |
| `src/pages/PartnerCreatePage.tsx` | 42 | Box, Typography, TextField, Paper |
| `src/pages/PartnerDetailPage.tsx` | 42 | Box, Typography, Chip, Avatar, Paper |
| `src/pages/PartnerEditPage.tsx` | 45 | Box, Typography, TextField, Paper |
| `src/components/AddPartnerDialog.tsx` | 45 | Dialog, TextField, Select |
| `src/components/PartnerCard.tsx` | 40 | Card, Typography, Chip, Avatar |

#### app-products

| 文件 | 行号 | 违规组件 |
|------|-----|---------|
| `src/pages/ProductListPage.tsx` | 56 | Box, Typography, Table, Chip |
| `src/pages/ProductListPageV2.tsx` | 52 | Box, Typography, Table, Chip |
| `src/pages/ProductCreatePage.tsx` | 44 | Box, Typography, TextField, Paper |
| `src/pages/ProductDetailPage.tsx` | 47 | Box, Typography, Chip, Paper |
| `src/pages/ProductEditPage.tsx` | 48 | Box, Typography, TextField, Paper |
| `src/components/AddProductDialog.tsx` | 51 | Dialog, TextField, Select |
| `src/components/ProductCard.tsx` | 48 | Card, Typography, Chip |
| `src/components/ProductDetailDialog.tsx` | 52 | Dialog, Typography, Chip |
| `src/components/ProductFormFields.tsx` | 41 | TextField, Select, FormControl |

---

## 7. Phase 5：ESLint 治理

### 7.1 规则定义

```javascript
// @brix/eslint-config-architecture/rules/no-direct-ui-import.js

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct import of UI libraries in enterprise-solutions',
      category: 'Architecture',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    
    // 只对 enterprise-solutions 目录生效
    if (!filename.includes('enterprise-solutions')) {
      return {};
    }
    
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        const bannedImports = [
          '@mui/material',
          '@mui/icons-material',
          'antd',
          'element-plus',
          '@ant-design',
        ];
        
        if (bannedImports.some(pkg => source.startsWith(pkg))) {
          context.report({
            node,
            message: `Direct import of '${source}' is forbidden in enterprise-solutions. Use useUI() from @brix/runtime-sdk-react instead.`,
          });
        }
      },
    };
  },
};
```

### 7.2 CI 集成

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Guard

on: [pull_request]

jobs:
  lint-ui-imports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm -F @brix/enterprise-solutions... lint
        env:
          ESLINT_RULE_LEVEL: error
```

---

## 8. 实施路线图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           实施路线图                                         │
├──────┬──────────────────────────────────────────────────────────────────────┤
│ Week │ 任务                                                                 │
├──────┼──────────────────────────────────────────────────────────────────────┤
│  1   │ Phase 1: UIAdapter 契约扩展（types/ui 新增 22 个组件定义）            │
│      │ • 定义所有 Props 接口                                                │
│      │ • 更新 adapter.ts                                                   │
│      │ • 更新 index.ts barrel export                                       │
├──────┼──────────────────────────────────────────────────────────────────────┤
│ 2-3  │ Phase 2: MUI Adapter 实现                                            │
│      │ • 实现 27 个新增组件                                                 │
│      │ • 更新 muiUIAdapter 导出                                            │
│      │ • 单元测试                                                          │
├──────┼──────────────────────────────────────────────────────────────────────┤
│ 3-4  │ Phase 3: Native Adapter 实现                                         │
│      │ • 同步实现 27 个组件                                                 │
│      │ • 确保与 MUI 行为一致                                                │
├──────┼──────────────────────────────────────────────────────────────────────┤
│ 5-6  │ Phase 4: 插件迁移                                                    │
│      │ • P0 插件：app-case, app-partners, app-products                     │
│      │ • P1 插件：app-booking, app-identity                                │
│      │ • P2 插件：app-carousel, app-messenger                              │
├──────┼──────────────────────────────────────────────────────────────────────┤
│  7   │ Phase 5: ESLint + CI 治理                                            │
│      │ • 发布 no-direct-ui-import 规则                                     │
│      │ • 配置 CI 卡点                                                      │
│      │ • 全量回归测试                                                      │
├──────┼──────────────────────────────────────────────────────────────────────┤
│      │ 总计：7 周                                                          │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 9. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| UIAdapter 组件覆盖不全 | 插件迁移受阻 | 迁移前完整扫描，确保组件全覆盖 |
| Props 差异导致功能丢失 | UI 行为不一致 | Props 设计参考多库交集，预留 escape hatch |
| 迁移期间并行开发冲突 | 合并冲突频繁 | 分插件依次迁移，避免同时修改 |
| 新开发继续违规引用 | 治理失效 | Phase 1 完成后立即启用 ESLint 规则（warn 级别） |

---

## 10. 验收标准

| 阶段 | 验收标准 |
|------|---------|
| Phase 1 | UIAdapter 接口定义完整，TypeScript 编译通过 |
| Phase 2 | MUI Adapter 所有组件实现，Storybook 展示正常 |
| Phase 3 | Native Adapter 所有组件实现，与 MUI 行为一致 |
| Phase 4 | 7 个插件迁移完成，grep `@mui/material` 返回 0 结果 |
| Phase 5 | ESLint 规则发布，CI 卡点生效，新 PR 无法合入违规代码 |

---

## 附录 A：组件映射表

| BrixUI 组件 | MUI 实现 | Ant Design 实现 | 备注 |
|------------|---------|----------------|------|
| Button | Button | Button | 已有 |
| Input | TextField | Input | 已有 |
| Select | Select | Select | 已有 |
| Card | Card | Card | 已有 |
| Avatar | Avatar | Avatar | 已有 |
| Badge | Badge | Badge | 已有 |
| Tooltip | Tooltip | Tooltip | 已有 |
| Menu | List | Menu | 已有 |
| Modal | Dialog | Modal | 已有 |
| Icon | SvgIcon | Icon | 已有 |
| Box | Box | - | **新增** |
| Stack | Stack | Space | **新增** |
| Paper | Paper | - | **新增** |
| Divider | Divider | Divider | **新增** |
| Typography | Typography | Typography | **新增** |
| Table | Table | Table | **新增** |
| Tag | Chip | Tag | **新增** |
| Alert | Alert | Alert | **新增** |
| Spin | CircularProgress | Spin | **新增** |
| Tabs | Tabs | Tabs | **新增** |
| Checkbox | Checkbox | Checkbox | **新增** |
| Switch | Switch | Switch | **新增** |
| Radio | Radio | Radio | **新增** |
| Drawer | Drawer | Drawer | **新增** |
| Collapse | Accordion | Collapse | **新增** |
| Pagination | Pagination | Pagination | **新增** |
| Empty | - | Empty | **新增** |
| Progress | LinearProgress | Progress | **新增** |
| Breadcrumb | Breadcrumbs | Breadcrumb | **新增** |
| Popover | Popover | Popover | **新增** |
| Form | - | Form | **新增** |
| FormItem | FormControl | Form.Item | **新增** |
