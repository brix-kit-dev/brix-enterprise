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
 * @file File Repository Implementation
 * @description Data access layer for file storage API calls
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Repository layer encapsulates all data access logic following v3.0.4 architecture:
 * 1. Receives HttpCapability via factory function (dependency injection)
 * 2. Calls HttpCapability to make HTTP requests
 * 3. Handles data format conversion
 * 4. Provides standardized error handling
 *
 * Architecture Compliance (Red Line R3):
 * - All HTTP requests go through HttpCapability
 * - Direct use of fetch/axios is forbidden
 * - HttpCapability is injected via RuntimeContext
 * - Repository is framework-agnostic (no React imports)
 *
 * @see HttpCapability defined in @brix-sdk/runtime-sdk-api-web
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  FileDTO,
  FileSummary,
  FileAccessLog,
  UploadFileRequest,
  UpdateFileRequest,
  FileQueryParams,
  AccessLogQueryParams,
  PagedResponse,
} from '@brix-sdk/enterprise-storage-shared';
import { STORAGE_API } from '@brix-sdk/enterprise-storage-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * File Repository Interface
 *
 * Defines the contract for file data access operations.
 * Implementations must use HttpCapability for all network requests.
 */
export interface FileRepository {
  /**
   * Get paginated list of files
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated response containing file summaries
   */
  list(params?: FileQueryParams): Promise<PagedResponse<FileSummary>>;

  /**
   * Get file details by ID
   *
   * @param id - File ID (UUID)
   * @returns Full file DTO with metadata
   */
  getById(id: string): Promise<FileDTO>;

  /**
   * Upload a single file
   *
   * @param request - Upload request with file and metadata
   * @param onProgress - Optional progress callback
   * @returns Uploaded file DTO
   */
  upload(
    request: UploadFileRequest,
    onProgress?: (percentage: number) => void
  ): Promise<FileDTO>;

  /**
   * Upload multiple files in batch
   *
   * @param files - Array of upload requests
   * @param onProgress - Optional progress callback per file
   * @returns Array of uploaded file DTOs
   */
  uploadBatch(
    files: UploadFileRequest[],
    onProgress?: (fileIndex: number, percentage: number) => void
  ): Promise<FileDTO[]>;

  /**
   * Update file metadata
   *
   * @param id - File ID
   * @param request - Update parameters
   * @returns Updated file DTO
   */
  update(id: string, request: UpdateFileRequest): Promise<FileDTO>;

  /**
   * Delete a file
   *
   * @param id - File ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get download URL for a file
   *
   * @param id - File ID
   * @returns Pre-signed download URL
   */
  getDownloadUrl(id: string): Promise<string>;

  /**
   * Get preview URL for a file
   *
   * @param id - File ID
   * @returns Preview URL (for browser viewing)
   */
  getPreviewUrl(id: string): Promise<string>;

  /**
   * Get file access logs
   *
   * @param fileId - File ID
   * @param params - Query parameters for pagination
   * @returns Paginated access log entries
   */
  getAccessLogs(
    fileId: string,
    params?: AccessLogQueryParams
  ): Promise<PagedResponse<FileAccessLog>>;

  /**
   * Get files by related entity
   *
   * @param entityType - Entity type (e.g., 'CASE', 'CONTRACT')
   * @param entityId - Entity ID
   * @param params - Query parameters
   * @returns Paginated file summaries
   */
  getByEntity(
    entityType: string,
    entityId: string,
    params?: FileQueryParams
  ): Promise<PagedResponse<FileSummary>>;

  /**
   * Attach files to an entity
   *
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param fileIds - Array of file IDs to attach
   */
  attachToEntity(
    entityType: string,
    entityId: string,
    fileIds: string[]
  ): Promise<void>;

  /**
   * Detach a file from an entity
   *
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param fileId - File ID to detach
   */
  detachFromEntity(
    entityType: string,
    entityId: string,
    fileId: string
  ): Promise<void>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a File Repository instance
 *
 * Factory function that creates a repository instance with the provided
 * HttpCapability. This follows the v3.0.4 dependency injection pattern.
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns FileRepository instance
 *
 * @example
 * ```typescript
 * // In a React component or hook
 * const http = useHttp();
 * const repository = createFileRepository(http);
 * const files = await repository.list({ page: 0, size: 20 });
 * ```
 */
export function createFileRepository(http: HttpCapability): FileRepository {
  return {
    /**
     * Get paginated list of files
     */
    async list(params?: FileQueryParams): Promise<PagedResponse<FileSummary>> {
      const response = await http.request<PagedResponse<FileSummary>>({
        url: STORAGE_API.LIST,
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort,
          direction: params?.direction,
          status: params?.status,
          category: params?.category,
          relatedEntityType: params?.relatedEntityType,
          relatedEntityId: params?.relatedEntityId,
          uploadedBy: params?.uploadedBy,
          contentTypePrefix: params?.contentTypePrefix,
          keyword: params?.keyword,
          tags: params?.tags?.join(','),
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      });
      return response.data;
    },

    /**
     * Get file details by ID
     */
    async getById(id: string): Promise<FileDTO> {
      const response = await http.request<FileDTO>({
        url: STORAGE_API.DETAIL(id),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Upload a single file
     *
     * Uses multipart/form-data for file upload.
     * Progress callback is triggered during upload if provided.
     */
    async upload(
      request: UploadFileRequest,
      onProgress?: (percentage: number) => void
    ): Promise<FileDTO> {
      const formData = new FormData();
      formData.append('file', request.file);

      // Append optional metadata fields
      if (request.category) {
        formData.append('category', request.category);
      }
      if (request.description) {
        formData.append('description', request.description);
      }
      if (request.relatedEntityType) {
        formData.append('relatedEntityType', request.relatedEntityType);
      }
      if (request.relatedEntityId) {
        formData.append('relatedEntityId', request.relatedEntityId);
      }
      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }
      if (request.tags && request.tags.length > 0) {
        formData.append('tags', request.tags.join(','));
      }

      // Use upload method for multipart uploads
      // Note: Progress tracking is not supported in current HttpCapability interface
      const result = await http.upload<FileDTO>(STORAGE_API.UPLOAD, formData);
      return result;
    },

    /**
     * Upload multiple files in batch
     *
     * Files are uploaded sequentially to maintain proper progress tracking.
     */
    async uploadBatch(
      files: UploadFileRequest[],
      onProgress?: (fileIndex: number, percentage: number) => void
    ): Promise<FileDTO[]> {
      const results: FileDTO[] = [];

      for (let i = 0; i < files.length; i++) {
        const result = await this.upload(files[i], (percentage) => {
          onProgress?.(i, percentage);
        });
        results.push(result);
      }

      return results;
    },

    /**
     * Update file metadata
     */
    async update(id: string, request: UpdateFileRequest): Promise<FileDTO> {
      const response = await http.request<FileDTO>({
        url: STORAGE_API.UPDATE(id),
        method: 'PUT',
        data: request,
      });
      return response.data;
    },

    /**
     * Delete a file
     */
    async delete(id: string): Promise<void> {
      await http.request<void>({
        url: STORAGE_API.DELETE(id),
        method: 'DELETE',
      });
    },

    /**
     * Get download URL for a file
     *
     * Returns a pre-signed URL with limited validity.
     */
    async getDownloadUrl(id: string): Promise<string> {
      const response = await http.request<{ url: string }>({
        url: STORAGE_API.DOWNLOAD_URL(id),
        method: 'GET',
      });
      return response.data.url;
    },

    /**
     * Get preview URL for a file
     *
     * Returns a URL suitable for browser inline viewing.
     */
    async getPreviewUrl(id: string): Promise<string> {
      const response = await http.request<{ url: string }>({
        url: STORAGE_API.PREVIEW_URL(id),
        method: 'GET',
      });
      return response.data.url;
    },

    /**
     * Get file access logs
     */
    async getAccessLogs(
      fileId: string,
      params?: AccessLogQueryParams
    ): Promise<PagedResponse<FileAccessLog>> {
      const response = await http.request<PagedResponse<FileAccessLog>>({
        url: STORAGE_API.ACCESS_LOGS(fileId),
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          action: params?.action,
          userId: params?.userId,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      });
      return response.data;
    },

    /**
     * Get files by related entity
     */
    async getByEntity(
      entityType: string,
      entityId: string,
      params?: FileQueryParams
    ): Promise<PagedResponse<FileSummary>> {
      const response = await http.request<PagedResponse<FileSummary>>({
        url: STORAGE_API.BY_ENTITY(entityType, entityId),
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort,
          direction: params?.direction,
          status: params?.status,
          category: params?.category,
        },
      });
      return response.data;
    },

    /**
     * Attach files to an entity
     */
    async attachToEntity(
      entityType: string,
      entityId: string,
      fileIds: string[]
    ): Promise<void> {
      await http.request<void>({
        url: STORAGE_API.ATTACH_TO_ENTITY(entityType, entityId),
        method: 'POST',
        data: { fileIds },
      });
    },

    /**
     * Detach a file from an entity
     */
    async detachFromEntity(
      entityType: string,
      entityId: string,
      fileId: string
    ): Promise<void> {
      await http.request<void>({
        url: STORAGE_API.DETACH_FROM_ENTITY(entityType, entityId, fileId),
        method: 'DELETE',
      });
    },
  };
}
