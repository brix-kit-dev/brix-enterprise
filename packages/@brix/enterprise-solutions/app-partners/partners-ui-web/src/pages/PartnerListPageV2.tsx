/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 */
/**
 * @file Partner List Page V2 Component (UIAdapter pattern + Brix Design Tokens)
 * @description Card-based grid view for partner management.
 *
 * Architecture Alignment (v3.0.9 Blueprint & Design Token Plan Phase 6):
 * - All platform-level visual tokens obtained via `useTheme().tokens`
 *   (Brix semantic design tokens, NOT MUI palette/shape/typography)
 * - UI components obtained through useUI() hook (UIAdapter pattern, Constraint 9)
 * - Visual layout aligned with ProductListPageV2 (page-level consistency):
 *     - Toolbar card wrapping search + refresh + create + pill tabs
 *     - Pill tabs with inline count badge
 *     - Page background = surface.page; toolbar/cards = surface.card
 *     - titleMedium for sub-page heading (titleLarge reserved for page hero)
 * - View → Hook delegation only; no MUI / Ant / hardcoded hex / hardcoded px
 *
 * @module @brix-sdk/enterprise-partners-ui-web/pages
 * @version 3.2.2
 * @author Brix Platform Team
 * @date 2026-04-30
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUI, useI18n, useTheme, useNavigation } from '@brix-sdk/runtime-sdk-react';

import { usePartnerList } from '../hooks/usePartnerList';
import { usePartnerCreate } from '../hooks/usePartnerCreate';
import { PartnerCard } from '../components/PartnerCard';
import { PartnerDetailDialog } from '../components/PartnerDetailDialog';
import { AddPartnerDialog } from '../components/AddPartnerDialog';
import type { PartnerDTO, PartnerType } from '../types';

// ============================================================================
// Constants
// ============================================================================

interface TabConfig {
  value: PartnerType | 'ALL';
  labelKey: string;
}

const TYPE_TABS: TabConfig[] = [
  { value: 'ALL', labelKey: 'listV2.allTab' },
  { value: 'HOSPITAL', labelKey: 'listV2.hospitalTab' },
  { value: 'TRANSLATION', labelKey: 'listV2.translationTab' },
  { value: 'HOTEL', labelKey: 'listV2.hotelTab' },
  { value: 'TRANSPORT', labelKey: 'listV2.transportTab' },
  { value: 'OTHER', labelKey: 'listV2.otherTab' },
];

// ============================================================================
// Component
// ============================================================================

export const PartnerListPageV2: React.FC = () => {
  const { Box, Typography, Button, Input, Tag, Alert, Spin, Icon } = useUI();
  const { t } = useI18n('partners');
  const { tokens } = useTheme();
  const navigate = useNavigation();

  const {
    partners,
    loading,
    error,
    typeFilter,
    permissions,
    refresh,
    filterByType,
  } = usePartnerList();

  const {
    createPartner,
    submitting: createLoading,
  } = usePartnerCreate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<PartnerDTO | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // ── Derived state ────────────────────────────────────────────────
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const query = searchQuery.toLowerCase();
    return partners.filter(partner =>
      partner.name.toLowerCase().includes(query) ||
      partner.shortName?.toLowerCase().includes(query) ||
      partner.address?.toLowerCase().includes(query) ||
      partner.partnerCode?.toLowerCase().includes(query),
    );
  }, [partners, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: partners.length };
    partners.forEach(p => {
      counts[p.partnerType] = (counts[p.partnerType] || 0) + 1;
    });
    return counts;
  }, [partners]);

  const currentTab: PartnerType | 'ALL' = typeFilter || 'ALL';

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSearchQuery(event.target.value);
    },
    [],
  );

  const handleTabClick = useCallback((value: PartnerType | 'ALL') => {
    filterByType(value === 'ALL' ? null : value);
  }, [filterByType]);

  const handlePartnerClick = useCallback((partner: PartnerDTO) => {
    setSelectedPartner(partner);
    setDetailOpen(true);
  }, []);

  const handleAddPartner = useCallback(async (data: Partial<PartnerDTO>) => {
    await createPartner(data as any);
    refresh();
  }, [createPartner, refresh]);

  const handleEditPartner = useCallback((partner: PartnerDTO) => {
    setDetailOpen(false);
    // Concrete path matches ui-manifest suggestedPath `/partners/:id/edit`.
    navigate.navigate(`/partners/${partner.id}/edit`);
  }, [navigate]);

  const handleBindPackage = useCallback((_partner: PartnerDTO) => {
    setDetailOpen(false);
    // Binding flow not yet routed; intentionally no-op (parity with products).
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // ── Render helpers ───────────────────────────────────────────────
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
        <Icon
          name={searchQuery ? 'search_off' : 'group_add'}
          size={48}
          color={tokens.colors.text.disabled}
        />
      </Box>
      <Typography
        style={{
          color: tokens.colors.text.secondary,
          fontSize: tokens.typography.bodyMedium.fontSize,
          marginBottom: tokens.space.xs,
        }}
      >
        {searchQuery ? t('listV2.noSearchResults') : t('listV2.noData')}
      </Typography>
      <Typography
        style={{
          color: tokens.colors.text.disabled,
          fontSize: tokens.typography.bodySmall.fontSize,
        }}
      >
        {t('listV2.noDataHint')}
      </Typography>
    </Box>
  );

  // ── Render ───────────────────────────────────────────────────────
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
          {t('listV2.title')}
        </Typography>
        <Typography
          style={{
            fontSize: tokens.typography.bodySmall.fontSize,
            color: tokens.colors.text.secondary,
          }}
        >
          {t('listV2.subtitle')}
        </Typography>
      </Box>

      {/* Toolbar Card: Search + Actions + Type Pills */}
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
              placeholder={t('listV2.searchPlaceholder')}
              value={searchQuery}
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
              onClick={() => setAddOpen(true)}
              disabled={createLoading}
              startIcon="add"
              style={{
                padding: `0 ${tokens.space.md}`,
                borderRadius: tokens.shape.md,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {t('listV2.createBtn')}
            </Button>
          )}
        </Box>

        {/* Type Filter Tabs (pill-style, matches ProductListPageV2) */}
        <Box
          style={{
            display: 'flex',
            gap: tokens.space.xs,
            flexWrap: 'wrap',
          }}
        >
          {TYPE_TABS.map(tab => {
            const count = typeCounts[tab.value] || 0;
            const isSelected = currentTab === tab.value;

            return (
              <Tag
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
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
                  transition: `all ${tokens.motion.durationShort} ${tokens.motion.easing}`,
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
                <span>{t(tab.labelKey)}</span>
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

      {/* Partner Grid / Loading / Empty */}
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
      ) : filteredPartners.length === 0 ? (
        renderEmpty()
      ) : (
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: tokens.space.md,
          }}
        >
          {filteredPartners.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onClick={handlePartnerClick}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <PartnerDetailDialog
        open={detailOpen}
        partner={selectedPartner}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditPartner}
        onBindPackage={handleBindPackage}
      />

      <AddPartnerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPartner}
        loading={createLoading}
      />
    </Box>
  );
};

export default PartnerListPageV2;
