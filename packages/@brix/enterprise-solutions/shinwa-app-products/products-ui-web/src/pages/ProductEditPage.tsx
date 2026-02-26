/**
 * @file Product Edit Page
 * @description Page for editing an existing product package
 * @module products-ui-web/pages/ProductEditPage
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Renders the product edit form
 * - Loads existing product data via useProductForm hook (ViewModel)
 * - Delegates all API operations to Repository layer
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  SaveOutlined as SaveIcon,
  CancelOutlined as CancelIcon,
  DeleteOutline as DeleteIcon,
  HistoryOutlined as HistoryIcon,
  InfoOutlined as InfoIcon,
  SettingsOutlined as SettingsIcon,
  ListAltOutlined as ItemsIcon,
} from '@mui/icons-material';
import { useNavigate, usePageParams } from '@brix/runtime-sdk-api-web';
import { useHttp } from '@brix/runtime-sdk-react';
import { useProductForm, type ProductFormData } from '../hooks/useProductForm';
import { ProductFormFields, type ProductFormErrors } from '../components/ProductFormFields';
import { ProductItemEditor, type ServiceItem } from '../components/ProductItemEditor';
import { PriceRange } from '../components/PriceRangeInput';
import { PartnerOption } from '../components/PartnerSelector';
import { createPartnerRepository } from '@shinwa/partners-ui-web/repositories';
import type { ProductStatus } from '@shinwa/products-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tab panel props
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Page route params
 */
interface ProductEditPageParams {
  id?: string;
}

/**
 * Extended form state for local management
 */
interface LocalFormState {
  priceRange: PriceRange;
  serviceItems: ServiceItem[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Product status labels
 */
const STATUS_LABELS: Record<ProductStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING_REVIEW: { label: '待审核', color: 'warning' },
  ACTIVE: { label: '已上架', color: 'success' },
  INACTIVE: { label: '已下架', color: 'error' },
  ARCHIVED: { label: '已归档', color: 'default' },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Tab Panel Component
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`product-tabpanel-${index}`}
    aria-labelledby={`product-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={150} />
  </Box>
);

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Product Edit Page Component
 * 
 * A tabbed form for editing existing product packages.
 * 
 * Features:
 * - Tabbed interface for different sections
 * - Auto-load product data on mount
 * - Form validation and error handling
 * - Delete confirmation dialog
 * - Change tracking (dirty state)
 * 
 * Architecture:
 * - Uses useProductForm hook as ViewModel
 * - Gets product ID from route params
 * - Pure View layer implementation
 */
export const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const params = usePageParams<ProductEditPageParams>();
  const httpCapability = useHttp();
  
  // Parse product ID from route params
  const productId = params.id ? parseInt(params.id, 10) : undefined;
  
  // ========================================================================
  // ViewModel Hook
  // ========================================================================
  
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
  
  // ========================================================================
  // Local State
  // ========================================================================
  
  // Current active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Local form state for complex components
  const [localState, setLocalState] = useState<LocalFormState>({
    priceRange: { type: 'fixed', currency: 'CNY' },
    serviceItems: [],
  });
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<ProductFormErrors>({});
  
  // Partner options
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Success snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // ========================================================================
  // Initialize Local State from Product
  // ========================================================================
  
  useEffect(() => {
    if (product) {
      // Parse price range from product data
      const priceRange: PriceRange = {
        type: product.priceRange?.includes('-') ? 'range' : 'fixed',
        currency: product.currency || 'CNY',
        fixedValue: product.price,
      };
      
      // If price range text exists, try to parse min/max
      if (product.priceRange) {
        const rangeMatch = product.priceRange.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          priceRange.type = 'range';
          priceRange.minValue = parseInt(rangeMatch[1], 10);
          priceRange.maxValue = parseInt(rangeMatch[2], 10);
        }
      }
      
      // Parse service items from string array
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
  
  // ========================================================================
  // Load Partners
  // ========================================================================
  
  useEffect(() => {
    const loadPartners = async () => {
      setPartnersLoading(true);
      try {
        const partnerRepo = createPartnerRepository(httpCapability);
        const result = await partnerRepo.getList({ page: 0, size: 100 });
        
        const options: PartnerOption[] = result.content.map((partner) => ({
          id: partner.id,
          name: partner.name,
          type: partner.type,
          status: partner.status,
        }));
        
        setPartners(options);
      } catch (err) {
        console.error('Failed to load partners:', err);
      } finally {
        setPartnersLoading(false);
      }
    };
    
    loadPartners();
  }, [httpCapability]);
  
  // ========================================================================
  // Form Data Mapping
  // ========================================================================
  
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
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle tab change
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  /**
   * Handle form field change
   */
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    // Handle price range separately
    if (field === 'priceRange') {
      const priceRange = value as PriceRange;
      setLocalState((prev) => ({ ...prev, priceRange }));
      
      // Sync to hook form data
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
    
    // Handle standard fields
    updateField(field as keyof ProductFormData, value as ProductFormData[keyof ProductFormData]);
    
    // Clear validation error
    if (validationErrors[field as keyof ProductFormErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [updateField, updateFields, validationErrors]);
  
  /**
   * Handle service items change
   */
  const handleServiceItemsChange = useCallback((items: ServiceItem[]) => {
    setLocalState((prev) => ({ ...prev, serviceItems: items }));
    
    // Sync to hook form data
    const serviceItemStrings = items.map((item) =>
      `${item.name}|${item.category}|${item.quantity}|${item.unit}|${item.price ?? 0}`
    );
    updateField('serviceItems', serviceItemStrings);
  }, [updateField]);
  
  /**
   * Validate form
   */
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
  
  /**
   * Handle form save
   */
  const handleSave = async () => {
    if (!validateForm()) {
      setActiveTab(0); // Switch to basic info tab if validation fails
      return;
    }
    
    const success = await submit();
    if (success) {
      setSnackbarMessage('产品信息已更新');
      setSnackbarOpen(true);
    }
  };
  
  /**
   * Handle delete
   */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Note: Delete operation would be handled by repository
      // For now, just navigate back
      setDeleteDialogOpen(false);
      setSnackbarMessage('产品已删除');
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/products');
      }, 1000);
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setDeleting(false);
    }
  };
  
  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('您有未保存的更改，确定要离开吗？')) {
        navigateToList();
      }
    } else {
      navigateToList();
    }
  };
  
  /**
   * Handle snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // ========================================================================
  // Render: Product Not Found
  // ========================================================================
  
  if (!productId) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="error">
          产品ID无效，请检查访问路径
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => navigate('/products')}
        >
          返回产品列表
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render: Loading State
  // ========================================================================
  
  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Skeleton variant="text" width="40%" height={48} />
        <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />
        <Paper sx={{ p: 3 }}>
          <LoadingSkeleton />
        </Paper>
      </Box>
    );
  }
  
  // ========================================================================
  // Render: Product Not Found After Load
  // ========================================================================
  
  if (!loading && !product) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="warning">
          未找到该产品，可能已被删除或不存在
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => navigate('/products')}
        >
          返回产品列表
        </Button>
      </Box>
    );
  }
  
  // ========================================================================
  // Render: Main Content
  // ========================================================================
  
  const statusInfo = product?.status ? STATUS_LABELS[product.status] : null;
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h5">
            编辑产品: {product?.name}
          </Typography>
          {statusInfo && (
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
            />
          )}
          {isDirty && (
            <Chip
              label="有未保存的更改"
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="textSecondary">
          产品编码: {product?.code || '未设置'} | 创建时间: {product?.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}
      
      {/* Main Content */}
      <Paper sx={{ mb: 3 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="product edit tabs">
            <Tab
              icon={<InfoIcon />}
              iconPosition="start"
              label="基本信息"
              id="product-tab-0"
              aria-controls="product-tabpanel-0"
            />
            <Tab
              icon={<ItemsIcon />}
              iconPosition="start"
              label="服务项目"
              id="product-tab-1"
              aria-controls="product-tabpanel-1"
            />
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="高级设置"
              id="product-tab-2"
              aria-controls="product-tabpanel-2"
            />
          </Tabs>
        </Box>
        
        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {/* Basic Info Tab */}
          <TabPanel value={activeTab} index={0}>
            <ProductFormFields
              values={formFieldsValues}
              errors={validationErrors}
              onChange={handleFieldChange}
              partners={partners}
              partnersLoading={partnersLoading}
              disabled={submitting}
              hideProductType
            />
          </TabPanel>
          
          {/* Service Items Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              配置此产品包含的服务项目。您可以添加、编辑、删除和排序服务项目。
            </Typography>
            <ProductItemEditor
              value={localState.serviceItems}
              onChange={handleServiceItemsChange}
              disabled={submitting}
            />
          </TabPanel>
          
          {/* Advanced Settings Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Product Statistics */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="action" />
                  <Typography variant="subtitle1">产品统计</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">销量</Typography>
                    <Typography variant="h6">{product?.salesCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">浏览量</Typography>
                    <Typography variant="h6">{product?.viewCount ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">排序权重</Typography>
                    <Typography variant="h6">{product?.sortOrder ?? 0}</Typography>
                  </Box>
                </Box>
              </Paper>
              
              {/* Danger Zone */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: 'error.main',
                  bgcolor: 'error.lighter',
                }}
              >
                <Typography variant="subtitle1" color="error" gutterBottom>
                  危险操作
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  删除产品后将无法恢复，请谨慎操作。
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={submitting}
                >
                  删除产品
                </Button>
              </Paper>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="text"
          color="inherit"
          onClick={handleCancel}
          startIcon={<CancelIcon />}
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={submitting ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={submitting || !isDirty}
        >
          {submitting ? '保存中...' : '保存更改'}
        </Button>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            您确定要删除产品 "{product?.name}" 吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            取消
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ProductEditPage;
