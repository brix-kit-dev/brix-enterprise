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
 * @file File Detail Hook
 * @description ViewModel layer hook for file detail management
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 MVVM architecture, this hook provides:
 * 1. File detail data fetching and caching
 * 2. File metadata update operations
 * 3. Download and preview URL generation
 * 4. File deletion with navigation callback
 *
 * Architecture Compliance (Red Line R3):
 * - All HTTP operations via Repository -> HttpCapability chain
 * - State management encapsulated in hook
 * - View layer receives reactive state only
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type { FileDTO, UpdateFileRequest } from '@brix-sdk/enterprise-storage-shared';
import { createFileRepository } from '../repositories';

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * File Detail Hook Return Type
 */
export interface UseFileDetailResult {
  /** File detail data */
  file: FileDTO | null;

  /** Loading state */
  isLoading: boolean;

  /** Error object if request failed */
  error: Error | null;

  /** Refresh file detail */
  refresh: () => Promise<void>;

  /** Update file metadata */
  update: (request: UpdateFileRequest) => Promise<FileDTO>;

  /** Delete the file */
  deleteFile: () => Promise<void>;

  /** Get download URL */
  getDownloadUrl: () => Promise<string>;

  /** Get preview URL */
  getPreviewUrl: () => Promise<string>;

  /** Operation in progress flag */
  isOperating: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * File Detail Hook
 *
 * Manages single file detail data and operations.
 * Follows v3.0.4 ViewModel pattern.
 *
 * @param fileId - File ID to load
 * @returns File detail state and operations
 *
 * @example
 * ```tsx
 * function FileDetailPage() {
 *   const { id } = useParams<{ id: string }>();
 *   const {
 *     file,
 *     isLoading,
 *     error,
 *     update,
 *     deleteFile,
 *     getDownloadUrl,
 *   } = useFileDetail(id!);
 *
 *   const handleDownload = async () => {
 *     const url = await getDownloadUrl();
 *     window.open(url, '_blank');
 *   };
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   if (!file) return <NotFound />;
 *
 *   return <FileDetailView file={file} onDownload={handleDownload} />;
 * }
 * ```
 */
export function useFileDetail(fileId: string): UseFileDetailResult {
  // Obtain HttpCapability from RuntimeContext
  const http = useHttp();

  // State management
  const [file, setFile] = useState<FileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  // Create repository instance (memoized)
  const repository = useMemo(
    () => createFileRepository(http),
    [http]
  );

  // Load file detail
  const loadData = useCallback(async () => {
    if (!fileId) {
      setError(new Error('File ID is required'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await repository.getById(fileId);
      setFile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [repository, fileId]);

  // Load on mount and fileId change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Update file metadata
  const update = useCallback(
    async (request: UpdateFileRequest): Promise<FileDTO> => {
      try {
        setIsOperating(true);
        setError(null);

        const updatedFile = await repository.update(fileId, request);
        setFile(updatedFile);
        return updatedFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err : new Error(String(err));
        setError(errorMessage);
        throw errorMessage;
      } finally {
        setIsOperating(false);
      }
    },
    [repository, fileId]
  );

  // Delete file
  const deleteFile = useCallback(async (): Promise<void> => {
    try {
      setIsOperating(true);
      setError(null);

      await repository.delete(fileId);
      setFile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setIsOperating(false);
    }
  }, [repository, fileId]);

  // Get download URL
  const getDownloadUrl = useCallback(async (): Promise<string> => {
    try {
      setIsOperating(true);
      const url = await repository.getDownloadUrl(fileId);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setIsOperating(false);
    }
  }, [repository, fileId]);

  // Get preview URL
  const getPreviewUrl = useCallback(async (): Promise<string> => {
    try {
      setIsOperating(true);
      const url = await repository.getPreviewUrl(fileId);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error(String(err));
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setIsOperating(false);
    }
  }, [repository, fileId]);

  return {
    file,
    isLoading,
    error,
    refresh,
    update,
    deleteFile,
    getDownloadUrl,
    getPreviewUrl,
    isOperating,
  };
}
