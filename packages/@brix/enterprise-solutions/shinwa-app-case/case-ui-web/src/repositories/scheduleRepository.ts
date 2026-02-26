/**
 * @file Schedule Repository Implementation
 * @description Data access layer for case schedule-related API calls
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This repository handles schedule operations (days and items) within a case.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type { 
  ScheduleDayDTO,
  ScheduleItemDTO,
  CreateScheduleDayRequest,
  CreateScheduleItemRequest,
} from '@shinwa/case-shared';
import { CASE_API } from '@shinwa/case-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Schedule Repository Interface
 */
export interface ScheduleRepository {
  /**
   * Get all schedule days for a case
   * 
   * @param caseId - Parent case ID
   * @returns Array of schedule days with their items
   */
  getDays(caseId: number): Promise<ScheduleDayDTO[]>;

  /**
   * Create a schedule day
   * 
   * @param caseId - Parent case ID
   * @param request - Day creation parameters
   * @returns Created schedule day
   */
  createDay(caseId: number, request: CreateScheduleDayRequest): Promise<ScheduleDayDTO>;

  /**
   * Update a schedule day
   * 
   * @param caseId - Parent case ID
   * @param dayId - Day ID
   * @param request - Update parameters
   * @returns Updated schedule day
   */
  updateDay(caseId: number, dayId: number, request: Partial<CreateScheduleDayRequest>): Promise<ScheduleDayDTO>;

  /**
   * Delete a schedule day
   * 
   * @param caseId - Parent case ID
   * @param dayId - Day ID
   */
  deleteDay(caseId: number, dayId: number): Promise<void>;

  /**
   * Create a schedule item
   * 
   * @param caseId - Parent case ID
   * @param dayId - Parent day ID
   * @param request - Item creation parameters
   * @returns Created schedule item
   */
  createItem(caseId: number, dayId: number, request: CreateScheduleItemRequest): Promise<ScheduleItemDTO>;

  /**
   * Update a schedule item
   * 
   * @param caseId - Parent case ID
   * @param dayId - Parent day ID
   * @param itemId - Item ID
   * @param request - Update parameters
   * @returns Updated schedule item
   */
  updateItem(caseId: number, dayId: number, itemId: number, request: Partial<CreateScheduleItemRequest>): Promise<ScheduleItemDTO>;

  /**
   * Delete a schedule item
   * 
   * @param caseId - Parent case ID
   * @param dayId - Parent day ID
   * @param itemId - Item ID
   */
  deleteItem(caseId: number, dayId: number, itemId: number): Promise<void>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Schedule Repository instance
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns ScheduleRepository instance
 */
export function createScheduleRepository(http: HttpCapability): ScheduleRepository {
  return {
    /**
     * Get all schedule days for a case
     */
    async getDays(caseId: number): Promise<ScheduleDayDTO[]> {
      const response = await http.request<ScheduleDayDTO[]>({
        url: CASE_API.SCHEDULE_DAYS(caseId),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Create a schedule day
     */
    async createDay(caseId: number, request: CreateScheduleDayRequest): Promise<ScheduleDayDTO> {
      const response = await http.request<ScheduleDayDTO>({
        url: CASE_API.SCHEDULE_DAY_CREATE(caseId),
        method: 'POST',
        data: request,
      });
      return response.data;
    },

    /**
     * Update a schedule day
     */
    async updateDay(caseId: number, dayId: number, request: Partial<CreateScheduleDayRequest>): Promise<ScheduleDayDTO> {
      const response = await http.request<ScheduleDayDTO>({
        url: CASE_API.SCHEDULE_DAY_UPDATE(caseId, dayId),
        method: 'PUT',
        data: request,
      });
      return response.data;
    },

    /**
     * Delete a schedule day
     */
    async deleteDay(caseId: number, dayId: number): Promise<void> {
      await http.request<void>({
        url: CASE_API.SCHEDULE_DAY_DELETE(caseId, dayId),
        method: 'DELETE',
      });
    },

    /**
     * Create a schedule item
     */
    async createItem(caseId: number, dayId: number, request: CreateScheduleItemRequest): Promise<ScheduleItemDTO> {
      const response = await http.request<ScheduleItemDTO>({
        url: CASE_API.SCHEDULE_ITEM_CREATE(caseId, dayId),
        method: 'POST',
        data: request,
      });
      return response.data;
    },

    /**
     * Update a schedule item
     */
    async updateItem(caseId: number, dayId: number, itemId: number, request: Partial<CreateScheduleItemRequest>): Promise<ScheduleItemDTO> {
      const response = await http.request<ScheduleItemDTO>({
        url: CASE_API.SCHEDULE_ITEM_UPDATE(caseId, dayId, itemId),
        method: 'PUT',
        data: request,
      });
      return response.data;
    },

    /**
     * Delete a schedule item
     */
    async deleteItem(caseId: number, dayId: number, itemId: number): Promise<void> {
      await http.request<void>({
        url: CASE_API.SCHEDULE_ITEM_DELETE(caseId, dayId, itemId),
        method: 'DELETE',
      });
    },
  };
}
