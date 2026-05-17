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
 * @file Product Form Fields Component
 * @description Reusable form fields component for product create/edit pages (UIAdapter pattern)
 * @module products-ui-web/components/ProductFormFields
 * @version 3.2.0
 */

import React from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';
import type { ProductType } from '@brix-sdk/enterprise-products-shared';
import { PartnerSelector, type PartnerOption } from './PartnerSelector';
import { PriceRangeInput, type PriceRange } from './PriceRangeInput';

// ============================================================================
// Type Definitions
// ============================================================================

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'CHECKUP', label: '体检套餐' },
  { value: 'TREATMENT', label: '治疗套餐' },
  { value: 'TRANSLATION', label: '翻译套餐' },
  { value: 'TRANSPORT', label: '交通套餐' },
  { value: 'ACCOMMODATION', label: '住宿套餐' },
  { value: 'COMPOSITE', label: '综合套餐' },
];

export interface ProductFormData {
  name: string;
  code: string;
  description: string;
  type: ProductType | '';
  partnerId: number | undefined;
  categoryId?: number;
  priceRange: PriceRange;
  duration: string;
  remarks: string;
  coverImage: string;
  tags: string[];
  sortOrder: number;
}

export interface ProductFormErrors {
  name?: string;
  code?: string;
  description?: string;
  type?: string;
  partnerId?: string;
  priceRange?: string;
  duration?: string;
  remarks?: string;
  coverImage?: string;
  tags?: string;
  sortOrder?: string;
}

export interface ProductFormFieldsProps {
  values: ProductFormData;
  errors?: ProductFormErrors;
  onChange: (field: keyof ProductFormData, value: unknown) => void;
  partners: PartnerOption[];
  partnersLoading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hideProductType?: boolean;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  values,
  errors = {},
  onChange,
  partners,
  partnersLoading = false,
  readOnly = false,
  disabled = false,
  hideProductType = false,
}) => {
  const { Box, Typography, Input, Select } = useUI();

  // Event Handlers
  const handleTextChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(field, event.target.value);
  };

  const handleSelectChange = (field: keyof ProductFormData) => (value: string | number | (string | number)[]) => {
    onChange(field, String(value));
  };

  const handlePartnerChange = (partnerId: number | undefined, _partner: PartnerOption | null) => {
    onChange('partnerId', partnerId);
  };

  const handlePriceRangeChange = (priceRange: PriceRange) => {
    onChange('priceRange', priceRange);
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tagsStr = event.target.value;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    onChange('tags', tags);
  };

  const handleSortOrderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    onChange('sortOrder', isNaN(value) ? 0 : value);
  };

  // Product type options for Select
  const productTypeOptions = PRODUCT_TYPE_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  // Render
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Row 1: Name and Code */}
      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            产品名称 <span style={{ color: '#EF4444' }}>*</span>
          </Typography>
          <Input
            placeholder="请输入产品名称"
            value={values.name}
            onChange={handleTextChange('name')}
            disabled={disabled || readOnly}
            error={!!errors.name}
          />
          {errors.name && (
            <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
              {errors.name}
            </Typography>
          )}
        </Box>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            产品编码
          </Typography>
          <Input
            placeholder="自动生成或手动输入"
            value={values.code}
            onChange={handleTextChange('code')}
            disabled={disabled || readOnly}
          />
        </Box>
      </Box>

      {/* Row 2: Type and Partner */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {!hideProductType && (
          <Box>
            <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
              产品类型 <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <Select
              placeholder="请选择产品类型"
              value={values.type || undefined}
              onChange={handleSelectChange('type')}
              options={productTypeOptions}
              disabled={disabled || readOnly}
              style={{ width: '100%' }}
            />
            {errors.type && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                {errors.type}
              </Typography>
            )}
          </Box>
        )}
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            合作方 <span style={{ color: '#EF4444' }}>*</span>
          </Typography>
          <PartnerSelector
            value={values.partnerId}
            onChange={handlePartnerChange}
            partners={partners}
            loading={partnersLoading}
            disabled={disabled || readOnly}
            validationError={errors.partnerId}
          />
        </Box>
      </Box>

      {/* Row 3: Description */}
      <Box>
        <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
          产品描述
        </Typography>
        <Input
          placeholder="请输入产品描述"
          value={values.description}
          onChange={handleTextChange('description')}
          disabled={disabled || readOnly}
          style={{ minHeight: 80 }}
        />
      </Box>

      {/* Row 4: Price Range and Duration */}
      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            价格区间
          </Typography>
          <PriceRangeInput
            value={values.priceRange}
            onChange={handlePriceRangeChange}
            disabled={disabled || readOnly}
            error={errors.priceRange}
          />
        </Box>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            服务时长
          </Typography>
          <Input
            placeholder="例如：3天2夜"
            value={values.duration}
            onChange={handleTextChange('duration')}
            disabled={disabled || readOnly}
          />
        </Box>
      </Box>

      {/* Row 5: Cover Image */}
      <Box>
        <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
          封面图片
        </Typography>
        <Input
          placeholder="请输入图片URL"
          value={values.coverImage}
          onChange={handleTextChange('coverImage')}
          disabled={disabled || readOnly}
        />
      </Box>

      {/* Row 6: Tags and Sort Order */}
      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            标签
          </Typography>
          <Input
            placeholder="用逗号分隔多个标签"
            value={values.tags?.join(', ') || ''}
            onChange={handleTagsChange}
            disabled={disabled || readOnly}
          />
        </Box>
        <Box>
          <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
            排序权重
          </Typography>
          <Input
            type="number"
            placeholder="0"
            value={String(values.sortOrder || 0)}
            onChange={handleSortOrderChange}
            disabled={disabled || readOnly}
          />
        </Box>
      </Box>

      {/* Row 7: Remarks */}
      <Box>
        <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
          备注
        </Typography>
        <Input
          placeholder="请输入备注信息"
          value={values.remarks}
          onChange={handleTextChange('remarks')}
          disabled={disabled || readOnly}
          style={{ minHeight: 60 }}
        />
      </Box>
    </Box>
  );
};
