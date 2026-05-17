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
 * ViewModel hooks layer barrel exports for the Compliance UI Web module.
 * Provides centralized access to all ViewModel hooks.
 * @module compliance-ui-web/hooks
 */

// Script Template Hooks
export {
  useScriptTemplateList,
  useScriptTemplateDetail,
  useScriptTemplateForm,
} from './useScriptTemplate';
export type {
  ScriptTemplateListState,
  ScriptTemplateFilters,
  ScriptTemplateDetailState,
  ScriptTemplateFormState,
} from './useScriptTemplate';

// Forbidden Word Hooks
export {
  useForbiddenWordList,
  useForbiddenWordDetail,
  useForbiddenWordForm,
  useForbiddenWordBulkImport,
  useForbiddenWordExport,
} from './useForbiddenWord';
export type {
  ForbiddenWordListState,
  ForbiddenWordFilters,
  ForbiddenWordDetailState,
  ForbiddenWordFormState,
  BulkImportState,
} from './useForbiddenWord';

// Compliance Check Hooks
export {
  useComplianceCheck,
  useRealTimeComplianceCheck,
  useComplianceAuditList,
  useComplianceStatistics,
  useAuditExport,
} from './useComplianceCheck';
export type {
  ComplianceCheckState,
  RealTimeCheckConfig,
  RealTimeCheckState,
  AuditListState,
  AuditFilters,
} from './useComplianceCheck';
