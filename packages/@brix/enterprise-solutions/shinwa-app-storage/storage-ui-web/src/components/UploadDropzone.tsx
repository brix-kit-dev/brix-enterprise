/**
 * @file Upload Dropzone Component
 * @description Drag-and-drop file upload zone component
 * @module @shinwa/storage-ui-web
 * @version 3.0.0
 *
 * Design Notes:
 * Pure presentational component following v3.0.4 View layer principles:
 * 1. Handles drag-and-drop UI interactions
 * 2. File selection via input or drop
 * 3. File validation (type, size)
 * 4. Emits file list via callback
 *
 * Architecture Compliance:
 * - Pure View component with no HTTP calls
 * - File upload handled by parent via onFilesSelected callback
 * - Uses runtime SDK constants for validation
 *
 * @author Shinwa Team
 * @date 2026-02-23
 */

import {
  useState,
  useCallback,
  useRef,
  type DragEvent,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@shinwa/storage-shared';

// ============================================================================
// Types
// ============================================================================

/**
 * File validation error
 */
export interface FileValidationError {
  /** File name */
  filename: string;

  /** Error type */
  type: 'size' | 'type' | 'other';

  /** Error message */
  message: string;
}

/**
 * Upload Dropzone Props
 */
export interface UploadDropzoneProps {
  /** Callback when files are selected/dropped */
  onFilesSelected: (files: File[]) => void;

  /** Callback when validation errors occur */
  onValidationError?: (errors: FileValidationError[]) => void;

  /** Accepted MIME types (comma-separated or array) */
  accept?: string | string[];

  /** Maximum file size in bytes (default: MAX_FILE_SIZE.DEFAULT) */
  maxSize?: number;

  /** Maximum file size in bytes (alias for maxSize) */
  maxFileSize?: number;

  /** Maximum number of files allowed */
  maxFiles?: number;

  /** Allow multiple file selection (default: true) */
  multiple?: boolean;

  /** Disable the dropzone */
  disabled?: boolean;

  /** Custom prompt text */
  promptText?: string;

  /** Additional CSS class names */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    minHeight: '200px',
    border: '2px dashed #BDBDBD',
    borderRadius: '8px',
    backgroundColor: '#FAFAFA',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  containerDragOver: {
    borderColor: '#1976D2',
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
  },
  containerDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: '#F5F5F5',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.6,
  },
  promptText: {
    margin: 0,
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#424242',
    textAlign: 'center',
  },
  subText: {
    margin: 0,
    fontSize: '14px',
    color: '#757575',
    textAlign: 'center',
  },
  browseButton: {
    marginTop: '16px',
    padding: '8px 24px',
    border: '1px solid #1976D2',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#1976D2',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  fileInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  formatHint: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#9E9E9E',
    textAlign: 'center',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(0)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * Get accept string for file input
 *
 * @param accept - Accept prop value
 * @returns Comma-separated MIME types
 */
function getAcceptString(accept?: string | string[]): string {
  if (!accept) {
    return [
      ...ALLOWED_MIME_TYPES.IMAGES,
      ...ALLOWED_MIME_TYPES.DOCUMENTS,
    ].join(',');
  }
  return Array.isArray(accept) ? accept.join(',') : accept;
}

/**
 * Validate a single file
 *
 * @param file - File to validate
 * @param maxSize - Maximum allowed size
 * @param acceptedTypes - Array of accepted MIME types
 * @returns Validation error or null
 */
function validateFile(
  file: File,
  maxSize: number,
  acceptedTypes: string[]
): FileValidationError | null {
  // Check file size
  if (file.size > maxSize) {
    return {
      filename: file.name,
      type: 'size',
      message: `文件大小 (${formatSize(file.size)}) 超过限制 (${formatSize(maxSize)})`,
    };
  }

  // Check file type if accept types are specified
  if (acceptedTypes.length > 0) {
    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith('/*')) {
        // Wildcard match (e.g., "image/*")
        const category = type.slice(0, -2);
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return {
        filename: file.name,
        type: 'type',
        message: `不支持的文件类型: ${file.type || '未知'}`,
      };
    }
  }

  return null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Upload Dropzone Component
 *
 * Drag-and-drop file upload interface with file validation.
 * Pure presentational component that emits selected files to parent.
 *
 * @param props - Component props
 * @returns Dropzone element
 *
 * @example
 * ```tsx
 * <UploadDropzone
 *   onFilesSelected={(files) => addFiles(files)}
 *   onValidationError={(errors) => showErrors(errors)}
 *   accept={['image/*', 'application/pdf']}
 *   maxSize={10 * 1024 * 1024}
 *   multiple
 * />
 * ```
 */
export function UploadDropzone({
  onFilesSelected,
  onValidationError,
  accept,
  maxSize = MAX_FILE_SIZE.DEFAULT,
  maxFileSize,
  maxFiles,
  multiple = true,
  disabled = false,
  promptText = '拖拽文件到此处上传',
  className,
  style,
}: UploadDropzoneProps): JSX.Element {
  // Use maxFileSize if provided, otherwise use maxSize
  const effectiveMaxSize = maxFileSize ?? maxSize;

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse accepted types
  const acceptString = getAcceptString(accept);
  const acceptedTypes = acceptString.split(',').map((t) => t.trim());

  // Process selected files with validation
  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const validFiles: File[] = [];
      const errors: FileValidationError[] = [];

      // Check maxFiles limit
      const filesToProcess = maxFiles
        ? Array.from(fileList).slice(0, maxFiles)
        : Array.from(fileList);

      filesToProcess.forEach((file) => {
        const error = validateFile(file, effectiveMaxSize, acceptedTypes);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      // Report validation errors
      if (errors.length > 0 && onValidationError) {
        onValidationError(errors);
      }

      // Process valid files
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [effectiveMaxSize, maxFiles, acceptedTypes, onFilesSelected, onValidationError]
  );

  // Handle drag events
  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set false if leaving the container (not entering a child)
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const { files } = event.dataTransfer;
      processFiles(files);
    },
    [disabled, processFiles]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      processFiles(event.target.files);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    [processFiles]
  );

  // Handle click to open file browser
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Handle keyboard activation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      className={className}
      style={{
        ...styles.container,
        ...(isDragOver ? styles.containerDragOver : {}),
        ...(disabled ? styles.containerDisabled : {}),
        ...style,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="文件上传区域"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileInputChange}
        style={styles.fileInput}
        aria-hidden="true"
      />

      {/* Upload icon */}
      <span style={styles.icon} aria-hidden="true">
        📤
      </span>

      {/* Prompt text */}
      <p style={styles.promptText}>{promptText}</p>
      <p style={styles.subText}>或点击选择文件</p>

      {/* Browse button */}
      <button
        type="button"
        style={styles.browseButton}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        选择文件
      </button>

      {/* Format hint */}
      <p style={styles.formatHint}>
        支持: 图片、PDF、Word、Excel | 最大 {formatSize(maxSize)}
        {multiple ? ' | 可多选' : ''}
      </p>
    </div>
  );
}
