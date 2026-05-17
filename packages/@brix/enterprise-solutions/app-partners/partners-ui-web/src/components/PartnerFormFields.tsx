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
 * @file Partner Form Fields Component
 * @description Reusable form fields component for partner create/edit pages
 * @module partners-ui-web/components/PartnerFormFields
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders form input fields with proper validation
 * - Manages controlled form state via props
 * - Does not contain any business logic
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import type {
  PartnerType,
} from '../types';
import {
  PARTNER_TYPE_OPTIONS,
} from '../types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Partner form data structure
 * 
 * Contains all editable fields for partner create/edit operations.
 */
export interface PartnerFormData {
  /** Partner name (required) */
  name: string;
  /** Partner short name */
  shortName: string;
  /** Partner type (required) */
  partnerType: PartnerType | '';
  /** Contact person name */
  contactName: string;
  /** Contact phone number */
  contactPhone: string;
  /** Contact email address */
  contactEmail: string;
  /** Partner address */
  address: string;
  /** Service area description */
  serviceArea: string;
  /** Description/additional notes */
  description: string;
}

/**
 * Form validation errors
 */
export interface PartnerFormErrors {
  name?: string;
  shortName?: string;
  partnerType?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  serviceArea?: string;
  description?: string;
}

/**
 * PartnerFormFields component props
 */
export interface PartnerFormFieldsProps {
  /** Form data values */
  values: PartnerFormData;
  /** Form validation errors */
  errors?: PartnerFormErrors;
  /** Callback when form values change */
  onChange: (field: keyof PartnerFormData, value: string) => void;
  /** Whether form is in read-only mode */
  readOnly?: boolean;
  /** Whether form is in loading state (disables inputs) */
  disabled?: boolean;
  /** Whether to hide partner type select (for edit mode) */
  hidePartnerType?: boolean;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Partner Form Fields Component
 * 
 * A reusable set of form fields for partner data entry.
 * Used in both PartnerCreatePage and PartnerEditPage.
 * 
 * Features:
 * - Controlled inputs with value/onChange pattern
 * - Field validation error display
 * - Read-only mode support
 * - Responsive grid layout
 * 
 * Usage Example:
 * ```tsx
 * const [formData, setFormData] = useState<PartnerFormData>(initialData);
 * const [errors, setErrors] = useState<PartnerFormErrors>({});
 * 
 * <PartnerFormFields
 *   values={formData}
 *   errors={errors}
 *   onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
 * />
 * ```
 */
export const PartnerFormFields: React.FC<PartnerFormFieldsProps> = ({
  values,
  errors = {},
  onChange,
  readOnly = false,
  disabled = false,
  hidePartnerType = false,
}) => {
  // ========================================================================
  // UIAdapter Components
  // ========================================================================
  
  const { Box, Input, Select, Typography } = useUI();
  // i18n hook
  const { t } = useI18n('partners');
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle text field change
   */
  const handleTextChange = (field: keyof PartnerFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(field, event.target.value);
  };
  
  /**
   * Handle select field change  
   */
  const handleSelectChange = (field: keyof PartnerFormData) => (
    value: string
  ) => {
    onChange(field, value);
  };
  
  // ========================================================================
  // Render
  // ========================================================================
  
  const isDisabled = readOnly || disabled;
  
  return (
    <Box style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 24,
    }}>
      {/* Partner Name - Required */}
      <Box>
        <Input
          placeholder={t('form.name')}
          value={values.name}
          onChange={handleTextChange('name')}
          error={!!errors.name}
          disabled={isDisabled}
          maxLength={100}
        />
        {errors.name && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.name}</Typography>
        )}
      </Box>
      
      {/* Partner Short Name */}
      <Box>
        <Input
          placeholder={t('form.shortName')}
          value={values.shortName}
          onChange={handleTextChange('shortName')}
          error={!!errors.shortName}
          disabled={isDisabled}
          maxLength={50}
        />
        {errors.shortName && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.shortName}</Typography>
        )}
      </Box>
      
      {/* Partner Type - Required (Hidden in edit mode) */}
      {!hidePartnerType && (
        <Box>
          <Select
            placeholder={t('form.type')}
            value={values.partnerType}
            onChange={handleSelectChange('partnerType')}
            disabled={isDisabled}
            options={PARTNER_TYPE_OPTIONS.map((option) => ({
              label: t(option.labelKey),
              value: option.value,
            }))}
            style={{ width: '100%' }}
          />
          {errors.partnerType && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.partnerType}</Typography>
          )}
        </Box>
      )}
      
      {/* Contact Name */}
      <Box>
        <Input
          placeholder={t('form.contactName')}
          value={values.contactName}
          onChange={handleTextChange('contactName')}
          error={!!errors.contactName}
          disabled={isDisabled}
          maxLength={50}
        />
        {errors.contactName && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.contactName}</Typography>
        )}
      </Box>
      
      {/* Contact Phone */}
      <Box>
        <Input
          placeholder={t('form.contactPhone')}
          value={values.contactPhone}
          onChange={handleTextChange('contactPhone')}
          error={!!errors.contactPhone}
          disabled={isDisabled}
          maxLength={20}
        />
        {errors.contactPhone && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.contactPhone}</Typography>
        )}
      </Box>
      
      {/* Contact Email */}
      <Box>
        <Input
          placeholder={t('form.contactEmail')}
          value={values.contactEmail}
          onChange={handleTextChange('contactEmail')}
          error={!!errors.contactEmail}
          disabled={isDisabled}
          maxLength={100}
        />
        {errors.contactEmail && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.contactEmail}</Typography>
        )}
      </Box>
      
      {/* Service Area */}
      <Box>
        <Input
          placeholder={t('form.serviceArea')}
          value={values.serviceArea}
          onChange={handleTextChange('serviceArea')}
          error={!!errors.serviceArea}
          disabled={isDisabled}
          maxLength={200}
        />
        {errors.serviceArea && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.serviceArea}</Typography>
        )}
      </Box>
      
      {/* Address */}
      <Box style={{ gridColumn: 'span 2' }}>
        <Input
          placeholder={t('form.address')}
          value={values.address}
          onChange={handleTextChange('address')}
          error={!!errors.address}
          disabled={isDisabled}
          maxLength={500}
        />
        {errors.address && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.address}</Typography>
        )}
      </Box>
      
      {/* Description */}
      <Box style={{ gridColumn: 'span 2' }}>
        <Input
          placeholder={t('form.description')}
          value={values.description}
          onChange={handleTextChange('description')}
          error={!!errors.description}
          disabled={isDisabled}
          maxLength={1000}
          multiline
          rows={3}
        />
        {errors.description && (
          <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.description}</Typography>
        )}
      </Box>
    </Box>
  );
};
