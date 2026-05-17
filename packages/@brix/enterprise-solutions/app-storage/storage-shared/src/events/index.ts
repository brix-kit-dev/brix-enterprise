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
