/**
 * Settings Screen - Shell Settings Screen
 * 
 * @module @shinwa/shinwa-platform-shell-mobile/screens
 * @since 3.1.0
 */

import React, { useContext, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ShellContext } from '../providers/ShellProvider';

/**
 * Settings Item Props
 */
interface SettingsItemProps {
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

/**
 * Settings Item Component
 */
function SettingsItem({ label, value, toggle, toggleValue, onToggle, onPress }: SettingsItemProps): JSX.Element {
  if (toggle) {
    return (
      <View style={styles.settingsItem}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
          thumbColor={toggleValue ? '#1976d2' : '#f4f3f4'}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

/**
 * SettingsScreen Component
 * 
 * Settings screen for the shell. Provides configuration options
 * and application information.
 * 
 * Shell 的设置屏幕。提供配置选项和应用程序信息
 */
export function SettingsScreen(): JSX.Element {
  const shellContext = useContext(ShellContext);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            label="Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingsItem
            label="Dark Mode"
            toggle
            toggleValue={darkMode}
            onToggle={setDarkMode}
          />
          <SettingsItem
            label="Language"
            value="English"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingsItem label="Profile" />
          <SettingsItem label="Security" />
          <SettingsItem label="Privacy" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            label="App Name"
            value={shellContext?.config.appName}
          />
          <SettingsItem
            label="Version"
            value={shellContext?.config.version}
          />
          <SettingsItem label="Terms of Service" />
          <SettingsItem label="Privacy Policy" />
          <SettingsItem label="Open Source Licenses" />
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
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase'
  },
  sectionContent: {
    backgroundColor: '#ffffff'
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingsLabel: {
    fontSize: 16,
    color: '#333333'
  },
  settingsValue: {
    fontSize: 16,
    color: '#999999'
  }
});
