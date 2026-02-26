/**
 * @file OAuth Configuration Types
 * @description OAuth social login related type definitions
 * @module @shinwa/shinwa-platform-shell-web/oauth
 * @version 3.0.0
 */

// ============================================================================
// OAuth Credential Types
// ============================================================================

/**
 * OAuth Credential Configuration
 * Used for social login and OAuth 2.0 configuration
 */
export interface OAuthCredentials {
  /**
   * OAuth Client ID
   */
  clientId: string;
  
  /**
   * Redirect URI (optional, defaults to window.location.origin + /auth/callback/{providerId})
   */
  redirectUri?: string;
  
  /**
   * OAuth authorization scope
   */
  scope?: string;
}

/**
 * Social Login Provider
 */
export interface SocialProvider {
  /**
   * Provider ID (google, apple, microsoft, wechat, alipay)
   */
  id: string;
  
  /**
   * Provider name
   */
  name: string;
  
  /**
   * Icon (emoji or SVG)
   */
  icon: string;
  
  /**
   * Background color
   */
  backgroundColor: string;
  
  /**
   * Text color
   */
  textColor: string;
  
  /**
   * OAuth credential configuration (optional)
   * If provided, enables this social login
   */
  oauth?: OAuthCredentials;
  
  /**
   * Whether enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * Regional Social Login Provider Configuration
 */
export interface RegionalSocialProviders {
  /**
   * China mainland region providers
   * Recommended: WeChat, Alipay
   */
  china: SocialProvider[];
  
  /**
   * International market providers
   * Recommended: Google, Apple, Microsoft
   */
  international: SocialProvider[];
}
