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
 * @file Timeline Repository Implementation
 * @description Data access layer for case timeline-related API calls
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This repository handles timeline event retrieval for case audit trail.
 * Timeline is read-only from the frontend perspective.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { TimelineEventDTO } from '@brix-sdk/enterprise-case-shared';
import { CASE_API } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Timeline Query Parameters
 */
export interface TimelineQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Filter by event type */
  eventType?: string;
  /** Filter by date range - start */
  dateFrom?: string;
  /** Filter by date range - end */
  dateTo?: string;
}

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Timeline Repository Interface
 */
export interface TimelineRepository {
  /**
   * Get timeline events for a case
   * 
   * @param caseId - Parent case ID
   * @param params - Query parameters
   * @returns Array of timeline events
   */
  getEvents(caseId: number, params?: TimelineQueryParams): Promise<TimelineEventDTO[]>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Timeline Repository instance
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns TimelineRepository instance
 */
export function createTimelineRepository(http: HttpCapability): TimelineRepository {
  return {
    /**
     * Get timeline events for a case
     */
    async getEvents(caseId: number, params?: TimelineQueryParams): Promise<TimelineEventDTO[]> {
      const response = await http.request<TimelineEventDTO[]>({
        url: CASE_API.TIMELINE(caseId),
        method: 'GET',
        params: {
          page: params?.page,
          size: params?.size,
          eventType: params?.eventType,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      });
      return response.data;
    },
  };
}
