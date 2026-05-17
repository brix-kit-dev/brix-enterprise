/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview TenantCreate Page (View Layer)
 * All UI text is i18n-driven via useTranslation().
 */

import { useUI, useI18n, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useTenantCreate } from '../../hooks';

/**
 * TenantCreate Page Component
 */
export function TenantCreatePage() {
  const { t } = useI18n('tenant');
  const { tokens } = useTheme();
  // =========================================
  // UI Components (via UIAdapter)
  // =========================================
  const {
    Card,
    Button,
    Input,
    FormItem,
    Switch,
    Divider,
    Steps,
    message,
  } = useUI();

  // =========================================
  // ViewModel Hook
  // =========================================
  const { state, actions } = useTenantCreate();

  // =========================================
  // Step Content Renderers
  // =========================================
  const renderBasicInfoStep = () => (
    <div className="step-content">
      <h3>{t('create.stepBasicInfo')}</h3>
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
    </div>
  );

  const renderFeaturesStep = () => (
    <div className="step-content">
      <h3>{t('create.stepFeatures')}</h3>
      <p style={{ color: tokens.colors.text.secondary, marginBottom: 24 }}>
        {t('create.featuresDesc')}
      </p>

      {state.availableFeatures.length === 0 ? (
        <p>{t('create.noFeatures')}</p>
      ) : (
        <div className="feature-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {state.availableFeatures.map((feature) => (
            <div
              key={feature.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{feature.name}</div>
                {feature.description && (
                  <div style={{ color: tokens.colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                    {feature.description}
                  </div>
                )}
              </div>
              <Switch
                checked={state.form.featureKeys?.includes(feature.key) ?? false}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const current = state.form.featureKeys || [];
                  const updated = checked
                    ? [...current, feature.key]
                    : current.filter((k: string) => k !== feature.key);
                  actions.updateForm({ featureKeys: updated });
                }}
                disabled={state.isSubmitting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAdminStep = () => (
    <div className="step-content">
      <h3>{t('create.stepAdmin')}</h3>
      <p style={{ color: tokens.colors.text.secondary, marginBottom: 24 }}>
        {t('create.adminDesc')}
      </p>

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

      <FormItem label={t('create.autoInvite')}>
        <Switch
          checked={state.form.sendInvitation ?? true}
          onChange={(event) => actions.updateForm({ sendInvitation: event.target.checked })}
          disabled={state.isSubmitting}
        />
        <span style={{ marginLeft: 8, color: tokens.colors.text.secondary }}>
          {state.form.sendInvitation !== false
            ? t('create.autoInviteOn')
            : t('create.autoInviteOff')}
        </span>
      </FormItem>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="step-content">
      <h3>{t('create.stepConfirm')}</h3>
      <p style={{ color: tokens.colors.text.secondary, marginBottom: 24 }}>
        {t('create.confirmDesc')}
      </p>

      <div
        className="confirm-info"
        style={{ background: tokens.colors.surface.page, padding: 24, borderRadius: 8 }}
      >
        <h4>{t('create.confirmBasicInfo')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', marginBottom: 16 }}>
          <span style={{ color: tokens.colors.text.secondary }}>{t('create.confirmTenantCode')}</span>
          <code>{state.form.code || '-'}</code>
          <span style={{ color: tokens.colors.text.secondary }}>{t('create.confirmTenantName')}</span>
          <span>{state.form.name || '-'}</span>
          <span style={{ color: tokens.colors.text.secondary }}>{t('create.confirmDescription')}</span>
          <span>{state.form.description || '-'}</span>
          <span style={{ color: tokens.colors.text.secondary }}>{t('create.confirmContactEmail')}</span>
          <span>{state.form.contactEmail || '-'}</span>
        </div>

        <Divider />

        <h4>{t('create.confirmFeatures')}</h4>
        <div style={{ marginBottom: 16 }}>
          {state.form.featureKeys?.length ? (
            state.form.featureKeys.map((key) => (
              <span
                key={key}
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: tokens.colors.brand.primaryLight,
                  border: `1px solid ${tokens.colors.brand.primary}`,
                  borderRadius: 4,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                {state.availableFeatures.find((f) => f.key === key)?.name || key}
              </span>
            ))
          ) : (
            <span style={{ color: tokens.colors.text.disabled }}>{t('create.noFeaturesSelected')}</span>
          )}
        </div>

        <Divider />

        <h4>{t('create.confirmAdmin')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px' }}>
          <span style={{ color: '#666' }}>{t('create.confirmAdminEmail')}</span>
          <span>{state.form.adminEmail || '-'}</span>
          <span style={{ color: '#666' }}>{t('create.confirmAdminName')}</span>
          <span>{state.form.adminName || '-'}</span>
          <span style={{ color: '#666' }}>{t('create.confirmSendInvite')}</span>
          <span>{state.form.sendInvitation !== false ? t('create.yes') : t('create.no')}</span>
        </div>
      </div>
    </div>
  );

  // =========================================
  // Step Configuration
  // =========================================
  const steps = [
    { title: t('create.stepBasicInfo'), content: renderBasicInfoStep() },
    { title: t('create.stepFeatures'), content: renderFeaturesStep() },
    { title: t('create.stepAdmin'), content: renderAdminStep() },
    { title: t('create.stepConfirm'), content: renderConfirmStep() },
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
      message.error(t('create.createFailed', { interpolation: { error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  // =========================================
  // Render
  // =========================================
  return (
    <div className="tenant-create-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Button
          onClick={actions.cancel}
          style={{ marginRight: 16 }}
          data-testid="tenant-create-cancel"
        >
          {t('create.backToList')}
        </Button>
        <h1 style={{ display: 'inline', margin: 0 }}>{t('create.pageTitle')}</h1>
      </div>

      <Card>
        {/* Steps Navigation */}
        <Steps
          current={state.currentStep}
          items={steps.map((s) => ({ title: s.title }))}
          style={{ marginBottom: 32 }}
        />

        {/* Step Content */}
        <div className="steps-content" style={{ minHeight: 300 }}>
          {steps[state.currentStep].content}
        </div>

        <Divider />

        {/* Step Actions */}
        <div className="steps-action" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
              disabled={state.isSubmitting}
              loading={state.isSubmitting}
              data-testid="tenant-create-submit"
            >
              {t('create.submitBtn')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default TenantCreatePage;
