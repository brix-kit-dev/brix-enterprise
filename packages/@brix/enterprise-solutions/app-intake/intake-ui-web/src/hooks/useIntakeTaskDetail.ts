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
 * @file Intake Task Detail Hook
 * @description ViewModel layer for intake task detail view
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Provides state management for viewing and editing a single intake task.
 * Follows v3.0.4 MVVM architecture with clear separation from View layer.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '@brix-sdk/runtime-sdk-react';
import type {
  IntakeTask,
  IntakeChecklistItem,
  UpdateIntakeTaskRequest,
  CreateIntakeTaskRequest,
} from '@brix-sdk/enterprise-intake-shared';
import { createIntakeRepository } from '../repositories';

// ============================================================================
// Detail Hook Types
// ============================================================================

/**
 * Intake Task Detail Hook Return Type
 */
export interface UseIntakeTaskDetailResult {
  /** The intake task data */
  task: IntakeTask | null;
  /** Loading state */
  isLoading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Error object */
  error: Error | null;
  /** Whether the task is in edit mode */
  isEditing: boolean;
  /** Pending changes (for edit mode) */
  pendingChanges: Partial<UpdateIntakeTaskRequest>;
  /** Refresh task data */
  refresh: () => Promise<void>;
  /** Start editing */
  startEditing: () => void;
  /** Cancel editing */
  cancelEditing: () => void;
  /** Update pending changes */
  updateField: <K extends keyof UpdateIntakeTaskRequest>(
    field: K,
    value: UpdateIntakeTaskRequest[K]
  ) => void;
  /** Save changes */
  saveChanges: () => Promise<void>;
  /** Activate the task */
  activate: () => Promise<void>;
  /** Cancel the task */
  cancel: () => Promise<void>;
  /** Delete the task */
  deleteTask: () => Promise<void>;
}

// ============================================================================
// Detail Hook Implementation
// ============================================================================

/**
 * Intake Task Detail Hook
 *
 * Provides state management for viewing and editing a single intake task.
 *
 * @param taskId - The ID of the task to load
 * @returns Task detail state and operation methods
 *
 * @example
 * ```tsx
 * const { task, isLoading, error, activate, cancel } = useIntakeTaskDetail(123);
 *
 * // Edit mode
 * const { startEditing, updateField, saveChanges } = useIntakeTaskDetail(123);
 * startEditing();
 * updateField('title', 'New Title');
 * await saveChanges();
 * ```
 */
export function useIntakeTaskDetail(taskId: number | undefined): UseIntakeTaskDetailResult {
  const http = useHttp();

  // State
  const [task, setTask] = useState<IntakeTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<UpdateIntakeTaskRequest>>({});

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
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch task');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [repository, taskId]);

  // Fetch on mount and when taskId changes
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  /**
   * Refresh task data
   */
  const refresh = useCallback(async () => {
    await fetchTask();
  }, [fetchTask]);

  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    if (task) {
      setPendingChanges({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedReviewerId: task.assignedReviewerId,
        notes: task.notes,
      });
      setIsEditing(true);
    }
  }, [task]);

  /**
   * Cancel editing mode
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setPendingChanges({});
  }, []);

  /**
   * Update a pending change field
   */
  const updateField = useCallback(
    <K extends keyof UpdateIntakeTaskRequest>(field: K, value: UpdateIntakeTaskRequest[K]) => {
      setPendingChanges((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * Save changes
   */
  const saveChanges = useCallback(async () => {
    if (!taskId || Object.keys(pendingChanges).length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedTask = await repository.updateTask(taskId, pendingChanges);
      setTask(updatedTask);
      setIsEditing(false);
      setPendingChanges({});
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save changes');
      setError(error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [repository, taskId, pendingChanges]);

  /**
   * Activate the task
   */
  const activate = useCallback(async () => {
    if (!taskId) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedTask = await repository.activateTask(taskId);
      setTask(updatedTask);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to activate task');
      setError(error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [repository, taskId]);

  /**
   * Cancel the task
   */
  const cancel = useCallback(async () => {
    if (!taskId) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedTask = await repository.cancelTask(taskId);
      setTask(updatedTask);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel task');
      setError(error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [repository, taskId]);

  /**
   * Delete the task
   */
  const deleteTask = useCallback(async () => {
    if (!taskId) return;

    setIsSaving(true);
    setError(null);

    try {
      await repository.deleteTask(taskId);
      setTask(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete task');
      setError(error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [repository, taskId]);

  return {
    task,
    isLoading,
    isSaving,
    error,
    isEditing,
    pendingChanges,
    refresh,
    startEditing,
    cancelEditing,
    updateField,
    saveChanges,
    activate,
    cancel,
    deleteTask,
  };
}

// ============================================================================
// Create Task Hook
// ============================================================================

/**
 * Create Task Hook Return Type
 */
export interface UseCreateIntakeTaskResult {
  /** Form data */
  formData: CreateIntakeTaskRequest;
  /** Saving state */
  isSaving: boolean;
  /** Error object */
  error: Error | null;
  /** Update form field */
  updateField: <K extends keyof CreateIntakeTaskRequest>(
    field: K,
    value: CreateIntakeTaskRequest[K]
  ) => void;
  /** Reset form */
  resetForm: () => void;
  /** Submit form and create task */
  createTask: () => Promise<IntakeTask>;
}

/**
 * Create Intake Task Hook
 *
 * Provides state management for the task creation form.
 *
 * @param initialData - Optional initial form data
 * @returns Form state and operation methods
 *
 * @example
 * ```tsx
 * const { formData, updateField, createTask } = useCreateIntakeTask();
 * updateField('title', 'New Intake Task');
 * updateField('customerId', 123);
 * const newTask = await createTask();
 * ```
 */
export function useCreateIntakeTask(
  initialData?: Partial<CreateIntakeTaskRequest>
): UseCreateIntakeTaskResult {
  const http = useHttp();

  // Default form data
  const defaultFormData: CreateIntakeTaskRequest = {
    customerId: 0,
    title: '',
    description: '',
    priority: 'NORMAL',
    checklistItems: [],
    ...initialData,
  };

  // State
  const [formData, setFormData] = useState<CreateIntakeTaskRequest>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create repository
  const repository = useMemo(() => createIntakeRepository(http), [http]);

  /**
   * Update form field
   */
  const updateField = useCallback(
    <K extends keyof CreateIntakeTaskRequest>(field: K, value: CreateIntakeTaskRequest[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setError(null);
  }, []);

  /**
   * Create the task
   */
  const createTask = useCallback(async (): Promise<IntakeTask> => {
    setIsSaving(true);
    setError(null);

    try {
      const task = await repository.createTask(formData);
      return task;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create task');
      setError(error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [repository, formData]);

  return {
    formData,
    isSaving,
    error,
    updateField,
    resetForm,
    createTask,
  };
}
