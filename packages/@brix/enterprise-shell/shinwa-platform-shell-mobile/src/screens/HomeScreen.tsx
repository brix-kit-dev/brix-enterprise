/**
 * Home Screen - Default Shell Home Screen
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/screens
 * @since 3.1.0
 */

import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ShellContext } from '../providers/ShellProvider';

/**
 * HomeScreen Component
 * 
 * Default home screen for the shell. Displays loaded plugins and
 * provides quick access to main features.
 * 
 * Shell 的默认主屏幕。显示已加载的插件并提供对主要功能的快速访问
 */
export function HomeScreen(): JSX.Element {
  const shellContext = useContext(ShellContext);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to {shellContext?.config.appName}</Text>
        <Text style={styles.subtitle}>Version {shellContext?.config.version}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Bookings</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Identity</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Messages</Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionIcon}>🏪</Text>
            <Text style={styles.actionLabel}>Products</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Shell Initialized</Text>
          <Text style={styles.statusValue}>
            {shellContext?.state.initialized ? '✅' : '⏳'}
          </Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Plugins Loaded</Text>
          <Text style={styles.statusValue}>
            {shellContext?.state.pluginsLoaded ? '✅' : '⏳'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 24,
    backgroundColor: '#1976d2',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8
  },
  actionCard: {
    width: '50%',
    padding: 8
  },
  actionIcon: {
    fontSize: 32,
    textAlign: 'center'
  },
  actionLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
    marginTop: 4
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  statusLabel: {
    fontSize: 14,
    color: '#333333'
  },
  statusValue: {
    fontSize: 16
  }
});
