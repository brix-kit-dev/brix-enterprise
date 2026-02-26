/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 预约取消集成事件
 * 
 * <p>当预约被取消时发布此事件，用于通知相关模块进行后续处理。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>notification-service: 发送取消通知给用户和资源方</li>
 *   <li>calendar-service: 释放时间槽</li>
 *   <li>case-service: 更新关联案件状态</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class BookingCancelledEvent extends IntegrationEvent {
    
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
     * 取消原因
     */
    private final String cancelReason;
    
    /**
     * 取消时间
     */
    private final LocalDateTime cancelledAt;
    
    /**
     * 取消操作人ID
     */
    private final Long cancelledBy;
    
    /**
     * 租户ID
     */
    private final Long tenantId;
    
    /**
     * 构造函数
     *
     * @param bookingId    预约ID
     * @param bookingNo    预约编号
     * @param cancelReason 取消原因
     * @param cancelledAt  取消时间
     * @param cancelledBy  取消操作人ID
     * @param tenantId     租户ID
     */
    public BookingCancelledEvent(Long bookingId, String bookingNo,
                                 String cancelReason, LocalDateTime cancelledAt,
                                 Long cancelledBy, Long tenantId) {
        super("shinwa-app-booking");
        this.bookingId = bookingId;
        this.bookingNo = bookingNo;
        this.cancelReason = cancelReason;
        this.cancelledAt = cancelledAt;
        this.cancelledBy = cancelledBy;
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
    
    public String getCancelReason() {
        return cancelReason;
    }
    
    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }
    
    public Long getCancelledBy() {
        return cancelledBy;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
}
