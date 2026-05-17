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
 * @file Contract Create Page Styles
 * @description Extracted styles for ContractCreatePage component
 * @module @brix-sdk/enterprise-contracts-ui-web
 * @version 3.0.0
 *
 * [v3.2.0 BP1 Refactoring]
 * Extracted from ContractCreatePage.tsx (1131 lines) to reduce file size.
 */

import type { CSSProperties } from 'react';

/**
 * ContractCreatePage styles object
 *
 * Contains all CSS-in-JS style definitions for the ContractCreatePage component.
 */
export const getStyles = (tokens: any): Record<string, CSSProperties> => ({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: tokens.colors.text.secondary,
  },
  breadcrumbLink: {
    color: tokens.colors.brand.primary,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  primaryButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.brand.primary,
  },
  secondaryButton: {
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.surface.card,
    border: `1px solid ${tokens.colors.border.subtle}`,
  },
  successButton: {
    color: tokens.colors.surface.card,
    backgroundColor: tokens.colors.status.success,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  steps: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  stepNumberActive: {
    backgroundColor: tokens.colors.brand.primary,
    color: tokens.colors.surface.card,
  },
  stepNumberCompleted: {
    backgroundColor: tokens.colors.status.success,
    color: tokens.colors.surface.card,
  },
  stepNumberPending: {
    backgroundColor: tokens.colors.border.default,
    color: tokens.colors.text.secondary,
  },
  stepLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },
  stepLabelActive: {
    color: tokens.colors.text.primary,
  },
  stepLabelPending: {
    color: tokens.colors.text.disabled,
  },
  stepConnector: {
    width: '80px',
    height: '2px',
    backgroundColor: tokens.colors.border.default,
    margin: '0 16px',
  },
  stepConnectorCompleted: {
    backgroundColor: tokens.colors.status.success,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  section: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    backgroundColor: tokens.colors.surface.page,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    margin: 0,
  },
  sectionContent: {
    padding: '20px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  templateCard: {
    padding: '16px',
    border: `2px solid ${tokens.colors.border.default}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  templateCardSelected: {
    borderColor: tokens.colors.brand.primary,
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
  },
  templateName: {
    fontSize: '16px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
    marginBottom: '8px',
  },
  templateCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colors.text.secondary,
    marginBottom: '8px',
  },
  templateDescription: {
    fontSize: '13px',
    color: tokens.colors.text.secondary,
    lineHeight: '1.5',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '20px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.text.primary,
  },
  required: {
    color: tokens.colors.status.error,
    marginLeft: '4px',
  },
  input: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: tokens.colors.status.error,
  },
  select: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: tokens.colors.surface.card,
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  hint: {
    fontSize: '12px',
    color: tokens.colors.text.secondary,
    marginTop: '4px',
  },
  error: {
    fontSize: '12px',
    color: tokens.colors.status.error,
    marginTop: '4px',
  },
  partyCard: {
    padding: '16px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
    marginBottom: '16px',
  },
  partyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  partyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colors.text.primary,
  },
  removePartyButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: tokens.colors.status.error,
    backgroundColor: 'transparent',
    border: '1px solid #FCA5A5',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  addPartyButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryLight,
    border: `1px dashed ${tokens.colors.brand.primary}`,
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  variableField: {
    padding: '16px',
    backgroundColor: tokens.colors.surface.page,
    borderRadius: '8px',
    marginBottom: '12px',
  },
  variableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  variableKey: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colors.brand.primary,
    backgroundColor: tokens.colors.brand.primaryLight,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  previewSection: {
    position: 'sticky',
    top: '24px',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
});
