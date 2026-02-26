/**
 * @file Manifest Loader - Host Layer Re-export
 * @description Re-exports Manifest loading service from runtime-orchestrator-web
 * @module host-standalone-web/services/manifest-loader
 * @version 3.2.0
 *
 * [Ultra-thin Host Principle]
 * Core implementation has been migrated to @brix/runtime-orchestrator-web. This file only provides backward-compatible exports.
 * New code should import directly from '@brix/runtime-orchestrator-web'.
 *
 * @see @brix/runtime-orchestrator-web
 * @deprecated Please import directly from '@brix/runtime-orchestrator-web'
 */

export {
  loadAllManifests,
  aggregateMenus,
  aggregatePages,
  findPageById,
  type UIPluginManifest,
  type LoadedPluginConfig,
} from '@brix/runtime-orchestrator-web';
