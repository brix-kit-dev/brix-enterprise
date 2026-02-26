/**
 * 预约 API 类型定义
 * 
 * @module @shinwa/booking-ui-mobile
 * @version 3.0.0
 */

/**
 * 预约状态枚举
 */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

/**
 * 资源类型枚举
 */
export type ResourceType = 'ROOM' | 'EQUIPMENT' | 'PERSON' | 'SERVICE' | 'OTHER';

/**
 * 预约 DTO
 */
export interface BookingDTO {
  id: number;
  bookingNo: string;
  resourceId: number;
  resourceType: ResourceType;
  resourceName: string;
  bookedDate: string;
  startTime: string;
  endTime: string;
  userId: number;
  contactName: string;
  contactPhone: string;
  status: BookingStatus;
  sourceType?: string;
  sourceId?: number;
  remark?: string;
  tenantId: number;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 可预约资源 DTO
 */
export interface BookableResourceDTO {
  id: number;
  resourceCode: string;
  resourceName: string;
  resourceType: ResourceType;
  description?: string;
  location?: string;
  capacity?: number;
  maxConcurrent: number;
  advanceDays: number;
  cancelDeadlineHours: number;
  sortOrder: number;
  enabled: boolean;
}

/**
 * 时间槽 DTO
 */
export interface TimeSlotDTO {
  slotId: string;
  resourceId: number;
  date: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  bookedCount: number;
  availableCount: number;
  available: boolean;
  expired: boolean;
}

/**
 * 创建预约请求
 */
export interface CreateBookingRequest {
  resourceId: number;
  resourceType: ResourceType;
  bookedDate: string;
  startTime: string;
  endTime: string;
  userId: number;
  contactName: string;
  contactPhone: string;
  sourceType?: string;
  sourceId?: number;
  remark?: string;
}
