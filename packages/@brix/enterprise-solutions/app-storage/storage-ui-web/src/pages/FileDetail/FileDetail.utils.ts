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
 * @file FileDetail Utility Functions
 * @description Shared helpers for FileDetail sub-components
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 */

import type { CSSProperties } from 'react';

export type TabKey = 'preview' | 'metadata' | 'logs';

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Human-readable size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get status badge style based on file status
 *
 * @param status - File status string
 * @param tokens - Theme design tokens
 * @returns Style object for the status badge
 */
export function getStatusStyle(status: string, tokens: any): CSSProperties {
  const statusStyles: Record<string, CSSProperties> = {
    ACTIVE: { backgroundColor: tokens.colors.status.successLight, color: tokens.colors.status.success },
    PROCESSING: { backgroundColor: tokens.colors.status.warningLight, color: '#F57C00' },
    ARCHIVED: { backgroundColor: '#ECEFF1', color: tokens.colors.text.secondary },
    DELETED: { backgroundColor: tokens.colors.status.errorLight, color: tokens.colors.status.error },
  };
  return statusStyles[status] || statusStyles.ACTIVE;
}
