/**
 * @file mf-loader - Host Layer Re-export
 * @description Re-exports Module Federation loader from infra-adapter-mf-web
 * @module host-standalone-web/services/mf-loader
 * @version 3.2.0
 *
 * [Ultra-thin Host Principle]
 * Core implementation has been migrated to @brix/infra-adapter-mf-web. This file only provides backward-compatible exports.
 * New code should import directly from '@brix/infra-adapter-mf-web'.
 *
 * @see @brix/infra-adapter-mf-web
 * @deprecated Please import directly from '@brix/infra-adapter-mf-web'
 */

export {
  mfLoader,
  clearMFCache,
  preloadContainer,
  isContainerLoaded,
  type ManifestConfig,
  type MFLoadOptions,
} from '@brix/infra-adapter-mf-web';

// 默认导出
export { mfLoader as default } from '@brix/infra-adapter-mf-web';
