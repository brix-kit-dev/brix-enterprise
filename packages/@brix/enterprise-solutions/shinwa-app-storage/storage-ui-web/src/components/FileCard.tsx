/**
 * @file File Card Component
 * @description Card display for file item in list view
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer principles:
 * 1. Receives file data and callbacks via props
 * 2. No direct HTTP calls
 * 3. Emits events via callback props for user actions
 *
 * Architecture Compliance:
 * - Pure View component with no side effects
 * - All actions delegated to parent via callbacks
 * - Uses FileTypeIcon for consistent icon display
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import type { CSSProperties, MouseEvent } from 'react';
import type { FileSummary, FileStatus, FileCategory } from '@shinwa/storage-shared';
import { FileTypeIcon } from './FileTypeIcon';

// ============================================================================
// Types
// ============================================================================

/**
 * File Card Props
 */
export interface FileCardProps {
  /** File summary data */
  file: FileSummary;

  /** Click handler for card selection */
  onClick?: (file: FileSummary) => void;

  /** Preview action handler */
  onPreview?: (file: FileSummary) => void;

  /** Download action handler */
  onDownload?: (file: FileSummary) => void;

  /** Delete action handler */
  onDelete?: (file: FileSummary) => void;

  /** Whether the card is selected */
  selected?: boolean;

  /** Disable all interactions */
  disabled?: boolean;

  /** Additional CSS class names */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status display configuration
 *
 * @param status - File status
 * @returns Status display config
 */
function getStatusConfig(status: FileStatus): { label: string; color: string } {
  const configs: Record<FileStatus, { label: string; color: string }> = {
    ACTIVE: { label: '活跃', color: '#4CAF50' },
    UPLOADING: { label: '上传中', color: '#2196F3' },
    UPLOADED: { label: '已上传', color: '#FF9800' },
    PROCESSING: { label: '处理中', color: '#9C27B0' },
    READY: { label: '就绪', color: '#4CAF50' },
    FAILED: { label: '失败', color: '#F44336' },
    ARCHIVED: { label: '已归档', color: '#607D8B' },
    DELETED: { label: '已删除', color: '#9E9E9E' },
  };
  return configs[status] || { label: status, color: '#9E9E9E' };
}

/**
 * Get category display label
 *
 * @param category - File category
 * @returns Category display label
 */
function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    DOCUMENT: '文档',
    IMAGE: '图片',
    VIDEO: '视频',
    AUDIO: '音频',
    MEDICAL: '医疗资料',
    CONTRACT: '合同',
    IDENTITY: '身份证件',
    CERTIFICATE: '资质证书',
    OTHER: '其他',
  };
  return labels[category] || category;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#1976D2',
    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
  },
  cardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  iconWrapper: {
    flexShrink: 0,
  },
  titleSection: {
    flex: 1,
    minWidth: 0,
  },
  filename: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: '#212121',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    fontSize: '12px',
    color: '#757575',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    backgroundColor: '#F5F5F5',
    color: '#616161',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #F5F5F5',
  },
  footerInfo: {
    fontSize: '12px',
    color: '#9E9E9E',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#1976D2',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  thumbnail: {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    objectFit: 'cover',
    backgroundColor: '#F5F5F5',
  },
};

// ============================================================================
// Component
// ============================================================================

/**
 * File Card Component
 *
 * Displays a file item in a card format with thumbnail, metadata,
 * and action buttons. Pure presentational component.
 *
 * @param props - Component props
 * @returns File card element
 *
 * @example
 * ```tsx
 * <FileCard
 *   file={fileSummary}
 *   onClick={(file) => navigate(`/files/${file.id}`)}
 *   onPreview={(file) => openPreview(file)}
 *   onDownload={(file) => downloadFile(file)}
 *   onDelete={(file) => confirmDelete(file)}
 * />
 * ```
 */
export function FileCard({
  file,
  onClick,
  onPreview,
  onDownload,
  onDelete,
  selected = false,
  disabled = false,
  className,
  style,
}: FileCardProps): JSX.Element {
  const statusConfig = getStatusConfig(file.status);
  // Use mimeType as primary, contentType as fallback
  const effectiveMimeType = file.contentType || file.mimeType;
  const isImage = effectiveMimeType.startsWith('image/');
  // Use thumbnailUrl or thumbnailPath
  const thumbnailSrc = file.thumbnailUrl || file.thumbnailPath;
  // Use originalFilename or originalName
  const filename = file.originalFilename || file.originalName;
  // Use size or fileSize
  const effectiveSize = file.size ?? file.fileSize;

  // Handle card click
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(file);
    }
  };

  // Handle action button clicks (prevent card click propagation)
  const handleAction = (
    event: MouseEvent<HTMLButtonElement>,
    handler?: (file: FileSummary) => void
  ) => {
    event.stopPropagation();
    if (!disabled && handler) {
      handler(file);
    }
  };

  return (
    <div
      className={className}
      style={{
        ...styles.card,
        ...(selected ? styles.cardSelected : {}),
        ...(disabled ? styles.cardDisabled : {}),
        ...style,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-selected={selected}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header with icon/thumbnail and title */}
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          {thumbnailSrc && isImage ? (
            <img
              src={thumbnailSrc}
              alt={filename}
              style={styles.thumbnail}
              loading="lazy"
            />
          ) : (
            <FileTypeIcon contentType={effectiveMimeType} size={40} />
          )}
        </div>

        <div style={styles.titleSection}>
          <h4 style={styles.filename} title={filename}>
            {filename}
          </h4>
          <div style={styles.meta}>
            <span>{formatFileSize(effectiveSize)}</span>
            <span>•</span>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: `${statusConfig.color}20`,
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Category badge */}
      <div style={{ marginBottom: '8px' }}>
        <span style={styles.categoryBadge}>
          {getCategoryLabel(file.category)}
        </span>
      </div>

      {/* Footer with date and actions */}
      <div style={styles.footer}>
        <span style={styles.footerInfo}>{formatDate(file.uploadedAt)}</span>

        <div style={styles.actions}>
          {onPreview && file.status === 'READY' && (
            <button
              type="button"
              style={styles.actionButton}
              onClick={(e) => handleAction(e, onPreview)}
              disabled={disabled}
              title="预览"
            >
              预览
            </button>
          )}
          {onDownload && file.status === 'READY' && (
            <button
              type="button"
              style={styles.actionButton}
              onClick={(e) => handleAction(e, onDownload)}
              disabled={disabled}
              title="下载"
            >
              下载
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              style={{
                ...styles.actionButton,
                color: '#F44336',
              }}
              onClick={(e) => handleAction(e, onDelete)}
              disabled={disabled}
              title="删除"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
