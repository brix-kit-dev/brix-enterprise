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
 * @file Product Edit Page
 * @description Page for editing an existing product package (UIAdapter pattern)
 * @module products-ui-web/pages/ProductEditPage
 * @version 3.2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUI, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useParams } from 'react-router-dom';
import { useProductForm, type ProductFormData } from '../hooks/useProductForm';
import { usePartnerOptions } from '../hooks/usePartnerOptions';
import { ProductFormFields, type ProductFormErrors } from '../components/ProductFormFields';
import { ProductItemEditor, type ServiceItem } from '../components/ProductItemEditor';
import { PriceRange } from '../components/PriceRangeInput';
import type { ProductStatus } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ProductEditPageParams {
  id?: string;
}

interface LocalFormState {
  priceRange: PriceRange;
  serviceItems: ServiceItem[];
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_LABELS: Record<ProductStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: '#6B7280' },
  PENDING_REVIEW: { label: '待审核', color: '#F59E0B' },
  ACTIVE: { label: '已上架', color: '#22C55E' },
  INACTIVE: { label: '已下架', color: '#EF4444' },
  ARCHIVED: { label: '已归档', color: '#6B7280' },
};

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductEditPage: React.FC = () => {
  const { Box, Typography, Button, Card, Tabs, Tag, Alert, Spin, Modal, Icon } = useUI();
  const navigate = useNavigation();
  const params = useParams<ProductEditPageParams>();
  
  const productId = params.id ? parseInt(params.id, 10) : undefined;
  
  // ViewModel Hooks
  const {
    formData,
    product,
    loading,
    submitting,
    error,
    isDirty,
    updateField,
    updateFields,
    submit,
    reset,
    navigateToList,
  } = useProductForm({ id: productId });
  
  const {
    partners,
    loading: partnersLoading,
  } = usePartnerOptions();
  
  // Local State
  const [activeTab, setActiveTab] = useState(0);
  const [localState, setLocalState] = useState<LocalFormState>({
    priceRange: { type: 'fixed', currency: 'CNY' },
    serviceItems: [],
  });
  const [validationErrors, setValidationErrors] = useState<ProductFormErrors>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Initialize Local State from Product
  useEffect(() => {
    if (product) {
      const priceRange: PriceRange = {
        type: product.priceRange?.includes('-') ? 'range' : 'fixed',
        currency: product.currency || 'CNY',
        fixedValue: product.price,
      };
      
      if (product.priceRange) {
        const rangeMatch = product.priceRange.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          priceRange.type = 'range';
          priceRange.minValue = parseInt(rangeMatch[1], 10);
          priceRange.maxValue = parseInt(rangeMatch[2], 10);
        }
      }
      
      const serviceItems: ServiceItem[] = (product.serviceItems || []).map((itemStr, index) => {
        const parts = itemStr.split('|');
        return {
          id: `item-${index}`,
          name: parts[0] || '',
          category: (parts[1] as ServiceItem['category']) || 'OTHER',
          quantity: parseInt(parts[2], 10) || 1,
          unit: parts[3] || '',
          price: parts[4] ? parseFloat(parts[4]) : undefined,
        };
      });
      
      setLocalState({ priceRange, serviceItems });
    }
  }, [product]);
  
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
  const handleTabChange = (key: string) => {
    setActiveTab(parseInt(key, 10));
  };
  
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
  
  const validateForm = useCallback((): boolean => {
    const errors: ProductFormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = '产品名称不能为空';
    }
    if (!formData.partnerId) {
      errors.partnerId = '请选择关联合作方';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);
  
  const handleSave = async () => {
    if (!validateForm()) {
      setActiveTab(0);
      return;
    }
    
    const success = await submit();
    if (success) {
      setSnackbarMessage('产品信息已更新');
      setSnackbarOpen(true);
    }
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    try {
      setDeleteDialogOpen(false);
      setSnackbarMessage('产品已删除');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate.navigate('products:list');
      }, 1000);
    } catch (err) {
    } finally {
      setDeleting(false);
    }
  };
  
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('您有未保存的更改，确定要离开吗？')) {
        navigateToList();
      }
    } else {
      navigateToList();
    }
  };
  
  // Render: Product Not Found
  if (!productId) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert severity="error">
          产品ID无效，请检查访问路径
        </Alert>
        <Button
          variant="primary"
          onClick={() => navigate.navigate('products:list')}
          style={{ marginTop: 16 }}
        >
          返回产品列表
        </Button>
      </Box>
    );
  }
  
  // Render: Loading State
  if (loading) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Box style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin />
        </Box>
      </Box>
    );
  }
  
  // Render: Product Not Found After Load
  if (!loading && !product) {
    return (
      <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert severity="warning">
          未找到该产品，可能已被删除或不存在
        </Alert>
        <Button
          variant="primary"
          onClick={() => navigate.navigate('products:list')}
          style={{ marginTop: 16 }}
        >
          返回产品列表
        </Button>
      </Box>
    );
  }
  
  const statusInfo = product?.status ? STATUS_LABELS[product.status] : null;
  
  const tabItems = [
    { key: '0', label: <span><Icon name="info" size={16} style={{ marginRight: 4 }} />基本信息</span> },
    { key: '1', label: <span><Icon name="list_alt" size={16} style={{ marginRight: 4 }} />服务项目</span> },
    { key: '2', label: <span><Icon name="settings" size={16} style={{ marginRight: 4 }} />高级设置</span> },
  ];
  
  return (
    <Box style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <Box style={{ marginBottom: 24 }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Typography style={{ fontSize: 20, fontWeight: 600 }}>
            编辑产品: {product?.name}
          </Typography>
          {statusInfo && (
            <Tag style={{ backgroundColor: statusInfo.color, color: 'white' }}>
              {statusInfo.label}
            </Tag>
          )}
          {isDirty && (
            <Tag style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #D97706' }}>
              有未保存的更改
            </Tag>
          )}
        </Box>
        <Typography style={{ fontSize: 14, color: '#6B7280' }}>
          产品编码: {product?.code || '未设置'} | 创建时间: {product?.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}
        </Typography>
      </Box>
      
      <Box style={{ borderTop: '1px solid #E5E7EB', marginBottom: 24 }} />
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" style={{ marginBottom: 24 }}>
          {error.message}
        </Alert>
      )}
      
      {/* Main Content */}
      <Card style={{ marginBottom: 24 }}>
        <Tabs
          activeKey={String(activeTab)}
          onChange={handleTabChange}
          items={tabItems}
        />
        
        <Box style={{ padding: 24 }}>
          {/* Basic Info Tab */}
          {activeTab === 0 && (
            <ProductFormFields
              values={formFieldsValues}
              errors={validationErrors}
              onChange={handleFieldChange}
              partners={partners}
              partnersLoading={partnersLoading}
              disabled={submitting}
              hideProductType
            />
          )}
          
          {/* Service Items Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                配置此产品包含的服务项目。您可以添加、编辑、删除和排序服务项目。
              </Typography>
              <ProductItemEditor
                value={localState.serviceItems}
                onChange={handleServiceItemsChange}
                disabled={submitting}
              />
            </Box>
          )}
          
          {/* Advanced Settings Tab */}
          {activeTab === 2 && (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Product Statistics */}
              <Card style={{ padding: 24, border: '1px solid #E5E7EB' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Icon name="history" size={20} color="#6B7280" />
                  <Typography style={{ fontSize: 16, fontWeight: 600 }}>产品统计</Typography>
                </Box>
                <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>销量</Typography>
                    <Typography style={{ fontSize: 24, fontWeight: 600 }}>{product?.salesCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>浏览量</Typography>
                    <Typography style={{ fontSize: 24, fontWeight: 600 }}>{product?.viewCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>排序权重</Typography>
                    <Typography style={{ fontSize: 24, fontWeight: 600 }}>{product?.sortOrder ?? 0}</Typography>
                  </Box>
                </Box>
              </Card>
              
              {/* Danger Zone */}
              <Card style={{ padding: 24, border: '1px solid #EF4444', backgroundColor: '#FEF2F2' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Icon name="warning" size={20} color="#EF4444" />
                  <Typography style={{ fontSize: 16, fontWeight: 600, color: '#EF4444' }}>危险操作</Typography>
                </Box>
                <Typography style={{ color: '#6B7280', marginBottom: 16 }}>
                  删除产品后将无法恢复，请谨慎操作。
                </Typography>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteDialogOpen(true)}
                  style={{ borderColor: '#EF4444', color: '#EF4444' }}
                >
                  <Icon name="delete" size={18} style={{ marginRight: 4 }} />
                  删除产品
                </Button>
              </Card>
            </Box>
          )}
        </Box>
      </Card>
      
      {/* Action Buttons */}
      <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
          <Icon name="close" size={18} style={{ marginRight: 4 }} />
          取消
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? <Spin size="small" style={{ marginRight: 8 }} /> : <Icon name="save" size={18} style={{ marginRight: 4 }} />}
          保存更改
        </Button>
      </Box>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteDialogOpen}
        title="确认删除"
        onClose={() => setDeleteDialogOpen(false)}
        onCancel={() => setDeleteDialogOpen(false)}
        footer={
          <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}>
              确认删除
            </Button>
          </Box>
        }
      >
        <Typography>
          确定要删除产品 "{product?.name}" 吗？此操作无法撤销。
        </Typography>
      </Modal>
    </Box>
  );
};
