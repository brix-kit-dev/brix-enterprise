/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * Product Module Type Definitions
 *
 * v3.0 Product Package Module - Web UI Types
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

/**
 * Product type enum
 */
export type ProductType =
  | 'CHECKUP'
  | 'TREATMENT'
  | 'TRANSLATION'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'COMPOSITE';

/**
 * Product status enum
 */
export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED';

/**
 * Product type configuration
 */
export const ProductTypeConfig: Record<ProductType, { label: string; color: string }> = {
  CHECKUP: { label: '体检套餐', color: '#4CAF50' },
  TREATMENT: { label: '治疗套餐', color: '#2196F3' },
  TRANSLATION: { label: '翻译套餐', color: '#9C27B0' },
  TRANSPORT: { label: '交通套餐', color: '#FF9800' },
  ACCOMMODATION: { label: '住宿套餐', color: '#795548' },
  COMPOSITE: { label: '综合套餐', color: '#607D8B' },
};

/**
 * Product status configuration
 */
export const ProductStatusConfig: Record<ProductStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: '#9E9E9E' },
  PENDING_REVIEW: { label: '待审核', color: '#FF9800' },
  ACTIVE: { label: '上架', color: '#4CAF50' },
  INACTIVE: { label: '下架', color: '#F44336' },
  ARCHIVED: { label: '归档', color: '#607D8B' },
};

/**
 * Product DTO
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  type: ProductType;
  status: ProductStatus;
  code?: string;
  price?: number;
  originalPrice?: number;
  priceRange?: string;
  currency: string;
  partnerId: number;
  partnerName?: string;
  categoryId?: number;
  categoryName?: string;
  serviceItems?: string[];
  duration?: string;
  remarks?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  sortOrder: number;
  salesCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  tenantId: string;
}

/**
 * Create product request
 */
export interface CreateProductRequest {
  name: string;
  description?: string;
  type: ProductType;
  code?: string;
  price?: number;
  originalPrice?: number;
  priceRange?: string;
  currency?: string;
  partnerId: number;
  categoryId?: number;
  serviceItems?: string[];
  duration?: string;
  remarks?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  sortOrder?: number;
}

/**
 * Update product request
 */
export interface UpdateProductRequest {
  name: string;
  description?: string;
  code?: string;
  price?: number;
  originalPrice?: number;
  priceRange?: string;
  currency?: string;
  categoryId?: number;
  serviceItems?: string[];
  duration?: string;
  remarks?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  sortOrder?: number;
}

/**
 * Product query parameters
 */
export interface ProductQueryParams {
  status?: ProductStatus;
  type?: ProductType;
  partnerId?: number;
  keyword?: string;
}
