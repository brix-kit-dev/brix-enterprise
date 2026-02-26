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
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
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
    event: SelectChangeEvent<string>
  ) => {
    onChange(field, event.target.value);
  };
  
  // ========================================================================
  // Render
  // ========================================================================
  
  const isDisabled = readOnly || disabled;
  
  return (
    <Grid container spacing={3}>
      {/* Partner Name - Required */}
      <Grid item xs={12} md={6}>
        <TextField
          label="合作方名称"
          value={values.name}
          onChange={handleTextChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          fullWidth
          required
          disabled={isDisabled}
          inputProps={{ maxLength: 100 }}
          placeholder="请输入合作方名称"
        />
      </Grid>
      
      {/* Partner Short Name */}
      <Grid item xs={12} md={6}>
        <TextField
          label="简称"
          value={values.shortName}
          onChange={handleTextChange('shortName')}
          error={!!errors.shortName}
          helperText={errors.shortName}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 50 }}
          placeholder="请输入简称"
        />
      </Grid>
      
      {/* Partner Type - Required (Hidden in edit mode) */}
      {!hidePartnerType && (
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.partnerType} disabled={isDisabled}>
            <InputLabel id="partner-type-label">合作方类型</InputLabel>
            <Select
              labelId="partner-type-label"
              value={values.partnerType}
              onChange={handleSelectChange('partnerType')}
              label="合作方类型"
            >
              {PARTNER_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.partnerType && (
            <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: 3 }}>
              {errors.partnerType}
            </span>
          )}
        </Grid>
      )}
      
      {/* Contact Name */}
      <Grid item xs={12} md={6}>
        <TextField
          label="联系人"
          value={values.contactName}
          onChange={handleTextChange('contactName')}
          error={!!errors.contactName}
          helperText={errors.contactName}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 50 }}
          placeholder="请输入联系人姓名"
        />
      </Grid>
      
      {/* Contact Phone */}
      <Grid item xs={12} md={6}>
        <TextField
          label="联系电话"
          value={values.contactPhone}
          onChange={handleTextChange('contactPhone')}
          error={!!errors.contactPhone}
          helperText={errors.contactPhone}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 20 }}
          placeholder="请输入联系电话"
        />
      </Grid>
      
      {/* Contact Email */}
      <Grid item xs={12} md={6}>
        <TextField
          label="联系邮箱"
          type="email"
          value={values.contactEmail}
          onChange={handleTextChange('contactEmail')}
          error={!!errors.contactEmail}
          helperText={errors.contactEmail}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 100 }}
          placeholder="请输入联系邮箱"
        />
      </Grid>
      
      {/* Service Area */}
      <Grid item xs={12} md={6}>
        <TextField
          label="服务区域"
          value={values.serviceArea}
          onChange={handleTextChange('serviceArea')}
          error={!!errors.serviceArea}
          helperText={errors.serviceArea}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 200 }}
          placeholder="例如：华东地区、全国"
        />
      </Grid>
      
      {/* Address */}
      <Grid item xs={12}>
        <TextField
          label="详细地址"
          value={values.address}
          onChange={handleTextChange('address')}
          error={!!errors.address}
          helperText={errors.address}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 500 }}
          placeholder="请输入详细地址"
        />
      </Grid>
      
      {/* Description */}
      <Grid item xs={12}>
        <TextField
          label="描述"
          value={values.description}
          onChange={handleTextChange('description')}
          error={!!errors.description}
          helperText={errors.description}
          fullWidth
          multiline
          rows={3}
          disabled={isDisabled}
          inputProps={{ maxLength: 1000 }}
          placeholder="请输入合作方描述信息"
        />
      </Grid>
    </Grid>
  );
};
