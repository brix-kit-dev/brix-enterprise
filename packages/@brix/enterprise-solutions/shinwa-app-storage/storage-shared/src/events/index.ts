/**
 * File Storage Module Event Definitions
 */

export const STORAGE_EVENTS = {
  FILE_UPLOADED: 'storage:file-uploaded',
  FILE_DELETED: 'storage:file-deleted',
  UPLOAD_PROGRESS: 'storage:upload-progress',
  AVATAR_UPDATED: 'storage:avatar-updated',
} as const;

export interface FileUploadedPayload {
  fileId: string;
  filename: string;
  url: string;
}

export interface FileDeletedPayload {
  fileId: string;
}

export interface UploadProgressPayload {
  fileId: string;
  percentage: number;
}
