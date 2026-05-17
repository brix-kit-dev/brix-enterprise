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
 * Product List Page
 *
 * @module products-ui-web
 * @version 3.2.0
 *
 * [v3.2 Frontend Three-Layer Separation Architecture]
 * - Page component (View layer): Only responsible for UI rendering
 * - Obtains data and action methods through useProductList Hook (ViewModel layer)
 * 
 * [Architecture Red Lines]
 * ❌ Prohibited from directly importing API layer (e.g., productApi)
 * ❌ Prohibited from implementing business logic in pages
 * ✅ Use useProductList Hook to manage state and business logic
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */

import React, { useState, useCallback } from 'react';
import { useUI } from '@brix-sdk/runtime-sdk-react';
import { useProductList } from '../hooks/useProductList';
import type { Product, ProductType, ProductStatus } from '@brix-sdk/enterprise-products-shared';
import { ProductTypeConfig, ProductStatusConfig } from '../types';

/**
 * Product List Page Component
 * 
 * [v3.2 Frontend Three-Layer Separation]
 * - Uses useProductList Hook to get state and action methods
 * - Page is only responsible for UI rendering and event handling
 */
export const ProductListPage: React.FC = () => {
  // ========================================================================
  // Use ViewModel Hook
  // ========================================================================
  const { Box, Card, CardContent, CardMedia, Typography, Grid, Input, FormControl, InputLabel, Select, MenuItem, Tag, Button, Spin, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Menu, Icon } = useUI();
  const {
    products,
    loading,
    operating,
    error,
    permissions,
    refresh,
    deleteProduct,
    activateProduct,
    deactivateProduct,
    archiveProduct,
    submitForReview,
    approveProduct,
    rejectProduct,
  } = useProductList();
  
  // Local search and filter state (UI state)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<ProductType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ProductStatus | ''>('');

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // ========================================================================
  // Event Handlers - Delegate to Hook or Execute Local Operations
  // ========================================================================
  
  // Search handler (triggers Hook refresh)
  const handleSearch = useCallback(() => {
    refresh();
  }, [refresh]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  /**
   * Status change operations
   * Calls methods provided by Hook
   */
  const handleStatusChange = useCallback(async (action: string) => {
    if (!selectedProduct) return;
    
    switch (action) {
      case 'submitReview':
        await submitForReview(selectedProduct.id);
        break;
      case 'approve':
        await approveProduct(selectedProduct.id);
        break;
      case 'reject':
        setRejectDialogOpen(true);
        return;
      case 'deactivate':
        await deactivateProduct(selectedProduct.id);
        break;
      case 'reactivate':
        await activateProduct(selectedProduct.id);
        break;
      case 'archive':
        await archiveProduct(selectedProduct.id);
        break;
      case 'delete':
        setDeleteDialogOpen(true);
        return;
    }
    handleMenuClose();
  }, [selectedProduct, submitForReview, approveProduct, deactivateProduct, activateProduct, archiveProduct]);

  /**
   * Delete confirmation
   * Calls Hook's deleteProduct method
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedProduct) return;
    await deleteProduct(selectedProduct.id);
    setDeleteDialogOpen(false);
    handleMenuClose();
  }, [selectedProduct, deleteProduct]);

  /**
   * Reject confirmation
   * Calls Hook's rejectProduct method
   */
  const handleRejectConfirm = useCallback(async () => {
    if (!selectedProduct) return;
    await rejectProduct(selectedProduct.id, rejectReason);
    setRejectDialogOpen(false);
    setRejectReason('');
    handleMenuClose();
  }, [selectedProduct, rejectProduct, rejectReason]);

  // Format price
  const formatPrice = (product: Product) => {
    if (product.price) {
      return `¥${product.price.toLocaleString()}`;
    }
    if (product.priceRange) {
      return product.priceRange;
    }
    return '价格面议';
  };

  return (
    <Box style={{ p: 3 }}>
      {/* Page Title */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          产品管理
        </Typography>
        <Button variant="contained" startIcon={<Icon name="add" />} color="primary">
          新建产品
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box style={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Input
          size="small"
          placeholder="搜索产品名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <Button variant="text" size="small" onClick={handleSearch}>
                <Icon name="search" />
              </Button>
            ),
          }}
          style={{ minWidth: 250 }}
        />
        <FormControl size="small" style={{ minWidth: 150 }}>
          <InputLabel>产品类型</InputLabel>
          <Select
            value={filterType}
            label="产品类型"
            onChange={(e) => setFilterType(e.target.value as ProductType | '')}
          >
            <MenuItem value="">全部</MenuItem>
            {Object.entries(ProductTypeConfig).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" style={{ minWidth: 150 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={filterStatus}
            label="状态"
            onChange={(e) => setFilterStatus(e.target.value as ProductStatus | '')}
          >
            <MenuItem value="">全部</MenuItem>
            {Object.entries(ProductStatusConfig).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert type="error" style={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <Spin />
        </Box>
      ) : (
        /* Product Card List */
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {product.coverImage ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={product.coverImage}
                    alt={product.name}
                  />
                ) : (
                  <Box
                    style={{
                      height: 160,
                      backgroundColor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="text.secondary">暂无图片</Typography>
                  </Box>
                )}
                <CardContent style={{ flexGrow: 1 }}>
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" noWrap style={{ flex: 1 }}>
                      {product.name}
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, product)}
                    >
                      <Icon name="more_vert" />
                    </Button>
                  </Box>
                  <Box style={{ display: 'flex', gap: 1, my: 1 }}>
                    <Tag
                      label={ProductTypeConfig[product.type]?.label || product.type}
                      size="small"
                      style={{
                        backgroundColor: ProductTypeConfig[product.type]?.color || '#9E9E9E',
                        color: 'white',
                      }}
                    />
                    <Tag
                      label={ProductStatusConfig[product.status]?.label || product.status}
                      size="small"
                      style={{
                        backgroundColor: ProductStatusConfig[product.status]?.color || '#9E9E9E',
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" style={{ mb: 1 }}>
                    {product.description?.substring(0, 60) || '暂无描述'}
                    {product.description && product.description.length > 60 ? '...' : ''}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(product)}
                  </Typography>
                  {product.duration && (
                    <Typography variant="body2" color="text.secondary">
                      服务时长: {product.duration}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleStatusChange('view')}>
          <Icon name="visibility" style={{ mr: 1 }} /> 查看详情
        </MenuItem>
        {selectedProduct?.status === 'DRAFT' && (
          <>
            <MenuItem onClick={() => handleStatusChange('edit')}>
              <Icon name="edit" style={{ mr: 1 }} /> 编辑
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('submitReview')}>
              <Icon name="check_circle" style={{ mr: 1 }} /> 提交审核
            </MenuItem>
          </>
        )}
        {selectedProduct?.status === 'PENDING_REVIEW' && (
          <>
            <MenuItem onClick={() => handleStatusChange('approve')}>
              <Icon name="check_circle" style={{ mr: 1 }} /> 审核通过
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('reject')}>
              <Icon name="cancel" style={{ mr: 1 }} /> 驳回
            </MenuItem>
          </>
        )}
        {selectedProduct?.status === 'ACTIVE' && (
          <MenuItem onClick={() => handleStatusChange('deactivate')}>
            <Icon name="cancel" style={{ mr: 1 }} /> 下架
          </MenuItem>
        )}
        {selectedProduct?.status === 'INACTIVE' && (
          <>
            <MenuItem onClick={() => handleStatusChange('reactivate')}>
              <Icon name="check_circle" style={{ mr: 1 }} /> 重新上架
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('archive')}>
              <Icon name="archive" style={{ mr: 1 }} /> 归档
            </MenuItem>
          </>
        )}
        {(selectedProduct?.status === 'DRAFT' || selectedProduct?.status === 'INACTIVE') && (
          <MenuItem onClick={() => handleStatusChange('delete')} style={{ color: 'error.main' }}>
            <Icon name="delete" style={{ mr: 1 }} /> 删除
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除产品「{selectedProduct?.name}」吗？此操作不可撤销。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>驳回产品</DialogTitle>
        <DialogContent>
          <Input
            autoFocus
            fullWidth
            multiline
            rows={3}
            margin="dense"
            label="驳回原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>取消</Button>
          <Button onClick={handleRejectConfirm} color="warning" variant="contained">
            确认驳回
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductListPage;
