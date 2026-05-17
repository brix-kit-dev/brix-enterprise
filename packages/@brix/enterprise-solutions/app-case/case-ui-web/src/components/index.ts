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
 * @file Components Index
 * @description Re-exports all components from the case module
 * @module @brix-sdk/enterprise-case-ui-web/components
 * @version 3.0.0
 *
 * @author Brix Team
 * @date 2026-02-23
 */

// ============================================================================
// Case Status/Priority Chips
// ============================================================================
export { CaseStatusChip, type CaseStatusChipProps } from './CaseStatusChip';
export { CasePriorityChip, type CasePriorityChipProps } from './CasePriorityChip';

// ============================================================================
// Case Card
// ============================================================================
export { CaseCard, type CaseCardProps } from './CaseCard';

// ============================================================================
// Node Stepper (for case detail page)
// ============================================================================
export { NodeStepper, type NodeStepperProps } from './NodeStepper';

// ============================================================================
// Tabs (for case detail page)
// ============================================================================
export { ScheduleTab, type ScheduleTabProps } from './ScheduleTab';
export { TimelineTab, type TimelineTabProps } from './TimelineTab';
export { ParameterTab, type ParameterTabProps } from './ParameterTab';

// ============================================================================
// MUI Components (v3.0.0 - New)
// ============================================================================
export { NodeProgressBar, type NodeProgressBarProps } from './NodeProgressBar';
export { NewCaseDialog, type NewCaseDialogProps } from './NewCaseDialog';
