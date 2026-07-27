/**
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This software requires a valid Brix Enterprise license.
 * 
 * @fileoverview useTenantCreate - ViewModel Hook for Tenant Create Page
 *
 * Multi-step wizard ViewModel following the View → ViewModel → Repository
 * layering defined in v3.0.9 Blueprint §7.5.
 *
 * The local form model (TenantCreateForm) captures all wizard fields and
 * is mapped to the API contract (CreateTenantRequest) at submission time.
 */

import { useState, useMemo, useCallback } from 'react';
import { useHttp, useEventBus, useNavigation } from '@brix-sdk/runtime-sdk-react';
import { createTenantAdminRepository } from '../repositories';
import type { CreateTenantRequest, TenantDTO } from '@brix-sdk/tenant-shared';
import { TenantEvents } from '@brix-sdk/tenant-shared';

// =========================================
// Types
// =========================================

/** Feature toggle item for the features step */
export interface FeatureItem {
  key: string;
  name: string;
  description?: string;
}

/** Local form model — superset of API fields for the wizard UI */
export interface TenantCreateForm {
  code: string;
  name: string;
  description: string;
  contactEmail: string;
  featureKeys: string[];
  adminEmail: string;
  adminName: string;
  sendInvitation: boolean;
}

/** Error bag keyed by form field name */
export type TenantCreateErrors = Partial<Record<keyof TenantCreateForm, string>>;

/** ViewModel state exposed to the View layer */
export interface TenantCreateState {
  form: TenantCreateForm;
  currentStep: number;
  isSubmitting: boolean;
  errors: TenantCreateErrors;
  submitError: string | null;
  createdTenant: TenantDTO | null;
  availableFeatures: FeatureItem[];
}

/** ViewModel actions exposed to the View layer */
export interface TenantCreateActions {
  updateForm: (patch: Partial<TenantCreateForm>) => void;
  validateStep: () => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  submit: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
  viewCreatedTenant: () => void;
}

// =========================================
// Constants
// =========================================

const TOTAL_STEPS = 4;

const initialForm: TenantCreateForm = {
  code: '',
  name: '',
  description: '',
  contactEmail: '',
  featureKeys: [],
  adminEmail: '',
  adminName: '',
  sendInvitation: true,
};

/**
 * Platform features available for tenant configuration.
 * In a production system this list would be fetched from the backend;
 * here we provide sensible defaults so the wizard is functional.
 */
const DEFAULT_FEATURES: FeatureItem[] = [
  { key: 'partners', name: '合作伙伴管理', description: '管理合作伙伴信息和关系' },
  { key: 'booking', name: '预约管理', description: '在线预约与资源调度' },
  { key: 'products', name: '产品管理', description: '产品目录与定价' },
  { key: 'messenger', name: '消息中心', description: '站内消息与通知' },
  { key: 'storage', name: '文件存储', description: '文件上传与管理' },
];

// =========================================
// Validation helpers
// =========================================

function validateCode(code: string): string | null {
  if (!code) return '租户代码必填';
  if (code.length < 3) return '租户代码至少 3 个字符';
  if (code.length > 50) return '租户代码最多 50 个字符';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(code)) {
    return '租户代码只能包含小写字母、数字和连字符，且必须以字母或数字开头和结尾';
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '请输入有效的邮箱地址';
  }
  return null;
}

/**
 * Per-step validation. Returns errors only for fields relevant to the
 * given step so that the wizard can gate progression.
 */
function validateStepFields(step: number, form: TenantCreateForm): TenantCreateErrors {
  const errs: TenantCreateErrors = {};

  if (step === 0) {
    const codeErr = validateCode(form.code);
    if (codeErr) errs.code = codeErr;
    if (!form.name) errs.name = '租户名称必填';
    else if (form.name.length > 100) errs.name = '租户名称最多 100 个字符';
    const emailErr = validateEmail(form.contactEmail);
    if (emailErr) errs.contactEmail = emailErr;
  }

  if (step === 2) {
    if (!form.adminEmail) {
      errs.adminEmail = '管理员邮箱必填';
    } else {
      const emailErr = validateEmail(form.adminEmail);
      if (emailErr) errs.adminEmail = emailErr;
    }
  }

  return errs;
}

// =========================================
// Hook
// =========================================

/**
 * useTenantCreate Hook - ViewModel for the multi-step Tenant Create wizard.
 *
 * Exposes `state` (read-only view model) and `actions` (user intents)
 * following the ViewModel contract pattern (v3.0.9 Blueprint §7.5).
 */
export function useTenantCreate(): { state: TenantCreateState; actions: TenantCreateActions } {
  // =========================================
  // Capabilities
  // =========================================
  const http = useHttp();
  const eventBus = useEventBus();
  const navigation = useNavigation();

  // =========================================
  // Repository
  // =========================================
  const repository = useMemo(() => createTenantAdminRepository(http), [http]);

  // =========================================
  // State
  // =========================================
  const [form, setForm] = useState<TenantCreateForm>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<TenantCreateErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<TenantDTO | null>(null);

  // =========================================
  // Actions
  // =========================================

  const updateForm = useCallback((patch: Partial<TenantCreateForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Clear errors for updated fields
    const clearedErrors: TenantCreateErrors = {};
    for (const key of Object.keys(patch) as (keyof TenantCreateForm)[]) {
      clearedErrors[key] = undefined;
    }
    setErrors((prev) => ({ ...prev, ...clearedErrors }));
  }, []);

  const validateStep = useCallback(async (): Promise<boolean> => {
    const stepErrors = validateStepFields(currentStep, form);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, form]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const submit = useCallback(async () => {
    // Full validation across all steps
    const allErrors: TenantCreateErrors = {};
    for (let s = 0; s < TOTAL_STEPS; s++) {
      Object.assign(allErrors, validateStepFields(s, form));
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Map local form → API contract
      const request: CreateTenantRequest = {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        initialAdmin: form.adminEmail,
        sendActivationEmail: form.sendInvitation,
      };
      const tenant = await repository.createTenant(request);
      setCreatedTenant(tenant);
      eventBus.emit(TenantEvents.TENANT_CREATED, { tenantId: tenant.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建租户失败';
      setSubmitError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, repository, eventBus]);

  const navigateTo = useCallback((path: string) => {
    if (navigation.requestNavigate) {
      void navigation.requestNavigate(path);
      return;
    }
    navigation.navigate(path);
  }, [navigation]);

  const reset = useCallback(() => {
    setForm(initialForm);
    setCurrentStep(0);
    setErrors({});
    setSubmitError(null);
    setCreatedTenant(null);
  }, []);

  const cancel = useCallback(() => {
    navigateTo('/admin/tenants');
  }, [navigateTo]);

  const viewCreatedTenant = useCallback(() => {
    if (createdTenant) {
      navigateTo(`/admin/tenants/${createdTenant.id}`);
    }
  }, [createdTenant, navigateTo]);

  // =========================================
  // Return ViewModel
  // =========================================
  const state: TenantCreateState = {
    form,
    currentStep,
    isSubmitting,
    errors,
    submitError,
    createdTenant,
    availableFeatures: DEFAULT_FEATURES,
  };

  const actions: TenantCreateActions = {
    updateForm,
    validateStep,
    nextStep,
    prevStep,
    submit,
    reset,
    cancel,
    viewCreatedTenant,
  };

  return { state, actions };
}

export default useTenantCreate;
