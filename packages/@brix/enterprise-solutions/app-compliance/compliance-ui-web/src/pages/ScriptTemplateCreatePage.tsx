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
 * ScriptTemplateCreatePage
 * Page component for creating and editing script templates.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ScriptTemplateCreatePage
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { ScriptVariable, CreateScriptTemplateRequest } from '@brix-sdk/enterprise-compliance-shared';
import {
  ScriptCategory,
  ScriptScenario,
  SCRIPT_CATEGORY_CONFIG,
  SCRIPT_SCENARIO_CONFIG,
} from '@brix-sdk/enterprise-compliance-shared';
import { useScriptTemplateForm, useScriptTemplateDetail, useRealTimeComplianceCheck } from '../hooks';
import { ScriptEditor, ForbiddenWordChecker } from '../components';

/**
 * Props interface for ScriptTemplateCreatePage component.
 */
export interface ScriptTemplateCreatePageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Form field type definition.
 */
interface FormData {
  name: string;
  description: string;
  category: ScriptCategory | '';
  scenario: ScriptScenario | '';
  content: string;
  variables: ScriptVariable[];
  tags: string[];
}

/**
 * ScriptTemplateCreatePage handles creation and editing of script templates.
 * Features real-time compliance checking and variable management.
 * @param props - Component props
 * @returns Script template create/edit page
 */
const ScriptTemplateCreatePage: React.FC<ScriptTemplateCreatePageProps> = ({ className = '' }) => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    scenario: '',
    content: '',
    variables: [],
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);

  // Load existing template for edit mode
  const { state: detailState } = useScriptTemplateDetail(id || '');
  const { submit, isSubmitting } = useScriptTemplateForm();
  const { checkResult, checkText } = useRealTimeComplianceCheck();

  // Load template data when editing
  useEffect(() => {
    if (isEditMode && detailState.data) {
      const template = detailState.data;
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        scenario: template.scenario,
        content: template.content,
        variables: template.variables || [],
        tags: template.tags || [],
      });
    }
  }, [isEditMode, detailState.data]);

  // Trigger compliance check when content changes
  useEffect(() => {
    if (formData.content && showCompliancePanel) {
      checkText(formData.content);
    }
  }, [formData.content, showCompliancePanel, checkText]);

  /**
   * Handles form field changes.
   */
  const handleFieldChange = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  /**
   * Handles content change with variable extraction.
   */
  const handleContentChange = useCallback((content: string, variables: ScriptVariable[]) => {
    setFormData((prev) => ({
      ...prev,
      content,
      variables,
    }));
  }, []);

  /**
   * Handles adding a tag.
   */
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput('');
  }, [tagInput, formData.tags]);

  /**
   * Handles removing a tag.
   */
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  /**
   * Handles tag input key press.
   */
  const handleTagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  /**
   * Validates form data.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入模板名称';
    }
    if (!formData.category) {
      newErrors.category = '请选择分类';
    }
    if (!formData.scenario) {
      newErrors.scenario = '请选择场景';
    }
    if (!formData.content.trim()) {
      newErrors.content = '请输入话术内容';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handles form submission.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const request: CreateScriptTemplateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category as ScriptCategory,
        scenario: formData.scenario as ScriptScenario,
        content: formData.content,
        variables: formData.variables,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      if (isEditMode && id) {
        await submit({ ...request, id });
      } else {
        await submit(request);
      }

      navigation.navigate('/compliance/scripts');
    } catch (error) {
      // Error handling would be done via notification service
    }
  }, [formData, isEditMode, id, navigation, submit, validateForm]);

  /**
   * Handles cancel action.
   */
  const handleCancel = useCallback(() => {
    navigation.navigate('/compliance/scripts');
  }, [navigation]);

  /**
   * Compliance check summary.
   */
  const complianceSummary = useMemo(() => {
    if (!checkResult) return null;
    
    const hasIssues = checkResult.matches && checkResult.matches.length > 0;
    return {
      hasIssues,
      count: checkResult.matches?.length || 0,
      passRate: checkResult.passRate,
    };
  }, [checkResult]);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: tokens.colors.surface.page,
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: tokens.colors.text.secondary,
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  };

  const formContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showCompliancePanel ? '1fr 320px' : '1fr',
    gap: '24px',
  };

  const formStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  };

  const requiredStyle: React.CSSProperties = {
    color: tokens.colors.status.error,
    marginLeft: '4px',
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${hasError ? tokens.colors.status.error : tokens.colors.border.subtle}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  });

  const selectStyle = (hasError: boolean): React.CSSProperties => ({
    ...inputStyle(hasError),
    backgroundColor: tokens.colors.surface.card,
    cursor: 'pointer',
  });

  const textareaStyle = (hasError: boolean): React.CSSProperties => ({
    ...inputStyle(hasError),
    resize: 'vertical',
    minHeight: '80px',
  });

  const errorTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: tokens.colors.status.error,
    marginTop: '4px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  };

  const tagsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  };

  const tagStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: tokens.colors.border.default,
    borderRadius: '4px',
    fontSize: '13px',
    color: tokens.colors.text.primary,
  };

  const tagRemoveStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    color: tokens.colors.text.secondary,
  };

  const tagInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const tagInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  };

  const addTagButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    color: tokens.colors.text.primary,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${tokens.colors.border.default}`,
    marginTop: '24px',
  };

  const complianceToggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: tokens.colors.text.primary,
  };

  const checkboxStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const compliancePanelStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    position: 'sticky',
    top: '24px',
    maxHeight: 'calc(100vh - 48px)',
    overflow: 'auto',
  };

  const panelTitleStyle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  };

  const summaryStyle = (hasIssues: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: hasIssues ? tokens.colors.status.errorLight : '#f0fdf4',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: hasIssues ? tokens.colors.status.error : tokens.colors.status.success,
  });

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: `1px solid ${tokens.colors.border.default}`,
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: '10px 24px',
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...submitButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  if (isEditMode && detailState.loading) {
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${tokens.colors.border.default}`,
            borderTopColor: tokens.colors.brand.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={`script-template-create-page ${className}`} style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <button style={backButtonStyle} onClick={handleCancel}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回
          </button>
          <h1 style={titleStyle}>{isEditMode ? '编辑话术模板' : '创建话术模板'}</h1>
        </div>
      </div>

      {/* Form Container */}
      <div style={formContainerStyle}>
        {/* Main Form */}
        <form style={formStyle} onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              模板名称
              <span style={requiredStyle}>*</span>
            </label>
            <input
              type="text"
              style={inputStyle(Boolean(errors.name))}
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="请输入模板名称"
            />
            {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>描述</label>
            <textarea
              style={textareaStyle(false)}
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="请输入模板描述（可选）"
              rows={3}
            />
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                分类
                <span style={requiredStyle}>*</span>
              </label>
              <select
                style={selectStyle(Boolean(errors.category))}
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
              >
                <option value="">请选择分类</option>
                {Object.entries(SCRIPT_CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              {errors.category && <p style={errorTextStyle}>{errors.category}</p>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>
                场景
                <span style={requiredStyle}>*</span>
              </label>
              <select
                style={selectStyle(Boolean(errors.scenario))}
                value={formData.scenario}
                onChange={(e) => handleFieldChange('scenario', e.target.value)}
              >
                <option value="">请选择场景</option>
                {Object.entries(SCRIPT_SCENARIO_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              {errors.scenario && <p style={errorTextStyle}>{errors.scenario}</p>}
            </div>
          </div>

          {/* Tags */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>标签</label>
            <div style={tagInputContainerStyle}>
              <input
                type="text"
                style={tagInputStyle}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="输入标签后按回车添加"
              />
              <button type="button" style={addTagButtonStyle} onClick={handleAddTag}>
                添加
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div style={tagsContainerStyle}>
                {formData.tags.map((tag, index) => (
                  <span key={index} style={tagStyle}>
                    {tag}
                    <button
                      type="button"
                      style={tagRemoveStyle}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <h3 style={sectionTitleStyle}>话术内容</h3>

          <div style={complianceToggleStyle}>
            <input
              type="checkbox"
              style={checkboxStyle}
              checked={showCompliancePanel}
              onChange={(e) => setShowCompliancePanel(e.target.checked)}
              id="complianceToggle"
            />
            <label htmlFor="complianceToggle" style={{ cursor: 'pointer' }}>
              开启实时合规检查
            </label>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              话术内容
              <span style={requiredStyle}>*</span>
              <span style={{ fontWeight: 400, color: tokens.colors.text.secondary, marginLeft: '8px' }}>
                使用 {'{{变量名}}'} 插入变量
              </span>
            </label>
            <ScriptEditor
              value={formData.content}
              onChange={handleContentChange}
              variables={formData.variables}
              placeholder="请输入话术内容..."
              minHeight="200px"
            />
            {errors.content && <p style={errorTextStyle}>{errors.content}</p>}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button type="button" style={cancelButtonStyle} onClick={handleCancel}>
              取消
            </button>
            <button
              type="submit"
              style={isSubmitting ? disabledButtonStyle : submitButtonStyle}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : isEditMode ? '保存修改' : '创建模板'}
            </button>
          </div>
        </form>

        {/* Compliance Panel */}
        {showCompliancePanel && (
          <div style={compliancePanelStyle}>
            <h3 style={panelTitleStyle}>合规检查</h3>
            
            {complianceSummary && (
              <div style={summaryStyle(complianceSummary.hasIssues)}>
                {complianceSummary.hasIssues ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    发现 {complianceSummary.count} 个问题
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    内容合规
                  </>
                )}
              </div>
            )}

            <ForbiddenWordChecker
              text={formData.content}
              readOnly
              showInput={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptTemplateCreatePage;
