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
 * @file Partner Edit Page (UIAdapter pattern)
 * @description Page for editing an existing partner
 * @module partners-ui-web/pages/PartnerEditPage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation:
 * - Loads partner data via usePartnerEdit hook
 * - Manages local form state derived from loaded partner
 * - Delegates data submission to ViewModel
 * - Performs client-side validation before submission
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useParams } from '@brix-sdk/shared-runtime-web/router';
import { usePartnerEdit } from '../hooks';
import {
  PartnerFormFields,
  type PartnerFormData,
  type PartnerFormErrors,
  CertificationUploader,
  type CertificationFile,
} from '../components';
import type { UpdatePartnerRequest } from '../types';
import { getPartnerTypeLabel, getPartnerStatusLabel, getPartnerStatusColor } from '../types';

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
// Component Implementation
// ============================================================================

/**
 * Partner Edit Page Component
 * 
 * Responsibilities:
 * - Load and display existing partner data
 * - Render partner edit form
 * - Manage local form state and validation
 * - Handle form submission via usePartnerEdit hook
 * - Manage certification file uploads
 * 
 * State Sources:
 * - partner, loading, submitting, error → usePartnerEdit hook
 * - formData, formErrors, certifications → Local UI state
 */
export const PartnerEditPage: React.FC = () => {
  // UIAdapter hook
  const { Box, Typography, Button, Card, Tag, Alert, Spin, Icon } = useUI();
  // i18n hook
  const { t } = useI18n('partners');
  // ========================================================================
  // Route Parameters
  // ========================================================================
  
  const { id } = useParams<{ id: string }>();
  const partnerId = id ? parseInt(id, 10) : 0;
  
  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    partner,
    loading,
    submitting,
    error: submitError,
    updateSuccess,
    updatePartner,
    refresh,
    clearError,
    navigateToList,
    navigateToDetail,
  } = usePartnerEdit(partnerId);
  
  // ========================================================================
  // Local State
  // ========================================================================
  
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    shortName: '',
    partnerType: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    serviceArea: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<PartnerFormErrors>({});
  const [certifications, setCertifications] = useState<CertificationFile[]>([]);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  // ========================================================================
  // Effects
  // ========================================================================
  
  /**
   * Initialize form data when partner is loaded
   */
  useEffect(() => {
    if (partner && !formInitialized) {
      setFormData({
        name: partner.name || '',
        shortName: partner.shortName || '',
        partnerType: partner.partnerType || '',
        contactName: partner.contactName || '',
        contactPhone: partner.contactPhone || '',
        contactEmail: partner.contactEmail || '',
        address: partner.address || '',
        serviceArea: partner.serviceArea || '',
        description: partner.description || '',
      });
      
      // Initialize certifications from partner qualifications
      // Note: Actual implementation depends on backend qualifications structure
      if (partner.qualifications && typeof partner.qualifications === 'object') {
        // TODO: Map backend qualifications to CertificationFile[] if needed
      }
      
      setFormInitialized(true);
    }
  }, [partner, formInitialized]);
  
  /**
   * Show success snackbar when update succeeds
   */
  useEffect(() => {
    if (updateSuccess) {
      setShowSuccessSnackbar(true);
      setHasUnsavedChanges(false);
    }
  }, [updateSuccess]);
  
  // ========================================================================
  // Derived State
  // ========================================================================
  
  /**
   * Check if form has required fields filled
   */
  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0;
  }, [formData.name]);
  
  /**
   * Check if partner can be edited (not terminated)
   */
  const canEdit = useMemo(() => {
    return partner && partner.status !== 'TERMINATED';
  }, [partner]);
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle form field change
   */
  const handleFieldChange = useCallback((field: keyof PartnerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
    } else {
      navigateToDetail();
    }
  }, [hasUnsavedChanges, navigateToDetail]);
  
  /**
   * Handle certification add
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
   * Handle certification remove
   */
  const handleCertificationRemove = useCallback((certificationId: string) => {
    setCertifications((prev) => prev.filter((c) => c.id !== certificationId));
    setHasUnsavedChanges(true);
  }, []);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    clearError();
    
    // Validate form
    const errors = validateForm(formData, t);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Prepare request data
    const request: UpdatePartnerRequest = {
      name: formData.name.trim(),
      shortName: formData.shortName.trim() || undefined,
      contactName: formData.contactName.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      address: formData.address.trim() || undefined,
      serviceArea: formData.serviceArea.trim() || undefined,
      description: formData.description.trim() || undefined,
      // TODO: Handle certification uploads separately
      qualifications: certifications.length > 0 ? {
        pending_files: certifications.filter(c => c.status === 'pending').map(c => ({
          certificationType: c.certificationType,
          certificationName: c.certificationName,
        })),
      } : undefined,
    };
    
    await updatePartner(request);
  }, [formData, certifications, updatePartner, clearError]);
  
  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setFormInitialized(false);
    await refresh();
  }, [refresh]);
  
  // ========================================================================
  // Render - Loading State
  // ========================================================================
  
  if (loading) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Box style={{ height: 40, width: 200, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 8 }} />
        <Box style={{ height: 30, width: 300, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 24 }} />
        <Card>
          <Box style={{ padding: 24 }}>
            <Box style={{ height: 400, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
          </Box>
        </Card>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Error State
  // ========================================================================
  
  if (!partner && submitError) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="error" style={{ marginBottom: 16 }}>{submitError}</Alert>
        <Button startIcon="arrow_back" onClick={navigateToList}>
          {t('edit.backToList')}
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Not Found State
  // ========================================================================
  
  if (!partner) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="warning">{t('edit.notFound')}</Alert>
        <Button startIcon="arrow_back" onClick={navigateToList} style={{ marginTop: 16 }}>
          {t('edit.backToList')}
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Cannot Edit State
  // ========================================================================
  
  if (!canEdit) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="warning">{t('edit.terminated')}</Alert>
        <Button startIcon="arrow_back" onClick={navigateToDetail} style={{ marginTop: 16 }}>
          {t('edit.backToDetail')}
        </Button>
      </Box>
    );
  }

  const statusColor = getPartnerStatusColor(partner.status) as 'success' | 'warning' | 'error' | 'default';
  
  // ========================================================================
  // Render - Edit Form
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
            {t('edit.backToDetail')}
          </Button>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Typography style={{ fontSize: 24, fontWeight: 'bold' }}>
              {t('edit.title')}
            </Typography>
            <Tag color={statusColor}>
              {getPartnerStatusLabel(partner.status, t)}
            </Tag>
            <Tag>
              {getPartnerTypeLabel(partner.partnerType, t)}
            </Tag>
          </Box>
          <Typography style={{ fontSize: 14, color: '#6B7280', fontFamily: 'monospace' }}>
            {partner.partnerCode}
          </Typography>
        </Box>
        <Box style={{ display: 'flex', gap: 16 }}>
          <Button
            startIcon="refresh"
            onClick={handleRefresh}
            disabled={submitting}
          >
            {t('edit.refresh')}
          </Button>
          <Button
            onClick={handleBack}
            disabled={submitting}
          >
            {t('edit.cancel')}
          </Button>
          <Button
            variant="primary"
            startIcon="save"
            loading={submitting}
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? t('edit.saving') : t('edit.save')}
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
            {t('edit.basicInfoTitle')}
          </Typography>
          <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24 }}>
            <PartnerFormFields
              values={formData}
              errors={formErrors}
              onChange={handleFieldChange}
              disabled={submitting}
              hidePartnerType={true}
            />
          </Box>
        </Box>
      </Card>
      
      {/* Certifications Section */}
      <Card style={{ marginBottom: 24 }}>
        <Box style={{ padding: 24 }}>
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {t('edit.certTitle')}
          </Typography>
          <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            {t('edit.certSubtitle')}
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
            {t('edit.success')}
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
              <Button onClick={() => setShowLeaveConfirm(false)}>{t('edit.cancel')}</Button>
              <Button variant="primary" onClick={() => { setShowLeaveConfirm(false); navigateToDetail(); }}>{t('list.actionConfirm')}</Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default PartnerEditPage;
