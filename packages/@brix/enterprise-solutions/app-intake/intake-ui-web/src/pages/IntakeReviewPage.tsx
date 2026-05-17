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
 * @file Intake Review Page
 * @description Page component for reviewers to approve/reject documents
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Used by reviewers to approve or reject submitted documents.
 * Supports batch operations and inline review workflow.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useIntakeReview } from '../hooks';
import {
  IntakeDocumentCard,
  IntakeStatusBadge,
  IntakeProgressBar,
} from '../components';
import type { IntakeChecklistItem } from '@brix-sdk/enterprise-intake-shared';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Intake Review Page
 *
 * Page for reviewers to review and approve/reject submitted documents.
 *
 * @example
 * ```tsx
 * <Route path="/intake/tasks/:taskId/review" element={<IntakeReviewPage />} />
 * ```
 */
export const IntakeReviewPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();

  // Parse task ID
  const numericTaskId = taskId ? parseInt(taskId, 10) : undefined;

  // State for review feedback
  const [feedbackItemId, setFeedbackItemId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Use the review hook
  const {
    task,
    submittedItems,
    pendingReviewItems,
    approvedItems,
    rejectedItems,
    isLoading,
    isReviewing,
    error,
    refresh,
    approveItem,
    rejectItem,
    approveAll,
  } = useIntakeReview(numericTaskId);

  /**
   * Handle approve action
   */
  const handleApprove = useCallback(async (item: IntakeChecklistItem) => {
    await approveItem(item.id);
  }, [approveItem]);

  /**
   * Open feedback modal for rejection
   */
  const handleOpenReject = useCallback((item: IntakeChecklistItem) => {
    setFeedbackItemId(item.id);
    setFeedbackText('');
  }, []);

  /**
   * Handle reject action
   */
  const handleReject = useCallback(async () => {
    if (feedbackItemId === null) return;

    const success = await rejectItem(feedbackItemId, feedbackText || undefined);
    if (success) {
      setFeedbackItemId(null);
      setFeedbackText('');
    }
  }, [feedbackItemId, feedbackText, rejectItem]);

  /**
   * Cancel rejection
   */
  const handleCancelReject = useCallback(() => {
    setFeedbackItemId(null);
    setFeedbackText('');
  }, []);

  /**
   * Handle approve all
   */
  const handleApproveAll = useCallback(async () => {
    if (window.confirm(`确定要批准所有 ${pendingReviewItems.length} 项待审核的资料吗？`)) {
      await approveAll();
    }
  }, [approveAll, pendingReviewItems.length]);

  /**
   * Navigate back to detail
   */
  const handleBack = useCallback(() => {
    navigation.navigate(`/intake/tasks/${taskId}`);
  }, [navigation, taskId]);

  /**
   * Download document
   */
  const handleDownload = useCallback((item: IntakeChecklistItem) => {
    if (item.documentUrl) {
      window.open(item.documentUrl, '_blank');
    }
  }, []);

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
          返回详情
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
          返回
        </button>
      </div>
    );
  }

  // Check task status
  if (task.status !== 'ACTIVE' && task.status !== 'IN_REVIEW') {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: tokens.colors.status.warningLight,
            borderRadius: '8px',
            color: '#e65100',
          }}
        >
          此任务当前状态不允许审核资料。
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
          返回详情
        </button>
      </div>
    );
  }

  // Find item being rejected
  const rejectingItem = feedbackItemId
    ? submittedItems.find(i => i.id === feedbackItemId)
    : null;

  return (
    <div style={{ padding: '24px' }}>
      {/* Rejection feedback modal */}
      {rejectingItem && (
        <div
          style={{
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
          }}
          onClick={handleCancelReject}
        >
          <div
            style={{
              backgroundColor: tokens.colors.surface.card,
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600 }}>
              驳回资料
            </h3>
            <p style={{ margin: '0 0 16px 0', color: tokens.colors.text.secondary }}>
              您正在驳回: <strong>{rejectingItem.name}</strong>
            </p>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="请输入驳回理由（选填）..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: '4px',
                fontSize: '0.875rem',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px',
              }}
            >
              <button
                onClick={handleCancelReject}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.surface.card,
                  border: `1px solid ${tokens.colors.border.default}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={isReviewing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.status.error,
                  color: tokens.colors.surface.card,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isReviewing ? 'not-allowed' : 'pointer',
                  opacity: isReviewing ? 0.7 : 1,
                }}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

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
          ← 返回详情
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
              审核资料
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: tokens.colors.text.secondary }}>{task.title}</span>
              <IntakeStatusBadge status={task.status} size="small" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {pendingReviewItems.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={isReviewing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tokens.colors.status.success,
                  color: tokens.colors.surface.card,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isReviewing ? 'not-allowed' : 'pointer',
                  opacity: isReviewing ? 0.7 : 1,
                }}
              >
                全部通过 ({pendingReviewItems.length})
              </button>
            )}
            <button
              onClick={refresh}
              disabled={isReviewing}
              style={{
                padding: '8px 16px',
                backgroundColor: tokens.colors.surface.card,
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: '4px',
                cursor: isReviewing ? 'not-allowed' : 'pointer',
              }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* Review progress */}
      <div
        style={{
          padding: '16px',
          backgroundColor: tokens.colors.status.warningLight,
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
            审核进度
          </h3>
          <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
            <span>
              待审核: <strong style={{ color: tokens.colors.status.warning }}>{pendingReviewItems.length}</strong>
            </span>
            <span>
              已通过: <strong style={{ color: tokens.colors.status.success }}>{approvedItems.length}</strong>
            </span>
            <span>
              已驳回: <strong style={{ color: tokens.colors.status.error }}>{rejectedItems.length}</strong>
            </span>
          </div>
        </div>
        <IntakeProgressBar
          completed={approvedItems.length}
          total={submittedItems.length}
          showPercentage
          height={8}
        />
      </div>

      {/* Pending review items */}
      {pendingReviewItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
            待审核 ({pendingReviewItems.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pendingReviewItems.map(item => (
              <IntakeDocumentCard
                key={item.id}
                item={item}
                mode="review"
                onApprove={handleApprove}
                onReject={handleOpenReject}
                onDownload={handleDownload}
                isLoading={isReviewing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved items */}
      {approvedItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500, color: tokens.colors.status.success }}>
            已通过 ({approvedItems.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {approvedItems.map(item => (
              <IntakeDocumentCard
                key={item.id}
                item={item}
                mode="view"
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected items */}
      {rejectedItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500, color: tokens.colors.status.error }}>
            已驳回 ({rejectedItems.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {rejectedItems.map(item => (
              <IntakeDocumentCard
                key={item.id}
                item={item}
                mode="view"
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {submittedItems.length === 0 && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: tokens.colors.text.secondary,
            backgroundColor: tokens.colors.surface.page,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
          <div>暂无已提交的资料</div>
          <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            等待客户提交资料后进行审核
          </div>
        </div>
      )}

      {/* All approved state */}
      {submittedItems.length > 0 && pendingReviewItems.length === 0 && rejectedItems.length === 0 && (
        <div
          style={{
            padding: '16px',
            backgroundColor: tokens.colors.status.successLight,
            borderRadius: '8px',
            color: tokens.colors.status.success,
            textAlign: 'center',
          }}
        >
          ✅ 所有已提交的资料均已审核通过
        </div>
      )}
    </div>
  );
};

export default IntakeReviewPage;
