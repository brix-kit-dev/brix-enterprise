/**
 * @file File Detail Page
 * @description Detail view page for individual file with preview and metadata
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This page follows v3.0.4 View layer architecture:
 * 1. Uses useFileDetail hook for file data/operations
 * 2. Uses useFileAccessLogs hook for audit log display
 * 3. Uses FilePreview component for preview display
 * 4. Uses AccessLogTable for log display
 * 5. No direct HTTP calls or repository access
 *
 * Features:
 * - File preview (image, PDF, video, audio)
 * - Metadata display and editing
 * - File download
 * - Access log history
 * - Delete with confirmation
 *
 * Architecture Compliance:
 * - Pure View layer component
 * - Data access via hooks only
 * - Navigation via runtime router capability
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import {
  type CSSProperties,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter, useParams } from '@aspect/runtime-sdk-react';
import type { FileDTO, UpdateFileRequest } from '@shinwa/storage-shared';
import { useFileDetail, useFileAccessLogs } from '../hooks';
import { FilePreview, FileTypeIcon, AccessLogTable } from '../components';

// ============================================================================
// Types
// ============================================================================

type TabKey = 'preview' | 'metadata' | 'logs';

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E0E0E0',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    color: '#424242',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  headerContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerInfo: {
    flex: 1,
  },
  fileName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 500,
    color: '#212121',
  },
  fileMeta: {
    marginTop: '4px',
    fontSize: '14px',
    color: '#757575',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    color: '#424242',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: '#1976D2',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: 500,
  },
  dangerButton: {
    backgroundColor: '#FFFFFF',
    color: '#F44336',
    borderColor: '#F44336',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    padding: '0 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E0E0E0',
  },
  tab: {
    padding: '14px 24px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    color: '#757575',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#1976D2',
    fontWeight: 500,
    borderBottomColor: '#1976D2',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    minHeight: '400px',
  },
  metadataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
  },
  metadataSection: {
    padding: '24px',
    borderBottom: '1px solid #E0E0E0',
  },
  metadataSectionLast: {
    padding: '24px',
    borderBottom: 'none',
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#212121',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metadataLabel: {
    fontSize: '13px',
    color: '#9E9E9E',
  },
  metadataValue: {
    fontSize: '14px',
    color: '#212121',
    fontWeight: 500,
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    color: '#757575',
    fontWeight: 500,
  },
  formInput: {
    padding: '10px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
  },
  formTextarea: {
    padding: '10px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
  },
  formSelect: {
    padding: '10px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: '#757575',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: '#F44336',
  },
  deleteDialog: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  deleteDialogContent: {
    padding: '24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  deleteDialogTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: 500,
    color: '#212121',
  },
  deleteDialogText: {
    margin: '0 0 24px',
    color: '#757575',
    lineHeight: 1.6,
  },
  deleteDialogActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
};

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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get status badge style
 *
 * @param status - File status
 * @returns Style object
 */
function getStatusStyle(status: string): CSSProperties {
  const statusStyles: Record<string, CSSProperties> = {
    ACTIVE: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
    PROCESSING: { backgroundColor: '#FFF3E0', color: '#F57C00' },
    ARCHIVED: { backgroundColor: '#ECEFF1', color: '#607D8B' },
    DELETED: { backgroundColor: '#FFEBEE', color: '#C62828' },
  };
  return statusStyles[status] || statusStyles.ACTIVE;
}

// ============================================================================
// Component
// ============================================================================

/**
 * File Detail Page Component
 *
 * Displays detailed information about a file including preview,
 * metadata, and access logs. Supports editing and deletion.
 *
 * @returns Page element
 *
 * @example
 * ```tsx
 * // Route configuration
 * <Route path="/storage/files/:id" element={<FileDetailPage />} />
 * ```
 */
export function FileDetailPage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const router = useRouter();
  const params = useParams();

  const fileId = params.id as string;

  // File detail hook
  const {
    file,
    isLoading,
    error,
    update,
    deleteFile,
    getDownloadUrl,
    getPreviewUrl,
    refresh,
  } = useFileDetail(fileId);

  // Access logs hook
  const {
    logs,
    pagination: logsPagination,
    params: logsParams,
    isLoading: logsLoading,
    setPage: setLogsPage,
    setPageSize: setLogsPageSize,
    filterByAction: setLogsAction,
  } = useFileAccessLogs(fileId);

  // Destructure logs pagination for convenience
  const {
    page: logsPage,
    size: logsPageSize,
    total: logsTotal,
    totalPages: logsTotalPages,
  } = logsPagination;

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState<TabKey>('preview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<UpdateFileRequest>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Initialize edit data when file loads
   */
  useEffect(() => {
    if (file) {
      setEditData({
        displayName: file.displayName,
        description: file.description,
        category: file.category,
        tags: file.tags,
      });
    }
  }, [file]);

  /**
   * Load preview URL when file loads
   */
  useEffect(() => {
    if (file && !previewUrl) {
      getPreviewUrl()
        .then((url) => {
          setPreviewUrl(url);
        })
        .catch((err) => {
          console.error('Failed to get preview URL:', err);
        });
    }
  }, [file, previewUrl, getPreviewUrl]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Navigate back to list
   */
  const handleBack = useCallback(() => {
    router.navigate('/storage/files');
  }, [router]);

  /**
   * Handle download button click
   */
  const handleDownload = useCallback(async () => {
    try {
      const url = await getDownloadUrl();
      if (url) {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Failed to get download URL:', err);
    }
  }, [getDownloadUrl]);

  /**
   * Enter edit mode
   */
  const handleEditClick = useCallback(() => {
    setEditMode(true);
    setActiveTab('metadata');
  }, []);

  /**
   * Cancel edit mode
   */
  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    if (file) {
      setEditData({
        displayName: file.displayName,
        description: file.description,
        category: file.category,
        tags: file.tags,
      });
    }
  }, [file]);

  /**
   * Save edited metadata
   */
  const handleSaveEdit = useCallback(async () => {
    setIsSaving(true);
    try {
      await update(editData);
      setEditMode(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [update, editData]);

  /**
   * Show delete confirmation
   */
  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  /**
   * Confirm delete action
   */
  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteFile();
      router.navigate('/storage/files');
    } catch (err) {
      console.error('Delete failed:', err);
      setIsDeleting(false);
    }
  }, [deleteFile, router]);

  /**
   * Cancel delete action
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  /**
   * Render preview tab content
   */
  const renderPreviewTab = (): ReactNode => {
    if (!file) return null;

    return (
      <div style={styles.previewContainer}>
        <FilePreview
          url={previewUrl || ''}
          contentType={file.mimeType}
          filename={file.displayName || file.originalName}
          onDownload={handleDownload}
          isLoading={!previewUrl}
        />
      </div>
    );
  };

  /**
   * Render metadata tab content
   */
  const renderMetadataTab = (): ReactNode => {
    if (!file) return null;

    if (editMode) {
      return (
        <div style={styles.metadataContainer}>
          <div style={styles.metadataSection}>
            <h4 style={styles.sectionTitle}>编辑文件信息</h4>
            <div style={styles.editForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>显示名称</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.displayName || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, displayName: e.target.value })
                  }
                  placeholder={file.originalName}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>描述</label>
                <textarea
                  style={styles.formTextarea as React.CSSProperties}
                  value={editData.description || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  placeholder="添加文件描述..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>分类</label>
                <select
                  style={styles.formSelect}
                  value={editData.category || file.category}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      category: e.target.value as any,
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
                <label style={styles.formLabel}>标签（用逗号分隔）</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="标签1, 标签2, ..."
                />
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.actionButton}
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  type="button"
                  style={{ ...styles.actionButton, ...styles.primaryButton }}
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.metadataContainer}>
        {/* Basic info */}
        <div style={styles.metadataSection}>
          <h4 style={styles.sectionTitle}>基本信息</h4>
          <div style={styles.metadataGrid}>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>原始名称</span>
              <span style={styles.metadataValue}>{file.originalName}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>显示名称</span>
              <span style={styles.metadataValue}>
                {file.displayName || file.originalName}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>文件类型</span>
              <span style={styles.metadataValue}>{file.mimeType}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>文件大小</span>
              <span style={styles.metadataValue}>
                {formatFileSize(file.fileSize)}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>分类</span>
              <span style={styles.metadataValue}>{file.category}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>状态</span>
              <span
                style={{
                  ...styles.statusBadge,
                  ...getStatusStyle(file.status),
                }}
              >
                {file.status}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {file.description && (
          <div style={styles.metadataSection}>
            <h4 style={styles.sectionTitle}>描述</h4>
            <p style={{ margin: 0, color: '#424242', lineHeight: 1.6 }}>
              {file.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div style={styles.metadataSection}>
            <h4 style={styles.sectionTitle}>标签</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {file.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#E3F2FD',
                    color: '#1976D2',
                    borderRadius: '16px',
                    fontSize: '13px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* System info */}
        <div style={styles.metadataSectionLast}>
          <h4 style={styles.sectionTitle}>系统信息</h4>
          <div style={styles.metadataGrid}>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>文件 ID</span>
              <span
                style={{
                  ...styles.metadataValue,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              >
                {file.id}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>上传时间</span>
              <span style={styles.metadataValue}>
                {formatDate(file.uploadedAt)}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>上传者</span>
              <span style={styles.metadataValue}>{file.uploadedBy}</span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>最后修改</span>
              <span style={styles.metadataValue}>
                {formatDate(file.updatedAt)}
              </span>
            </div>
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>存储路径</span>
              <span
                style={{
                  ...styles.metadataValue,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                }}
              >
                {file.storagePath}
              </span>
            </div>
            {file.checksum && (
              <div style={styles.metadataItem}>
                <span style={styles.metadataLabel}>校验和</span>
                <span
                  style={{
                    ...styles.metadataValue,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                  }}
                >
                  {file.checksum}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render access logs tab content
   */
  const renderLogsTab = (): ReactNode => {
    return (
      <AccessLogTable
        data={logs}
        isLoading={logsLoading}
        pagination={{
          page: logsPage,
          size: logsPageSize,
          total: logsTotal,
          totalPages: logsTotalPages,
        }}
        onPageChange={setLogsPage}
        onPageSizeChange={setLogsPageSize}
        onFilterAction={setLogsAction}
        filterAction={logsParams.action}
        emptyMessage="该文件暂无访问记录"
      />
    );
  };

  /**
   * Render delete confirmation dialog
   */
  const renderDeleteDialog = (): ReactNode => {
    if (!showDeleteDialog || !file) return null;

    return (
      <div style={styles.deleteDialog} onClick={handleCancelDelete}>
        <div
          style={styles.deleteDialogContent}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 style={styles.deleteDialogTitle}>确认删除</h4>
          <p style={styles.deleteDialogText}>
            确定要删除文件 "{file.displayName || file.originalName}" 吗？
            <br />
            此操作无法撤销。
          </p>
          <div style={styles.deleteDialogActions}>
            <button
              type="button"
              style={styles.actionButton}
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              type="button"
              style={{ ...styles.actionButton, ...styles.dangerButton }}
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading & Error States
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <span style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</span>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button
            type="button"
            style={styles.backButton}
            onClick={handleBack}
            aria-label="返回"
          >
            ←
          </button>
        </div>
        <div style={styles.errorContainer}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>❌</span>
          <span style={{ fontSize: '16px', marginBottom: '8px' }}>
            {error?.message || '文件不存在'}
          </span>
          <button
            type="button"
            style={{ ...styles.actionButton, marginTop: '16px' }}
            onClick={handleBack}
          >
            返回文件列表
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

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
          ←
        </button>

        <div style={styles.headerContent}>
          <FileTypeIcon contentType={file.mimeType} size={48} />
          <div style={styles.headerInfo}>
            <h1 style={styles.fileName}>
              {file.displayName || file.originalName}
            </h1>
            <div style={styles.fileMeta}>
              {formatFileSize(file.fileSize)} · {file.mimeType} ·{' '}
              {formatDate(file.uploadedAt)}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.actionButton}
            onClick={handleEditClick}
          >
            ✏️ 编辑
          </button>
          <button
            type="button"
            style={{ ...styles.actionButton, ...styles.primaryButton }}
            onClick={handleDownload}
          >
            ⬇️ 下载
          </button>
          <button
            type="button"
            style={{ ...styles.actionButton, ...styles.dangerButton }}
            onClick={handleDeleteClick}
          >
            🗑️ 删除
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeTab === 'preview' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeTab === 'metadata' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('metadata')}
        >
          详细信息
        </button>
        <button
          type="button"
          style={{
            ...styles.tab,
            ...(activeTab === 'logs' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('logs')}
        >
          访问日志
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'preview' && renderPreviewTab()}
        {activeTab === 'metadata' && renderMetadataTab()}
        {activeTab === 'logs' && renderLogsTab()}
      </div>

      {/* Delete confirmation dialog */}
      {renderDeleteDialog()}
    </div>
  );
}
