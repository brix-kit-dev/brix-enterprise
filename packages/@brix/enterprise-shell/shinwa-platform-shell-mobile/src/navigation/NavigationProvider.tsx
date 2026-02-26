/**
 * Navigation Provider - Navigation Context for Mobile Shell
 * 
 * This component provides navigation context and utilities
 * for plugin screens within the shell.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/navigation
 * @since 3.1.0
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { NavigationState, RouteConfig, NavigationOptions } from './types';

/**
 * Navigation Context Value
 * 
 * 导航上下文值
 */
export interface NavigationContextValue {
  /** Current navigation state */
  state: NavigationState;
  /** Navigate to a screen */
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  /** Go back to previous screen */
  goBack: () => void;
  /** Reset navigation state */
  reset: (routes: RouteConfig[]) => void;
  /** Push a new screen onto the stack */
  push: (screen: string, params?: Record<string, unknown>) => void;
  /** Pop the current screen from the stack */
  pop: () => void;
  /** Check if can go back */
  canGoBack: () => boolean;
}

/**
 * Navigation Context
 */
export const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Navigation Provider Props
 */
export interface NavigationProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial routes */
  initialRoutes?: RouteConfig[];
  /** Initial route name */
  initialRouteName?: string;
}

/**
 * NavigationProvider Component
 * 
 * Provides navigation context to child components. This is typically
 * used internally by ShellProvider but can be used standalone.
 * 
 * 为子组件提供导航上下文。通常由 ShellProvider 内部使用，但也可以单独使用
 * 
 * @example
 * ```tsx
 * <NavigationProvider initialRouteName="Home">
 *   <App />
 * </NavigationProvider>
 * ```
 */
export function NavigationProvider({
  children,
  initialRoutes = [],
  initialRouteName = 'Home'
}: NavigationProviderProps): JSX.Element {
  // Navigation state
  // 导航状态
  const [state, setState] = useState<NavigationState>({
    currentScreen: initialRouteName,
    params: {},
    history: [initialRouteName],
    routes: initialRoutes
  });

  // Navigation actions
  // 导航操作
  const navigate = useCallback((screen: string, params?: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      currentScreen: screen,
      params: params ?? {},
      history: [...prev.history, screen]
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length <= 1) return prev;
      const newHistory = prev.history.slice(0, -1);
      return {
        ...prev,
        currentScreen: newHistory[newHistory.length - 1],
        params: {},
        history: newHistory
      };
    });
  }, []);

  const reset = useCallback((routes: RouteConfig[]) => {
    setState(prev => ({
      ...prev,
      routes,
      currentScreen: routes[0]?.name ?? 'Home',
      params: {},
      history: [routes[0]?.name ?? 'Home']
    }));
  }, []);

  const push = useCallback((screen: string, params?: Record<string, unknown>) => {
    navigate(screen, params);
  }, [navigate]);

  const pop = useCallback(() => {
    goBack();
  }, [goBack]);

  const canGoBack = useCallback(() => {
    return state.history.length > 1;
  }, [state.history]);

  // Context value
  // 上下文值
  const contextValue = useMemo<NavigationContextValue>(
    () => ({
      state,
      navigate,
      goBack,
      reset,
      push,
      pop,
      canGoBack
    }),
    [state, navigate, goBack, reset, push, pop, canGoBack]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}
