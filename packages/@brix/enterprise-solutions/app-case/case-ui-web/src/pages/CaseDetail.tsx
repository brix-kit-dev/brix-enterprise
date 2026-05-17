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
 * @file Case Detail Page
 * @description View layer - Case detail with tabs for workflow, schedule, timeline, params
 * @module @brix-sdk/enterprise-case-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Following v3.0.4 blueprint three-layer architecture: View → ViewModel → Repository
 * - View layer: Pure presentational component with no business logic
 * - Data and operations obtained through hooks
 * - Direct HTTP/fetch/axios calls are prohibited
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@brix-sdk/runtime-sdk-react';
import { useCaseDetail } from '../hooks/useCase';
import { useCaseNodes } from '../hooks/useCaseNodes';
import { useSchedule } from '../hooks/useSchedule';
import { useTimeline } from '../hooks/useTimeline';
import { useParameters } from '../hooks/useParameters';
import { CaseStatusChip } from '../components/CaseStatusChip';
import { CasePriorityChip } from '../components/CasePriorityChip';
import { NodeStepper } from '../components/NodeStepper';
import { ScheduleTab } from '../components/ScheduleTab';
import { TimelineTab } from '../components/TimelineTab';
import { ParameterTab } from '../components/ParameterTab';
import type { CaseNodeDTO } from '@brix-sdk/enterprise-case-shared';
import { CASE_TYPE_CONFIG } from '@brix-sdk/enterprise-case-shared';

// ============================================================================
// Tab Configuration
// ============================================================================

type TabType = 'workflow' | 'schedule' | 'timeline' | 'parameters';

const TABS: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'workflow', label: '工作流程', icon: '📋' },
  { id: 'schedule', label: '日程安排', icon: '📅' },
  { id: 'timeline', label: '操作记录', icon: '📜' },
  { id: 'parameters', label: '案例参数', icon: '⚙️' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN');
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Case Detail Page Component
 */
const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('workflow');

  // Load case detail
  const {
    item: caseData,
    isLoading: isLoadingCase,
    error: caseError,
    refresh: refreshCase,
    deleteItem: deleteCase,
  } = useCaseDetail(id || '');

  // Node operations
  const {
    operatingNodeId,
    error: nodeError,
    markInProgress,
    markCompleted,
    skipNode,
  } = useCaseNodes();

  // Schedule data
  const {
    days,
    selectedDay,
    isLoading: isLoadingSchedule,
    selectDay,
    createDay,
    deleteDay,
    addItem,
    deleteItem: deleteScheduleItem,
  } = useSchedule(id || '');

  // Timeline data
  const {
    events,
    isLoading: isLoadingTimeline,
    hasMore,
    loadMore,
    filterByType,
  } = useTimeline(id || '');

  // Parameters data
  const {
    parameters,
    isLoading: isLoadingParams,
    isSaving: isSavingParams,
    setParameter,
    updateParameter,
  } = useParameters(id || '');

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleBack = useCallback(() => {
    navigation.navigate('/case');
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate(`/case/${id}/edit`);
  }, [navigation, id]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('确定要删除此案例吗？此操作不可撤销。')) {
      try {
        await deleteCase();
        navigation.navigate('/case');
      } catch (err) {
        alert('删除失败: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [deleteCase, navigation]);

  const handleNodeMarkInProgress = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    try {
      await markInProgress(caseData.id, node.id);
      refreshCase();
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [caseData, markInProgress, refreshCase]);

  const handleNodeMarkCompleted = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    const notes = window.prompt('请输入完成备注（可选）:');
    try {
      await markCompleted(caseData.id, node.id, notes || undefined);
      refreshCase();
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [caseData, markCompleted, refreshCase]);

  const handleNodeSkip = useCallback(async (node: CaseNodeDTO) => {
    if (!caseData) return;
    const reason = window.prompt('请输入跳过原因:');
    if (!reason) return;
    try {
      await skipNode(caseData.id, node.id, reason);
      refreshCase();
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [caseData, skipNode, refreshCase]);

  // =========================================================================
  // Render States
  // =========================================================================

  // Loading state
  if (isLoadingCase) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <span style={styles.spinner}>⏳</span>
          加载中...
        </div>
      </div>
    );
  }

  // Error state
  if (caseError) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>加载失败: {caseError.message}</span>
          <button onClick={refreshCase} style={styles.retryButton}>
            重试
          </button>
        </div>
      </div>
    );
  }

  // Not found
  if (!caseData) {
    return (
      <div style={styles.container}>
        <div style={styles.notFound}>
          <span style={styles.notFoundIcon}>🔍</span>
          <span>未找到案例数据</span>
          <button onClick={handleBack} style={styles.backButton}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const typeConfig = CASE_TYPE_CONFIG[caseData.caseType] || {
    label: caseData.caseType,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '📋',
  };

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backLink}>
          ← 返回列表
        </button>
        <div style={styles.headerActions}>
          <button onClick={refreshCase} style={styles.actionButton}>
            🔄 刷新
          </button>
          <button onClick={handleEdit} style={styles.actionButton}>
            ✏️ 编辑
          </button>
          <button onClick={handleDelete} style={styles.deleteButton}>
            🗑️ 删除
          </button>
        </div>
      </div>

      {/* Case Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.infoHeader}>
          <div style={styles.infoLeft}>
            <span style={styles.caseCode}>{caseData.caseCode}</span>
            <span
              style={{
                ...styles.typeTag,
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
              }}
            >
              {typeConfig.icon} {typeConfig.label}
            </span>
          </div>
          <div style={styles.infoRight}>
            <CaseStatusChip status={caseData.status} />
            <CasePriorityChip priority={caseData.priority} />
          </div>
        </div>

        <h1 style={styles.caseTitle}>{caseData.title}</h1>

        {caseData.description && (
          <p style={styles.caseDescription}>{caseData.description}</p>
        )}

        {/* Info Grid */}
        <div style={styles.infoGrid}>
          {caseData.customerName && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>客户</span>
              <span style={styles.infoValue}>👤 {caseData.customerName}</span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>创建时间</span>
            <span style={styles.infoValue}>{formatDateTime(caseData.createdAt)}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>更新时间</span>
            <span style={styles.infoValue}>{formatDateTime(caseData.updatedAt)}</span>
          </div>
          {caseData.dueDate && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>截止日期</span>
              <span style={styles.infoValue}>{formatDate(caseData.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {caseData.nodes && caseData.nodes.length > 0 && (
          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>进度</span>
              <span style={styles.progressText}>
                {caseData.nodes.filter(n => n.status === 'COMPLETED').length} / {caseData.nodes.length} 节点
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(caseData.nodes.filter(n => n.status === 'COMPLETED').length / caseData.nodes.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsHeader}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {/* Workflow Tab */}
          {activeTab === 'workflow' && caseData.nodes && (
            <NodeStepper
              nodes={caseData.nodes}
              editable={true}
              operatingNodeId={operatingNodeId}
              onMarkInProgress={handleNodeMarkInProgress}
              onMarkCompleted={handleNodeMarkCompleted}
              onSkip={handleNodeSkip}
            />
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <ScheduleTab
              days={days}
              selectedDay={selectedDay}
              isLoading={isLoadingSchedule}
              editable={true}
              onSelectDay={selectDay}
              onCreateDay={createDay}
              onDeleteDay={deleteDay}
              onAddItem={addItem}
              onDeleteItem={deleteScheduleItem}
            />
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <TimelineTab
              events={events}
              isLoading={isLoadingTimeline}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onFilterByType={filterByType}
            />
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <ParameterTab
              parameters={parameters}
              isLoading={isLoadingParams}
              isSaving={isSavingParams}
              editable={true}
              onSetParameter={setParameter}
              onUpdateParameter={updateParameter}
            />
          )}
        </div>
      </div>

      {/* Node Error Toast */}
      {nodeError && (
        <div style={styles.errorToast}>
          ⚠️ {nodeError.message}
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
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#6B7280',
    cursor: 'pointer',
    padding: '8px 0',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#DC2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  infoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  caseCode: {
    fontSize: '13px',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  typeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  caseTitle: {
    margin: '0 0 12px 0',
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  caseDescription: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    color: '#6B7280',
    lineHeight: 1.6,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontWeight: 500,
  },
  infoValue: {
    fontSize: '14px',
    color: '#111827',
  },
  progressSection: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  progressText: {
    fontSize: '13px',
    color: '#6B7280',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  tabsHeader: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tab: {
    padding: '16px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#3B82F6',
    borderBottomColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  tabIcon: {
    fontSize: '16px',
  },
  tabContent: {
    padding: '24px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#6B7280',
    gap: '8px',
  },
  spinner: {
    fontSize: '24px',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#DC2626',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '48px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    color: '#6B7280',
    gap: '12px',
  },
  notFoundIcon: {
    fontSize: '48px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  errorToast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
  },
};

export default CaseDetailPage;
