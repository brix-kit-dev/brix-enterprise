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
 * @file FileDetailMetadata Component
 * @description Metadata display and edit form for file details
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 */

import type { ReactNode } from 'react';
import type { FileDTO, UpdateFileRequest } from '@brix-sdk/enterprise-storage-shared';
import { formatFileSize, formatDate, getStatusStyle } from './FileDetail.utils';
import type { FileDetailStyles } from './FileDetail.styles';

interface FileDetailMetadataProps {
  file: FileDTO;
  tokens: any;
  styles: FileDetailStyles;
  editMode: boolean;
  editData: UpdateFileRequest;
  isSaving: boolean;
  onEditDataChange: (data: UpdateFileRequest) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}

/**
 * Metadata display and edit form
 *
 * Shows file metadata in read-only mode or an edit form.
 */
export function FileDetailMetadata({
  file,
  tokens,
  styles,
  editMode,
  editData,
  isSaving,
  onEditDataChange,
  onCancelEdit,
  onSaveEdit,
}: FileDetailMetadataProps): JSX.Element {
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
                  onEditDataChange({ ...editData, displayName: e.target.value })
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
                  onEditDataChange({ ...editData, description: e.target.value })
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
                  onEditDataChange({
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
                  onEditDataChange({
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
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                取消
              </button>
              <button
                type="button"
                style={{ ...styles.actionButton, ...styles.primaryButton }}
                onClick={onSaveEdit}
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
          <MetadataItem label="原始名称" value={file.originalName} styles={styles} />
          <MetadataItem label="显示名称" value={file.displayName || file.originalName} styles={styles} />
          <MetadataItem label="文件类型" value={file.mimeType} styles={styles} />
          <MetadataItem label="文件大小" value={formatFileSize(file.fileSize)} styles={styles} />
          <MetadataItem label="分类" value={file.category} styles={styles} />
          <div style={styles.metadataItem}>
            <span style={styles.metadataLabel}>状态</span>
            <span
              style={{
                ...styles.statusBadge,
                ...getStatusStyle(file.status, tokens),
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
          <p style={{ margin: 0, color: tokens.colors.text.primary, lineHeight: 1.6 }}>
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
                  backgroundColor: tokens.colors.brand.primaryLight,
                  color: tokens.colors.brand.primary,
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
          <MetadataItem label="上传时间" value={formatDate(file.uploadedAt)} styles={styles} />
          <MetadataItem label="上传者" value={file.uploadedBy} styles={styles} />
          <MetadataItem label="最后修改" value={formatDate(file.updatedAt)} styles={styles} />
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
}

/** Simple metadata key-value display item */
function MetadataItem({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: FileDetailStyles;
}): JSX.Element {
  return (
    <div style={styles.metadataItem}>
      <span style={styles.metadataLabel}>{label}</span>
      <span style={styles.metadataValue}>{value}</span>
    </div>
  );
}
