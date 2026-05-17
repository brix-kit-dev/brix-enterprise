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
 * Partner Detail Page - View Layer (UIAdapter pattern)
 * 
 * @description Displays partner detailed information
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a View layer implementation, following these architecture rules:
 * - View is responsible only for UI rendering and user interaction
 * - Get data and operations through ViewModel (usePartnerDetail)
 * - Do not call API directly, all data is obtained through Hook
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 */

import React from 'react';
import { useUI, useNavigation, useI18n } from '@brix-sdk/runtime-sdk-react';
import { useParams } from '@brix-sdk/shared-runtime-web/router';
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
  const { Box, Typography, Button, Tag, Card, Alert, Spin, Icon } = useUI();
  const { navigate } = useNavigation();
  const { t } = useI18n('partners');
  const { id } = useParams<{ id: string }>();
  
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
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin />
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon="arrow_back"
          onClick={() => navigate('partners:list')}
          style={{ marginTop: 16 }}
        >
          {t('detail.backToList')}
        </Button>
      </Box>
    );
  }

  if (!partner) {
    return (
      <Box style={{ padding: 24 }}>
        <Alert severity="warning">{t('detail.notFound')}</Alert>
        <Button
          startIcon="arrow_back"
          onClick={() => navigate('partners:list')}
          style={{ marginTop: 16 }}
        >
          {t('detail.backToList')}
        </Button>
      </Box>
    );
  }

  const statusColor = getPartnerStatusColor(partner.status) as 'success' | 'warning' | 'error' | 'default';

  return (
    <Box style={{ padding: 24 }}>
      {/* Page Header */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <Box>
          <Button
            startIcon="arrow_back"
            onClick={() => navigate('partners:list')}
            style={{ marginBottom: 8 }}
          >
            {t('detail.backToList')}
          </Button>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Typography style={{ fontSize: 24, fontWeight: 'bold' }}>
              {partner.name}
            </Typography>
            <Tag color={statusColor}>
              {getPartnerStatusLabel(partner.status, t)}
            </Tag>
          </Box>
          <Typography style={{ fontSize: 14, color: '#6B7280', fontFamily: 'monospace' }}>
            {partner.partnerCode}
          </Typography>
        </Box>
        {partner.status !== 'TERMINATED' && (
          <Button
            variant="primary"
            startIcon="edit"
            onClick={() => navigate('partners:edit', { id: partner.id })}
          >
            {t('detail.editBtn')}
          </Button>
        )}
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Basic Information */}
        <Card>
          <Box style={{ padding: 24 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="business" size={20} color="#1976d2" />
              {t('detail.basicInfoTitle')}
            </Typography>
            <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Box>
                  <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.partnerType')}</Typography>
                  <Tag style={{ marginTop: 4 }}>{getPartnerTypeLabel(partner.partnerType, t)}</Tag>
                </Box>
                <Box>
                  <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.shortName')}</Typography>
                  <Typography style={{ fontSize: 14 }}>{partner.shortName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.serviceArea')}</Typography>
                  <Typography style={{ fontSize: 14 }}>{partner.serviceArea || '-'}</Typography>
                </Box>
                <Box>
                  <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.createdAt')}</Typography>
                  <Typography style={{ fontSize: 14 }}>{new Date(partner.createdAt).toLocaleString()}</Typography>
                </Box>
                <Box style={{ gridColumn: '1 / -1' }}>
                  <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.description')}</Typography>
                  <Typography style={{ fontSize: 14 }}>{partner.description || '-'}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Contact Information */}
        <Card>
          <Box style={{ padding: 24 }}>
            <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {t('detail.contactTitle')}
            </Typography>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {partner.contactName && (
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="person" size={18} color="#6B7280" />
                  <Typography style={{ fontSize: 14 }}>{partner.contactName}</Typography>
                </Box>
              )}
              {partner.contactPhone && (
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="phone" size={18} color="#6B7280" />
                  <Typography style={{ fontSize: 14 }}>{partner.contactPhone}</Typography>
                </Box>
              )}
              {partner.contactEmail && (
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="email" size={18} color="#6B7280" />
                  <Typography style={{ fontSize: 14 }}>{partner.contactEmail}</Typography>
                </Box>
              )}
              {partner.address && (
                <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Icon name="location_on" size={18} color="#6B7280" style={{ marginTop: 2 }} />
                  <Typography style={{ fontSize: 14 }}>{partner.address}</Typography>
                </Box>
              )}
              {!partner.contactName && !partner.contactPhone && !partner.contactEmail && !partner.address && (
                <Typography style={{ fontSize: 14, color: '#6B7280' }}>{t('detail.noContact')}</Typography>
              )}
            </Box>
          </Box>
        </Card>

        {/* Qualification Information */}
        {partner.qualifications && Object.keys(partner.qualifications).length > 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <Box style={{ padding: 24 }}>
              <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                {t('detail.qualificationTitle')}
              </Typography>
              <Box style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {Object.entries(partner.qualifications).map(([key, value]) => (
                    <Box key={key}>
                      <Typography style={{ fontSize: 14, color: '#6B7280' }}>{key}</Typography>
                      <Typography style={{ fontSize: 14 }}>{String(value)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default PartnerDetailPage;
