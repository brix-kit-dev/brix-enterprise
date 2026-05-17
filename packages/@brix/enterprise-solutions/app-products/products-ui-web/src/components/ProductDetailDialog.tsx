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
 * @file Product Detail Dialog Component
 * @description Modal dialog for displaying product/package details (UIAdapter pattern)
 * @module @brix-sdk/enterprise-products-ui-web/components
 * @version 3.2.0
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import React from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import {
  getProductTypeConfig,
  getProductStatusConfig,
  getMedicalCategoryConfig,
  formatPrice,
} from '../theme';
import type { Product } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Props Interface
// ============================================================================

export interface ProductDetailDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onBindToCase?: (product: Product) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductDetailDialog: React.FC<ProductDetailDialogProps> = ({
  open,
  product,
  onClose,
  onEdit,
  onBindToCase,
}) => {
  const { Box, Typography, Button, Tag, Modal, Icon } = useUI();

  if (!product) {
    return null;
  }

  // Configuration Lookups
  const typeConfig = getProductTypeConfig(product.type);
  const statusConfig = getProductStatusConfig(product.status);
  const categoryConfig = product.categoryName
    ? getMedicalCategoryConfig(product.categoryName)
    : null;

  // Event Handlers
  const handleEdit = () => {
    onEdit?.(product);
  };

  const handleBindToCase = () => {
    onBindToCase?.(product);
  };

  // Computed Values
  const durationDays = (() => {
    if (product.duration) {
      const match = product.duration.match(/(\d+)/);
      return match ? match[1] : product.duration;
    }
    return '—';
  })();

  // Render
  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={null}
      footer={null}
      width={520}
    >
      {/* Header: Badges and Close Button */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        {/* Left: Badges and Title */}
        <Box>
          {/* Badge Row */}
          <Box style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {/* Product Type Badge */}
            <Tag
              style={{
                height: 22,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
                padding: '0 8px',
                borderRadius: 4,
              }}
            >
              {typeConfig.label}
            </Tag>

            {/* Category Badge (if applicable) */}
            {categoryConfig && (
              <Tag
                style={{
                  height: 22,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: categoryConfig.bgColor,
                  color: categoryConfig.color,
                  padding: '0 8px',
                  borderRadius: 4,
                }}
              >
                {categoryConfig.label}
              </Tag>
            )}

            {/* Status Badge */}
            <Tag
              style={{
                height: 22,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
                padding: '0 8px',
                borderRadius: 4,
              }}
            >
              {statusConfig.label}
            </Tag>
          </Box>

          {/* Product Name (Chinese) */}
          <Typography
            style={{ fontWeight: 600, color: '#111827', fontSize: 18, lineHeight: 1.3 }}
          >
            {product.name}
          </Typography>

          {/* Product Name (Remarks as Japanese name placeholder) */}
          {product.remarks && (
            <Typography style={{ color: '#9CA3AF', marginTop: 4, fontSize: 14 }}>
              {product.remarks}
            </Typography>
          )}
        </Box>

        {/* Close Button */}
        <Button
          variant="text"
          onClick={onClose}
          style={{
            padding: 8,
            borderRadius: 8,
          }}
        >
          <Icon name="close" size={20} color="#9CA3AF" />
        </Button>
      </Box>

      {/* Content */}
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Price Grid: Min / Max / Duration */}
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Box
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <Typography
              style={{
                color: '#1976d2',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {formatPrice(product.price, product.currency)}
            </Typography>
            <Typography style={{ color: '#9CA3AF', marginTop: 4, fontSize: 12 }}>
              起始报价
            </Typography>
          </Box>
          <Box
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <Typography
              style={{
                color: '#1976d2',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {formatPrice(product.originalPrice, product.currency)}
            </Typography>
            <Typography style={{ color: '#9CA3AF', marginTop: 4, fontSize: 12 }}>
              最高报价
            </Typography>
          </Box>
          <Box
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <Typography
              style={{
                color: '#374151',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {durationDays}
            </Typography>
            <Typography style={{ color: '#9CA3AF', marginTop: 4, fontSize: 12 }}>
              预计天数
            </Typography>
          </Box>
        </Box>

        {/* Partner Info */}
        {product.partnerName && (
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Icon name="business" size={16} color="#9CA3AF" />
            <Box>
              <Typography style={{ color: '#9CA3AF', fontSize: 12 }}>
                合作医院/机构
              </Typography>
              <Typography style={{ color: '#374151', fontSize: 14 }}>
                {product.partnerName}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Description */}
        <Box>
          <Typography
            style={{ fontWeight: 500, color: '#4B5563', marginBottom: 8, fontSize: 14 }}
          >
            套餐说明
          </Typography>
          <Typography
            style={{
              color: '#4B5563',
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
              fontSize: 14,
            }}
          >
            {product.description || '暂无说明'}
          </Typography>
        </Box>

        {/* Service Items */}
        {product.serviceItems && product.serviceItems.length > 0 && (
          <Box>
            <Typography
              style={{ fontWeight: 500, color: '#4B5563', marginBottom: 8, fontSize: 14 }}
            >
              包含项目
            </Typography>
            <Box>
              {product.serviceItems.map((item, index) => (
                <Box
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                  }}
                >
                  <Icon name="check_circle" size={16} color="#22C55E" />
                  <Typography style={{ color: '#4B5563', fontSize: 14 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Product Code & Currency */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <Icon name="local_offer" size={16} color="#9CA3AF" />
          <Typography style={{ color: '#9CA3AF', fontSize: 13 }}>
            {product.code} • {product.currency}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <Button variant="secondary" onClick={handleBindToCase}>
            <Icon name="link_off" size={18} style={{ marginRight: 4 }} />
            绑定至 Case
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            <Icon name="edit" size={18} style={{ marginRight: 4 }} />
            编辑套餐
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
