/**
 * Booking Repository - Data Access Layer for Mobile
 * 
 * This module implements the Repository pattern for booking data access.
 * All HTTP calls are routed through HttpCapability to ensure proper
 * abstraction from infrastructure details.
 * 
 * @module @shinwa/booking-ui-mobile/repositories
 * @since 3.1.0
 */

import type { HttpCapability } from '@brix/runtime-sdk-api-mobile';
import type {
  Booking,
  BookingCreateRequest,
  BookingUpdateRequest,
  BookingListParams,
  BookingListResponse
} from '@shinwa/booking-shared';

/**
 * Booking Repository Interface
 * 
 * Defines the contract for booking data operations.
 * Implementation is injected via HttpCapability to maintain
 * infrastructure abstraction.
 * 
 * 预约数据仓库接口
 * 定义预约数据操作的契约，通过 HttpCapability 注入实现，保持基础设施抽象
 */
export interface BookingRepository {
  /**
   * Retrieves a paginated list of bookings
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to booking list response
   */
  getBookings(params?: BookingListParams): Promise<BookingListResponse>;

  /**
   * Retrieves a single booking by ID
   * @param id - Booking unique identifier
   * @returns Promise resolving to booking details
   */
  getBookingById(id: string): Promise<Booking>;

  /**
   * Creates a new booking
   * @param request - Booking creation request data
   * @returns Promise resolving to the created booking
   */
  createBooking(request: BookingCreateRequest): Promise<Booking>;

  /**
   * Updates an existing booking
   * @param id - Booking unique identifier
   * @param request - Booking update request data
   * @returns Promise resolving to the updated booking
   */
  updateBooking(id: string, request: BookingUpdateRequest): Promise<Booking>;

  /**
   * Cancels a booking
   * @param id - Booking unique identifier
   * @param reason - Optional cancellation reason
   * @returns Promise resolving when cancellation is complete
   */
  cancelBooking(id: string, reason?: string): Promise<void>;

  /**
   * Confirms a booking
   * @param id - Booking unique identifier
   * @returns Promise resolving to the confirmed booking
   */
  confirmBooking(id: string): Promise<Booking>;
}

/**
 * Creates a BookingRepository implementation using HttpCapability
 * 
 * Factory function that creates a repository instance with injected
 * HTTP capability. This pattern ensures that data access is completely
 * decoupled from specific HTTP client implementations.
 * 
 * 工厂函数通过注入 HttpCapability 创建仓库实例
 * 确保数据访问与具体 HTTP 客户端实现完全解耦
 * 
 * @param httpCapability - The HTTP capability for making API calls
 * @returns BookingRepository implementation
 * 
 * @example
 * ```typescript
 * const http = useHttpCapability();
 * const repository = createBookingRepository(http);
 * const bookings = await repository.getBookings({ page: 1, size: 10 });
 * ```
 */
export function createBookingRepository(httpCapability: HttpCapability): BookingRepository {
  const BASE_PATH = '/api/v1/bookings';

  return {
    async getBookings(params?: BookingListParams): Promise<BookingListResponse> {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      if (params?.status) queryParams.set('status', params.status);
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);

      const url = queryParams.toString() ? `${BASE_PATH}?${queryParams}` : BASE_PATH;
      return httpCapability.get<BookingListResponse>(url);
    },

    async getBookingById(id: string): Promise<Booking> {
      return httpCapability.get<Booking>(`${BASE_PATH}/${id}`);
    },

    async createBooking(request: BookingCreateRequest): Promise<Booking> {
      return httpCapability.post<Booking>(BASE_PATH, request);
    },

    async updateBooking(id: string, request: BookingUpdateRequest): Promise<Booking> {
      return httpCapability.put<Booking>(`${BASE_PATH}/${id}`, request);
    },

    async cancelBooking(id: string, reason?: string): Promise<void> {
      await httpCapability.post<void>(`${BASE_PATH}/${id}/cancel`, { reason });
    },

    async confirmBooking(id: string): Promise<Booking> {
      return httpCapability.post<Booking>(`${BASE_PATH}/${id}/confirm`, {});
    }
  };
}
