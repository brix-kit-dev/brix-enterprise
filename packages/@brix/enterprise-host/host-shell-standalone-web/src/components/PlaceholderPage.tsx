/**
 * @file PlaceholderPage Re-export
 * @description Host layer PlaceholderPage component - re-exported from Shell layer
 * @module host-standalone-web/components/PlaceholderPage
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All page components are imported from Shell layer
 * - This file only serves as a re-export bridge
 *
 * @see @shinwa/shinwa-platform-shell-web/pages/PlaceholderPage
 */

// 从 Shell 层重导出 PlaceholderPage 组件及其类型
export {
  PlaceholderPage,
  createSimplePlaceholderPage,
  type PlaceholderPageProps,
  type SimplePlaceholderConfig,
} from '@shinwa/shinwa-platform-shell-web';

export { PlaceholderPage as default } from '@shinwa/shinwa-platform-shell-web';

