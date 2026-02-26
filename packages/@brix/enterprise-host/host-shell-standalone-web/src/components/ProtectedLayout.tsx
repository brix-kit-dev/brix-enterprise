/**
 * @file Protected Layout Re-export
 * @description Host layer ProtectedLayout component - re-exported from Shell layer
 * @module host-standalone-web/components/ProtectedLayout
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All layout components are imported from Shell layer
 * - This file only serves as a re-export bridge
 *
 * @see @shinwa/shinwa-platform-shell-web/layouts/ProtectedLayout
 */

// 从 Shell 层重导出 ProtectedLayout 组件及其类型
export {
  ProtectedLayout,
  type ProtectedLayoutProps,
  type LayoutDimensions,
  type LayoutBranding,
  type LayoutUser,
} from '@shinwa/shinwa-platform-shell-web';

export { ProtectedLayout as default } from '@shinwa/shinwa-platform-shell-web';

