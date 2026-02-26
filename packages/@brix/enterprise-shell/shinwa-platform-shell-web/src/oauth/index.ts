/**
 * @file OAuth Module Exports
 * @description Exports all OAuth related types and utilities
 * @module @shinwa/shinwa-platform-shell-web/oauth
 * @version 3.0.0
 */

// ============================================================================
// General OAuth Configuration
// ============================================================================

// Type exports
export type {
  OAuthCredentials,
  SocialProvider,
  RegionalSocialProviders,
} from './types';

// Default value exports
export {
  CHINA_SOCIAL_PROVIDERS,
  INTERNATIONAL_SOCIAL_PROVIDERS,
  REGIONAL_SOCIAL_PROVIDERS,
} from './defaults';

// Utility function exports
export {
  getSocialProviders,
  getEnabledSocialProviders,
  configureSocialOAuth,
} from './defaults';

// ============================================================================
// Google OAuth (Full Implementation)
// ============================================================================

export * from './google';
