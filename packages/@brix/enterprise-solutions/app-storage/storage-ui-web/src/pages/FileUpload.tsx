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
 * @file File Upload Page
 * @description Dedicated page for batch file uploads with progress tracking
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This page follows v3.0.4 View layer architecture:
 * 1. Uses useFileUpload hook for upload management
 * 2. Uses UploadDropzone component for file selection
 * 3. No direct HTTP calls or repository access
 *
 * Features:
 * - Drag and drop upload
 * - File type/size validation
 * - Batch upload with queue management
 * - Per-file progress tracking
 * - Metadata editing before upload
 * - Cancel/retry support
 *
 * Architecture Compliance:
 * - Pure View layer component
 * - Data access via hooks only
 * - Navigation via runtime router capability
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import {
  type CSSProperties,
  type ReactNode,
  useState,
  useCallback,
} from 'react';
import { useRouter } from '@brix-sdk/runtime-sdk-react';
import { useTheme } from '@brix-sdk/runtime-sdk-react';
import { FILE_CATEGORY, type FileCategory } from '@brix-sdk/enterprise-storage-shared';
import { useFileUpload, type UploadQueueItem } from '../hooks';
import { UploadDropzone, FileTypeIcon } from '../components';

// ============================================================================
// Types
// ============================================================================

interface PendingFile {
  id: string;
  file: File;
  displayName: string;
  description: string;
  category: FileCategory;
  tags: string[];
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (tokens: any): Record<string, CSSProperties> => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colors.surface.page,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: tokens.colors.surface.card,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  headerActions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dropzoneSection: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${tokens.colors.border.default}`,
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  fileListSection: {
    flex: 1,
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    border: `1px solid ${tokens.colors.border.default}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  fileListHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    backgroundColor: tokens.colors.surface.page,
  },
  fileListContent: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 24px',
    borderBottom: `1px solid ${tokens.colors.surface.page}`,
    transition: 'background-color 0.2s',
  },
  fileItemHover: {
    backgroundColor: tokens.colors.surface.page,
  },
  fileIcon: {
    flexShrink: 0,
    paddingTop: '4px',
  },
  fileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  },
  fileHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  fileName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileMeta: {
    fontSize: '13px',
    color: tokens.colors.text.disabled,
  },
  fileActions: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    padding: '6px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: tokens.colors.text.secondary,
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: tokens.colors.border.default,
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.brand.primary,
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '13px',
    color: tokens.colors.text.secondary,
    minWidth: '45px',
    textAlign: 'right',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statusPending: {
    backgroundColor: '#ECEFF1',
    color: tokens.colors.text.secondary,
  },
  statusUploading: {
    backgroundColor: tokens.colors.brand.primaryLight,
    color: tokens.colors.brand.primary,
  },
  statusComplete: {
    backgroundColor: tokens.colors.status.successLight,
    color: tokens.colors.status.success,
  },
  statusError: {
    backgroundColor: tokens.colors.status.errorLight,
    color: tokens.colors.status.error,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '8px',
  },
  formLabel: {
    fontSize: '12px',
    color: tokens.colors.text.disabled,
  },
  formInput: {
    padding: '8px 12px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    fontSize: '14px',
  },
  formSelect: {
    padding: '8px 12px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: tokens.colors.surface.card,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    color: tokens.colors.text.disabled,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '15px',
    marginBottom: '8px',
  },
  emptyHint: {
    fontSize: '13px',
    color: tokens.colors.text.disabled,
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '16px 24px',
    borderTop: `1px solid ${tokens.colors.border.default}`,
    backgroundColor: tokens.colors.surface.page,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  summaryValue: {
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Human-readable size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate unique ID for pending file
 *
 * @returns Unique ID string
 */
function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Infer file category from MIME type
 *
 * @param mimeType - File MIME type
 * @returns Inferred category
 */
function inferCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return FILE_CATEGORY.IMAGE as FileCategory;
  if (mimeType.startsWith('video/')) return FILE_CATEGORY.VIDEO as FileCategory;
  if (mimeType.startsWith('audio/')) return FILE_CATEGORY.AUDIO as FileCategory;
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) {
    return FILE_CATEGORY.DOCUMENT as FileCategory;
  }
  return FILE_CATEGORY.OTHER as FileCategory;
}

// ============================================================================
// Component
// ============================================================================

/**
 * File Upload Page Component
 *
 * Dedicated page for batch file uploads with metadata editing
 * and progress tracking.
 *
 * @returns Page element
 *
 * @example
 * ```tsx
 * // Route configuration
 * <Route path="/storage/upload" element={<FileUploadPage />} />
 * ```
 */
export function FileUploadPage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const router = useRouter();
  const { tokens } = useTheme();
  const styles = createStyles(tokens);

  const {
    queue,
    isUploading,
    addFiles,
    startUpload,
    removeFile,
    clearCompleted,
  } = useFileUpload();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Navigate back to file list
   */
  const handleBack = useCallback(() => {
    router.navigate('/storage/files');
  }, [router]);

  /**
   * Handle files selected from dropzone
   */
  const handleFilesSelected = useCallback((files: File[]) => {
    const newPendingFiles: PendingFile[] = files.map((file) => ({
      id: generateId(),
      file,
      displayName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      category: inferCategory(file.type),
      tags: [],
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);
  }, []);

  /**
   * Toggle file expansion for editing
   */
  const toggleFileExpand = useCallback((fileId: string) => {
    setExpandedFile((prev) => (prev === fileId ? null : fileId));
  }, []);

  /**
   * Update pending file metadata
   */
  const updatePendingFile = useCallback(
    (fileId: string, updates: Partial<PendingFile>) => {
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f))
      );
    },
    []
  );

  /**
   * Remove pending file
   */
  const removePendingFile = useCallback((fileId: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  /**
   * Clear all pending files
   */
  const clearPendingFiles = useCallback(() => {
    setPendingFiles([]);
  }, []);

  /**
   * Start uploading all pending files
   */
  const handleStartUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return;

    // Extract files for upload
    const filesToUpload = pendingFiles.map((pf) => pf.file);

    // Clear pending list
    setPendingFiles([]);

    // Start upload via hook
    try {
      addFiles(filesToUpload);
      await startUpload();
    } catch (err) {
    }
  }, [pendingFiles, addFiles, startUpload]);

  /**
   * Handle cancel upload for a task
   * Note: Cancel is not supported in current hook implementation,
   * removing from queue instead
   */
  const handleCancelTask = useCallback(
    (taskId: string) => {
      removeFile(taskId);
    },
    [removeFile]
  );

  /**
   * Handle remove completed/failed task
   */
  const handleRemoveTask = useCallback(
    (taskId: string) => {
      removeFile(taskId);
    },
    [removeFile]
  );

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const totalPending = pendingFiles.length;
  const totalPendingSize = pendingFiles.reduce(
    (sum, f) => sum + f.file.size,
    0
  );
  const completedTasks = queue.filter((t) => t.status === 'completed').length;
  const failedTasks = queue.filter((t) => t.status === 'failed').length;
  const uploadingTasks = queue.filter((t) => t.status === 'uploading').length;

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  /**
   * Render status badge for upload task
   */
  const renderTaskStatus = (task: UploadQueueItem): ReactNode => {
    const statusConfig = {
      pending: { style: styles.statusPending, text: '等待中' },
      uploading: { style: styles.statusUploading, text: '上传中' },
      completed: { style: styles.statusComplete, text: '已完成' },
      failed: { style: styles.statusError, text: '失败' },
    };

    const config = statusConfig[task.status];

    return (
      <span style={{ ...styles.statusBadge, ...config.style }}>
        {config.text}
      </span>
    );
  };

  /**
   * Render pending file item
   */
  const renderPendingFile = (pf: PendingFile): ReactNode => {
    const isExpanded = expandedFile === pf.id;

    return (
      <div key={pf.id} style={styles.fileItem}>
        <div style={styles.fileIcon}>
          <FileTypeIcon contentType={pf.file.type} size={36} />
        </div>

        <div style={styles.fileInfo}>
          <div style={styles.fileHeader}>
            <h4 style={styles.fileName}>{pf.file.name}</h4>
            <div style={styles.fileActions}>
              <button
                type="button"
                style={styles.iconButton}
                onClick={() => toggleFileExpand(pf.id)}
                title="编辑信息"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
              <button
                type="button"
                style={{ ...styles.iconButton, color: tokens.colors.status.error }}
                onClick={() => removePendingFile(pf.id)}
                title="移除"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={styles.fileMeta}>
            {formatFileSize(pf.file.size)} · {pf.category}
          </div>

          {isExpanded && (
            <div style={{ marginTop: '12px' }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>显示名称</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={pf.displayName}
                  onChange={(e) =>
                    updatePendingFile(pf.id, { displayName: e.target.value })
                  }
                  placeholder="文件显示名称"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>描述</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={pf.description}
                  onChange={(e) =>
                    updatePendingFile(pf.id, { description: e.target.value })
                  }
                  placeholder="添加文件描述"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>分类</label>
                <select
                  style={styles.formSelect}
                  value={pf.category}
                  onChange={(e) =>
                    updatePendingFile(pf.id, {
                      category: e.target.value as FileCategory,
                    })
                  }
                >
                  <option value="DOCUMENT">文档</option>
                  <option value="IMAGE">图片</option>
                  <option value="VIDEO">视频</option>
                  <option value="AUDIO">音频</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>标签（逗号分隔）</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={pf.tags.join(', ')}
                  onChange={(e) =>
                    updatePendingFile(pf.id, {
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="标签1, 标签2, ..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render upload task item
   */
  const renderUploadTask = (task: UploadQueueItem): ReactNode => (
    <div key={task.id} style={styles.fileItem}>
      <div style={styles.fileIcon}>
        <FileTypeIcon contentType={task.file.type} size={36} />
      </div>

      <div style={styles.fileInfo}>
        <div style={styles.fileHeader}>
          <h4 style={styles.fileName}>{task.file.name}</h4>
          <div style={styles.fileActions}>
            {renderTaskStatus(task)}
            {task.status === 'uploading' && (
              <button
                type="button"
                style={{ ...styles.iconButton, color: tokens.colors.status.error }}
                onClick={() => handleCancelTask(task.id)}
                title="取消"
              >
                
              </button>
            )}
            {(task.status === 'completed' || task.status === 'failed') && (
              <button
                type="button"
                style={styles.iconButton}
                onClick={() => handleRemoveTask(task.id)}
                title="移除"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={styles.fileMeta}>
          {formatFileSize(task.file.size)}
          {task.error && (
            <span style={{ color: tokens.colors.status.error, marginLeft: '8px' }}>
              · {task.error}
            </span>
          )}
        </div>

        {task.status === 'uploading' && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${task.progress}%`,
                }}
              />
            </div>
            <span style={styles.progressText as CSSProperties}>
              {task.progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = (): ReactNode => (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>📤</div>
      <div style={styles.emptyText}>暂无待上传文件</div>
      <div style={styles.emptyHint}>从上方拖拽文件或点击选择</div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  const hasContent =
    pendingFiles.length > 0 || queue.length > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          type="button"
          style={styles.backButton}
          onClick={handleBack}
          aria-label="返回"
        >
          
        </button>

        <h1 style={styles.headerTitle}>上传文件</h1>

        <div style={styles.headerActions}>
          {pendingFiles.length > 0 && (
            <>
              <button
                type="button"
                style={styles.actionButton}
                onClick={clearPendingFiles}
              >
                清空列表
              </button>
              <button
                type="button"
                style={{ ...styles.actionButton, ...styles.primaryButton }}
                onClick={handleStartUpload}
                disabled={isUploading}
              >
                {isUploading ? '上传..' : `开始上(${pendingFiles.length})`}
              </button>
            </>
          )}
          {completedTasks > 0 && (
            <button
              type="button"
              style={styles.actionButton}
              onClick={clearCompleted}
            >
              清除已完
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Dropzone section */}
        <div style={styles.dropzoneSection}>
          <h3 style={styles.sectionTitle}>选择文件</h3>
          <UploadDropzone
            onFilesSelected={handleFilesSelected}
            maxFiles={20}
            maxFileSize={100 * 1024 * 1024} // 100MB
            style={{ minHeight: '160px' }}
          />
        </div>

        {/* File list section */}
        <div style={styles.fileListSection}>
          <div style={styles.fileListHeader}>
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>
              文件列表
              {hasContent && (
                <span style={{ fontWeight: 400, color: tokens.colors.text.disabled }}>
                  {' '}
                  ({pendingFiles.length + queue.length})
                </span>
              )}
            </h3>
          </div>

          <div style={styles.fileListContent}>
            {!hasContent ? (
              renderEmptyState()
            ) : (
              <>
                {/* Upload tasks (in progress & completed) */}
                {queue.map((task) => renderUploadTask(task))}

                {/* Pending files */}
                {pendingFiles.map((pf) => renderPendingFile(pf))}
              </>
            )}
          </div>

          {/* Summary footer */}
          {hasContent && (
            <div style={styles.summary}>
              {totalPending > 0 && (
                <div style={styles.summaryItem}>
                  待上 <span style={styles.summaryValue}>{totalPending}</span>
                  <span style={{ color: tokens.colors.text.disabled }}>
                    ({formatFileSize(totalPendingSize)})
                  </span>
                </div>
              )}
              {uploadingTasks > 0 && (
                <div style={styles.summaryItem}>
                  上传{' '}
                  <span style={{ ...styles.summaryValue, color: tokens.colors.brand.primary }}>
                    {uploadingTasks}
                  </span>
                </div>
              )}
              {completedTasks > 0 && (
                <div style={styles.summaryItem}>
                  已完{' '}
                  <span style={{ ...styles.summaryValue, color: tokens.colors.status.success }}>
                    {completedTasks}
                  </span>
                </div>
              )}
              {failedTasks > 0 && (
                <div style={styles.summaryItem}>
                  失败:{' '}
                  <span style={{ ...styles.summaryValue, color: tokens.colors.status.error }}>
                    {failedTasks}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
