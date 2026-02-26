/**
 * @file usePluginSystem Hook - Host Layer Re-export
 * @description Re-exports usePluginSystem Hook from runtime-orchestrator-web
 * @module host-standalone-web/hooks/usePluginSystem
 * @version 3.2.0
 *
 * [Ultra-thin Host Principle]
 * Following v3.0.4 blueprint ultra-thin Host principle, usePluginSystem core logic has been
 * migrated to SDK layer (@brix/runtime-orchestrator-web), Host layer only re-exports.
 *
 * [Migration Notes]
 * - Original implementation has been migrated to: @brix/runtime-orchestrator-web/hooks/usePluginSystem
 * - Host layer retains this file only for backward compatibility
 * - New code should import directly from '@brix/runtime-orchestrator-web'
 *
 * [Recommended Usage]
 * ```tsx
 * // Recommended: Import directly from SDK
 * import { usePluginSystem } from '@brix/runtime-orchestrator-web';
 *
 * // Compatible: Import from Host layer (internally re-exports)
 * import { usePluginSystem } from '../hooks/usePluginSystem';
 * ```
 *
 * @see @brix/runtime-orchestrator-web
 */

// ============================================================================
// Re-export usePluginSystem and related types from SDK layer
// ============================================================================
export {
  usePluginSystem,
  type AggregatedMenuItem,
  type AggregatedRoute,
  type PluginSystemLifecyclePhase,
  type PluginState,
  type UsePluginSystemResult,
  type UsePluginSystemOptions,
  type HostMenuConfig,
} from '@brix/runtime-orchestrator-web';

// 默认导出
export { usePluginSystem as default } from '@brix/runtime-orchestrator-web';
