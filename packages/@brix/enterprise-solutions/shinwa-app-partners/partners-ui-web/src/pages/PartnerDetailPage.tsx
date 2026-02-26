/**
 * Partner Detail Page - View Layer
 * 
 * @description Displays partner detailed information
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation, following these architecture rules:
 * - View is responsible only for UI rendering and user interaction
 * - Get data and operations through ViewModel (usePartnerDetail)
 * - Do not call API directly, all data is obtained through Hook
 * 
 * Architecture Path: View (PartnerDetailPage) → ViewModel (usePartnerDetail) → Repository → HttpCapability
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate, usePageParams } from '@brix/runtime-sdk-api-web';
import { usePartnerDetail } from '../hooks';
import { getPartnerTypeLabel, getPartnerStatusLabel, getPartnerStatusColor } from '../types';

/**
 * Partner Detail Page Component
 * 
 * Responsibilities:
 * - UI rendering and user interaction
 * - Display partner detailed information
 * 
 * State Sources:
 * - partner, loading, error, permissions → usePartnerDetail Hook
 */
export const PartnerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = usePageParams<{ id: string }>();
  
  // ========================================================================
  // ViewModel Hook - Get data state and action methods
  // ========================================================================
  
  const {
    partner,
    loading,
    error,
  } = usePartnerDetail(id ? parseInt(id) : 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('partners:list')} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }

  if (!partner) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">合作伙伴不存在</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('partners:list')} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('partners:list')}
            sx={{ mb: 1 }}
          >
            返回列表
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              {partner.name}
            </Typography>
            <Chip
              label={getPartnerStatusLabel(partner.status)}
              color={getPartnerStatusColor(partner.status)}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
            {partner.partnerCode}
          </Typography>
        </Box>
        {partner.status !== 'TERMINATED' && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate('partners:edit', { id: partner.id })}
          >
            编辑
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              基本信息
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">合作伙伴类型</Typography>
                <Chip label={getPartnerTypeLabel(partner.partnerType)} size="small" sx={{ mt: 0.5 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">简称</Typography>
                <Typography>{partner.shortName || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">服务区域</Typography>
                <Typography>{partner.serviceArea || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">创建时间</Typography>
                <Typography>{new Date(partner.createdAt).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">简介</Typography>
                <Typography>{partner.description || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                联系信息
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {partner.contactName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" fontSize="small" />
                    <Typography>{partner.contactName}</Typography>
                  </Box>
                )}
                {partner.contactPhone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Typography>{partner.contactPhone}</Typography>
                  </Box>
                )}
                {partner.contactEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" fontSize="small" />
                    <Typography>{partner.contactEmail}</Typography>
                  </Box>
                )}
                {partner.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography>{partner.address}</Typography>
                  </Box>
                )}
                {!partner.contactName && !partner.contactPhone && !partner.contactEmail && !partner.address && (
                  <Typography color="text.secondary">暂无联系信息</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Qualification Information */}
        {partner.qualifications && Object.keys(partner.qualifications).length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                资质信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {Object.entries(partner.qualifications).map(([key, value]) => (
                  <Grid item xs={6} md={4} key={key}>
                    <Typography variant="body2" color="text.secondary">{key}</Typography>
                    <Typography>{String(value)}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PartnerDetailPage;
