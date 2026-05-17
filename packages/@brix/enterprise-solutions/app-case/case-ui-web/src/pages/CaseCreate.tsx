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
 * @file Case Create Page
 * @description View layer - Create new case with form
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Form component for case creation
 * - Data submission through useCaseCreate hook
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useCaseCreate } from '../hooks/useCase';
import { useTemplateList } from '../hooks/useTemplate';
import type { CaseCreateRequest, CasePriority, CaseType } from '@brix-sdk/enterprise-case-shared';
import { CaseStatus, CASE_PRIORITY_CONFIG, CASE_TYPE_CONFIG } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Form State Type
// ============================================================================

interface FormState {
  title: string;
  description: string;
  caseType: CaseType;
  priority: CasePriority;
  customerId: string;
  customerName: string;
  dueDate: string;
  templateId: string;
}

const initialFormState: FormState = {
  title: '',
  description: '',
  caseType: 'MEDICAL_INTERMEDIARY',
  priority: 'MEDIUM',
  customerId: '',
  customerName: '',
  dueDate: '',
  templateId: '',
};

// ============================================================================
// Form Validation
// ============================================================================

interface FormErrors {
  title?: string;
  customerId?: string;
  caseType?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = '案例标题为必填项';
  } else if (form.title.length < 3) {
    errors.title = '案例标题至少需要3个字符';
  } else if (form.title.length > 100) {
    errors.title = '案例标题不能超过100个字符';
  }

  if (!form.customerId.trim()) {
    errors.customerId = '请选择客户';
  }

  if (!form.caseType) {
    errors.caseType = '请选择案例类型';
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case Create Page Component
 */
const CaseCreatePage: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Hooks
  const { createItem, isCreating, error: createError } = useCaseCreate();
  const { items: templates, isLoading: isLoadingTemplates } = useTemplateList();

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleBack = useCallback(() => {
    if (window.confirm('确定要离开吗？未保存的内容将丢失。')) {
      navigation.navigate('/case');
    }
  }, [navigation]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate single field on blur
    const fieldErrors = validateForm(form);
    if (fieldErrors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
    }
  }, [form]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setForm(prev => ({
        ...prev,
        templateId: template.id,
        caseType: template.caseType,
        title: prev.title || template.name,
        description: prev.description || template.description || '',
      }));
    }
  }, [templates]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({
      title: true,
      customerId: true,
      caseType: true,
    });

    if (hasErrors(validationErrors)) {
      return;
    }

    // Build request
    const request: CaseCreateRequest = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      caseType: form.caseType,
      priority: form.priority,
      customerId: form.customerId,
      customerName: form.customerName.trim() || undefined,
      dueDate: form.dueDate || undefined,
      templateId: form.templateId || undefined,
      status: CaseStatus.DRAFT,
      metadata: {},
    };

    try {
      const created = await createItem(request);
      navigation.navigate(`/case/${created.id}`);
    } catch (err) {
      // Error is captured by hook
    }
  }, [form, createItem, navigation]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backLink}>
          ← 返回列表
        </button>
        <h1 style={styles.title}>创建新案例</h1>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Template Selection */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 选择模板（可选）</h2>
          <p style={styles.sectionDesc}>选择模板可以自动填充案例类型和工作流程节点</p>
          
          <div style={styles.templateGrid}>
            {isLoadingTemplates ? (
              <div style={styles.loadingText}>加载模板中...</div>
            ) : templates.length === 0 ? (
              <div style={styles.emptyText}>暂无模板</div>
            ) : (
              templates
                .filter(t => t.isActive)
                .map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    style={{
                      ...styles.templateCard,
                      ...(form.templateId === template.id ? styles.templateCardActive : {}),
                    }}
                  >
                    <div style={styles.templateName}>{template.name}</div>
                    <div style={styles.templateMeta}>
                      {CASE_TYPE_CONFIG[template.caseType]?.label || template.caseType}
                      {template.nodeCount !== undefined && ` · ${template.nodeCount} 节点`}
                    </div>
                    {template.description && (
                      <div style={styles.templateDesc}>{template.description}</div>
                    )}
                    {form.templateId === template.id && (
                      <span style={styles.templateCheck}>✓</span>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 基本信息</h2>
          
          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              案例标题 <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="请输入案例标题"
              style={{
                ...styles.input,
                ...(touched.title && errors.title ? styles.inputError : {}),
              }}
              maxLength={100}
            />
            {touched.title && errors.title && (
              <span style={styles.errorText}>{errors.title}</span>
            )}
            <span style={styles.charCount}>{form.title.length}/100</span>
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>案例描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="请输入案例描述（可选）"
              style={styles.textarea}
              rows={4}
              maxLength={500}
            />
            <span style={styles.charCount}>{form.description.length}/500</span>
          </div>
        </div>

        {/* Case Type & Priority */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚙️ 案例分类</h2>
          
          <div style={styles.formRow}>
            {/* Case Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                案例类型 <span style={styles.required}>*</span>
              </label>
              <select
                name="caseType"
                value={form.caseType}
                onChange={handleInputChange}
                style={{
                  ...styles.select,
                  ...(touched.caseType && errors.caseType ? styles.inputError : {}),
                }}
              >
                {Object.entries(CASE_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
              {touched.caseType && errors.caseType && (
                <span style={styles.errorText}>{errors.caseType}</span>
              )}
            </div>

            {/* Priority */}
            <div style={styles.formGroup}>
              <label style={styles.label}>优先级</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleInputChange}
                style={styles.select}
              >
                {Object.entries(CASE_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👤 客户信息</h2>
          
          <div style={styles.formRow}>
            {/* Customer ID */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                客户ID <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="customerId"
                value={form.customerId}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="请输入或选择客户ID"
                style={{
                  ...styles.input,
                  ...(touched.customerId && errors.customerId ? styles.inputError : {}),
                }}
              />
              {touched.customerId && errors.customerId && (
                <span style={styles.errorText}>{errors.customerId}</span>
              )}
            </div>

            {/* Customer Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>客户姓名</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleInputChange}
                placeholder="请输入客户姓名（可选）"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📅 时间安排</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>截止日期</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleInputChange}
              style={{ ...styles.input, maxWidth: '200px' }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Error Message */}
        {createError && (
          <div style={styles.formError}>
            ⚠️ 创建失败: {createError.message}
          </div>
        )}

        {/* Submit Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleBack}
            style={styles.cancelButton}
            disabled={isCreating}
          >
            取消
          </button>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={isCreating}
          >
            {isCreating ? '创建中...' : '创建案例'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: '24px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#6B7280',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '8px',
    display: 'block',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E5E7EB',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  sectionDesc: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  },
  templateCard: {
    position: 'relative',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  templateCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  templateName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '4px',
  },
  templateMeta: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px',
  },
  templateDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
    lineHeight: 1.4,
  },
  templateCheck: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  loadingText: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#6B7280',
    padding: '20px',
  },
  emptyText: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  required: {
    color: '#DC2626',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  charCount: {
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: '2px',
  },
  errorText: {
    fontSize: '12px',
    color: '#DC2626',
  },
  formError: {
    padding: '12px 16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default CaseCreatePage;
