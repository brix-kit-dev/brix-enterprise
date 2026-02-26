/**
 * @file Template Variable Editor Component
 * @description Editor for defining and editing template variables
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer guidelines.
 * Allows users to define variables for contract templates.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useCallback } from 'react';
import type { ContractTemplateVariable, TemplateVariableType } from '@shinwa/contracts-shared';
import { VARIABLE_TYPE_LABELS } from '@shinwa/contracts-shared';

// ============================================================================
// Component Props
// ============================================================================

export interface TemplateVariableEditorProps {
  /** Current variables list */
  variables: ContractTemplateVariable[];
  /** Change handler */
  onChange: (variables: ContractTemplateVariable[]) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  addButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  list: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '14px',
  },
  item: {
    padding: '16px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#fff',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  itemOrder: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },
  removeButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#EF4444',
    backgroundColor: 'transparent',
    border: '1px solid #FCA5A5',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
  },
  textarea: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '60px',
  },
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Template Variable Editor Component
 *
 * Allows users to define, edit, and manage template variables.
 *
 * @example
 * ```tsx
 * <TemplateVariableEditor
 *   variables={variables}
 *   onChange={setVariables}
 * />
 * ```
 */
export const TemplateVariableEditor: React.FC<TemplateVariableEditorProps> = ({
  variables,
  onChange,
  disabled = false,
}) => {
  /**
   * Add a new variable
   */
  const handleAdd = useCallback(() => {
    const newVariable: ContractTemplateVariable = {
      key: `variable_${Date.now()}`,
      label: '',
      type: 'TEXT',
      required: false,
      order: variables.length + 1,
    };
    onChange([...variables, newVariable]);
  }, [variables, onChange]);

  /**
   * Remove a variable
   */
  const handleRemove = useCallback((index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    // Re-order remaining variables
    const reordered = newVariables.map((v, i) => ({ ...v, order: i + 1 }));
    onChange(reordered);
  }, [variables, onChange]);

  /**
   * Update a variable field
   */
  const handleUpdate = useCallback((index: number, field: keyof ContractTemplateVariable, value: any) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    onChange(newVariables);
  }, [variables, onChange]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>变量定义 ({variables.length})</span>
        {!disabled && (
          <button
            style={styles.addButton}
            onClick={handleAdd}
            type="button"
          >
            <span>+</span>
            <span>添加变量</span>
          </button>
        )}
      </div>

      {/* Variable List */}
      <div style={styles.list}>
        {variables.length === 0 ? (
          <div style={styles.empty}>
            暂无变量定义，点击"添加变量"开始定义
          </div>
        ) : (
          variables.map((variable, index) => (
            <div key={variable.key} style={styles.item}>
              {/* Item Header */}
              <div style={styles.itemHeader}>
                <div style={styles.itemOrder}>
                  <span style={styles.orderBadge}>{index + 1}</span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    {'{{' + variable.key + '}}'}
                  </span>
                </div>
                {!disabled && (
                  <button
                    style={styles.removeButton}
                    onClick={() => handleRemove(index)}
                    type="button"
                  >
                    删除
                  </button>
                )}
              </div>

              {/* Row 1: key, label, type */}
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>变量名 *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={variable.key}
                    onChange={(e) => handleUpdate(index, 'key', e.target.value)}
                    placeholder="variableName"
                    disabled={disabled}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>显示名称 *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={variable.label}
                    onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                    placeholder="变量显示名称"
                    disabled={disabled}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>类型 *</label>
                  <select
                    style={styles.select}
                    value={variable.type}
                    onChange={(e) => handleUpdate(index, 'type', e.target.value as TemplateVariableType)}
                    disabled={disabled}
                  >
                    {Object.entries(VARIABLE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: defaultValue, required, options (for SELECT) */}
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>默认值</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={variable.defaultValue || ''}
                    onChange={(e) => handleUpdate(index, 'defaultValue', e.target.value)}
                    placeholder="可选"
                    disabled={disabled}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>必填</label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => handleUpdate(index, 'required', e.target.checked)}
                      disabled={disabled}
                    />
                    此变量为必填项
                  </label>
                </div>
                {(variable.type === 'SELECT' || variable.type === 'MULTI_SELECT') && (
                  <div style={styles.field}>
                    <label style={styles.label}>选项（每行一个）</label>
                    <textarea
                      style={styles.textarea}
                      value={(variable.options || []).join('\n')}
                      onChange={(e) => handleUpdate(index, 'options', e.target.value.split('\n').filter(Boolean))}
                      placeholder="选项1&#10;选项2&#10;选项3"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              {/* Row 3: description */}
              <div style={styles.field}>
                <label style={styles.label}>描述/帮助文本</label>
                <input
                  type="text"
                  style={styles.input}
                  value={variable.description || ''}
                  onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  placeholder="可选，填写变量说明"
                  disabled={disabled}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateVariableEditor;
