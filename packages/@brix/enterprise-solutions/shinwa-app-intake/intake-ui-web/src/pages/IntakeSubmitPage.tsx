/**
 * @file Intake Submit Page
 * @description Page component for customers to submit documents
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Used by customers to upload and submit documents for checklist items.
 * Integrates file upload with document submission workflow.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigation } from '@brix/runtime-sdk-react';
import { useIntakeSubmission } from '../hooks';
import {
  IntakeChecklist,
  IntakeFileUploader,
  IntakeStatusBadge,
  IntakeProgressBar,
} from '../components';
import { IntakeChecklistItem, INTAKE_DOCUMENT_CATEGORY_LABELS } from '@shinwa/intake-shared';

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
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
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
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            color: '#c62828',
          }}
        >
          {error.message}
        </div>
        <button
          onClick={handleBack}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
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
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        任务不存在
        <button
          onClick={handleBack}
          style={{
            marginLeft: '16px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
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
            backgroundColor: '#fff3e0',
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
            border: '1px solid #e0e0e0',
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
            color: '#1976d2',
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
              <span style={{ color: '#666' }}>{task.title}</span>
              <IntakeStatusBadge status={task.status} size="small" />
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
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
          backgroundColor: '#e3f2fd',
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
            剩余 <strong style={{ color: '#1976d2' }}>{pendingItems.length}</strong> 项
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
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                color: '#2e7d32',
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
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '2px solid #1976d2',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 500 }}>
                上传文件
              </h3>

              {/* Selected item info */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                  {selectedItem.name}
                </div>
                {selectedItem.description && (
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '8px' }}>
                    {selectedItem.description}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  分类: {INTAKE_DOCUMENT_CATEGORY_LABELS[selectedItem.category]}
                  {selectedItem.required && (
                    <span style={{ color: '#f44336', marginLeft: '8px' }}>必需</span>
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
                  border: '1px solid #e0e0e0',
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
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '2px dashed #e0e0e0',
                textAlign: 'center',
                color: '#666',
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
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#666',
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
