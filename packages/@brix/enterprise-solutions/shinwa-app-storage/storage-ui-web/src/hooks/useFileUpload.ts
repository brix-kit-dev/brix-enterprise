/**
 * @file File Upload Hook
 * @description ViewModel layer hook for file upload management
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 MVVM architecture, this hook provides:
 * 1. Single and batch file upload operations
 * 2. Upload progress tracking
 * 3. Upload queue management
 * 4. Error handling with retry support
 *
 * Architecture Compliance (Red Line R3):
 * - All uploads via Repository -> HttpCapability chain
 * - Progress state managed in hook
 * - View layer receives reactive upload status
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  FileDTO,
  UploadFileRequest,
  UploadProgress,
  FileCategory,
} from '@shinwa/storage-shared';
import { createFileRepository } from '../repositories';

// ============================================================================
// Types
// ============================================================================

/**
 * Upload queue item status
 */
export type UploadItemStatus = 'pending' | 'uploading' | 'completed' | 'failed';

/**
 * Upload queue item
 */
export interface UploadQueueItem {
  /** Unique item ID (client-generated) */
  id: string;

  /** Original file object */
  file: File;

  /** Upload progress (0-100) */
  progress: number;

  /** Current status */
  status: UploadItemStatus;

  /** Uploaded file DTO (after completion) */
  result?: FileDTO;

  /** Error message (if failed) */
  error?: string;

  /** Upload request options */
  options?: Omit<UploadFileRequest, 'file'>;
}

/**
 * File Upload Hook Return Type
 */
export interface UseFileUploadResult {
  /** Upload queue items */
  queue: UploadQueueItem[];

  /** Is any upload in progress */
  isUploading: boolean;

  /** Overall progress percentage (0-100) */
  overallProgress: number;

  /** Add files to upload queue */
  addFiles: (
    files: File[],
    options?: Omit<UploadFileRequest, 'file'>
  ) => void;

  /** Remove file from queue (only pending files) */
  removeFile: (id: string) => void;

  /** Start uploading all pending files */
  startUpload: () => Promise<FileDTO[]>;

  /** Retry failed uploads */
  retryFailed: () => Promise<FileDTO[]>;

  /** Clear completed and failed items from queue */
  clearCompleted: () => void;

  /** Clear entire queue */
  clearAll: () => void;

  /** Upload a single file immediately */
  uploadSingle: (request: UploadFileRequest) => Promise<FileDTO>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique ID for queue items
 */
function generateId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * File Upload Hook
 *
 * Manages file upload queue, progress tracking, and batch uploads.
 * Follows v3.0.4 ViewModel pattern.
 *
 * @param defaultOptions - Default upload options applied to all files
 * @returns Upload state and operations
 *
 * @example
 * ```tsx
 * function FileUploadPage() {
 *   const {
 *     queue,
 *     isUploading,
 *     overallProgress,
 *     addFiles,
 *     startUpload,
 *     clearCompleted,
 *   } = useFileUpload();
 *
 *   const handleDrop = (files: File[]) => {
 *     addFiles(files, { category: 'DOCUMENT' });
 *   };
 *
 *   const handleUpload = async () => {
 *     const results = await startUpload();
 *     console.log('Uploaded:', results);
 *   };
 *
 *   return (
 *     <div>
 *       <UploadDropzone onDrop={handleDrop} />
 *       <UploadQueue items={queue} />
 *       <Button onClick={handleUpload} disabled={isUploading}>
 *         Upload All ({overallProgress}%)
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileUpload(
  defaultOptions?: Omit<UploadFileRequest, 'file'>
): UseFileUploadResult {
  // Obtain HttpCapability from RuntimeContext
  const http = useHttp();

  // State management
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Use ref to track abort controllers for cancellation support
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Create repository instance (memoized)
  const repository = useMemo(
    () => createFileRepository(http),
    [http]
  );

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (queue.length === 0) return 0;

    const totalProgress = queue.reduce((sum: number, item: UploadQueueItem) => sum + item.progress, 0);
    return Math.round(totalProgress / queue.length);
  }, [queue]);

  // Add files to queue
  const addFiles = useCallback(
    (files: File[], options?: Omit<UploadFileRequest, 'file'>) => {
      const newItems: UploadQueueItem[] = files.map((file) => ({
        id: generateId(),
        file,
        progress: 0,
        status: 'pending' as const,
        options: { ...defaultOptions, ...options },
      }));

      setQueue((prev: UploadQueueItem[]) => [...prev, ...newItems]);
    },
    [defaultOptions]
  );

  // Remove file from queue
  const removeFile = useCallback((id: string) => {
    setQueue((prev: UploadQueueItem[]) => {
      const item = prev.find((i: UploadQueueItem) => i.id === id);
      // Only allow removing pending or failed items
      if (item && (item.status === 'pending' || item.status === 'failed')) {
        // Cancel any in-progress upload
        const controller = abortControllersRef.current.get(id);
        if (controller) {
          controller.abort();
          abortControllersRef.current.delete(id);
        }
        return prev.filter((i: UploadQueueItem) => i.id !== id);
      }
      return prev;
    });
  }, []);

  // Update queue item
  const updateQueueItem = useCallback(
    (id: string, updates: Partial<UploadQueueItem>) => {
      setQueue((prev: UploadQueueItem[]) =>
        prev.map((item: UploadQueueItem) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // Upload single file (internal)
  const uploadFileItem = useCallback(
    async (item: UploadQueueItem): Promise<FileDTO> => {
      const request: UploadFileRequest = {
        file: item.file,
        ...item.options,
      };

      updateQueueItem(item.id, { status: 'uploading', progress: 0 });

      try {
        const result = await repository.upload(request, (percentage: number) => {
          updateQueueItem(item.id, { progress: percentage });
        });

        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          result,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        updateQueueItem(item.id, {
          status: 'failed',
          error: errorMessage,
        });
        throw err;
      }
    },
    [repository, updateQueueItem]
  );

  // Start uploading all pending files
  const startUpload = useCallback(async (): Promise<FileDTO[]> => {
    const pendingItems = queue.filter((item: UploadQueueItem) => item.status === 'pending');

    if (pendingItems.length === 0) {
      return [];
    }

    setIsUploading(true);
    const results: FileDTO[] = [];

    try {
      // Upload files sequentially to maintain progress tracking accuracy
      for (const item of pendingItems) {
        try {
          const result = await uploadFileItem(item);
          results.push(result);
        } catch {
          // Continue with next file even if one fails
          // Error is already recorded in queue item
        }
      }
    } finally {
      setIsUploading(false);
    }

    return results;
  }, [queue, uploadFileItem]);

  // Retry failed uploads
  const retryFailed = useCallback(async (): Promise<FileDTO[]> => {
    const failedItems = queue.filter((item: UploadQueueItem) => item.status === 'failed');

    if (failedItems.length === 0) {
      return [];
    }

    // Reset failed items to pending
    failedItems.forEach((item: UploadQueueItem) => {
      updateQueueItem(item.id, {
        status: 'pending',
        progress: 0,
        error: undefined,
      });
    });

    // Start upload
    return startUpload();
  }, [queue, updateQueueItem, startUpload]);

  // Clear completed and failed items
  const clearCompleted = useCallback(() => {
    setQueue((prev: UploadQueueItem[]) =>
      prev.filter(
        (item: UploadQueueItem) => item.status === 'pending' || item.status === 'uploading'
      )
    );
  }, []);

  // Clear entire queue
  const clearAll = useCallback(() => {
    // Abort any in-progress uploads
    abortControllersRef.current.forEach((controller: AbortController) => {
      controller.abort();
    });
    abortControllersRef.current.clear();

    setQueue([]);
    setIsUploading(false);
  }, []);

  // Upload single file immediately (bypasses queue)
  const uploadSingle = useCallback(
    async (request: UploadFileRequest): Promise<FileDTO> => {
      return repository.upload(request);
    },
    [repository]
  );

  return {
    queue,
    isUploading,
    overallProgress,
    addFiles,
    removeFile,
    startUpload,
    retryFailed,
    clearCompleted,
    clearAll,
    uploadSingle,
  };
}
