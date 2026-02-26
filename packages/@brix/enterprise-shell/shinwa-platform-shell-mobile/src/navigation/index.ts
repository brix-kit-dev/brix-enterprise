/**
 * Navigation Module
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/navigation
 * @since 3.1.0
 */

export { ShellNavigator, type ShellNavigatorProps } from './ShellNavigator';
export { NavigationProvider, NavigationContext, type NavigationProviderProps, type NavigationContextValue } from './NavigationProvider';
export { useNavigation, useRoute, type UseRouteReturn } from './hooks';
export type { RouteConfig, NavigationOptions, NavigationState, DeepLinkConfig } from './types';
