/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.service.support;

import com.shinwa.app.booking.dto.BookingDTO;
import com.shinwa.app.booking.entity.BookableResource;
import com.shinwa.app.booking.entity.Booking;
import com.shinwa.app.booking.enums.BookingStatus;
import com.shinwa.app.booking.repository.BookingRepository;
import com.shinwa.app.booking.request.CreateBookingRequest;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * Booking Service Support
 * 
 * <p>Helper methods for BookingServiceImpl, including context access,
 * ID generation, caching, and DTO conversion.</p>
 * 
 * <h3>Architecture Note (架构说明)</h3>
 * <p>Extracted from BookingServiceImpl as part of code quality improvement.
 * Contains utility methods to keep the main service file focused on business logic.</p>
 * 
 * <p>【中文技术要点】
 * 从 BookingServiceImpl 提取的辅助方法，包括：
 * <ul>
 *   <li>租户/用户上下文获取</li>
 *   <li>预约编号生成</li>
 *   <li>缓存管理</li>
 *   <li>实体转DTO</li>
 *   <li>时间槽可用性校验</li>
 * </ul>
 * </p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Component
public class BookingServiceSupport {
    
    /**
     * Cache key prefix for bookings
     * 【缓存键前缀】
     */
    public static final String CACHE_KEY_BOOKING = "booking:";
    
    /**
     * Date formatter for booking number generation
     * 【预约编号日期格式】
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    /**
     * Active booking statuses for conflict detection
     * 【有效预约状态】用于冲突检测和统计
     */
    public static final List<BookingStatus> ACTIVE_STATUSES = Arrays.asList(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED
    );
    
    private final RuntimeContext runtimeContext;
    private final BookingRepository bookingRepository;
    
    /**
     * Constructor with dependency injection
     *
     * @param runtimeContext Runtime context
     * @param bookingRepository Booking repository
     */
    public BookingServiceSupport(
            RuntimeContext runtimeContext,
            BookingRepository bookingRepository) {
        this.runtimeContext = runtimeContext;
        this.bookingRepository = bookingRepository;
    }
    
    /**
     * Get current tenant ID from RuntimeContext
     * 
     * <p>【中文技术要点】通过 RuntimeContext 的 AuthContext 能力获取租户ID</p>
     *
     * @return Current tenant ID
     */
    public Long getCurrentTenantId() {
        String tenantId = runtimeContext.getAuthContext().getTenantId();
        return tenantId != null ? Long.parseLong(tenantId) : null;
    }
    
    /**
     * Get current user ID from RuntimeContext
     * 
     * <p>【中文技术要点】通过 RuntimeContext 的 AuthContext 能力获取用户ID，
     * 需要将 Principal 转换为 TenantAwarePrincipal 以获取 userId</p>
     *
     * @return Current user ID
     */
    public Long getCurrentUserId() {
        var principal = runtimeContext.getAuthContext().getCurrentPrincipal();
        if (principal instanceof io.runtime.sdk.capability.TenantAwarePrincipal tenantPrincipal) {
            String userId = tenantPrincipal.getUserId();
            return userId != null ? Long.parseLong(userId) : null;
        }
        // Fallback: use Principal.getName() as user identifier
        return principal != null && principal.getName() != null 
                ? Long.parseLong(principal.getName()) 
                : null;
    }
    
    /**
     * Generate booking number
     * 
     * <p>Format: BK + date + sequence, e.g., BK20260128001</p>
     * <p>【预约编号格式】BK + 日期 + 序号</p>
     *
     * @return Generated booking number
     */
    public String generateBookingNo() {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        // In production, use distributed ID generator or database sequence
        // Simplified here using last 3 digits of timestamp
        String seq = String.format("%03d", System.currentTimeMillis() % 1000);
        return "BK" + dateStr + seq;
    }
    
    /**
     * Invalidate booking cache
     * 
     * <p>【缓存失效】删除指定预约的缓存</p>
     *
     * @param bookingId Booking ID
     */
    public void invalidateBookingCache(Long bookingId) {
        runtimeContext.getStateStore().remove(CACHE_KEY_BOOKING + bookingId);
    }
    
    /**
     * Get state store from runtime context
     *
     * @return State store instance
     */
    public io.runtime.sdk.capability.StateStoreCapability getStateStore() {
        return runtimeContext.getStateStore();
    }
    
    /**
     * Validate time slot availability
     * 
     * <p>【时间槽校验】检查指定时间槽是否还有可用容量</p>
     *
     * @param request Booking request
     * @param resource Bookable resource
     * @throws IllegalArgumentException if slot is full
     */
    public void validateSlotAvailability(CreateBookingRequest request, BookableResource resource) {
        boolean hasConflict = bookingRepository.hasConflict(
                request.getResourceId(),
                request.getBookedDate(),
                request.getStartTime(),
                request.getEndTime(),
                ACTIVE_STATUSES,
                resource.getMaxConcurrent());
        
        if (hasConflict) {
            throw new IllegalArgumentException("该时间槽已满，无法预约");
        }
    }
    
    /**
     * Convert Booking entity to DTO
     * 
     * <p>【实体转DTO】将预约实体转换为数据传输对象</p>
     *
     * @param booking Booking entity
     * @return BookingDTO
     */
    public BookingDTO toDTO(Booking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .bookingNo(booking.getBookingNo())
                .resourceId(booking.getResourceId())
                .resourceType(booking.getResourceType())
                .resourceName(booking.getResourceName())
                .bookedDate(booking.getBookedDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .userId(booking.getUserId())
                .contactName(booking.getContactName())
                .contactPhone(booking.getContactPhone())
                .status(booking.getStatus())
                .sourceType(booking.getSourceType())
                .sourceId(booking.getSourceId())
                .remark(booking.getRemark())
                .tenantId(booking.getTenantId())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
