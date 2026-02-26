/**
 * @file UI Adapter Configuration
 * @description Pure configuration-driven UI adapter selection
 * @module host-standalone-web/config/ui.config
 * @version 3.2.1
 *
 * [Architecture Notes - Following v3.0.4 Runtime Shell Blueprint]
 * 
 * Constraint 6 (Ultra-Thin Host):
 * - Host is a pure configuration-driven assembly shell
 * - NO if/else logic, NO runtime switching
 * - Adapter selection is determined at BUILD TIME via environment variables
 *
 * [Switching UI Adapters]
 * Configuration method: Build-time environment variable
 * - Set VITE_UI_ADAPTER=mui or VITE_UI_ADAPTER=native in .env file
 * - Run "pnpm dev" or "pnpm build" to apply
 *
 * [Demo: Running Both Adapters Side by Side]
 * 1. Create .env.mui with VITE_UI_ADAPTER=mui
 * 2. Create .env.native with VITE_UI_ADAPTER=native
 * 3. Run: pnpm dev:mui (port 3001) and pnpm dev:native (port 3002)
 */

import type { UIAdapter } from '@brix/runtime-sdk-api-web';
import { nativeUIAdapter } from '@brix/infra-adapter-ui-native';
import { muiUIAdapter } from '@brix/infra-adapter-ui-mui';

/**
 * Available UI adapter types
 */
export type UIAdapterType = 'mui' | 'native';

/**
 * UI Adapter capability registry
 * 
 * Declarative mapping: adapter type -> implementation
 * No logic, just data structure
 */
const UI_ADAPTER_REGISTRY: Record<UIAdapterType, { adapter: UIAdapter; description: string }> = {
  mui: {
    adapter: muiUIAdapter,
    description: 'Material UI (Blue Theme)',
  },
  native: {
    adapter: nativeUIAdapter,
    description: 'Native CSS (Black & White Theme)',
  },
};

/**
 * Build-time configured UI adapter type
 * 
 * Determined by VITE_UI_ADAPTER environment variable at build time.
 * Default: 'mui' if not specified
 */
const CONFIGURED_ADAPTER_TYPE: UIAdapterType = 
  (import.meta.env.VITE_UI_ADAPTER as UIAdapterType) || 'mui';

/**
 * Get the configured UI adapter type
 * 
 * Returns the build-time configured adapter type.
 * No runtime logic - purely reflects environment configuration.
 *
 * @returns The UI adapter type ('mui' or 'native')
 */
export function getUIAdapterType(): UIAdapterType {
  return CONFIGURED_ADAPTER_TYPE;
}

/**
 * Get the UI adapter instance based on build-time configuration
 *
 * @returns UIAdapter instance (MUI or Native)
 */
export function getUIAdapter(): UIAdapter {
  const entry = UI_ADAPTER_REGISTRY[CONFIGURED_ADAPTER_TYPE] ?? UI_ADAPTER_REGISTRY.mui;
  return entry.adapter;
}

/**
 * Export the configured adapter
 */
export const uiAdapter = getUIAdapter();

