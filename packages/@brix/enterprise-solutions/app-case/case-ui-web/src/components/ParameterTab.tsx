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
 * @file Parameter Tab Component
 * @description Displays and edits case parameters
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This is a presentational component following v3.0.4 View layer guidelines.
 * It renders a table of key-value parameters with edit capability.
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState } from 'react';
import type { CaseParameterDTO } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface ParameterTabProps {
  /** Case parameters */
  parameters: CaseParameterDTO[];
  /** Loading state */
  isLoading?: boolean;
  /** Saving state */
  isSaving?: boolean;
  /** Whether editing is enabled */
  editable?: boolean;
  /** Handler for setting a parameter */
  onSetParameter?: (key: string, value: string, description?: string) => Promise<void>;
  /** Handler for updating a parameter */
  onUpdateParameter?: (key: string, value: string) => Promise<void>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Parameter Tab Component
 *
 * Renders a table of case parameters with edit functionality.
 *
 * @example
 * ```tsx
 * <ParameterTab
 *   parameters={caseParameters}
 *   editable={true}
 *   onSetParameter={handleSetParam}
 * />
 * ```
 */
export const ParameterTab: React.FC<ParameterTabProps> = ({
  parameters,
  isLoading = false,
  isSaving = false,
  editable = false,
  onSetParameter,
  onUpdateParameter,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleStartEdit = (param: CaseParameterDTO) => {
    setEditingKey(param.key);
    setEditValue(param.value);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSaveEdit = async (key: string) => {
    if (!onUpdateParameter) return;
    await onUpdateParameter(key, editValue);
    setEditingKey(null);
    setEditValue('');
  };

  const handleAddParameter = async () => {
    if (!onSetParameter || !newKey.trim()) return;
    await onSetParameter(newKey.trim(), newValue, newDescription || undefined);
    setNewKey('');
    setNewValue('');
    setNewDescription('');
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <span>⏳</span> 加载参数中...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>案例参数</h3>
        {editable && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            + 添加参数
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={styles.addForm}>
          <div style={styles.formRow}>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="参数键名"
              style={styles.input}
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="参数值"
              style={{ ...styles.input, flex: 2 }}
            />
          </div>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="参数描述（可选）"
            style={styles.input}
          />
          <div style={styles.formActions}>
            <button
              onClick={handleAddParameter}
              disabled={!newKey.trim() || isSaving}
              style={styles.confirmButton}
            >
              {isSaving ? '保存中...' : '添加'}
            </button>
            <button onClick={() => setShowAddForm(false)} style={styles.cancelButton}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* Parameters Table */}
      {parameters.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📋</span>
          <span>暂无参数数据</span>
        </div>
      ) : (
        <div style={styles.table}>
          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={{ ...styles.tableCell, ...styles.cellKey }}>参数键</div>
            <div style={{ ...styles.tableCell, ...styles.cellValue }}>参数值</div>
            <div style={{ ...styles.tableCell, ...styles.cellDesc }}>描述</div>
            <div style={{ ...styles.tableCell, ...styles.cellTime }}>更新时间</div>
            {editable && (
              <div style={{ ...styles.tableCell, ...styles.cellAction }}>操作</div>
            )}
          </div>

          {/* Table Body */}
          {parameters.map((param) => (
            <div key={param.key} style={styles.tableRow}>
              <div style={{ ...styles.tableCell, ...styles.cellKey }}>
                <code style={styles.keyCode}>{param.key}</code>
              </div>
              <div style={{ ...styles.tableCell, ...styles.cellValue }}>
                {editingKey === param.key ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={styles.editInput}
                    autoFocus
                  />
                ) : (
                  <span style={styles.valueText}>{param.value}</span>
                )}
              </div>
              <div style={{ ...styles.tableCell, ...styles.cellDesc }}>
                <span style={styles.descText}>{param.description || '-'}</span>
              </div>
              <div style={{ ...styles.tableCell, ...styles.cellTime }}>
                <span style={styles.timeText}>{formatDateTime(param.updatedAt)}</span>
              </div>
              {editable && (
                <div style={{ ...styles.tableCell, ...styles.cellAction }}>
                  {editingKey === param.key ? (
                    <div style={styles.editActions}>
                      <button
                        onClick={() => handleSaveEdit(param.key)}
                        disabled={isSaving}
                        style={styles.saveButton}
                      >
                        ✓
                      </button>
                      <button onClick={handleCancelEdit} style={styles.cancelSmall}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(param)}
                      style={styles.editButton}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Saving Overlay */}
      {isSaving && (
        <div style={styles.savingOverlay}>
          保存中...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  formRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  confirmButton: {
    padding: '8px 16px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  table: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontWeight: 600,
    fontSize: '13px',
    color: '#374151',
  },
  tableRow: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
  },
  tableCell: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  cellKey: {
    width: '180px',
    flexShrink: 0,
  },
  cellValue: {
    flex: 1,
    minWidth: '200px',
  },
  cellDesc: {
    width: '200px',
    flexShrink: 0,
  },
  cellTime: {
    width: '150px',
    flexShrink: 0,
  },
  cellAction: {
    width: '80px',
    flexShrink: 0,
    justifyContent: 'center',
  },
  keyCode: {
    padding: '2px 6px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#374151',
  },
  valueText: {
    fontSize: '14px',
    color: '#111827',
    wordBreak: 'break-all',
  },
  descText: {
    fontSize: '13px',
    color: '#6B7280',
  },
  timeText: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  editInput: {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #3B82F6',
    borderRadius: '4px',
    fontSize: '14px',
  },
  editActions: {
    display: 'flex',
    gap: '4px',
  },
  saveButton: {
    padding: '4px 8px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  cancelSmall: {
    padding: '4px 8px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 0.6,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#6B7280',
    gap: '8px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px',
    color: '#6B7280',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B7280',
    fontSize: '14px',
  },
};

export default ParameterTab;
