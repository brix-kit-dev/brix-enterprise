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
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ValidIcon,
  Warning as ExpiredIcon,
} from '@mui/icons-material';

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
  /** Display label */
  label: string;
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
  { value: 'BUSINESS_LICENSE', label: '营业执照', required: true },
  { value: 'MEDICAL_LICENSE', label: '医疗机构执业许可证' },
  { value: 'HEALTH_CERTIFICATE', label: '卫生许可证' },
  { value: 'PROFESSIONAL_CERT', label: '专业资质证书' },
  { value: 'ISO_CERT', label: 'ISO认证' },
  { value: 'INSURANCE_CERT', label: '保险资质证明' },
  { value: 'OTHER', label: '其他证明' },
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
 * Get appropriate icon component based on file type
 * 
 * @param fileType - MIME type of the file
 * @returns MUI Icon component
 */
const getFileIcon = (fileType: string): React.ReactNode => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon color="primary" />;
  }
  if (fileType === 'application/pdf') {
    return <PdfIcon color="error" />;
  }
  return <FileIcon color="action" />;
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
  // Local State
  // ========================================================================
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
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
      setValidationError(`不支持的文件类型。支持的类型：${acceptedFileTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }
    
    // Validate file size
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(`文件大小超过限制（最大 ${maxFileSizeMB} MB）`);
      return;
    }
    
    // Check max count
    if (certifications.length >= maxCount) {
      setValidationError(`最多只能上传 ${maxCount} 个证书文件`);
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
      setValidationError('请填写必填字段');
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
    if (window.confirm('确定要删除这个证书吗？')) {
      onRemove(certificationId);
    }
  }, [onRemove]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <Box>
      {/* Validation Error Alert */}
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setValidationError(null)}>
          {validationError}
        </Alert>
      )}
      
      {/* Certifications List */}
      {certifications.length > 0 && (
        <List sx={{ mb: 2 }}>
          {certifications.map((cert) => (
            <ListItem
              key={cert.id}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemIcon>
                {getFileIcon(cert.fileType)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{cert.certificationName}</Typography>
                    <Chip
                      label={certificationTypes.find(t => t.value === cert.certificationType)?.label || cert.certificationType}
                      size="small"
                      variant="outlined"
                    />
                    {/* Status indicators */}
                    {cert.status === 'uploading' && <CircularProgress size={16} />}
                    {cert.status === 'error' && (
                      <Chip label="上传失败" size="small" color="error" />
                    )}
                    {cert.expiryDate && isExpired(cert.expiryDate) && (
                      <Chip
                        icon={<ExpiredIcon />}
                        label="已过期"
                        size="small"
                        color="error"
                      />
                    )}
                    {cert.expiryDate && isExpiringSoon(cert.expiryDate) && (
                      <Chip
                        icon={<ExpiredIcon />}
                        label="即将过期"
                        size="small"
                        color="warning"
                      />
                    )}
                    {cert.status === 'uploaded' && !isExpired(cert.expiryDate) && !isExpiringSoon(cert.expiryDate) && (
                      <ValidIcon color="success" fontSize="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {cert.fileName} ({formatFileSize(cert.fileSize)})
                    </Typography>
                    {cert.issuingAuthority && (
                      <Typography variant="caption" color="text.secondary">
                        发证机构: {cert.issuingAuthority}
                      </Typography>
                    )}
                    {cert.expiryDate && (
                      <Typography variant="caption" color="text.secondary">
                        有效期至: {new Date(cert.expiryDate).toLocaleDateString('zh-CN')}
                      </Typography>
                    )}
                  </Stack>
                }
              />
              {!readOnly && (
                <ListItemSecondaryAction>
                  {onUpdate && (
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemove(cert.id)}
                    disabled={loading}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Empty State */}
      {certifications.length === 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              暂无证书文件
            </Typography>
            <Typography variant="body2" color="text.secondary">
              点击下方按钮上传合作方资质证书
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Upload Button */}
      {!readOnly && certifications.length < maxCount && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleUploadClick}
          disabled={loading}
        >
          添加证书
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
      
      {/* Metadata Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>添加证书信息</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Selected File Info */}
            {selectedFile && (
              <Alert severity="info" icon={getFileIcon(selectedFile.type)}>
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </Alert>
            )}
            
            {/* Certification Type */}
            <TextField
              select
              label="证书类型"
              value={metadata.certificationType}
              onChange={(e) => setMetadata({ ...metadata, certificationType: e.target.value })}
              fullWidth
              required
              SelectProps={{ native: true }}
            >
              <option value="">请选择证书类型</option>
              {certificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}{type.required ? ' *' : ''}
                </option>
              ))}
            </TextField>
            
            {/* Certification Name */}
            <TextField
              label="证书名称"
              value={metadata.certificationName}
              onChange={(e) => setMetadata({ ...metadata, certificationName: e.target.value })}
              fullWidth
              required
              placeholder="例如：营业执照副本"
            />
            
            {/* Issuing Authority */}
            <TextField
              label="发证机构"
              value={metadata.issuingAuthority}
              onChange={(e) => setMetadata({ ...metadata, issuingAuthority: e.target.value })}
              fullWidth
              placeholder="例如：市场监督管理局"
            />
            
            {/* Dates */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="发证日期"
                type="date"
                value={metadata.issueDate}
                onChange={(e) => setMetadata({ ...metadata, issueDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="有效期至"
                type="date"
                value={metadata.expiryDate}
                onChange={(e) => setMetadata({ ...metadata, expiryDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!metadata.certificationType || !metadata.certificationName}
          >
            确认添加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
