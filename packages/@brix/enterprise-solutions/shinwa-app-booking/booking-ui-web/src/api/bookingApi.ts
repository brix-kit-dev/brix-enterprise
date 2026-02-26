/**
 * 预约 API 服务
 * 
 * 【架构红线 R3 合规 - v3.2】
 * 本模块严格遵循 v3.0 架构设计蓝图 §7.1 的规定：
 * 「插件层禁止直接使用 axios / fetch 等 HTTP 客户端库，需通过 HttpCapability 统一发起请求。」
 * 
 * 【改造说明】
 * v3.2 版本移除了内部的 request() 封装函数（基于 fetch），
 * 统一通过 HttpCapability 发起所有 HTTP 请求。
 * 
 * @module booking-ui-web
 * @version 3.2.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-web';
import type {
  BookingDTO,
  BookableResourceDTO,
  TimeSlotDTO,
  CreateBookingRequest,
  CancelBookingRequest,
  RescheduleRequest,
} from '../types';

// ==================== 能力管理 ====================

/**
 * HTTP 能力实例
 * 由 Shell 层在插件激活时通过 setHttpCapability() 注入
 */
let httpCapability: HttpCapability | null = null;

/**
 * 注入 HTTP 能力实例
 * 
 * 【调用时机】插件激活阶段，由 Shell 或 Plugin Bootstrap 调用
 * 
 * @param capability - Shell 层提供的 HttpCapability 实现
 * @throws 如果传入 null 或 undefined 将抛出错误
 */
export function setHttpCapability(capability: HttpCapability): void {
  if (!capability) {
    throw new Error('[booking-ui-web] HttpCapability 不能为 null');
  }
  httpCapability = capability;
}

/**
 * 获取 HTTP 能力实例（内部使用）
 * 
 * @returns HttpCapability 实例
 * @throws 如果能力未初始化将抛出明确的错误提示
 */
function getHttp(): HttpCapability {
  if (!httpCapability) {
    throw new Error(
      '[booking-ui-web] HttpCapability 未初始化，' +
      '请确保在插件激活时调用 setHttpCapability(capability)'
    );
  }
  return httpCapability;
}

// ==================== 预约相关 API ====================

/**
 * 获取预约详情
 * 
 * @param id - 预约 ID
 * @returns 预约详情
 */
export async function getBookingById(id: number): Promise<BookingDTO> {
  return getHttp().get<BookingDTO>(`/api/v1/bookings/${id}`);
}

/**
 * 根据预约编号获取详情
 * 
 * @param bookingNo - 预约编号
 * @returns 预约详情
 */
export async function getBookingByNo(bookingNo: string): Promise<BookingDTO> {
  return getHttp().get<BookingDTO>(`/api/v1/bookings/by-no/${bookingNo}`);
}

/**
 * 获取当前用户的预约列表
 * 
 * @param status - 预约状态筛选（可选）
 * @returns 预约列表
 */
export async function getMyBookings(status?: string): Promise<BookingDTO[]> {
  const params: Record<string, unknown> = {};
  if (status) params.status = status;
  return getHttp().get<BookingDTO[]>('/api/v1/bookings/mine', params);
}

/**
 * 根据用户 ID 获取预约列表
 * 
 * @param userId - 用户 ID
 * @param status - 预约状态筛选（可选）
 * @returns 预约列表
 */
export async function getBookingsByUser(userId: number, status?: string): Promise<BookingDTO[]> {
  const params: Record<string, unknown> = {};
  if (status) params.status = status;
  return getHttp().get<BookingDTO[]>(`/api/v1/bookings/by-user/${userId}`, params);
}

/**
 * 根据来源获取预约列表
 * 
 * @param sourceType - 来源类型
 * @param sourceId - 来源 ID
 * @returns 预约列表
 */
export async function getBookingsBySource(sourceType: string, sourceId: number): Promise<BookingDTO[]> {
  return getHttp().get<BookingDTO[]>('/api/v1/bookings/by-source', { sourceType, sourceId });
}

/**
 * 获取可用时间槽
 * 
 * @param resourceId - 资源 ID
 * @param date - 日期（格式：YYYY-MM-DD）
 * @returns 可用时间槽列表
 */
export async function getAvailableSlots(resourceId: number, date: string): Promise<TimeSlotDTO[]> {
  return getHttp().get<TimeSlotDTO[]>('/api/v1/bookings/slots', { resourceId, date });
}

/**
 * 创建预约
 * 
 * @param data - 创建预约请求
 * @returns 创建的预约信息
 */
export async function createBooking(data: CreateBookingRequest): Promise<BookingDTO> {
  return getHttp().post<BookingDTO>('/api/v1/bookings', data);
}

/**
 * 确认预约
 * 
 * @param id - 预约 ID
 */
export async function confirmBooking(id: number): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookings/${id}/confirm`);
}

/**
 * 取消预约
 * 
 * @param id - 预约 ID
 * @param data - 取消请求（包含取消原因）
 */
export async function cancelBooking(id: number, data: CancelBookingRequest): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookings/${id}/cancel`, data);
}

/**
 * 完成预约
 * 
 * @param id - 预约 ID
 */
export async function completeBooking(id: number): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookings/${id}/complete`);
}

/**
 * 标记为未到
 * 
 * @param id - 预约 ID
 */
export async function markNoShow(id: number): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookings/${id}/no-show`);
}

/**
 * 预约改期
 * 
 * @param id - 预约 ID
 * @param data - 改期请求（包含新的时间信息）
 * @returns 更新后的预约信息
 */
export async function rescheduleBooking(id: number, data: RescheduleRequest): Promise<BookingDTO> {
  return getHttp().post<BookingDTO>(`/api/v1/bookings/${id}/reschedule`, data);
}

// ==================== 资源相关 API ====================

/**
 * 获取资源列表
 * 
 * @param resourceType - 资源类型筛选（可选）
 * @param enabled - 启用状态筛选（可选）
 * @returns 资源列表
 */
export async function getResources(resourceType?: string, enabled?: boolean): Promise<BookableResourceDTO[]> {
  const params: Record<string, unknown> = {};
  if (resourceType) params.resourceType = resourceType;
  if (enabled !== undefined) params.enabled = enabled;
  return getHttp().get<BookableResourceDTO[]>('/api/v1/bookable-resources', params);
}

/**
 * 获取资源详情
 * 
 * @param id - 资源 ID
 * @returns 资源详情
 */
export async function getResourceById(id: number): Promise<BookableResourceDTO> {
  return getHttp().get<BookableResourceDTO>(`/api/v1/bookable-resources/${id}`);
}

/**
 * 根据编码获取资源
 * 
 * @param code - 资源编码
 * @returns 资源详情
 */
export async function getResourceByCode(code: string): Promise<BookableResourceDTO> {
  return getHttp().get<BookableResourceDTO>(`/api/v1/bookable-resources/by-code/${code}`);
}

/**
 * 创建资源
 * 
 * @param data - 资源信息
 * @returns 创建的资源
 */
export async function createResource(data: Partial<BookableResourceDTO>): Promise<BookableResourceDTO> {
  return getHttp().post<BookableResourceDTO>('/api/v1/bookable-resources', data);
}

/**
 * 更新资源
 * 
 * @param id - 资源 ID
 * @param data - 更新的资源信息
 * @returns 更新后的资源
 */
export async function updateResource(id: number, data: Partial<BookableResourceDTO>): Promise<BookableResourceDTO> {
  return getHttp().put<BookableResourceDTO>(`/api/v1/bookable-resources/${id}`, data);
}

/**
 * 启用资源
 * 
 * @param id - 资源 ID
 */
export async function enableResource(id: number): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookable-resources/${id}/enable`);
}

/**
 * 禁用资源
 * 
 * @param id - 资源 ID
 */
export async function disableResource(id: number): Promise<void> {
  return getHttp().post<void>(`/api/v1/bookable-resources/${id}/disable`);
}

/**
 * 删除资源
 * 
 * @param id - 资源 ID
 */
export async function deleteResource(id: number): Promise<void> {
  return getHttp().delete<void>(`/api/v1/bookable-resources/${id}`);
}
