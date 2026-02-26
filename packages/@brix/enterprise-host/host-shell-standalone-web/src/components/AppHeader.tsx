/**
 * @file AppHeader Re-export
 * @description Host layer AppHeader component - re-exported from Shell layer
 * @module host-standalone-web/components/AppHeader
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All components are imported from Shell layer
 * - This file only serves as a re-export bridge
 *
 * @see @shinwa/shinwa-platform-shell-web/components/AppHeader
 */

// 从 Shell 层重导出 AppHeader 组件及其类型
export { AppHeader, type AppHeaderProps } from '@shinwa/shinwa-platform-shell-web';
export { AppHeader as default } from '@shinwa/shinwa-platform-shell-web';
