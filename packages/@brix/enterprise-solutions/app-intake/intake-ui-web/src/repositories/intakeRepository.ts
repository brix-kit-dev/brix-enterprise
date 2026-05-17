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
 * @file Intake Repository Implementation
 * @description Data access layer for intake task API calls
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Repository layer encapsulates all data access logic following v3.0.4 architecture:
 * 1. Calls HttpCapability to make HTTP requests
 * 2. Data format conversion
 * 3. Standardized error handling
 *
 * Architecture Compliance (Red Line R3):
 * - All HTTP requests go through HttpCapability
 * - Direct use of fetch/axios is forbidden
 * - HttpCapability is injected via RuntimeContext
 *
 * @see HttpCapability defined in @brix-sdk/runtime-sdk-api-web
 * @author Brix Team
 * @date 2026-06-10
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type {
  IntakeTask,
  IntakeChecklistItem,
  CreateIntakeTaskRequest,
  UpdateIntakeTaskRequest,
  SubmitDocumentRequest,
  ReviewDocumentRequest,
  IntakeTaskFilter,
  PageResponse,
} from '@brix-sdk/enterprise-intake-shared';
import { INTAKE_API_ENDPOINTS } from '@brix-sdk/enterprise-intake-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Intake Repository Interface
 *
 * Defines the contract for intake data access operations.
 */
export interface IntakeRepository {
  /**
   * Get paginated list of intake tasks
   *
   * @param filter - Query parameters for filtering and pagination
   * @returns Paginated response containing intake tasks
   */
  listTasks(filter?: IntakeTaskFilter): Promise<PageResponse<IntakeTask>>;

  /**
   * Get intake task details by ID
   *
   * @param taskId - Task ID
   * @returns Full intake task with checklist items
   */
  getTaskById(taskId: number): Promise<IntakeTask>;

  /**
   * Get intake tasks by case ID
   *
   * @param caseId - Case ID
   * @returns List of intake tasks for the case
   */
  getTasksByCase(caseId: number): Promise<IntakeTask[]>;

  /**
   * Search intake tasks by keyword
   *
   * @param keyword - Search keyword
   * @param page - Page number
   * @param size - Page size
   * @returns Paginated search results
   */
  searchTasks(keyword: string, page?: number, size?: number): Promise<PageResponse<IntakeTask>>;

  /**
   * Create a new intake task
   *
   * @param request - Task creation parameters
   * @returns Created intake task
   */
  createTask(request: CreateIntakeTaskRequest): Promise<IntakeTask>;

  /**
   * Update an existing intake task
   *
   * @param taskId - Task ID
   * @param request - Update parameters
   * @returns Updated intake task
   */
  updateTask(taskId: number, request: UpdateIntakeTaskRequest): Promise<IntakeTask>;

  /**
   * Activate a draft intake task
   *
   * @param taskId - Task ID
   * @returns Activated intake task
   */
  activateTask(taskId: number): Promise<IntakeTask>;

  /**
   * Cancel an intake task
   *
   * @param taskId - Task ID
   * @returns Cancelled intake task
   */
  cancelTask(taskId: number): Promise<IntakeTask>;

  /**
   * Delete an intake task
   *
   * @param taskId - Task ID
   */
  deleteTask(taskId: number): Promise<void>;

  /**
   * Submit a document to a checklist item
   *
   * @param taskId - Task ID
   * @param request - Document submission parameters
   * @returns Updated checklist item
   */
  submitDocument(taskId: number, request: SubmitDocumentRequest): Promise<IntakeChecklistItem>;

  /**
   * Review a submitted document
   *
   * @param taskId - Task ID
   * @param request - Review parameters
   * @returns Updated checklist item
   */
  reviewDocument(taskId: number, request: ReviewDocumentRequest): Promise<IntakeChecklistItem>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create an Intake Repository instance
 *
 * Factory function that creates a repository bound to an HttpCapability instance.
 * This follows the dependency injection pattern required by v3.0.4 architecture.
 *
 * @param http - HttpCapability instance from runtime context
 * @returns IntakeRepository implementation
 *
 * @example
 * ```typescript
 * const { httpCapability } = useRuntimeContext();
 * const intakeRepo = createIntakeRepository(httpCapability);
 * const tasks = await intakeRepo.listTasks();
 * ```
 */
export function createIntakeRepository(http: HttpCapability): IntakeRepository {
  return {
    /**
     * List intake tasks with pagination and filters
     */
    async listTasks(filter?: IntakeTaskFilter): Promise<PageResponse<IntakeTask>> {
      const params = new URLSearchParams();

      if (filter) {
        if (filter.customerId !== undefined) params.append('customerId', String(filter.customerId));
        if (filter.status) params.append('status', filter.status);
        if (filter.reviewerId) params.append('reviewerId', filter.reviewerId);
        if (filter.dueDateFrom) params.append('dueDateFrom', filter.dueDateFrom);
        if (filter.dueDateTo) params.append('dueDateTo', filter.dueDateTo);
        if (filter.page !== undefined) params.append('page', String(filter.page));
        if (filter.size !== undefined) params.append('size', String(filter.size));
        if (filter.sort) params.append('sort', filter.sort);
        if (filter.direction) params.append('direction', filter.direction);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${INTAKE_API_ENDPOINTS.TASKS}?${queryString}`
        : INTAKE_API_ENDPOINTS.TASKS;

      const data = await http.get<PageResponse<IntakeTask>>(url);
      if (data && Array.isArray(data.content)) {
        return data;
      }
      return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true } as PageResponse<IntakeTask>;
    },

    /**
     * Get task by ID
     */
    async getTaskById(taskId: number): Promise<IntakeTask> {
      return http.get<IntakeTask>(INTAKE_API_ENDPOINTS.TASK_DETAIL(taskId));
    },

    /**
     * Get tasks by case ID
     */
    async getTasksByCase(caseId: number): Promise<IntakeTask[]> {
      const data = await http.get<IntakeTask[]>(INTAKE_API_ENDPOINTS.TASKS_BY_CASE(caseId));
      return Array.isArray(data) ? data : [];
    },

    /**
     * Search tasks by keyword
     */
    async searchTasks(
      keyword: string,
      page: number = 0,
      size: number = 20
    ): Promise<PageResponse<IntakeTask>> {
      const params = new URLSearchParams({
        keyword,
        page: String(page),
        size: String(size),
      });

      const data = await http.get<PageResponse<IntakeTask>>(
        `${INTAKE_API_ENDPOINTS.SEARCH}?${params.toString()}`
      );
      if (data && Array.isArray(data.content)) {
        return data;
      }
      return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true } as PageResponse<IntakeTask>;
    },

    /**
     * Create a new task
     */
    async createTask(request: CreateIntakeTaskRequest): Promise<IntakeTask> {
      return http.post<IntakeTask>(INTAKE_API_ENDPOINTS.TASKS, request);
    },

    /**
     * Update an existing task
     */
    async updateTask(taskId: number, request: UpdateIntakeTaskRequest): Promise<IntakeTask> {
      return http.put<IntakeTask>(
        INTAKE_API_ENDPOINTS.TASK_DETAIL(taskId),
        request
      );
    },

    /**
     * Activate a draft task
     */
    async activateTask(taskId: number): Promise<IntakeTask> {
      return http.post<IntakeTask>(INTAKE_API_ENDPOINTS.TASK_ACTIVATE(taskId));
    },

    /**
     * Cancel a task
     */
    async cancelTask(taskId: number): Promise<IntakeTask> {
      return http.post<IntakeTask>(INTAKE_API_ENDPOINTS.TASK_CANCEL(taskId));
    },

    /**
     * Delete a task
     */
    async deleteTask(taskId: number): Promise<void> {
      await http.delete(INTAKE_API_ENDPOINTS.TASK_DETAIL(taskId));
    },

    /**
     * Submit a document
     */
    async submitDocument(
      taskId: number,
      request: SubmitDocumentRequest
    ): Promise<IntakeChecklistItem> {
      return http.post<IntakeChecklistItem>(
        INTAKE_API_ENDPOINTS.SUBMIT_DOCUMENT(taskId),
        request
      );
    },

    /**
     * Review a document
     */
    async reviewDocument(
      taskId: number,
      request: ReviewDocumentRequest
    ): Promise<IntakeChecklistItem> {
      return http.post<IntakeChecklistItem>(
        INTAKE_API_ENDPOINTS.REVIEW_DOCUMENT(taskId),
        request
      );
    },
  };
}
