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
 * @file File Storage Module Constants Definition
 * @description Shared constants for file storage module
 * @module @brix-sdk/enterprise-storage-shared
 * @version 3.0.4
 *
 * Design Notes:
 * This file defines constants shared between frontend and backend.
 * Includes API endpoints, status values, and validation constraints.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// File Status Constants
// ============================================================================

/**
 * File status values for type-safe comparisons
 */
export const FILE_STATUS = {
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;

/**
 * File category values
 */
export const FILE_CATEGORY = {
  DOCUMENT: 'DOCUMENT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  MEDICAL: 'MEDICAL',
  CONTRACT: 'CONTRACT',
  IDENTITY: 'IDENTITY',
  CERTIFICATE: 'CERTIFICATE',
  OTHER: 'OTHER',
} as const;

// ============================================================================
// File Size Limits
// ============================================================================

/**
 * Maximum file sizes by category (in bytes)
 */
export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024,        // 5MB
  DOCUMENT: 20 * 1024 * 1024,   // 20MB
  VIDEO: 100 * 1024 * 1024,     // 100MB
  MEDICAL: 50 * 1024 * 1024,    // 50MB
  DEFAULT: 20 * 1024 * 1024,    // 20MB
} as const;

/**
 * Allowed MIME types by category
 */
export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  MEDICAL: ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'],
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Base API path for file storage module
 * Note: '/api' prefix is provided by HttpCapability baseURL (VITE_API_BASE)
 */
export const STORAGE_API_BASE = '/v1/files';

/**
 * File Storage API Endpoints
 *
 * URL pattern functions that generate endpoint URLs.
 * Used by Repository layer to construct API requests.
 */
export const STORAGE_API = {
  // ========== File Operations ==========

  /** List files with pagination and filters */
  LIST: STORAGE_API_BASE,

  /** Get file by ID */
  DETAIL: (id: string) => `${STORAGE_API_BASE}/${id}`,

  /** Upload file (multipart/form-data) */
  UPLOAD: STORAGE_API_BASE,

  /** Batch upload multiple files */
  UPLOAD_BATCH: `${STORAGE_API_BASE}/batch`,

  /** Update file metadata */
  UPDATE: (id: string) => `${STORAGE_API_BASE}/${id}`,

  /** Delete file */
  DELETE: (id: string) => `${STORAGE_API_BASE}/${id}`,

  /** Get download URL (pre-signed) */
  DOWNLOAD_URL: (id: string) => `${STORAGE_API_BASE}/${id}/download`,

  /** Get preview URL */
  PREVIEW_URL: (id: string) => `${STORAGE_API_BASE}/${id}/preview`,

  /** Get thumbnail URL */
  THUMBNAIL_URL: (id: string) => `${STORAGE_API_BASE}/${id}/thumbnail`,

  // ========== Access Log Operations ==========

  /** Get file access logs */
  ACCESS_LOGS: (fileId: string) => `${STORAGE_API_BASE}/${fileId}/access-logs`,

  /** Get all access logs (admin) */
  ACCESS_LOGS_ALL: `${STORAGE_API_BASE}/access-logs`,

  // ========== Category Operations ==========

  /** List files by category */
  BY_CATEGORY: (category: string) => `${STORAGE_API_BASE}/category/${category}`,

  // ========== Related Entity Operations ==========

  /** List files by related entity */
  BY_ENTITY: (entityType: string, entityId: string) =>
    `${STORAGE_API_BASE}/entity/${entityType}/${entityId}`,

  /** Attach files to entity */
  ATTACH_TO_ENTITY: (entityType: string, entityId: string) =>
    `${STORAGE_API_BASE}/entity/${entityType}/${entityId}/attach`,

  /** Detach file from entity */
  DETACH_FROM_ENTITY: (entityType: string, entityId: string, fileId: string) =>
    `${STORAGE_API_BASE}/entity/${entityType}/${entityId}/detach/${fileId}`,
} as const;

// ============================================================================
// Permissions
// ============================================================================

/**
 * File storage permission constants
 */
export const STORAGE_PERMISSIONS = {
  /** Read file metadata and download */
  FILE_READ: 'storage:file:read',

  /** Upload and update files */
  FILE_WRITE: 'storage:file:write',

  /** Delete files */
  FILE_DELETE: 'storage:file:delete',

  /** View access logs */
  ACCESS_LOG_READ: 'storage:access-log:read',

  /** Admin operations */
  ADMIN: 'storage:admin',
} as const;
