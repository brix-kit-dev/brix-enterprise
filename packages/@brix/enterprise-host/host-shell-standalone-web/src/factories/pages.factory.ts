/**
 * @file Page factory functions
 * @description Factory functions for creating Host page components
 * @module host-standalone-web/factories/pages
 * @version 3.1.0
 * 
 * This module extracts page creation logic from App.tsx to reduce file size
 * and improve maintainability. Each factory function encapsulates the
 * configuration required to create a specific page component.
 * 
 * 【架构说明】
 * 本模块将页面创建逻辑从 App.tsx 提取出来，以减少文件大小并提高可维护性。
 * 每个工厂函数封装了创建特定页面组件所需的配置。
 */

import { createSimpleLoginPage, createSimpleRegisterPage } from '@brix/platform-auth-web';
import type { LoginFormBranding, LoginFormResult, RegisterFormResult } from '@brix/platform-auth-web';
import { 
  createSimpleDashboardPage, 
  createSimpleNotFoundPage,
  createSimpleUnauthorizedPage,
} from '@shinwa/shinwa-platform-shell-web';

// ============================================================
// Types
// ============================================================

/**
 * Navigation service interface.
 * 
 * Abstraction for programmatic navigation, decoupled from router implementation.
 */
export interface NavigationService {
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

/**
 * Auth service interface.
 * 
 * Subset of AuthService used by page factories.
 */
export interface PageAuthService {
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  register: (data: unknown) => Promise<void>;
  getUser: () => { name?: string } | null;
  initiateOAuthLogin: (providerId: string) => void;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<void>;
  isAuthenticated: () => boolean;
}

/**
 * Social login provider configuration.
 */
export interface SocialProvider {
  id: string;
  name: string;
  icon?: string;
}

/**
 * Page factory dependencies.
 */
export interface PageFactoryDeps {
  authService: PageAuthService;
  navigationService: NavigationService;
  branding: LoginFormBranding;
  socialProviders?: SocialProvider[];
}

// ============================================================
// Page Factory Functions
// ============================================================

/**
 * Creates the login page component.
 * 
 * Configures the login page with authentication callbacks, branding,
 * and social login providers.
 * 
 * @param deps - Page factory dependencies
 * @returns Configured login page component
 */
export function createLoginPageFactory(deps: PageFactoryDeps): React.ComponentType {
  const { authService, navigationService, branding, socialProviders = [] } = deps;
  
  return createSimpleLoginPage({
    onLogin: async (data): Promise<LoginFormResult> => {
      try {
        await authService.login(data.username, data.password, data.rememberMe);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
      }
    },
    onLoginSuccess: () => navigationService.navigate('/dashboard', { replace: true }),
    onForgotPassword: () => navigationService.navigate('/forgot-password'),
    onRegister: () => navigationService.navigate('/register'),
    branding,
    features: {
      showRememberMe: true,
      showForgotPassword: true,
      showRegisterLink: true,
      enableSocialLogin: socialProviders.length > 0,
    },
    socialProviders,
    onSocialLogin: (providerId) => {
      console.log('Social login with:', providerId);
      authService.initiateOAuthLogin(providerId);
    },
  });
}

/**
 * Creates the register page component.
 * 
 * Configures the registration page with user registration callbacks and branding.
 * 
 * @param deps - Page factory dependencies
 * @returns Configured register page component
 */
export function createRegisterPageFactory(deps: PageFactoryDeps): React.ComponentType {
  const { authService, navigationService, branding } = deps;
  
  return createSimpleRegisterPage({
    onRegister: async (data): Promise<RegisterFormResult> => {
      try {
        await authService.register(data);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
      }
    },
    onRegisterSuccess: () => {
      navigationService.navigate('/login', { replace: true });
    },
    onBackToLogin: () => navigationService.navigate('/login'),
    branding,
    features: {
      showTermsCheckbox: true,
      termsUrl: '/terms',
      privacyUrl: '/privacy',
    },
  });
}

/**
 * Creates the dashboard page component.
 * 
 * Configures the main dashboard page with user information and navigation.
 * 
 * @param deps - Page factory dependencies
 * @returns Configured dashboard page component
 */
export function createDashboardPageFactory(deps: PageFactoryDeps): React.ComponentType {
  const { authService, navigationService, branding } = deps;
  
  return createSimpleDashboardPage({
    branding,
    username: authService.getUser()?.name || 'User',
    onNavigate: navigationService.navigate,
  });
}

/**
 * Creates error page components (404 and 403).
 * 
 * Configures error pages with navigation callbacks and branding.
 * 
 * @param deps - Page factory dependencies
 * @returns Object containing NotFoundPage and UnauthorizedPage components
 */
export function createErrorPagesFactory(deps: PageFactoryDeps): {
  NotFoundPage: React.ComponentType;
  UnauthorizedPage: React.ComponentType;
} {
  const { navigationService, branding } = deps;
  
  const NotFoundPage = createSimpleNotFoundPage({
    branding,
    onGoHome: () => navigationService.navigate('/dashboard'),
    onGoBack: () => window.history.back(),
  });

  const UnauthorizedPage = createSimpleUnauthorizedPage({
    branding,
    onGoHome: () => navigationService.navigate('/dashboard'),
    onReLogin: () => navigationService.navigate('/login'),
  });

  return { NotFoundPage, UnauthorizedPage };
}

/**
 * Creates all standard page components at once.
 * 
 * Convenience function that creates all page components with consistent
 * dependencies and configuration.
 * 
 * @param deps - Page factory dependencies
 * @returns Object containing all page components
 */
export function createAllPages(deps: PageFactoryDeps): {
  LoginPage: React.ComponentType;
  RegisterPage: React.ComponentType;
  DashboardPage: React.ComponentType;
  NotFoundPage: React.ComponentType;
  UnauthorizedPage: React.ComponentType;
} {
  const LoginPage = createLoginPageFactory(deps);
  const RegisterPage = createRegisterPageFactory(deps);
  const DashboardPage = createDashboardPageFactory(deps);
  const { NotFoundPage, UnauthorizedPage } = createErrorPagesFactory(deps);

  return {
    LoginPage,
    RegisterPage,
    DashboardPage,
    NotFoundPage,
    UnauthorizedPage,
  };
}
