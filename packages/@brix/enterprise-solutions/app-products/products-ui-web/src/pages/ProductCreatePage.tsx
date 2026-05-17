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
 * @file Product Create Page
 * @description Page for creating a new product package (UIAdapter pattern)
 * @module products-ui-web/pages/ProductCreatePage
 * @version 3.2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useUI, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useProductForm, type ProductFormData } from '../hooks/useProductForm';
import { usePartnerOptions } from '../hooks/usePartnerOptions';
import { ProductFormFields, type ProductFormErrors } from '../components/ProductFormFields';
import { ProductItemEditor, type ServiceItem } from '../components/ProductItemEditor';
import { PriceRange } from '../components/PriceRangeInput';

// ============================================================================
// Type Definitions
// ============================================================================

interface FormStep {
  label: string;
  description: string;
}

interface LocalFormState {
  priceRange: PriceRange;
  serviceItems: ServiceItem[];
}

// ============================================================================
// Constants
// ============================================================================

const FORM_STEPS: FormStep[] = [
  { label: '基本信息', description: '填写产品的基本信息' },
  { label: '服务项目', description: '配置产品包含的服务项目' },
  { label: '确认提交', description: '检查并提交' },
];

const DEFAULT_PRICE_RANGE: PriceRange = {
  type: 'fixed',
  currency: 'CNY',
};

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductCreatePage: React.FC = () => {
  const { Box, Typography, Button, Card, Alert, Spin, Icon } = useUI();
  const navigate = useNavigation();
  
  // ViewModel Hooks
  const {
    formData,
    loading,
    submitting,
    error,
    updateField,
    updateFields,
    submit,
    navigateToList,
  } = useProductForm();
  
  const {
    partners,
    loading: partnersLoading,
  } = usePartnerOptions();
  
  // Local State
  const [activeStep, setActiveStep] = useState(0);
  const [localState, setLocalState] = useState<LocalFormState>({
    priceRange: DEFAULT_PRICE_RANGE,
    serviceItems: [],
  });
  const [validationErrors, setValidationErrors] = useState<ProductFormErrors>({});
  const [sectionsExpanded, setSectionsExpanded] = useState({
    serviceItems: true,
    pricing: true,
    summary: true,
  });
  
  // Form Data Mapping
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
  
  // Event Handlers
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    if (field === 'priceRange') {
      const priceRange = value as PriceRange;
      setLocalState((prev) => ({ ...prev, priceRange }));
      
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
    
    updateField(field as keyof ProductFormData, value as ProductFormData[keyof ProductFormData]);
    
    if (validationErrors[field as keyof ProductFormErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [updateField, updateFields, validationErrors]);
  
  const handleServiceItemsChange = useCallback((items: ServiceItem[]) => {
    setLocalState((prev) => ({ ...prev, serviceItems: items }));
    
    const serviceItemStrings = items.map((item) => 
      `${item.name}|${item.category}|${item.quantity}|${item.unit}|${item.price ?? 0}`
    );
    updateField('serviceItems', serviceItemStrings);
  }, [updateField]);
  
  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  
  const validateStep = useCallback((step: number): boolean => {
    const errors: ProductFormErrors = {};
    
    if (step === 0) {
      if (!formData.name.trim()) {
        errors.name = '产品名称不能为空';
      }
      if (!formData.type) {
        errors.type = '请选择产品类型';
      }
      if (!formData.partnerId) {
        errors.partnerId = '请选择关联合作方';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setActiveStep(0);
      return;
    }
    
    const success = await submit();
    if (success) {
      navigate.navigate('products:list');
    }
  };
  
  const handleCancel = () => {
    navigateToList();
  };
  
  // Render Step Content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box style={{ marginTop: 16 }}>
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
          <Box style={{ marginTop: 16 }}>
            <Card style={{ padding: 16, border: '1px solid #E5E7EB' }}>
              <Box
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('serviceItems')}
              >
                <Typography style={{ fontSize: 16, fontWeight: 500 }}>
                  服务项目配置
                </Typography>
                <Icon
                  name={sectionsExpanded.serviceItems ? 'expand_less' : 'expand_more'}
                  size={24}
                  color="#6B7280"
                />
              </Box>
              
              {sectionsExpanded.serviceItems && (
                <Box style={{ marginTop: 16 }}>
                  <ProductItemEditor
                    value={localState.serviceItems}
                    onChange={handleServiceItemsChange}
                    disabled={submitting}
                  />
                </Box>
              )}
            </Card>
          </Box>
        );
        
      case 2:
        return (
          <Box style={{ marginTop: 16 }}>
            <Card style={{ padding: 24, border: '1px solid #E5E7EB' }}>
              <Box
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('summary')}
              >
                <Typography style={{ fontSize: 16, fontWeight: 500 }}>
                  确认产品信息
                </Typography>
                <Icon
                  name={sectionsExpanded.summary ? 'expand_less' : 'expand_more'}
                  size={24}
                  color="#6B7280"
                />
              </Box>
              
              {sectionsExpanded.summary && (
                <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>产品名称</Typography>
                    <Typography>{formData.name || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>产品类型</Typography>
                    <Typography>{formData.type || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>关联合作方</Typography>
                    <Typography>
                      {partners.find((p) => p.id === formData.partnerId)?.name || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>价格</Typography>
                    <Typography>{formData.priceRange || '-'}</Typography>
                  </Box>
                  <Box style={{ gridColumn: '1 / -1' }}>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>产品描述</Typography>
                    <Typography style={{ fontSize: 14 }}>{formData.description || '暂无描述'}</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>服务项目数</Typography>
                    <Typography>{localState.serviceItems.length} 项</Typography>
                  </Box>
                </Box>
              )}
            </Card>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // Render
  return (
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <Box style={{ marginBottom: 24 }}>
        <Typography style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          创建产品套餐
        </Typography>
        <Typography style={{ fontSize: 14, color: '#6B7280' }}>
          配置新的产品或服务套餐信息
        </Typography>
      </Box>
      
      <Box style={{ borderTop: '1px solid #E5E7EB', marginBottom: 24 }} />
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" style={{ marginBottom: 24 }}>
          {error.message}
        </Alert>
      )}
      
      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin />
        </Box>
      ) : (
        <Card style={{ padding: 24 }}>
          {/* Stepper */}
          <Box style={{ marginBottom: 24 }}>
            <Box style={{ display: 'flex', gap: 24 }}>
              {FORM_STEPS.map((step, index) => (
                <Box
                  key={step.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: index <= activeStep ? 1 : 0.5,
                  }}
                >
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: index <= activeStep ? '#1976d2' : '#E5E7EB',
                      color: index <= activeStep ? 'white' : '#6B7280',
                      fontWeight: 600,
                    }}
                  >
                    {index < activeStep ? (
                      <Icon name="check" size={18} color="white" />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  <Box>
                    <Typography style={{ fontWeight: 500 }}>{step.label}</Typography>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>{step.description}</Typography>
                  </Box>
                  {index < FORM_STEPS.length - 1 && (
                    <Box style={{ width: 48, height: 2, backgroundColor: '#E5E7EB', marginLeft: 12 }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Step Content */}
          {renderStepContent(activeStep)}
          
          {/* Step Actions */}
          <Box style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {activeStep > 0 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={submitting}
              >
                <Icon name="navigate_before" size={18} style={{ marginRight: 4 }} />
                上一步
              </Button>
            )}
            
            {activeStep < FORM_STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={submitting}
              >
                下一步
                <Icon name="navigate_next" size={18} style={{ marginLeft: 4 }} />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Spin size="small" style={{ marginRight: 8 }} /> : <Icon name="save" size={18} style={{ marginRight: 4 }} />}
                确认创建
              </Button>
            )}
            
            <Box style={{ flexGrow: 1 }} />
            
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={submitting}
              style={{ color: '#6B7280' }}
            >
              <Icon name="close" size={18} style={{ marginRight: 4 }} />
              取消
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
};
