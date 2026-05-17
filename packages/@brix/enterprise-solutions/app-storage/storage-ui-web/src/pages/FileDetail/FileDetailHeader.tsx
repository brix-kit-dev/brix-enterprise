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
 * @file FileDetailHeader Component
 * @description Header bar with back navigation, file info, and action buttons
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 */

import type { FileDTO } from '@brix-sdk/enterprise-storage-shared';
import { FileTypeIcon } from '../../components';
import { formatFileSize, formatDate } from './FileDetail.utils';
import type { FileDetailStyles } from './FileDetail.styles';

interface FileDetailHeaderProps {
  file: FileDTO;
  styles: FileDetailStyles;
  onBack: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

/**
 * Header section of FileDetail page
 *
 * Displays back button, file icon, name, metadata summary,
 * and action buttons (edit, download, delete).
 */
export function FileDetailHeader({
  file,
  styles,
  onBack,
  onEdit,
  onDownload,
  onDelete,
}: FileDetailHeaderProps): JSX.Element {
  return (
    <div style={styles.header}>
      <button
        type="button"
        style={styles.backButton}
        onClick={onBack}
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
          onClick={onEdit}
        >
          ✏️ 编辑
        </button>
        <button
          type="button"
          style={{ ...styles.actionButton, ...styles.primaryButton }}
          onClick={onDownload}
        >
          ⬇️ 下载
        </button>
        <button
          type="button"
          style={{ ...styles.actionButton, ...styles.dangerButton }}
          onClick={onDelete}
        >
          🗑删除
        </button>
      </div>
    </div>
  );
}
