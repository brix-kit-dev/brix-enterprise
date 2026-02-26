/**
 * @file Theme Module Entry
 * @description Theme module exports: types, utilities, and capability implementation
 * @module @shinwa/shinwa-platform-shell-web/theme
 * @version 3.0.0
 * 
 * [Module Description]
 * This module provides:
 * 1. ThemeCapability interface implementation (merged from platform-theme-web)
 * 2. Shinwa branding configuration
 * 3. Theme presets (defaultPreset, compactPreset)
 * 
 * [Note] OAuth/social login branding is in the oauth directory
 */

// ============================================================================
// Capability Implementation (merged from platform-theme-web)
// ============================================================================

export { ThemeCapabilityImpl, type ThemeCapabilityConfig } from './ThemeCapabilityImpl';
export { ThemeStore, type ThemeStoreConfig, type ThemeChangeListener } from './ThemeStore';

// ============================================================================
// Theme Presets
// ============================================================================

export { defaultPreset } from './presets/defaultPreset';
export { compactPreset } from './presets/compactPreset';

// ============================================================================
// Shinwa Branding Configuration (Product-specific)
// ============================================================================

// Type Exports
export type {
  ThemeConfig,
  FullThemeConfig,
  BrandingConfig,
} from './types';

// Default Value Exports
export {
  DEFAULT_THEME,
  DEFAULT_FULL_THEME,
  MUI_STYLE_THEME,
  DEFAULT_BRANDING,
} from './defaults';

// Utility Function Exports
export {
  mergeTheme,
  mergeBranding,
  createBrandingFromTheme,
} from './defaults';
