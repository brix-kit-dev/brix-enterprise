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
 * @file Type definitions
 * @description Host-level type definitions
 * @module host-standalone-web/types
 * @version 3.0.0
 */

import type { SocialProvider, LoginFormBranding } from '@brix-sdk/platform-auth-web';
import type { ThemeConfig, BrandingConfig } from '@brix-sdk/platform-frame-web';
import type { RegionalSocialProviders } from '@brix-sdk/platform-auth-service-web';

export type { ThemeConfig, BrandingConfig, RegionalSocialProviders };
export type { SocialProvider } from '@brix-sdk/platform-auth-web';

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