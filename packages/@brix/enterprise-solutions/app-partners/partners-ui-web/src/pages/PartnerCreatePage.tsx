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
 * @file Partner Create Page (UIAdapter pattern)
 * @description Page for creating a new partner
 * @module partners-ui-web/pages/PartnerCreatePage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation:
 * - Manages local form state for UI interactions
 * - Delegates data submission to ViewModel (usePartnerCreate hook)
 * - Performs client-side validation before submission
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { usePartnerCreate } from '../hooks';
import {
  PartnerFormFields,
  type PartnerFormData,
  type PartnerFormErrors,
  CertificationUploader,
  type CertificationFile,
} from '../components';
import type { CreatePartnerRequest } from '../types';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex pattern (Chinese phone format)
 */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * Validate partner form data
 * 
 * @param values - Form data values
 * @returns Validation errors object (empty if valid)
 */
const validateForm = (values: PartnerFormData, t: (key: string) => string): PartnerFormErrors => {
  const errors: PartnerFormErrors = {};
  
  // Required field validation
  if (!values.name.trim()) {
    errors.name = t('validation.nameRequired');
  } else if (values.name.length < 2) {
    errors.name = t('validation.nameMinLength');
  }
  
  if (!values.partnerType) {
    errors.partnerType = t('validation.typeRequired');
  }
  
  // Email format validation
  if (values.contactEmail && !EMAIL_REGEX.test(values.contactEmail)) {
    errors.contactEmail = t('validation.emailInvalid');
  }
  
  // Phone format validation
  if (values.contactPhone && !PHONE_REGEX.test(values.contactPhone.replace(/\s/g, ''))) {
    errors.contactPhone = t('validation.phoneInvalid');
  }
  
  return errors;
};

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial form data state
 */
const INITIAL_FORM_DATA: PartnerFormData = {
  name: '',
  shortName: '',
  partnerType: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  serviceArea: '',
  description: '',
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Partner Create Page Component
 * 
 * Responsibilities:
 * - Render partner creation form
 * - Manage local form state and validation
 * - Handle form submission via usePartnerCreate hook
 * - Manage certification file uploads
 * 
 * State Sources:
 * - submitting, error → usePartnerCreate hook
 * - formData, errors, certifications → Local UI state
 */
export const PartnerCreatePage: React.FC = () => {
  // UIAdapter hook
  const { Box, Typography, Button, Card, Alert, Spin, Icon } = useUI();
  // i18n hook
  const { t } = useI18n('partners');
  
  // ========================================================================
  // ViewModel Hook - Get data state and action methods
  // ========================================================================
  
  const {
    submitting,
    error: submitError,
    createPartner,
    clearError,
    navigateToList,
    navigateToDetail,
  } = usePartnerCreate();
  
  // ========================================================================
  // Local State
  // ========================================================================
  
  const [formData, setFormData] = useState<PartnerFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<PartnerFormErrors>({});
  const [certifications, setCertifications] = useState<CertificationFile[]>([]);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  // ========================================================================
  // Derived State
  // ========================================================================
  
  /**
   * Check if form has required fields filled
   */
  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0 && formData.partnerType !== '';
  }, [formData.name, formData.partnerType]);
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle form field change
   * Updates form data and clears corresponding error
   */
  const handleFieldChange = useCallback((field: keyof PartnerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Handle back navigation
   * Confirms if there are unsaved changes
   */
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
    } else {
      navigateToList();
    }
  }, [hasUnsavedChanges, navigateToList]);
  
  /**
   * Handle certification file add
   * Adds a new certification file to the list (pending upload)
   */
  const handleCertificationAdd = useCallback((
    file: File,
    metadata: Omit<CertificationFile, 'id' | 'fileUrl' | 'status' | 'fileName' | 'fileType' | 'fileSize'>
  ) => {
    const newCert: CertificationFile = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      status: 'pending',
      ...metadata,
    };
    setCertifications((prev) => [...prev, newCert]);
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Handle certification file remove
   */
  const handleCertificationRemove = useCallback((certificationId: string) => {
    setCertifications((prev) => prev.filter((c) => c.id !== certificationId));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Handle form submission
   * Validates form and creates partner
   */
  const handleSubmit = useCallback(async () => {
    // Clear previous errors
    clearError();
    
    // Validate form
    const errors = validateForm(formData, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Prepare request data
    const request: CreatePartnerRequest = {
      name: formData.name.trim(),
      shortName: formData.shortName.trim() || undefined,
      partnerType: formData.partnerType as CreatePartnerRequest['partnerType'],
      contactName: formData.contactName.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      address: formData.address.trim() || undefined,
      serviceArea: formData.serviceArea.trim() || undefined,
      description: formData.description.trim() || undefined,
      // TODO: Handle certification uploads separately via FileCapability
      qualifications: certifications.length > 0 ? {
        pending_files: certifications.map(c => ({
          certificationType: c.certificationType,
          certificationName: c.certificationName,
        })),
      } : undefined,
    };
    
    // Submit
    const createdPartner = await createPartner(request);
    
    if (createdPartner) {
      setShowSuccessSnackbar(true);
      setHasUnsavedChanges(false);
      
      // Navigate to detail page after short delay
      setTimeout(() => {
        navigateToDetail(createdPartner.id);
      }, 1500);
    }
  }, [formData, certifications, createPartner, clearError, navigateToDetail]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <Box>
          <Button
            startIcon="arrow_back"
            onClick={handleBack}
            style={{ marginBottom: 8 }}
          >
            {t('create.backToList')}
          </Button>
          <Typography style={{ fontSize: 24, fontWeight: 'bold' }}>
            {t('create.title')}
          </Typography>
          <Typography style={{ fontSize: 14, color: '#6B7280' }}>
            {t('create.subtitle')}
          </Typography>
        </Box>
        <Box style={{ display: 'flex', gap: 16 }}>
          <Button
            onClick={handleBack}
            disabled={submitting}
          >
            {t('create.cancel')}
          </Button>
          <Button
            variant="primary"
            startIcon="save"
            loading={submitting}
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? t('create.saving') : t('create.save')}
          </Button>
        </Box>
      </Box>
      
      {/* Error Alert */}
      {submitError && (
        <Alert severity="error" closable onClose={clearError} style={{ marginBottom: 24 }}>{submitError}</Alert>
      )}
      
      {/* Basic Information Section */}
      <Card style={{ marginBottom: 24 }}>
        <Box style={{ padding: 24 }}>
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {t('create.basicInfoTitle')}
          </Typography>
          <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24 }}>
            <PartnerFormFields
              values={formData}
              errors={formErrors}
              onChange={handleFieldChange}
              disabled={submitting}
            />
          </Box>
        </Box>
      </Card>
      
      {/* Certifications Section */}
      <Card style={{ marginBottom: 24 }}>
        <Box style={{ padding: 24 }}>
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {t('create.certTitle')}
          </Typography>
          <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            {t('create.certSubtitle')}
          </Typography>
          <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24 }}>
            <CertificationUploader
              certifications={certifications}
              onAdd={handleCertificationAdd}
              onRemove={handleCertificationRemove}
              loading={submitting}
            />
          </Box>
        </Box>
      </Card>
      
      {/* Success Message */}
      {showSuccessSnackbar && (
        <Box style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <Alert
            severity="success"
            closable
            onClose={() => setShowSuccessSnackbar(false)}
          >
            {t('create.success')}
          </Alert>
        </Box>
      )}
      
      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <Box style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card style={{ padding: 24, maxWidth: 400 }}>
            <Typography style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {t('edit.leaveConfirm')}
            </Typography>
            <Box style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowLeaveConfirm(false)}>{t('create.cancel')}</Button>
              <Button variant="primary" onClick={() => { setShowLeaveConfirm(false); navigateToList(); }}>{t('list.actionConfirm')}</Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PartnerCreatePage;
