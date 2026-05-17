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
 * @file Intake Task Detail Page
 * @description Page component for viewing intake task details
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Displays full task details including checklist, progress, and actions.
 * Provides navigation to submit and review pages.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useIntakeTaskDetail } from '../hooks';
import {
  IntakeStatusBadge,
  IntakeProgressBar,
  IntakeChecklist,
} from '../components';
import { INTAKE_TASK_PRIORITY_LABELS } from '@brix-sdk/enterprise-intake-shared';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Intake Task Detail Page
 *
 * Displays detailed information about an intake task.
 *
 * @example
 * ```tsx
 * <Route path="/intake/tasks/:taskId" element={<IntakeTaskDetailPage />} />
 * ```
 */
export const IntakeTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();

  // Parse task ID
  const numericTaskId = taskId ? parseInt(taskId, 10) : undefined;

  // Use the task detail hook
  const {
    task,
    isLoading,
    isSaving,
    error,
    refresh,
    activate,
    cancel,
    deleteTask,
  } = useIntakeTaskDetail(numericTaskId);

  /**
   * Navigate to submit page (for customers)
   */
  const handleSubmit = useCallback(() => {
    navigation.navigate(`/intake/tasks/${taskId}/submit`);
  }, [navigation, taskId]);

  /**
   * Navigate to review page (for reviewers)
   */
  const handleReview = useCallback(() => {
    navigation.navigate(`/intake/tasks/${taskId}/review`);
  }, [navigation, taskId]);

  /**
   * Navigate to edit page
   */
  const handleEdit = useCallback(() => {
    navigation.navigate(`/intake/tasks/${taskId}/edit`);
  }, [navigation, taskId]);

  /**
   * Handle activate
   */
  const handleActivate = useCallback(async () => {
    try {
      await activate();
    } catch (err) {
      // Error handling is done in the hook
    }
  }, [activate]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(async () => {
    if (window.confirm('确定要取消此任务吗？')) {
      try {
        await cancel();
      } catch (err) {
        // Error handling is done in the hook
      }
    }
  }, [cancel]);

  /**
   * Handle delete
   */
  const handleDelete = useCallback(async () => {
    if (window.confirm('确定要删除此任务吗？此操作不可恢复。')) {
      try {
        await deleteTask();
        navigation.navigate('/intake/tasks');
      } catch (err) {
        // Error handling is done in the hook
      }
    }
  }, [deleteTask, navigation]);

  /**
   * Navigate back
   */
  const handleBack = useCallback(() => {
    navigation.navigate('/intake/tasks');
  }, [navigation]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: tokens.colors.text.secondary }}>
        加载中...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: tokens.colors.status.errorLight,
            borderRadius: '8px',
            color: tokens.colors.status.error,
          }}
        >
          {error.message}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      </div>
    );
  }

  // Not found state
  if (!task) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: tokens.colors.text.secondary }}>
        任务不存在
        <button
          onClick={handleBack}
          style={{
            marginLeft: '16px',
            padding: '8px 16px',
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      </div>
    );
  }

  // Determine available actions
  const canActivate = task.status === 'DRAFT';
  const canCancel = task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  const canEdit = task.status === 'DRAFT';
  const canSubmit = task.status === 'ACTIVE';
  const canReview = task.status === 'ACTIVE' || task.status === 'IN_REVIEW';

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleBack}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: tokens.colors.brand.primary,
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← 返回列表
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600 }}>
              {task.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IntakeStatusBadge status={task.status} />
              <span style={{ color: tokens.colors.text.secondary }}>
                优先级: {INTAKE_TASK_PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {canActivate && (
              <button
                onClick={handleActivate}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.status.success,
                  color: tokens.colors.surface.card,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                激活任务
              </button>
            )}

            {canSubmit && (
              <button
                onClick={handleSubmit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.brand.primary,
                  color: tokens.colors.surface.card,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                提交资料
              </button>
            )}

            {canReview && (
              <button
                onClick={handleReview}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.status.warning,
                  color: tokens.colors.surface.card,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                审核资料
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.surface.card,
                  border: `1px solid ${tokens.colors.border.default}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                编辑
              </button>
            )}

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.surface.card,
                  border: `1px solid ${tokens.colors.status.error}`,
                  color: tokens.colors.status.error,
                  borderRadius: '4px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                取消任务
              </button>
            )}

            <button
              onClick={refresh}
              style={{
                padding: '8px 16px',
                backgroundColor: tokens.colors.surface.card,
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Main content */}
        <div>
          {/* Progress */}
          <div
            style={{
              padding: '16px',
              backgroundColor: tokens.colors.surface.page,
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
                完成进度
              </h3>
              <span style={{ fontWeight: 600, color: tokens.colors.brand.primary }}>
                {task.completionPercentage}%
              </span>
            </div>
            <IntakeProgressBar
              completed={task.completedItems}
              total={task.totalItems}
              showPercentage={false}
              showCount
              height={8}
            />
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 500 }}>
                任务描述
              </h3>
              <p style={{ margin: 0, color: tokens.colors.text.secondary, lineHeight: 1.6 }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Checklist */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
              资料清单 ({task.totalItems} 项)
            </h3>
            <IntakeChecklist items={task.checklistItems} mode="view" />
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div
            style={{
              padding: '16px',
              backgroundColor: tokens.colors.surface.page,
              borderRadius: '8px',
              border: `1px solid ${tokens.colors.border.default}`,
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
              任务信息
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                  客户ID
                </div>
                <div style={{ fontWeight: 500 }}>{task.customerId}</div>
              </div>

              {task.caseId && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                    关联案例
                  </div>
                  <div style={{ fontWeight: 500 }}>#{task.caseId}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                  截止日期
                </div>
                <div style={{ fontWeight: 500 }}>{formatDate(task.dueDate)}</div>
              </div>

              {task.assignedReviewerName && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                    审核人
                  </div>
                  <div style={{ fontWeight: 500 }}>{task.assignedReviewerName}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                  创建时间
                </div>
                <div>{formatDateTime(task.createdAt)}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                  创建人
                </div>
                <div>{task.createdBy}</div>
              </div>

              {task.updatedAt && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '2px' }}>
                    最后更新
                  </div>
                  <div>{formatDateTime(task.updatedAt)}</div>
                </div>
              )}
            </div>

            {/* Notes */}
            {task.notes && (
              <>
                <hr style={{ margin: '16px 0', border: 'none', borderTop: `1px solid ${tokens.colors.border.default}` }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: tokens.colors.text.secondary, marginBottom: '4px' }}>
                    备注
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#424242' }}>
                    {task.notes}
                  </div>
                </div>
              </>
            )}

            {/* Delete action */}
            {task.status === 'DRAFT' && (
              <>
                <hr style={{ margin: '16px 0', border: 'none', borderTop: `1px solid ${tokens.colors.border.default}` }} />
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.status.error}`,
                    color: tokens.colors.status.error,
                    borderRadius: '4px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  删除任务
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeTaskDetailPage;
