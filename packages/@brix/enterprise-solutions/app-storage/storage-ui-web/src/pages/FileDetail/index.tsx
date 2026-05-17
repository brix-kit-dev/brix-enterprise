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
 * @file File Detail Page
 * @description Orchestrator component — composes FileDetailHeader,
 *   FileDetailMetadata, DeleteConfirmDialog and tab navigation.
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Architecture Compliance:
 * - Pure View layer component
 * - Data access via hooks only
 * - Navigation via runtime router capability
 * - Sub-components follow single-responsibility principle
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from '@brix-sdk/runtime-sdk-react';
import { useTheme } from '@brix-sdk/runtime-sdk-react';
import type { UpdateFileRequest } from '@brix-sdk/enterprise-storage-shared';
import { useFileDetail, useFileAccessLogs } from '../../hooks';
import { FilePreview, AccessLogTable } from '../../components';
import { createStyles } from './FileDetail.styles';
import type { TabKey } from './FileDetail.utils';
import { FileDetailHeader } from './FileDetailHeader';
import { FileDetailMetadata } from './FileDetailMetadata';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

/**
 * File Detail Page Component
 *
 * Displays detailed information about a file including preview,
 * metadata, and access logs. Supports editing and deletion.
 *
 * @example
 * ```tsx
 * <Route path="/storage/files/:id" element={<FileDetailPage />} />
 * ```
 */
export function FileDetailPage(): JSX.Element {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const router = useRouter();
  const params = useParams();
  const { tokens } = useTheme();
  const styles = createStyles(tokens);

  const fileId = params.id as string;

  const {
    file,
    isLoading,
    error,
    update,
    deleteFile,
    getDownloadUrl,
    getPreviewUrl,
  } = useFileDetail(fileId);

  const {
    logs,
    pagination: logsPagination,
    params: logsParams,
    isLoading: logsLoading,
    setPage: setLogsPage,
    setPageSize: setLogsPageSize,
    filterByAction: setLogsAction,
  } = useFileAccessLogs(fileId);

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

  useEffect(() => {
    if (file && !previewUrl) {
      getPreviewUrl()
        .then((url) => setPreviewUrl(url))
        .catch(() => {});
    }
  }, [file, previewUrl, getPreviewUrl]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBack = useCallback(() => {
    router.navigate('/storage/files');
  }, [router]);

  const handleDownload = useCallback(async () => {
    try {
      const url = await getDownloadUrl();
      if (url) {
        window.open(url, '_blank');
      }
    } catch {
      // download error handled by hook
    }
  }, [getDownloadUrl]);

  const handleEditClick = useCallback(() => {
    setEditMode(true);
    setActiveTab('metadata');
  }, []);

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

  const handleSaveEdit = useCallback(async () => {
    setIsSaving(true);
    try {
      await update(editData);
      setEditMode(false);
    } catch {
      // save error handled by hook
    } finally {
      setIsSaving(false);
    }
  }, [update, editData]);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteFile();
      router.navigate('/storage/files');
    } catch {
      setIsDeleting(false);
    }
  }, [deleteFile, router]);

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
          <button type="button" style={styles.backButton} onClick={handleBack} aria-label="返回">
            ←
          </button>
        </div>
        <div style={styles.errorContainer}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</span>
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
      <FileDetailHeader
        file={file}
        styles={styles}
        onBack={handleBack}
        onEdit={handleEditClick}
        onDownload={handleDownload}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['preview', 'metadata', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {{ preview: '预览', metadata: '详细信息', logs: '访问日志' }[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'preview' && (
          <div style={styles.previewContainer}>
            <FilePreview
              url={previewUrl || ''}
              contentType={file.mimeType}
              filename={file.displayName || file.originalName}
              onDownload={handleDownload}
              isLoading={!previewUrl}
            />
          </div>
        )}
        {activeTab === 'metadata' && (
          <FileDetailMetadata
            file={file}
            tokens={tokens}
            styles={styles}
            editMode={editMode}
            editData={editData}
            isSaving={isSaving}
            onEditDataChange={setEditData}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
          />
        )}
        {activeTab === 'logs' && (
          <AccessLogTable
            data={logs}
            isLoading={logsLoading}
            pagination={{
              page: logsPagination.page,
              size: logsPagination.size,
              total: logsPagination.total,
              totalPages: logsPagination.totalPages,
            }}
            onPageChange={setLogsPage}
            onPageSizeChange={setLogsPageSize}
            onFilterAction={setLogsAction}
            filterAction={logsParams.action}
            emptyMessage="该文件暂无访问记录"
          />
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          file={file}
          styles={styles}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
