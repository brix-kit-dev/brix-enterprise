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
 * @file Intake Submit Page
 * @description Page component for customers to submit documents
 * @module @brix-sdk/enterprise-intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Used by customers to upload and submit documents for checklist items.
 * Integrates file upload with document submission workflow.
 *
 * @author Brix Team
 * @date 2026-06-10
 */

import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation, useTheme } from '@brix-sdk/runtime-sdk-react';
import { useIntakeSubmission } from '../hooks';
import {
  IntakeChecklist,
  IntakeFileUploader,
  IntakeStatusBadge,
  IntakeProgressBar,
} from '../components';
import { IntakeChecklistItem, INTAKE_DOCUMENT_CATEGORY_LABELS } from '@brix-sdk/enterprise-intake-shared';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Intake Submit Page
 *
 * Page for customers to submit documents for their intake tasks.
 *
 * @example
 * ```tsx
 * <Route path="/intake/tasks/:taskId/submit" element={<IntakeSubmitPage />} />
 * ```
 */
export const IntakeSubmitPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigation = useNavigation();
  const { tokens } = useTheme();

  // Parse task ID
  const numericTaskId = taskId ? parseInt(taskId, 10) : undefined;

  // State for selected checklist item
  const [selectedItem, setSelectedItem] = useState<IntakeChecklistItem | null>(null);

  // Use the submission hook
  const {
    task,
    isLoading,
    isSubmitting,
    error,
    refresh,
    submitDocument,
    uploadProgress,
  } = useIntakeSubmission(numericTaskId);

  /**
   * Handle checklist item selection
   */
  const handleItemSelect = useCallback((item: IntakeChecklistItem) => {
    // Only allow selection of pending items
    if (item.status === 'PENDING') {
      setSelectedItem(item);
    }
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedItem) return;

    const success = await submitDocument(selectedItem.id, file);
    if (success) {
      setSelectedItem(null);
    }
  }, [selectedItem, submitDocument]);

  /**
   * Cancel file upload
   */
  const handleCancelUpload = useCallback(() => {
    setSelectedItem(null);
  }, []);

  /**
   * Navigate back to detail
   */
  const handleBack = useCallback(() => {
    navigation.navigate(`/intake/tasks/${taskId}`);
  }, [navigation, taskId]);

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
  if (task.status !== 'ACTIVE') {
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
          此任务当前状态不允许提交资料。
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

  // Get pending items
  const pendingItems = task.checklistItems.filter(item => item.status === 'PENDING');

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
              提交资料
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: tokens.colors.text.secondary }}>{task.title}</span>
              <IntakeStatusBadge status={task.status} size="small" />
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: tokens.colors.surface.card,
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            刷新
          </button>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          padding: '16px',
          backgroundColor: tokens.colors.brand.primaryLight,
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
            提交进度
          </h3>
          <span>
            已提交 <strong>{task.completedItems}</strong> / {task.totalItems} 项，
            <strong style={{ color: tokens.colors.brand.primary }}>{pendingItems.length}</strong> 项
          </span>
        </div>
        <IntakeProgressBar
          completed={task.completedItems}
          total={task.totalItems}
          showPercentage
          height={8}
        />
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Checklist */}
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
            资料清单（点击待提交项目进行上传）
          </h3>
          <IntakeChecklist
            items={task.checklistItems}
            mode="submit"
            onItemClick={handleItemSelect}
            selectedItemId={selectedItem?.id}
          />

          {/* Completion message */}
          {pendingItems.length === 0 && (
            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: tokens.colors.status.successLight,
                borderRadius: '8px',
                color: tokens.colors.status.success,
                textAlign: 'center',
              }}
            >
              所有资料已提交完成！请等待审核。
            </div>
          )}
        </div>

        {/* Upload area */}
        <div>
          {selectedItem ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: tokens.colors.surface.page,
                borderRadius: '8px',
                border: `2px solid ${tokens.colors.brand.primary}`,
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
                上传文件
              </h3>

              {/* Selected item info */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: tokens.colors.surface.card,
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                  {selectedItem.name}
                </div>
                {selectedItem.description && (
                    <div style={{ fontSize: '0.875rem', color: tokens.colors.text.secondary, marginBottom: '8px' }}>
                    {selectedItem.description}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: tokens.colors.text.disabled }}>
                  分类: {INTAKE_DOCUMENT_CATEGORY_LABELS[selectedItem.category]}
                  {selectedItem.required && (
                    <span style={{ color: tokens.colors.status.error, marginLeft: '8px' }}>必需</span>
                  )}
                </div>
              </div>

              {/* File uploader */}
              <IntakeFileUploader
                onFileSelect={handleFileSelect}
                isUploading={isSubmitting}
                uploadProgress={uploadProgress}
                maxSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={[
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ]}
                disabled={isSubmitting}
              />

              {/* Cancel button */}
              <button
                onClick={handleCancelUpload}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.colors.border.default}`,
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '32px 16px',
                backgroundColor: tokens.colors.surface.page,
                borderRadius: '8px',
                border: `2px dashed ${tokens.colors.border.default}`,
                textAlign: 'center',
                color: tokens.colors.text.secondary,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
              <div>从左侧列表中选择要上传的项目</div>
            </div>
          )}

          {/* Instructions */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: tokens.colors.surface.page,
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: tokens.colors.text.secondary,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: '8px' }}>📋 上传须知</div>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>支持 JPG、PNG、PDF、DOC、DOCX 格式</li>
              <li>单个文件最大 10MB</li>
              <li>请确保文件清晰可读</li>
              <li>必需项目必须全部提交才能完成任务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeSubmitPage;
