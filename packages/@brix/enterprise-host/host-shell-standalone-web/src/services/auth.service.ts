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
 * @file Auth Service (Host Assembly Layer)
 * @description Host auth service - delegates to platform-auth-web createPlatformAuthService
 * @module host-standalone-web/services/auth.service
 * @version 3.1.0
 *
 * v3.1 Architecture:
 * Auth logic implemented by @brix-sdk/platform-auth-web.
 * Host only injects config (API base URL, OAuth clientId, etc.)
 */

import { createPlatformAuthService, type PlatformAuthService, type AuthUser, type LoginResult, type RegisterData, type RegisterResult } from '@brix-sdk/platform-auth-web';
import { configureSocialOAuth, getEnabledSocialProviders, type SocialProvider } from '@brix-sdk/platform-auth-service-web';
import { PLATFORM_ADMIN_ROUTES } from '@brix-sdk/platform-admin-web';

// ============================================================================
// OAuth Config (injected from Host config into platform layer)
// ============================================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback/google`;

if (GOOGLE_CLIENT_ID) {
  configureSocialOAuth('google', {
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    scope: 'openid email profile',
  });
}

/**
 * Get currently configured social login providers
 */
export function getConfiguredSocialProviders(): SocialProvider[] {
  return getEnabledSocialProviders('international');
}

// ============================================================================
// Host Auth Service (thin wrapper)
// ============================================================================

/**
 * Create Host auth service
 *
 * Injects Host-level config and delegates to platform auth service
 */
export function createAuthService(): PlatformAuthService {
  return createPlatformAuthService({
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    storageMode: (import.meta.env.VITE_AUTH_STORAGE_MODE as 'memory' | 'session' | 'cookie') || 'session',
    platformAdminRedirectPath: PLATFORM_ADMIN_ROUTES.DASHBOARD,
    oauthProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: GOOGLE_REDIRECT_URI,
        scope: 'openid email profile',
      },
    },
  });
}

// ============================================================================
// Singleton Instance (shared between bootstrap.tsx and App.tsx)
// ============================================================================

/**
 * Module-level singleton for the auth service.
 * Created lazily on first access and shared across the application.
 * This ensures bootstrap.tsx and App.tsx use the same storage instance.
 */
let _instance: PlatformAuthService | null = null;

export function getAuthService(): PlatformAuthService {
  if (!_instance) {
    _instance = createAuthService();
  }
  return _instance;
}

// Re-export types for backward compatibility
export type { PlatformAuthService as AuthService, AuthUser as User, LoginResult, RegisterData, RegisterResult };
