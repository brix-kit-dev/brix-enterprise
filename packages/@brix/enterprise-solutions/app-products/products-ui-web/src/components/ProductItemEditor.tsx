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
 * @file Product Item Editor Component
 * @description Reusable component for editing product service items (UIAdapter pattern)
 * @module products-ui-web/components/ProductItemEditor
 * @version 3.2.0
 */

import React, { useState, useCallback } from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// Type Definitions
// ============================================================================

export type ServiceItemCategory = 
  | 'EXAMINATION'
  | 'TREATMENT'
  | 'MEDICATION'
  | 'SERVICE'
  | 'ACCOMMODATION'
  | 'TRANSPORT'
  | 'OTHER';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  category: ServiceItemCategory;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  optional?: boolean;
  sortOrder: number;
}

export interface ProductItemEditorProps {
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
  maxItems?: number;
  defaultCurrency?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_OPTIONS: { value: ServiceItemCategory; label: string }[] = [
  { value: 'EXAMINATION', label: '检查项目' },
  { value: 'TREATMENT', label: '治疗项目' },
  { value: 'MEDICATION', label: '用药项目' },
  { value: 'SERVICE', label: '服务项目' },
  { value: 'ACCOMMODATION', label: '住宿项目' },
  { value: 'TRANSPORT', label: '交通项目' },
  { value: 'OTHER', label: '其他项目' },
];

const CATEGORY_COLORS: Record<ServiceItemCategory, string> = {
  EXAMINATION: '#3B82F6',
  TREATMENT: '#1976d2',
  MEDICATION: '#8B5CF6',
  SERVICE: '#22C55E',
  ACCOMMODATION: '#F59E0B',
  TRANSPORT: '#6B7280',
  OTHER: '#6B7280',
};

const INITIAL_ITEM_FORM = {
  name: '',
  description: '',
  category: 'EXAMINATION' as ServiceItemCategory,
  unit: '',
  quantity: 1,
  unitPrice: undefined as number | undefined,
  optional: false,
};

const getCategoryLabel = (category: ServiceItemCategory): string => {
  return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category;
};

const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductItemEditor: React.FC<ProductItemEditorProps> = ({
  items = [],
  onChange,
  readOnly = false,
  disabled = false,
  maxItems = 50,
  defaultCurrency = 'CNY',
}) => {
  const { Box, Typography, Button, Input, Select, Tag, Modal, Icon, Alert } = useUI();

  // Local State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState(INITIAL_ITEM_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Event Handlers
  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_ITEM_FORM);
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  const handleEditItem = useCallback((item: ServiceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unit: item.unit || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      optional: item.optional || false,
    });
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    const newItems = items.filter(item => item.id !== itemId);
    onChange(newItems.map((item, index) => ({ ...item, sortOrder: index })));
  }, [items, onChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems.map((item, i) => ({ ...item, sortOrder: i })));
  }, [items, onChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems.map((item, i) => ({ ...item, sortOrder: i })));
  }, [items, onChange]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = '请输入项目名称';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSaveItem = useCallback(() => {
    if (!validateForm()) return;

    if (editingItem) {
      // Update existing item
      const newItems = items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              description: formData.description,
              category: formData.category,
              unit: formData.unit,
              quantity: formData.quantity,
              unitPrice: formData.unitPrice,
              optional: formData.optional,
            }
          : item
      );
      onChange(newItems);
    } else {
      // Add new item
      const newItem: ServiceItem = {
        id: generateId(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unit: formData.unit,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        currency: defaultCurrency,
        optional: formData.optional,
        sortOrder: items.length,
      };
      onChange([...items, newItem]);
    }

    setDialogOpen(false);
  }, [editingItem, formData, items, onChange, validateForm, defaultCurrency]);

  const handleFormChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryOptions = CATEGORY_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  // Render
  return (
    <Box>
      {/* Header */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography style={{ fontSize: 14, color: '#6B7280' }}>
          共 {items.length} 个服务项目
        </Typography>
        <Button
          variant="primary"
          onClick={handleAddItem}
          disabled={disabled || readOnly || items.length >= maxItems}
        >
          <Icon name="add" size={18} style={{ marginRight: 4 }} />
          添加项目
        </Button>
      </Box>

      {/* Max items warning */}
      {items.length >= maxItems && (
        <Alert severity="warning" style={{ marginBottom: 16 }}>
          已达到最大项目数量 ({maxItems})
        </Alert>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <Box
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            border: '1px dashed #E5E7EB',
          }}
        >
          <Typography style={{ color: '#6B7280' }}>
            暂无服务项目，点击"添加项目"开始配置
          </Typography>
        </Box>
      ) : (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <Box
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 16,
                backgroundColor: 'white',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                gap: 16,
              }}
            >
              {/* Drag Handle */}
              <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Button
                  variant="text"
                  onClick={() => handleMoveUp(index)}
                  disabled={disabled || readOnly || index === 0}
                  style={{ padding: 4 }}
                >
                  <Icon name="arrow_upward" size={16} color={index === 0 ? '#D1D5DB' : '#6B7280'} />
                </Button>
                <Button
                  variant="text"
                  onClick={() => handleMoveDown(index)}
                  disabled={disabled || readOnly || index === items.length - 1}
                  style={{ padding: 4 }}
                >
                  <Icon name="arrow_downward" size={16} color={index === items.length - 1 ? '#D1D5DB' : '#6B7280'} />
                </Button>
              </Box>

              {/* Item Content */}
              <Box style={{ flex: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography style={{ fontWeight: 500 }}>{item.name}</Typography>
                  <Tag
                    style={{
                      backgroundColor: CATEGORY_COLORS[item.category] + '20',
                      color: CATEGORY_COLORS[item.category],
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {getCategoryLabel(item.category)}
                  </Tag>
                  {item.optional && (
                    <Tag style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                      可选
                    </Tag>
                  )}
                </Box>
                {item.description && (
                  <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                    {item.description}
                  </Typography>
                )}
                <Box style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {item.quantity && (
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                      数量: {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </Typography>
                  )}
                  {item.unitPrice && (
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                      单价: ¥{item.unitPrice.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Actions */}
              <Box style={{ display: 'flex', gap: 4 }}>
                <Button
                  variant="text"
                  onClick={() => handleEditItem(item)}
                  disabled={disabled || readOnly}
                  style={{ padding: 8 }}
                >
                  <Icon name="edit" size={18} color="#6B7280" />
                </Button>
                <Button
                  variant="text"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={disabled || readOnly}
                  style={{ padding: 8 }}
                >
                  <Icon name="delete" size={18} color="#EF4444" />
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Modal
        open={dialogOpen}
        title={editingItem ? '编辑服务项目' : '添加服务项目'}
        onClose={() => setDialogOpen(false)}
        onCancel={() => setDialogOpen(false)}
        footer={
          <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveItem}>
              保存
            </Button>
          </Box>
        }
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <Box>
            <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
              项目名称 <span style={{ color: '#EF4444' }}>*</span>
            </Typography>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('name', e.target.value)}
              placeholder="请输入项目名称"
            />
            {formErrors.name && (
              <Typography style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                {formErrors.name}
              </Typography>
            )}
          </Box>

          {/* Category */}
          <Box>
            <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
              项目分类
            </Typography>
            <Select
              value={formData.category}
              onChange={(value: string | number | (string | number)[]) => handleFormChange('category', String(value))}
              options={categoryOptions}
              style={{ width: '100%' }}
            />
          </Box>

          {/* Description */}
          <Box>
            <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
              描述
            </Typography>
            <Input
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('description', e.target.value)}
              placeholder="请输入项目描述"
            />
          </Box>

          {/* Quantity and Unit */}
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Box>
              <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
                数量
              </Typography>
              <Input
                type="number"
                value={String(formData.quantity)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('quantity', parseInt(e.target.value, 10) || 1)}
                placeholder="1"
              />
            </Box>
            <Box>
              <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
                单位
              </Typography>
              <Input
                value={formData.unit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('unit', e.target.value)}
                placeholder="次、天、人"
              />
            </Box>
          </Box>

          {/* Unit Price */}
          <Box>
            <Typography style={{ marginBottom: 8, fontWeight: 500 }}>
              单价 (可选)
            </Typography>
            <Input
              type="number"
              value={formData.unitPrice !== undefined ? String(formData.unitPrice) : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                handleFormChange('unitPrice', val ? parseFloat(val) : undefined);
              }}
              placeholder="请输入单价"
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
