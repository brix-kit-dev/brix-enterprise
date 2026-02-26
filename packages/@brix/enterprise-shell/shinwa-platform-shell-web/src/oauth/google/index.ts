/**
 * @file Google OAuth Module Exports
 * @description Exports all Google OAuth related components and utilities
 * @module @shinwa/shinwa-platform-shell-web/oauth/google
 * @version 3.2.0
 * 
 * [v3.2 Architecture Change Notes]
 * GoogleOAuthService and related types have been migrated to @brix/platform-auth-web
 * This file is retained as a compatibility layer, re-exporting from platform-auth-web
 * 
 * [Migration Guide]
 * Old code (v3.1):
 *   import { GoogleOAuthService } from '@shinwa/shinwa-platform-shell-web/oauth/google';
 * 
 * New code (v3.2 recommended):
 *   import { GoogleOAuthService } from '@brix/platform-auth-web';
 */

// ============================================================================
// Re-exports from platform-auth-web (v3.2 Migration)
// ============================================================================

// Type exports
export type {
  GoogleOAuthConfig,
  GoogleAuthResult,
  GoogleUserInfo,
  GoogleTokenResponse,
  OAuthError,
  GoogleOAuthErrorCode,
  PKCEPair,
  TokenExchangeRequest,
  TokenRefreshRequest,
  BackendAuthResponse,
} from '@brix/platform-auth-web';

// Service exports
export {
  GoogleOAuthService,
  getGoogleAuthService,
  initGoogleAuth,
  resetGoogleAuth,
} from '@brix/platform-auth-web';

// ============================================================================
// Local Components (Still retained in Shell layer)
// ============================================================================

// Hook exports
export {
  useGoogleAuth,
  type UseGoogleAuthOptions,
  type UseGoogleAuthReturn,
} from './useGoogleAuth';

// Component exports
export {
  GoogleSignInButton,
  type GoogleSignInButtonProps,
  type GoogleButtonTheme,
  type GoogleButtonSize,
  type GoogleButtonShape,
  type GoogleButtonText,
} from './GoogleSignInButton';

// Callback page exports
export {
  createGoogleCallbackPage,
  type GoogleCallbackPageConfig,
  type GoogleCallbackPageProps,
} from './GoogleCallbackPage';
