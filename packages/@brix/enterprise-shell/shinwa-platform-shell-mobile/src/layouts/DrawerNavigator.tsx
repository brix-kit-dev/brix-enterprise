/**
 * Drawer Navigator - Side Drawer Navigation Layout
 * 
 * This component provides a side drawer navigation structure
 * for organizing screens with a slide-out menu.
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/layouts
 * @since 3.1.0
 */

import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';

/**
 * Drawer Item Configuration
 */
export interface DrawerItem {
  /** Item identifier */
  key: string;
  /** Item label */
  label: string;
  /** Item icon name */
  icon?: string;
  /** Whether item is disabled */
  disabled?: boolean;
}

/**
 * Drawer Navigator Ref
 */
export interface DrawerNavigatorRef {
  /** Open the drawer */
  openDrawer: () => void;
  /** Close the drawer */
  closeDrawer: () => void;
  /** Toggle drawer state */
  toggleDrawer: () => void;
}

/**
 * Drawer Navigator Props
 */
export interface DrawerNavigatorProps {
  /** Child components (main content) */
  children: ReactNode;
  /** Drawer items */
  items: DrawerItem[];
  /** Drawer width */
  drawerWidth?: number;
  /** Drawer position */
  position?: 'left' | 'right';
  /** Callback when item is selected */
  onItemSelect?: (key: string) => void;
  /** Header content for drawer */
  renderHeader?: () => ReactNode;
  /** Footer content for drawer */
  renderFooter?: () => ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

/**
 * DrawerNavigator Component
 * 
 * Renders a side drawer navigation with animated transitions.
 * 
 * 渲染带有动画过渡的侧边抽屉导航
 * 
 * @example
 * ```tsx
 * const drawerRef = useRef<DrawerNavigatorRef>(null);
 * 
 * <DrawerNavigator
 *   ref={drawerRef}
 *   items={[
 *     { key: 'home', label: 'Home' },
 *     { key: 'settings', label: 'Settings' }
 *   ]}
 *   onItemSelect={(key) => navigate(key)}
 * >
 *   <MainContent />
 * </DrawerNavigator>
 * 
 * // Open drawer programmatically
 * drawerRef.current?.openDrawer();
 * ```
 */
export const DrawerNavigator = forwardRef<DrawerNavigatorRef, DrawerNavigatorProps>(
  function DrawerNavigator(
    {
      children,
      items,
      drawerWidth = DEFAULT_DRAWER_WIDTH,
      position = 'left',
      onItemSelect,
      renderHeader,
      renderFooter
    },
    ref
  ): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const translateX = useRef(new Animated.Value(position === 'left' ? -drawerWidth : drawerWidth)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Open drawer animation
    // 打开抽屉动画
    const openDrawer = useCallback(() => {
      setIsOpen(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }, [translateX, overlayOpacity]);

    // Close drawer animation
    // 关闭抽屉动画
    const closeDrawer = useCallback(() => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: position === 'left' ? -drawerWidth : drawerWidth,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setIsOpen(false);
      });
    }, [translateX, overlayOpacity, position, drawerWidth]);

    // Toggle drawer
    // 切换抽屉
    const toggleDrawer = useCallback(() => {
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }, [isOpen, openDrawer, closeDrawer]);

    // Expose methods via ref
    // 通过 ref 暴露方法
    useImperativeHandle(ref, () => ({
      openDrawer,
      closeDrawer,
      toggleDrawer
    }), [openDrawer, closeDrawer, toggleDrawer]);

    // Handle item press
    // 处理项目点击
    const handleItemPress = useCallback((key: string) => {
      onItemSelect?.(key);
      closeDrawer();
    }, [onItemSelect, closeDrawer]);

    return (
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Overlay */}
        {isOpen && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDrawer}
          >
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayOpacity }
              ]}
            />
          </TouchableOpacity>
        )}

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              [position]: 0,
              transform: [{ translateX }]
            }
          ]}
        >
          {/* Drawer Header */}
          {renderHeader && (
            <View style={styles.drawerHeader}>
              {renderHeader()}
            </View>
          )}

          {/* Drawer Items */}
          <View style={styles.drawerContent}>
            {items.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.drawerItem,
                  item.disabled && styles.drawerItemDisabled
                ]}
                onPress={() => !item.disabled && handleItemPress(item.key)}
                disabled={item.disabled}
              >
                <Text
                  style={[
                    styles.drawerItemLabel,
                    item.disabled && styles.drawerItemLabelDisabled
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Drawer Footer */}
          {renderFooter && (
            <View style={styles.drawerFooter}>
              {renderFooter()}
            </View>
          )}
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000'
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  drawerContent: {
    flex: 1,
    paddingVertical: 8
  },
  drawerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  drawerItemDisabled: {
    opacity: 0.5
  },
  drawerItemLabel: {
    fontSize: 16,
    color: '#333333'
  },
  drawerItemLabelDisabled: {
    color: '#999999'
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  }
});
