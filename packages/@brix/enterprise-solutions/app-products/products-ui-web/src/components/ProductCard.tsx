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
 * @file Product Card Component
 * @description Card component for displaying product/package in grid view (UIAdapter pattern)
 * @module @brix-sdk/enterprise-products-ui-web/components
 * @version 3.2.0
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import React from 'react';
import { useUI, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import {
  getProductTypeConfig,
  getProductStatusConfig,
  getMedicalCategoryConfig,
  formatPrice,
  type ProductTypeConfig,
  type ProductStatusConfig,
  type MedicalCategoryConfig,
} from '../theme';
import type { Product } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Props Interface
// ============================================================================

export interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { Box, Typography, Tag, Card, Icon } = useUI();
  const { tokens } = useTheme();

  // Configuration Lookups
  const typeConfig: ProductTypeConfig = getProductTypeConfig(product.type);
  const statusConfig: ProductStatusConfig = getProductStatusConfig(product.status);
  const medicalCategoryConfig: MedicalCategoryConfig | null = product.categoryName
    ? getMedicalCategoryConfig(product.categoryName)
    : null;

  // Event Handlers
  const handleClick = () => {
    onClick?.(product);
  };

  // Computed Values
  const displayItems = product.serviceItems?.slice(0, 3) ?? [];
  const remainingCount = (product.serviceItems?.length ?? 0) - 3;

  const priceDisplay = (() => {
    if (product.price) {
      return formatPrice(product.price, product.currency);
    }
    if (product.priceRange) {
      return product.priceRange;
    }
    return '价格面议';
  })();

  const maxPriceDisplay = product.originalPrice
    ? `至 ${formatPrice(product.originalPrice, product.currency)}`
    : null;

  // Render
  return (
    <Card
      onClick={handleClick}
      hoverable
      bordered
      elevation={1}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: tokens.shape.lg,
        borderColor: tokens.colors.border.subtle,
        backgroundColor: tokens.colors.surface.card,
        cursor: 'pointer',
        padding: tokens.space.md,
      }}
    >
      {/* Header: Type + Category Badges and Price */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: tokens.space.sm,
        }}
      >
        {/* Left: Badges */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          {/* Badge Row */}
          <Box
            style={{
              display: 'flex',
              gap: tokens.space.xs,
              flexWrap: 'wrap',
              marginBottom: tokens.space.sm,
            }}
          >
            {/* Product Type Badge */}
            <Tag
              style={{
                height: 22,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
                padding: `0 ${tokens.space.sm}`,
                borderRadius: tokens.shape.sm,
              }}
            >
              {typeConfig.label}
            </Tag>

            {/* Medical Category Badge (if applicable) */}
            {medicalCategoryConfig && (
              <Tag
                style={{
                  height: 22,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: medicalCategoryConfig.bgColor,
                  color: medicalCategoryConfig.color,
                  padding: `0 ${tokens.space.sm}`,
                  borderRadius: tokens.shape.sm,
                }}
              >
                {medicalCategoryConfig.label}
              </Tag>
            )}
          </Box>

          {/* Product Name */}
          <Typography
            style={{
              fontWeight: 600,
              color: tokens.colors.text.primary,
              fontSize: tokens.typography.titleSmall.fontSize,
              lineHeight: 1.4,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.name}
          </Typography>

          {/* Partner Name */}
          {product.partnerName && (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.space.xs,
                marginTop: 4,
              }}
            >
              <Icon name="business" size={14} color={tokens.colors.text.disabled} />
              <Typography
                style={{
                  color: tokens.colors.text.secondary,
                  fontSize: tokens.typography.bodySmall.fontSize,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {product.partnerName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right: Price */}
        <Box style={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            style={{
              fontWeight: 700,
              fontSize: tokens.typography.titleMedium.fontSize,
              color: tokens.colors.brand.primary,
              lineHeight: 1.1,
            }}
          >
            {priceDisplay}
          </Typography>
          {maxPriceDisplay && (
            <Typography
              style={{
                color: tokens.colors.text.disabled,
                fontSize: tokens.typography.bodySmall.fontSize,
              }}
            >
              {maxPriceDisplay}
            </Typography>
          )}
          <Typography
            style={{
              display: 'block',
              color: tokens.colors.text.disabled,
              fontSize: tokens.typography.labelSmall.fontSize,
              marginTop: 2,
            }}
          >
            {product.currency}
          </Typography>
        </Box>
      </Box>

      {/* Description */}
      <Typography
        style={{
          marginTop: tokens.space.sm,
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.bodySmall.fontSize,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {product.description || '暂无描述'}
      </Typography>

      {/* Service Items */}
      {displayItems.length > 0 && (
        <Box
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: tokens.space.sm,
          }}
        >
          {displayItems.map((item: string, index: number) => (
            <Tag
              key={index}
              style={{
                height: 20,
                fontSize: 11,
                backgroundColor: tokens.colors.surface.page,
                color: tokens.colors.text.secondary,
                padding: '0 6px',
                borderRadius: tokens.shape.sm,
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}
            >
              {item}
            </Tag>
          ))}
          {remainingCount > 0 && (
            <Tag
              style={{
                height: 20,
                fontSize: 11,
                backgroundColor: tokens.colors.surface.page,
                color: tokens.colors.text.secondary,
                padding: '0 6px',
                borderRadius: tokens.shape.sm,
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}
            >
              +{remainingCount}
            </Tag>
          )}
        </Box>
      )}

      {/* Footer: Duration, Code, Status */}
      <Box
        style={{
          marginTop: tokens.space.md,
          paddingTop: tokens.space.sm,
          borderTop: `1px solid ${tokens.colors.border.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: tokens.space.sm }}>
          {product.duration && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="schedule" size={14} color={tokens.colors.text.disabled} />
              <Typography
                style={{
                  fontSize: tokens.typography.bodySmall.fontSize,
                  color: tokens.colors.text.secondary,
                }}
              >
                {product.duration}
              </Typography>
            </Box>
          )}
          {product.code && (
            <Typography
              style={{
                fontSize: tokens.typography.labelSmall.fontSize,
                color: tokens.colors.text.disabled,
              }}
            >
              {product.code}
            </Typography>
          )}
        </Box>
        <Tag
          style={{
            height: 20,
            fontSize: 11,
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            padding: `0 ${tokens.space.sm}`,
            borderRadius: tokens.shape.sm,
          }}
        >
          {statusConfig.label}
        </Tag>
      </Box>
    </Card>
  );
};
