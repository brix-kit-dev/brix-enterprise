/**
 * @file useGoogleAuth Hook
 * @description React Hook wrapping Google OAuth login functionality
 * @module @shinwa/shinwa-platform-shell-web/oauth/google/useGoogleAuth
 * @version 3.2.0
 * 
 * [Design References]
 * - React Query: State management pattern
 * - SWR: Data fetching hook design
 * - Auth0 React SDK: OAuth Hook design
 * 
 * [v3.2 Changes]
 * GoogleOAuthService has been migrated to @brix/platform-auth-web
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  GoogleOAuthService, 
  getGoogleAuthService, 
  initGoogleAuth,
  type GoogleOAuthConfig, 
  type GoogleAuthResult, 
  type GoogleUserInfo,
  type OAuthError,
} from '@brix/platform-auth-web';
import { StorageAdapter, LocalStorageAdapter } from '../../storage';

// ============================================================================
// Hook Type Definitions
// ============================================================================

/**
 * useGoogleAuth Hook Configuration
 */
export interface UseGoogleAuthOptions extends GoogleOAuthConfig {
  /**
   * Whether to check login status on mount
   * @default true
   */
  checkOnMount?: boolean;
  
  /**
   * Whether to auto-redirect after login
   * @default true
   */
  autoRedirect?: boolean;
  
  /**
   * Navigation function (for React Router, etc.)
   */
  navigate?: (path: string, options?: { replace?: boolean }) => void;
  
  /**
   * Storage adapter
   * @default LocalStorageAdapter('shinwa')
   */
  storage?: StorageAdapter;
}

/**
 * useGoogleAuth Hook Return Value
 */
export interface UseGoogleAuthReturn {
  /**
   * Whether loading
   */
  isLoading: boolean;
  
  /**
   * Whether logged in
   */
  isAuthenticated: boolean;
  
  /**
   * Current user information
   */
  user: GoogleUserInfo | null;
  
  /**
   * Error information
   */
  error: OAuthError | null;
  
  /**
   * Initiate Google login
   */
  signIn: (options?: Partial<GoogleOAuthConfig>) => Promise<void>;
  
  /**
   * Handle callback (use on callback page)
   */
  handleCallback: () => Promise<GoogleAuthResult>;
  
  /**
   * Sign out
   */
  signOut: () => Promise<void>;
  
  /**
   * Clear error
   */
  clearError: () => void;
  
  /**
   * Google OAuth service instance
   */
  service: GoogleOAuthService;
}

// ============================================================================
// Storage Management
// ============================================================================

const AUTH_STORAGE_KEY = 'google_auth';

interface StoredAuthState {
  user: GoogleUserInfo;
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

function createAuthStorageHelpers(storage: StorageAdapter) {
  return {
    getStoredAuth(): StoredAuthState | null {
      try {
        const auth = storage.get<StoredAuthState>(AUTH_STORAGE_KEY);
        if (!auth) return null;
        
        // Check if expired
        if (auth.expiresAt < Date.now()) {
          storage.remove(AUTH_STORAGE_KEY);
          return null;
        }
        
        return auth;
      } catch {
        return null;
      }
    },
    
    setStoredAuth(result: GoogleAuthResult): void {
      const state: StoredAuthState = {
        user: result.user,
        accessToken: result.tokens.access_token,
        expiresAt: Date.now() + result.tokens.expires_in * 1000,
        refreshToken: result.tokens.refresh_token,
      };
      storage.set(AUTH_STORAGE_KEY, state);
    },
    
    clearStoredAuth(): void {
      storage.remove(AUTH_STORAGE_KEY);
    },
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Google OAuth Hook
 * 
 * Provides complete state management and operation methods for Google login.
 * 
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { signIn, isLoading, error } = useGoogleAuth({
 *     clientId: 'your-client-id.apps.googleusercontent.com',
 *   });
 * 
 *   return (
 *     <button onClick={() => signIn()} disabled={isLoading}>
 *       {isLoading ? 'Signing in...' : 'Sign in with Google'}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // On callback page
 * function GoogleCallbackPage() {
 *   const { handleCallback, error } = useGoogleAuth({
 *     clientId: 'your-client-id.apps.googleusercontent.com',
 *     navigate: useNavigate(),
 *   });
 * 
 *   useEffect(() => {
 *     handleCallback().then(result => {
 *       // Login successful, auto redirect
 *     });
 *   }, []);
 * 
 *   if (error) return <div>Login failed: {error.message}</div>;
 *   return <div>Processing login...</div>;
 * }
 * ```
 */
export function useGoogleAuth(options: UseGoogleAuthOptions): UseGoogleAuthReturn {
  const {
    checkOnMount = true,
    autoRedirect = true,
    navigate,
    storage = new LocalStorageAdapter('shinwa'),
    onSuccess: customOnSuccess,
    onError: customOnError,
    ...serviceConfig
  } = options;
  
  // Initialize storage helpers
  const { getStoredAuth, setStoredAuth, clearStoredAuth } = useMemo(
    () => createAuthStorageHelpers(storage),
    [storage]
  );
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<GoogleUserInfo | null>(null);
  const [error, setError] = useState<OAuthError | null>(null);
  
  // Initialize service
  const service = useMemo(() => {
    return initGoogleAuth({
      ...serviceConfig,
      onSuccess: (result: GoogleAuthResult) => {
        setUser(result.user);
        setError(null);
        setStoredAuth(result);
        customOnSuccess?.(result);
        
        // Auto redirect
        if (autoRedirect && navigate && result.redirectPath) {
          navigate(result.redirectPath, { replace: true });
        }
      },
      onError: (err: OAuthError) => {
        setError(err);
        customOnError?.(err);
      },
    });
  }, [serviceConfig.clientId, serviceConfig.redirectUri]);
  
  // Check login status on mount
  useEffect(() => {
    if (checkOnMount) {
      const stored = getStoredAuth();
      if (stored) {
        setUser(stored.user);
      }
    }
  }, [checkOnMount]);
  
  // Initiate login
  const signIn = useCallback(async (signInOptions?: Partial<GoogleOAuthConfig>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await service.signIn(signInOptions);
      // If redirect mode, this won't execute
    } catch (err) {
      setError(err as OAuthError);
      setIsLoading(false);
    }
  }, [service]);
  
  // Handle callback
  const handleCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.handleCallback();
      setUser(result.user);
      setStoredAuth(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err as OAuthError);
      setIsLoading(false);
      throw err;
    }
  }, [service]);
  
  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const stored = getStoredAuth();
      if (stored?.accessToken) {
        await service.signOut(stored.accessToken);
      }
    } catch {
      // Ignore sign out errors
    }
    
    clearStoredAuth();
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, [service]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    error,
    signIn,
    handleCallback,
    signOut,
    clearError,
    service,
  };
}

export default useGoogleAuth;
