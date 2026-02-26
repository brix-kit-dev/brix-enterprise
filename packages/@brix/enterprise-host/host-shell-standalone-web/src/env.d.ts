/// <reference types="@rspack/core/module" />

/**
 * @file Environment variable type declarations
 * @description Type support for import.meta.env
 */

interface ImportMetaEnv {
  /**
   * API base URL
   */
  readonly VITE_API_BASE?: string;
  readonly VITE_API_BASE_URL?: string;
  
  /**
   * Tenant ID
   */
  readonly VITE_TENANT_ID?: string;
  
  /**
   * App title
   */
  readonly VITE_APP_TITLE?: string;
  
  /**
   * Region config
   */
  readonly VITE_REGION?: 'china' | 'international' | 'auto';
  
  /**
   * Auth storage mode
   */
  readonly VITE_AUTH_STORAGE_MODE?: 'memory' | 'session' | 'cookie';
  
  /**
   * Google OAuth config
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_REDIRECT_URI?: string;
  
  /**
   * UI Adapter selection
   * - 'mui': Material UI implementation (default)
   * - 'native': Pure CSS implementation (lightweight)
   */
  readonly VITE_UI_ADAPTER?: 'mui' | 'native';
  
  /**
   * Dev mode flags
   */
  readonly DEV?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}