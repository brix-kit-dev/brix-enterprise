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
 * @file Contract Template Create/Edit Page
 * @description Page component for creating and editing contract templates
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 View layer guidelines, this page component
 * only handles UI rendering and delegates all business logic
 * to ViewModel hooks.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type {
  ContractTemplate,
  ContractTemplateVariable,
  CreateContractTemplateRequest,
} from '@brix-sdk/enterprise-contracts-shared';
import { useContractTemplateCreate, useContractTemplateDetail } from '../hooks';
import { TemplateVariableEditor, ContractPreview } from '../components';

// ============================================================================
// Styles
// ============================================================================

const getStyles = (tokens: any): Record<string, React.CSSProperties> => ({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  breadcrumbLink: {
    color: tokens.colors.brand.primary,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  primaryButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.brand.primary,
  },
  secondaryButton: {
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.card,
    border: `1px solid ${tokens.colors.border.subtle}`,
  },
  successButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.status.success,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  section: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  sectionContent: {
    padding: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '20px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  required: {
    color: tokens.colors.status.error,
    marginLeft: '4px',
  },
  input: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: tokens.colors.status.error,
  },
  textarea: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
  },
  contentTextarea: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '300px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
  },
  hint: {
    fontSize: '12px',
    color: tokens.colors.text.secondary,
    marginTop: '4px',
  },
  error: {
    fontSize: '12px',
    color: tokens.colors.status.error,
    marginTop: '4px',
  },
  previewSection: {
    position: 'sticky',
    top: '24px',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colors.text.secondary,
  },
  errorState: {
    textAlign: 'center',
    padding: '48px',
    color: tokens.colors.status.error,
    backgroundColor: tokens.colors.status.errorLight,
    borderRadius: '8px',
  },
});

// ============================================================================
// Type Definitions
// ============================================================================

interface FormErrors {
  name?: string;
  code?: string;
  content?: string;
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract Template Create/Edit Page
 *
 * Provides a form for creating and editing contract templates.
 *
 * @example
 * ```tsx
 * // Route: /contracts/templates/create
 * // Route: /contracts/templates/:id/edit
 * <ContractTemplateCreatePage />
 * ```
 */
export const ContractTemplateCreatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<CreateContractTemplateRequest>({
    name: '',
    code: '',
    content: '',
    description: '',
    category: '',
    variables: [],
  });
  
  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Preview values for testing
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Use ViewModel hooks
  const { create, update, loading: submitting } = useContractTemplateCreate();
  const { template, loading: loadingTemplate } = useContractTemplateDetail(id || '');

  // Load template data for edit mode
  useEffect(() => {
    if (isEdit && template) {
      setFormData({
        name: template.name,
        code: template.code,
        content: template.content,
        description: template.description || '',
        category: template.category || '',
        variables: template.variables || [],
      });
    }
  }, [isEdit, template]);

  /**
   * Handle form field change
   */
  const handleChange = useCallback((
    field: keyof CreateContractTemplateRequest,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  /**
   * Handle variables change
   */
  const handleVariablesChange = useCallback((variables: ContractTemplateVariable[]) => {
    setFormData(prev => ({
      ...prev,
      variables,
    }));
  }, []);

  /**
   * Validate form
   */
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入模板名称';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = '请输入模板编号';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = '编号只能包含大写字母、数字和下划线';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '请输入模板内容';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(async (asDraft: boolean = true) => {
    if (!validate()) {
      return;
    }

    try {
      if (isEdit) {
        await update(id!, formData);
      } else {
        await create(formData);
      }
      
      navigation.navigate('/contracts/templates');
    } catch (err) {
      // Error handled by hook
    }
  }, [validate, isEdit, id, formData, create, update, navigation]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    if (Object.keys(formData).some(key => {
      const value = formData[key as keyof CreateContractTemplateRequest];
      return value && (Array.isArray(value) ? value.length > 0 : String(value).trim());
    })) {
      if (!confirm('确定要离开吗？未保存的更改将丢失。')) {
        return;
      }
    }
    navigation.navigate('/contracts/templates');
  }, [formData, navigation]);

  /**
   * Build preview template object
   */
  const previewTemplate: ContractTemplate = {
    id: id || 'preview',
    name: formData.name || '合同模板',
    code: formData.code || 'TEMPLATE_CODE',
    content: formData.content,
    description: formData.description,
    category: formData.category,
    variables: formData.variables,
    status: 'DRAFT',
    version: '1.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Loading state for edit mode
  if (isEdit && loadingTemplate) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span
          style={styles.breadcrumbLink}
          onClick={() => navigation.navigate('/contracts/templates')}
        >
          合同模板
        </span>
        <span>/</span>
        <span>{isEdit ? '编辑模板' : '新建模板'}</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{isEdit ? '编辑合同模板' : '新建合同模板'}</h1>
        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            {submitting ? '保存中...' : '保存草稿'}
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.successButton,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? '保存中...' : '保存并发布'}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={styles.layout}>
        {/* Left: Form */}
        <div>
          {/* Basic Information */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>基本信息</h2>
            </div>
            <div style={styles.sectionContent}>
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    模板名称
                    <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      ...styles.input,
                      ...(errors.name ? styles.inputError : {}),
                    }}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="输入模板名称"
                  />
                  {errors.name && <span style={styles.error}>{errors.name}</span>}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>
                    模板编号
                    <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      ...styles.input,
                      ...(errors.code ? styles.inputError : {}),
                    }}
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    placeholder="如：SERVICE_AGREEMENT"
                    disabled={isEdit}
                  />
                  <span style={styles.hint}>只能包含大写字母、数字和下划线</span>
                  {errors.code && <span style={styles.error}>{errors.code}</span>}
                </div>
              </div>
              
              <div style={styles.fieldRow}>
                <div style={styles.field}>
                  <label style={styles.label}>分类</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="如：服务合同、代理合同"
                  />
                </div>
                <div style={styles.field}>
                  {/* Placeholder for alignment */}
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>描述</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="输入模板描述，说明用途、适用场景等"
                />
              </div>
            </div>
          </div>

          {/* Template Content */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>模板内容</h2>
            </div>
            <div style={styles.sectionContent}>
              <div style={styles.field}>
                <label style={styles.label}>
                  合同内容
                  <span style={styles.required}>*</span>
                </label>
                <textarea
                  style={{
                    ...styles.contentTextarea,
                    ...(errors.content ? styles.inputError : {}),
                  }}
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder={`输入合同内容，使用 {{变量名}} 插入变量。

示例：
甲方：{{partyAName}}
乙方：{{partyBName}}

甲乙双方本着平等自愿、诚实信用的原则，就医疗服务中介事宜达成如下协议：

一、服务内容
甲方委托乙方提供 {{serviceType}} 服务，服务期限为 {{servicePeriod}}。

二、服务费用
服务费用总计人民币 {{totalAmount}} 元整。`}
                />
                <span style={styles.hint}>
                  使用 {'{{变量名}}'} 格式插入变量，如 {'{{partyAName}}'}、{'{{totalAmount}}'}
                </span>
                {errors.content && <span style={styles.error}>{errors.content}</span>}
              </div>
            </div>
          </div>

          {/* Variables */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>变量定义</h2>
            </div>
            <div style={styles.sectionContent}>
              <TemplateVariableEditor
                variables={formData.variables || []}
                onChange={handleVariablesChange}
              />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={styles.previewSection}>
          <ContractPreview
            template={previewTemplate}
            variableValues={previewValues}
            highlightVariables={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractTemplateCreatePage;
