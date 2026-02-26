/**
 * @file Case Module API Endpoints
 * @description API endpoint constants for the case module
 * @module @shinwa/case-shared/constants
 * @version 3.0.0
 * 
 * Design Notes:
 * All API endpoints are defined here and used by repositories.
 * This ensures consistency between frontend and backend expectations.
 */

/**
 * Base API path for the case module
 */
export const CASE_API_BASE = '/api/v1/cases';

/**
 * Base API path for templates
 */
export const TEMPLATE_API_BASE = '/api/v1/case-templates';

/**
 * Case API Endpoints
 * 
 * URL pattern functions that generate endpoint URLs.
 */
export const CASE_API = {
  /** List cases with pagination and filters */
  LIST: CASE_API_BASE,
  
  /** Get case by ID */
  DETAIL: (id: number) => `${CASE_API_BASE}/${id}`,
  
  /** Create new case */
  CREATE: CASE_API_BASE,
  
  /** Update case */
  UPDATE: (id: number) => `${CASE_API_BASE}/${id}`,
  
  /** Delete case */
  DELETE: (id: number) => `${CASE_API_BASE}/${id}`,
  
  /** Update case status */
  UPDATE_STATUS: (id: number) => `${CASE_API_BASE}/${id}/status`,
  
  // ========== Node Endpoints ==========
  
  /** Get case nodes */
  NODES: (caseId: number) => `${CASE_API_BASE}/${caseId}/nodes`,
  
  /** Get single node */
  NODE_DETAIL: (caseId: number, nodeId: number) => `${CASE_API_BASE}/${caseId}/nodes/${nodeId}`,
  
  /** Update node status */
  NODE_UPDATE_STATUS: (caseId: number, nodeId: number) => `${CASE_API_BASE}/${caseId}/nodes/${nodeId}/status`,
  
  // ========== Schedule Endpoints ==========
  
  /** Get schedule days */
  SCHEDULE_DAYS: (caseId: number) => `${CASE_API_BASE}/${caseId}/schedule/days`,
  
  /** Create schedule day */
  SCHEDULE_DAY_CREATE: (caseId: number) => `${CASE_API_BASE}/${caseId}/schedule/days`,
  
  /** Update schedule day */
  SCHEDULE_DAY_UPDATE: (caseId: number, dayId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}`,
  
  /** Delete schedule day */
  SCHEDULE_DAY_DELETE: (caseId: number, dayId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}`,
  
  /** Get schedule items for a day */
  SCHEDULE_ITEMS: (caseId: number, dayId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}/items`,
  
  /** Create schedule item */
  SCHEDULE_ITEM_CREATE: (caseId: number, dayId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}/items`,
  
  /** Update schedule item */
  SCHEDULE_ITEM_UPDATE: (caseId: number, dayId: number, itemId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}/items/${itemId}`,
  
  /** Delete schedule item */
  SCHEDULE_ITEM_DELETE: (caseId: number, dayId: number, itemId: number) => `${CASE_API_BASE}/${caseId}/schedule/days/${dayId}/items/${itemId}`,
  
  // ========== Timeline Endpoints ==========
  
  /** Get timeline events */
  TIMELINE: (caseId: number) => `${CASE_API_BASE}/${caseId}/timeline`,
  
  // ========== Parameter Endpoints ==========
  
  /** Get case parameters */
  PARAMETERS: (caseId: number) => `${CASE_API_BASE}/${caseId}/parameters`,
  
  /** Set parameter value */
  PARAMETER_SET: (caseId: number) => `${CASE_API_BASE}/${caseId}/parameters`,
  
  /** Update parameter value */
  PARAMETER_UPDATE: (caseId: number, key: string) => `${CASE_API_BASE}/${caseId}/parameters/${key}`,
  
  // ========== File Endpoints ==========
  
  /** Get case files */
  FILES: (caseId: number) => `${CASE_API_BASE}/${caseId}/files`,
  
  /** Upload file to case */
  FILE_UPLOAD: (caseId: number) => `${CASE_API_BASE}/${caseId}/files/upload`,
} as const;

/**
 * Template API Endpoints
 */
export const TEMPLATE_API = {
  /** List templates with pagination */
  LIST: TEMPLATE_API_BASE,
  
  /** Get template by ID */
  DETAIL: (id: number) => `${TEMPLATE_API_BASE}/${id}`,
  
  /** Create new template */
  CREATE: TEMPLATE_API_BASE,
  
  /** Update template */
  UPDATE: (id: number) => `${TEMPLATE_API_BASE}/${id}`,
  
  /** Delete template */
  DELETE: (id: number) => `${TEMPLATE_API_BASE}/${id}`,
  
  /** Activate template */
  ACTIVATE: (id: number) => `${TEMPLATE_API_BASE}/${id}/activate`,
  
  /** Deactivate template */
  DEACTIVATE: (id: number) => `${TEMPLATE_API_BASE}/${id}/deactivate`,
  
  /** Get template nodes */
  NODES: (id: number) => `${TEMPLATE_API_BASE}/${id}/nodes`,
  
  /** Add node to template */
  NODE_CREATE: (id: number) => `${TEMPLATE_API_BASE}/${id}/nodes`,
  
  /** Update template node */
  NODE_UPDATE: (templateId: number, nodeId: number) => `${TEMPLATE_API_BASE}/${templateId}/nodes/${nodeId}`,
  
  /** Delete template node */
  NODE_DELETE: (templateId: number, nodeId: number) => `${TEMPLATE_API_BASE}/${templateId}/nodes/${nodeId}`,
  
  /** Get parameter definitions */
  PARAMETERS: (id: number) => `${TEMPLATE_API_BASE}/${id}/parameters`,
} as const;

/**
 * Legacy API_ENDPOINTS constant for backward compatibility
 * 
 * @deprecated Use CASE_API and TEMPLATE_API instead
 */
export const API_ENDPOINTS = {
  LIST: CASE_API.LIST,
  DETAIL: CASE_API.DETAIL,
  CREATE: CASE_API.CREATE,
  UPDATE: CASE_API.UPDATE,
  DELETE: CASE_API.DELETE,
} as const;
