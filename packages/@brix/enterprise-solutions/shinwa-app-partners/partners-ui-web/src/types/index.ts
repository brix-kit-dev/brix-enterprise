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
export const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: 'HOSPITAL', label: '医院' },
  { value: 'HOTEL', label: '酒店' },
  { value: 'TRANSPORT', label: '交通' },
  { value: 'TRANSLATION', label: '翻译' },
  { value: 'OTHER', label: '其他' },
];

/**
 * Partner status options
 */
export const PARTNER_STATUS_OPTIONS: { value: PartnerStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: '草稿', color: 'default' },
  { value: 'ACTIVE', label: '启用', color: 'success' },
  { value: 'SUSPENDED', label: '暂停', color: 'warning' },
  { value: 'TERMINATED', label: '终止', color: 'error' },
];

/**
 * Get partner type label
 */
export function getPartnerTypeLabel(type: PartnerType): string {
  const option = PARTNER_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label ?? type;
}

/**
 * Get partner status label
 */
export function getPartnerStatusLabel(status: PartnerStatus): string {
  const option = PARTNER_STATUS_OPTIONS.find(o => o.value === status);
  return option?.label ?? status;
}

/**
 * Get partner status color
 */
export function getPartnerStatusColor(status: PartnerStatus): 'default' | 'success' | 'warning' | 'error' {
  const option = PARTNER_STATUS_OPTIONS.find(o => o.value === status);
  return (option?.color as 'default' | 'success' | 'warning' | 'error') ?? 'default';
}
