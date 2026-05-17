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
 * Product Detail Page
 *
 * v3.2 Product Package Module - Product Detail Display (UIAdapter pattern)
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React from 'react';
import { useUI, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useParams } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import type { Product } from '../types';
import { ProductTypeConfig, ProductStatusConfig } from '../types';

/**
 * Product Detail Page Component
 */
export const ProductDetailPage: React.FC = () => {
  const { Box, Typography, Button, Card, Tag, Alert, Spin, Icon } = useUI();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigation();
  
  const { product, loading, error } = useProductDetail(id);

  // Format price
  const formatPrice = (product: Product) => {
    if (product.price) {
      const currency = product.currency === 'JPY' ? '¥' : product.currency;
      return `${currency}${product.price.toLocaleString()}`;
    }
    if (product.priceRange) {
      return product.priceRange;
    }
    return '价格面议';
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="error">{error || '产品不存在'}</Alert>
        <Button
          variant="secondary"
          onClick={() => navigate.navigate('products:list')}
          style={{ marginTop: 16 }}
        >
          <Icon name="arrow_back" size={18} style={{ marginRight: 4 }} />
          返回
        </Button>
      </Box>
    );
  }

  return (
    <Box style={{ padding: 24 }}>
      {/* Back Button and Actions */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Button variant="secondary" onClick={() => navigate.navigate('products:list')}>
          <Icon name="arrow_back" size={18} style={{ marginRight: 4 }} />
          返回列表
        </Button>
        {product.status === 'DRAFT' && (
          <Button variant="primary">
            <Icon name="edit" size={18} style={{ marginRight: 4 }} />
            编辑产品
          </Button>
        )}
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left: Basic Information */}
        <Card style={{ padding: 24 }}>
          {/* Title and Status */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <Typography style={{ fontSize: 24, fontWeight: 600 }}>
              {product.name}
            </Typography>
            <Tag
              style={{
                backgroundColor: ProductTypeConfig[product.type]?.color || '#9E9E9E',
                color: 'white',
              }}
            >
              {ProductTypeConfig[product.type]?.label || product.type}
            </Tag>
            <Tag
              style={{
                backgroundColor: ProductStatusConfig[product.status]?.color || '#9E9E9E',
                color: 'white',
              }}
            >
              {ProductStatusConfig[product.status]?.label || product.status}
            </Tag>
          </Box>

          {/* Product Code */}
          {product.code && (
            <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              产品编码: {product.code}
            </Typography>
          )}

          {/* Cover Image */}
          {product.coverImage && (
            <Box style={{ marginBottom: 24 }}>
              <img
                src={product.coverImage}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          )}

          {/* Description */}
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            产品描述
          </Typography>
          <Typography style={{ marginBottom: 24 }}>
            {product.description || '暂无描述'}
          </Typography>

          <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24, marginBottom: 24 }} />

          {/* Service Items */}
          {product.serviceItems && product.serviceItems.length > 0 && (
            <>
              <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                服务项目
              </Typography>
              <Box>
                {product.serviceItems.map((item, index) => (
                  <Box key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name="check_circle" size={20} color="#22c55e" />
                    <Typography>{item}</Typography>
                  </Box>
                ))}
              </Box>
              <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24, marginTop: 24 }} />
            </>
          )}

          {/* Remarks */}
          {product.remarks && (
            <>
              <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                备注信息
              </Typography>
              <Typography style={{ color: '#6B7280' }}>
                {product.remarks}
              </Typography>
            </>
          )}
        </Card>

        {/* Right: Price and Statistics */}
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Price Card */}
          <Card style={{ padding: 16 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              价格信息
            </Typography>
            <Box style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <Typography style={{ fontSize: 28, fontWeight: 700, color: '#1976d2' }}>
                {formatPrice(product)}
              </Typography>
              {product.originalPrice && product.price && product.originalPrice > product.price && (
                <Typography
                  style={{ textDecoration: 'line-through', color: '#6B7280', marginLeft: 16 }}
                >
                  ¥{product.originalPrice.toLocaleString()}
                </Typography>
              )}
            </Box>
            {product.duration && (
              <Box style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
                <Icon name="schedule" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Typography style={{ fontSize: 14 }}>服务时长: {product.duration}</Typography>
              </Box>
            )}
          </Card>

          {/* Related Information */}
          <Card style={{ padding: 16 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              关联信息
            </Typography>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Icon name="business" size={20} color="#6B7280" />
              <Box>
                <Typography style={{ fontSize: 12, color: '#6B7280' }}>合作方</Typography>
                <Typography>{product.partnerName || `ID: ${product.partnerId}`}</Typography>
              </Box>
            </Box>
            {product.categoryId && (
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="category" size={20} color="#6B7280" />
                <Box>
                  <Typography style={{ fontSize: 12, color: '#6B7280' }}>分类</Typography>
                  <Typography>{product.categoryName || `ID: ${product.categoryId}`}</Typography>
                </Box>
              </Box>
            )}
          </Card>

          {/* Statistics */}
          <Card style={{ padding: 16 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              统计数据
            </Typography>
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Box style={{ textAlign: 'center' }}>
                <Icon name="visibility" size={40} color="#1976d2" />
                <Typography style={{ fontSize: 24, fontWeight: 600 }}>{product.viewCount}</Typography>
                <Typography style={{ fontSize: 14, color: '#6B7280' }}>浏览量</Typography>
              </Box>
              <Box style={{ textAlign: 'center' }}>
                <Icon name="shopping_cart" size={40} color="#22c55e" />
                <Typography style={{ fontSize: 24, fontWeight: 600 }}>{product.salesCount}</Typography>
                <Typography style={{ fontSize: 14, color: '#6B7280' }}>销量</Typography>
              </Box>
            </Box>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card style={{ padding: 16 }}>
              <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                标签
              </Typography>
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.tags.map((tag, index) => (
                  <Tag key={index} style={{ borderRadius: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </Box>
            </Card>
          )}

          {/* Time Information */}
          <Card style={{ padding: 16 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              时间信息
            </Typography>
            <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              创建时间: {formatDate(product.createdAt)}
            </Typography>
            {product.updatedAt && (
              <Typography style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                更新时间: {formatDate(product.updatedAt)}
              </Typography>
            )}
            {product.createdBy && (
              <Typography style={{ fontSize: 14, color: '#6B7280' }}>
                创建人: {product.createdBy}
              </Typography>
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductDetailPage;
