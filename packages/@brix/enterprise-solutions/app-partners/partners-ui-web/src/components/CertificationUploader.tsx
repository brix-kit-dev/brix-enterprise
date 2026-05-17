/**
 * @file Certification Uploader Component
 * @description Reusable component for uploading and managing partner certifications/qualifications
 * @module partners-ui-web/components/CertificationUploader
 * @version 3.2.0
 * 
 * v3.2 Frontend-Backend Separation Architecture:
 * This component is a pure View layer implementation:
 * - Handles UI rendering for file upload interface
 * - Manages local file selection state
 * - Delegates actual upload operations to parent via callbacks
 * 
 * Architecture Constraint:
 * - No direct HTTP calls (fetch/axios) allowed
 * - File upload is handled externally via FileCapability or HttpCapability
 * 
 * @see v3.0.4-Runtime-Shell-Architecture-Blueprint.md §7.5
 */

import React, { useCallback, useState, useRef } from 'react';
import { useUI, useI18n } from '@brix-sdk/runtime-sdk-react';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Certification file information
 * 
 * Represents a single certification document with metadata.
 */
export interface CertificationFile {
  /** Unique file ID */
  id: string;
  /** File name */
  fileName: string;
  /** File URL (after upload) */
  fileUrl?: string;
  /** File type (MIME type) */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** Certification type */
  certificationType: string;
  /** Certification name/title */
  certificationName: string;
  /** Issue date (ISO 8601 format) */
  issueDate?: string;
  /** Expiry date (ISO 8601 format) */
  expiryDate?: string;
  /** Issuing authority */
  issuingAuthority?: string;
  /** Upload status */
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  /** Error message (if status is 'error') */
  errorMessage?: string;
}

/**
 * Certification type option
 */
export interface CertificationTypeOption {
  /** Type value */
  value: string;
  /** i18n label key */
  labelKey: string;
  /** Whether required */
  required?: boolean;
}

/**
 * CertificationUploader component props
 */
export interface CertificationUploaderProps {
  /** Current certification files list */
  certifications: CertificationFile[];
  /** Callback when certification is added (returns file to upload) */
  onAdd: (file: File, metadata: Omit<CertificationFile, 'id' | 'fileUrl' | 'status' | 'fileName' | 'fileType' | 'fileSize'>) => void;
  /** Callback when certification is removed */
  onRemove: (certificationId: string) => void;
  /** Callback when certification metadata is updated */
  onUpdate?: (certificationId: string, metadata: Partial<CertificationFile>) => void;
  /** Available certification types */
  certificationTypes?: CertificationTypeOption[];
  /** Whether component is in read-only mode */
  readOnly?: boolean;
  /** Whether component is in loading state */
  loading?: boolean;
  /** Maximum number of certifications allowed */
  maxCount?: number;
  /** Accepted file types */
  acceptedFileTypes?: string[];
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
}

// ============================================================================
// Default Constants
// ============================================================================

/**
 * Default certification types for medical intermediary partners
 */
const DEFAULT_CERTIFICATION_TYPES: CertificationTypeOption[] = [
  { value: 'BUSINESS_LICENSE', labelKey: 'cert.BUSINESS_LICENSE', required: true },
  { value: 'MEDICAL_LICENSE', labelKey: 'cert.MEDICAL_LICENSE' },
  { value: 'HEALTH_CERTIFICATE', labelKey: 'cert.HEALTH_CERTIFICATE' },
  { value: 'PROFESSIONAL_CERT', labelKey: 'cert.PROFESSIONAL_CERT' },
  { value: 'ISO_CERT', labelKey: 'cert.ISO_CERT' },
  { value: 'INSURANCE_CERT', labelKey: 'cert.INSURANCE_CERT' },
  { value: 'OTHER', labelKey: 'cert.OTHER' },
];

/**
 * Default accepted file types
 */
const DEFAULT_ACCEPTED_FILES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

/**
 * Default maximum file size (10 MB)
 */
const DEFAULT_MAX_FILE_SIZE_MB = 10;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get appropriate icon name based on file type
 * 
 * @param fileType - MIME type of the file
 * @returns Icon name string
 */
const getFileIconName = (fileType: string): string => {
  if (fileType.startsWith('image/')) {
    return 'image';
  }
  if (fileType === 'application/pdf') {
    return 'picture_as_pdf';
  }
  return 'description';
};

/**
 * Check if certification is expired
 * 
 * @param expiryDate - Expiry date in ISO format
 * @returns true if expired, false otherwise
 */
const isExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

/**
 * Check if certification will expire within 30 days
 * 
 * @param expiryDate - Expiry date in ISO format
 * @returns true if expiring soon
 */
const isExpiringSoon = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry <= thirtyDaysFromNow && expiry > new Date();
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Certification Uploader Component
 * 
 * A comprehensive component for managing partner certifications/qualifications.
 * Supports file upload with metadata including certification type, dates, and authority.
 * 
 * Features:
 * - File type and size validation
 * - Certification metadata management
 * - Expiry date tracking with visual indicators
 * - Read-only mode for viewing
 * 
 * Usage Example:
 * ```tsx
 * const [certifications, setCertifications] = useState<CertificationFile[]>([]);
 * 
 * <CertificationUploader
 *   certifications={certifications}
 *   onAdd={(file, metadata) => handleUpload(file, metadata)}
 *   onRemove={(id) => handleRemove(id)}
 *   certificationTypes={customTypes}
 * />
 * ```
 */
export const CertificationUploader: React.FC<CertificationUploaderProps> = ({
  certifications,
  onAdd,
  onRemove,
  onUpdate,
  certificationTypes = DEFAULT_CERTIFICATION_TYPES,
  readOnly = false,
  loading = false,
  maxCount = 20,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILES,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
}) => {
  // ========================================================================
  // UIAdapter Components
  // ========================================================================
  
  const { Box, Button, Card, Typography, Tag, Alert, Spin, Icon, Input, Select, Modal } = useUI();
  // i18n hook
  const { t } = useI18n('partners');
  
  // ========================================================================
  // Local State
  // ========================================================================
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Metadata form state
  const [metadata, setMetadata] = useState({
    certificationType: '',
    certificationName: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
  });
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /**
   * Handle file selection
   * Validates file type and size before opening metadata dialog
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset validation error
    setValidationError(null);
    
    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setValidationError(t('certUploader.unsupportedType', { types: acceptedFileTypes.map(ft => ft.split('/')[1]).join(', ') }));
      return;
    }
    
    // Validate file size
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(t('certUploader.fileSizeLimit', { max: maxFileSizeMB }));
      return;
    }
    
    // Check max count
    if (certifications.length >= maxCount) {
      setValidationError(t('certUploader.maxCountLimit', { max: maxCount }));
      return;
    }
    
    // Store selected file and open dialog
    setSelectedFile(file);
    setDialogOpen(true);
    
    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [acceptedFileTypes, maxFileSizeMB, maxCount, certifications.length]);
  
  /**
   * Handle upload button click
   * Triggers hidden file input
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  /**
   * Handle dialog close
   * Resets form state
   */
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedFile(null);
    setMetadata({
      certificationType: '',
      certificationName: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: '',
    });
  }, []);
  
  /**
   * Handle certification submission
   * Validates metadata and calls onAdd callback
   */
  const handleSubmit = useCallback(() => {
    if (!selectedFile || !metadata.certificationType || !metadata.certificationName) {
      setValidationError(t('certUploader.requiredFields'));
      return;
    }
    
    onAdd(selectedFile, {
      certificationType: metadata.certificationType,
      certificationName: metadata.certificationName,
      issueDate: metadata.issueDate || undefined,
      expiryDate: metadata.expiryDate || undefined,
      issuingAuthority: metadata.issuingAuthority || undefined,
    });
    
    handleDialogClose();
  }, [selectedFile, metadata, onAdd, handleDialogClose]);
  
  /**
   * Handle certification removal
   * Calls onRemove callback after confirmation
   */
  const handleRemove = useCallback((certificationId: string) => {
    setConfirmDeleteId(certificationId);
  }, []);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box>
      {/* Validation Error Alert */}
      {validationError && (
        <Alert
          severity="error"
          closable
          onClose={() => setValidationError(null)}
          style={{ marginBottom: 16 }}
        >
          {validationError}
        </Alert>
      )}
      
      {/* Certifications List */}
      {certifications.length > 0 && (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {certifications.map((cert) => (
            <Box
              key={cert.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Icon name={getFileIconName(cert.fileType)} size={24} />
              <Box style={{ flex: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography style={{ fontWeight: 500 }}>{cert.certificationName}</Typography>
                  <Tag>
                    {t(certificationTypes.find(ct => ct.value === cert.certificationType)?.labelKey ?? cert.certificationType)}
                  </Tag>
                  {/* Status indicators */}
                  {cert.status === 'uploading' && <Spin size="small" />}
                  {cert.status === 'error' && (
                    <Tag color="error">{t('certUploader.uploadFailed')}</Tag>
                  )}
                  {cert.expiryDate && isExpired(cert.expiryDate) && (
                    <Tag color="error">
                      <Icon name="warning" size={12} style={{ marginRight: 4 }} />
                      {t('certUploader.expired')}
                    </Tag>
                  )}
                  {cert.expiryDate && isExpiringSoon(cert.expiryDate) && (
                    <Tag color="warning">
                      <Icon name="warning" size={12} style={{ marginRight: 4 }} />
                      {t('certUploader.expiringSoon')}
                    </Tag>
                  )}
                  {cert.status === 'uploaded' && !isExpired(cert.expiryDate) && !isExpiringSoon(cert.expiryDate) && (
                    <Icon name="check_circle" size={16} style={{ color: '#10B981' }} />
                  )}
                </Box>
                <Box style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                    {cert.fileName} ({formatFileSize(cert.fileSize)})
                  </Typography>
                  {cert.issuingAuthority && (
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                      {t('certUploader.issuedBy')}{cert.issuingAuthority}
                    </Typography>
                  )}
                  {cert.expiryDate && (
                    <Typography style={{ fontSize: 12, color: '#6B7280' }}>
                      {t('certUploader.expiryDate')}{new Date(cert.expiryDate).toLocaleDateString('zh-CN')}
                    </Typography>
                  )}
                </Box>
              </Box>
              {!readOnly && (
                <Box style={{ display: 'flex', gap: 4 }}>
                  {onUpdate && (
                    <Button
                      variant="text"
                      startIcon="edit"
                      size="small"
                    />
                  )}
                  <Button
                    variant="text"
                    startIcon="delete"
                    size="small"
                    onClick={() => handleRemove(cert.id)}
                    disabled={loading}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      {/* Empty State */}
      {certifications.length === 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Box style={{ textAlign: 'center', padding: 32 }}>
            <Icon name="cloud_upload" size={48} style={{ color: '#9CA3AF', marginBottom: 8 }} />
            <Typography style={{ color: '#6B7280' }}>
              {t('certUploader.noCerts')}
            </Typography>
            <Typography style={{ fontSize: 14, color: '#9CA3AF' }}>
              {t('certUploader.uploadHint')}
            </Typography>
          </Box>
        </Card>
      )}
      
      {/* Upload Button */}
      {!readOnly && certifications.length < maxCount && (
        <Button
          startIcon="add"
          onClick={handleUploadClick}
          disabled={loading}
        >
          {t('certUploader.addCert')}
        </Button>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {/* Metadata Modal */}
      <Modal
        open={dialogOpen}
        onClose={handleDialogClose}
        onCancel={handleDialogClose}
        title={t('certUploader.dialogTitle')}
        footer={
          <Box style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={handleDialogClose}>{t('certUploader.cancel')}</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!metadata.certificationType || !metadata.certificationName}
            >
              {t('certUploader.confirmAdd')}
            </Button>
          </Box>
        }
        width={500}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          {/* Selected File Info */}
          {selectedFile && (
            <Alert
              severity="info"
              icon={getFileIconName(selectedFile.type)}
            >
              {`${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
            </Alert>
          )}
          
          {/* Certification Type */}
          <Select
            placeholder={t('certUploader.typePlaceholder')}
            value={metadata.certificationType}
            onChange={(value: string) => setMetadata({ ...metadata, certificationType: value })}
            options={certificationTypes.map((type) => ({
              label: `${t(type.labelKey)}${type.required ? ' *' : ''}`,
              value: type.value,
            }))}
            style={{ width: '100%' }}
          />
          
          {/* Certification Name */}
          <Input
            placeholder={t('certUploader.namePlaceholder')}
            value={metadata.certificationName}
            onChange={(e) => setMetadata({ ...metadata, certificationName: e.target.value })}
          />
          
          {/* Issuing Authority */}
          <Input
            placeholder={t('certUploader.issuerPlaceholder')}
            value={metadata.issuingAuthority}
            onChange={(e) => setMetadata({ ...metadata, issuingAuthority: e.target.value })}
          />
          
          {/* Dates */}
          <Box style={{ display: 'flex', gap: 16 }}>
            <Box style={{ flex: 1 }}>
              <Typography style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{t('certUploader.issueDate')}</Typography>
              <Input
                type="date"
                value={metadata.issueDate}
                onChange={(e) => setMetadata({ ...metadata, issueDate: e.target.value })}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Typography style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{t('certUploader.expiryDateLabel')}</Typography>
              <Input
                type="date"
                value={metadata.expiryDate}
                onChange={(e) => setMetadata({ ...metadata, expiryDate: e.target.value })}
              />
            </Box>
          </Box>
        </Box>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onCancel={() => setConfirmDeleteId(null)}
        title={t('certUploader.deleteCertConfirm')}
        footer={
          <Box style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setConfirmDeleteId(null)}>{t('certUploader.cancel')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (confirmDeleteId) {
                  onRemove(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
            >
              {t('list.deleteConfirm')}
            </Button>
          </Box>
        }
        width={400}
      />
    </Box>
  );
};
