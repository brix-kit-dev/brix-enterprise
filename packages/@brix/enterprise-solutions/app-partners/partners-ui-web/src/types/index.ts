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
 * Partner Management Module - Type Definitions
 * 
 * @description Defines TypeScript types related to partners
 * @version 3.0.0
 */

/**
 * Partner type
 */
export type PartnerType = 'HOSPITAL' | 'HOTEL' | 'TRANSPORT' | 'TRANSLATION' | 'OTHER';

/**
 * Partner status
 */
export type PartnerStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

/**
 * Partner Data Transfer Object
 */
export interface PartnerDTO {
  /** Partner ID */
  id: number;
  /** Tenant ID */
  tenantId: string;
  /** Partner code */
  partnerCode: string;
  /** Partner name */
  name: string;
  /** Partner short name */
  shortName?: string;
  /** Partner type */
  partnerType: PartnerType;
  /** Partner status */
  status: PartnerStatus;
  /** Contact person name */
  contactName?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Description */
  description?: string;
  /** Service area */
  serviceArea?: string;
  /** Qualification information */
  qualifications?: Record<string, unknown>;
  /** Created time */
  createdAt: string;
  /** Updated time */
  updatedAt?: string;
  /** Created by */
  createdBy?: string;
  /** Updated by */
  updatedBy?: string;
}

/**
 * Create partner request
 */
export interface CreatePartnerRequest {
  /** Partner name */
  name: string;
  /** Partner short name */
  shortName?: string;
  /** Partner type */
  partnerType: PartnerType;
  /** Contact person name */
  contactName?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Description */
  description?: string;
  /** Service area */
  serviceArea?: string;
  /** Qualification information */
  qualifications?: Record<string, unknown>;
}

/**
 * Update partner request
 */
export interface UpdatePartnerRequest {
  /** Partner name */
  name: string;
  /** Partner short name */
  shortName?: string;
  /** Contact person name */
  contactName?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Contact email */
  contactEmail?: string;
  /** Address */
  address?: string;
  /** Description */
  description?: string;
  /** Service area */
  serviceArea?: string;
  /** Qualification information */
  qualifications?: Record<string, unknown>;
}

/**
 * Partner type options
 */
export const PARTNER_TYPE_OPTIONS: { value: PartnerType; labelKey: string }[] = [
  { value: 'HOSPITAL', labelKey: 'type.HOSPITAL' },
  { value: 'HOTEL', labelKey: 'type.HOTEL' },
  { value: 'TRANSPORT', labelKey: 'type.TRANSPORT' },
  { value: 'TRANSLATION', labelKey: 'type.TRANSLATION' },
  { value: 'OTHER', labelKey: 'type.OTHER' },
];

/**
 * Partner status options
 */
export const PARTNER_STATUS_OPTIONS: { value: PartnerStatus; labelKey: string; color: string }[] = [
  { value: 'DRAFT', labelKey: 'statusType.DRAFT', color: 'default' },
  { value: 'ACTIVE', labelKey: 'statusType.ACTIVE', color: 'success' },
  { value: 'SUSPENDED', labelKey: 'statusType.SUSPENDED', color: 'warning' },
  { value: 'TERMINATED', labelKey: 'statusType.TERMINATED', color: 'error' },
];

/**
 * Get partner type label
 */
export function getPartnerTypeLabel(type: PartnerType, t?: (key: string) => string): string {
  const option = PARTNER_TYPE_OPTIONS.find(o => o.value === type);
  const key = option?.labelKey ?? `type.${type}`;
  return t ? t(key) : type;
}

/**
 * Get partner status label
 */
export function getPartnerStatusLabel(status: PartnerStatus, t?: (key: string) => string): string {
  const option = PARTNER_STATUS_OPTIONS.find(o => o.value === status);
  const key = option?.labelKey ?? `statusType.${status}`;
  return t ? t(key) : status;
}

/**
 * Get partner status color
 */
export function getPartnerStatusColor(status: PartnerStatus): 'default' | 'success' | 'warning' | 'error' {
  const option = PARTNER_STATUS_OPTIONS.find(o => o.value === status);
  return (option?.color as 'default' | 'success' | 'warning' | 'error') ?? 'default';
}
