/**
 * @file Default Theme Preset
 * @description Provides default light/dark theme preset
 * @module @shinwa/shinwa-platform-shell-web/theme/presets/defaultPreset
 * @version 3.1.0
 * 
 * [Merge Notes]
 * This file was merged from @brix/platform-theme-web.
 * 
 * [Design Notes]
 * Implements v3.0 architecture blueprint task 4.6-2.
 * Semantic colors are imported from @brix/design-tokens to ensure cross-component consistency.
 */

import type { ThemePreset } from '@brix/runtime-sdk-api-web';
import { semanticColors, neutralColors, fontFamily } from '@brix/design-tokens';

/**
 * Default theme preset
 * 
 * Based on Ant Design 5.0 design language; semantic colors from @brix/design-tokens.
 */
export const defaultPreset: ThemePreset = {
  id: 'default',
  name: 'Default Theme',
  description: 'Default theme based on Ant Design 5.0 design language',
  
  light: {
    name: 'Default Light',
    mode: 'light',
    colors: {
      primary: '#1677ff',
      secondary: '#722ed1',
      success: semanticColors.success,
      warning: semanticColors.warning,
      error: semanticColors.error,
      info: semanticColors.info,
      background: neutralColors.gray100,
      surface: neutralColors.white,
      text: 'rgba(0, 0, 0, 0.88)',
      textSecondary: 'rgba(0, 0, 0, 0.45)',
      border: neutralColors.gray300,
      divider: 'rgba(5, 5, 5, 0.06)',
    },
    borderRadius: {
      small: '4px',
      medium: '6px',
      large: '8px',
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      medium: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      large: '0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03)',
    },
    typography: {
      fontFamily: fontFamily.sans,
      fontSize: {
        small: '12px',
        medium: '14px',
        large: '16px',
      },
    },
  },
  
  dark: {
    name: 'Default Dark',
    mode: 'dark',
    colors: {
      primary: '#1668dc',
      secondary: '#9254de',
      success: semanticColors.successDark,
      warning: semanticColors.warningDark,
      error: semanticColors.errorDark,
      info: semanticColors.infoDark,
      background: neutralColors.black,
      surface: neutralColors.gray900,
      text: 'rgba(255, 255, 255, 0.85)',
      textSecondary: 'rgba(255, 255, 255, 0.45)',
      border: neutralColors.gray600,
      divider: 'rgba(253, 253, 253, 0.12)',
    },
    borderRadius: {
      small: '4px',
      medium: '6px',
      large: '8px',
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.45), 0 1px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px 0 rgba(0, 0, 0, 0.35)',
      medium: '0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
      large: '0 6px 16px -8px rgba(0, 0, 0, 0.32), 0 9px 28px 0 rgba(0, 0, 0, 0.2), 0 12px 48px 16px rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: fontFamily.sans,
      fontSize: {
        small: '12px',
        medium: '14px',
        large: '16px',
      },
    },
  },
};
