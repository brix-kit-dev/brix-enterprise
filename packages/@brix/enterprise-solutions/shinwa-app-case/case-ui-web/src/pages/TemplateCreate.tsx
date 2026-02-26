/**
 * @file Template Create Page
 * @description View layer - Create new case template with workflow designer
 * @module @shinwa/case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Form component for template creation
 * - Data submission through useTemplateCreate hook
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useNavigation } from '@brix/runtime-sdk-react';
import { useTemplateCreate } from '../hooks/useTemplate';
import type { CaseTemplateCreateRequest, CaseType, TemplateNodeDTO } from '@shinwa/case-shared';
import { CASE_TYPE_CONFIG } from '@shinwa/case-shared';

// ============================================================================
// Form State Types
// ============================================================================

interface FormState {
  name: string;
  description: string;
  caseType: CaseType;
  isActive: boolean;
  nodes: TemplateNodeDTO[];
  defaultParameters: Record<string, unknown>;
}

interface NodeFormState {
  name: string;
  description: string;
  estimatedDays: number;
  isRequired: boolean;
}

const initialFormState: FormState = {
  name: '',
  description: '',
  caseType: 'MEDICAL_INTERMEDIARY',
  isActive: true,
  nodes: [],
  defaultParameters: {},
};

const initialNodeState: NodeFormState = {
  name: '',
  description: '',
  estimatedDays: 1,
  isRequired: true,
};

// ============================================================================
// Form Validation
// ============================================================================

interface FormErrors {
  name?: string;
  caseType?: string;
  nodes?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = '模板名称为必填项';
  } else if (form.name.length < 2) {
    errors.name = '模板名称至少需要2个字符';
  } else if (form.name.length > 50) {
    errors.name = '模板名称不能超过50个字符';
  }

  if (!form.caseType) {
    errors.caseType = '请选择案例类型';
  }

  if (form.nodes.length === 0) {
    errors.nodes = '请至少添加一个工作流程节点';
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
 * Template Create Page Component
 */
const TemplateCreatePage: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Node editor state
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
  const [nodeForm, setNodeForm] = useState<NodeFormState>(initialNodeState);

  // Parameter editor state
  const [showParamEditor, setShowParamEditor] = useState(false);
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');

  // Hooks
  const { createItem, isCreating, error: createError } = useTemplateCreate();

  // =========================================================================
  // Event Handlers - Form
  // =========================================================================

  const handleBack = useCallback(() => {
    if (window.confirm('确定要离开吗？未保存的内容将丢失。')) {
      navigation.navigate('/template');
    }
  }, [navigation]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

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

    const fieldErrors = validateForm(form);
    if (fieldErrors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
    }
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    setTouched({ name: true, caseType: true, nodes: true });

    if (hasErrors(validationErrors)) {
      return;
    }

    const request: CaseTemplateCreateRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      caseType: form.caseType,
      isActive: form.isActive,
      nodes: form.nodes,
      defaultParameters: Object.keys(form.defaultParameters).length > 0 
        ? form.defaultParameters 
        : undefined,
    };

    try {
      const created = await createItem(request);
      navigation.navigate(`/template/${created.id}`);
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  }, [form, createItem, navigation]);

  // =========================================================================
  // Event Handlers - Node Editor
  // =========================================================================

  const handleAddNode = useCallback(() => {
    setNodeForm(initialNodeState);
    setEditingNodeIndex(null);
    setShowNodeEditor(true);
  }, []);

  const handleEditNode = useCallback((index: number) => {
    const node = form.nodes[index];
    setNodeForm({
      name: node.name,
      description: node.description || '',
      estimatedDays: node.estimatedDays || 1,
      isRequired: node.isRequired !== false,
    });
    setEditingNodeIndex(index);
    setShowNodeEditor(true);
  }, [form.nodes]);

  const handleDeleteNode = useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      nodes: prev.nodes.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMoveNode = useCallback((index: number, direction: 'up' | 'down') => {
    setForm(prev => {
      const nodes = [...prev.nodes];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nodes.length) return prev;
      [nodes[index], nodes[targetIndex]] = [nodes[targetIndex], nodes[index]];
      // Update order
      nodes.forEach((node, i) => { node.order = i + 1; });
      return { ...prev, nodes };
    });
  }, []);

  const handleSaveNode = useCallback(() => {
    if (!nodeForm.name.trim()) {
      alert('请输入节点名称');
      return;
    }

    const node: TemplateNodeDTO = {
      id: editingNodeIndex !== null ? form.nodes[editingNodeIndex].id : `temp-${Date.now()}`,
      templateId: '', // Will be set by server
      name: nodeForm.name.trim(),
      description: nodeForm.description.trim() || undefined,
      order: editingNodeIndex !== null ? form.nodes[editingNodeIndex].order : form.nodes.length + 1,
      estimatedDays: nodeForm.estimatedDays,
      isRequired: nodeForm.isRequired,
    };

    setForm(prev => {
      if (editingNodeIndex !== null) {
        const nodes = [...prev.nodes];
        nodes[editingNodeIndex] = node;
        return { ...prev, nodes };
      } else {
        return { ...prev, nodes: [...prev.nodes, node] };
      }
    });

    setShowNodeEditor(false);
    setNodeForm(initialNodeState);
    setEditingNodeIndex(null);

    // Clear nodes error if exists
    if (errors.nodes) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.nodes;
        return next;
      });
    }
  }, [nodeForm, editingNodeIndex, form.nodes, errors.nodes]);

  const handleCancelNode = useCallback(() => {
    setShowNodeEditor(false);
    setNodeForm(initialNodeState);
    setEditingNodeIndex(null);
  }, []);

  const handleNodeInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setNodeForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  }, []);

  // =========================================================================
  // Event Handlers - Parameter Editor
  // =========================================================================

  const handleAddParameter = useCallback(() => {
    if (!paramKey.trim()) {
      alert('请输入参数名');
      return;
    }

    setForm(prev => ({
      ...prev,
      defaultParameters: {
        ...prev.defaultParameters,
        [paramKey.trim()]: paramValue.trim() || '',
      },
    }));

    setParamKey('');
    setParamValue('');
    setShowParamEditor(false);
  }, [paramKey, paramValue]);

  const handleDeleteParameter = useCallback((key: string) => {
    setForm(prev => {
      const params = { ...prev.defaultParameters };
      delete params[key];
      return { ...prev, defaultParameters: params };
    });
  }, []);

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
        <h1 style={styles.title}>创建案例模板</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 基本信息</h2>

          {/* Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              模板名称 <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="请输入模板名称"
              style={{
                ...styles.input,
                ...(touched.name && errors.name ? styles.inputError : {}),
              }}
              maxLength={50}
            />
            {touched.name && errors.name && (
              <span style={styles.errorText}>{errors.name}</span>
            )}
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>模板描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="请输入模板描述（可选）"
              style={styles.textarea}
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Case Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              案例类型 <span style={styles.required}>*</span>
            </label>
            <select
              name="caseType"
              value={form.caseType}
              onChange={handleInputChange}
              style={styles.select}
            >
              {Object.entries(CASE_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active */}
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleInputChange}
                style={styles.checkbox}
              />
              <span>创建后立即启用</span>
            </label>
          </div>
        </div>

        {/* Workflow Nodes */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              📋 工作流程节点 <span style={styles.required}>*</span>
            </h2>
            <button type="button" onClick={handleAddNode} style={styles.addButton}>
              + 添加节点
            </button>
          </div>

          {errors.nodes && touched.nodes && (
            <span style={styles.errorText}>{errors.nodes}</span>
          )}

          {form.nodes.length === 0 ? (
            <div style={styles.emptyNodes}>
              <span style={styles.emptyNodesIcon}>📝</span>
              <span>暂无节点，请添加工作流程节点</span>
            </div>
          ) : (
            <div style={styles.nodeList}>
              {form.nodes.map((node, index) => (
                <div key={node.id} style={styles.nodeCard}>
                  <div style={styles.nodeIndex}>{index + 1}</div>
                  <div style={styles.nodeContent}>
                    <div style={styles.nodeName}>{node.name}</div>
                    {node.description && (
                      <div style={styles.nodeDescription}>{node.description}</div>
                    )}
                    <div style={styles.nodeMeta}>
                      <span>{node.estimatedDays} 天</span>
                      <span>{node.isRequired ? '必需' : '可选'}</span>
                    </div>
                  </div>
                  <div style={styles.nodeActions}>
                    <button
                      type="button"
                      onClick={() => handleMoveNode(index, 'up')}
                      style={styles.nodeActionBtn}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveNode(index, 'down')}
                      style={styles.nodeActionBtn}
                      disabled={index === form.nodes.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditNode(index)}
                      style={styles.nodeActionBtn}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(index)}
                      style={{ ...styles.nodeActionBtn, color: '#DC2626' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Default Parameters */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>⚙️ 默认参数</h2>
            <button
              type="button"
              onClick={() => setShowParamEditor(true)}
              style={styles.addButton}
            >
              + 添加参数
            </button>
          </div>

          {Object.keys(form.defaultParameters).length === 0 ? (
            <div style={styles.emptyParams}>
              <span>暂无默认参数</span>
            </div>
          ) : (
            <div style={styles.paramList}>
              {Object.entries(form.defaultParameters).map(([key, value]) => (
                <div key={key} style={styles.paramItem}>
                  <span style={styles.paramKey}>{key}</span>
                  <span style={styles.paramValue}>{String(value)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteParameter(key)}
                    style={styles.paramDeleteBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {isCreating ? '创建中...' : '创建模板'}
          </button>
        </div>
      </form>

      {/* Node Editor Modal */}
      {showNodeEditor && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingNodeIndex !== null ? '编辑节点' : '添加节点'}
            </h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>节点名称 *</label>
              <input
                type="text"
                name="name"
                value={nodeForm.name}
                onChange={handleNodeInputChange}
                placeholder="请输入节点名称"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>节点描述</label>
              <textarea
                name="description"
                value={nodeForm.description}
                onChange={handleNodeInputChange}
                placeholder="请输入节点描述"
                style={styles.textarea}
                rows={2}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>预计天数</label>
                <input
                  type="number"
                  name="estimatedDays"
                  value={nodeForm.estimatedDays}
                  onChange={handleNodeInputChange}
                  min={1}
                  max={365}
                  style={styles.input}
                />
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isRequired"
                    checked={nodeForm.isRequired}
                    onChange={handleNodeInputChange}
                    style={styles.checkbox}
                  />
                  <span>必需节点</span>
                </label>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={handleCancelNode}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveNode}
                style={styles.submitButton}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Editor Modal */}
      {showParamEditor && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>添加参数</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>参数名 *</label>
              <input
                type="text"
                value={paramKey}
                onChange={(e) => setParamKey(e.target.value)}
                placeholder="请输入参数名"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>默认值</label>
              <input
                type="text"
                value={paramValue}
                onChange={(e) => setParamValue(e.target.value)}
                placeholder="请输入默认值"
                style={styles.input}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowParamEditor(false)}
                style={styles.cancelButton}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddParameter}
                style={styles.submitButton}
              >
                确定
              </button>
            </div>
          </div>
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#3B82F6',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    alignItems: 'end',
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
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  checkboxGroup: {
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  errorText: {
    fontSize: '12px',
    color: '#DC2626',
  },
  emptyNodes: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  emptyNodesIcon: {
    fontSize: '32px',
    opacity: 0.5,
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nodeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  nodeIndex: {
    width: '28px',
    height: '28px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  nodeContent: {
    flex: 1,
  },
  nodeName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  nodeDescription: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '2px',
  },
  nodeMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
    fontSize: '11px',
    color: '#9CA3AF',
  },
  nodeActions: {
    display: 'flex',
    gap: '4px',
  },
  nodeActionBtn: {
    width: '28px',
    height: '28px',
    padding: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyParams: {
    padding: '20px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '13px',
  },
  paramList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  paramItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
  },
  paramKey: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    fontFamily: 'monospace',
  },
  paramValue: {
    flex: 1,
    fontSize: '13px',
    color: '#6B7280',
  },
  paramDeleteBtn: {
    width: '24px',
    height: '24px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#DC2626',
    fontSize: '16px',
    cursor: 'pointer',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
};

export default TemplateCreatePage;
