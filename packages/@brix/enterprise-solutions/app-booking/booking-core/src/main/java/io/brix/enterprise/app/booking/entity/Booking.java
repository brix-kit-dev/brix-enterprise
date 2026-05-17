/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.entity;

import io.brix.enterprise.app.booking.enums.BookingStatus;
import io.brix.enterprise.app.booking.enums.ResourceType;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 预约实体
 * 
 * <p>记录用户对资源的预约信息。预约包含以下核心信息：</p>
 * <ul>
 *   <li>预约资源（资源ID、类型、名称）</li>
 *   <li>预约时间（日期、开始时间、结束时间）</li>
 *   <li>预约人信息（用户ID、联系人、电话）</li>
 *   <li>预约状态（待确认、已确认、已取消、已完成、未到）</li>
 *   <li>来源追溯（来源类型、来源ID）</li>
 * </ul>
 * 
 * <h3>数据库表设计</h3>
 * <p>表名: booking</p>
 * <p>索引设计考量：</p>
 * <ul>
 *   <li>booking_no: 唯一索引，支持按编号快速查询</li>
 *   <li>resource_id + booked_date: 组合索引，支持时间槽冲突检测</li>
 *   <li>user_id + tenant_id: 组合索引，支持用户预约列表查询</li>
 *   <li>source_type + source_id: 组合索引，支持按来源查询</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Entity
@Table(name = "booking", indexes = {
        @Index(name = "idx_booking_no", columnList = "booking_no", unique = true),
        @Index(name = "idx_booking_resource_date", columnList = "resource_id, booked_date"),
        @Index(name = "idx_booking_user_tenant", columnList = "user_id, tenant_id"),
        @Index(name = "idx_booking_status", columnList = "status"),
        @Index(name = "idx_booking_source", columnList = "source_type, source_id"),
        @Index(name = "idx_booking_tenant", columnList = "tenant_id")
})
public class Booking {
    
    // ==================== 主键 ====================
    
    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ==================== 基础信息 ====================
    
    /**
     * 预约编号
     * <p>系统生成的唯一标识，格式: BK + 日期 + 序号，如: BK20260121001</p>
     */
    @Column(name = "booking_no", length = 50, nullable = false, unique = true)
    private String bookingNo;
    
    // ==================== 资源信息 ====================
    
    /**
     * 资源ID
     * <p>关联 bookable_resource 表</p>
     */
    @Column(name = "resource_id", nullable = false)
    private Long resourceId;
    
    /**
     * 资源类型
     * <p>冗余存储，便于查询和展示</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 50, nullable = false)
    private ResourceType resourceType;
    
    /**
     * 资源名称
     * <p>冗余存储，便于展示</p>
     */
    @Column(name = "resource_name", length = 200)
    private String resourceName;
    
    // ==================== 时间信息 ====================
    
    /**
     * 预约日期
     */
    @Column(name = "booked_date", nullable = false)
    private LocalDate bookedDate;
    
    /**
     * 开始时间
     */
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    /**
     * 结束时间
     */
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    // ==================== 预约人信息 ====================
    
    /**
     * 预约人ID
     * <p>关联用户表</p>
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    /**
     * 联系人姓名
     */
    @Column(name = "contact_name", length = 100)
    private String contactName;
    
    /**
     * 联系电话
     */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
    
    // ==================== 状态信息 ====================
    
    /**
     * 预约状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private BookingStatus status = BookingStatus.PENDING;
    
    // ==================== 来源追溯 ====================
    
    /**
     * 来源类型
     * <p>关联的业务类型，如: CASE、SERVICE_PACKAGE、CONSULT、DIRECT</p>
     */
    @Column(name = "source_type", length = 50)
    private String sourceType;
    
    /**
     * 来源业务ID
     * <p>关联的业务单据ID</p>
     */
    @Column(name = "source_id")
    private Long sourceId;
    
    // ==================== 其他信息 ====================
    
    /**
     * 备注
     */
    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
    
    /**
     * 取消原因
     */
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;
    
    /**
     * 取消时间
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    /**
     * 确认时间
     */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    
    /**
     * 完成时间
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // ==================== 租户与审计 ====================
    
    /**
     * 租户ID
     * <p>多租户隔离字段</p>
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    
    /**
     * 创建人
     */
    @Column(name = "created_by")
    private Long createdBy;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /**
     * 更新人
     */
    @Column(name = "updated_by")
    private Long updatedBy;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // ==================== 关联关系 ====================
    
    /**
     * 关联的资源实体（延迟加载）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", insertable = false, updatable = false)
    private BookableResource resource;
    
    // ==================== 生命周期回调 ====================
    
    /**
     * 持久化前的回调
     * <p>自动设置创建时间和更新时间</p>
     */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 更新前的回调
     * <p>自动更新更新时间</p>
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // ==================== 业务方法 ====================
    
    /**
     * 确认预约
     * <p>将状态变更为已确认，并记录确认时间</p>
     *
     * @throws IllegalStateException 如果当前状态不允许确认
     */
    public void confirm() {
        if (!this.status.canConfirm()) {
            throw new IllegalStateException("当前状态[" + this.status.getDisplayName() + "]不允许确认");
        }
        this.status = BookingStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
    }
    
    /**
     * 取消预约
     *
     * @param reason 取消原因
     * @throws IllegalStateException 如果当前状态不允许取消
     */
    public void cancel(String reason) {
        if (!this.status.canCancel()) {
            throw new IllegalStateException("当前状态[" + this.status.getDisplayName() + "]不允许取消");
        }
        this.status = BookingStatus.CANCELLED;
        this.cancelReason = reason;
        this.cancelledAt = LocalDateTime.now();
    }
    
    /**
     * 完成预约
     *
     * @throws IllegalStateException 如果当前状态不允许完成
     */
    public void complete() {
        if (!this.status.canComplete()) {
            throw new IllegalStateException("当前状态[" + this.status.getDisplayName() + "]不允许完成");
        }
        this.status = BookingStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }
    
    /**
     * 标记为未到
     *
     * @throws IllegalStateException 如果当前状态不允许标记
     */
    public void markNoShow() {
        if (!this.status.canMarkNoShow()) {
            throw new IllegalStateException("当前状态[" + this.status.getDisplayName() + "]不允许标记为未到");
        }
        this.status = BookingStatus.NO_SHOW;
    }
    
    /**
     * 改期
     *
     * @param newDate      新日期
     * @param newStartTime 新开始时间
     * @param newEndTime   新结束时间
     * @throws IllegalStateException 如果当前状态不允许改期
     */
    public void reschedule(LocalDate newDate, LocalTime newStartTime, LocalTime newEndTime) {
        if (this.status.isFinal()) {
            throw new IllegalStateException("当前状态[" + this.status.getDisplayName() + "]不允许改期");
        }
        this.bookedDate = newDate;
        this.startTime = newStartTime;
        this.endTime = newEndTime;
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public Booking() {
    }
    
    // ==================== Getters & Setters ====================
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getBookingNo() {
        return bookingNo;
    }
    
    public void setBookingNo(String bookingNo) {
        this.bookingNo = bookingNo;
    }
    
    public Long getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }
    
    public ResourceType getResourceType() {
        return resourceType;
    }
    
    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }
    
    public String getResourceName() {
        return resourceName;
    }
    
    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }
    
    public LocalDate getBookedDate() {
        return bookedDate;
    }
    
    public void setBookedDate(LocalDate bookedDate) {
        this.bookedDate = bookedDate;
    }
    
    public LocalTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public BookingStatus getStatus() {
        return status;
    }
    
    public void setStatus(BookingStatus status) {
        this.status = status;
    }
    
    public String getSourceType() {
        return sourceType;
    }
    
    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }
    
    public Long getSourceId() {
        return sourceId;
    }
    
    public void setSourceId(Long sourceId) {
        this.sourceId = sourceId;
    }
    
    public String getRemark() {
        return remark;
    }
    
    public void setRemark(String remark) {
        this.remark = remark;
    }
    
    public String getCancelReason() {
        return cancelReason;
    }
    
    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }
    
    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }
    
    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }
    
    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }
    
    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Long getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public BookableResource getResource() {
        return resource;
    }
    
    public void setResource(BookableResource resource) {
        this.resource = resource;
    }
}
