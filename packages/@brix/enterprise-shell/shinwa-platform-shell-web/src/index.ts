/**
 * @file platform-shell-web Module Entry
 * @description Web platform host package - Provides pre-assembled Shell pages and layout capabilities
 * @module @shinwa/shinwa-platform-shell-web
 * @version 3.0.0
 * 
 * [Module Description]
 * platform-shell-web is the Web platform host package, providing:
 * - Pre-assembled Dashboard page
 * - Pre-assembled Error pages (404, 403)
 * - Layout capabilities (LayoutCapability implementation)
 * - Layout components (ConsoleLayout, PortalLayout, MinimalLayout)
 * 
 * [Architecture Position]
 * ```text
 * +-------------------------------------------------------------------------+
 * | Capability Layer (platform-commons)                                     |
 * | +-- platform-auth-web      - Auth capability (LoginPage)                |
 * | +-- platform-shell-web     - Host + Layout capabilities                 |
 * |      +-- pages/            - Dashboard, Error Pages                     |
 * |      +-- layouts/          - ConsoleLayout, PortalLayout, Minimal       |
 * |      +-- components/       - LayoutContainer                            |
 * |      +-- hooks/            - useLayout, useResponsive                   |
 * +-------------------------------------------------------------------------+
 * | Host Layer (configuration only)                                         |
 * | +-- host-standalone-web    - Configuration + Route mounting             |
 * +-------------------------------------------------------------------------+
 * ```
 * 
 * [Design Principles]
 * 1. After deleting Host, new Host only needs configuration to restore all functionality
 * 2. Pages are pre-assembled by capability layer, Host only injects configuration
 * 3. Layout is fully controlled by Shell, plugins can only request layout changes
 * 4. Follows best practices of Auth0/Firebase/AWS Amplify
 * 
 * [Architectural Constraints]
 * - Plugins are prohibited from directly manipulating document.body
 * - Plugins are prohibited from creating global Portals on body
 * - Plugins are prohibited from modifying global CSS (e.g., overflow)
 * - Plugins can only request layout changes through LayoutCapability
 */

// ============================================================================
// Page factory functions
// ============================================================================

export {
  // Dashboard
  createDashboardPage,
  createSimpleDashboardPage,
  // Error Pages
  createNotFoundPage,
  createSimpleNotFoundPage,
  createUnauthorizedPage,
  createSimpleUnauthorizedPage,
  // Placeholder Page (v3.2.0)
  PlaceholderPage,
  createSimplePlaceholderPage,
} from './pages';

// ============================================================================
// Layout Capability Implementation (from platform-layout-web)
// ============================================================================

export { LayoutCapabilityImpl, type LayoutCapabilityConfig } from './LayoutCapabilityImpl';
export { LayoutStore } from './LayoutStore';
export { GovernancePolicyHandler } from './GovernancePolicy';

// ============================================================================
// Layout components
// ============================================================================

export { ConsoleLayout, type ConsoleLayoutProps } from './layouts/ConsoleLayout';
export { PortalLayout, type PortalLayoutProps } from './layouts/PortalLayout';
export { MinimalLayout, type MinimalLayoutProps } from './layouts/MinimalLayout';
export {
  ProtectedLayout,
  type ProtectedLayoutProps,
  type LayoutDimensions,
  type LayoutBranding,
  type LayoutUser,
} from './layouts/ProtectedLayout';

// ============================================================================
// Components
// ============================================================================

export { LayoutContainer, type LayoutContainerProps } from './components/LayoutContainer';

// Dynamic Plugin Routes (v3.2.0) - for manifest-driven route rendering
export {
  DynamicPluginRoutes,
  renderDynamicRoutes,
  convertToRouteObjects,
  type DynamicPluginRoutesProps,
  type DynamicRoutesOptions,
  type AggregatedRoute,
} from './components/DynamicPluginRoutes';

// ============================================================================
// Hooks
// ============================================================================

export { useLayout, type UseLayoutResult } from './hooks/useLayout';
export { useResponsive, type UseResponsiveResult } from './hooks/useResponsive';
export { useTheme, type UseThemeResult } from './hooks/useTheme';

// ============================================================================
// Type exports
// ============================================================================

export type {
  // Common types
  ShellBranding,
  NavigationService,
  ShellRoutes,
  // Dashboard Types
  StatCard,
  QuickAction,
  DashboardDataProvider,
  DashboardPageConfig,
  SimpleDashboardConfig,
  // Error Types
  ErrorPageConfig,
  SimpleErrorPageConfig,
  // Placeholder Types (v3.2.0)
  PlaceholderPageProps,
  SimplePlaceholderConfig,
} from './pages';

// Layout types
export type { 
  LayoutConfig, 
  LayoutGovernancePolicy, 
  LayoutChangeRequest,
  LayoutState,
  LayoutChangeEvent,
  LayoutRequestResult,
} from './layout-types';

// ============================================================================
// Theme Capability Implementation (merged from platform-theme-web)
// ============================================================================

export { ThemeCapabilityImpl, type ThemeCapabilityConfig } from './theme/ThemeCapabilityImpl';
export { ThemeStore, type ThemeStoreConfig, type ThemeChangeListener } from './theme/ThemeStore';

// Theme presets
export { defaultPreset } from './theme/presets/defaultPreset';
export { compactPreset } from './theme/presets/compactPreset';

// ============================================================================
// Theme configuration (UI style related)
// ============================================================================

export {
  // Types
  type ThemeConfig,
  type FullThemeConfig,
  type BrandingConfig,
  // Default values
  DEFAULT_THEME,
  DEFAULT_FULL_THEME,
  MUI_STYLE_THEME,
  DEFAULT_BRANDING,
  // Utility functions
  mergeTheme,
  mergeBranding,
  createBrandingFromTheme,
} from './theme';

// ============================================================================
// OAuth Social Login Configuration (separate module, decoupled from theme)
// ============================================================================

export {
  // Types
  type OAuthCredentials,
  type SocialProvider,
  type RegionalSocialProviders,
  // Default values
  CHINA_SOCIAL_PROVIDERS,
  INTERNATIONAL_SOCIAL_PROVIDERS,
  REGIONAL_SOCIAL_PROVIDERS,
  // Utility functions
  getSocialProviders,
  getEnabledSocialProviders,
  configureSocialOAuth,
} from './oauth';
