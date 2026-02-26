/**
 * @file Product Form Fields Component
 * @description Reusable form fields component for product create/edit pages
 * @module products-ui-web/components/ProductFormFields
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
  Chip,
  Box,
  Autocomplete,
  type SelectChangeEvent,
} from '@mui/material';
import type { ProductType } from '@shinwa/products-shared';
import { PartnerSelector, type PartnerOption } from './PartnerSelector';
import { PriceRangeInput, type PriceRange } from './PriceRangeInput';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product type options
 */
const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'CHECKUP', label: '体检套餐' },
  { value: 'TREATMENT', label: '治疗套餐' },
  { value: 'TRANSLATION', label: '翻译套餐' },
  { value: 'TRANSPORT', label: '交通套餐' },
  { value: 'ACCOMMODATION', label: '住宿套餐' },
  { value: 'COMPOSITE', label: '综合套餐' },
];

/**
 * Product form data structure
 */
export interface ProductFormData {
  /** Product name (required) */
  name: string;
  /** Product code */
  code: string;
  /** Product description */
  description: string;
  /** Product type (required) */
  type: ProductType | '';
  /** Partner ID (required) */
  partnerId: number | undefined;
  /** Category ID */
  categoryId?: number;
  /** Price range data */
  priceRange: PriceRange;
  /** Service duration description */
  duration: string;
  /** Additional remarks */
  remarks: string;
  /** Cover image URL */
  coverImage: string;
  /** Tags */
  tags: string[];
  /** Sort order */
  sortOrder: number;
}

/**
 * Form validation errors
 */
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

/**
 * ProductFormFields component props
 */
export interface ProductFormFieldsProps {
  /** Form data values */
  values: ProductFormData;
  /** Form validation errors */
  errors?: ProductFormErrors;
  /** Callback when form values change */
  onChange: (field: keyof ProductFormData, value: unknown) => void;
  /** Available partners for selection */
  partners: PartnerOption[];
  /** Whether partners are loading */
  partnersLoading?: boolean;
  /** Whether form is in read-only mode */
  readOnly?: boolean;
  /** Whether form is in loading state (disables inputs) */
  disabled?: boolean;
  /** Whether to hide product type select (for edit mode) */
  hideProductType?: boolean;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Product Form Fields Component
 * 
 * A reusable set of form fields for product data entry.
 * Used in both ProductCreatePage and ProductEditPage.
 * 
 * Features:
 * - Controlled inputs with value/onChange pattern
 * - Field validation error display
 * - Partner selector integration
 * - Price range input integration
 * - Tag autocomplete
 * 
 * Usage Example:
 * ```tsx
 * const [formData, setFormData] = useState<ProductFormData>(initialData);
 * const { partners, loading } = usePartnerOptions();
 * 
 * <ProductFormFields
 *   values={formData}
 *   errors={errors}
 *   onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
 *   partners={partners}
 *   partnersLoading={loading}
 * />
 * ```
 */
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
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle text field change
   */
  const handleTextChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(field, event.target.value);
  };
  
  /**
   * Handle select field change
   */
  const handleSelectChange = (field: keyof ProductFormData) => (
    event: SelectChangeEvent<string>
  ) => {
    onChange(field, event.target.value);
  };
  
  /**
   * Handle partner selection change
   */
  const handlePartnerChange = (partnerId: number | undefined, _partner: PartnerOption | null) => {
    onChange('partnerId', partnerId);
  };
  
  /**
   * Handle price range change
   */
  const handlePriceRangeChange = (priceRange: PriceRange) => {
    onChange('priceRange', priceRange);
  };
  
  /**
   * Handle tags change
   */
  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    onChange('tags', newValue);
  };
  
  /**
   * Handle number field change
   */
  const handleNumberChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value ? parseInt(event.target.value, 10) : 0;
    onChange(field, value);
  };
  
  // ========================================================================
  // Render
  // ========================================================================
  
  const isDisabled = readOnly || disabled;
  
  return (
    <Grid container spacing={3}>
      {/* Product Name - Required */}
      <Grid item xs={12} md={6}>
        <TextField
          label="产品名称"
          value={values.name}
          onChange={handleTextChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          fullWidth
          required
          disabled={isDisabled}
          inputProps={{ maxLength: 100 }}
          placeholder="请输入产品/套餐名称"
        />
      </Grid>
      
      {/* Product Code */}
      <Grid item xs={12} md={6}>
        <TextField
          label="产品编码"
          value={values.code}
          onChange={handleTextChange('code')}
          error={!!errors.code}
          helperText={errors.code || '留空将自动生成'}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 50 }}
          placeholder="例如：PKG-CHECKUP-001"
        />
      </Grid>
      
      {/* Product Type - Required (Hidden in edit mode) */}
      {!hideProductType && (
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.type} disabled={isDisabled}>
            <InputLabel id="product-type-label">产品类型</InputLabel>
            <Select
              labelId="product-type-label"
              value={values.type}
              onChange={handleSelectChange('type')}
              label="产品类型"
            >
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.type && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
              {errors.type}
            </Box>
          )}
        </Grid>
      )}
      
      {/* Partner Selector - Required */}
      <Grid item xs={12} md={6}>
        <PartnerSelector
          value={values.partnerId}
          onChange={handlePartnerChange}
          partners={partners}
          loading={partnersLoading}
          disabled={isDisabled}
          required
          validationError={errors.partnerId}
          label="关联合作方"
          placeholder="搜索并选择合作方..."
        />
      </Grid>
      
      {/* Description */}
      <Grid item xs={12}>
        <TextField
          label="产品描述"
          value={values.description}
          onChange={handleTextChange('description')}
          error={!!errors.description}
          helperText={errors.description}
          fullWidth
          multiline
          rows={3}
          disabled={isDisabled}
          inputProps={{ maxLength: 2000 }}
          placeholder="请输入产品/套餐详细描述"
        />
      </Grid>
      
      {/* Price Range */}
      <Grid item xs={12}>
        <PriceRangeInput
          value={values.priceRange}
          onChange={handlePriceRangeChange}
          disabled={isDisabled}
          error={errors.priceRange}
          label="价格设置"
          helperText="设置产品的定价信息"
        />
      </Grid>
      
      {/* Duration */}
      <Grid item xs={12} md={6}>
        <TextField
          label="服务周期"
          value={values.duration}
          onChange={handleTextChange('duration')}
          error={!!errors.duration}
          helperText={errors.duration}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 100 }}
          placeholder="例如：3天2晚、5个工作日"
        />
      </Grid>
      
      {/* Sort Order */}
      <Grid item xs={12} md={6}>
        <TextField
          label="排序权重"
          type="number"
          value={values.sortOrder}
          onChange={handleNumberChange('sortOrder')}
          error={!!errors.sortOrder}
          helperText={errors.sortOrder || '数字越大排序越靠前'}
          fullWidth
          disabled={isDisabled}
          inputProps={{ min: 0, max: 9999 }}
        />
      </Grid>
      
      {/* Cover Image URL */}
      <Grid item xs={12}>
        <TextField
          label="封面图片URL"
          value={values.coverImage}
          onChange={handleTextChange('coverImage')}
          error={!!errors.coverImage}
          helperText={errors.coverImage || '输入封面图片的URL地址'}
          fullWidth
          disabled={isDisabled}
          inputProps={{ maxLength: 500 }}
          placeholder="https://example.com/image.jpg"
        />
      </Grid>
      
      {/* Tags */}
      <Grid item xs={12}>
        <Autocomplete
          multiple
          freeSolo
          options={['热销', '推荐', '新品', '限时优惠', '体检', '治疗', '医美', '康复']}
          value={values.tags}
          onChange={handleTagsChange}
          disabled={isDisabled}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="标签"
              placeholder="输入或选择标签"
              error={!!errors.tags}
              helperText={errors.tags || '按回车添加自定义标签'}
            />
          )}
        />
      </Grid>
      
      {/* Remarks */}
      <Grid item xs={12}>
        <TextField
          label="备注"
          value={values.remarks}
          onChange={handleTextChange('remarks')}
          error={!!errors.remarks}
          helperText={errors.remarks}
          fullWidth
          multiline
          rows={2}
          disabled={isDisabled}
          inputProps={{ maxLength: 500 }}
          placeholder="内部备注信息（不对外展示）"
        />
      </Grid>
    </Grid>
  );
};
