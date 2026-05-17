/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.booking.request;

import io.brix.enterprise.app.booking.enums.ResourceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 创建预约请求
 * 
 * <p>用于创建新预约的请求参数对象，包含所有必要的预约信息。
 * 支持关联业务单据（如案件、服务包）的预约创建。</p>
 * 
 * <h3>校验规则</h3>
 * <ul>
 *   <li>资源ID、资源类型必填</li>
 *   <li>预约日期必须是未来日期</li>
 *   <li>开始时间、结束时间必填</li>
 *   <li>预约人ID必填</li>
 * </ul>
 * 
 * <h3>业务关联</h3>
 * <p>通过 {@code sourceType} 和 {@code sourceId} 可以关联创建预约的业务来源：</p>
 * <ul>
 *   <li>CASE: 案件预约</li>
 *   <li>SERVICE_PACKAGE: 服务包预约</li>
 *   <li>CONSULT: 咨询预约</li>
 *   <li>DIRECT: 直接预约（无关联业务）</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(name = "CreateBookingRequest", description = "创建预约请求对象")
public class CreateBookingRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // ==================== 资源信息 ====================
    
    /**
     * 资源ID
     * <p>要预约的可预约资源ID</p>
     */
    @Schema(description = "可预约资源ID", example = "100", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "资源ID不能为空")
    private Long resourceId;
    
    /**
     * 资源类型
     * <p>用于校验和快速分类</p>
     */
    @Schema(description = "资源类型", example = "ROOM", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "资源类型不能为空")
    private ResourceType resourceType;
    
    // ==================== 时间信息 ====================
    
    /**
     * 预约日期
     */
    @Schema(description = "预约日期（必须是未来日期）", example = "2026-02-20", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "预约日期不能为空")
    @Future(message = "预约日期必须是未来日期")
    private LocalDate bookedDate;
    
    /**
     * 开始时间
     */
    @Schema(description = "开始时间", example = "09:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "开始时间不能为空")
    private LocalTime startTime;
    
    /**
     * 结束时间
     */
    @Schema(description = "结束时间", example = "10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "结束时间不能为空")
    private LocalTime endTime;
    
    // ==================== 预约人信息 ====================
    
    /**
     * 预约人ID
     */
    @Schema(description = "预约人用户ID", example = "2001", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "预约人ID不能为空")
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
    
    // ==================== 来源追溯 ====================
    
    /**
     * 来源类型
     * <p>关联的业务类型，如: CASE、SERVICE_PACKAGE、CONSULT、DIRECT</p>
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
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public CreateBookingRequest() {
    }
    
    // ==================== Getters & Setters ====================
    
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
}
