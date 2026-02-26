/**
 * Navigation Hooks - React Hooks for Navigation
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/navigation
 * @since 3.1.0
 */

import { useContext } from 'react';
import { NavigationContext, type NavigationContextValue } from './NavigationProvider';

/**
 * useNavigation Hook
 * 
 * Provides access to navigation functions within the shell.
 * 
 * 提供对 Shell 内导航函数的访问
 * 
 * @returns Navigation context value
 * @throws Error if used outside NavigationProvider
 * 
 * @example
 * ```tsx
 * const { navigate, goBack, canGoBack } = useNavigation();
 * 
 * const handlePress = () => {
 *   navigate('Details', { id: '123' });
 * };
 * ```
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
}

/**
 * Route Params Hook Return
 */
export interface UseRouteReturn<T = Record<string, unknown>> {
  /** Current route name */
  name: string;
  /** Route parameters */
  params: T;
}

/**
 * useRoute Hook
 * 
 * Provides access to current route information and parameters.
 * 
 * 提供对当前路由信息和参数的访问
 * 
 * @returns Current route information
 * @throws Error if used outside NavigationProvider
 * 
 * @example
 * ```tsx
 * const { name, params } = useRoute<{ id: string }>();
 * console.log(`Current route: ${name}, ID: ${params.id}`);
 * ```
 */
export function useRoute<T = Record<string, unknown>>(): UseRouteReturn<T> {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useRoute must be used within a NavigationProvider');
  }
  
  return {
    name: context.state.currentScreen,
    params: context.state.params as T
  };
}
