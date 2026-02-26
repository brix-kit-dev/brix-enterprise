/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.entity;

import com.shinwa.app.booking.enums.ResourceType;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 可预约资源实体
 * 
 * <p>可预约资源是对外部实体（如医生、顾问、会议室）的抽象封装。
 * 通过资源抽象层，可以统一管理不同类型资源的预约规则。</p>
 * 
 * <h3>资源与外部实体的关系</h3>
 * <p>每个可预约资源通过 {@code resourceType} 和 {@code externalResourceId} 
 * 关联到具体的外部实体。例如：</p>
 * <ul>
 *   <li>DOCTOR + externalResourceId = 医生ID（来自医生模块）</li>
 *   <li>CONSULTANT + externalResourceId = 顾问ID（来自顾问模块）</li>
 *   <li>MEETING_ROOM + externalResourceId = 会议室ID（来自资产模块）</li>
 * </ul>
 * 
 * <h3>预约规则配置</h3>
 * <p>每个资源可以独立配置预约规则：</p>
 * <ul>
 *   <li>最大并发数：同一时间槽可以接受的预约数量</li>
 *   <li>提前天数：用户可以提前多少天预约</li>
 *   <li>取消截止时间：预约开始前多少小时内不可取消</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "bookable_resource", indexes = {
        @Index(name = "idx_resource_type_external", columnList = "resource_type, external_resource_id"),
        @Index(name = "idx_resource_tenant", columnList = "tenant_id"),
        @Index(name = "idx_resource_enabled", columnList = "enabled")
})
public class BookableResource {
    
    // ==================== 主键 ====================
    
    /**
     * 主键ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ==================== 基础信息 ====================
    
    /**
     * 资源类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", length = 50, nullable = false)
    private ResourceType resourceType;
    
    /**
     * 外部资源ID
     * <p>关联的外部实体ID，如医生ID、顾问ID等</p>
     */
    @Column(name = "external_resource_id", nullable = false)
    private Long externalResourceId;
    
    /**
     * 资源名称
     */
    @Column(name = "resource_name", length = 200, nullable = false)
    private String resourceName;
    
    /**
     * 描述
     */
    @Column(name = "description", length = 500)
    private String description;
    
    // ==================== 预约规则 ====================
    
    /**
     * 最大并发预约数
     * <p>同一时间槽可以接受的最大预约数量，默认为1</p>
     */
    @Column(name = "max_concurrent", nullable = false)
    private Integer maxConcurrent = 1;
    
    /**
     * 可提前预约天数
     * <p>用户可以提前多少天预约该资源，默认为30天</p>
     */
    @Column(name = "advance_days", nullable = false)
    private Integer advanceDays = 30;
    
    /**
     * 取消截止时间（小时）
     * <p>预约开始前多少小时内不可取消，默认为24小时</p>
     */
    @Column(name = "cancel_deadline_hours", nullable = false)
    private Integer cancelDeadlineHours = 24;
    
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
    
    // ==================== 业务方法 ====================
    
    /**
     * 启用资源
     */
    public void enable() {
        this.enabled = true;
    }
    
    /**
     * 禁用资源
     */
    public void disable() {
        this.enabled = false;
    }
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public BookableResource() {
    }
    
    // ==================== Getters & Setters ====================
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public ResourceType getResourceType() {
        return resourceType;
    }
    
    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }
    
    public Long getExternalResourceId() {
        return externalResourceId;
    }
    
    public void setExternalResourceId(Long externalResourceId) {
        this.externalResourceId = externalResourceId;
    }
    
    public String getResourceName() {
        return resourceName;
    }
    
    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getMaxConcurrent() {
        return maxConcurrent;
    }
    
    public void setMaxConcurrent(Integer maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
    }
    
    public Integer getAdvanceDays() {
        return advanceDays;
    }
    
    public void setAdvanceDays(Integer advanceDays) {
        this.advanceDays = advanceDays;
    }
    
    public Integer getCancelDeadlineHours() {
        return cancelDeadlineHours;
    }
    
    public void setCancelDeadlineHours(Integer cancelDeadlineHours) {
        this.cancelDeadlineHours = cancelDeadlineHours;
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
}
