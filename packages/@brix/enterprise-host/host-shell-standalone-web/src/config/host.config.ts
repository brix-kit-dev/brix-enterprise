/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * @file Host Configuration
 * @description Consolidated host-level configuration: branding, menus, plugins,
 *              routes, and UI adapter selection. Following Blueprint v3.0.9
 *              Constraint 6 (Ultra-Thin Host) — pure configuration, no logic.
 *
 * @module host-standalone-web/config/host.config
 * @version 3.5.0
 *
 * [v3.5.0 Host Slimming — Phase 3.2]
 * Consolidated from 5 files (host.config, menu.config, plugins.config,
 * routes.config, ui.config) to meet R6.4 Host-Web file count target (≤ 15).
 */

import type { HostConfig, RoutesConfig, MenuItem } from '../types';
import type { UIAdapter } from '@brix-sdk/runtime-sdk-api-web';
import type { LocalPluginConfig } from '@brix-sdk/runtime-orchestrator-web';
import { DEFAULT_THEME, type ThemeConfig } from '@brix-sdk/platform-frame-web';
import { getSocialProviders, REGIONAL_SOCIAL_PROVIDERS } from '@brix-sdk/platform-auth-service-web';
import { nativeUIAdapter } from '@brix-sdk/infra-adapter-ui-native';
import { muiUIAdapter } from '@brix-sdk/infra-adapter-ui-mui';

// ============================================================================
// Theme
// ============================================================================

/** Custom theme config (extends platform defaults). */
export const themeConfig: ThemeConfig = {
  ...DEFAULT_THEME,
};

// Re-export social providers (backward compatibility)
export const regionalSocialProviders = REGIONAL_SOCIAL_PROVIDERS;
export { getSocialProviders };

// ============================================================================
// Host Core Configuration
// ============================================================================

/**
 * Host configuration — branding, features, layout, and API endpoint.
 *
 * Security Notice: The apiBase configuration MUST be provided via
 * environment variable (VITE_API_BASE). No localhost fallback is
 * provided in production to prevent accidental misconfiguration.
 */
export const hostConfig: HostConfig = {
  appName: 'Brix Platform',
  version: '3.5.0',

  // SECURITY: API base URL must be explicitly configured via environment variable.
  apiBase: (() => {
    const apiBase = import.meta.env.VITE_API_BASE;
    if (apiBase) {
      return apiBase;
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      return 'http://localhost:8080/api';
    }
    throw new Error(
      'VITE_API_BASE environment variable is required outside of local development. ' +
      'Please configure the backend API URL in your deployment.'
    );
  })(),

  tenantId: import.meta.env.VITE_TENANT_ID,
  region: (import.meta.env.VITE_REGION as 'china' | 'international' | 'auto') || 'auto',

  branding: {
    appName: 'Brix Platform',
    primaryColor: themeConfig.primaryColor,
    secondaryColor: '#f5f5f5',
    tertiaryColor: '#ffffff',
    welcomeMessage: 'Welcome back',
    subtitle: 'Enterprise Distributed Application Platform',
  },

  theme: themeConfig,

  features: {
    multiTenant: false,
    i18n: false,
    darkMode: false,
    rememberMe: true,
  },

  socialProviders: getSocialProviders('auto'),
  regionalSocialProviders,

  layout: {
    type: 'console' as const,
    sidebarWidth: 256,
    sidebarCollapsedWidth: 80,
    headerHeight: 64,
  },
};

// ============================================================================
// Menu Configuration
// ============================================================================

/**
 * Host Core Menus — ONLY infrastructure menus provided by Host.
 *
 * Plugin menus are declared in each plugin's ui-manifest.yaml and loaded
 * dynamically via usePluginSystem() hook (Blueprint §7.2.5).
 */
export const hostCoreMenus: MenuItem[] = [
  {
    key: 'dashboard',
    id: 'dashboard',
    title: 'host:menu.dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    order: 0,
    source: 'host',
  },
];

// ============================================================================
// Routes Configuration
// ============================================================================

/**
 * Host-level route declarations.
 * Plugin routes are dynamically loaded from plugin-manifest.json via usePluginSystem hook.
 */
export const routesConfig: RoutesConfig = {
  defaultHomePath: '/dashboard',
  loginPath: '/login',
  notFoundPath: '/404',
  unauthorizedPath: '/403',

  publicRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/404',
    '/403',
  ],

  protectedRoutes: [
    '/dashboard',
    '/settings',
    '/profile',
  ],

  pluginRoutes: {},
};

// ============================================================================
// Plugin Configuration
// ============================================================================

/**
 * Resolves the base URL for a local plugin from Vite environment variables.
 *
 * Resolution priority (Blueprint §7.2.5 — Manifest-Driven Plugin Discovery):
 * 1. Explicit env var (VITE_PLUGIN_XXX_URL) — always wins; production deployment path.
 * 2. DEV mode (NODE_ENV=development) — always allows localhost fallback.
 * 3. Local preview mode — plugin listed in VITE_LOCAL_PLUGINS (written by
 *    start-frontend.ps1 into .env.local) also allows localhost fallback.
 *    This enables `rspack serve --mode production` (needed to disable HMR)
 *    while still accepting localhost plugins during functional testing.
 * 4. No match → throws; guards real production deployments from misconfig.
 *
 * @param envVar    VITE_ env var name (e.g. 'VITE_PLUGIN_PRODUCTS_URL')
 * @param pluginId  Plugin ID as listed in VITE_LOCAL_PLUGINS (e.g. 'products')
 * @param devFallback  Localhost URL used when the plugin is running locally
 */
function resolvePluginUrl(envVar: string, pluginId: string, devFallback: string): string {
  const explicit = import.meta.env[envVar] as string | undefined;
  if (explicit) {
    return explicit;
  }
  if (import.meta.env.DEV) {
    return devFallback;
  }
  // Local preview mode: VITE_LOCAL_PLUGINS is written by start-frontend.ps1
  // to declare which plugins are actively served from localhost.
  const localIds = ((import.meta.env.VITE_LOCAL_PLUGINS as string | undefined) ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (localIds.includes(pluginId)) {
    return devFallback;
  }
  throw new Error(
    `${envVar} environment variable is required in production. ` +
    `Configure the plugin URL in your deployment.`
  );
}

/**
 * Local plugin registry — frontend-only plugins that bypass backend discovery.
 *
 * Each entry uses Manifest-Driven mode: only connection info is declared here.
 * Menus, routes, and pages come from the plugin's ui-manifest.json.
 * (Blueprint §7.2.5: plugins declare WHAT, Host discovers HOW.)
 */
export const localPlugins: LocalPluginConfig[] = [
  {
    id: 'tenant',
    remoteEntry: `${resolvePluginUrl('VITE_PLUGIN_TENANT_URL', 'tenant', 'http://localhost:3054')}/remoteEntry.js`,
    scope: 'tenant',
    manifestUrl: `${resolvePluginUrl('VITE_PLUGIN_TENANT_URL', 'tenant', 'http://localhost:3054')}/ui-manifest.json`,
  },
  {
    id: 'partners',
    remoteEntry: `${resolvePluginUrl('VITE_PLUGIN_PARTNERS_URL', 'partners', 'http://localhost:3003')}/remoteEntry.js`,
    scope: 'partners',
    manifestUrl: `${resolvePluginUrl('VITE_PLUGIN_PARTNERS_URL', 'partners', 'http://localhost:3003')}/ui-manifest.json`,
  },
  {
    // Manifest-Driven Local Plugin (Blueprint §7.2.5)
    // Backend may also report this plugin; usePluginDiscovery dedupes by
    // MF scope so the local YAML (SSoT, Constraint 8) takes precedence in dev.
    id: 'products',
    remoteEntry: `${resolvePluginUrl('VITE_PLUGIN_PRODUCTS_URL', 'products', 'http://localhost:3004')}/remoteEntry.js`,
    scope: 'products',
    manifestUrl: `${resolvePluginUrl('VITE_PLUGIN_PRODUCTS_URL', 'products', 'http://localhost:3004')}/ui-manifest.json`,
  },
];

// ============================================================================
// UI Adapter Configuration
// ============================================================================

/** Available UI adapter types. */
export type UIAdapterType = 'mui' | 'native';

/** Plugin declaration type (aligned with backend API response format). */
export interface PluginDeclaration {
  id: string;
  name: string;
  remoteEntry: string;
  manifestUrl: string;
  enabled: boolean;
  priority: number;
}

/**
 * UI Adapter capability registry — declarative mapping, no logic.
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

/** Build-time configured UI adapter type (from VITE_UI_ADAPTER env). */
const CONFIGURED_ADAPTER_TYPE: UIAdapterType =
  (import.meta.env.VITE_UI_ADAPTER as UIAdapterType) || 'mui';

/** Get the configured UI adapter type (build-time determined). */
export function getUIAdapterType(): UIAdapterType {
  return CONFIGURED_ADAPTER_TYPE;
}

/** Get the UI adapter instance based on build-time configuration. */
export function getUIAdapter(): UIAdapter {
  const entry = UI_ADAPTER_REGISTRY[CONFIGURED_ADAPTER_TYPE] ?? UI_ADAPTER_REGISTRY.mui;
  return entry.adapter;
}

/** The configured UI adapter instance. */
export const uiAdapter = getUIAdapter();