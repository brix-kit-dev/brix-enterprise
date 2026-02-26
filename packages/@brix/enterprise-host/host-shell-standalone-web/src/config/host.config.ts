/**
 * @file Host Config
 * @description Host-level base config (branding, feature flags, API endpoints)
 * @module host-standalone-web/config/host.config
 * @version 3.0.0
 */

import type { HostConfig } from '../types';
import { 
  DEFAULT_THEME,
  getSocialProviders,
  REGIONAL_SOCIAL_PROVIDERS,
  type ThemeConfig,
} from '@shinwa/shinwa-platform-shell-web';

/**
 * Custom theme config (extends platform defaults)
 */
export const themeConfig: ThemeConfig = {
  ...DEFAULT_THEME,
};

// Export social login providers (backward compatibility)
export const regionalSocialProviders = REGIONAL_SOCIAL_PROVIDERS;
export { getSocialProviders };

/**
 * Host configuration
 */
export const hostConfig: HostConfig = {
  appName: 'Shinwa Platform',
  version: '3.0.0',
  apiBase: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api',
  tenantId: import.meta.env.VITE_TENANT_ID,
  region: (import.meta.env.VITE_REGION as 'china' | 'international' | 'auto') || 'auto',

  branding: {
    appName: 'Shinwa Platform',
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