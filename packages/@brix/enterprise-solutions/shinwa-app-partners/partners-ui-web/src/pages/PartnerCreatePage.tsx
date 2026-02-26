/**
 * @file Partner Create Page
 * @description Page for creating a new partner
 * @module partners-ui-web/pages/PartnerCreatePage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation:
 * - Manages local form state for UI interactions
 * - Delegates data submission to ViewModel (usePartnerCreate hook)
 * - Performs client-side validation before submission
 * 
 * Architecture Path: View (PartnerCreatePage) → ViewModel (usePartnerCreate) → Repository → HttpCapability
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useState, useCallback, useMemo } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from '@brix/runtime-sdk-api-web';
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
const validateForm = (values: PartnerFormData): PartnerFormErrors => {
  const errors: PartnerFormErrors = {};
  
  // Required field validation
  if (!values.name.trim()) {
    errors.name = '请输入合作方名称';
  } else if (values.name.length < 2) {
    errors.name = '合作方名称至少需要2个字符';
  }
  
  if (!values.partnerType) {
    errors.partnerType = '请选择合作方类型';
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
  const navigate = useNavigate();
  
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
      if (window.confirm('您有未保存的更改，确定要离开吗？')) {
        navigateToList();
      }
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
    const errors = validateForm(formData);
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={handleBack}
            sx={{ mb: 1 }}
          >
            返回列表
          </Button>
          <Typography variant="h5" fontWeight="bold">
            新建合作方
          </Typography>
          <Typography variant="body2" color="text.secondary">
            填写合作方基本信息和资质证书
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
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
        />
      </Paper>
      
      {/* Certifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          资质证书
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          上传合作方的营业执照、医疗许可证等资质证明文件
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
          合作方创建成功！正在跳转到详情页...
        </Alert>
      </Snackbar>
    </Box>
  );
};
