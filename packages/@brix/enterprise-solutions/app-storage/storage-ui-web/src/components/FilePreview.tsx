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
 * @file File Preview Component
 * @description Preview component for images and PDF files
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer principles:
 * 1. Receives preview URL via props
 * 2. Handles different file types (images, PDFs)
 * 3. Provides zoom and navigation controls
 *
 * Architecture Compliance:
 * - Pure View component
 * - URL fetching handled by parent (ViewModel layer)
 * - No direct HTTP calls
 *
 * @author Brix Team
 * @date 2026-02-23
 */

import { useState, useCallback, type CSSProperties } from 'react';
import { useTheme } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported preview file types
 */
export type PreviewFileType = 'image' | 'pdf' | 'unsupported';

/**
 * File Preview Props
 */
export interface FilePreviewProps {
  /** Preview URL */
  url: string;

  /** MIME content type */
  contentType: string;

  /** Original filename for display */
  filename: string;

  /** Close preview handler */
  onClose?: () => void;

  /** Download handler */
  onDownload?: () => void;

  /** Loading state */
  isLoading?: boolean;

  /** Error message */
  error?: string | null;

  /** Additional CSS class names */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine preview type from content type
 *
 * @param contentType - MIME content type
 * @returns Preview file type
 */
function getPreviewType(contentType: string): PreviewFileType {
  if (contentType.startsWith('image/')) {
    return 'image';
  }
  if (contentType === 'application/pdf') {
    return 'pdf';
  }
  return 'unsupported';
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (tokens: any): Record<string, CSSProperties> => ({
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: tokens.colors.surface.card,
  },
  headerTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: tokens.colors.surface.card,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    padding: 0,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: tokens.colors.surface.card,
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'auto',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transition: 'transform 0.2s ease-in-out',
  },
  pdfEmbed: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '4px',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: tokens.colors.surface.card,
    fontSize: '18px',
  },
  errorOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colors.surface.card,
    textAlign: 'center',
  },
  errorText: {
    fontSize: '18px',
    marginBottom: '16px',
  },
  unsupportedMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  unsupportedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  zoomControls: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '8px',
  },
  zoomButton: {
    width: '32px',
    height: '32px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: tokens.colors.surface.card,
    fontSize: '18px',
    cursor: 'pointer',
  },
  zoomLabel: {
    color: tokens.colors.surface.card,
    fontSize: '14px',
    minWidth: '60px',
    textAlign: 'center',
  },
});

// ============================================================================
// Component
// ============================================================================

/**
 * File Preview Component
 *
 * Provides preview functionality for images and PDF files.
 * Includes zoom controls for images and standard PDF viewer for documents.
 *
 * @param props - Component props
 * @returns Preview overlay element
 *
 * @example
 * ```tsx
 * <FilePreview
 *   url={previewUrl}
 *   contentType="image/jpeg"
 *   filename="photo.jpg"
 *   onClose={() => setShowPreview(false)}
 *   onDownload={handleDownload}
 * />
 * ```
 */
export function FilePreview({
  url,
  contentType,
  filename,
  onClose,
  onDownload,
  isLoading = false,
  error = null,
  className,
  style,
}: FilePreviewProps): JSX.Element {
  const { tokens } = useTheme();
  const styles = createStyles(tokens);

  // Zoom state for images
  const [zoom, setZoom] = useState(100);

  // Determine preview type
  const previewType = getPreviewType(contentType);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 300));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 25));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose?.();
          break;
        case '+':
        case '=':
          if (previewType === 'image') zoomIn();
          break;
        case '-':
          if (previewType === 'image') zoomOut();
          break;
        case '0':
          if (previewType === 'image') resetZoom();
          break;
      }
    },
    [onClose, previewType, zoomIn, zoomOut, resetZoom]
  );

  // Render preview content based on type
  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return <div style={styles.loadingOverlay}>加载..</div>;
    }

    // Show error state
    if (error) {
      return (
        <div style={styles.errorOverlay}>
          <p style={styles.errorText}>预览加载失败</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>{error}</p>
          {onDownload && (
            <button
              type="button"
              style={{ ...styles.actionButton, marginTop: '16px' }}
              onClick={onDownload}
            >
              直接下载
            </button>
          )}
        </div>
      );
    }

    // Render based on file type
    switch (previewType) {
      case 'image':
        return (
          <img
            src={url}
            alt={filename}
            style={{
              ...styles.image,
              transform: `scale(${zoom / 100})`,
            }}
            loading="eager"
          />
        );

      case 'pdf':
        return (
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            title={filename}
            style={styles.pdfEmbed}
          />
        );

      default:
        return (
          <div style={styles.unsupportedMessage}>
            <span style={styles.unsupportedIcon}>📄</span>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              无法预览此文件类型
            </p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>
              {contentType}
            </p>
            {onDownload && (
              <button
                type="button"
                style={styles.actionButton}
                onClick={onDownload}
              >
                下载文件
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={className}
      style={{ ...styles.container, ...style }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label={`预览: ${filename}`}
    >
      {/* Header */}
      <header style={styles.header}>
        <h3 style={styles.headerTitle} title={filename}>
          {filename}
        </h3>
        <div style={styles.headerActions}>
          {onDownload && (
            <button
              type="button"
              style={styles.actionButton}
              onClick={onDownload}
              title="下载"
            >
              ⬇️ 下载
            </button>
          )}
          {onClose && (
            <button
              type="button"
              style={styles.closeButton}
              onClick={onClose}
              title="关闭 (Esc)"
              aria-label="关闭预览"
            >
              
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={styles.content}>{renderContent()}</div>

      {/* Zoom controls for images */}
      {previewType === 'image' && !isLoading && !error && (
        <div style={styles.zoomControls}>
          <button
            type="button"
            style={styles.zoomButton}
            onClick={zoomOut}
            disabled={zoom <= 25}
            title="缩小 (-)"
          >
            
          </button>
          <span style={styles.zoomLabel}>{zoom}%</span>
          <button
            type="button"
            style={styles.zoomButton}
            onClick={zoomIn}
            disabled={zoom >= 300}
            title="放大 (+)"
          >
            +
          </button>
          <button
            type="button"
            style={{ ...styles.zoomButton, fontSize: '14px' }}
            onClick={resetZoom}
            title="重置 (0)"
          >
            1:1
          </button>
        </div>
      )}
    </div>
  );
}
