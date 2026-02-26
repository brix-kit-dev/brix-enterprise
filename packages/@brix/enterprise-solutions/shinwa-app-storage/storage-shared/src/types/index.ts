/**
 * @file File Storage Module Type Definitions
 * @description Shared type contracts for file storage module
 * @module @shinwa/storage-shared
 * @version 3.0.4
 *
 * Design Notes:
 * This file defines the type contracts shared between frontend and backend.
 * Following v3.0.4 blueprint, this serves as the {name}-shared layer
 * containing DTO types, query parameters, and response types.
 *
 * Architecture Compliance:
 * - Types are framework-agnostic (no React/Angular specific types)
 * - Mirrors backend DTO structures for type safety
 * - Used by both Repository layer (frontend) and Controller layer (backend)
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// File Status Enum
// ============================================================================

/**
 * File processing status enumeration
 *
 * Lifecycle: UPLOADING -> UPLOADED -> PROCESSING -> READY
 * Error states: FAILED, DELETED
 */
export type FileStatus = 
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'DELETED';

/**
 * Business category for file classification
 *
 * Files are categorized by business domain to support
 * filtered views and access control policies.
 */
export type FileCategory =
  | 'DOCUMENT'      // General documents (PDF, Word, etc.)
  | 'IMAGE'         // Image files (JPEG, PNG, etc.)
  | 'VIDEO'         // Video files (MP4, WebM, etc.)
  | 'MEDICAL'       // Medical records and reports
  | 'CONTRACT'      // Contract documents
  | 'IDENTITY'      // Identity verification documents
  | 'CERTIFICATE'   // Certificates and qualifications
  | 'OTHER';        // Uncategorized files

// ============================================================================
// File DTO Types
// ============================================================================

/**
 * File Metadata DTO
 *
 * Complete file information returned by the API.
 * Contains both technical metadata and business attributes.
 */
export interface FileDTO {
  /** Unique file identifier (UUID format) */
  id: string;

  /** Stored filename (system-generated, unique) */
  filename: string;

  /** Original filename from upload */
  originalFilename: string;

  /** MIME content type (e.g., 'application/pdf') */
  contentType: string;

  /** File size in bytes */
  size: number;

  /** Current processing status */
  status: FileStatus;

  /** Business category for classification */
  category: FileCategory;

  /** User ID who uploaded the file */
  uploadedBy: string;

  /** Username who uploaded the file */
  uploadedByName: string;

  /** Upload timestamp (ISO 8601 format) */
  uploadedAt: string;

  /** Last modification timestamp (ISO 8601 format) */
  updatedAt: string;

  /** Download URL (pre-signed, time-limited) */
  url?: string;

  /** Thumbnail URL for image/video files */
  thumbnailUrl?: string;

  /** File description or notes */
  description?: string;

  /** Associated business entity type (e.g., 'CASE', 'CONTRACT') */
  relatedEntityType?: string;

  /** Associated business entity ID */
  relatedEntityId?: string;

  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>;

  /** File tags for search and organization */
  tags?: string[];
}

/**
 * File Summary DTO for list views
 *
 * Lightweight representation used in file lists.
 * Omits detailed metadata to reduce payload size.
 */
export interface FileSummary {
  /** Unique file identifier */
  id: string;

  /** Original filename */
  originalFilename: string;

  /** MIME content type */
  contentType: string;

  /** File size in bytes */
  size: number;

  /** Current status */
  status: FileStatus;

  /** Business category */
  category: FileCategory;

  /** Upload timestamp */
  uploadedAt: string;

  /** Thumbnail URL (if available) */
  thumbnailUrl?: string;

  /** Associated entity type */
  relatedEntityType?: string;

  /** Associated entity ID */
  relatedEntityId?: string;
}

// ============================================================================
// File Access Log Types
// ============================================================================

/**
 * Access log action types
 */
export type AccessAction =
  | 'VIEW'
  | 'DOWNLOAD'
  | 'PREVIEW'
  | 'SHARE'
  | 'DELETE'
  | 'UPDATE';

/**
 * File Access Log Entry
 *
 * Records file access for audit compliance.
 */
export interface FileAccessLog {
  /** Log entry ID */
  id: string;

  /** File ID */
  fileId: string;

  /** Action performed */
  action: AccessAction;

  /** User ID who performed the action */
  userId: string;

  /** Username */
  userName: string;

  /** Action timestamp */
  accessedAt: string;

  /** Client IP address */
  ipAddress?: string;

  /** User agent string */
  userAgent?: string;

  /** Additional details */
  details?: string;
}

// ============================================================================
// Upload Types
// ============================================================================

/**
 * Upload Progress Tracking
 *
 * Used for real-time upload progress updates.
 */
export interface UploadProgress {
  /** Temporary file identifier during upload */
  fileId: string;

  /** Original filename */
  filename: string;

  /** Bytes uploaded */
  loaded: number;

  /** Total file size */
  total: number;

  /** Upload percentage (0-100) */
  percentage: number;

  /** Current upload status */
  status: 'pending' | 'uploading' | 'completed' | 'failed';

  /** Error message if failed */
  error?: string;
}

/**
 * File Upload Request Parameters
 */
export interface UploadFileRequest {
  /** File to upload (browser File object) */
  file: File;

  /** Business category */
  category?: FileCategory;

  /** File description */
  description?: string;

  /** Related entity type */
  relatedEntityType?: string;

  /** Related entity ID */
  relatedEntityId?: string;

  /** Custom metadata */
  metadata?: Record<string, string>;

  /** Tags for organization */
  tags?: string[];
}

/**
 * File Update Request Parameters
 */
export interface UpdateFileRequest {
  /** Updated description */
  description?: string;

  /** Updated category */
  category?: FileCategory;

  /** Updated tags */
  tags?: string[];

  /** Updated metadata */
  metadata?: Record<string, string>;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * File List Query Parameters
 *
 * Supports filtering, sorting, and pagination.
 */
export interface FileQueryParams {
  /** Page number (0-based) */
  page?: number;

  /** Page size */
  size?: number;

  /** Sort field */
  sort?: 'uploadedAt' | 'originalFilename' | 'size' | 'status';

  /** Sort direction */
  direction?: 'asc' | 'desc';

  /** Filter by status */
  status?: FileStatus;

  /** Filter by category */
  category?: FileCategory;

  /** Filter by related entity type */
  relatedEntityType?: string;

  /** Filter by related entity ID */
  relatedEntityId?: string;

  /** Filter by uploader ID */
  uploadedBy?: string;

  /** Filter by content type prefix (e.g., 'image/') */
  contentTypePrefix?: string;

  /** Search keyword (filename, description) */
  keyword?: string;

  /** Filter by tags (comma-separated) */
  tags?: string[];

  /** Upload date from (ISO 8601) */
  dateFrom?: string;

  /** Upload date to (ISO 8601) */
  dateTo?: string;
}

/**
 * Access Log Query Parameters
 */
export interface AccessLogQueryParams {
  /** Page number (0-based) */
  page?: number;

  /** Page size */
  size?: number;

  /** Filter by action type */
  action?: AccessAction;

  /** Filter by user ID */
  userId?: string;

  /** Date from (ISO 8601) */
  dateFrom?: string;

  /** Date to (ISO 8601) */
  dateTo?: string;
}

// ============================================================================
// Paginated Response
// ============================================================================

/**
 * Generic Paginated Response
 *
 * Standard pagination wrapper matching Spring Data Page structure.
 */
export interface PagedResponse<T> {
  /** Page content array */
  content: T[];

  /** Current page number (0-based) */
  number: number;

  /** Page size */
  size: number;

  /** Total elements across all pages */
  totalElements: number;

  /** Total number of pages */
  totalPages: number;

  /** Is this the first page */
  first: boolean;

  /** Is this the last page */
  last: boolean;

  /** Is the page empty */
  empty: boolean;
}

// ============================================================================
// Legacy Types (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use FileDTO instead
 */
export interface FileMetadata {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  status: FileStatus;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  thumbnailUrl?: string;
}

/**
 * Avatar DTO for user profile images
 */
export interface Avatar {
  /** Avatar ID */
  id: string;

  /** User ID */
  userId: string;

  /** Avatar URL */
  url: string;

  /** Avatar size variant */
  size: 'small' | 'medium' | 'large';

  /** Creation timestamp */
  createdAt: string;
}
