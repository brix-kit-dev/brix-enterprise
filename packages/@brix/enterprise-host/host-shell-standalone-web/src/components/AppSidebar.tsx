/**
 * @file AppSidebar Re-export
 * @description Host layer AppSidebar component - re-exported from Shell layer
 * @module host-standalone-web/components/AppSidebar
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All components are imported from Shell layer
 * - This file only serves as a re-export bridge
 *
 * @see @shinwa/shinwa-platform-shell-web/components/AppSidebar
 */

// 从 Shell 层重导出 AppSidebar 组件及其类型
export {
  AppSidebar,
  type AppSidebarProps,
  type SidebarMenuItem,
} from '@shinwa/shinwa-platform-shell-web';

export { AppSidebar as default } from '@shinwa/shinwa-platform-shell-web';

