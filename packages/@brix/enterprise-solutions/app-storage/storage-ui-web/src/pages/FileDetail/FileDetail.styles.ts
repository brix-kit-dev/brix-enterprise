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
 * @file FileDetail Styles
 * @description Style definitions for FileDetail page and sub-components
 * @module @brix-sdk/enterprise-storage-ui-web
 * @version 3.0.0
 */

import type { CSSProperties } from 'react';

export type FileDetailStyles = Record<string, CSSProperties>;

/**
 * Create styles from design tokens
 *
 * @param tokens - Theme design tokens
 * @returns Style dictionary for FileDetail components
 */
export const createStyles = (tokens: any): FileDetailStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colors.surface.page,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: tokens.colors.surface.card,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  headerContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerInfo: {
    flex: 1,
  },
  fileName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  fileMeta: {
    marginTop: '4px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.text.primary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
    border: 'none',
    fontWeight: 500,
  },
  dangerButton: {
    backgroundColor: tokens.colors.surface.card,
    color: tokens.colors.status.error,
    borderColor: tokens.colors.status.error,
  },
  tabs: {
    display: 'flex',
    gap: '0',
    padding: '0 24px',
    backgroundColor: tokens.colors.surface.card,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  tab: {
    padding: '14px 24px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    color: tokens.colors.text.secondary,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: tokens.colors.brand.primary,
    fontWeight: 500,
    borderBottomColor: tokens.colors.brand.primary,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  previewContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    border: `1px solid ${tokens.colors.border.default}`,
    minHeight: '400px',
  },
  metadataContainer: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    border: `1px solid ${tokens.colors.border.default}`,
    overflow: 'hidden',
  },
  metadataSection: {
    padding: '24px',
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  metadataSectionLast: {
    padding: '24px',
    borderBottom: 'none',
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metadataLabel: {
    fontSize: '13px',
    color: tokens.colors.text.disabled,
  },
  metadataValue: {
    fontSize: '14px',
    color: tokens.colors.text.primary,
    fontWeight: 500,
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    color: tokens.colors.text.secondary,
    fontWeight: 500,
  },
  formInput: {
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    fontSize: '14px',
  },
  formTextarea: {
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
  },
  formSelect: {
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: tokens.colors.surface.card,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: tokens.colors.text.secondary,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: tokens.colors.status.error,
  },
  deleteDialog: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  deleteDialogContent: {
    padding: '24px',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '12px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  deleteDialogTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  deleteDialogText: {
    margin: '0 0 24px',
    color: tokens.colors.text.secondary,
    lineHeight: 1.6,
  },
  deleteDialogActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
});
