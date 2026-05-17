/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Partner Detail Dialog Component (UIAdapter pattern)
 * @description Modal dialog for displaying partner details
 * @module @brix-sdk/enterprise-partners-ui-web/components
 * @version 3.0.0
 *
 * Design Notes:
 * This is a pure View component following v3.0.4 blueprint:
 * - Receives partner data through props
 * - No direct API calls
 * - Actions emitted via callback props
 * - Uses useUI() hook for UI components (UIAdapter pattern)
 *
 * @author Brix Platform Team
 * @date 2026-02-28
 */

import React from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';

// Internal imports
import { getPartnerTypeConfig, getPartnerStatusConfig } from '../theme';
import type { PartnerDTO } from '../types';

// ============================================================================
// Props Interface
// ============================================================================

/**
 * PartnerDetailDialog Props
 */
export interface PartnerDetailDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Partner data to display */
  partner: PartnerDTO | null;
  /** Close handler */
  onClose: () => void;
  /** Edit handler */
  onEdit?: (partner: PartnerDTO) => void;
  /** Bind to package handler */
  onBindPackage?: (partner: PartnerDTO) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Partner Detail Dialog Component
 *
 * Displays comprehensive partner information in a modal dialog.
 * Used when clicking a partner card in the list view.
 *
 * @param props Component props
 * @returns Partner detail dialog element
 */
export const PartnerDetailDialog: React.FC<PartnerDetailDialogProps> = ({
  open,
  partner,
  onClose,
  onEdit,
  onBindPackage,
}) => {
  // UIAdapter hook
  const { Box, Typography, Button, Modal, Tag, Icon } = useUI();
  // i18n hook
  const { t } = useI18n('partners');

  if (!partner) return null;

  const typeConfig = getPartnerTypeConfig(partner.partnerType);
  const statusConfig = getPartnerStatusConfig(partner.status);

  /**
   * Parse certifications from qualifications field
   */
  const certifications: string[] = (() => {
    if (!partner.qualifications) return [];
    const quals = partner.qualifications as Record<string, unknown>;
    if (Array.isArray(quals.certifications)) {
      return quals.certifications as string[];
    }
    return [];
  })();

  /**
   * Handle edit click
   */
  const handleEdit = () => {
    onEdit?.(partner);
    onClose();
  };

  /**
   * Handle bind to package click
   */
  const handleBindPackage = () => {
    onBindPackage?.(partner);
    onClose();
  };

  const footer = (
    <Box style={{ display: 'flex', gap: 12, padding: 16 }}>
      <Button
        variant="primary"
        startIcon="link"
        onClick={handleBindPackage}
        style={{ flex: 1 }}
      >
        {t('detailDialog.bindToPackage')}
      </Button>
      <Button
        startIcon="edit"
        onClick={handleEdit}
        style={{ flex: 1 }}
      >
        {t('detailDialog.editInfo')}
      </Button>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title={null}
      footer={footer}
      width={480}
    >
      <Box style={{ padding: 24 }}>
        {/* Header: Badges and Close Button */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <Box>
            <Box style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Tag
                style={{
                  height: 24,
                  backgroundColor: typeConfig.background,
                  color: typeConfig.text,
                  fontWeight: 500,
                  border: 'none',
                }}
              >
                {t(typeConfig.labelKey)}
              </Tag>
              <Tag
                style={{
                  height: 24,
                  backgroundColor: statusConfig.background,
                  color: statusConfig.text,
                  fontWeight: 500,
                  border: 'none',
                }}
              >
                {t(statusConfig.labelKey)}
              </Tag>
            </Box>
            <Typography style={{ fontSize: 18, fontWeight: 600 }}>
              {partner.name}
            </Typography>
            {partner.shortName && (
              <Typography style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                {partner.shortName}
              </Typography>
            )}
          </Box>
          <Button
            variant="text"
            startIcon="close"
            onClick={onClose}
          />
        </Box>

        {/* Basic Info Section */}
        <Box
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Typography
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: 8,
              marginBottom: 12,
            }}
          >
            {t('detailDialog.basicInfoTitle')}
          </Typography>

          {/* Address */}
          {partner.address && (
            <Box style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
              <Icon name="location_on" size={18} color="#6B7280" style={{ marginTop: 2 }} />
              <Box>
                <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                  {t('detailDialog.address')}
                </Typography>
                <Typography style={{ fontSize: 14 }}>{partner.address}</Typography>
                {partner.serviceArea && (
                  <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                    {partner.serviceArea}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Phone */}
          {partner.contactPhone && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="phone" size={18} color="#6B7280" />
              <Typography style={{ fontSize: 14 }}>{partner.contactPhone}</Typography>
            </Box>
          )}

          {/* Email */}
          {partner.contactEmail && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon name="email" size={18} color="#6B7280" />
              <Typography style={{ fontSize: 14 }}>{partner.contactEmail}</Typography>
            </Box>
          )}

          {/* Website - from qualifications */}
          {partner.qualifications &&
            (partner.qualifications as Record<string, unknown>).website && (
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="language" size={18} color="#6B7280" />
                <a
                  href={(partner.qualifications as Record<string, unknown>).website as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'none', fontSize: 14 }}
                >
                  {(partner.qualifications as Record<string, unknown>).website as string}
                </a>
              </Box>
            )}
        </Box>

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <Box style={{ marginBottom: 16 }}>
            <Typography style={{ fontWeight: 600, fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {t('detailDialog.certTitle')}
            </Typography>
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {certifications.map((cert, index) => (
                <Tag
                  key={index}
                  icon="verified"
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: 'none',
                  }}
                >
                  {cert}
                </Tag>
              ))}
            </Box>
          </Box>
        )}

        {/* Description Section */}
        {partner.description && (
          <Box
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Typography style={{ fontWeight: 600, fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {t('detailDialog.descTitle')}
            </Typography>
            <Typography style={{ fontSize: 14, lineHeight: 1.7 }}>
              {partner.description}
            </Typography>
          </Box>
        )}

        {/* Meta Info */}
        <Box style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Typography style={{ fontSize: 12, color: '#6B7280' }}>
            {t('detailDialog.codePrefix')}{partner.partnerCode}
          </Typography>
          <Typography style={{ fontSize: 12, color: '#6B7280' }}>
            ·
          </Typography>
          <Typography style={{ fontSize: 12, color: '#6B7280' }}>
            {t('detailDialog.createdPrefix')}{partner.createdAt?.split('T')[0]}
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default PartnerDetailDialog;
