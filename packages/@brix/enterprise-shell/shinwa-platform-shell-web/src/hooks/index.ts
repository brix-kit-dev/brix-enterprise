/**
 * @file Hooks Export
 * @description Re-export hooks from @brix/runtime-sdk-react for backward compatibility
 * @module @shinwa/shinwa-platform-shell-web/hooks
 * @version 3.1.0
 *
 * [v3.1 Migration Notes]
 * These hooks have been migrated to @brix/runtime-sdk-react as part of SDK consolidation.
 * This file re-exports them for backward compatibility.
 * New code should import directly from @brix/runtime-sdk-react.
 *
 * 【v3.1 迁移说明】
 * 这些 hooks 已迁移到 @brix/runtime-sdk-react 作为 SDK 整合的一部分。
 * 本文件重新导出它们以保持向后兼容性。
 * 新代码应直接从 @brix/runtime-sdk-react 导入。
 */

// Re-export from runtime-sdk-react
export {
  // Layout Hooks
  useLayout,
  useResponsive,
  
  // Theme Hooks
  useTheme,
  
  // Types
  type UseLayoutResult,
  type UseResponsiveResult,
  type UseThemeResult,
} from '@brix/runtime-sdk-react';
