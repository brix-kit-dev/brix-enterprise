/**
 * @file Partner Edit Page
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
 * 
 * Architecture Path: View (PartnerEditPage) → ViewModel (usePartnerEdit) → Repository → HttpCapability
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Stack,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePageParams } from '@brix/runtime-sdk-api-web';
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
const validateForm = (values: PartnerFormData): PartnerFormErrors => {
  const errors: PartnerFormErrors = {};
  
  // Required field validation
  if (!values.name.trim()) {
    errors.name = '请输入合作方名称';
  } else if (values.name.length < 2) {
    errors.name = '合作方名称至少需要2个字符';
  }
  
  // Email format validation
  if (values.contactEmail && !EMAIL_REGEX.test(values.contactEmail)) {
    errors.contactEmail = '请输入有效的邮箱地址';
  }
  
  // Phone format validation
  if (values.contactPhone && !PHONE_REGEX.test(values.contactPhone.replace(/\s/g, ''))) {
    errors.contactPhone = '请输入有效的手机号码';
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
  // ========================================================================
  // Route Parameters
  // ========================================================================
  
  const { id } = usePageParams<{ id: string }>();
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
      if (window.confirm('您有未保存的更改，确定要离开吗？')) {
        navigateToDetail();
      }
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
    const errors = validateForm(formData);
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
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="text" width={300} height={30} sx={{ mb: 3 }} />
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={400} />
        </Paper>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Error State
  // ========================================================================
  
  if (!partner && submitError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={navigateToList}>
          返回列表
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Not Found State
  // ========================================================================
  
  if (!partner) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">合作方不存在或已被删除</Alert>
        <Button startIcon={<BackIcon />} onClick={navigateToList} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Cannot Edit State
  // ========================================================================
  
  if (!canEdit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          该合作方已终止，无法编辑
        </Alert>
        <Button startIcon={<BackIcon />} onClick={navigateToDetail} sx={{ mt: 2 }}>
          返回详情
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render - Edit Form
  // ========================================================================
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={handleBack}
            sx={{ mb: 1 }}
          >
            返回详情
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              编辑合作方
            </Typography>
            <Chip
              label={getPartnerStatusLabel(partner.status)}
              color={getPartnerStatusColor(partner.status)}
              size="small"
            />
            <Chip
              label={getPartnerTypeLabel(partner.partnerType)}
              variant="outlined"
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
            {partner.partnerCode}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={submitting}
          >
            刷新
          </Button>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </Stack>
      </Box>
      
      {/* Error Alert */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {submitError}
        </Alert>
      )}
      
      {/* Basic Information Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          基本信息
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <PartnerFormFields
          values={formData}
          errors={formErrors}
          onChange={handleFieldChange}
          disabled={submitting}
          hidePartnerType={true}
        />
      </Paper>
      
      {/* Certifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          资质证书
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          管理合作方的营业执照、医疗许可证等资质证明文件
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <CertificationUploader
          certifications={certifications}
          onAdd={handleCertificationAdd}
          onRemove={handleCertificationRemove}
          loading={submitting}
        />
      </Paper>
      
      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowSuccessSnackbar(false)}
        >
          合作方信息更新成功！
        </Alert>
      </Snackbar>
    </Box>
  );
};
