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
 * @file Template Repository Implementation
 * @description Data access layer for case template-related API calls
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This repository handles CRUD operations for case templates.
 * Templates define the workflow structure for new cases.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  CaseTemplateDTO,
  CaseTemplateSummary,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  PagedResponse,
} from '@brix-sdk/enterprise-case-shared';
import { TEMPLATE_API } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Template Repository Interface
 */
export interface TemplateRepository {
  /**
   * Get paginated list of templates
   * 
   * @param params - Query parameters
   * @returns Paginated response containing template summaries
   */
  list(params?: TemplateQueryParams): Promise<PagedResponse<CaseTemplateSummary>>;

  /**
   * Get template details by ID
   * 
   * @param id - Template ID
   * @returns Full template DTO including nodes and parameters
   */
  getById(id: number): Promise<CaseTemplateDTO>;

  /**
   * Create a new template
   * 
   * @param request - Template creation parameters
   * @returns Created template DTO
   */
  create(request: CreateTemplateRequest): Promise<CaseTemplateDTO>;

  /**
   * Update a template
   * 
   * @param id - Template ID
   * @param request - Update parameters
   * @returns Updated template DTO
   */
  update(id: number, request: UpdateTemplateRequest): Promise<CaseTemplateDTO>;

  /**
   * Delete a template
   * 
   * @param id - Template ID
   */
  delete(id: number): Promise<void>;

  /**
   * Activate a template
   * 
   * @param id - Template ID
   * @returns Updated template DTO
   */
  activate(id: number): Promise<CaseTemplateDTO>;

  /**
   * Deactivate a template
   * 
   * @param id - Template ID
   * @returns Updated template DTO
   */
  deactivate(id: number): Promise<CaseTemplateDTO>;
}

// ============================================================================
// Repository Factory
// ============================================================================

/**
 * Create a Template Repository instance
 *
 * @param http - HttpCapability instance from RuntimeContext
 * @returns TemplateRepository instance
 */
export function createTemplateRepository(http: HttpCapability): TemplateRepository {
  return {
    /**
     * Get paginated list of templates
     */
    async list(params?: TemplateQueryParams): Promise<PagedResponse<CaseTemplateSummary>> {
      const response = await http.request<PagedResponse<CaseTemplateSummary>>({
        url: TEMPLATE_API.LIST,
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          category: params?.category,
          isActive: params?.isActive,
          keyword: params?.keyword,
        },
      });
      return response.data;
    },

    /**
     * Get template details by ID
     */
    async getById(id: number): Promise<CaseTemplateDTO> {
      const response = await http.request<CaseTemplateDTO>({
        url: TEMPLATE_API.DETAIL(id),
        method: 'GET',
      });
      return response.data;
    },

    /**
     * Create a new template
     */
    async create(request: CreateTemplateRequest): Promise<CaseTemplateDTO> {
      const response = await http.request<CaseTemplateDTO>({
        url: TEMPLATE_API.CREATE,
        method: 'POST',
        data: request,
      });
      return response.data;
    },

    /**
     * Update a template
     */
    async update(id: number, request: UpdateTemplateRequest): Promise<CaseTemplateDTO> {
      const response = await http.request<CaseTemplateDTO>({
        url: TEMPLATE_API.UPDATE(id),
        method: 'PUT',
        data: request,
      });
      return response.data;
    },

    /**
     * Delete a template
     */
    async delete(id: number): Promise<void> {
      await http.request<void>({
        url: TEMPLATE_API.DELETE(id),
        method: 'DELETE',
      });
    },

    /**
     * Activate a template
     */
    async activate(id: number): Promise<CaseTemplateDTO> {
      const response = await http.request<CaseTemplateDTO>({
        url: TEMPLATE_API.ACTIVATE(id),
        method: 'POST',
      });
      return response.data;
    },

    /**
     * Deactivate a template
     */
    async deactivate(id: number): Promise<CaseTemplateDTO> {
      const response = await http.request<CaseTemplateDTO>({
        url: TEMPLATE_API.DEACTIVATE(id),
        method: 'POST',
      });
      return response.data;
    },
  };
}
