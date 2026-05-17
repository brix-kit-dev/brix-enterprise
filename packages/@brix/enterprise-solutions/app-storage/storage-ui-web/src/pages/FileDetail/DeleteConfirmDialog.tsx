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
 * @file DeleteConfirmDialog Component
 * @description Modal confirmation dialog for file deletion
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 */

import type { FileDTO } from '@brix-sdk/enterprise-storage-shared';
import type { FileDetailStyles } from './FileDetail.styles';

interface DeleteConfirmDialogProps {
  file: FileDTO;
  styles: FileDetailStyles;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Delete confirmation modal dialog
 *
 * Renders a centered overlay with confirmation message
 * and cancel/confirm action buttons.
 */
export function DeleteConfirmDialog({
  file,
  styles,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps): JSX.Element {
  return (
    <div style={styles.deleteDialog} onClick={onCancel}>
      <div
        style={styles.deleteDialogContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 style={styles.deleteDialogTitle}>确认删除</h4>
        <p style={styles.deleteDialogText}>
          确定要删除文件 「{file.displayName || file.originalName}」 吗？
          <br />
          此操作无法撤销。
        </p>
        <div style={styles.deleteDialogActions}>
          <button
            type="button"
            style={styles.actionButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            取消
          </button>
          <button
            type="button"
            style={{ ...styles.actionButton, ...styles.dangerButton }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
