/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 预约完成集成事件
 * 
 * <p>当预约完成履约后发布此事件。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class BookingCompletedEvent extends IntegrationEvent {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 预约ID
     */
    private final Long bookingId;
    
    /**
     * 预约编号
     */
    private final String bookingNo;
    
    /**
     * 完成时间
     */
    private final LocalDateTime completedAt;
    
    /**
     * 租户ID
     */
    private final Long tenantId;
    
    /**
     * 构造函数
     *
     * @param bookingId   预约ID
     * @param bookingNo   预约编号
     * @param completedAt 完成时间
     * @param tenantId    租户ID
     */
    public BookingCompletedEvent(Long bookingId, String bookingNo,
                                 LocalDateTime completedAt, Long tenantId) {
        super("shinwa-app-booking");
        this.bookingId = bookingId;
        this.bookingNo = bookingNo;
        this.completedAt = completedAt;
        this.tenantId = tenantId;
    }
    
    @Override
    public String getRoutingKey() {
        return "booking." + bookingId;
    }
    
    // ==================== Getters ====================
    
    public Long getBookingId() {
        return bookingId;
    }
    
    public String getBookingNo() {
        return bookingNo;
    }
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
}
