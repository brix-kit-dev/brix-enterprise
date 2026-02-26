/**
 * @file Menu Icon Mapping
 * @description Provides mapping from menu icon names to Emoji
 * @module @shinwa/shinwa-platform-shell-web/layouts/components/menuIcons
 * @version 3.2.0
 *
 * [Design Notes]
 * This module provides simple icon mapping to convert icon names from Manifest to displayable Emoji.
 * In production environments, consider replacing with Ant Design Icons or other icon libraries.
 *
 * [Extension Methods]
 * 1. Replace with Ant Design Icons: import { DashboardOutlined } from '@ant-design/icons'
 * 2. Replace with SVG icon components
 * 3. Replace with Icon Font
 */

// ============================================================================
// Icon Mapping Table
// ============================================================================

/**
 * Icon name to Emoji mapping
 * 
 * [Notes]
 * This is a simplified implementation. Production environments should integrate professional icon libraries.
 */
const ICON_MAP: Record<string, string> = {
  // General function icons
  dashboard: '📊',
  home: '🏠',
  settings: '⚙️',
  config: '🔧',
  
  // User related
  user: '👤',
  users: '👥',
  identity: '🔐',
  profile: '📋',
  
  // Business functions
  product: '📦',
  products: '📦',
  partner: '🤝',
  partners: '🤝',
  message: '💬',
  messenger: '💬',
  booking: '📅',
  calendar: '📅',
  
  // Files and content
  file: '📄',
  files: '📂',
  document: '📝',
  carousel: '🖼️',
  
  // Contracts and transactions
  contract: '📑',
  contracts: '📑',
  
  // Default
  default: '📋',
};

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Get menu icon
 * 
 * @param iconName - Icon name (from Manifest)
 * @returns Corresponding Emoji string
 * 
 * [Usage Example]
 * ```tsx
 * const icon = getMenuIcon('dashboard');  // Returns '📊'
 * const icon = getMenuIcon('unknown');    // Returns '📋' (default)
 * ```
 */
export function getMenuIcon(iconName: string): string {
  // Convert to lowercase for matching
  const normalizedName = iconName.toLowerCase();
  return ICON_MAP[normalizedName] || ICON_MAP.default;
}

/**
 * Check if icon exists
 * 
 * @param iconName - Icon name
 * @returns Whether the icon mapping exists
 */
export function hasIcon(iconName: string): boolean {
  const normalizedName = iconName.toLowerCase();
  return normalizedName in ICON_MAP;
}

/**
 * Get all available icon names
 * 
 * @returns Array of icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP).filter(key => key !== 'default');
}

export default getMenuIcon;
