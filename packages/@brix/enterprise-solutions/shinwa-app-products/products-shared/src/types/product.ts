/**
 * @file Products Module Shared Type Definitions
 * @description Core type definitions for product package business, shared by Web and Mobile
 * @module @shinwa/products-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines core business types for the product package module, following these principles:
 * 1. Keep consistent with backend DTOs
 * 2. Do not include any platform-specific types
 * 3. Use interfaces instead of classes for easy serialization
 */

// ============================================================================
// Product Type Enums
// ============================================================================

/**
 * Product Type
 * 
 * Consistent with backend ProductType enum.
 */
export type ProductType = 
  | 'CHECKUP'       // Checkup package
  | 'TREATMENT'     // Treatment package
  | 'TRANSLATION'   // Translation package
  | 'TRANSPORT'     // Transport package
  | 'ACCOMMODATION' // Accommodation package
  | 'COMPOSITE';    // Composite package

/**
 * Product Status
 * 
 * Consistent with backend ProductStatus enum.
 */
export type ProductStatus = 
  | 'DRAFT'          // Draft
  | 'PENDING_REVIEW' // Pending review
  | 'ACTIVE'         // Published
  | 'INACTIVE'       // Unpublished
  | 'ARCHIVED';      // Archived

// ============================================================================
// Product Type Definitions
// ============================================================================

/**
 * Product Data Transfer Object
 * 
 * Consistent with backend ProductDTO.
 */
export interface Product {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Product description */
  description?: string;
  /** Product type */
  type: ProductType;
  /** Product status */
  status: ProductStatus;
  /** Product code */
  code?: string;
  /** Price */
  price?: number;
  /** Original price */
  originalPrice?: number;
  /** Price range description */
  priceRange?: string;
  /** Currency unit */
  currency: string;
  /** Partner ID */
  partnerId: number;
  /** Partner name */
  partnerName?: string;
  /** Category ID */
  categoryId?: number;
  /** Category name */
  categoryName?: string;
  /** Service item list */
  serviceItems?: string[];
  /** Service duration description */
  duration?: string;
  /** Remarks */
  remarks?: string;
  /** Cover image */
  coverImage?: string;
  /** Image list */
  images?: string[];
  /** Tag list */
  tags?: string[];
  /** Sort weight */
  sortOrder: number;
  /** Sales count */
  salesCount: number;
  /** View count */
  viewCount: number;
  /** Creation time (ISO 8601 format) */
  createdAt: string;
  /** Update time (ISO 8601 format) */
  updatedAt?: string;
  /** Created by */
  createdBy?: string;
  /** Tenant ID */
  tenantId: string;
}

/**
 * Create Product Parameters
 */
export interface CreateProductParams {
  /** Product name */
  name: string;
  /** Product description */
  description?: string;
  /** Product type */
  type: ProductType;
  /** Product code */
  code?: string;
  /** Price */
  price?: number;
  /** Original price */
  originalPrice?: number;
  /** Price range description */
  priceRange?: string;
  /** Currency unit */
  currency?: string;
  /** Partner ID */
  partnerId: number;
  /** Category ID */
  categoryId?: number;
  /** Service item list */
  serviceItems?: string[];
  /** Service duration description */
  duration?: string;
  /** Remarks */
  remarks?: string;
  /** Cover image */
  coverImage?: string;
  /** Image list */
  images?: string[];
  /** Tag list */
  tags?: string[];
  /** Sort weight */
  sortOrder?: number;
}

/**
 * Update Product Parameters
 */
export interface UpdateProductParams {
  /** Product name */
  name?: string;
  /** Product description */
  description?: string;
  /** Product code */
  code?: string;
  /** Price */
  price?: number;
  /** Original price */
  originalPrice?: number;
  /** Price range description */
  priceRange?: string;
  /** Currency unit */
  currency?: string;
  /** Category ID */
  categoryId?: number;
  /** Service item list */
  serviceItems?: string[];
  /** Service duration description */
  duration?: string;
  /** Remarks */
  remarks?: string;
  /** Cover image */
  coverImage?: string;
  /** Image list */
  images?: string[];
  /** Tag list */
  tags?: string[];
  /** Sort weight */
  sortOrder?: number;
}

/**
 * Product Query Parameters
 */
export interface ProductQueryParams {
  /** Status filter */
  status?: ProductStatus;
  /** Type filter */
  type?: ProductType;
  /** Partner ID filter */
  partnerId?: number;
  /** Keyword search */
  keyword?: string;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
}

// ============================================================================
// Paged Response
// ============================================================================

/**
 * Paged Response
 * 
 * Consistent with backend Page<T>.
 */
export interface PagedResponse<T> {
  /** Data list */
  content: T[];
  /** Current page number (starting from 0) */
  page: number;
  /** Page size */
  size: number;
  /** Total element count */
  totalElements: number;
  /** Total page count */
  totalPages: number;
  /** Is first page */
  first: boolean;
  /** Is last page */
  last: boolean;
}
