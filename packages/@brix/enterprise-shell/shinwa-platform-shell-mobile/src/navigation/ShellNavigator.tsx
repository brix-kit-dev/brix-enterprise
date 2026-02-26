/**
 * Shell Navigator - Main Navigation Container
 * 
 * This component provides the main navigation structure for the mobile shell.
 * It supports tab navigation, drawer navigation, and stack navigation.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/navigation
 * @since 3.1.0
 */

import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShellContext } from '../providers/ShellProvider';
import type { RouteConfig } from './types';

/**
 * Shell Navigator Props
 */
export interface ShellNavigatorProps {
  /** Custom route configurations */
  routes?: RouteConfig[];
  /** Initial route name */
  initialRouteName?: string;
  /** Theme override */
  theme?: 'light' | 'dark';
}

/**
 * ShellNavigator Component
 * 
 * Main navigation container that renders the appropriate navigation structure
 * based on configuration. Automatically handles plugin screen registration.
 * 
 * 主导航容器，根据配置渲染适当的导航结构
 * 自动处理插件屏幕注册
 * 
 * @example
 * ```tsx
 * import { ShellNavigator } from '@shinwa/shinwa-platform-shell-mobile';
 * 
 * function App() {
 *   return (
 *     <ShellProvider>
 *       <ShellNavigator
 *         initialRouteName="Home"
 *         routes={[
 *           { name: 'Home', component: HomeScreen },
 *           { name: 'Profile', component: ProfileScreen }
 *         ]}
 *       />
 *     </ShellProvider>
 *   );
 * }
 * ```
 */
export function ShellNavigator({
  routes: customRoutes,
  initialRouteName,
  theme
}: ShellNavigatorProps): JSX.Element {
  const shellContext = useContext(ShellContext);

  // Merge custom routes with plugin routes
  // 合并自定义路由与插件路由
  const routes = useMemo(() => {
    const pluginRoutes: RouteConfig[] = []; // Will be populated by plugin loader
    return [...(customRoutes ?? []), ...pluginRoutes];
  }, [customRoutes]);

  // Determine navigation type
  // 确定导航类型
  const navigationType = shellContext?.config.navigation?.type ?? 'tab';
  const initial = initialRouteName ?? shellContext?.config.navigation?.initialRoute ?? 'Home';

  // If shell is not initialized, show loading
  // 如果 Shell 未初始化，显示加载中
  if (!shellContext?.state.initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If there's an error, show error screen
  // 如果有错误，显示错误屏幕
  if (shellContext.state.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{shellContext.state.error}</Text>
      </View>
    );
  }

  // Render based on navigation type
  // 根据导航类型渲染
  // Note: Actual React Navigation implementation would be more complex
  // 注意：实际的 React Navigation 实现会更复杂
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{shellContext.config.appName}</Text>
      </View>
      <View style={styles.content}>
        {routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No routes configured</Text>
            <Text style={styles.emptySubtext}>Add routes via ShellNavigator props or load plugins</Text>
          </View>
        ) : (
          <Text style={styles.routeInfo}>
            {routes.length} routes registered. Initial: {initial}
          </Text>
        )}
      </View>
      {navigationType === 'tab' && (
        <View style={styles.tabBar}>
          <Text style={styles.tabBarText}>Tab Navigation</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    fontSize: 16,
    color: '#666666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 10
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center'
  },
  header: {
    height: 56,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999'
  },
  routeInfo: {
    fontSize: 14,
    color: '#666666'
  },
  tabBar: {
    height: 56,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabBarText: {
    fontSize: 12,
    color: '#666666'
  }
});
