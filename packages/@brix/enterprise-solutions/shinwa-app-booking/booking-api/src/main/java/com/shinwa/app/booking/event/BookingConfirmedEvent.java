/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 预约确认集成事件
 * 
 * <p>当预约被确认时发布此事件，通知用户预约已生效。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class BookingConfirmedEvent extends IntegrationEvent {
    
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
     * 确认时间
     */
    private final LocalDateTime confirmedAt;
    
    /**
     * 确认操作人ID
     */
    private final Long confirmedBy;
    
    /**
     * 租户ID
     */
    private final Long tenantId;
    
    /**
     * 构造函数
     *
     * @param bookingId   预约ID
     * @param bookingNo   预约编号
     * @param confirmedAt 确认时间
     * @param confirmedBy 确认操作人ID
     * @param tenantId    租户ID
     */
    public BookingConfirmedEvent(Long bookingId, String bookingNo,
                                 LocalDateTime confirmedAt, Long confirmedBy,
                                 Long tenantId) {
        super("shinwa-app-booking");
        this.bookingId = bookingId;
        this.bookingNo = bookingNo;
        this.confirmedAt = confirmedAt;
        this.confirmedBy = confirmedBy;
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
    
    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }
    
    public Long getConfirmedBy() {
        return confirmedBy;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
}
