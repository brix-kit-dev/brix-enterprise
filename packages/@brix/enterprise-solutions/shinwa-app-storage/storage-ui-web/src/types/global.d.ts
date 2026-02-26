/**
 * @file Runtime SDK Type Declarations
 * @description TypeScript declarations for runtime SDK modules
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * These declarations provide type information for the runtime SDK modules
 * that are provided by the host shell at runtime via Module Federation.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

// ============================================================================
// @brix/runtime-sdk-api-web
// ============================================================================

declare module '@brix/runtime-sdk-api-web' {
  /**
   * HTTP Request Options
   */
  export interface HttpRequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
  }

  /**
   * HTTP Response Wrapper
   */
  export interface HttpResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
  }

  /**
   * HTTP Capability Interface
   *
   * Provides HTTP client functionality injected by the runtime shell.
   * All HTTP calls in the module should use this capability.
   */
  export interface HttpCapability {
    /**
     * Send a GET request
     *
     * @param url - Request URL
     * @param options - Request options
     * @returns Response data
     */
    get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;

    /**
     * Send a POST request
     *
     * @param url - Request URL
     * @param data - Request body
     * @param options - Request options
     * @returns Response data
     */
    post<T = unknown>(
      url: string,
      data?: unknown,
      options?: HttpRequestOptions
    ): Promise<T>;

    /**
     * Send a PUT request
     *
     * @param url - Request URL
     * @param data - Request body
     * @param options - Request options
     * @returns Response data
     */
    put<T = unknown>(
      url: string,
      data?: unknown,
      options?: HttpRequestOptions
    ): Promise<T>;

    /**
     * Send a PATCH request
     *
     * @param url - Request URL
     * @param data - Request body
     * @param options - Request options
     * @returns Response data
     */
    patch<T = unknown>(
      url: string,
      data?: unknown,
      options?: HttpRequestOptions
    ): Promise<T>;

    /**
     * Send a DELETE request
     *
     * @param url - Request URL
     * @param options - Request options
     * @returns Response data
     */
    delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;

    /**
     * Upload a file via multipart/form-data
     *
     * @param url - Request URL
     * @param formData - FormData object
     * @param options - Request options
     * @returns Response data
     */
    upload<T = unknown>(
      url: string,
      formData: FormData,
      options?: HttpRequestOptions
    ): Promise<T>;

    /**
     * Generic HTTP request method
     *
     * @param config - Request configuration
     * @returns Response with data
     */
    request<T = unknown>(config: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      params?: Record<string, string | number | boolean | undefined>;
      data?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
  }
}

// ============================================================================
// @brix/runtime-sdk-react
// ============================================================================

declare module '@brix/runtime-sdk-react' {
  import type { HttpCapability } from '@brix/runtime-sdk-api-web';

  /**
   * Hook to access HTTP capability from runtime context
   *
   * @returns HTTP capability instance
   */
  export function useHttp(): HttpCapability;

  /**
   * Router interface provided by runtime
   */
  export interface RuntimeRouter {
    /**
     * Navigate to a path
     *
     * @param path - Target path
     * @param options - Navigation options
     */
    navigate(path: string, options?: { replace?: boolean }): void;

    /**
     * Go back in history
     */
    back(): void;

    /**
     * Current location
     */
    location: {
      pathname: string;
      search: string;
      hash: string;
    };
  }

  /**
   * Hook to access router from runtime context
   *
   * @returns Runtime router instance
   */
  export function useRouter(): RuntimeRouter;

  /**
   * Hook to access route parameters
   *
   * @returns Route parameters object
   */
  export function useParams<T extends Record<string, string>>(): T;

  /**
   * Hook to access runtime context
   *
   * @returns Runtime context object
   */
  export function useRuntime(): {
    http: HttpCapability;
    router: RuntimeRouter;
  };
}

// ============================================================================
// @shinwa/storage-shared
// ============================================================================

declare module '@shinwa/storage-shared' {
  /**
   * File Status Enum
   */
  export type FileStatus = 'ACTIVE' | 'PROCESSING' | 'ARCHIVED' | 'DELETED' | 'UPLOADING' | 'UPLOADED' | 'READY' | 'FAILED';

  /**
   * File Category Enum
   */
  export type FileCategory =
    | 'DOCUMENT'
    | 'IMAGE'
    | 'VIDEO'
    | 'AUDIO'
    | 'OTHER'
    | 'MEDICAL'
    | 'CONTRACT'
    | 'IDENTITY'
    | 'CERTIFICATE';

  /**
   * Access Action Type
   */
  export type AccessAction =
    | 'VIEW'
    | 'DOWNLOAD'
    | 'PREVIEW'
    | 'SHARE'
    | 'DELETE'
    | 'UPDATE';

  /**
   * File DTO - Full file information
   */
  export interface FileDTO {
    id: string;
    originalName: string;
    displayName?: string;
    description?: string;
    mimeType: string;
    fileSize: number;
    category: FileCategory;
    status: FileStatus;
    storagePath: string;
    checksum?: string;
    thumbnailPath?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    relatedEntityType?: string;
    relatedEntityId?: string;
    uploadedBy: string;
    uploadedAt: string;
    updatedAt: string;
  }

  /**
   * File Summary - Lightweight file info for list display
   */
  export interface FileSummary {
    id: string;
    originalName: string;
    originalFilename?: string;
    displayName?: string;
    mimeType: string;
    contentType?: string;
    fileSize: number;
    size?: number;
    category: FileCategory;
    status: FileStatus;
    thumbnailPath?: string;
    thumbnailUrl?: string;
    uploadedBy: string;
    uploadedAt: string;
  }

  /**
   * File Access Log Entry
   */
  export interface FileAccessLog {
    id: string;
    fileId: string;
    action: AccessAction;
    userId: string;
    userName: string;
    accessedAt: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
  }

  /**
   * File Query Parameters
   */
  export interface FileQueryParams {
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    keyword?: string;
    status?: FileStatus;
    category?: FileCategory;
    relatedEntityType?: string;
    relatedEntityId?: string;
    uploadedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    contentTypePrefix?: string;
    tags?: string[];
  }

  /**
   * Access Log Query Parameters
   */
  export interface AccessLogQueryParams {
    page?: number;
    size?: number;
    action?: AccessAction;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }

  /**
   * Paged Response Wrapper
   */
  export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  }

  /**
   * Upload File Request
   */
  export interface UploadFileRequest {
    file: File;
    displayName?: string;
    description?: string;
    category?: FileCategory;
    tags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, unknown>;
  }

  /**
   * Update File Request
   */
  export interface UpdateFileRequest {
    displayName?: string;
    description?: string;
    category?: FileCategory;
    tags?: string[];
    status?: FileStatus;
  }

  /**
   * Storage API Endpoints
   */
  export const STORAGE_API: {
    LIST: string;
    DETAIL: (id: string) => string;
    UPLOAD: string;
    UPLOAD_BATCH: string;
    UPDATE: (id: string) => string;
    DELETE: (id: string) => string;
    DOWNLOAD: (id: string) => string;
    DOWNLOAD_URL: (id: string) => string;
    PREVIEW: (id: string) => string;
    PREVIEW_URL: (id: string) => string;
    ACCESS_LOGS: (id: string) => string;
    BY_ENTITY: (entityType: string, entityId: string) => string;
    ATTACH_TO_ENTITY: (entityType: string, entityId: string) => string;
    DETACH_FROM_ENTITY: (entityType: string, entityId: string, fileId: string) => string;
  };

  /**
   * File Category Constants
   */
  export const FILE_CATEGORY: {
    DOCUMENT: 'DOCUMENT';
    IMAGE: 'IMAGE';
    VIDEO: 'VIDEO';
    AUDIO: 'AUDIO';
    OTHER: 'OTHER';
  };

  /**
   * Storage Permission Constants
   */
  export const STORAGE_PERMISSIONS: {
    FILE_READ: string;
    FILE_WRITE: string;
    FILE_DELETE: string;
    FILE_ADMIN: string;
  };

  /**
   * Maximum file size constants in bytes
   */
  export const MAX_FILE_SIZE: {
    DEFAULT: number;
    IMAGE: number;
    VIDEO: number;
    DOCUMENT: number;
  };

  /**
   * Allowed MIME types for file uploads by category
   */
  export const ALLOWED_MIME_TYPES: {
    IMAGES: readonly string[];
    DOCUMENTS: readonly string[];
    VIDEOS: readonly string[];
    AUDIO: readonly string[];
    ALL: readonly string[];
  };

  /**
   * Upload progress tracking information
   */
  export interface UploadProgress {
    /** File being uploaded */
    file: File;
    /** Upload progress percentage (0-100) */
    progress: number;
    /** Current upload status */
    status: 'pending' | 'uploading' | 'success' | 'error';
    /** Error message if upload failed */
    error?: string;
    /** Uploaded file info after success */
    result?: FileInfo;
  }

  /**
   * File validation result
   */
  export interface FileValidationResult {
    /** Whether the file is valid */
    valid: boolean;
    /** Error message if validation failed */
    error?: string;
  }
}

// ============================================================================
// @aspect/runtime-sdk-react (alias for @brix)
// ============================================================================

declare module '@aspect/runtime-sdk-react' {
  export * from '@brix/runtime-sdk-react';
}
