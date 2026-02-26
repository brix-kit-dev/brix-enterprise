/**
 * Partner Management Module - Mobile Type Definitions
 * 
 * @description Defines TypeScript types for partner (consistent with Web version)
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
 * Partner data transfer object
 */
export interface PartnerDTO {
  id: number;
  tenantId: string;
  partnerCode: string;
  name: string;
  shortName?: string;
  partnerType: PartnerType;
  status: PartnerStatus;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  description?: string;
  serviceArea?: string;
  qualifications?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Partner type configuration
 */
export const PARTNER_TYPES: Record<PartnerType, { label: string; icon: string }> = {
  HOSPITAL: { label: '医院', icon: 'hospital-building' },
  HOTEL: { label: '酒店', icon: 'bed' },
  TRANSPORT: { label: '交通', icon: 'car' },
  TRANSLATION: { label: '翻译', icon: 'translate' },
  OTHER: { label: '其他', icon: 'help-circle' },
};

/**
 * Partner status configuration
 */
export const PARTNER_STATUSES: Record<PartnerStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: '#9e9e9e' },
  ACTIVE: { label: '启用', color: '#4caf50' },
  SUSPENDED: { label: '暂停', color: '#ff9800' },
  TERMINATED: { label: '终止', color: '#f44336' },
};
