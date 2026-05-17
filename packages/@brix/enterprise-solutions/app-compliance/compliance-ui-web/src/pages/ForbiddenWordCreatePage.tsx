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
 * ForbiddenWordCreatePage
 * Page component for creating and editing forbidden words.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ForbiddenWordCreatePage
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { CreateForbiddenWordRequest } from '@brix-sdk/enterprise-compliance-shared';
import {
  ForbiddenWordSeverity,
  ForbiddenWordCategory,
  SEVERITY_CONFIG,
  FORBIDDEN_CATEGORY_CONFIG,
} from '@brix-sdk/enterprise-compliance-shared';
import { useForbiddenWordForm, useForbiddenWordDetail } from '../hooks';
import { SeverityChip } from '../components';

/**
 * Props interface for ForbiddenWordCreatePage component.
 */
export interface ForbiddenWordCreatePageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Form field type definition.
 */
interface FormData {
  word: string;
  severity: ForbiddenWordSeverity | '';
  category: ForbiddenWordCategory | '';
  description: string;
  alternatives: string[];
  isActive: boolean;
}

/**
 * ForbiddenWordCreatePage handles creation and editing of forbidden words.
 * Features severity selection, category assignment, and alternative suggestions.
 * @param props - Component props
 * @returns Forbidden word create/edit page
 */
const ForbiddenWordCreatePage: React.FC<ForbiddenWordCreatePageProps> = ({ className = '' }) => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    word: '',
    severity: '',
    category: '',
    description: '',
    alternatives: [],
    isActive: true,
  });
  const [alternativeInput, setAlternativeInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing word for edit mode
  const { state: detailState } = useForbiddenWordDetail(id || '');
  const { submit, isSubmitting } = useForbiddenWordForm();

  // Load word data when editing
  useEffect(() => {
    if (isEditMode && detailState.data) {
      const word = detailState.data;
      setFormData({
        word: word.word,
        severity: word.severity,
        category: word.category,
        description: word.description || '',
        alternatives: word.alternatives || [],
        isActive: word.isActive,
      });
    }
  }, [isEditMode, detailState.data]);

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
   * Handles adding an alternative.
   */
  const handleAddAlternative = useCallback(() => {
    const alt = alternativeInput.trim();
    if (alt && !formData.alternatives.includes(alt)) {
      setFormData((prev) => ({
        ...prev,
        alternatives: [...prev.alternatives, alt],
      }));
    }
    setAlternativeInput('');
  }, [alternativeInput, formData.alternatives]);

  /**
   * Handles removing an alternative.
   */
  const handleRemoveAlternative = useCallback((altToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      alternatives: prev.alternatives.filter((alt) => alt !== altToRemove),
    }));
  }, []);

  /**
   * Handles alternative input key press.
   */
  const handleAlternativeKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAlternative();
    }
  }, [handleAddAlternative]);

  /**
   * Validates form data.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.word.trim()) {
      newErrors.word = '请输入禁用词';
    }
    if (!formData.severity) {
      newErrors.severity = '请选择严重等级';
    }
    if (!formData.category) {
      newErrors.category = '请选择分类';
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
      const request: CreateForbiddenWordRequest = {
        word: formData.word.trim(),
        severity: formData.severity as ForbiddenWordSeverity,
        category: formData.category as ForbiddenWordCategory,
        description: formData.description.trim() || undefined,
        alternatives: formData.alternatives.length > 0 ? formData.alternatives : undefined,
        isActive: formData.isActive,
      };

      if (isEditMode && id) {
        await submit({ ...request, id });
      } else {
        await submit(request);
      }

      navigation.navigate('/compliance/forbidden-words');
    } catch (error) {
    }
  }, [formData, isEditMode, id, navigation, submit, validateForm]);

  /**
   * Handles cancel action.
   */
  const handleCancel = useCallback(() => {
    navigation.navigate('/compliance/forbidden-words');
  }, [navigation]);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: tokens.colors.surface.page,
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
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
    marginBottom: '8px',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  };

  const formContainerStyle: React.CSSProperties = {
    maxWidth: '640px',
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

  const textareaStyle: React.CSSProperties = {
    ...inputStyle(false),
    resize: 'vertical',
    minHeight: '80px',
  };

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

  const severityGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginTop: '8px',
  };

  const severityOptionStyle = (isSelected: boolean, bgColor: string): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: isSelected ? bgColor : tokens.colors.surface.card,
    border: `2px solid ${isSelected ? bgColor : tokens.colors.border.default}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  });

  const alternativesContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  };

  const alternativeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    fontSize: '13px',
    color: tokens.colors.status.success,
  };

  const removeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    color: tokens.colors.status.success,
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const addButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#f3f4f6',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    color: tokens.colors.text.primary,
    whiteSpace: 'nowrap',
  };

  const toggleContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const toggleStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '48px',
    height: '24px',
    backgroundColor: isActive ? tokens.colors.status.success : tokens.colors.border.subtle,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  });

  const toggleKnobStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: isActive ? '26px' : '2px',
    width: '20px',
    height: '20px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
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

  const previewStyle: React.CSSProperties = {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
  };

  const previewTitleStyle: React.CSSProperties = {
    margin: '0 0 12px',
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
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
    <div className={`forbidden-word-create-page ${className}`} style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={handleCancel}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回
        </button>
        <h1 style={titleStyle}>{isEditMode ? '编辑禁用词' : '添加禁用词'}</h1>
      </div>

      {/* Form Container */}
      <div style={formContainerStyle}>
        <form style={formStyle} onSubmit={handleSubmit}>
          {/* Word Input */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              禁用词
              <span style={requiredStyle}>*</span>
            </label>
            <input
              type="text"
              style={inputStyle(Boolean(errors.word))}
              value={formData.word}
              onChange={(e) => handleFieldChange('word', e.target.value)}
              placeholder="请输入禁用词"
            />
            {errors.word && <p style={errorTextStyle}>{errors.word}</p>}
          </div>

          {/* Severity Selection */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              严重等级
              <span style={requiredStyle}>*</span>
            </label>
            <div style={severityGridStyle}>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => {
                const isSelected = formData.severity === key;
                return (
                  <div
                    key={key}
                    style={severityOptionStyle(isSelected, config.backgroundColor)}
                    onClick={() => handleFieldChange('severity', key)}
                  >
                    <SeverityChip severity={key as ForbiddenWordSeverity} size="small" />
                    <span style={{ fontSize: '12px', color: tokens.colors.text.secondary, marginTop: '4px' }}>
                      {config.description}
                    </span>
                  </div>
                );
              })}
            </div>
            {errors.severity && <p style={errorTextStyle}>{errors.severity}</p>}
          </div>

          {/* Category Selection */}
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
              {Object.entries(FORBIDDEN_CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            {errors.category && <p style={errorTextStyle}>{errors.category}</p>}
          </div>

          {/* Description */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>描述</label>
            <textarea
              style={textareaStyle}
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="请输入禁用原因或说明（可选）"
              rows={3}
            />
          </div>

          {/* Alternatives */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              推荐替代词
              <span style={{ fontWeight: 400, color: tokens.colors.text.secondary, marginLeft: '8px' }}>
                用户可使用这些词替代禁用词
              </span>
            </label>
            <div style={inputGroupStyle}>
              <input
                type="text"
                style={{ ...inputStyle(false), flex: 1 }}
                value={alternativeInput}
                onChange={(e) => setAlternativeInput(e.target.value)}
                onKeyPress={handleAlternativeKeyPress}
                placeholder="输入替代词后按回车添加"
              />
              <button type="button" style={addButtonStyle} onClick={handleAddAlternative}>
                添加
              </button>
            </div>
            {formData.alternatives.length > 0 && (
              <div style={alternativesContainerStyle}>
                {formData.alternatives.map((alt, index) => (
                  <span key={index} style={alternativeStyle}>
                    {alt}
                    <button
                      type="button"
                      style={removeButtonStyle}
                      onClick={() => handleRemoveAlternative(alt)}
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

          {/* Status Toggle */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>状态</label>
            <div style={toggleContainerStyle}>
              <div
                style={toggleStyle(formData.isActive)}
                onClick={() => handleFieldChange('isActive', !formData.isActive)}
              >
                <div style={toggleKnobStyle(formData.isActive)} />
              </div>
              <span style={{ fontSize: '14px', color: formData.isActive ? tokens.colors.status.success : tokens.colors.text.secondary }}>
                {formData.isActive ? '已启用' : '已禁用'}
              </span>
            </div>
          </div>

          {/* Preview */}
          {formData.word && formData.severity && (
            <div style={previewStyle}>
              <h4 style={previewTitleStyle}>预览</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: tokens.colors.status.errorLight,
                  color: tokens.colors.status.error,
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'line-through',
                }}>
                  {formData.word}
                </span>
                <SeverityChip severity={formData.severity as ForbiddenWordSeverity} />
                {formData.alternatives.length > 0 && (
                  <span style={{ fontSize: '13px', color: tokens.colors.text.secondary }}>
                    → 建议替换为: {formData.alternatives.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

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
              {isSubmitting ? '保存中...' : isEditMode ? '保存修改' : '添加禁用词'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForbiddenWordCreatePage;
