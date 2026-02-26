/**
 * @file Type definitions
 * @description Host-level type definitions
 * @module host-standalone-web/types
 * @version 3.0.0
 */

import type { SocialProvider, LoginFormBranding } from '@brix/platform-auth-web';
import type { ThemeConfig, BrandingConfig, RegionalSocialProviders } from '@shinwa/shinwa-platform-shell-web';

export type { ThemeConfig, BrandingConfig, RegionalSocialProviders };
export type { SocialProvider } from '@brix/platform-auth-web';

export interface HostConfig {
  appName: string;
  version: string;
  apiBase: string;
  tenantId?: string;
  region?: 'china' | 'international' | 'auto';
  branding: LoginFormBranding;
  theme?: ThemeConfig;
  features: HostFeatures;
  socialProviders?: SocialProvider[];
  regionalSocialProviders?: RegionalSocialProviders;
  layout: LayoutConfig;
  /** Enable debug mode for verbose logging */
  debug?: boolean;
}

export interface HostFeatures {
  multiTenant: boolean;
  i18n: boolean;
  darkMode: boolean;
  rememberMe: boolean;
}

export interface LayoutConfig {
  type: 'console' | 'portal' | 'minimal';
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  headerHeight: number;
}

export interface GovernanceConfig {
  capabilityWhitelist: CapabilityWhitelist;
  eventRouting: EventRoutingRules;
  budget: UIBudget;
  featureFlags: Record<string, boolean>;
}

export type CapabilityWhitelist = Record<string, string[]>;
export type EventRoutingRules = Record<string, EventRoutingRule>;

export interface EventRoutingRule {
  scope: 'global' | 'plugin';
  target?: string;
}

export interface UIBudget {
  maxBundleSize: number;
  maxMemory: number;
  maxApiCallsPerMinute: number;
}

export interface RoutesConfig {
  defaultHomePath: string;
  loginPath: string;
  notFoundPath: string;
  unauthorizedPath: string;
  publicRoutes: string[];
  protectedRoutes: string[];
  pluginRoutes: Record<string, string>;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}