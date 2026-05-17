/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Add Partner Dialog Component (UIAdapter pattern)
 * @description Modal dialog for creating a new partner
 * @module @brix-sdk/enterprise-partners-ui-web/components
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure View component following v3.0.4 blueprint:
 * - Form state managed internally
 * - Submission via callback prop (actual API call handled by parent)
 * - No direct API calls or hooks within component
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 *
 * @author Brix Platform Team
 * @date 2026-02-28
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { PARTNER_TYPE_COLORS, PARTNER_STATUS_COLORS } from '../theme';
import { PARTNER_TYPE_OPTIONS, PARTNER_STATUS_OPTIONS } from '../types';
import type { PartnerDTO, PartnerType, PartnerStatus } from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Partner type icons mapping
 */
const PARTNER_TYPE_ICONS: Record<PartnerType, string> = {
  HOSPITAL: 'local_hospital',
  HOTEL: 'hotel',
  TRANSPORT: 'directions_car',
  TRANSLATION: 'translate',
  OTHER: 'more_horiz',
};

// ============================================================================
// Props Interface
// ============================================================================

/**
 * AddPartnerDialog Props
 */
export interface AddPartnerDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler - receives form data */
  onSubmit: (data: Partial<PartnerDTO>) => Promise<void>;
  /** Loading state */
  loading?: boolean;
}

/**
 * Form state interface
 */
interface PartnerFormState {
  partnerType: PartnerType;
  status: PartnerStatus;
  name: string;
  shortName: string;
  address: string;
  serviceArea: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  certifications: string[];
  website: string;
}

/**
 * Initial form state
 */
const initialFormState: PartnerFormState = {
  partnerType: 'HOSPITAL',
  status: 'ACTIVE',
  name: '',
  shortName: '',
  address: '',
  serviceArea: '',
  contactPhone: '',
  contactEmail: '',
  description: '',
  certifications: [],
  website: '',
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Add Partner Dialog Component
 *
 * Provides a form dialog for creating new partners.
 * Manages form state internally and submits via callback.
 *
 * @param props Component props
 * @returns Add partner dialog element
 */
export const AddPartnerDialog: React.FC<AddPartnerDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  // UIAdapter hook
  const { Box, Typography, Button, Modal, Input, Tag, Icon } = useUI();
  // i18n hook
  const { t } = useI18n('partners');

  // Form state
  const [form, setForm] = useState<PartnerFormState>(initialFormState);
  const [certInput, setCertInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Reset form when dialog closes
   */
  const handleClose = useCallback(() => {
    setForm(initialFormState);
    setCertInput('');
    setErrors({});
    onClose();
  }, [onClose]);

  /**
   * Update form field
   */
  const updateField = useCallback(<K extends keyof PartnerFormState>(
    field: K,
    value: PartnerFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  /**
   * Handle type change
   */
  const handleTypeChange = useCallback((
    _: React.MouseEvent<HTMLElement>,
    newType: PartnerType | null
  ) => {
    if (newType) {
      updateField('partnerType', newType);
    }
  }, [updateField]);

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback((
    _: React.MouseEvent<HTMLElement>,
    newStatus: PartnerStatus | null
  ) => {
    if (newStatus) {
      updateField('status', newStatus);
    }
  }, [updateField]);

  /**
   * Add certification
   */
  const handleAddCert = useCallback(() => {
    const trimmed = certInput.trim();
    if (trimmed && !form.certifications.includes(trimmed)) {
      updateField('certifications', [...form.certifications, trimmed]);
      setCertInput('');
    }
  }, [certInput, form.certifications, updateField]);

  /**
   * Remove certification
   */
  const handleRemoveCert = useCallback((cert: string) => {
    updateField('certifications', form.certifications.filter(c => c !== cert));
  }, [form.certifications, updateField]);

  /**
   * Handle certification input keydown
   */
  const handleCertKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCert();
    }
  }, [handleAddCert]);

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }
    if (!form.address.trim()) {
      newErrors.address = t('validation.addressRequired');
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = t('validation.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const data: Partial<PartnerDTO> = {
      partnerType: form.partnerType,
      status: form.status,
      name: form.name.trim(),
      shortName: form.shortName.trim() || undefined,
      address: form.address.trim(),
      serviceArea: form.serviceArea.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      description: form.description.trim() || undefined,
      qualifications: {
        certifications: form.certifications,
        website: form.website.trim() || undefined,
      },
    };

    await onSubmit(data);
    handleClose();
  }, [form, validateForm, onSubmit, handleClose]);

  /**
   * Get type button style
   */
  const getTypeButtonStyle = useMemo(() => (type: PartnerType) => {
    const colors = PARTNER_TYPE_COLORS[type] ?? PARTNER_TYPE_COLORS.OTHER;
    const isSelected = form.partnerType === type;
    return {
      backgroundColor: isSelected ? colors.background : 'transparent',
      color: isSelected ? colors.text : '#6B7280',
      border: `1px solid ${isSelected ? colors.text : '#E5E7EB'}`,
      borderRadius: 20,
      padding: '6px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    };
  }, [form.partnerType]);

  /**
   * Get status button style
   */
  const getStatusButtonStyle = useMemo(() => (status: PartnerStatus) => {
    const colors = PARTNER_STATUS_COLORS[status] ?? PARTNER_STATUS_COLORS.DRAFT;
    const isSelected = form.status === status;
    return {
      backgroundColor: isSelected ? colors.background : 'transparent',
      color: isSelected ? colors.text : '#6B7280',
      border: `1px solid ${isSelected ? colors.text : '#E5E7EB'}`,
      borderRadius: 20,
      padding: '6px 16px',
      cursor: 'pointer',
    };
  }, [form.status]);

  const footer = (
    <Box style={{ display: 'flex', gap: 8, padding: 16 }}>
      <Button onClick={handleClose} disabled={loading}>
        {t('addDialog.cancel')}
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={loading}>
        {loading ? t('addDialog.submitting') : t('addDialog.confirm')}
      </Button>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      onCancel={handleClose}
      title={t('addDialog.title')}
      footer={footer}
      width={480}
    >
      <Box style={{ padding: 24 }}>
        {/* Partner Type Selection */}
        <Box style={{ marginBottom: 24 }}>
          <Typography style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            {t('addDialog.typeSection')}
          </Typography>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PARTNER_TYPE_OPTIONS.map(option => (
              <Box
                key={option.value}
                style={getTypeButtonStyle(option.value)}
                onClick={() => updateField('partnerType', option.value)}
              >
                <Icon name={PARTNER_TYPE_ICONS[option.value]} size={16} />
                <span>{t(option.labelKey)}</span>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Status Selection */}
        <Box style={{ marginBottom: 24 }}>
          <Typography style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            {t('addDialog.statusSection')}
          </Typography>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PARTNER_STATUS_OPTIONS.map(option => (
              <Box
                key={option.value}
                style={getStatusButtonStyle(option.value)}
                onClick={() => updateField('status', option.value)}
              >
                {t(option.labelKey)}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Name Fields */}
        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.name')}
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            error={!!errors.name}
          />
          {errors.name && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.name}</Typography>
          )}
        </Box>

        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.shortName')}
            value={form.shortName}
            onChange={e => updateField('shortName', e.target.value)}
          />
        </Box>

        {/* Address */}
        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.address')}
            value={form.address}
            onChange={e => updateField('address', e.target.value)}
            multiline
            rows={2}
            error={!!errors.address}
          />
          {errors.address && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.address}</Typography>
          )}
        </Box>

        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.serviceArea')}
            value={form.serviceArea}
            onChange={e => updateField('serviceArea', e.target.value)}
          />
        </Box>

        {/* Contact Info */}
        <Box style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.phone')}
            value={form.contactPhone}
            onChange={e => updateField('contactPhone', e.target.value)}
            style={{ flex: 1 }}
          />
          <Box style={{ flex: 1 }}>
            <Input
              placeholder={t('addDialog.email')}
              value={form.contactEmail}
              onChange={e => updateField('contactEmail', e.target.value)}
              error={!!errors.contactEmail}
            />
            {errors.contactEmail && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.contactEmail}</Typography>
            )}
          </Box>
        </Box>

        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.website')}
            value={form.website}
            onChange={e => updateField('website', e.target.value)}
          />
        </Box>

        {/* Certifications */}
        <Box style={{ marginBottom: 16 }}>
          <Typography style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            {t('addDialog.certSection')}
          </Typography>
          <Box style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input
              value={certInput}
              onChange={e => setCertInput(e.target.value)}
              onKeyDown={handleCertKeyDown}
              placeholder={t('addDialog.certPlaceholder')}
              endAdornment="add"
            />
          </Box>
          {form.certifications.length > 0 && (
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.certifications.map((cert) => (
                <Tag
                  key={cert}
                  closable
                  onClose={() => handleRemoveCert(cert)}
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: 'none',
                  }}
                >
                  {cert}
                </Tag>
              ))}
            </Box>
          )}
          <Typography style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            {t('addDialog.certCount', { count: form.certifications.length })}
          </Typography>
        </Box>

        {/* Description */}
        <Box style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('addDialog.descPlaceholder')}
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default AddPartnerDialog;
