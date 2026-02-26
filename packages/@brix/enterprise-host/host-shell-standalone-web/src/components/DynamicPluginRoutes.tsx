/**
 * @file DynamicPluginRoutes Re-export
 * @description Host layer DynamicPluginRoutes component - re-exported from Shell layer
 * @module host-standalone-web/components/DynamicPluginRoutes
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All route components are imported from Shell layer
 * - This file only serves as a re-export bridge
 *
 * @see @shinwa/shinwa-platform-shell-web/components/DynamicPluginRoutes
 */

// 从 Shell 层重导出 DynamicPluginRoutes 组件及相关工具函数
export {
  DynamicPluginRoutes,
  renderDynamicRoutes,
  convertToRouteObjects,
  type DynamicPluginRoutesProps,
  type DynamicRoutesOptions,
  type AggregatedRoute,
} from '@shinwa/shinwa-platform-shell-web';

export { DynamicPluginRoutes as default } from '@shinwa/shinwa-platform-shell-web';
