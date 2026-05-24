/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 *
 * @fileoverview TenantCreate Page (View Layer)
 * Commercial-grade multi-step wizard for provisioning a new enterprise tenant.
 * All UI text is i18n-driven via useI18n(). All colors via useTheme().tokens.
 * All components via useUI(). Zero direct MUI / raw-HTML heading usage.
 */

import { useUI, useI18n, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useTenantCreate } from '../../hooks';

// =========================================
// Presentation-layer constant: feature key to Material Icon name.
// This is a View concern (display mapping), not business logic.
// =========================================
const FEATURE_ICONS: Record<string, string> = {
  partners: 'handshake',
  booking: 'calendar_today',
  products: 'inventory_2',
  messenger: 'chat',
  storage: 'folder_open',
};
const DEFAULT_FEATURE_ICON = 'extension';

/**
 * TenantCreate Page Component
 *
 * Architecture layer: Plugin View (Layer 1).
 * Consumes ViewModel via `useTenantCreate()` hook; zero business logic here.
 */
export function TenantCreatePage() {
  const { t } = useI18n('tenant');
  const { tokens } = useTheme();

  // =========================================
  // UI Components (via UIAdapter, Constraint 9)
  // =========================================
  const {
    Card,
    Box,
    Stack,
    Button,
    Input,
    FormItem,
    Switch,
    Divider,
    Steps,
    Typography,
    Tag,
    Alert,
    Icon,
    message,
  } = useUI();

  // =========================================
  // ViewModel Hook
  // =========================================
  const { state, actions } = useTenantCreate();
  const pageMaxWidth = tokens.breakpoints.md;
  const featureIconBoxSize = tokens.spacing(5);
  const headerIconBoxSize = tokens.space.xxl;
  const headerIconSize = tokens.space.lg;
  const featureIconSize = tokens.spacing(2.5);
  const tagIconSize = tokens.spacing(1.75);
  const confirmLabelColumn = `minmax(${tokens.spacing(15)}, ${tokens.spacing(18)}) minmax(0, 1fr)`;

  // =========================================
  // Step Content Renderers
  // =========================================

  const renderBasicInfoStep = () => (
    <Stack direction="column" style={{ gap: tokens.space.lg }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('create.stepBasicInfo')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('create.basicInfoDesc')}
        </Typography>
      </Box>

      <Stack direction="column" style={{ gap: tokens.space.md }}>
        <FormItem
          label={t('create.tenantCode')}
          required
          helperText={state.errors.code || t('create.tenantCodeHelper')}
          validateStatus={state.errors.code ? 'error' : undefined}
        >
          <Input
            placeholder={t('create.tenantCodePlaceholder')}
            value={state.form.code}
            onChange={(e) => actions.updateForm({ code: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-code"
          />
        </FormItem>

        <Alert severity="warning" style={{ marginTop: tokens.space.xs }}>
          {t('create.tenantCodeTip')}
        </Alert>

        <FormItem
          label={t('create.tenantName')}
          required
          helperText={state.errors.name}
          validateStatus={state.errors.name ? 'error' : undefined}
        >
          <Input
            placeholder={t('create.tenantNamePlaceholder')}
            value={state.form.name}
            onChange={(e) => actions.updateForm({ name: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-name"
          />
        </FormItem>

        <FormItem label={t('create.description')}>
          <Input
            placeholder={t('create.descriptionPlaceholder')}
            value={state.form.description}
            onChange={(e) => actions.updateForm({ description: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-description"
          />
        </FormItem>

        <FormItem
          label={t('create.contactEmail')}
          helperText={state.errors.contactEmail}
          validateStatus={state.errors.contactEmail ? 'error' : undefined}
        >
          <Input
            type="email"
            placeholder={t('create.contactEmailPlaceholder')}
            value={state.form.contactEmail}
            onChange={(e) => actions.updateForm({ contactEmail: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-contact-email"
          />
        </FormItem>
      </Stack>
    </Stack>
  );

  const renderFeaturesStep = () => (
    <Stack direction="column" style={{ gap: tokens.space.lg }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('create.stepFeatures')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('create.featuresDesc')}
        </Typography>
      </Box>

      {state.availableFeatures.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          {t('create.noFeatures')}
        </Typography>
      ) : (
        <Stack direction="column" style={{ gap: tokens.space.sm }}>
          {state.availableFeatures.map((feature) => {
            const isEnabled = state.form.featureKeys?.includes(feature.key) ?? false;
            return (
              <Box
                key={feature.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${tokens.space.md} ${tokens.space.lg}`,
                  border: `1px solid ${isEnabled ? tokens.colors.brand.primary : tokens.colors.border.default}`,
                  borderRadius: tokens.shape.md,
                  background: isEnabled ? tokens.colors.brand.primaryLight : tokens.colors.surface.card,
                  transition: `border-color ${tokens.motion.durationShort} ${tokens.motion.easing}, background ${tokens.motion.durationShort} ${tokens.motion.easing}`,
                }}
                data-testid={`tenant-create-feature-${feature.key}`}
              >
                <Stack direction="row" style={{ gap: tokens.space.md, alignItems: 'center', minWidth: 0 }}>
                  <Box
                    style={{
                      width: featureIconBoxSize,
                      height: featureIconBoxSize,
                      borderRadius: tokens.shape.md,
                      background: isEnabled ? tokens.colors.brand.primary : tokens.colors.surface.page,
                      border: `1px solid ${isEnabled ? tokens.colors.brand.primary : tokens.colors.border.subtle}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={FEATURE_ICONS[feature.key] ?? DEFAULT_FEATURE_ICON}
                      style={{
                        fontSize: featureIconSize,
                        color: isEnabled ? tokens.colors.brand.primaryContrast : tokens.colors.text.secondary,
                      }}
                    />
                  </Box>
                  <Box style={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      style={{ fontWeight: 600, color: tokens.colors.text.primary }}
                    >
                      {feature.name}
                    </Typography>
                    {feature.description && (
                      <Typography variant="caption" color="textSecondary">
                        {feature.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Switch
                  checked={isEnabled}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    const current = state.form.featureKeys || [];
                    const updated = checked
                      ? [...current, feature.key]
                      : current.filter((k: string) => k !== feature.key);
                    actions.updateForm({ featureKeys: updated });
                  }}
                  disabled={state.isSubmitting}
                  data-testid={`tenant-create-feature-switch-${feature.key}`}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );

  const renderAdminStep = () => (
    <Stack direction="column" style={{ gap: tokens.space.lg }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('create.stepAdmin')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('create.adminDesc')}
        </Typography>
      </Box>

      <Stack direction="column" style={{ gap: tokens.space.md }}>
        <FormItem
          label={t('create.adminEmail')}
          required
          helperText={state.errors.adminEmail}
          validateStatus={state.errors.adminEmail ? 'error' : undefined}
        >
          <Input
            type="email"
            placeholder={t('create.adminEmailPlaceholder')}
            value={state.form.adminEmail}
            onChange={(e) => actions.updateForm({ adminEmail: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-admin-email"
          />
        </FormItem>

        <FormItem label={t('create.adminName')}>
          <Input
            placeholder={t('create.adminNamePlaceholder')}
            value={state.form.adminName}
            onChange={(e) => actions.updateForm({ adminName: e.target.value })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-admin-name"
          />
        </FormItem>

        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.space.sm,
            padding: `${tokens.space.md} ${tokens.space.lg}`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: tokens.shape.md,
            background: tokens.colors.surface.card,
          }}
        >
          <Switch
            checked={state.form.sendInvitation ?? true}
            onChange={(event) => actions.updateForm({ sendInvitation: event.target.checked })}
            disabled={state.isSubmitting}
            data-testid="tenant-create-auto-invite"
          />
          <Box>
            <Typography variant="subtitle2" style={{ fontWeight: 500 }}>
              {t('create.autoInvite')}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {state.form.sendInvitation !== false
                ? t('create.autoInviteOn')
                : t('create.autoInviteOff')}
            </Typography>
          </Box>
        </Box>

        <Alert severity="info">
          {t('create.inviteNote')}
        </Alert>
      </Stack>
    </Stack>
  );

  const renderConfirmStep = () => (
    <Stack direction="column" style={{ gap: tokens.space.lg }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('create.stepConfirm')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('create.confirmDesc')}
        </Typography>
      </Box>

      <Box
        style={{
          padding: tokens.space.lg,
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: tokens.shape.md,
          background: tokens.colors.surface.card,
        }}
      >
        <Stack direction="column" style={{ gap: tokens.space.sm }}>
          <Typography
            variant="overline"
            color="textSecondary"
            style={{ letterSpacing: 0, fontWeight: 600 }}
          >
            {t('create.confirmBasicInfo')}
          </Typography>
          <Divider />
          <Box style={{ display: 'grid', gridTemplateColumns: confirmLabelColumn, gap: `${tokens.space.sm} ${tokens.space.md}`, wordBreak: 'break-word' }}>
            <Typography variant="body2" color="textSecondary">{t('create.confirmTenantCode')}</Typography>
            <Tag color="primary" data-testid="confirm-tenant-code">{state.form.code || '-'}</Tag>
            <Typography variant="body2" color="textSecondary">{t('create.confirmTenantName')}</Typography>
            <Typography variant="body2">{state.form.name || '-'}</Typography>
            <Typography variant="body2" color="textSecondary">{t('create.confirmDescription')}</Typography>
            <Typography variant="body2">{state.form.description || '-'}</Typography>
            <Typography variant="body2" color="textSecondary">{t('create.confirmContactEmail')}</Typography>
            <Typography variant="body2">{state.form.contactEmail || '-'}</Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        style={{
          padding: tokens.space.lg,
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: tokens.shape.md,
          background: tokens.colors.surface.card,
        }}
      >
        <Stack direction="column" style={{ gap: tokens.space.sm }}>
          <Typography
            variant="overline"
            color="textSecondary"
            style={{ letterSpacing: 0, fontWeight: 600 }}
          >
            {t('create.confirmFeatures')}
          </Typography>
          <Divider />
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.space.sm }}>
            {state.form.featureKeys?.length ? (
              state.form.featureKeys.map((key) => (
                <Tag
                  key={key}
                  color="primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: tokens.space.xs }}
                >
                  <Icon
                    name={FEATURE_ICONS[key] ?? DEFAULT_FEATURE_ICON}
                    style={{ fontSize: tagIconSize }}
                  />
                  {state.availableFeatures.find((f) => f.key === key)?.name || key}
                </Tag>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                {t('create.noFeaturesSelected')}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      <Box
        style={{
          padding: tokens.space.lg,
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: tokens.shape.md,
          background: tokens.colors.surface.card,
        }}
      >
        <Stack direction="column" style={{ gap: tokens.space.sm }}>
          <Typography
            variant="overline"
            color="textSecondary"
            style={{ letterSpacing: 0, fontWeight: 600 }}
          >
            {t('create.confirmAdmin')}
          </Typography>
          <Divider />
          <Box style={{ display: 'grid', gridTemplateColumns: confirmLabelColumn, gap: `${tokens.space.sm} ${tokens.space.md}`, wordBreak: 'break-word' }}>
            <Typography variant="body2" color="textSecondary">{t('create.confirmAdminEmail')}</Typography>
            <Typography variant="body2">{state.form.adminEmail || '-'}</Typography>
            <Typography variant="body2" color="textSecondary">{t('create.confirmAdminName')}</Typography>
            <Typography variant="body2">{state.form.adminName || '-'}</Typography>
            <Typography variant="body2" color="textSecondary">{t('create.confirmSendInvite')}</Typography>
            <Typography variant="body2">
              {state.form.sendInvitation !== false ? t('create.yes') : t('create.no')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );

  // =========================================
  // Step Configuration
  // =========================================
  const steps = [
    {
      title: t('create.stepBasicInfo'),
      description: t('create.stepDesc.basicInfo'),
      content: renderBasicInfoStep(),
    },
    {
      title: t('create.stepFeatures'),
      description: t('create.stepDesc.features'),
      content: renderFeaturesStep(),
    },
    {
      title: t('create.stepAdmin'),
      description: t('create.stepDesc.admin'),
      content: renderAdminStep(),
    },
    {
      title: t('create.stepConfirm'),
      description: t('create.stepDesc.confirm'),
      content: renderConfirmStep(),
    },
  ];

  // =========================================
  // Event Handlers
  // =========================================
  const handleNext = async () => {
    const isValid = await actions.validateStep();
    if (isValid) {
      actions.nextStep();
    }
  };

  const handleSubmit = async () => {
    try {
      await actions.submit();
      message.success(t('create.createSuccess'));
      actions.cancel();
    } catch (error) {
      message.error(
        t('create.createFailed', {
          interpolation: { error: error instanceof Error ? error.message : 'Unknown error' },
        }),
      );
    }
  };

  // =========================================
  // Render
  // =========================================
  return (
    <Stack direction="column" style={{ gap: tokens.space.lg, maxWidth: pageMaxWidth, margin: '0 auto' }}>
      {/* Page Header */}
      <Box>
        <Button
          variant="text"
          startIcon="arrow_back"
          onClick={actions.cancel}
          style={{ marginBottom: tokens.space.sm, padding: 0 }}
          data-testid="tenant-create-cancel"
        >
          {t('create.backToList')}
        </Button>

        <Stack direction="row" style={{ gap: tokens.space.md, alignItems: 'flex-start' }}>
          <Box
            style={{
              width: headerIconBoxSize,
              height: headerIconBoxSize,
              borderRadius: tokens.shape.md,
              background: tokens.colors.brand.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="domain_add" style={{ fontSize: headerIconSize, color: tokens.colors.brand.primaryContrast }} />
          </Box>
          <Box>
            <Typography variant="h5" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t('create.pageTitle')}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginTop: tokens.space.xs }}>
              {t('create.pageSubtitle')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Wizard Card */}
      <Card>
        {/* Steps Progress */}
        <Steps
          current={state.currentStep}
          items={steps.map((s) => ({ title: s.title, description: s.description }))}
          style={{ marginBottom: tokens.space.xl }}
        />

        {/* Step Content */}
        <Box style={{ minHeight: tokens.spacing(40) }}>
          {steps[state.currentStep].content}
        </Box>

        <Divider style={{ margin: `${tokens.space.lg} 0` }} />

        {/* Navigation Actions */}
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            {t('create.stepProgress', { current: state.currentStep + 1, total: steps.length })}
          </Typography>
          <Stack direction="row" style={{ gap: tokens.space.sm }}>
            {state.currentStep > 0 && (
              <Button
                onClick={actions.prevStep}
                disabled={state.isSubmitting}
                data-testid="tenant-create-prev"
              >
                {t('create.prevStep')}
              </Button>
            )}
            {state.currentStep < steps.length - 1 && (
              <Button
                onClick={handleNext}
                variant="primary"
                endIcon="arrow_forward"
                disabled={state.isSubmitting}
                data-testid="tenant-create-next"
              >
                {t('create.nextStep')}
              </Button>
            )}
            {state.currentStep === steps.length - 1 && (
              <Button
                onClick={handleSubmit}
                variant="primary"
                startIcon="check_circle"
                disabled={state.isSubmitting}
                loading={state.isSubmitting}
                data-testid="tenant-create-submit"
              >
                {t('create.submitBtn')}
              </Button>
            )}
          </Stack>
        </Box>
      </Card>
    </Stack>
  );
}

export default TenantCreatePage;
