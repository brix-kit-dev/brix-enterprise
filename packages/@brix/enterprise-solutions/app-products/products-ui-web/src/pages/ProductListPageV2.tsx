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
 * @file Product List Page V2 Component
 * @description Card-based grid view for product/package management (UIAdapter pattern)
 * @module @brix-sdk/enterprise-products-ui-web/pages
 * @version 3.2.0
 *
 * Design Notes:
 * This is a View layer component following v3.0.4 Architecture Blueprint:
 * - Uses useProductList hook for ViewModel layer access
 * - Composes ProductCard, ProductDetailDialog, AddProductDialog
 * - Handles view state (selected product, dialog open states)
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUI, useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports - Following v3.2 Architecture
import { useProductList } from '../hooks/useProductList';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailDialog } from '../components/ProductDetailDialog';
import { AddProductDialog, type AddProductFormData } from '../components/AddProductDialog';
import { PRODUCT_TYPE_CONFIG } from '../theme';
import type { Product, ProductType } from '@brix-sdk/enterprise-products-shared';

// ============================================================================
// Constants
// ============================================================================

interface TypeTabConfig {
  value: ProductType | 'ALL';
  label: string;
}

const TYPE_TABS: TypeTabConfig[] = [
  { value: 'ALL', label: '全部' },
  { value: 'CHECKUP', label: PRODUCT_TYPE_CONFIG.CHECKUP.label },
  { value: 'TREATMENT', label: PRODUCT_TYPE_CONFIG.TREATMENT.label },
  { value: 'TRANSLATION', label: PRODUCT_TYPE_CONFIG.TRANSLATION.label },
  { value: 'TRANSPORT', label: PRODUCT_TYPE_CONFIG.TRANSPORT.label },
  { value: 'ACCOMMODATION', label: PRODUCT_TYPE_CONFIG.ACCOMMODATION.label },
  { value: 'COMPOSITE', label: PRODUCT_TYPE_CONFIG.COMPOSITE.label },
];

// ============================================================================
// Component Implementation
// ============================================================================

export const ProductListPageV2: React.FC = () => {
  // UIAdapter hook
  const { Box, Typography, Button, Input, Tag, Alert, Spin, Icon } = useUI();
  const navigate = useNavigation();
  // Brix design tokens (Constraint #9: BrixUI Unified Governance — no MUI/antd direct import)
  const { tokens } = useTheme();

  // ViewModel Hook
  const {
    products,
    loading,
    operating,
    error,
    permissions,
    refresh,
  } = useProductList();

  // Local View State
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'ALL'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Computed Values
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedType !== 'ALL') {
      result = result.filter((p) => p.type === selectedType);
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.code?.toLowerCase().includes(searchLower) ||
          p.partnerName?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [products, selectedType, searchText]);

  const typeCounts = useMemo(() => {
    const counts: Record<ProductType | 'ALL', number> = {
      ALL: products.length,
      CHECKUP: 0,
      TREATMENT: 0,
      TRANSLATION: 0,
      TRANSPORT: 0,
      ACCOMMODATION: 0,
      COMPOSITE: 0,
    };

    products.forEach((p) => {
      if (p.type in counts) {
        counts[p.type as ProductType]++;
      }
    });

    return counts;
  }, [products]);

  // Event Handlers
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSearchText(event.target.value);
    },
    []
  );

  const handleTypeChange = useCallback((type: ProductType | 'ALL') => {
    setSelectedType(type);
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  }, []);

  const handleDetailDialogClose = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleEditProduct = useCallback(
    (product: Product) => {
      setDetailDialogOpen(false);
      // Concrete path matches ui-manifest suggestedPath `/products/:id/edit`.
      navigate.navigate(`/products/${product.id}/edit`);
    },
    [navigate]
  );

  const handleBindToCase = useCallback((product: Product) => {
    setDetailDialogOpen(false);
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  const handleAddProduct = useCallback(
    async (data: AddProductFormData) => {
      setAddSubmitting(true);
      try {
        const queryParams = new URLSearchParams({
          name: data.nameCn,
          type: data.productType,
          ...(data.priceMin && { priceMin: data.priceMin }),
          ...(data.priceMax && { priceMax: data.priceMax }),
          ...(data.durationDays && { duration: data.durationDays }),
        });

        setAddDialogOpen(false);
        // Concrete path matches ui-manifest suggestedPath `/products/create`.
        navigate.navigate(`/products/create?${queryParams.toString()}`);
      } finally {
        setAddSubmitting(false);
      }
    },
    [navigate]
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Render Helpers
  const renderEmpty = () => (
    <Box
      style={{
        textAlign: 'center',
        padding: `${tokens.space.xxl} ${tokens.space.lg}`,
        backgroundColor: tokens.colors.surface.card,
        borderRadius: tokens.shape.lg,
        border: `1px dashed ${tokens.colors.border.default}`,
      }}
    >
      <Box style={{ marginBottom: tokens.space.sm }}>
        <Icon name="inventory_2" size={48} color={tokens.colors.text.disabled} />
      </Box>
      <Typography
        style={{
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.bodyMedium.fontSize,
          marginBottom: tokens.space.xs,
        }}
      >
        暂无匹配套餐
      </Typography>
      <Typography
        style={{
          color: tokens.colors.text.disabled,
          fontSize: tokens.typography.bodySmall.fontSize,
        }}
      >
        调整筛选条件或点击右上角「新增套餐」创建第一个产品
      </Typography>
    </Box>
  );

  // Render
  return (
    <Box
      style={{
        padding: tokens.space.lg,
        backgroundColor: tokens.colors.surface.page,
        minHeight: '100%',
      }}
    >
      {/* Error Alert */}
      {error && (
        <Alert severity="error" style={{ marginBottom: tokens.space.md }}>
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <Box style={{ marginBottom: tokens.space.md }}>
        <Typography
          style={{
            // Use titleMedium (h4) for sub-page titles; titleLarge (h3) is reserved for page hero.
            fontSize: tokens.typography.titleMedium.fontSize,
            fontWeight: tokens.typography.titleMedium.fontWeight,
            color: tokens.colors.text.primary,
            marginBottom: tokens.space.xs,
          }}
        >
          套餐管理
        </Typography>
        <Typography
          style={{
            fontSize: tokens.typography.bodySmall.fontSize,
            color: tokens.colors.text.secondary,
          }}
        >
          共 {products.length} 个套餐 · 当前显示 {filteredProducts.length} 个
        </Typography>
      </Box>

      {/* Toolbar Card: Search + Type Tabs */}
      <Box
        style={{
          backgroundColor: tokens.colors.surface.card,
          borderRadius: tokens.shape.lg,
          border: `1px solid ${tokens.colors.border.subtle}`,
          padding: tokens.space.md,
          marginBottom: tokens.space.md,
          boxShadow: tokens.shadows.sm,
        }}
      >
        {/* Search + Actions Row */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.sm,
            marginBottom: tokens.space.md,
          }}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Input
              placeholder="搜索套餐名称、编码或合作伙伴..."
              value={searchText}
              onChange={handleSearchChange}
              startAdornment="search"
              style={{
                width: '100%',
                borderRadius: tokens.shape.md,
              }}
            />
          </Box>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{
              minWidth: 40,
              padding: `0 ${tokens.space.sm}`,
              backgroundColor: tokens.colors.surface.card,
              borderColor: tokens.colors.border.default,
              color: tokens.colors.text.secondary,
              borderRadius: tokens.shape.md,
              flexShrink: 0,
            }}
          >
            <Icon name="refresh" size={18} />
          </Button>
          {permissions.canCreate && (
            <Button
              variant="primary"
              onClick={handleOpenAddDialog}
              disabled={operating}
              startIcon="add"
              style={{
                padding: `0 ${tokens.space.md}`,
                borderRadius: tokens.shape.md,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              新增套餐
            </Button>
          )}
        </Box>

        {/* Type Filter Tabs (pill-style) */}
        <Box
          style={{
            display: 'flex',
            gap: tokens.space.xs,
            flexWrap: 'wrap',
          }}
        >
          {TYPE_TABS.map((tab) => {
            const count = typeCounts[tab.value];
            const isSelected = selectedType === tab.value;

            return (
              <Tag
                key={tab.value}
                onClick={() => handleTypeChange(tab.value)}
                style={{
                  height: 32,
                  borderRadius: tokens.shape.full,
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: tokens.typography.label.fontSize,
                  cursor: 'pointer',
                  padding: `0 ${tokens.space.md}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: tokens.space.xs,
                  transition: 'all 0.18s ease-in-out',
                  backgroundColor: isSelected
                    ? tokens.colors.brand.primary
                    : tokens.colors.surface.page,
                  color: isSelected
                    ? tokens.colors.brand.primaryContrast
                    : tokens.colors.text.secondary,
                  border: `1px solid ${
                    isSelected ? tokens.colors.brand.primary : tokens.colors.border.subtle
                  }`,
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '0 6px',
                    borderRadius: tokens.shape.full,
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.22)'
                      : tokens.colors.border.subtle,
                    color: isSelected
                      ? tokens.colors.brand.primaryContrast
                      : tokens.colors.text.secondary,
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              </Tag>
            );
          })}
        </Box>
      </Box>

      {/* Product Grid */}
      {loading ? (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.space.xxl,
            backgroundColor: tokens.colors.surface.card,
            borderRadius: tokens.shape.lg,
            border: `1px solid ${tokens.colors.border.subtle}`,
          }}
        >
          <Spin />
        </Box>
      ) : filteredProducts.length === 0 ? (
        renderEmpty()
      ) : (
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: tokens.space.md,
          }}
        >
          {filteredProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
            />
          ))}
        </Box>
      )}

      {/* Detail Dialog */}
      <ProductDetailDialog
        open={detailDialogOpen}
        product={selectedProduct}
        onClose={handleDetailDialogClose}
        onEdit={handleEditProduct}
        onBindToCase={handleBindToCase}
      />

      {/* Add Dialog */}
      <AddProductDialog
        open={addDialogOpen}
        submitting={addSubmitting}
        onClose={handleCloseAddDialog}
        onSubmit={handleAddProduct}
      />
    </Box>
  );
};

export default ProductListPageV2;
