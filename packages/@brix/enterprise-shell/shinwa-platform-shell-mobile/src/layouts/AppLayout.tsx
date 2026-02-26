/**
 * App Layout - Main Application Layout Component
 * 
 * This component provides the structural layout for the mobile application,
 * including safe area handling, status bar configuration, and content area.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/layouts
 * @since 3.1.0
 */

import React from 'react';
import type { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';

/**
 * App Layout Props
 */
export interface AppLayoutProps {
  /** Child components */
  children: ReactNode;
  /** Background color */
  backgroundColor?: string;
  /** Status bar style */
  statusBarStyle?: 'light-content' | 'dark-content' | 'default';
  /** Whether to show status bar */
  showStatusBar?: boolean;
  /** Safe area edges to apply */
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * AppLayout Component
 * 
 * Root layout component that handles safe areas, status bar,
 * and overall application structure.
 * 
 * 根布局组件，处理安全区域、状态栏和整体应用程序结构
 * 
 * @example
 * ```tsx
 * <AppLayout 
 *   backgroundColor="#ffffff"
 *   statusBarStyle="dark-content"
 *   safeAreaEdges={['top', 'bottom']}
 * >
 *   <Content />
 * </AppLayout>
 * ```
 */
export function AppLayout({
  children,
  backgroundColor = '#ffffff',
  statusBarStyle = 'dark-content',
  showStatusBar = true,
  safeAreaEdges = ['top', 'bottom']
}: AppLayoutProps): JSX.Element {
  // Calculate safe area padding
  // 计算安全区域内边距
  const safeAreaStyle = {
    paddingTop: safeAreaEdges.includes('top') ? (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 24) : 0,
    paddingBottom: safeAreaEdges.includes('bottom') ? (Platform.OS === 'ios' ? 34 : 0) : 0,
    paddingLeft: safeAreaEdges.includes('left') ? 16 : 0,
    paddingRight: safeAreaEdges.includes('right') ? 16 : 0
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {showStatusBar && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={backgroundColor}
          translucent={Platform.OS === 'android'}
        />
      )}
      <View style={[styles.content, safeAreaStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  }
});
