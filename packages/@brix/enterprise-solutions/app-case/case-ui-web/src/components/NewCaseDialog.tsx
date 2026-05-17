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
 * @file New Case Dialog Component
 * @description Modal dialog for creating new case entries.
 *              Migrated to use UIAdapter components per v3.0.8 Blueprint Constraint 9.
 * @module @brix-sdk/enterprise-case-ui-web/components
 * @version 3.2.0
 *
 * Design Notes:
 * This component follows the v3.0.4 blueprint View layer architecture.
 * It receives creation handler via props and uses internal form state.
 *
 * Form Fields:
 * - Customer Name (required)
 * - Template Selection (required)
 * - Manager Assignment (optional)
 * - Preferred Language (optional)
 * - Notes (optional)
 *
 * Architecture Compliance (v3.0.8):
 * - View layer component using UIAdapter components via useUI() hook
 * - Form submission delegated to parent via onSuccess callback
 * - Uses useCaseCreate hook for actual API call
 * - No direct UI library imports - all UI components obtained through useUI()
 *
 * BrixUI Migration (Phase 4):
 * - Removed direct UI library imports
 * - Components obtained via useUI(): Modal, Box, Typography, Input, Select, Button, Alert, Card, Spin, Icon
 * - sx props converted to standard CSS style props
 * - Framework icons replaced with UIAdapter Icon component
 *
 * @author Brix Platform Team
 * @date 2026-03-18
 */

import React, { useState, useCallback } from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { useCaseCreate } from '../hooks/useCase';
import type { CreateCaseRequest } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * New Case Dialog Props
 */
export interface NewCaseDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when case is successfully created */
  onSuccess: () => void;
}

/**
 * Template option configuration
 */
interface TemplateOption {
  code: string;
  name: string;
  description: string;
  nodeCount: number;
}

/**
 * Form state type
 */
interface FormState {
  customerName: string;
  templateCode: string;
  managerId: string;
  preferredLanguage: string;
  notes: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available case templates
 */
const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    code: 'JP_CHECKUP',
    name: 'JP Checkup',
    description: 'Medical checkup service in Japan',
    nodeCount: 8,
  },
  {
    code: 'JP_TREATMENT',
    name: 'JP Treatment',
    description: 'Medical treatment service in Japan',
    nodeCount: 8,
  },
];

/**
 * Manager options (placeholder - should come from API)
 */
const MANAGER_OPTIONS = [
  { id: 'M001', name: 'Lin Xiaoyu' },
  { id: 'M002', name: 'Chen Zhiyuan' },
  { id: 'M003', name: 'Wang Ming' },
];

/**
 * Language options
 */
const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: 'Simplified Chinese' },
  { value: 'zh-TW', label: 'Traditional Chinese' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
];

/**
 * Default form values
 */
const DEFAULT_FORM: FormState = {
  customerName: '',
  templateCode: 'JP_CHECKUP',
  managerId: 'M001',
  preferredLanguage: 'zh-CN',
  notes: '',
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * New Case Dialog Component
 *
 * Modal dialog for creating new case entries. Provides a form with
 * template selection, customer information, and initial configuration.
 *
 * Uses UIAdapter components obtained via useUI() hook per v3.0.8 Blueprint.
 * All styling uses standard CSS properties via style prop instead of MUI sx.
 *
 * @param props - Component properties
 * @returns React element
 *
 * @example
 * ```tsx
 * <NewCaseDialog
 *   open={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onSuccess={() => {
 *     setShowDialog(false);
 *     refreshList();
 *   }}
 * />
 * ```
 */
export const NewCaseDialog: React.FC<NewCaseDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  // Obtain UI components from UIAdapter via runtime context
  const { Modal, Box, Typography, Input, Select, Button, Alert, Card, Spin, Icon } = useUI();

  // Form state
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  // Create hook from ViewModel layer
  const { create, isSubmitting: isCreating, error, resetError: clearError } = useCaseCreate();

  // =========================================================================
  // Form Handlers
  // =========================================================================

  /**
   * Handle form field change
   */
  const handleChange = useCallback((field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (error) clearError();
  }, [error, clearError]);

  /**
   * Handle select field change
   */
  const handleSelectChange = useCallback((field: keyof FormState) => (
    value: string
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  }, [error, clearError]);

  /**
   * Handle template card selection
   */
  const handleTemplateSelect = useCallback((code: string) => {
    setForm(prev => ({ ...prev, templateCode: code }));
    if (error) clearError();
  }, [error, clearError]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!form.customerName.trim()) {
      return;
    }

    const request: CreateCaseRequest = {
      customerName: form.customerName.trim(),
      templateCode: form.templateCode,
      assignedTo: form.managerId || undefined,
      preferredLanguage: form.preferredLanguage,
      remarks: form.notes || undefined,
    };

    try {
      await create(request);
      setForm(DEFAULT_FORM);
      onSuccess();
    } catch (err) {
      // Error is handled by hook
    }
  }, [form, create, onSuccess]);

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    if (!isCreating) {
      setForm(DEFAULT_FORM);
      clearError();
      onClose();
    }
  }, [isCreating, clearError, onClose]);

  // =========================================================================
  // Render Footer
  // =========================================================================

  const footer = (
    <Box style={{ display: 'flex', gap: 12, width: '100%' }}>
      <Button
        variant="secondary"
        onClick={handleClose}
        disabled={isCreating}
        style={{ flex: 1 }}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isCreating || !form.customerName.trim()}
        loading={isCreating}
        style={{ flex: 1 }}
      >
        {isCreating ? 'Creating...' : 'Create Case'}
      </Button>
    </Box>
  );

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <Modal
      open={open}
      title="New Case"
      onClose={handleClose}
      size="medium"
      footer={footer}
      confirmLoading={isCreating}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Error Alert */}
        {error && (
          <Alert type="error" closable onClose={clearError}>
            {error.message}
          </Alert>
        )}

        {/* Customer Name */}
        <Box>
          <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500, color: '#111827' }}>
            Customer Name *
          </Typography>
          <Input
            size="small"
            placeholder="Enter customer name"
            value={form.customerName}
            onChange={handleChange('customerName')}
            disabled={isCreating}
          />
        </Box>

        {/* Template Selection */}
        <Box>
          <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500, color: '#111827' }}>
            Case Template *
          </Typography>
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {TEMPLATE_OPTIONS.map(template => (
              <Card
                key={template.code}
                style={{
                  border: form.templateCode === template.code ? '2px solid #1976d2' : '1px solid #E5E7EB',
                  backgroundColor: form.templateCode === template.code ? '#EFF6FF' : '#FFFFFF',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => !isCreating && handleTemplateSelect(template.code)}
              >
                <Box style={{ padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="body2"
                      style={{
                        fontWeight: 500,
                        color: form.templateCode === template.code ? '#1976d2' : '#111827',
                      }}
                    >
                      {template.name}
                    </Typography>
                    <Typography variant="caption" style={{ color: '#6B7280' }}>
                      {template.nodeCount} nodes
                    </Typography>
                  </Box>
                  {form.templateCode === template.code && (
                    <Icon name="check" size={18} color="#1976d2" />
                  )}
                </Box>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Manager & Language Row */}
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Manager */}
          <Box>
            <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500, color: '#111827' }}>
              Case Manager
            </Typography>
            <Select
              value={form.managerId}
              onChange={handleSelectChange('managerId')}
              disabled={isCreating}
              options={MANAGER_OPTIONS.map(manager => ({
                value: manager.id,
                label: manager.name,
              }))}
            />
          </Box>

          {/* Language */}
          <Box>
            <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500, color: '#111827' }}>
              Preferred Language
            </Typography>
            <Select
              value={form.preferredLanguage}
              onChange={handleSelectChange('preferredLanguage')}
              disabled={isCreating}
              options={LANGUAGE_OPTIONS.map(lang => ({
                value: lang.value,
                label: lang.label,
              }))}
            />
          </Box>
        </Box>

        {/* Notes */}
        <Box>
          <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500, color: '#111827' }}>
            Notes
          </Typography>
          <Input
            size="small"
            placeholder="Initial requirements or notes..."
            value={form.notes}
            onChange={handleChange('notes')}
            disabled={isCreating}
          />
        </Box>

        {/* Info Box */}
        <Box
          style={{
            padding: 16,
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
          }}
        >
          <Typography variant="caption" style={{ color: '#6B7280' }}>
            After creation, the system will automatically:
          </Typography>
          <Box
            component="ul"
            style={{
              margin: 0,
              marginTop: 4,
              paddingLeft: 16,
              fontSize: '0.75rem',
              color: '#6B7280',
              lineHeight: 1.6,
            }}
          >
            <li>Generate case number (format: JP-CHECKUP-YYYYMMDD-XXXX)</li>
            <li>Initialize 8 workflow nodes (CASE_CREATE → CASE_CLOSE)</li>
            <li>Write CaseCreated event to Timeline</li>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default NewCaseDialog;
