/**
 * @file services module exports
 * @module host-standalone-web/services
 * @version 3.2.0
 *
 * [Ultra-thin Host Principle]
 * Following v3.0.4 blueprint ultra-thin Host principle:
 * - plugin-discovery, manifest-loader have been migrated to @brix/runtime-orchestrator-web
 * - mf-loader has been migrated to @brix/infra-adapter-mf-web
 * - This file only retains Host-specific services (e.g., auth.service) and backward-compatible re-exports
 *
 * [Recommended Practice]
 * New code should import directly from SDK modules rather than from this file.
 */

// ============================================================================
// Host-specific Services
// ============================================================================
export {
  createAuthService,
  type AuthService,
  type User,
  type LoginResult,
  type RegisterData,
  type RegisterResult,
} from './auth.service';

// ============================================================================
// Backward-compatible Re-exports - mf-loader
// @deprecated Please import directly from '@brix/infra-adapter-mf-web'
// ============================================================================
export {
  mfLoader,
  clearMFCache,
  preloadContainer,
  isContainerLoaded,
  type ManifestConfig,
  type MFLoadOptions,
} from '@brix/infra-adapter-mf-web';

// ============================================================================
// Backward-compatible Re-exports - plugin-discovery & manifest-loader
// @deprecated Please import directly from '@brix/runtime-orchestrator-web'
// ============================================================================
export {
  discoverPlugins,
  clearPluginCache,
  isDiscoveryServiceAvailable,
  loadAllManifests,
  aggregateMenus,
  aggregatePages,
  findPageById,
  type DiscoveredPlugin,
  type PluginsResponse,
  type PluginDiscoveryOptions,
  type UIPluginManifest,
  type LoadedPluginConfig,
} from '@brix/runtime-orchestrator-web';