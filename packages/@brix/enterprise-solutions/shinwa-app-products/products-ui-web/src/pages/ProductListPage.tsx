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
 * @author Shinwa Platform Team
 * @since 3.0.0
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useProductList } from '../hooks/useProductList';
import type { Product, ProductType, ProductStatus } from '@shinwa/products-shared';
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
    <Box sx={{ p: 3 }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          产品管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} color="primary">
          新建产品
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="搜索产品名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={handleSearch}>
                <SearchIcon />
              </IconButton>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Product Card List */
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {product.coverImage ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={product.coverImage}
                    alt={product.name}
                  />
                ) : (
                  <Box
                    sx={{
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" noWrap sx={{ flex: 1 }}>
                      {product.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, product)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                    <Chip
                      label={ProductTypeConfig[product.type]?.label || product.type}
                      size="small"
                      sx={{
                        backgroundColor: ProductTypeConfig[product.type]?.color || '#9E9E9E',
                        color: 'white',
                      }}
                    />
                    <Chip
                      label={ProductStatusConfig[product.status]?.label || product.status}
                      size="small"
                      sx={{
                        backgroundColor: ProductStatusConfig[product.status]?.color || '#9E9E9E',
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
          <ViewIcon sx={{ mr: 1 }} /> 查看详情
        </MenuItem>
        {selectedProduct?.status === 'DRAFT' && (
          <>
            <MenuItem onClick={() => handleStatusChange('edit')}>
              <EditIcon sx={{ mr: 1 }} /> 编辑
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('submitReview')}>
              <ApproveIcon sx={{ mr: 1 }} /> 提交审核
            </MenuItem>
          </>
        )}
        {selectedProduct?.status === 'PENDING_REVIEW' && (
          <>
            <MenuItem onClick={() => handleStatusChange('approve')}>
              <ApproveIcon sx={{ mr: 1 }} /> 审核通过
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('reject')}>
              <RejectIcon sx={{ mr: 1 }} /> 驳回
            </MenuItem>
          </>
        )}
        {selectedProduct?.status === 'ACTIVE' && (
          <MenuItem onClick={() => handleStatusChange('deactivate')}>
            <RejectIcon sx={{ mr: 1 }} /> 下架
          </MenuItem>
        )}
        {selectedProduct?.status === 'INACTIVE' && (
          <>
            <MenuItem onClick={() => handleStatusChange('reactivate')}>
              <ApproveIcon sx={{ mr: 1 }} /> 重新上架
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('archive')}>
              <ArchiveIcon sx={{ mr: 1 }} /> 归档
            </MenuItem>
          </>
        )}
        {(selectedProduct?.status === 'DRAFT' || selectedProduct?.status === 'INACTIVE') && (
          <MenuItem onClick={() => handleStatusChange('delete')} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> 删除
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
          <TextField
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
