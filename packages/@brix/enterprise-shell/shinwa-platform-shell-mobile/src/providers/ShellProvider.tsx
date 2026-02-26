/**
 * Shell Provider - Root Context Provider for Mobile Shell
 * 
 * This component wraps the entire application and provides all necessary
 * context providers for capabilities, navigation, and state management.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/providers
 * @since 3.1.0
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ShellConfig, ShellState } from '../types';

/**
 * Shell Context Value
 * 
 * Shell 上下文值
 */
export interface ShellContextValue {
  /** Current shell state */
  state: ShellState;
  /** Shell configuration */
  config: ShellConfig;
  /** Update shell state */
  setState: (state: Partial<ShellState>) => void;
  /** Check if shell is ready */
  isReady: boolean;
}

/**
 * Default shell state
 */
const DEFAULT_STATE: ShellState = {
  initialized: false,
  pluginsLoaded: false,
  currentRoute: null,
  error: null
};

/**
 * Default shell config
 */
const DEFAULT_CONFIG: ShellConfig = {
  appName: 'Shinwa Platform',
  version: '3.1.0',
  theme: 'light',
  plugins: [],
  navigation: {
    type: 'tab',
    initialRoute: 'Home'
  }
};

/**
 * Shell Context
 */
export const ShellContext = React.createContext<ShellContextValue | null>(null);

/**
 * Shell Provider Props
 */
export interface ShellProviderProps {
  /** Child components */
  children: ReactNode;
  /** Shell configuration */
  config?: Partial<ShellConfig>;
  /** Callback when shell is ready */
  onReady?: () => void;
  /** Callback when shell encounters an error */
  onError?: (error: Error) => void;
}

/**
 * ShellProvider Component
 * 
 * Root provider component that initializes and manages the mobile shell.
 * Wraps children with all necessary context providers.
 * 
 * 根提供者组件，初始化和管理移动端壳
 * 使用所有必要的上下文提供者包装子组件
 * 
 * @example
 * ```tsx
 * import { ShellProvider } from '@shinwa/shinwa-platform-shell-mobile';
 * 
 * function App() {
 *   return (
 *     <ShellProvider
 *       config={{
 *         appName: 'My App',
 *         plugins: [BookingPlugin, IdentityPlugin]
 *       }}
 *       onReady={() => console.log('Shell ready!')}
 *     >
 *       <ShellNavigator />
 *     </ShellProvider>
 *   );
 * }
 * ```
 */
export function ShellProvider({
  children,
  config: userConfig,
  onReady,
  onError
}: ShellProviderProps): JSX.Element {
  // Merge user config with defaults
  // 合并用户配置与默认配置
  const config = useMemo<ShellConfig>(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Shell state management
  // Shell 状态管理
  const [state, setStateInternal] = useState<ShellState>(DEFAULT_STATE);

  // State updater function
  // 状态更新函数
  const setState = useCallback((partial: Partial<ShellState>) => {
    setStateInternal(prev => ({ ...prev, ...partial }));
  }, []);

  // Initialize shell
  // 初始化 Shell
  useEffect(() => {
    const initializeShell = async () => {
      try {
        // Mark as initialized
        // 标记为已初始化
        setState({ initialized: true });

        // Notify ready callback
        // 通知就绪回调
        onReady?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Shell initialization failed');
        setState({ error: err.message });
        onError?.(err);
      }
    };

    initializeShell();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value
  // 上下文值
  const contextValue = useMemo<ShellContextValue>(
    () => ({
      state,
      config,
      setState,
      isReady: state.initialized && state.pluginsLoaded
    }),
    [state, config, setState]
  );

  return (
    <ShellContext.Provider value={contextValue}>
      {children}
    </ShellContext.Provider>
  );
}
