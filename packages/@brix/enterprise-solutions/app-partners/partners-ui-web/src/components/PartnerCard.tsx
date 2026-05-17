/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Partner Card Component (UIAdapter pattern + Brix Design Tokens)
 * @description Card component for displaying partner in grid view.
 *
 * Architecture Alignment (v3.0.9 Blueprint & Design Token Plan Phase 6):
 * - Pure View component per v3.0.4 blueprint (no API calls, no business logic)
 * - All platform-level visual tokens obtained via `useTheme().tokens`
 *   (Brix semantic design tokens, NOT MUI palette/shape/typography)
 * - Business-domain colors (partner type / status) retained from theme module
 * - UI components obtained through useUI() hook (UIAdapter pattern, Constraint 9)
 *
 * @module @brix-sdk/enterprise-partners-ui-web/components
 * @version 3.2.1
 * @author Brix Platform Team
 * @date 2026-03-29
 */

import React from 'react';
import { useUI, useI18n, useTheme } from '@brix-sdk/runtime-sdk-react';

// Internal imports — only business-domain color helpers (Layer 3)
import { getPartnerTypeConfig, getPartnerStatusConfig } from '../theme';
import type { PartnerDTO } from '../types';

// ============================================================================
// Props Interface
// ============================================================================

/**
 * PartnerCard Props
 */
export interface PartnerCardProps {
  /** Partner data */
  partner: PartnerDTO;
  /** Click handler */
  onClick?: (partner: PartnerDTO) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Partner Card Component
 *
 * Displays partner information in a card format for grid view.
 * Designed for the partner list page with card-based layout.
 *
 * @param props Component props
 * @returns Partner card element
 */
export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick }) => {
  // UIAdapter hook — all UI components from BrixUI (Constraint 9)
  const { Box, Typography, Card, Tag, Icon, Tooltip } = useUI();
  // i18n hook
  const { t } = useI18n('partners');
  // Brix semantic design tokens — platform-level visual styling (Phase 6 migration)
  const { tokens } = useTheme();

  const typeConfig = getPartnerTypeConfig(partner.partnerType);
  const statusConfig = getPartnerStatusConfig(partner.status);

  /**
   * Handle card click
   */
  const handleClick = () => {
    onClick?.(partner);
  };

  /**
   * Parse certifications from qualifications field
   * Safely extracts certification array from JSON field
   */
  const certifications: string[] = (() => {
    if (!partner.qualifications) return [];
    const quals = partner.qualifications as Record<string, unknown>;
    if (Array.isArray(quals.certifications)) {
      return quals.certifications.slice(0, 3) as string[];
    }
    return [];
  })();

  return (
    <Card
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: `box-shadow ${tokens.motion.durationShort} ${tokens.motion.easing}, transform ${tokens.motion.durationShort} ${tokens.motion.easing}`,
        cursor: 'pointer',
        borderRadius: tokens.shape.lg,
        border: `1px solid ${tokens.colors.border.default}`,
        backgroundColor: tokens.colors.surface.card,
        boxShadow: tokens.shadows.sm,
      }}
      onClick={handleClick}
      hoverable
      bordered
      elevation={0}
    >
      <Box style={{ padding: tokens.space.lg, flex: 1 }}>
        {/* Header: Type badge and Status */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          {/* Type Badge with Icon */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: typeConfig.iconBg,
              }}
            >
              <Icon name="business" size={16} color={typeConfig.text} />
            </Box>
            <Tag
              style={{
                height: 22,
                fontSize: 12,
                backgroundColor: typeConfig.background,
                color: typeConfig.text,
                fontWeight: 500,
                border: 'none',
              }}
            >
              {t(typeConfig.labelKey)}
            </Tag>
          </Box>

          {/* Status Indicator */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusConfig.dot,
              }}
            />
            <Typography style={{ fontSize: tokens.typography.labelSmall.fontSize, color: tokens.colors.text.secondary }}>
              {t(statusConfig.labelKey)}
            </Typography>
          </Box>
        </Box>

        {/* Partner Name */}
        <Typography
          style={{
            fontWeight: tokens.typography.titleMedium.fontWeight,
            fontSize: tokens.typography.titleMedium.fontSize,
            color: tokens.colors.text.primary,
            marginBottom: 2,
            lineHeight: tokens.typography.titleMedium.lineHeight,
          }}
        >
          {partner.name}
        </Typography>

        {/* Short Name */}
        {partner.shortName && (
          <Typography
            style={{
              fontSize: tokens.typography.labelSmall.fontSize,
              color: tokens.colors.text.secondary,
              display: 'block',
              marginBottom: tokens.space.sm,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {partner.shortName}
          </Typography>
        )}

        {/* Region / Address */}
        {partner.address && (
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 12,
            }}
          >
            <Icon name="location_on" size={14} color={tokens.colors.text.secondary} />
            <Typography style={{ fontSize: tokens.typography.labelSmall.fontSize, color: tokens.colors.text.secondary }}>
              {partner.serviceArea || partner.address}
            </Typography>
          </Box>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {certifications.map((cert, index) => (
              <Tooltip key={index} title={cert}>
                <Tag
                  icon="verified"
                  style={{
                    height: 22,
                    fontSize: 11,
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    border: 'none',
                  }}
                >
                  {cert}
                </Tag>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Description */}
        {partner.description && (
          <Box
            style={{
              paddingTop: tokens.space.sm,
              borderTop: `1px solid ${tokens.colors.border.subtle}`,
            }}
          >
            <Typography
              style={{
                fontSize: tokens.typography.labelSmall.fontSize,
                color: tokens.colors.text.secondary,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: tokens.typography.bodySmall.lineHeight,
              }}
            >
              {partner.description}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default PartnerCard;
