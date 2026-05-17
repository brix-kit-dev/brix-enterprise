/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.dto;

import io.brix.enterprise.app.booking.enums.ResourceType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 可预约资源数据传输对象
 * 
 * <p>用于在服务层和展示层之间传递可预约资源的信息。
 * 可预约资源是对外部实体（如医生、顾问、会议室）的抽象封装。</p>
 * 
 * <h3>资源与外部实体的关系</h3>
 * <p>每个可预约资源通过 {@code resourceType} 和 {@code externalResourceId} 
 * 关联到具体的外部实体。例如：</p>
 * <ul>
 *   <li>DOCTOR + externalResourceId = 医生ID</li>
 *   <li>CONSULTANT + externalResourceId = 顾问ID</li>
 *   <li>MEETING_ROOM + externalResourceId = 会议室ID</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(name = "BookableResourceDTO", description = "可预约资源信息")
public class BookableResourceDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // ==================== 基础信息 ====================
    
    /**
     * 资源ID
     */
    @Schema(description = "资源唯一标识", example = "100", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;
    
    /**
     * 资源类型
     */
    @Schema(description = "资源类型", example = "ROOM", requiredMode = Schema.RequiredMode.REQUIRED)
    private ResourceType resourceType;
    
    /**
     * 外部资源ID
     * <p>关联的外部实体ID，如医生ID、顾问ID等</p>
     */
    @Schema(description = "关联的外部实体ID", example = "2001", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long externalResourceId;
    
    /**
     * 资源名称
     */
    @Schema(description = "资源名称", example = "会议室A")
    private String resourceName;
    
    /**
     * 描述
     */
    @Schema(description = "资源描述", example = "二楼西侧30人会议室")
    private String description;
    
    // ==================== 预约规则 ====================
    
    /**
     * 最大并发预约数
     * <p>同一时间槽可以接受的最大预约数量</p>
     */
    @Schema(description = "最大并发预约数", example = "1", defaultValue = "1")
    private Integer maxConcurrent;
    
    /**
     * 可提前预约天数
     * <p>用户可以提前多少天预约该资源</p>
     */
    @Schema(description = "可提前预约天数", example = "30", defaultValue = "30")
    private Integer advanceDays;
    
    /**
     * 取消截止时间（小时）
     * <p>预约开始前多少小时内不可取消</p>
     */
    @Schema(description = "取消截止时间（小时）", example = "2", defaultValue = "2")
    private Integer cancelDeadlineHours;
    
    // ==================== 状态信息 ====================
    
    /**
     * 是否启用
     */
    @Schema(description = "是否启用", example = "true", defaultValue = "true")
    private Boolean enabled;
    
    // ==================== 租户与审计 ====================
    
    /**
     * 租户ID
     */
    @Schema(description = "租户ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long tenantId;
    
    /**
     * 创建人
     */
    @Schema(description = "创建人用户ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long createdBy;
    
    /**
     * 创建时间
     */
    @Schema(description = "创建时间", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime createdAt;
    
    /**
     * 更新人
     */
    @Schema(description = "最后更新人用户ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long updatedBy;
    
    /**
     * 更新时间
     */
    @Schema(description = "最后更新时间", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime updatedAt;
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public BookableResourceDTO() {
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
    
    // ==================== Builder ====================
    
    /**
     * 创建构建器
     *
     * @return 新的 Builder 实例
     */
    public static Builder builder() {
        return new Builder();
    }
    
    /**
     * BookableResourceDTO 构建器
     */
    public static class Builder {
        private final BookableResourceDTO dto = new BookableResourceDTO();
        
        public Builder id(Long id) {
            dto.id = id;
            return this;
        }
        
        public Builder resourceType(ResourceType resourceType) {
            dto.resourceType = resourceType;
            return this;
        }
        
        public Builder externalResourceId(Long externalResourceId) {
            dto.externalResourceId = externalResourceId;
            return this;
        }
        
        public Builder resourceName(String resourceName) {
            dto.resourceName = resourceName;
            return this;
        }
        
        public Builder description(String description) {
            dto.description = description;
            return this;
        }
        
        public Builder maxConcurrent(Integer maxConcurrent) {
            dto.maxConcurrent = maxConcurrent;
            return this;
        }
        
        public Builder advanceDays(Integer advanceDays) {
            dto.advanceDays = advanceDays;
            return this;
        }
        
        public Builder cancelDeadlineHours(Integer cancelDeadlineHours) {
            dto.cancelDeadlineHours = cancelDeadlineHours;
            return this;
        }
        
        public Builder enabled(Boolean enabled) {
            dto.enabled = enabled;
            return this;
        }
        
        public Builder tenantId(Long tenantId) {
            dto.tenantId = tenantId;
            return this;
        }
        
        public BookableResourceDTO build() {
            return dto;
        }
    }
}
