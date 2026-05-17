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
 * ComplianceCheckPage
 * Page component for real-time compliance checking with statistics dashboard.
 * Following v3.0.4 Runtime Shell Architecture Blueprint - View Layer.
 * @module compliance-ui-web/pages/ComplianceCheckPage
 */

import React, { useCallback, useState } from 'react';
import type { ComplianceCheckResult, ComplianceMatch } from '@brix-sdk/enterprise-compliance-shared';
import { useComplianceCheck, useComplianceStatistics, useComplianceAuditList } from '../hooks';
import { ForbiddenWordChecker, ComplianceStatsDashboard, SeverityChip } from '../components';
import { SEVERITY_CONFIG } from '@brix-sdk/enterprise-compliance-shared';

/**
 * Props interface for ComplianceCheckPage component.
 */
export interface ComplianceCheckPageProps {
  /** Optional additional CSS class names */
  className?: string;
}

/**
 * Tab definition for compliance page.
 */
type ComplianceTab = 'check' | 'history' | 'dashboard';

/**
 * ComplianceCheckPage provides a comprehensive compliance checking interface.
 * Includes real-time text checking, audit history, and statistics dashboard.
 * @param props - Component props
 * @returns Compliance check page
 */
const ComplianceCheckPage: React.FC<ComplianceCheckPageProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('check');
  const [inputText, setInputText] = useState('');
  const [checkedText, setCheckedText] = useState('');

  const {
    checkResult,
    performCheck,
    isChecking,
  } = useComplianceCheck();

  const { state: statsState, refresh: refreshStats } = useComplianceStatistics();
  const { state: auditState, setPage: setAuditPage, refresh: refreshAudit } = useComplianceAuditList();

  /**
   * Handles check submission.
   */
  const handleCheck = useCallback(async () => {
    if (!inputText.trim()) return;
    
    await performCheck(inputText);
    setCheckedText(inputText);
  }, [inputText, performCheck]);

  /**
   * Handles text input change.
   */
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  /**
   * Handles clearing the check result.
   */
  const handleClear = useCallback(() => {
    setInputText('');
    setCheckedText('');
  }, []);

  /**
   * Copies text with highlighted words replaced.
   */
  const handleCopyFixed = useCallback(() => {
    if (!checkResult || !checkResult.matches || checkResult.matches.length === 0) {
      navigator.clipboard.writeText(checkedText);
      return;
    }

    let fixedText = checkedText;
    checkResult.matches.forEach((match) => {
      if (match.alternatives && match.alternatives.length > 0) {
        fixedText = fixedText.replace(
          new RegExp(match.word, 'g'),
          match.alternatives[0]
        );
      }
    });
    navigator.clipboard.writeText(fixedText);
  }, [checkedText, checkResult]);

  // Styles
  const pageStyle: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#1f2937',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    padding: '4px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    width: 'fit-content',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '24px',
    alignItems: 'start',
  };

  const mainPanelStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '300px',
    padding: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.8,
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    justifyContent: 'flex-end',
  };

  const primaryButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const sidePanelStyle: React.CSSProperties = {
    position: 'sticky',
    top: '24px',
  };

  const resultCardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '16px',
  };

  const resultHeaderStyle = (passed: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: passed ? '#f0fdf4' : '#fef2f2',
    borderRadius: '8px',
  });

  const resultIconStyle = (passed: boolean): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    color: passed ? '#10b981' : '#dc2626',
  });

  const resultTextStyle = (passed: boolean): React.CSSProperties => ({
    fontSize: '16px',
    fontWeight: 600,
    color: passed ? '#10b981' : '#dc2626',
  });

  const matchListStyle: React.CSSProperties = {
    maxHeight: '400px',
    overflow: 'auto',
  };

  const matchItemStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '8px',
  };

  const matchWordStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  };

  const matchWordTextStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#dc2626',
    fontSize: '14px',
  };

  const alternativesStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
  };

  const alternativeChipStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#f0fdf4',
    color: '#10b981',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '8px',
  };

  const statsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  };

  const statItemStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    textAlign: 'center',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#374151',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
  };

  const emptyResultStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  };

  const auditTableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  };

  const pageButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    backgroundColor: isActive ? '#3b82f6' : '#ffffff',
    color: isActive ? '#ffffff' : '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  });

  /**
   * Renders check result panel.
   */
  const renderResultPanel = () => {
    if (!checkedText) {
      return (
        <div style={resultCardStyle}>
          <div style={emptyResultStyle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ margin: 0 }}>输入内容后点击"开始检查"</p>
          </div>
        </div>
      );
    }

    if (isChecking) {
      return (
        <div style={resultCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }

    const passed = !checkResult?.matches || checkResult.matches.length === 0;

    return (
      <div style={resultCardStyle}>
        <h3 style={sectionTitleStyle}>检查结果</h3>
        
        <div style={resultHeaderStyle(passed)}>
          {passed ? (
            <svg style={resultIconStyle(true)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg style={resultIconStyle(false)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span style={resultTextStyle(passed)}>
            {passed ? '内容合规' : `发现 ${checkResult?.matches?.length || 0} 个问题`}
          </span>
        </div>

        {checkResult && (
          <div style={statsStyle}>
            <div style={statItemStyle}>
              <div style={statValueStyle}>{checkResult.totalWords || 0}</div>
              <div style={statLabelStyle}>总字数</div>
            </div>
            <div style={statItemStyle}>
              <div style={{
                ...statValueStyle,
                color: passed ? '#10b981' : '#f59e0b',
              }}>
                {checkResult.passRate !== undefined ? `${(checkResult.passRate * 100).toFixed(1)}%` : '100%'}
              </div>
              <div style={statLabelStyle}>合规率</div>
            </div>
          </div>
        )}

        {!passed && checkResult?.matches && (
          <>
            <h4 style={{ ...sectionTitleStyle, fontSize: '14px', marginTop: '16px' }}>问题详情</h4>
            <div style={matchListStyle}>
              {checkResult.matches.map((match: ComplianceMatch, index: number) => (
                <div key={index} style={matchItemStyle}>
                  <div style={matchWordStyle}>
                    <span style={matchWordTextStyle}>
                      "{match.word}"
                    </span>
                    <SeverityChip severity={match.severity} size="small" />
                  </div>
                  {match.alternatives && match.alternatives.length > 0 && (
                    <div style={alternativesStyle}>
                      建议替换为:
                      {match.alternatives.map((alt, i) => (
                        <span key={i} style={alternativeChipStyle}>{alt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <button style={secondaryButtonStyle} onClick={handleCopyFixed}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                复制修正后内容
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  /**
   * Renders audit history tab.
   */
  const renderAuditHistory = () => (
    <div style={mainPanelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={sectionTitleStyle}>检查历史</h3>
        <button style={secondaryButtonStyle} onClick={refreshAudit}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          刷新
        </button>
      </div>

      {auditState.loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : auditState.data.length === 0 ? (
        <div style={emptyResultStyle}>
          <p>暂无检查记录</p>
        </div>
      ) : (
        <>
          <table style={auditTableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>检查时间</th>
                <th style={thStyle}>内容摘要</th>
                <th style={thStyle}>结果</th>
                <th style={thStyle}>问题数</th>
                <th style={thStyle}>合规率</th>
              </tr>
            </thead>
            <tbody>
              {auditState.data.map((record) => (
                <tr key={record.id}>
                  <td style={tdStyle}>
                    {new Date(record.checkedAt).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.contentPreview}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: record.passed ? '#f0fdf4' : '#fef2f2',
                      color: record.passed ? '#10b981' : '#dc2626',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {record.passed ? '通过' : '未通过'}
                    </span>
                  </td>
                  <td style={tdStyle}>{record.violationCount}</td>
                  <td style={tdStyle}>{(record.passRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditState.totalPages > 1 && (
            <div style={paginationStyle}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                共 {auditState.total} 条记录
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => setAuditPage(auditState.page - 1)}
                  disabled={auditState.page === 1}
                >
                  上一页
                </button>
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => setAuditPage(auditState.page + 1)}
                  disabled={auditState.page === auditState.totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  /**
   * Renders dashboard tab.
   */
  const renderDashboard = () => (
    <ComplianceStatsDashboard
      statistics={statsState.data || undefined}
      loading={statsState.loading}
      onRefresh={refreshStats}
    />
  );

  return (
    <div className={`compliance-check-page ${className}`} style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>合规检查</h1>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button style={tabStyle(activeTab === 'check')} onClick={() => setActiveTab('check')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            文本检查
          </span>
        </button>
        <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            检查历史
          </span>
        </button>
        <button style={tabStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            统计仪表盘
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'check' && (
        <div style={contentGridStyle}>
          <div style={mainPanelStyle}>
            <h3 style={sectionTitleStyle}>输入待检查内容</h3>
            <textarea
              style={textareaStyle}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="请在此输入需要检查的话术内容，系统将自动检测是否包含禁用词..."
            />
            <div style={actionsStyle}>
              <button style={secondaryButtonStyle} onClick={handleClear}>
                清空
              </button>
              <button
                style={isChecking || !inputText.trim() ? disabledButtonStyle : primaryButtonStyle}
                onClick={handleCheck}
                disabled={isChecking || !inputText.trim()}
              >
                {isChecking ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    检查中...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    开始检查
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={sidePanelStyle}>
            {renderResultPanel()}
          </div>
        </div>
      )}

      {activeTab === 'history' && renderAuditHistory()}
      {activeTab === 'dashboard' && renderDashboard()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ComplianceCheckPage;
