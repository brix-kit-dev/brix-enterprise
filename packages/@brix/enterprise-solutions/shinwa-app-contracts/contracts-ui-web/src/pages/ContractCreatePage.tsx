/**
 * @file Contract Create Page
 * @description Page component for creating new contracts from templates
 * @module @shinwa/contracts-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 View layer guidelines, this page component
 * only handles UI rendering and delegates all business logic
 * to ViewModel hooks.
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigation } from '@brix/runtime-sdk-react';
import type {
  ContractTemplate,
  ContractParty,
  CreateContractRequest,
  ContractPartyType,
} from '@shinwa/contracts-shared';
import { PARTY_TYPE_LABELS, VARIABLE_TYPE_LABELS } from '@shinwa/contracts-shared';
import { useContractCreate, useContractTemplateList, useContractTemplateDetail } from '../hooks';
import { ContractPreview } from '../components';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
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
    color: '#6B7280',
  },
  breadcrumbLink: {
    color: '#3B82F6',
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
    color: '#111827',
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
    color: '#fff',
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    color: '#374151',
    backgroundColor: '#fff',
    border: '1px solid #D1D5DB',
  },
  successButton: {
    color: '#fff',
    backgroundColor: '#059669',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  steps: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  stepNumberActive: {
    backgroundColor: '#3B82F6',
    color: '#fff',
  },
  stepNumberCompleted: {
    backgroundColor: '#059669',
    color: '#fff',
  },
  stepNumberPending: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  stepLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },
  stepLabelActive: {
    color: '#111827',
  },
  stepLabelPending: {
    color: '#9CA3AF',
  },
  stepConnector: {
    width: '80px',
    height: '2px',
    backgroundColor: '#E5E7EB',
    margin: '0 16px',
  },
  stepConnectorCompleted: {
    backgroundColor: '#059669',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    margin: 0,
  },
  sectionContent: {
    padding: '20px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  templateCard: {
    padding: '16px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  templateCardSelected: {
    borderColor: '#3B82F6',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
  },
  templateName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
  },
  templateCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px',
  },
  templateDescription: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '1.5',
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
    color: '#374151',
  },
  required: {
    color: '#EF4444',
    marginLeft: '4px',
  },
  input: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  select: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  hint: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px',
  },
  error: {
    fontSize: '12px',
    color: '#EF4444',
    marginTop: '4px',
  },
  partyCard: {
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  partyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  partyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  removePartyButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#EF4444',
    backgroundColor: 'transparent',
    border: '1px solid #FCA5A5',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  addPartyButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    border: '1px dashed #3B82F6',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  variableField: {
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  variableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  variableKey: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  previewSection: {
    position: 'sticky',
    top: '24px',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
};

// ============================================================================
// Type Definitions
// ============================================================================

type StepType = 'template' | 'parties' | 'variables' | 'confirm';

const STEPS: { key: StepType; label: string }[] = [
  { key: 'template', label: '选择模板' },
  { key: 'parties', label: '签约方信息' },
  { key: 'variables', label: '填写内容' },
  { key: 'confirm', label: '预览确认' },
];

interface FormErrors {
  title?: string;
  templateId?: string;
  parties?: string;
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * Contract Create Page
 *
 * Multi-step wizard for creating contracts from templates.
 *
 * @example
 * ```tsx
 * // Route: /contracts/create
 * // Route: /contracts/create?templateId=xxx
 * <ContractCreatePage />
 * ```
 */
export const ContractCreatePage: React.FC = () => {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get('templateId');

  // Step state
  const [currentStep, setCurrentStep] = useState<StepType>(
    preselectedTemplateId ? 'parties' : 'template'
  );
  
  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    preselectedTemplateId || ''
  );
  const [formData, setFormData] = useState<CreateContractRequest>({
    templateId: preselectedTemplateId || '',
    title: '',
    parties: [],
    variableValues: {},
  });
  
  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Use ViewModel hooks
  const { templates } = useContractTemplateList({ status: 'PUBLISHED', size: 100 });
  const { template: selectedTemplate } = useContractTemplateDetail(selectedTemplateId);
  const { create, loading: submitting } = useContractCreate();

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        templateId: selectedTemplate.id!,
        title: prev.title || `${selectedTemplate.name} - ${new Date().toLocaleDateString('zh-CN')}`,
      }));
    }
  }, [selectedTemplate]);

  /**
   * Get current step index
   */
  const currentStepIndex = useMemo(() => {
    return STEPS.findIndex(s => s.key === currentStep);
  }, [currentStep]);

  /**
   * Handle template selection
   */
  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setFormData(prev => ({
      ...prev,
      templateId,
    }));
  }, []);

  /**
   * Handle form field change
   */
  const handleChange = useCallback((field: keyof CreateContractRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Handle party change
   */
  const handlePartyChange = useCallback((
    index: number,
    field: keyof ContractParty,
    value: any
  ) => {
    setFormData(prev => {
      const parties = [...(prev.parties || [])];
      parties[index] = { ...parties[index], [field]: value };
      return { ...prev, parties };
    });
  }, []);

  /**
   * Add new party
   */
  const handleAddParty = useCallback(() => {
    const existingTypes = (formData.parties || []).map(p => p.type);
    const nextType: ContractPartyType = !existingTypes.includes('PARTY_A')
      ? 'PARTY_A'
      : !existingTypes.includes('PARTY_B')
      ? 'PARTY_B'
      : !existingTypes.includes('PARTY_C')
      ? 'PARTY_C'
      : 'WITNESS';

    setFormData(prev => ({
      ...prev,
      parties: [
        ...(prev.parties || []),
        {
          type: nextType,
          name: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
        },
      ],
    }));
  }, [formData.parties]);

  /**
   * Remove party
   */
  const handleRemoveParty = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      parties: (prev.parties || []).filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Handle variable value change
   */
  const handleVariableChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variableValues: {
        ...(prev.variableValues || {}),
        [key]: value,
      },
    }));
  }, []);

  /**
   * Validate current step
   */
  const validateStep = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 'template') {
      if (!selectedTemplateId) {
        newErrors.templateId = '请选择合同模板';
      }
    } else if (currentStep === 'parties') {
      if (!formData.title?.trim()) {
        newErrors.title = '请输入合同名称';
      }
      if (!formData.parties || formData.parties.length < 2) {
        newErrors.parties = '至少需要两个签约方';
      } else {
        const hasPartyA = formData.parties.some(p => p.type === 'PARTY_A');
        const hasPartyB = formData.parties.some(p => p.type === 'PARTY_B');
        if (!hasPartyA || !hasPartyB) {
          newErrors.parties = '必须包含甲方和乙方';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, selectedTemplateId, formData]);

  /**
   * Go to next step
   */
  const handleNext = useCallback(() => {
    if (!validateStep()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  }, [validateStep, currentStepIndex]);

  /**
   * Go to previous step
   */
  const handlePrev = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  }, [currentStepIndex]);

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(async (asDraft: boolean = true) => {
    try {
      await create({
        ...formData,
        status: asDraft ? 'DRAFT' : 'PENDING_APPROVAL',
      });
      navigation.navigate('/contracts');
    } catch (err) {
      console.error('Submit failed:', err);
    }
  }, [formData, create, navigation]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    if (currentStepIndex > 0 || selectedTemplateId) {
      if (!confirm('确定要离开吗？未保存的更改将丢失。')) {
        return;
      }
    }
    navigation.navigate('/contracts');
  }, [currentStepIndex, selectedTemplateId, navigation]);

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>选择合同模板</h2>
            </div>
            <div style={styles.sectionContent}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  暂无可用模板，请先创建合同模板
                </div>
              ) : (
                <div style={styles.templateGrid}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      style={{
                        ...styles.templateCard,
                        ...(selectedTemplateId === template.id
                          ? styles.templateCardSelected
                          : {}),
                      }}
                      onClick={() => handleSelectTemplate(template.id!)}
                    >
                      <div style={styles.templateName}>{template.name}</div>
                      <div style={styles.templateCode}>{template.code}</div>
                      <div style={styles.templateDescription}>
                        {template.description || '暂无描述'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.templateId && (
                <div style={{ ...styles.error, marginTop: '16px' }}>
                  {errors.templateId}
                </div>
              )}
            </div>
          </div>
        );

      case 'parties':
        return (
          <div style={styles.layout}>
            <div>
              {/* Contract Basic Info */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>合同基本信息</h2>
                </div>
                <div style={styles.sectionContent}>
                  <div style={styles.fieldRow}>
                    <div style={styles.field}>
                      <label style={styles.label}>
                        合同名称
                        <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        style={{
                          ...styles.input,
                          ...(errors.title ? styles.inputError : {}),
                        }}
                        value={formData.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="输入合同名称"
                      />
                      {errors.title && <span style={styles.error}>{errors.title}</span>}
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>使用模板</label>
                      <input
                        type="text"
                        style={{ ...styles.input, backgroundColor: '#F9FAFB' }}
                        value={selectedTemplate?.name || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div style={styles.fieldRow}>
                    <div style={styles.field}>
                      <label style={styles.label}>生效日期</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={formData.effectiveDate || ''}
                        onChange={(e) => handleChange('effectiveDate', e.target.value)}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>到期日期</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={formData.expirationDate || ''}
                        onChange={(e) => handleChange('expirationDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>签约方信息</h2>
                </div>
                <div style={styles.sectionContent}>
                  {(formData.parties || []).map((party, index) => (
                    <div key={index} style={styles.partyCard}>
                      <div style={styles.partyHeader}>
                        <span style={styles.partyTitle}>
                          {PARTY_TYPE_LABELS[party.type] || `签约方 ${index + 1}`}
                        </span>
                        {formData.parties!.length > 2 && (
                          <button
                            style={styles.removePartyButton}
                            onClick={() => handleRemoveParty(index)}
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <div style={styles.fieldRow}>
                        <div style={styles.field}>
                          <label style={styles.label}>
                            身份
                            <span style={styles.required}>*</span>
                          </label>
                          <select
                            style={styles.select}
                            value={party.type}
                            onChange={(e) => handlePartyChange(index, 'type', e.target.value)}
                          >
                            {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.field}>
                          <label style={styles.label}>
                            名称
                            <span style={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            style={styles.input}
                            value={party.name}
                            onChange={(e) => handlePartyChange(index, 'name', e.target.value)}
                            placeholder="公司名称或个人姓名"
                          />
                        </div>
                      </div>
                      <div style={styles.fieldRow}>
                        <div style={styles.field}>
                          <label style={styles.label}>联系人</label>
                          <input
                            type="text"
                            style={styles.input}
                            value={party.contactName || ''}
                            onChange={(e) => handlePartyChange(index, 'contactName', e.target.value)}
                            placeholder="联系人姓名"
                          />
                        </div>
                        <div style={styles.field}>
                          <label style={styles.label}>联系电话</label>
                          <input
                            type="tel"
                            style={styles.input}
                            value={party.contactPhone || ''}
                            onChange={(e) => handlePartyChange(index, 'contactPhone', e.target.value)}
                            placeholder="联系电话"
                          />
                        </div>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>邮箱</label>
                        <input
                          type="email"
                          style={styles.input}
                          value={party.contactEmail || ''}
                          onChange={(e) => handlePartyChange(index, 'contactEmail', e.target.value)}
                          placeholder="电子邮箱"
                        />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>地址</label>
                        <input
                          type="text"
                          style={styles.input}
                          value={party.address || ''}
                          onChange={(e) => handlePartyChange(index, 'address', e.target.value)}
                          placeholder="详细地址"
                        />
                      </div>
                    </div>
                  ))}

                  {(formData.parties?.length || 0) < 4 && (
                    <button style={styles.addPartyButton} onClick={handleAddParty}>
                      <span>+</span>
                      <span>添加签约方</span>
                    </button>
                  )}

                  {errors.parties && (
                    <div style={{ ...styles.error, marginTop: '16px' }}>
                      {errors.parties}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.previewSection}>
              <ContractPreview
                template={selectedTemplate!}
                variableValues={formData.variableValues || {}}
                highlightVariables={true}
              />
            </div>
          </div>
        );

      case 'variables':
        return (
          <div style={styles.layout}>
            <div>
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>填写合同内容</h2>
                </div>
                <div style={styles.sectionContent}>
                  {selectedTemplate?.variables?.length ? (
                    selectedTemplate.variables.map((variable) => (
                      <div key={variable.key} style={styles.variableField}>
                        <div style={styles.variableHeader}>
                          <span style={styles.variableKey}>
                            {'{{' + variable.key + '}}'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            {VARIABLE_TYPE_LABELS[variable.type]}
                          </span>
                          {variable.required && (
                            <span style={{ fontSize: '11px', color: '#EF4444' }}>必填</span>
                          )}
                        </div>
                        <div style={styles.field}>
                          <label style={styles.label}>
                            {variable.label}
                            {variable.required && <span style={styles.required}>*</span>}
                          </label>
                          {variable.type === 'TEXT' && (
                            <input
                              type="text"
                              style={styles.input}
                              value={formData.variableValues?.[variable.key] || ''}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                              placeholder={variable.defaultValue || `输入${variable.label}`}
                            />
                          )}
                          {variable.type === 'NUMBER' && (
                            <input
                              type="number"
                              style={styles.input}
                              value={formData.variableValues?.[variable.key] || ''}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                              placeholder={variable.defaultValue || `输入${variable.label}`}
                            />
                          )}
                          {variable.type === 'DATE' && (
                            <input
                              type="date"
                              style={styles.input}
                              value={formData.variableValues?.[variable.key] || ''}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                            />
                          )}
                          {variable.type === 'SELECT' && (
                            <select
                              style={styles.select}
                              value={formData.variableValues?.[variable.key] || ''}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                            >
                              <option value="">请选择</option>
                              {variable.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {variable.type === 'TEXTAREA' && (
                            <textarea
                              style={styles.textarea}
                              value={formData.variableValues?.[variable.key] || ''}
                              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                              placeholder={variable.defaultValue || `输入${variable.label}`}
                            />
                          )}
                          {variable.description && (
                            <span style={styles.hint}>{variable.description}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                      该模板暂无需要填写的变量
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>合同金额</h2>
                </div>
                <div style={styles.sectionContent}>
                  <div style={styles.field}>
                    <label style={styles.label}>总金额（元）</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={formData.totalAmount || ''}
                      onChange={(e) => handleChange('totalAmount', parseFloat(e.target.value) || undefined)}
                      placeholder="输入合同总金额"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.previewSection}>
              <ContractPreview
                template={selectedTemplate!}
                variableValues={formData.variableValues || {}}
                highlightVariables={true}
              />
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div style={styles.layout}>
            <div>
              {/* Summary */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>确认信息</h2>
                </div>
                <div style={styles.sectionContent}>
                  <div style={styles.fieldRow}>
                    <div style={styles.field}>
                      <span style={styles.label}>合同名称</span>
                      <span style={{ fontSize: '14px', color: '#111827' }}>{formData.title}</span>
                    </div>
                    <div style={styles.field}>
                      <span style={styles.label}>使用模板</span>
                      <span style={{ fontSize: '14px', color: '#111827' }}>{selectedTemplate?.name}</span>
                    </div>
                  </div>
                  <div style={styles.fieldRow}>
                    <div style={styles.field}>
                      <span style={styles.label}>合同金额</span>
                      <span style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>
                        {formData.totalAmount ? `¥${formData.totalAmount.toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div style={styles.field}>
                      <span style={styles.label}>签约方</span>
                      <span style={{ fontSize: '14px', color: '#111827' }}>
                        {formData.parties?.map(p => p.name).join('、')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                marginBottom: '24px',
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>
                  请仔细核对右侧合同预览，确认无误后提交。
                </p>
              </div>
            </div>

            <div style={styles.previewSection}>
              <ContractPreview
                template={selectedTemplate!}
                variableValues={formData.variableValues || {}}
                highlightVariables={false}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span
          style={styles.breadcrumbLink}
          onClick={() => navigate('/contracts')}
        >
          合同管理
        </span>
        <span>/</span>
        <span>新建合同</span>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>新建合同</h1>
        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={handleCancel}
          >
            取消
          </button>
        </div>
      </div>

      {/* Steps */}
      <div style={styles.steps}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.key}>
            <div style={styles.step}>
              <div
                style={{
                  ...styles.stepNumber,
                  ...(index < currentStepIndex
                    ? styles.stepNumberCompleted
                    : index === currentStepIndex
                    ? styles.stepNumberActive
                    : styles.stepNumberPending),
                }}
              >
                {index < currentStepIndex ? '✓' : index + 1}
              </div>
              <span
                style={{
                  ...styles.stepLabel,
                  ...(index <= currentStepIndex
                    ? styles.stepLabelActive
                    : styles.stepLabelPending),
                }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                style={{
                  ...styles.stepConnector,
                  ...(index < currentStepIndex ? styles.stepConnectorCompleted : {}),
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <div style={styles.navButtons}>
        <button
          style={{
            ...styles.button,
            ...styles.secondaryButton,
            ...(currentStepIndex === 0 ? styles.buttonDisabled : {}),
          }}
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
        >
          上一步
        </button>

        {currentStep === 'confirm' ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(submitting ? styles.buttonDisabled : {}),
              }}
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '保存为草稿'}
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
              {submitting ? '提交中...' : '提交审批'}
            </button>
          </div>
        ) : (
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleNext}
          >
            下一步
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractCreatePage;
