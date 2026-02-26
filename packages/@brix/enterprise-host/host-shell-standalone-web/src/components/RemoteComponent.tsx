/**
 * @file RemoteComponent Re-export
 * @description Host layer RemoteComponent - re-exported from Infra Adapter layer
 * @module host-standalone-web/components/RemoteComponent
 * @version 3.2.0
 *
 * [Architecture Notes]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - Host layer does not contain component implementations
 * - All Module Federation related components are imported from Infra Adapter layer
 * - This file only serves as a re-export bridge
 *
 * @see @brix/infra-adapter-mf-web/RemoteComponent
 */

// 从 Infra Adapter 层重导出 RemoteComponent 组件及其类型
export {
  RemoteComponent,
  clearRemoteComponentCache,
  getRemoteComponentCacheSize,
  type RemoteComponentProps,
} from '@brix/infra-adapter-mf-web';

export { RemoteComponent as default } from '@brix/infra-adapter-mf-web';
