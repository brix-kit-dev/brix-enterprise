/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.dto;

import com.shinwa.app.booking.enums.BookingStatus;
import com.shinwa.app.booking.enums.ResourceType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 预约信息数据传输对象
 * 
 * <p>用于在服务层和展示层之间传递预约信息，包含预约的所有核心字段。</p>
 * 
 * <h3>使用场景</h3>
 * <ul>
 *   <li>预约详情查询响应</li>
 *   <li>预约列表查询响应</li>
 *   <li>预约创建/修改后的返回值</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Schema(name = "BookingDTO", description = "预约信息数据传输对象")
public class BookingDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // ==================== 基础信息 ====================
    
    /**
     * 预约ID
     */
    @Schema(description = "预约唯一标识", example = "1001", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;
    
    /**
     * 预约编号
     * <p>系统生成的唯一预约标识，格式如: BK20260121001</p>
     */
    @Schema(description = "预约编号，系统自动生成", example = "BK20260214001", accessMode = Schema.AccessMode.READ_ONLY)
    private String bookingNo;
    
    // ==================== 资源信息 ====================
    
    /**
     * 资源ID
     */
    @Schema(description = "可预约资源ID", example = "100", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long resourceId;
    
    /**
     * 资源类型
     */
    @Schema(description = "资源类型", example = "ROOM", requiredMode = Schema.RequiredMode.REQUIRED)
    private ResourceType resourceType;
    
    /**
     * 资源名称
     * <p>冗余存储，用于展示</p>
     */
    @Schema(description = "资源名称（冗余存储）", example = "会议室A")
    private String resourceName;
    
    // ==================== 时间信息 ====================
    
    /**
     * 预约日期
     */
    @Schema(description = "预约日期", example = "2026-02-14", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDate bookedDate;
    
    /**
     * 开始时间
     */
    @Schema(description = "开始时间", example = "09:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalTime startTime;
    
    /**
     * 结束时间
     */
    @Schema(description = "结束时间", example = "10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalTime endTime;
    
    // ==================== 预约人信息 ====================
    
    /**
     * 预约人ID
     */
    @Schema(description = "预约人用户ID", example = "2001")
    private Long userId;
    
    /**
     * 联系人姓名
     */
    @Schema(description = "联系人姓名", example = "张三")
    private String contactName;
    
    /**
     * 联系电话
     */
    @Schema(description = "联系电话", example = "13800138000")
    private String contactPhone;
    
    // ==================== 状态信息 ====================
    
    /**
     * 预约状态
     */
    @Schema(description = "预约状态", example = "PENDING", allowableValues = {"PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"})
    private BookingStatus status;
    
    // ==================== 来源追溯 ====================
    
    /**
     * 来源类型
     * <p>关联的业务类型，如: CASE（案件）、SERVICE_PACKAGE（服务包）、CONSULT（咨询）、DIRECT（直接预约）</p>
     */
    @Schema(description = "来源业务类型", example = "CASE", allowableValues = {"CASE", "SERVICE_PACKAGE", "CONSULT", "DIRECT"})
    private String sourceType;
    
    /**
     * 来源业务ID
     * <p>关联的业务单据ID</p>
     */
    @Schema(description = "来源业务单据ID", example = "3001")
    private Long sourceId;
    
    // ==================== 其他信息 ====================
    
    /**
     * 备注
     */
    @Schema(description = "预约备注信息", example = "请提前10分钟到达")
    private String remark;
    
    /**
     * 取消原因
     */
    @Schema(description = "取消原因", example = "用户主动取消", accessMode = Schema.AccessMode.READ_ONLY)
    private String cancelReason;
    
    /**
     * 取消时间
     */
    @Schema(description = "取消时间", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime cancelledAt;
    
    /**
     * 确认时间
     */
    @Schema(description = "确认时间", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime confirmedAt;
    
    /**
     * 完成时间
     */
    @Schema(description = "完成时间", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime completedAt;
    
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
    public BookingDTO() {
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
     * BookingDTO 构建器
     */
    public static class Builder {
        private final BookingDTO dto = new BookingDTO();
        
        public Builder id(Long id) {
            dto.id = id;
            return this;
        }
        
        public Builder bookingNo(String bookingNo) {
            dto.bookingNo = bookingNo;
            return this;
        }
        
        public Builder resourceId(Long resourceId) {
            dto.resourceId = resourceId;
            return this;
        }
        
        public Builder resourceType(ResourceType resourceType) {
            dto.resourceType = resourceType;
            return this;
        }
        
        public Builder resourceName(String resourceName) {
            dto.resourceName = resourceName;
            return this;
        }
        
        public Builder bookedDate(LocalDate bookedDate) {
            dto.bookedDate = bookedDate;
            return this;
        }
        
        public Builder startTime(LocalTime startTime) {
            dto.startTime = startTime;
            return this;
        }
        
        public Builder endTime(LocalTime endTime) {
            dto.endTime = endTime;
            return this;
        }
        
        public Builder userId(Long userId) {
            dto.userId = userId;
            return this;
        }
        
        public Builder contactName(String contactName) {
            dto.contactName = contactName;
            return this;
        }
        
        public Builder contactPhone(String contactPhone) {
            dto.contactPhone = contactPhone;
            return this;
        }
        
        public Builder status(BookingStatus status) {
            dto.status = status;
            return this;
        }
        
        public Builder sourceType(String sourceType) {
            dto.sourceType = sourceType;
            return this;
        }
        
        public Builder sourceId(Long sourceId) {
            dto.sourceId = sourceId;
            return this;
        }
        
        public Builder remark(String remark) {
            dto.remark = remark;
            return this;
        }
        
        public Builder tenantId(Long tenantId) {
            dto.tenantId = tenantId;
            return this;
        }
        
        public Builder createdAt(LocalDateTime createdAt) {
            dto.createdAt = createdAt;
            return this;
        }
        
        public Builder updatedAt(LocalDateTime updatedAt) {
            dto.updatedAt = updatedAt;
            return this;
        }
        
        public BookingDTO build() {
            return dto;
        }
    }
}
