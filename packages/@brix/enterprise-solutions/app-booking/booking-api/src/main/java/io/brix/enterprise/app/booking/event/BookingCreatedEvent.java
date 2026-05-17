/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 预约创建集成事件
 * 
 * <p>当新预约创建成功后发布此事件，用于通知其他模块（如通知模块、日历模块）。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>notification-service: 发送预约确认短信/邮件</li>
 *   <li>calendar-service: 更新日历展示</li>
 *   <li>audit-service: 记录预约操作日志</li>
 * </ul>
 * 
 * <h3>幂等处理</h3>
 * <p>消费者应通过 {@code bookingId} 或 {@code bookingNo} 实现幂等，
 * 防止重复处理导致重复发送通知。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class BookingCreatedEvent extends IntegrationEvent {
    
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
     * 资源ID
     */
    private final Long resourceId;
    
    /**
     * 资源类型
     */
    private final String resourceType;
    
    /**
     * 资源名称
     */
    private final String resourceName;
    
    /**
     * 预约人ID
     */
    private final Long userId;
    
    /**
     * 联系人姓名
     */
    private final String contactName;
    
    /**
     * 联系电话
     */
    private final String contactPhone;
    
    /**
     * 预约日期
     */
    private final LocalDate bookedDate;
    
    /**
     * 开始时间
     */
    private final LocalTime startTime;
    
    /**
     * 结束时间
     */
    private final LocalTime endTime;
    
    /**
     * 构造函数
     *
     * @param bookingId    预约ID
     * @param bookingNo    预约编号
     * @param resourceId   资源ID
     * @param resourceType 资源类型
     * @param resourceName 资源名称
     * @param userId       预约人ID
     * @param contactName  联系人姓名
     * @param contactPhone 联系电话
     * @param tenantId     租户ID (Long, converted to String for R3.6 multi-tenant event compliance)
     * @param bookedDate   预约日期
     * @param startTime    开始时间
     * @param endTime      结束时间
     */
    public BookingCreatedEvent(Long bookingId, String bookingNo, Long resourceId,
                               String resourceType, String resourceName,
                               Long userId, String contactName, String contactPhone,
                               Long tenantId, LocalDate bookedDate,
                               LocalTime startTime, LocalTime endTime) {
        super("brix-app-booking", tenantId != null ? String.valueOf(tenantId) : null);
        this.bookingId = bookingId;
        this.bookingNo = bookingNo;
        this.resourceId = resourceId;
        this.resourceType = resourceType;
        this.resourceName = resourceName;
        this.userId = userId;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.bookedDate = bookedDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }
    
    /**
     * 获取事件路由键
     * <p>用于 Kafka 分区，相同预约的事件路由到同一分区保证顺序</p>
     *
     * @return 路由键，格式: booking.{bookingId}
     */
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
    
    public Long getResourceId() {
        return resourceId;
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public String getResourceName() {
        return resourceName;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public LocalDate getBookedDate() {
        return bookedDate;
    }
    
    public LocalTime getStartTime() {
        return startTime;
    }
    
    public LocalTime getEndTime() {
        return endTime;
    }
}
