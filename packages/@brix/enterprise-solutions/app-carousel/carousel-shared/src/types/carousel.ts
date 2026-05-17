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
 * @file Carousel module shared type definitions
 * @description Core type definitions for carousel business, shared by Web and Mobile
 * @module @brix-sdk/enterprise-carousel-shared/types
 * @version 3.0.0
 * 
 * Design Notes:
 * This file defines the core business types for the carousel module, following these principles:
 * 1. Consistent with backend DTOs
 * 2. Contains no platform-specific types
 * 3. Uses interfaces instead of classes for easy serialization
 * 
 * Type Categories:
 * - Carousel related: CarouselDTO, CarouselSettings
 * - Banner related: BannerDTO, BannerStatus, BannerActionType
 * - Platform related: Platform
 */

// ============================================================================
// Platform Enum
// ============================================================================

/**
 * Platform Type
 * 
 * Defines the platform scope for Banner applicability.
 */
export type Platform = 
  | 'ALL'          // All platforms
  | 'WEB'          // Web
  | 'H5'           // H5 mobile
  | 'IOS'          // iOS native
  | 'ANDROID'      // Android native
  | 'MINI_PROGRAM'; // Mini program

// ============================================================================
// Banner Status Enum
// ============================================================================

/**
 * Banner Action Type
 * 
 * Defines the behavior when user clicks a Banner.
 */
export type BannerActionType = 
  | 'NONE'         // No action
  | 'LINK'         // External link
  | 'ROUTE'        // Internal route
  | 'POPUP'        // Popup
  | 'DEEP_LINK';   // Deep link (App)

/**
 * Banner Status
 * 
 * Consistent with backend BannerStatus enum.
 */
export type BannerStatus = 
  | 'DRAFT'        // Draft
  | 'ENABLED'      // Enabled
  | 'DISABLED'     // Disabled
  | 'EXPIRED';     // Expired

// ============================================================================
// Carousel Settings
// ============================================================================

/**
 * Carousel Settings
 * 
 * Defines the display and interaction configuration for carousel.
 */
export interface CarouselSettings {
  /** Carousel width (pixels) */
  width?: number;
  /** Carousel height (pixels) */
  height?: number;
  /** Auto play enabled */
  autoPlay: boolean;
  /** Auto play interval (milliseconds) */
  autoPlayInterval: number;
  /** Show indicator */
  showIndicator: boolean;
  /** Show arrow */
  showArrow: boolean;
  /** Maximum banner count */
  maxBannerCount: number;
}

// ============================================================================
// Carousel Type
// ============================================================================

/**
 * Carousel Data Transfer Object
 * 
 * Consistent with backend CarouselDTO.
 */
export interface CarouselDTO {
  /** Carousel ID */
  id?: number;
  /** Carousel code (unique identifier) */
  code: string;
  /** Carousel name */
  name: string;
  /** Description */
  description?: string;
  /** Carousel settings */
  settings?: CarouselSettings;
  /** Associated banner list */
  banners?: BannerDTO[];
  /** Enabled */
  enabled: boolean;
  /** Created at (ISO 8601 format) */
  createdAt?: string;
  /** Updated at (ISO 8601 format) */
  updatedAt?: string;
}

/**
 * Create Carousel Parameters
 */
export interface CreateCarouselParams {
  /** Carousel code */
  code: string;
  /** Carousel name */
  name: string;
  /** Description */
  description?: string;
  /** Carousel settings */
  settings?: Partial<CarouselSettings>;
}

/**
 * Update Carousel Parameters
 */
export interface UpdateCarouselParams {
  /** Carousel name */
  name?: string;
  /** Description */
  description?: string;
  /** Carousel settings */
  settings?: Partial<CarouselSettings>;
  /** Enabled */
  enabled?: boolean;
}

// ============================================================================
// Banner Type
// ============================================================================

/**
 * Banner Data Transfer Object
 * 
 * Consistent with backend BannerDTO.
 */
export interface BannerDTO {
  /** Banner ID */
  id?: number;
  /** Parent carousel ID */
  carouselId?: number;
  /** Title */
  title: string;
  /** Subtitle */
  subtitle?: string;
  /** Description */
  description?: string;
  /** Image URL (Web) */
  imageUrl?: string;
  /** Image URL (Mobile) */
  imageUrlMobile?: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** Target platform */
  platform: Platform;
  /** Status */
  status: BannerStatus;
  /** Action type */
  actionType: BannerActionType;
  /** Action value (URL or route) */
  actionValue?: string;
  /** App action value (Deep Link) */
  actionValueApp?: string;
  /** Sort order */
  sortOrder: number;
  /** Effective start time (ISO 8601 format) */
  startTime?: string;
  /** Effective end time (ISO 8601 format) */
  endTime?: string;
  /** Click count */
  clickCount?: number;
  /** View count */
  viewCount?: number;
  /** Created at (ISO 8601 format) */
  createdAt?: string;
  /** Updated at (ISO 8601 format) */
  updatedAt?: string;
}

/**
 * Create Banner Parameters
 */
export interface CreateBannerParams {
  /** Title */
  title: string;
  /** Subtitle */
  subtitle?: string;
  /** Description */
  description?: string;
  /** Image URL (Web) */
  imageUrl?: string;
  /** Image URL (Mobile) */
  imageUrlMobile?: string;
  /** Target platform */
  platform: Platform;
  /** Action type */
  actionType: BannerActionType;
  /** Action value */
  actionValue?: string;
  /** App action value */
  actionValueApp?: string;
  /** Sort order */
  sortOrder?: number;
  /** Effective start time */
  startTime?: string;
  /** Effective end time */
  endTime?: string;
}

/**
 * Update Banner Parameters
 */
export interface UpdateBannerParams {
  /** Title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Description */
  description?: string;
  /** Image URL (Web) */
  imageUrl?: string;
  /** Image URL (Mobile) */
  imageUrlMobile?: string;
  /** Target platform */
  platform?: Platform;
  /** Action type */
  actionType?: BannerActionType;
  /** Action value */
  actionValue?: string;
  /** App action value */
  actionValueApp?: string;
  /** Sort order */
  sortOrder?: number;
  /** Effective start time */
  startTime?: string;
  /** Effective end time */
  endTime?: string;
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
  /** Current page number (0-based) */
  page: number;
  /** Page size */
  size: number;
  /** Total elements */
  totalElements: number;
  /** Total pages */
  totalPages: number;
  /** Is first page */
  first: boolean;
  /** Is last page */
  last: boolean;
}
