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
 * @file Add Product Dialog Component
 * @description Modal dialog for creating new product/package (UIAdapter pattern)
 * @module @brix-sdk/enterprise-products-ui-web/components
 * @version 3.2.0
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import React, { useState, useCallback } from 'react';
import { useUI, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { PRODUCT_TYPE_CONFIG } from '../theme';
import type { ProductType } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Props Interface
// ============================================================================

export interface AddProductFormData {
  nameCn: string;
  productType: ProductType;
  priceMin: string;
  priceMax: string;
  durationDays: string;
  currency: string;
}

export interface AddProductFormErrors {
  nameCn?: string;
  productType?: string;
  priceMin?: string;
  priceMax?: string;
  durationDays?: string;
}

export interface AddProductDialogProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: AddProductFormData) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_CONFIG) as ProductType[];

const INITIAL_FORM_DATA: AddProductFormData = {
  nameCn: '',
  productType: 'CHECKUP',
  priceMin: '',
  priceMax: '',
  durationDays: '',
  currency: 'JPY',
};

// ============================================================================
// Component Implementation
// ============================================================================

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const { Box, Typography, Button, Input, Modal, Spin, Icon } = useUI();
  // Constraint #9 (BrixUI Unified Governance): tokens for brand color, never hard-coded hex.
  const { tokens } = useTheme();

  // State
  const [formData, setFormData] = useState<AddProductFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<AddProductFormErrors>({});

  // Event Handlers
  const handleTextChange = useCallback(
    (field: keyof AddProductFormData) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev: AddProductFormData) => ({ ...prev, [field]: event.target.value }));
        if (errors[field as keyof AddProductFormErrors]) {
          setErrors((prev: AddProductFormErrors) => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const handleTypeSelect = useCallback((type: ProductType) => {
    setFormData((prev: AddProductFormData) => ({ ...prev, productType: type }));
    if (errors.productType) {
      setErrors((prev: AddProductFormErrors) => ({ ...prev, productType: undefined }));
    }
  }, [errors.productType]);

  const validateForm = useCallback((): boolean => {
    const newErrors: AddProductFormErrors = {};

    if (!formData.nameCn.trim()) {
      newErrors.nameCn = '请输入套餐名称';
    }

    if (!formData.productType) {
      newErrors.productType = '请选择套餐类型';
    }

    if (formData.priceMin && isNaN(Number(formData.priceMin))) {
      newErrors.priceMin = '请输入有效数字';
    }

    if (formData.priceMax && isNaN(Number(formData.priceMax))) {
      newErrors.priceMax = '请输入有效数字';
    }

    if (
      formData.priceMin &&
      formData.priceMax &&
      Number(formData.priceMin) > Number(formData.priceMax)
    ) {
      newErrors.priceMax = '最高报价应大于最低报价';
    }

    if (formData.durationDays) {
      const days = Number(formData.durationDays);
      if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
        newErrors.durationDays = '请输入有效的天数';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch {
    }
  }, [formData, validateForm, onSubmit]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      onClose();
    }
  }, [submitting, onClose]);

  // Render
  return (
    <Modal
      open={open}
      onClose={handleClose}
      onCancel={handleClose}
      title={null}
      footer={null}
      width={480}
    >
      {/* Header */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Typography style={{ fontWeight: 600, color: '#111827', fontSize: 18 }}>
          新增套餐产品
        </Typography>
        <Button
          variant="text"
          onClick={handleClose}
          disabled={submitting}
          style={{ padding: 8, borderRadius: 8 }}
        >
          <Icon name="close" size={20} color="#9CA3AF" />
        </Button>
      </Box>

      {/* Form Fields */}
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Product Name */}
        <Box>
          <Typography style={{ color: '#4B5563', marginBottom: 4, fontSize: 14 }}>
            套餐名称（中文）<span style={{ color: '#EF4444' }}>*</span>
          </Typography>
          <Input
            placeholder="请输入套餐名称"
            value={formData.nameCn}
            onChange={handleTextChange('nameCn')}
            disabled={submitting}
            style={{ borderRadius: 8 }}
          />
          {errors.nameCn && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
              {errors.nameCn}
            </Typography>
          )}
        </Box>

        {/* Product Type Selection */}
        <Box>
          <Typography style={{ color: '#4B5563', marginBottom: 8, fontSize: 14 }}>
            套餐类型 <span style={{ color: '#EF4444' }}>*</span>
          </Typography>
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PRODUCT_TYPES.map((type) => {
              const config = PRODUCT_TYPE_CONFIG[type];
              const isSelected = formData.productType === type;
              return (
                <Button
                  key={type}
                  variant="secondary"
                  onClick={() => handleTypeSelect(type)}
                  disabled={submitting}
                  style={{
                    padding: '6px 4px',
                    border: `2px solid ${isSelected ? tokens.colors.brand.primary : '#E5E7EB'}`,
                    borderRadius: 8,
                    backgroundColor: isSelected ? tokens.colors.brand.primaryLight : 'transparent',
                    color: isSelected ? tokens.colors.brand.primaryContrast : '#4B5563',
                    fontSize: 12,
                    fontWeight: isSelected ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {config.label}
                </Button>
              );
            })}
          </Box>
          {errors.productType && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
              {errors.productType}
            </Typography>
          )}
        </Box>

        {/* Price Inputs */}
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Box>
            <Typography style={{ color: '#4B5563', marginBottom: 4, fontSize: 14 }}>
              最低报价
            </Typography>
            <Input
              placeholder="JPY"
              value={formData.priceMin}
              onChange={handleTextChange('priceMin')}
              disabled={submitting}
              style={{ borderRadius: 8 }}
            />
            {errors.priceMin && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                {errors.priceMin}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography style={{ color: '#4B5563', marginBottom: 4, fontSize: 14 }}>
              最高报价
            </Typography>
            <Input
              placeholder="JPY"
              value={formData.priceMax}
              onChange={handleTextChange('priceMax')}
              disabled={submitting}
              style={{ borderRadius: 8 }}
            />
            {errors.priceMax && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                {errors.priceMax}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography style={{ color: '#4B5563', marginBottom: 4, fontSize: 14 }}>
              天数
            </Typography>
            <Input
              placeholder="天"
              value={formData.durationDays}
              onChange={handleTextChange('durationDays')}
              disabled={submitting}
              style={{ borderRadius: 8 }}
            />
            {errors.durationDays && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                {errors.durationDays}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Spin size="small" style={{ marginRight: 8 }} /> : null}
          保存套餐
        </Button>
      </Box>
    </Modal>
  );
};
