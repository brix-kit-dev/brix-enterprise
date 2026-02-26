/**
 * useShell Hook - Access Shell Context
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/hooks
 * @since 3.1.0
 */

import { useContext } from 'react';
import { ShellContext, type ShellContextValue } from '../providers/ShellProvider';

/**
 * useShell Hook
 * 
 * Provides access to the shell context, including state,
 * configuration, and control functions.
 * 
 * 提供对 Shell 上下文的访问，包括状态、配置和控制函数
 * 
 * @returns Shell context value
 * @throws Error if used outside ShellProvider
 * 
 * @example
 * ```tsx
 * const { state, config, setState, isReady } = useShell();
 * 
 * if (!isReady) {
 *   return <LoadingScreen />;
 * }
 * 
 * return <Text>Welcome to {config.appName}</Text>;
 * ```
 */
export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider');
  }
  
  return context;
}
