/**
 * ViewModel hooks for script template operations.
 * Provides React hooks that encapsulate script template business logic
 * following the MVVM pattern in v3.0.4 Runtime Shell Architecture.
 * @module compliance-ui-web/hooks/useScriptTemplate
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useHttp } from '@brix/runtime-sdk-react';
import type {
  ScriptTemplate,
  ScriptTemplateListQueryParams,
  CreateScriptTemplateRequest,
  UpdateScriptTemplateRequest,
  ScriptTemplateStatus,
  ScriptCategory,
  ScriptScenario,
} from '@shinwa/compliance-shared';
import {
  createScriptTemplateRepository,
  type ScriptTemplateListResponse,
} from '../repositories';

/**
 * State interface for script template list operations.
 */
export interface ScriptTemplateListState {
  /** Array of script templates for current page */
  data: ScriptTemplate[];
  /** Total count of matching templates */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total available pages */
  totalPages: number;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Filter configuration for script template list.
 */
export interface ScriptTemplateFilters {
  /** Search keyword */
  keyword?: string;
  /** Filter by status */
  status?: ScriptTemplateStatus;
  /** Filter by category */
  category?: ScriptCategory;
  /** Filter by scenario */
  scenario?: ScriptScenario;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook for managing script template list with filtering and pagination.
 * Provides methods for fetching, refreshing, and navigating template lists.
 * @param initialFilters - Initial filter configuration
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing list state and control methods
 * @example
 * ```typescript
 * const {
 *   state,
 *   fetchTemplates,
 *   setFilters,
 *   setPage,
 *   refresh
 * } = useScriptTemplateList({ category: ScriptCategory.PRODUCT_INTRODUCTION });
 * ```
 */
export function useScriptTemplateList(
  initialFilters?: ScriptTemplateFilters,
  autoFetch: boolean = true
) {
  const http = useHttp();
  const repository = useMemo(() => createScriptTemplateRepository(http), [http]);

  const [state, setState] = useState<ScriptTemplateListState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<ScriptTemplateFilters>(initialFilters || {});

  /**
   * Fetches script templates with current filters and pagination.
   */
  const fetchTemplates = useCallback(
    async (page: number = state.page, pageSize: number = state.pageSize) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params: ScriptTemplateListQueryParams = {
          ...filters,
          page,
          pageSize,
        };

        const response: ScriptTemplateListResponse = await repository.getScriptTemplates(params);

        setState({
          data: response.items,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch script templates';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [repository, filters, state.page, state.pageSize]
  );

  /**
   * Updates filters and triggers a new fetch from page 1.
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ScriptTemplateFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  /**
   * Navigates to a specific page.
   */
  const setPage = useCallback(
    (page: number) => {
      fetchTemplates(page, state.pageSize);
    },
    [fetchTemplates, state.pageSize]
  );

  /**
   * Changes the page size and resets to page 1.
   */
  const setPageSize = useCallback(
    (pageSize: number) => {
      fetchTemplates(1, pageSize);
    },
    [fetchTemplates]
  );

  /**
   * Refreshes current page data.
   */
  const refresh = useCallback(() => {
    fetchTemplates(state.page, state.pageSize);
  }, [fetchTemplates, state.page, state.pageSize]);

  /**
   * Resets filters and pagination to initial state.
   */
  const reset = useCallback(() => {
    setFilters(initialFilters || {});
    fetchTemplates(1, 20);
  }, [fetchTemplates, initialFilters]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates(1, state.pageSize);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    filters,
    fetchTemplates,
    setFilters: updateFilters,
    setPage,
    setPageSize,
    refresh,
    reset,
  };
}

/**
 * State interface for single script template detail.
 */
export interface ScriptTemplateDetailState {
  /** Script template data */
  data: ScriptTemplate | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Template history records */
  history: Array<{
    id: string;
    action: string;
    operatorId: string;
    operatorName: string;
    timestamp: string;
    details?: string;
  }>;
}

/**
 * Hook for fetching and managing a single script template detail.
 * Includes history loading capability.
 * @param templateId - The unique identifier of the template
 * @param autoFetch - Whether to fetch on mount (default: true)
 * @returns Object containing template state and action methods
 */
export function useScriptTemplateDetail(templateId: string, autoFetch: boolean = true) {
  const http = useHttp();
  const repository = useMemo(() => createScriptTemplateRepository(http), [http]);

  const [state, setState] = useState<ScriptTemplateDetailState>({
    data: null,
    loading: false,
    error: null,
    history: [],
  });

  /**
   * Fetches the script template detail.
   */
  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const template = await repository.getScriptTemplateById(templateId);
      setState((prev) => ({
        ...prev,
        data: template,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch script template';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [repository, templateId]);

  /**
   * Fetches the template's history records.
   */
  const fetchHistory = useCallback(async () => {
    if (!templateId) return;

    try {
      const history = await repository.getScriptTemplateHistory(templateId);
      setState((prev) => ({ ...prev, history }));
    } catch (error) {
      console.error('Failed to fetch template history:', error);
    }
  }, [repository, templateId]);

  /**
   * Publishes the template.
   */
  const publish = useCallback(async (): Promise<boolean> => {
    if (!templateId) return false;

    try {
      const updated = await repository.publishScriptTemplate(templateId);
      setState((prev) => ({ ...prev, data: updated }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish template';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [repository, templateId]);

  /**
   * Archives the template.
   */
  const archive = useCallback(async (): Promise<boolean> => {
    if (!templateId) return false;

    try {
      const updated = await repository.archiveScriptTemplate(templateId);
      setState((prev) => ({ ...prev, data: updated }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive template';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [repository, templateId]);

  /**
   * Deletes the template.
   */
  const deleteTemplate = useCallback(async (): Promise<boolean> => {
    if (!templateId) return false;

    try {
      await repository.deleteScriptTemplate(templateId);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [repository, templateId]);

  /**
   * Copies the template with a new name.
   */
  const copyTemplate = useCallback(
    async (newName: string): Promise<ScriptTemplate | null> => {
      if (!templateId) return null;

      try {
        return await repository.copyScriptTemplate(templateId, newName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to copy template';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    [repository, templateId]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && templateId) {
      fetchTemplate();
    }
  }, [autoFetch, templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    fetchTemplate,
    fetchHistory,
    publish,
    archive,
    deleteTemplate,
    copyTemplate,
    refresh: fetchTemplate,
  };
}

/**
 * State interface for script template create/edit operations.
 */
export interface ScriptTemplateFormState {
  /** Whether form submission is in progress */
  submitting: boolean;
  /** Validation errors by field */
  validationErrors: Record<string, string>;
  /** General submission error */
  error: string | null;
  /** Content validation result */
  contentValidation: {
    isValid: boolean;
    issues: Array<{
      type: string;
      message: string;
      position?: number;
      length?: number;
    }>;
  } | null;
}

/**
 * Hook for creating and updating script templates.
 * Includes real-time content validation.
 * @returns Object containing form state and action methods
 */
export function useScriptTemplateForm() {
  const http = useHttp();
  const repository = useMemo(() => createScriptTemplateRepository(http), [http]);

  const [state, setState] = useState<ScriptTemplateFormState>({
    submitting: false,
    validationErrors: {},
    error: null,
    contentValidation: null,
  });

  /**
   * Creates a new script template.
   * @param data - Template creation data
   * @returns Promise resolving to created template or null on failure
   */
  const create = useCallback(
    async (data: CreateScriptTemplateRequest): Promise<ScriptTemplate | null> => {
      setState((prev) => ({
        ...prev,
        submitting: true,
        error: null,
        validationErrors: {},
      }));

      try {
        const template = await repository.createScriptTemplate(data);
        setState((prev) => ({ ...prev, submitting: false }));
        return template;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [repository]
  );

  /**
   * Updates an existing script template.
   * @param id - Template ID to update
   * @param data - Template update data
   * @returns Promise resolving to updated template or null on failure
   */
  const update = useCallback(
    async (id: string, data: UpdateScriptTemplateRequest): Promise<ScriptTemplate | null> => {
      setState((prev) => ({
        ...prev,
        submitting: true,
        error: null,
        validationErrors: {},
      }));

      try {
        const template = await repository.updateScriptTemplate(id, data);
        setState((prev) => ({ ...prev, submitting: false }));
        return template;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [repository]
  );

  /**
   * Validates script content without saving.
   * @param content - Content to validate
   * @returns Promise resolving to validation result
   */
  const validateContent = useCallback(
    async (content: string): Promise<boolean> => {
      try {
        const result = await repository.validateScriptContent(content);
        setState((prev) => ({ ...prev, contentValidation: result }));
        return result.isValid;
      } catch (error) {
        console.error('Content validation failed:', error);
        return false;
      }
    },
    [repository]
  );

  /**
   * Clears form state and errors.
   */
  const reset = useCallback(() => {
    setState({
      submitting: false,
      validationErrors: {},
      error: null,
      contentValidation: null,
    });
  }, []);

  /**
   * Sets a field validation error.
   */
  const setFieldError = useCallback((field: string, message: string) => {
    setState((prev) => ({
      ...prev,
      validationErrors: {
        ...prev.validationErrors,
        [field]: message,
      },
    }));
  }, []);

  /**
   * Clears a specific field error.
   */
  const clearFieldError = useCallback((field: string) => {
    setState((prev) => {
      const { [field]: _, ...rest } = prev.validationErrors;
      return { ...prev, validationErrors: rest };
    });
  }, []);

  return {
    state,
    create,
    update,
    validateContent,
    reset,
    setFieldError,
    clearFieldError,
  };
}
