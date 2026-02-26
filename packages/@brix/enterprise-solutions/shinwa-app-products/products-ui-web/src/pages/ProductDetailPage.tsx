/**
 * Product Detail Page
 *
 * v3.2 Product Package Module - Product Detail Display
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * This component follows the three-layer separation architecture (View → ViewModel → Repository):
 * - View layer: This component, responsible for pure UI rendering
 * - ViewModel layer: useProductDetail Hook, manages state and business logic
 * - Repository layer: productRepository, encapsulates API calls
 *
 * @author Shinwa Platform Team
 * @since 3.0.0
 * @version 3.2.0
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  LocalOffer as PriceIcon,
  Business as PartnerIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  ShoppingCart as SalesIcon,
} from '@mui/icons-material';
import { useNavigate, usePageParams } from '@brix/runtime-sdk-api-web';
import { useProductDetail } from '../hooks/useProductDetail';
import type { Product } from '../types';
import { ProductTypeConfig, ProductStatusConfig } from '../types';

/**
 * Product Detail Page Component
 * 
 * [Responsibilities]
 * - Pure UI rendering, no business logic
 * - Obtains data and state through useProductDetail Hook
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = usePageParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use ViewModel Hook to manage state
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || '产品不存在'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('products:list')} sx={{ mt: 2 }}>
          返回
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('products:list')}>
          返回列表
        </Button>
        {product.status === 'DRAFT' && (
          <Button variant="contained" startIcon={<EditIcon />}>
            编辑产品
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left: Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Title and Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" component="h1">
                {product.name}
              </Typography>
              <Chip
                label={ProductTypeConfig[product.type]?.label || product.type}
                sx={{
                  backgroundColor: ProductTypeConfig[product.type]?.color || '#9E9E9E',
                  color: 'white',
                }}
              />
              <Chip
                label={ProductStatusConfig[product.status]?.label || product.status}
                sx={{
                  backgroundColor: ProductStatusConfig[product.status]?.color || '#9E9E9E',
                  color: 'white',
                }}
              />
            </Box>

            {/* Product Code */}
            {product.code && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                产品编码: {product.code}
              </Typography>
            )}

            {/* Cover Image */}
            {product.coverImage && (
              <Box sx={{ mb: 3 }}>
                <img
                  src={product.coverImage}
                  alt={product.name}
                  style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
                />
              </Box>
            )}

            {/* Description */}
            <Typography variant="h6" gutterBottom>
              产品描述
            </Typography>
            <Typography variant="body1" paragraph>
              {product.description || '暂无描述'}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Service Items */}
            {product.serviceItems && product.serviceItems.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  服务项目
                </Typography>
                <List dense>
                  {product.serviceItems.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 3 }} />
              </>
            )}

            {/* Remarks */}
            {product.remarks && (
              <>
                <Typography variant="h6" gutterBottom>
                  备注信息
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.remarks}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right: Price and Statistics */}
        <Grid item xs={12} md={4}>
          {/* Price Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                价格信息
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h4" color="primary">
                  {formatPrice(product)}
                </Typography>
                {product.originalPrice && product.price && product.originalPrice > product.price && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through', ml: 2 }}
                  >
                    ¥{product.originalPrice.toLocaleString()}
                  </Typography>
                )}
              </Box>
              {product.duration && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">服务时长: {product.duration}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                关联信息
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PartnerIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="合作方"
                    secondary={product.partnerName || `ID: ${product.partnerId}`}
                  />
                </ListItem>
                {product.categoryId && (
                  <ListItem>
                    <ListItemIcon>
                      <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="分类"
                      secondary={product.categoryName || `ID: ${product.categoryId}`}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                统计数据
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ViewIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h5">{product.viewCount}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      浏览量
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SalesIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    <Typography variant="h5">{product.salesCount}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      销量
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  标签
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {product.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Time Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                时间信息
              </Typography>
              <Typography variant="body2" color="text.secondary">
                创建时间: {formatDate(product.createdAt)}
              </Typography>
              {product.updatedAt && (
                <Typography variant="body2" color="text.secondary">
                  更新时间: {formatDate(product.updatedAt)}
                </Typography>
              )}
              {product.createdBy && (
                <Typography variant="body2" color="text.secondary">
                  创建人: {product.createdBy}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetailPage;
