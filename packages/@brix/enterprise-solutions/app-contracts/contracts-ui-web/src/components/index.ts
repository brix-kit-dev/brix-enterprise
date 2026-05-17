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
 * @file Barrel export for components
 * @description Exports all UI components from the components module
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 */

// Status display components
export { ContractStatusChip } from './ContractStatusChip';
export type { ContractStatusChipProps } from './ContractStatusChip';

export { TemplateStatusChip } from './TemplateStatusChip';
export type { TemplateStatusChipProps } from './TemplateStatusChip';

// Card components
export { ContractCard } from './ContractCard';
export type { ContractCardProps } from './ContractCard';

// Timeline components
export { SignatureTimeline } from './SignatureTimeline';
export type { SignatureTimelineProps } from './SignatureTimeline';

// Editor components
export { TemplateVariableEditor } from './TemplateVariableEditor';
export type { TemplateVariableEditorProps } from './TemplateVariableEditor';

// Preview components
export { ContractPreview } from './ContractPreview';
export type { ContractPreviewProps } from './ContractPreview';
