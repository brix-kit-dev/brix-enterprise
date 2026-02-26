/**
 * @file Product Create Page
 * @description Page for creating a new product package
 * @module products-ui-web/pages/ProductCreatePage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders the product creation form
 * - Delegates business logic to useProductForm hook (ViewModel)
 * - Does not directly access Repository layer
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  SaveOutlined as SaveIcon,
  CancelOutlined as CancelIcon,
  NavigateNextOutlined as NextIcon,
  NavigateBeforeOutlined as BackIcon,
  ExpandMoreOutlined as ExpandIcon,
  ExpandLessOutlined as CollapseIcon,
} from '@mui/icons-material';
import { useNavigate } from '@brix/runtime-sdk-api-web';
import { useHttp } from '@brix/runtime-sdk-react';
import { useProductForm, type ProductFormData } from '../hooks/useProductForm';
import { ProductFormFields, type ProductFormErrors } from '../components/ProductFormFields';
import { ProductItemEditor, type ServiceItem } from '../components/ProductItemEditor';
import { PriceRange } from '../components/PriceRangeInput';
import { PartnerOption } from '../components/PartnerSelector';
import { createPartnerRepository } from '@shinwa/partners-ui-web/repositories';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Form step configuration
 */
interface FormStep {
  label: string;
  description: string;
}

/**
 * Extended form data for local state
 */
interface LocalFormState {
  priceRange: PriceRange;
  serviceItems: ServiceItem[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Form steps
 */
const FORM_STEPS: FormStep[] = [
  { label: '基本信息', description: '填写产品的基本信息' },
  { label: '服务项目', description: '配置产品包含的服务项目' },
  { label: '确认提交', description: '检查并提交' },
];

/**
 * Default price range
 */
const DEFAULT_PRICE_RANGE: PriceRange = {
  type: 'fixed',
  currency: 'CNY',
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Product Create Page Component
 * 
 * A multi-step form for creating new product packages.
 * 
 * Features:
 * - Step-by-step form wizard
 * - Form validation at each step
 * - Partner selection with search
 * - Service item configuration
 * - Price range setup
 * 
 * Architecture:
 * - Uses useProductForm hook as ViewModel
 * - Delegates all API operations to Repository
 * - Pure View layer implementation
 */
export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const httpCapability = useHttp();
  
  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
  const {
    formData,
    loading,
    submitting,
    error,
    updateField,
    updateFields,
    submit,
    reset,
    navigateToList,
  } = useProductForm();
  
  // ========================================================================
  // Local State
  // ========================================================================
  
  // Current step in the wizard
  const [activeStep, setActiveStep] = useState(0);
  
  // Local form state for complex nested components
  const [localState, setLocalState] = useState<LocalFormState>({
    priceRange: DEFAULT_PRICE_RANGE,
    serviceItems: [],
  });
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<ProductFormErrors>({});
  
  // Partner options for selector
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  
  // Sections expanded state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    serviceItems: true,
    pricing: true,
    summary: true,
  });
  
  // ========================================================================
  // Load Partners
  // ========================================================================
  
  useEffect(() => {
    const loadPartners = async () => {
      setPartnersLoading(true);
      try {
        const partnerRepo = createPartnerRepository(httpCapability);
        const result = await partnerRepo.getList({ page: 0, size: 100 });
        
        const options: PartnerOption[] = result.content.map((partner) => ({
          id: partner.id,
          name: partner.name,
          type: partner.type,
          status: partner.status,
        }));
        
        setPartners(options);
      } catch (err) {
        console.error('Failed to load partners:', err);
      } finally {
        setPartnersLoading(false);
      }
    };
    
    loadPartners();
  }, [httpCapability]);
  
  // ========================================================================
  // Form Data Mapping
  // ========================================================================
  
  /**
   * Map local form state to ProductFormFields format
   */
  const formFieldsValues = useMemo(() => ({
    name: formData.name,
    code: formData.code,
    description: formData.description,
    type: formData.type || '',
    partnerId: formData.partnerId,
    categoryId: formData.categoryId,
    priceRange: localState.priceRange,
    duration: formData.duration,
    remarks: formData.remarks,
    coverImage: formData.coverImage,
    tags: formData.tags,
    sortOrder: formData.sortOrder,
  }), [formData, localState.priceRange]);
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle form field change from ProductFormFields
   */
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    // Handle priceRange separately
    if (field === 'priceRange') {
      const priceRange = value as PriceRange;
      setLocalState((prev) => ({ ...prev, priceRange }));
      
      // Sync to hook form data
      if (priceRange.type === 'fixed' && priceRange.fixedValue !== undefined) {
        updateFields({
          price: priceRange.fixedValue,
          priceRange: `${priceRange.currency} ${priceRange.fixedValue}`,
          currency: priceRange.currency,
        });
      } else if (priceRange.type === 'range') {
        updateFields({
          price: priceRange.minValue,
          priceRange: `${priceRange.currency} ${priceRange.minValue ?? 0} - ${priceRange.maxValue ?? 0}`,
          currency: priceRange.currency,
        });
      }
      return;
    }
    
    // Handle standard fields
    updateField(field as keyof ProductFormData, value as ProductFormData[keyof ProductFormData]);
    
    // Clear validation error for the field
    if (validationErrors[field as keyof ProductFormErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [updateField, updateFields, validationErrors]);
  
  /**
   * Handle service items change
   */
  const handleServiceItemsChange = useCallback((items: ServiceItem[]) => {
    setLocalState((prev) => ({ ...prev, serviceItems: items }));
    
    // Sync to hook form data - convert ServiceItem[] to string[]
    const serviceItemStrings = items.map((item) => 
      `${item.name}|${item.category}|${item.quantity}|${item.unit}|${item.price ?? 0}`
    );
    updateField('serviceItems', serviceItemStrings);
  }, [updateField]);
  
  /**
   * Toggle section expansion
   */
  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  
  /**
   * Validate current step
   */
  const validateStep = useCallback((step: number): boolean => {
    const errors: ProductFormErrors = {};
    
    if (step === 0) {
      // Basic info validation
      if (!formData.name.trim()) {
        errors.name = '产品名称不能为空';
      }
      if (!formData.type) {
        errors.type = '请选择产品类型';
      }
      if (!formData.partnerId) {
        errors.partnerId = '请选择关联合作方';
      }
    } else if (step === 1) {
      // Service items validation (optional)
      // No required validation for service items
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);
  
  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };
  
  /**
   * Handle previous step
   */
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Final validation
    if (!validateStep(0) || !validateStep(1)) {
      setActiveStep(0);
      return;
    }
    
    const success = await submit();
    if (success) {
      navigate('/products');
    }
  };
  
  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigateToList();
  };
  
  // ========================================================================
  // Render Helpers
  // ========================================================================
  
  /**
   * Render step content
   */
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <ProductFormFields
              values={formFieldsValues}
              errors={validationErrors}
              onChange={handleFieldChange}
              partners={partners}
              partnersLoading={partnersLoading}
              disabled={submitting}
            />
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            {/* Service Items Section */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('serviceItems')}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  服务项目配置
                </Typography>
                <IconButton size="small">
                  {sectionsExpanded.serviceItems ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={sectionsExpanded.serviceItems}>
                <Box sx={{ mt: 2 }}>
                  <ProductItemEditor
                    value={localState.serviceItems}
                    onChange={handleServiceItemsChange}
                    disabled={submitting}
                  />
                </Box>
              </Collapse>
            </Paper>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
                onClick={() => toggleSection('summary')}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  确认产品信息
                </Typography>
                <IconButton size="small">
                  {sectionsExpanded.summary ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={sectionsExpanded.summary}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      产品名称
                    </Typography>
                    <Typography variant="body1">{formData.name || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      产品类型
                    </Typography>
                    <Typography variant="body1">{formData.type || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      关联合作方
                    </Typography>
                    <Typography variant="body1">
                      {partners.find((p) => p.id === formData.partnerId)?.name || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      价格
                    </Typography>
                    <Typography variant="body1">{formData.priceRange || '-'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="textSecondary">
                      产品描述
                    </Typography>
                    <Typography variant="body2">{formData.description || '暂无描述'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      服务项目数
                    </Typography>
                    <Typography variant="body1">{localState.serviceItems.length} 项</Typography>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          创建产品套餐
        </Typography>
        <Typography variant="body2" color="textSecondary">
          配置新的产品或服务套餐信息
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}
      
      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {FORM_STEPS.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1">{step.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  
                  {/* Step Actions */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                    {index > 0 && (
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        startIcon={<BackIcon />}
                        disabled={submitting}
                      >
                        上一步
                      </Button>
                    )}
                    
                    {index < FORM_STEPS.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<NextIcon />}
                        disabled={submitting}
                      >
                        下一步
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        startIcon={submitting ? <CircularProgress size={16} /> : <SaveIcon />}
                        disabled={submitting}
                      >
                        {submitting ? '提交中...' : '确认创建'}
                      </Button>
                    )}
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    <Button
                      variant="text"
                      color="inherit"
                      onClick={handleCancel}
                      startIcon={<CancelIcon />}
                      disabled={submitting}
                    >
                      取消
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}
    </Box>
  );
};

export default ProductCreatePage;
