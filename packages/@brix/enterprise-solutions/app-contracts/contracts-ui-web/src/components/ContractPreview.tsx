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
 * @file Contract Preview Component
 * @description Preview component for rendered contract content
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer guidelines.
 * Displays contract content with variable highlighting.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useMemo } from 'react';
import type { Contract, ContractTemplate } from '@brix-sdk/enterprise-contracts-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface ContractPreviewProps {
  /** Contract template for preview */
  template?: ContractTemplate;
  /** Contract instance for preview */
  contract?: Contract;
  /** Variable values for preview */
  variableValues?: Record<string, any>;
  /** Whether to highlight variables */
  highlightVariables?: boolean;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  header: {
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  badge: {
    padding: '2px 8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#6B7280',
  },
  content: {
    padding: '24px',
    minHeight: '400px',
    maxHeight: '600px',
    overflowY: 'auto',
    lineHeight: '1.8',
    fontSize: '14px',
    color: '#1F2937',
  },
  documentContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '4px',
  },
  documentTitle: {
    fontSize: '20px',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '24px',
    color: '#111827',
  },
  variableHighlight: {
    backgroundColor: '#FEF3C7',
    padding: '2px 4px',
    borderRadius: '2px',
    color: '#92400E',
    fontWeight: 500,
  },
  variableUnset: {
    backgroundColor: '#FEE2E2',
    padding: '2px 4px',
    borderRadius: '2px',
    color: '#DC2626',
    fontWeight: 500,
  },
  placeholder: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '48px',
  },
  metaInfo: {
    marginTop: '32px',
    paddingTop: '16px',
    borderTop: '1px dashed #D1D5DB',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6B7280',
  },
  metaLabel: {
    fontWeight: 500,
  },
  signatureArea: {
    marginTop: '48px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
  },
  signatureBlock: {
    padding: '16px',
    border: '1px dashed #D1D5DB',
    borderRadius: '4px',
  },
  signatureLabel: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px',
  },
  signatureLine: {
    borderBottom: '1px solid #374151',
    minHeight: '40px',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse and render content with variable substitution
 */
const renderContent = (
  content: string,
  variableValues: Record<string, any>,
  highlightVariables: boolean
): React.ReactNode[] => {
  // Match {{variableName}} pattern
  const variablePattern = /\{\{(\w+)\}\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = variablePattern.exec(content)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const variableName = match[1];
    const value = variableValues[variableName];

    if (highlightVariables) {
      // Highlight mode - show variable status
      if (value !== undefined && value !== null && value !== '') {
        parts.push(
          <span key={match.index} style={styles.variableHighlight}>
            {String(value)}
          </span>
        );
      } else {
        parts.push(
          <span key={match.index} style={styles.variableUnset}>
            {'{{' + variableName + '}}'}
          </span>
        );
      }
    } else {
      // Normal mode - just substitute or keep placeholder
      if (value !== undefined && value !== null && value !== '') {
        parts.push(String(value));
      } else {
        parts.push('{{' + variableName + '}}');
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};

/**
 * Format date for display
 */
const formatDate = (date?: Date | string): string => {
  if (!date) return '____年__月__日';
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Contract Preview Component
 *
 * Displays a preview of contract content with variable substitution.
 *
 * @example
 * ```tsx
 * <ContractPreview
 *   template={template}
 *   variableValues={values}
 *   highlightVariables={true}
 * />
 * ```
 */
export const ContractPreview: React.FC<ContractPreviewProps> = ({
  template,
  contract,
  variableValues = {},
  highlightVariables = false,
  style,
}) => {
  // Determine source content
  const content = useMemo(() => {
    if (contract?.content) {
      return contract.content;
    }
    if (template?.content) {
      return template.content;
    }
    return null;
  }, [contract, template]);

  // Merge variable values
  const mergedValues = useMemo(() => {
    const values: Record<string, any> = { ...variableValues };
    
    // Add contract-specific data if available
    if (contract) {
      values.contractCode = contract.code;
      values.contractTitle = contract.title;
      values.totalAmount = contract.totalAmount?.toLocaleString();
      values.effectiveDate = formatDate(contract.effectiveDate);
      values.expirationDate = formatDate(contract.expirationDate);
      
      // Add party information
      contract.parties?.forEach((party, index) => {
        values[`party${index + 1}Name`] = party.name;
        values[`party${index + 1}Contact`] = party.contactName;
        values[`party${index + 1}Phone`] = party.contactPhone;
        values[`party${index + 1}Address`] = party.address;
      });
    }
    
    return values;
  }, [variableValues, contract]);

  // Count unset variables
  const unsetCount = useMemo(() => {
    if (!content) return 0;
    const variablePattern = /\{\{(\w+)\}\}/g;
    let count = 0;
    let match: RegExpExecArray | null;
    while ((match = variablePattern.exec(content)) !== null) {
      const value = mergedValues[match[1]];
      if (value === undefined || value === null || value === '') {
        count++;
      }
    }
    return count;
  }, [content, mergedValues]);

  // Render content lines
  const renderedContent = useMemo(() => {
    if (!content) return null;
    
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ margin: '0 0 8px 0' }}>
        {line.trim() ? renderContent(line, mergedValues, highlightVariables) : '\u00A0'}
      </p>
    ));
  }, [content, mergedValues, highlightVariables]);

  const documentTitle = contract?.title || template?.name || '合同预览';

  return (
    <div style={{ ...styles.container, ...style }}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>合同预览</span>
        {highlightVariables && unsetCount > 0 && (
          <span style={styles.badge}>
            {unsetCount} 个变量待填写
          </span>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {content ? (
          <div style={styles.documentContainer}>
            <h1 style={styles.documentTitle}>{documentTitle}</h1>
            
            {/* Rendered Contract Content */}
            <div>{renderedContent}</div>

            {/* Signature Area */}
            <div style={styles.signatureArea}>
              <div style={styles.signatureBlock}>
                <div style={styles.signatureLabel}>甲方签章</div>
                <div style={styles.signatureLine}></div>
                <div style={{ ...styles.signatureLabel, marginTop: '8px' }}>
                  日期：____年__月__日
                </div>
              </div>
              <div style={styles.signatureBlock}>
                <div style={styles.signatureLabel}>乙方签章</div>
                <div style={styles.signatureLine}></div>
                <div style={{ ...styles.signatureLabel, marginTop: '8px' }}>
                  日期：____年__月__日
                </div>
              </div>
            </div>

            {/* Meta Information */}
            {(contract || template) && (
              <div style={styles.metaInfo}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>模板编号：</span>
                  <span>{template?.code || contract?.templateCode || '-'}</span>
                </div>
                {contract && (
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>合同编号：</span>
                    <span>{contract.code}</span>
                  </div>
                )}
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>版本：</span>
                  <span>{template?.version || '1.0'}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>生成时间：</span>
                  <span>{formatDate(new Date())}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.placeholder}>
            暂无内容，请选择模板或加载合同
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPreview;
