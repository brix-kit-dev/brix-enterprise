/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 时间槽模板实体
 * 
 * <p>定义资源在不同星期几的可预约时间段配置。
 * 系统根据此模板动态生成具体日期的可用时间槽。</p>
 * 
 * <h3>模板生成规则</h3>
 * <p>假设配置：周一 09:00-12:00，时长30分钟，最大预约数2</p>
 * <p>则每个周一会生成：09:00-09:30, 09:30-10:00, ... 共6个时间槽，每个槽最多2个预约</p>
 * 
 * <h3>特殊日期处理</h3>
 * <p>节假日等特殊日期的时间槽配置，可以通过额外的日期覆盖表实现（扩展功能）</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "time_slot_template", indexes = {
        @Index(name = "idx_template_resource_day", columnList = "resource_id, day_of_week"),
        @Index(name = "idx_template_tenant", columnList = "tenant_id")
})
public class TimeSlotTemplate {
    
    // ==================== 主键 ====================
    
    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ==================== 关联信息 ====================
    
    /**
     * 资源ID
     */
    @Column(name = "resource_id", nullable = false)
    private Long resourceId;
    
    /**
     * 星期几
     * <p>ISO-8601标准: 1=周一, 2=周二, ..., 7=周日</p>
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;
    
    // ==================== 时间配置 ====================
    
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
    
    /**
     * 时间槽时长（分钟）
     * <p>将 startTime-endTime 按此时长划分为多个时间槽</p>
     */
    @Column(name = "slot_duration", nullable = false)
    private Integer slotDuration = 30;
    
    /**
     * 每个时间槽最大预约数
     */
    @Column(name = "max_bookings", nullable = false)
    private Integer maxBookings = 1;
    
    // ==================== 状态信息 ====================
    
    /**
     * 是否启用
     */
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;
    
    // ==================== 租户与审计 ====================
    
    /**
     * 租户ID
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    
    /**
     * 创建时间
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // ==================== 生命周期回调 ====================
    
    /**
     * 持久化前的回调
     */
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 更新前的回调
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public TimeSlotTemplate() {
    }
    
    // ==================== Getters & Setters ====================
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }
    
    public Integer getDayOfWeek() {
        return dayOfWeek;
    }
    
    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
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
    
    public Integer getSlotDuration() {
        return slotDuration;
    }
    
    public void setSlotDuration(Integer slotDuration) {
        this.slotDuration = slotDuration;
    }
    
    public Integer getMaxBookings() {
        return maxBookings;
    }
    
    public void setMaxBookings(Integer maxBookings) {
        this.maxBookings = maxBookings;
    }
    
    public Boolean getEnabled() {
        return enabled;
    }
    
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
