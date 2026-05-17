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
 * @file File List Page
 * @description Main page for browsing and managing files
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * This page follows v3.0.4 View layer architecture:
 * 1. Uses useFileList hook for data fetching/state management
 * 2. Uses FileCard component for file display
 * 3. Uses UploadDropzone for quick upload
 * 4. No direct HTTP calls or repository access
 *
 * Features:
 * - Paginated file list with filtering/search
 * - Grid/list view toggle
 * - Category filter tabs
 * - Quick upload dropzone
 * - Batch selection support
 * - Delete confirmation
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
import { FILE_CATEGORY, type FileCategory, type FileStatus } from '@brix-sdk/enterprise-storage-shared';
import { useFileList, useFileUpload } from '../hooks';
import { FileCard, UploadDropzone, FileTypeIcon } from '../components';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'grid' | 'list';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZES = [12, 24, 48, 96];

const CATEGORY_TABS: Array<{ key: FileCategory | 'ALL'; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: FILE_CATEGORY.DOCUMENT as FileCategory, label: '文档' },
  { key: FILE_CATEGORY.IMAGE as FileCategory, label: '图片' },
  { key: FILE_CATEGORY.VIDEO as FileCategory, label: '视频' },
  { key: FILE_CATEGORY.AUDIO as FileCategory, label: '音频' },
  { key: FILE_CATEGORY.OTHER as FileCategory, label: '其他' },
];

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
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: tokens.colors.surface.card,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: tokens.colors.surface.card,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  tabs: {
    display: 'flex',
    gap: '4px',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '20px',
    backgroundColor: 'transparent',
    color: tokens.colors.text.secondary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: tokens.colors.brand.primaryLight,
    color: tokens.colors.brand.primary,
    fontWeight: 500,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  searchInput: {
    padding: '8px 16px',
    paddingLeft: '36px',
    width: '280px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: tokens.colors.surface.page,
  },
  viewToggle: {
    display: 'flex',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  viewButton: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.secondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewButtonActive: {
    backgroundColor: tokens.colors.brand.primaryLight,
    color: tokens.colors.brand.primary,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  dropzoneArea: {
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '8px',
    border: `1px solid ${tokens.colors.border.default}`,
  },
  listItemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  listItemName: {
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  listItemMeta: {
    fontSize: '13px',
    color: tokens.colors.text.secondary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: tokens.colors.text.disabled,
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  emptyHint: {
    fontSize: '14px',
    color: tokens.colors.text.disabled,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: tokens.colors.surface.card,
    borderTop: `1px solid ${tokens.colors.border.default}`,
  },
  paginationInfo: {
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  paginationButton: {
    padding: '8px 16px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: tokens.colors.text.secondary,
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
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  deleteDialogTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  deleteDialogText: {
    margin: '0 0 24px',
    color: tokens.colors.text.secondary,
    lineHeight: 1.6,
  },
  deleteDialogActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmDeleteButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: tokens.colors.status.error,
    color: tokens.colors.surface.card,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
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
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ============================================================================
// Component
// ============================================================================

/**
 * File List Page Component
 *
 * Main page for browsing, searching, and managing files.
 * Provides grid/list views, category filtering, and quick upload.
 *
 * @returns Page element
 *
 * @example
 * ```tsx
 * // Route configuration
 * <Route path="/storage/files" element={<FileListPage />} />
 * ```
 */
export function FileListPage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const router = useRouter();
  const { tokens } = useTheme();
  const styles = createStyles(tokens);

  // File list hook
  const {
    items: files,
    pagination,
    isLoading,
    error,
    setPage,
    setPageSize,
    search: setSearch,
    filterByCategory: setCategory,
    filterByStatus: setStatus,
    deleteItem: deleteFile,
    refresh,
  } = useFileList();

  // Destructure pagination for convenience
  const { page, size: pageSize, total, totalPages } = pagination;

  // Upload hook for dropzone
  const {
    addFiles,
    startUpload,
  } = useFileUpload();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<FileCategory | 'ALL'>('ALL');
  const [searchValue, setSearchValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDropzone, setShowDropzone] = useState(true);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle category tab change
   */
  const handleTabChange = useCallback(
    (tab: FileCategory | 'ALL') => {
      setActiveTab(tab);
      setCategory(tab === 'ALL' ? undefined : tab);
    },
    [setCategory]
  );

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      // Debounce search
      const timeoutId = setTimeout(() => {
        setSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [setSearch]
  );

  /**
   * Handle file card click - navigate to detail
   */
  const handleFileClick = useCallback(
    (fileId: string) => {
      router.navigate(`/storage/files/${fileId}`);
    },
    [router]
  );

  /**
   * Handle download button click
   */
  const handleDownload = useCallback(
    (fileId: string) => {
      // Construct download URL - actual download handled by browser
      window.open(`/api/storage/files/${fileId}/download`, '_blank');
    },
    []
  );

  /**
   * Handle delete button click - show confirmation
   */
  const handleDeleteClick = useCallback((fileId: string) => {
    setDeleteTarget(fileId);
  }, []);

  /**
   * Confirm delete action
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteFile(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteFile]);

  /**
   * Cancel delete action
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /**
   * Handle files dropped on dropzone
   */
  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      try {
        addFiles(selectedFiles);
        await startUpload();
        refresh();
      } catch (err) {
      }
    },
    [addFiles, startUpload, refresh]
  );

  /**
   * Navigate to upload page
   */
  const handleUploadClick = useCallback(() => {
    router.navigate('/storage/upload');
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  /**
   * Render file grid view
   */
  const renderGrid = (): ReactNode => (
    <div style={styles.grid}>
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onClick={() => handleFileClick(file.id)}
          onDownload={() => handleDownload(file.id)}
          onDelete={() => handleDeleteClick(file.id)}
        />
      ))}
    </div>
  );

  /**
   * Render file list view
   */
  const renderList = (): ReactNode => (
    <div style={styles.list}>
      {files.map((file) => (
        <div
          key={file.id}
          style={styles.listItem}
          onClick={() => handleFileClick(file.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFileClick(file.id);
          }}
        >
          <FileTypeIcon contentType={file.mimeType} size={40} />
          <div style={styles.listItemInfo}>
            <span style={styles.listItemName}>{file.originalName}</span>
            <span style={styles.listItemMeta}>
              {formatFileSize(file.fileSize)} · {formatDate(file.uploadedAt)}
            </span>
          </div>
          <button
            type="button"
            style={styles.paginationButton}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(file.id);
            }}
          >
            下载
          </button>
          <button
            type="button"
            style={{ ...styles.paginationButton, color: tokens.colors.status.error }}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(file.id);
            }}
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = (): ReactNode => (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>📁</div>
      <div style={styles.emptyText}>暂无文件</div>
      <div style={styles.emptyHint}>
        {activeTab === 'ALL'
          ? '上传文件开始使用文件中心'
          : `当前分类下没有文件`}
      </div>
    </div>
  );

  /**
   * Render loading state
   */
  const renderLoading = (): ReactNode => (
    <div style={styles.loadingOverlay}>加载..</div>
  );

  /**
   * Render delete confirmation dialog
   */
  const renderDeleteDialog = (): ReactNode => {
    if (!deleteTarget) return null;

    const targetFile = files.find((f) => f.id === deleteTarget);

    return (
      <div style={styles.deleteDialog} onClick={handleCancelDelete}>
        <div
          style={styles.deleteDialogContent}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 style={styles.deleteDialogTitle}>确认删除</h4>
          <p style={styles.deleteDialogText}>
            确定要删除文件 「{targetFile?.originalName}」 吗？
            <br />
            此操作无法撤销。
          </p>
          <div style={styles.deleteDialogActions}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              取消
            </button>
            <button
              type="button"
              style={styles.confirmDeleteButton}
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
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>文件中心</h1>
        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.uploadButton}
            onClick={handleUploadClick}
          >
            <span>⬆️</span>
            <span>上传文件</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        {/* Category tabs */}
        <div style={styles.tabs}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : {}),
              }}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and view toggle */}
        <div style={styles.searchContainer}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.colors.text.disabled,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchValue}
              onChange={handleSearchChange}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.viewToggle}>
            <button
              type="button"
              style={{
                ...styles.viewButton,
                ...(viewMode === 'grid' ? styles.viewButtonActive : {}),
              }}
              onClick={() => setViewMode('grid')}
              aria-label="网格视图"
            >
              
            </button>
            <button
              type="button"
              style={{
                ...styles.viewButton,
                ...(viewMode === 'list' ? styles.viewButtonActive : {}),
              }}
              onClick={() => setViewMode('list')}
              aria-label="列表视图"
            >
              
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Quick upload dropzone */}
        {showDropzone && (
          <div style={styles.dropzoneArea}>
            <UploadDropzone
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxFileSize={50 * 1024 * 1024}
              style={{ minHeight: '120px' }}
            />
          </div>
        )}

        {/* File list */}
        {isLoading ? (
          renderLoading()
        ) : files.length === 0 ? (
          renderEmptyState()
        ) : viewMode === 'grid' ? (
          renderGrid()
        ) : (
          renderList()
        )}
      </div>

      {/* Pagination */}
      {files.length > 0 && (
        <div style={styles.pagination}>
          <span style={styles.paginationInfo}>
            {total} 个文件 {page + 1}/{totalPages} 
          </span>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: '6px',
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} 
              </option>
            ))}
          </select>

          <button
            type="button"
            style={{
              ...styles.paginationButton,
              ...(page === 0 ? styles.paginationButtonDisabled : {}),
            }}
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            上一
          </button>

          <button
            type="button"
            style={{
              ...styles.paginationButton,
              ...(page >= totalPages - 1 ? styles.paginationButtonDisabled : {}),
            }}
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            下一
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {renderDeleteDialog()}
    </div>
  );
}
