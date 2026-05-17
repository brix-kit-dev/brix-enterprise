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
 * ScriptTemplateDetailPage
 * Page component for displaying script template details with tabs and actions.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ScriptTemplateDetailPage
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import type { ScriptVariable } from '@brix-sdk/enterprise-compliance-shared';
import {
  ScriptTemplateStatus,
  SCRIPT_CATEGORY_CONFIG,
  SCRIPT_SCENARIO_CONFIG,
} from '@brix-sdk/enterprise-compliance-shared';
import { useScriptTemplateDetail } from '../hooks';
import { ScriptStatusChip } from '../components';

/**
 * Props interface for ScriptTemplateDetailPage component.
 */
export interface ScriptTemplateDetailPageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Tab definition for detail page.
 */
type DetailTab = 'info' | 'preview' | 'variables' | 'history';

/**
 * ScriptTemplateDetailPage displays comprehensive information about a script template.
 * Includes tabbed interface for info, preview, variables, and history.
 * @param props - Component props
 * @returns Script template detail page
 */
const ScriptTemplateDetailPage: React.FC<ScriptTemplateDetailPageProps> = ({ className = '' }) => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const {
    state,
    publishTemplate,
    archiveTemplate,
    copyTemplate,
    refresh,
  } = useScriptTemplateDetail(id || '');

  const template = state.data;

  /**
   * Handles navigation back to list.
   */
  const handleBack = useCallback(() => {
    navigation.navigate('/compliance/scripts');
  }, [navigation]);

  /**
   * Handles navigation to edit page.
   */
  const handleEdit = useCallback(() => {
    navigation.navigate(`/compliance/scripts/${id}/edit`);
  }, [navigation, id]);

  /**
   * Handles publish action.
   */
  const handlePublish = useCallback(async () => {
    if (!template) return;
    
    setIsPublishing(true);
    try {
      await publishTemplate();
      // Success notification would be handled by an event
    } finally {
      setIsPublishing(false);
    }
  }, [template, publishTemplate]);

  /**
   * Handles archive action.
   */
  const handleArchive = useCallback(async () => {
    if (!template) return;
    
    setIsArchiving(true);
    try {
      await archiveTemplate();
    } finally {
      setIsArchiving(false);
    }
  }, [template, archiveTemplate]);

  /**
   * Handles copy action.
   */
  const handleCopy = useCallback(async () => {
    if (!template) return;
    
    setIsCopying(true);
    try {
      const { id: newId } = await copyTemplate();
      navigation.navigate(`/compliance/scripts/${newId}/edit`);
    } finally {
      setIsCopying(false);
    }
  }, [template, copyTemplate, navigation]);

  /**
   * Renders content preview with variable highlights.
   */
  /**
   * Renders content preview with variable highlights.
   * Sanitizes HTML output via DOMPurify to prevent XSS attacks.
   * Only allows safe inline styles and span elements for variable highlighting.
   */
  const renderPreviewContent = useCallback((content: string, variables: ScriptVariable[]) => {
    // First, escape raw content to prevent XSS from template.content
    let escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const variablePattern = /\{\{(\w+)\}\}/g;

    const highlighted = escaped.replace(variablePattern, (match, varName) => {
      const variable = variables.find(v => v.name === varName);
      const bgColor = variable ? tokens.colors.brand.primaryLight : tokens.colors.status.errorLight;
      const textColor = variable ? '#1e40af' : tokens.colors.status.error;
      return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${match}</span>`;
    });

    // Sanitize final output — allow only safe tags and inline styles
    return DOMPurify.sanitize(highlighted, {
      ALLOWED_TAGS: ['span', 'br'],
      ALLOWED_ATTR: ['style'],
    });
  }, [tokens]);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: tokens.colors.surface.page,
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    marginBottom: '16px',
  };

  const titleSectionStyle: React.CSSProperties = {
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '12px',
  };

  const metaItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    border: `1px solid ${tokens.colors.border.subtle}`,
  };

  const successButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: tokens.colors.status.success,
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: tokens.colors.status.warning,
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...secondaryButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    padding: '4px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    backgroundColor: isActive ? tokens.colors.brand.primary : 'transparent',
    color: isActive ? tokens.colors.surface.card : tokens.colors.text.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  };

  const previewContentStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
    lineHeight: 1.8,
    fontSize: '14px',
    color: tokens.colors.text.primary,
  };

  const variableTableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    color: tokens.colors.text.primary,
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px',
  };

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px',
    color: tokens.colors.status.error,
  };

  const tagStyle = (bgColor: string, textColor: string): React.CSSProperties => ({
    display: 'inline-flex',
    padding: '4px 10px',
    backgroundColor: bgColor,
    color: textColor,
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  });

  if (state.loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>
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

  if (state.error || !template) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回列表
        </button>
        <div style={errorStyle}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.status.error} strokeWidth="1.5" style={{ marginBottom: '16px' }}>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{state.error || '模板不存在'}</p>
        </div>
      </div>
    );
  }

  const categoryConfig = SCRIPT_CATEGORY_CONFIG[template.category];
  const scenarioConfig = SCRIPT_SCENARIO_CONFIG[template.scenario];
  const canPublish = template.status === ScriptTemplateStatus.DRAFT;
  const canArchive = template.status === ScriptTemplateStatus.PUBLISHED;
  const canEdit = template.status !== ScriptTemplateStatus.ARCHIVED;

  return (
    <div className={`script-template-detail-page ${className}`} style={pageStyle}>
      {/* Back button */}
      <button style={backButtonStyle} onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        返回列表
      </button>

      {/* Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h1 style={titleStyle}>
            {template.name}
            <ScriptStatusChip status={template.status} />
          </h1>
          {template.description && (
            <p style={{ margin: '0 0 12px', color: tokens.colors.text.secondary, fontSize: '14px' }}>
              {template.description}
            </p>
          )}
          <div style={metaStyle}>
            <span style={tagStyle(categoryConfig?.backgroundColor || '#f3f4f6', categoryConfig?.color || tokens.colors.text.secondary)}>
              {categoryConfig?.label || template.category}
            </span>
            <span style={tagStyle(scenarioConfig?.backgroundColor || '#f3f4f6', scenarioConfig?.color || tokens.colors.text.secondary)}>
              {scenarioConfig?.label || template.scenario}
            </span>
            <span style={metaItemStyle}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              更新于 {new Date(template.updatedAt).toLocaleString('zh-CN')}
            </span>
            <span style={metaItemStyle}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {template.createdBy}
            </span>
          </div>
        </div>

        <div style={actionsStyle}>
          {canPublish && (
            <button
              style={isPublishing ? disabledButtonStyle : successButtonStyle}
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? '发布中...' : '发布'}
            </button>
          )}
          {canArchive && (
            <button
              style={isArchiving ? disabledButtonStyle : dangerButtonStyle}
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? '归档中...' : '归档'}
            </button>
          )}
          <button
            style={isCopying ? disabledButtonStyle : secondaryButtonStyle}
            onClick={handleCopy}
            disabled={isCopying}
          >
            {isCopying ? '复制中...' : '复制'}
          </button>
          {canEdit && (
            <button style={primaryButtonStyle} onClick={handleEdit}>
              编辑
            </button>
          )}
          <button
            style={secondaryButtonStyle}
            onClick={refresh}
            title="刷新"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button style={tabStyle(activeTab === 'info')} onClick={() => setActiveTab('info')}>
          基本信息
        </button>
        <button style={tabStyle(activeTab === 'preview')} onClick={() => setActiveTab('preview')}>
          内容预览
        </button>
        <button style={tabStyle(activeTab === 'variables')} onClick={() => setActiveTab('variables')}>
          变量列表 ({template.variables?.length || 0})
        </button>
        <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          版本历史
        </button>
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        {activeTab === 'info' && (
          <>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>模板信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: tokens.colors.text.secondary, marginBottom: '4px' }}>模板ID</label>
                  <span style={{ fontSize: '14px', color: tokens.colors.text.primary }}>{template.id}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: tokens.colors.text.secondary, marginBottom: '4px' }}>版本</label>
                  <span style={{ fontSize: '14px', color: tokens.colors.text.primary }}>v{template.version}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: tokens.colors.text.secondary, marginBottom: '4px' }}>创建时间</label>
                  <span style={{ fontSize: '14px', color: tokens.colors.text.primary }}>{new Date(template.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: tokens.colors.text.secondary, marginBottom: '4px' }}>创建人</label>
                  <span style={{ fontSize: '14px', color: tokens.colors.text.primary }}>{template.createdBy}</span>
                </div>
              </div>
            </div>
            
            {template.tags && template.tags.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>标签</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {template.tags.map((tag, index) => (
                    <span key={index} style={{
                      padding: '4px 10px',
                      backgroundColor: tokens.colors.border.default,
                      color: tokens.colors.text.primary,
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'preview' && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>话术内容</h3>
            <div
              style={previewContentStyle}
              dangerouslySetInnerHTML={{
                __html: renderPreviewContent(template.content, template.variables || []),
              }}
            />
          </div>
        )}

        {activeTab === 'variables' && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>变量定义</h3>
            {template.variables && template.variables.length > 0 ? (
              <table style={variableTableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>变量名</th>
                    <th style={thStyle}>显示名称</th>
                    <th style={thStyle}>类型</th>
                    <th style={thStyle}>必填</th>
                    <th style={thStyle}>默认值</th>
                    <th style={thStyle}>描述</th>
                  </tr>
                </thead>
                <tbody>
                  {template.variables.map((variable, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        <code style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                          {`{{${variable.name}}}`}
                        </code>
                      </td>
                      <td style={tdStyle}>{variable.label}</td>
                      <td style={tdStyle}>{variable.type}</td>
                      <td style={tdStyle}>
                        {variable.required ? (
                          <span style={{ color: tokens.colors.status.error }}>是</span>
                        ) : (
                          <span style={{ color: tokens.colors.text.secondary }}>否</span>
                        )}
                      </td>
                      <td style={tdStyle}>{variable.defaultValue || '-'}</td>
                      <td style={tdStyle}>{variable.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: tokens.colors.text.secondary, textAlign: 'center', padding: '40px' }}>
                此模板没有定义变量
              </p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>版本历史</h3>
            <p style={{ color: tokens.colors.text.secondary, textAlign: 'center', padding: '40px' }}>
              版本历史功能即将上线
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptTemplateDetailPage;
