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
 * @file Case Node Repository Implementation
 * @description Data access layer for case node-related API calls
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This repository handles workflow node operations within a case.
 * Nodes represent the steps in a case workflow.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  CaseNodeDTO,
  UpdateNodeStatusRequest,
} from '@brix-sdk/enterprise-case-shared';
import { CASE_API } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Case Node Repository Interface
 */
export interface CaseNodeRepository {
  /**
   * Get all nodes for a case
   * 
   * @param caseId - Parent case ID
   * @returns Array of case nodes
   */
  listByCaseId(caseId: number): Promise<CaseNodeDTO[]>;

  /**
   * Get a single node by ID
   * 
   * @param caseId - Parent case ID
   * @param nodeId - Node ID
   * @returns Node DTO
   */
  getById(caseId: number, nodeId: number): Promise<CaseNodeDTO>;

  /**
   * Update node status
   * 
   * @param caseId - Parent case ID
   * @param nodeId - Node ID
   * @param request - Status update parameters
   * @returns Updated node DTO
   */
  updateStatus(caseId: number, nodeId: number, request: UpdateNodeStatusRequest): Promise<CaseNodeDTO>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Case Node Repository instance
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns CaseNodeRepository instance
 */
export function createCaseNodeRepository(http: HttpCapability): CaseNodeRepository {
  return {
    /**
     * Get all nodes for a case
     */
    async listByCaseId(caseId: number): Promise<CaseNodeDTO[]> {
      const response = await http.request<CaseNodeDTO[]>({
        url: CASE_API.NODES(caseId),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Get a single node by ID
     */
    async getById(caseId: number, nodeId: number): Promise<CaseNodeDTO> {
      const response = await http.request<CaseNodeDTO>({
        url: CASE_API.NODE_DETAIL(caseId, nodeId),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Update node status
     */
    async updateStatus(caseId: number, nodeId: number, request: UpdateNodeStatusRequest): Promise<CaseNodeDTO> {
      const response = await http.request<CaseNodeDTO>({
        url: CASE_API.NODE_UPDATE_STATUS(caseId, nodeId),
        method: 'PATCH',
        data: request,
      });
      return response.data;
    },
  };
}
