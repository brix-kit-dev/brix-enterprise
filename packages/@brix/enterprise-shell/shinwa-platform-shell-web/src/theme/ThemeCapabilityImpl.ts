/**
 * @file Theme Capability Implementation
 * @description Implements ThemeCapability interface
 * @module @shinwa/shinwa-platform-shell-web/theme/ThemeCapabilityImpl
 * @version 3.0.0
 * 
 * [Architecture Notes]
 * ThemeCapabilityImpl is the implementation of the ThemeCapability interface.
 * Provides theme retrieval, switching, and customization features.
 *
 * [Merge Notes]
 * This file was merged from @brix/platform-theme-web.
 * Theme capability is closely related to layout capability, unified under Shell layer management.
 *
 * [Architectural Constraints]
 * - Theme variables are implemented via CSS variables to ensure runtime switching
 * - Modules cannot directly modify global styles, only through ThemeCapability
 * - Theme switching notifies all modules via events
 * - Hardcoding colors in components is prohibited
import type { 
  ThemeCapability, 
  ThemeMode, 
  ThemeConfig,
  ThemeColors,
  ThemePreset,
  ThemeState,
  ThemeChangeEvent,
  Unsubscribe,
} from '@brix/runtime-sdk-api-web';
import { ThemeStore, type ThemeStoreConfig } from './ThemeStore';

/**
 * Theme capability configuration
 */
export interface ThemeCapabilityConfig extends ThemeStoreConfig {
  /**
   * Shared theme store (optional)
   */
  themeStore?: ThemeStore;
}

/**
 * Theme Capability Implementation
 * 
 * Implements ThemeCapability interface, provides theme management capabilities.
 * 
 * [Usage Example]
 * ```typescript
 * // Create when Host initializes
 * const themeCapability = new ThemeCapabilityImpl({
 *   defaultMode: 'system',
 *   presets: [defaultPreset],
 * });
 * 
 * // Plugin usage
 * const mode = themeCapability.getMode();
 * const primaryColor = themeCapability.getColor('primary');
 * ```
 */
export class ThemeCapabilityImpl implements ThemeCapability {
  /**
   * Theme store
   */
  private themeStore: ThemeStore;
  
  /**
   * Set of subscription cancellation functions
   */
  private subscriptions: Set<Unsubscribe> = new Set();
  
  /**
   * Whether this instance owns the theme store
   */
  private ownsThemeStore: boolean;
  
  /**
   * Constructor
   * 
   * @param config - Configuration object
   */
  constructor(config: ThemeCapabilityConfig = {}) {
    // Use shared theme store or create new one
    if (config.themeStore) {
      this.themeStore = config.themeStore;
      this.ownsThemeStore = false;
    } else {
      this.themeStore = new ThemeStore(config);
      this.ownsThemeStore = true;
    }
  }
  
  /**
   * Get current theme mode
   * 
   * @returns Current theme mode
   */
  getMode(): ThemeMode {
    return this.themeStore.getState().mode;
  }
  
  /**
   * Get resolved theme mode
   * 
   * @returns Resolved theme mode
   */
  getResolvedMode(): 'light' | 'dark' {
    return this.themeStore.getState().resolvedMode;
  }
  
  /**
   * Set theme mode
   * 
   * @param mode - Target mode
   */
  setMode(mode: ThemeMode): void {
    this.themeStore.setMode(mode);
  }
  
  /**
   * Toggle light/dark mode
   */
  toggleMode(): void {
    this.themeStore.toggleMode();
  }
  
  /**
   * Get current theme configuration
   * 
   * @returns Theme configuration
   */
  getConfig(): ThemeConfig {
    return { ...this.themeStore.getState().config };
  }
  
  /**
   * Get specified color value
   *
   * @param colorKey - Color key name
   * @returns Color value
   */
  getColor(colorKey: keyof ThemeColors): string {
    const config = this.themeStore.getState().config;
    return config.colors[colorKey] ?? '';
  }
  
  /**
   * Get CSS variable value
   * 
   * @param variableName - Variable name (without --)
   * @returns Variable value
   */
  getCssVariable(variableName: string): string {
    return this.themeStore.getCssVariable(variableName);
  }
  
  /**
   * Set custom CSS variable
   * 
   * @param variableName - Variable name (without --)
   * @param value - Variable value
   */
  setCssVariable(variableName: string, value: string): void {
    this.themeStore.setCssVariable(variableName, value);
  }
  
  /**
   * Batch set custom CSS variables
   * 
   * @param variables - Variable key-value pairs
   */
  setCssVariables(variables: Record<string, string>): void {
    this.themeStore.setCssVariables(variables);
  }
  
  /**
   * Apply theme preset
   *
   * @param presetId - Preset ID
   */
  applyPreset(presetId: string): void {
    this.themeStore.applyPreset(presetId);
  }
  
  /**
   * Get available theme preset list
   * 
   * @returns Theme preset array
   */
  getPresets(): ThemePreset[] {
    return this.themeStore.getPresets();
  }
  
  /**
   * Register custom theme preset
   * 
   * @param preset - Theme preset
   */
  registerPreset(preset: ThemePreset): void {
    this.themeStore.registerPreset(preset);
  }
  
  /**
   * Get current theme state
   * 
   * @returns Theme state
   */
  getState(): ThemeState {
    return this.themeStore.getState();
  }
  
  /**
   * Listen for theme changes
   * 
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  onThemeChange(listener: (event: ThemeChangeEvent) => void): Unsubscribe {
    const unsubscribe = this.themeStore.subscribe(listener);
    
    // Record subscription for cleanup
    this.subscriptions.add(unsubscribe);
    
    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }
  
  /**
   * Get theme store (for Host use)
   * 
   * @returns Theme store instance
   */
  getThemeStore(): ThemeStore {
    return this.themeStore;
  }
  
  /**
   * Destroy capability instance
   */
  destroy(): void {
    // Cancel all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    
    // Destroy theme store if we own it
    if (this.ownsThemeStore) {
      this.themeStore.destroy();
    }
  }
}


