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
 * @file Booking Repository
 * @description Booking data access layer - Encapsulates all booking-related API interactions
 * @module booking-ui-web/repositories/BookingRepository
 * @version 3.2.0
 * 
 * [v3.2 Frontend-Backend Separation Architecture]
 * Repository layer responsibilities:
 * 1. Encapsulate backend API call details
 * 2. Data format transformation (if needed)
 * 3. Error handling standardization
 * 
 * [Architecture Red Line R3 Compliance]
 * All HTTP requests are made through HttpCapability, not directly using fetch/axios.
 * 
 * @see HttpCapability - Defined in @brix-sdk/runtime-sdk-api-web
 */

import type { HttpCapability } from '@brix-sdk/runtime-sdk-api-web';
import type { 
  Booking, 
  CreateBookingParams, 
  UpdateBookingParams,
  CancelBookingParams,
  BookingStatus,
  TimeSlot,
  PagedResponse,
} from 'booking-shared';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Booking list query parameters
 */
export interface BookingQueryParams {
  /** Page number (0-based) */
  page?: number;
  /** Page size */
  size?: number;
  /** Status filter */
  status?: BookingStatus;
  /** Resource ID filter */
  resourceId?: number;
  /** Date range start */
  dateFrom?: string;
  /** Date range end */
  dateTo?: string;
  /** Search keyword (booking number, contact name) */
  keyword?: string;
}

/**
 * Booking Repository interface
 */
export interface BookingRepository {
  /**
   * Get paginated booking list
   * 
   * @param query - Query parameters
   * @returns Paginated booking response
   */
  list(query?: BookingQueryParams): Promise<PagedResponse<Booking>>;
  
  /**
   * Get booking detail by ID
   * 
   * @param id - Booking ID
   * @returns Booking detail
   */
  getById(id: number): Promise<Booking>;
  
  /**
   * Get booking detail by booking number
   * 
   * @param bookingNo - Booking number
   * @returns Booking detail
   */
  getByBookingNo(bookingNo: string): Promise<Booking>;
  
  /**
   * Get current user's booking list
   * 
   * @param status - Status filter (optional)
   * @returns Booking list
   */
  getMyBookings(status?: BookingStatus): Promise<Booking[]>;
  
  /**
   * Get booking list by source
   * 
   * @param sourceType - Source type (e.g., 'case', 'contract')
   * @param sourceId - Source ID
   * @returns Booking list for the source
   */
  getBySource(sourceType: string, sourceId: number): Promise<Booking[]>;
  
  /**
   * Create booking
   * 
   * @param params - Create parameters
   * @returns Created booking
   */
  create(params: CreateBookingParams): Promise<Booking>;
  
  /**
   * Update booking
   * 
   * @param id - Booking ID
   * @param params - Update parameters
   * @returns Updated booking
   */
  update(id: number, params: UpdateBookingParams): Promise<Booking>;
  
  /**
   * Confirm booking
   * 
   * @param id - Booking ID
   * @returns Confirmed booking
   */
  confirm(id: number): Promise<Booking>;
  
  /**
   * Cancel booking
   * 
   * @param id - Booking ID
   * @param params - Cancel parameters (includes reason)
   */
  cancel(id: number, params: CancelBookingParams): Promise<void>;
  
  /**
   * Complete booking
   * 
   * @param id - Booking ID
   * @returns Completed booking
   */
  complete(id: number): Promise<Booking>;
  
  /**
   * Mark as no-show
   * 
   * @param id - Booking ID
   * @returns Marked booking
   */
  markNoShow(id: number): Promise<Booking>;
  
  /**
   * Get available time slots
   * 
   * @param resourceId - Resource ID
   * @param date - Date (YYYY-MM-DD format)
   * @returns Time slot list
   */
  getAvailableSlots(resourceId: number, date: string): Promise<TimeSlot[]>;
}

// ============================================================================
// API Constants
// ============================================================================

/** Booking API base path — '/api' prefix provided by HttpCapability baseURL */
const API_BASE = '/v1/bookings';

// ============================================================================
// Repository Factory Function
// ============================================================================

/**
 * Create Booking Repository instance
 * 
 * @param http - HttpCapability instance, provided by Shell layer
 * @returns BookingRepository instance
 * 
 * @example
 * ```typescript
 * const http = useHttp();
 * const bookingRepo = useMemo(() => createBookingRepository(http), [http]);
 * const bookings = await bookingRepo.list({ page: 0, size: 10 });
 * ```
 */
export function createBookingRepository(http: HttpCapability): BookingRepository {
  return {
    // ========================================================================
    // Query Operations
    // ========================================================================
    
    /**
     * Get paginated booking list
     * 
     * [Request Format]
     * GET /api/v1/bookings?page={page}&size={size}&status={status}...
     */
    async list(query?: BookingQueryParams): Promise<PagedResponse<Booking>> {
      const params: Record<string, unknown> = {};
      
      if (query?.page !== undefined) params.page = query.page;
      if (query?.size !== undefined) params.size = query.size;
      if (query?.status) params.status = query.status;
      if (query?.resourceId) params.resourceId = query.resourceId;
      if (query?.dateFrom) params.dateFrom = query.dateFrom;
      if (query?.dateTo) params.dateTo = query.dateTo;
      if (query?.keyword) params.keyword = query.keyword;
      
      return http.get<PagedResponse<Booking>>(API_BASE, params);
    },
    
    /**
     * Get booking detail by ID
     * 
     * [Request Format]
     * GET /api/v1/bookings/{id}
     */
    async getById(id: number): Promise<Booking> {
      return http.get<Booking>(`${API_BASE}/${id}`);
    },
    
    /**
     * Get booking detail by booking number
     * 
     * [Request Format]
     * GET /api/v1/bookings/by-no/{bookingNo}
     */
    async getByBookingNo(bookingNo: string): Promise<Booking> {
      return http.get<Booking>(`${API_BASE}/by-no/${bookingNo}`);
    },
    
    /**
     * Get current user's booking list
     * 
     * [Request Format]
     * GET /api/v1/bookings/mine?status={status}
     */
    async getMyBookings(status?: BookingStatus): Promise<Booking[]> {
      const params: Record<string, unknown> = {};
      if (status) params.status = status;
      
      return http.get<Booking[]>(`${API_BASE}/mine`, params);
    },
    
    /**
     * Get booking list by source
     * 
     * [Request Format]
     * GET /api/v1/bookings/by-source?sourceType={sourceType}&sourceId={sourceId}
     */
    async getBySource(sourceType: string, sourceId: number): Promise<Booking[]> {
      return http.get<Booking[]>(`${API_BASE}/by-source`, { sourceType, sourceId });
    },
    
    /**
     * Get available time slots
     * 
     * [Request Format]
     * GET /api/v1/bookings/slots?resourceId={resourceId}&date={date}
     */
    async getAvailableSlots(resourceId: number, date: string): Promise<TimeSlot[]> {
      return http.get<TimeSlot[]>(`${API_BASE}/slots`, { resourceId, date });
    },
    
    // ========================================================================
    // Write Operations
    // ========================================================================
    
    /**
     * Create booking
     * 
     * [Request Format]
     * POST /api/v1/bookings
     * Body: CreateBookingParams
     */
    async create(params: CreateBookingParams): Promise<Booking> {
      return http.post<Booking>(API_BASE, params);
    },
    
    /**
     * Update booking
     * 
     * [Request Format]
     * PUT /api/v1/bookings/{id}
     * Body: UpdateBookingParams
     */
    async update(id: number, params: UpdateBookingParams): Promise<Booking> {
      return http.put<Booking>(`${API_BASE}/${id}`, params);
    },
    
    // ========================================================================
    // Status Change Operations
    // ========================================================================
    
    /**
     * Confirm booking
     * 
     * [Request Format]
     * POST /api/v1/bookings/{id}/confirm
     */
    async confirm(id: number): Promise<Booking> {
      return http.post<Booking>(`${API_BASE}/${id}/confirm`);
    },
    
    /**
     * Cancel booking
     * 
     * [Request Format]
     * POST /api/v1/bookings/{id}/cancel
     * Body: CancelBookingParams
     */
    async cancel(id: number, params: CancelBookingParams): Promise<void> {
      return http.post<void>(`${API_BASE}/${id}/cancel`, params);
    },
    
    /**
     * Complete booking
     * 
     * [Request Format]
     * POST /api/v1/bookings/{id}/complete
     */
    async complete(id: number): Promise<Booking> {
      return http.post<Booking>(`${API_BASE}/${id}/complete`);
    },
    
    /**
     * Mark as no-show
     * 
     * [Request Format]
     * POST /api/v1/bookings/{id}/no-show
     */
    async markNoShow(id: number): Promise<Booking> {
      return http.post<Booking>(`${API_BASE}/${id}/no-show`);
    },
  };
}
