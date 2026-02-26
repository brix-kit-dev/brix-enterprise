/**
 * @file Auth Service (Host Assembly Layer)
 * @description Host auth service - delegates to platform-auth-web createPlatformAuthService
 * @module host-standalone-web/services/auth.service
 * @version 3.1.0
 *
 * v3.1 Architecture:
 * Auth logic implemented by @brix/platform-auth-web.
 * Host only injects config (API base URL, OAuth clientId, etc.)
 */

import { createPlatformAuthService, type PlatformAuthService, type AuthUser, type LoginResult, type RegisterData, type RegisterResult } from '@brix/platform-auth-web';
import { configureSocialOAuth, getEnabledSocialProviders, type SocialProvider } from '@shinwa/shinwa-platform-shell-web';

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
    storageMode: (import.meta.env.VITE_AUTH_STORAGE_MODE as 'memory' | 'session' | 'cookie') || 'memory',
    devMode: import.meta.env.DEV,
    oauthProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: GOOGLE_REDIRECT_URI,
        scope: 'openid email profile',
      },
    },
  });
}

// Re-export types for backward compatibility
export type { PlatformAuthService as AuthService, AuthUser as User, LoginResult, RegisterData, RegisterResult };
