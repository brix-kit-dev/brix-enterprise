/**
 * @file Products Module Constants
 * @description Permission codes, page IDs, and configuration
 * @module @shinwa/products-shared/constants
 * @version 3.0.0
 *
 * [Architecture Note - R7.6]
 * This file exports TYPES, permission strings, and configuration constants only.
 * Runtime UI constants (with labels, colors, icons) are in @shinwa/products-ui-web/src/utils/constants.ts
 */

// Re-export types from the types module
export type { ProductType, ProductStatus } from '../types';

// ============================================================================
// Permission Constants
// ============================================================================

/**
 * Products Module Permission Codes
 * 
 * Consistent with permissions in ui-manifest.yaml.
 */
export const PRODUCT_PERMISSIONS = {
  /** View product */
  READ: 'product:read',
  /** Create product */
  CREATE: 'product:create',
  /** Edit product */
  UPDATE: 'product:update',
  /** Delete product */
  DELETE: 'product:delete',
  /** Review product */
  REVIEW: 'product:review',
  /** Publish/unpublish product */
  PUBLISH: 'product:publish',
  /** Archive product */
  ARCHIVE: 'product:archive',
} as const;

/**
 * Permission code type
 */
export type ProductPermission = typeof PRODUCT_PERMISSIONS[keyof typeof PRODUCT_PERMISSIONS];

// ============================================================================
// Page ID Constants
// ============================================================================

/**
 * Products Module Page IDs
 * 
 * Consistent with pages declaration in ui-manifest.yaml.
 * Format: <plugin>:<pageName>
 */
export const PRODUCT_PAGE_IDS = {
  /** Product list */
  LIST: 'product:list',
  /** Product detail */
  DETAIL: 'product:detail',
  /** Create product */
  CREATE: 'product:create',
  /** Edit product */
  EDIT: 'product:edit',
} as const;

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default currency unit
 */
export const DEFAULT_CURRENCY = 'CNY';

/**
 * Default page size
 */
export const DEFAULT_PAGE_SIZE = 10;
