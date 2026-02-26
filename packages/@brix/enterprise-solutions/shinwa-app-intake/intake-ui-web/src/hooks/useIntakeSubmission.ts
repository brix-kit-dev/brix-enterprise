/**
 * @file Intake Submission Hook
 * @description ViewModel layer for document submission workflow
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Manages the document submission workflow for customers.
 * Handles file upload coordination with StorageCapability and submission to API.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import { useState, useCallback, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  IntakeTask,
  IntakeChecklistItem,
  SubmitDocumentRequest,
} from '@shinwa/intake-shared';
import { createIntakeRepository } from '../repositories';

// ============================================================================
// Submission Hook Types
// ============================================================================

/**
 * File upload status for a checklist item
 */
export interface FileUploadState {
  /** Checklist item ID */
  itemId: number;
  /** Selected file (before upload) */
  file: File | null;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'idle' | 'uploading' | 'success' | 'error';
  /** Error message if failed */
  errorMessage?: string;
  /** Uploaded document ID (after success) */
  documentId?: string;
}

/**
 * Intake Submission Hook Return Type
 */
export interface UseIntakeSubmissionResult {
  /** Current task data */
  task: IntakeTask | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** File upload states by item ID */
  uploadStates: Record<number, FileUploadState>;
  /** Whether there are pending uploads */
  hasPendingUploads: boolean;
  /** Whether all required items are completed */
  allRequiredCompleted: boolean;
  /** Select file for an item */
  selectFile: (itemId: number, file: File) => void;
  /** Clear selected file for an item */
  clearFile: (itemId: number) => void;
  /** Upload file and submit document for an item */
  submitDocument: (itemId: number) => Promise<void>;
  /** Submit all pending documents */
  submitAllPending: () => Promise<void>;
  /** Refresh task data */
  refresh: () => Promise<void>;
}

// ============================================================================
// Submission Hook Implementation
// ============================================================================

/**
 * Intake Submission Hook
 *
 * Manages document submission workflow for a specific intake task.
 * Coordinates file selection, upload, and API submission.
 *
 * @param taskId - The ID of the intake task
 * @returns Submission state and operation methods
 *
 * @example
 * ```tsx
 * const {
 *   task,
 *   uploadStates,
 *   selectFile,
 *   submitDocument,
 *   submitAllPending
 * } = useIntakeSubmission(123);
 *
 * // Select a file for an item
 * selectFile(itemId, selectedFile);
 *
 * // Submit the document
 * await submitDocument(itemId);
 * ```
 */
export function useIntakeSubmission(taskId: number | undefined): UseIntakeSubmissionResult {
  const http = useHttp();

  // State
  const [task, setTask] = useState<IntakeTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<number, FileUploadState>>({});

  // Create repository
  const repository = useMemo(() => createIntakeRepository(http), [http]);

  /**
   * Fetch task data
   */
  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await repository.getTaskById(taskId);
      setTask(data);

      // Initialize upload states for all items
      const states: Record<number, FileUploadState> = {};
      data.checklistItems.forEach((item) => {
        states[item.id] = {
          itemId: item.id,
          file: null,
          progress: 0,
          status: 'idle',
        };
      });
      setUploadStates(states);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch task');
      setError(error);
      console.error('Failed to fetch intake task:', err);
    } finally {
      setIsLoading(false);
    }
  }, [repository, taskId]);

  // Fetch on mount
  useState(() => {
    fetchTask();
  });

  /**
   * Refresh task data
   */
  const refresh = useCallback(async () => {
    await fetchTask();
  }, [fetchTask]);

  /**
   * Check if there are pending uploads
   */
  const hasPendingUploads = useMemo(() => {
    return Object.values(uploadStates).some((state) => state.file !== null);
  }, [uploadStates]);

  /**
   * Check if all required items are completed
   */
  const allRequiredCompleted = useMemo(() => {
    if (!task) return false;

    return task.checklistItems
      .filter((item) => item.isRequired)
      .every((item) => item.status === 'APPROVED' || item.status === 'WAIVED');
  }, [task]);

  /**
   * Select file for an item
   */
  const selectFile = useCallback((itemId: number, file: File) => {
    setUploadStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        file,
        progress: 0,
        status: 'idle',
        errorMessage: undefined,
        documentId: undefined,
      },
    }));
  }, []);

  /**
   * Clear selected file for an item
   */
  const clearFile = useCallback((itemId: number) => {
    setUploadStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        file: null,
        progress: 0,
        status: 'idle',
        errorMessage: undefined,
      },
    }));
  }, []);

  /**
   * Upload file and submit document for an item
   *
   * Note: This is a simplified implementation. In production,
   * you would integrate with StorageCapability for file upload
   * and get the document ID from the storage service.
   */
  const submitDocument = useCallback(
    async (itemId: number) => {
      if (!taskId) return;

      const state = uploadStates[itemId];
      if (!state?.file) {
        throw new Error('No file selected for this item');
      }

      // Update state to uploading
      setUploadStates((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], status: 'uploading', progress: 0 },
      }));

      try {
        // Simulate file upload progress
        // In production, this would use StorageCapability
        setUploadStates((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], progress: 50 },
        }));

        // Generate a mock document ID (in production, this comes from storage service)
        const documentId = `doc_${Date.now()}_${itemId}`;

        setUploadStates((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], progress: 75 },
        }));

        // Submit to API
        const request: SubmitDocumentRequest = {
          itemId,
          documentId,
          fileName: state.file.name,
          fileSize: state.file.size,
          mimeType: state.file.type || 'application/octet-stream',
        };

        const updatedItem = await repository.submitDocument(taskId, request);

        // Update state to success
        setUploadStates((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            status: 'success',
            progress: 100,
            documentId,
            file: null,
          },
        }));

        // Update task checklist item
        setTask((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            checklistItems: prev.checklistItems.map((item) =>
              item.id === itemId ? updatedItem : item
            ),
          };
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit document';

        setUploadStates((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            status: 'error',
            progress: 0,
            errorMessage,
          },
        }));

        console.error('Failed to submit document:', err);
        throw err;
      }
    },
    [taskId, uploadStates, repository]
  );

  /**
   * Submit all pending documents
   */
  const submitAllPending = useCallback(async () => {
    const pendingItems = Object.values(uploadStates).filter((state) => state.file !== null);

    for (const state of pendingItems) {
      try {
        await submitDocument(state.itemId);
      } catch (err) {
        // Continue with other items even if one fails
        console.error(`Failed to submit item ${state.itemId}:`, err);
      }
    }
  }, [uploadStates, submitDocument]);

  return {
    task,
    isLoading,
    error,
    uploadStates,
    hasPendingUploads,
    allRequiredCompleted,
    selectFile,
    clearFile,
    submitDocument,
    submitAllPending,
    refresh,
  };
}
