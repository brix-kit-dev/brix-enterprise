/**
 * @file Intake File Uploader Component
 * @description File upload component for document submission
 * @module @shinwa/intake-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Handles file selection and upload UI for intake documents.
 * Integrates with useIntakeSubmission hook for actual upload logic.
 *
 * @author Shinwa Team
 * @date 2026-06-10
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  INTAKE_ALLOWED_MIME_TYPES,
  INTAKE_MAX_FILE_SIZE_BYTES,
} from '@shinwa/intake-shared';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for IntakeFileUploader component
 */
export interface IntakeFileUploaderProps {
  /** Currently selected file */
  file: File | null;
  /** Upload progress (0-100) */
  progress?: number;
  /** Upload status */
  status?: 'idle' | 'uploading' | 'success' | 'error';
  /** Error message */
  errorMessage?: string;
  /** Allowed MIME types (defaults to INTAKE_ALLOWED_MIME_TYPES) */
  acceptedTypes?: string[];
  /** Maximum file size in bytes (defaults to INTAKE_MAX_FILE_SIZE_BYTES) */
  maxSize?: number;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when file is cleared */
  onClear: () => void;
  /** Callback when upload is triggered */
  onUpload?: () => void;
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file against constraints
 */
function validateFile(
  file: File,
  acceptedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  // Check file type
  if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型。支持的类型: ${acceptedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超过限制。最大允许: ${formatFileSize(maxSize)}`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Intake File Uploader Component
 *
 * Provides file selection, preview, and upload UI.
 *
 * @example
 * ```tsx
 * const { uploadStates, selectFile, clearFile, submitDocument } = useIntakeSubmission(taskId);
 * const state = uploadStates[itemId];
 *
 * <IntakeFileUploader
 *   file={state.file}
 *   progress={state.progress}
 *   status={state.status}
 *   onFileSelect={(file) => selectFile(itemId, file)}
 *   onClear={() => clearFile(itemId)}
 *   onUpload={() => submitDocument(itemId)}
 * />
 * ```
 */
export const IntakeFileUploader: React.FC<IntakeFileUploaderProps> = ({
  file,
  progress = 0,
  status = 'idle',
  errorMessage,
  acceptedTypes = INTAKE_ALLOWED_MIME_TYPES,
  maxSize = INTAKE_MAX_FILE_SIZE_BYTES,
  disabled = false,
  onFileSelect,
  onClear,
  onUpload,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      const validation = validateFile(selectedFile, acceptedTypes, maxSize);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        return;
      }

      setValidationError(null);
      onFileSelect(selectedFile);
    },
    [acceptedTypes, maxSize, onFileSelect]
  );

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (!droppedFile) return;

      const validation = validateFile(droppedFile, acceptedTypes, maxSize);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        return;
      }

      setValidationError(null);
      onFileSelect(droppedFile);
    },
    [acceptedTypes, maxSize, onFileSelect]
  );

  /**
   * Open file picker
   */
  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Determine display state
  const displayError = validationError || errorMessage;
  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className={`intake-file-uploader ${className}`}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        style={{ display: 'none' }}
      />

      {/* Drop zone / File preview */}
      {!file ? (
        // Drop zone
        <div
          onDrag={handleDrag}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={disabled ? undefined : openFilePicker}
          style={{
            border: `2px dashed ${dragActive ? '#1976d2' : '#e0e0e0'}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive ? '#e3f2fd' : '#fafafa',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '2rem', color: '#9e9e9e' }}>
            📄
          </div>
          <div style={{ marginBottom: '8px', color: '#424242' }}>
            点击或拖拽文件到此处上传
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9e9e9e' }}>
            最大文件大小: {formatFileSize(maxSize)}
          </div>
        </div>
      ) : (
        // File preview
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: isSuccess ? '#e8f5e9' : isError ? '#ffebee' : '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  color: '#212121',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                {formatFileSize(file.size)}
              </div>
            </div>

            {/* Clear button */}
            {!isUploading && !isSuccess && (
              <button
                onClick={onClear}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e0e0e0',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#1976d2',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}

          {/* Status text */}
          {isUploading && (
            <div style={{ fontSize: '0.75rem', color: '#1976d2' }}>
              上传中... {progress}%
            </div>
          )}
          {isSuccess && (
            <div style={{ fontSize: '0.75rem', color: '#4caf50' }}>
              ✓ 上传成功
            </div>
          )}

          {/* Upload button */}
          {!isUploading && !isSuccess && onUpload && (
            <button
              onClick={onUpload}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              上传文件
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#c62828',
          }}
        >
          {displayError}
        </div>
      )}
    </div>
  );
};

export default IntakeFileUploader;
