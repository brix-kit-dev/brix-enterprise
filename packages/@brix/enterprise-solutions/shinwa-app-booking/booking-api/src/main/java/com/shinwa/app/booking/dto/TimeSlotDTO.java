/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 时间槽数据传输对象
 * 
 * <p>用于表示某个资源在特定日期的可预约时间段信息。
 * 时间槽由时间槽模板根据日期动态生成，并结合已有预约计算剩余可预约数量。</p>
 * 
 * <h3>时间槽ID格式</h3>
 * <p>时间槽ID为动态生成，格式: {@code resourceId_date_startTime}</p>
 * <p>示例: {@code 123_2026-01-28_09:00}</p>
 * 
 * <h3>可用性判断</h3>
 * <p>时间槽的可用性由以下条件共同决定：</p>
 * <ul>
 *   <li>时间槽未过期（结束时间在当前时间之后）</li>
 *   <li>剩余可预约数大于0</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Schema(name = "TimeSlotDTO", description = "时间槽信息，表示某个资源在特定日期的可预约时间段")
public class TimeSlotDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // ==================== 基础信息 ====================
    
    /**
     * 时间槽ID
     * <p>动态生成的ID，格式: resourceId_date_startTime</p>
     */
    @Schema(description = "时间槽唯一标识", example = "100_2026-02-14_09:00")
    private String slotId;
    
    /**
     * 资源ID
     */
    @Schema(description = "关联的可预约资源ID", example = "100")
    private Long resourceId;
    
    /**
     * 日期
     */
    @Schema(description = "时间槽日期", example = "2026-02-14")
    private LocalDate date;
    
    /**
     * 开始时间
     */
    @Schema(description = "开始时间", example = "09:00:00")
    private LocalTime startTime;
    
    /**
     * 结束时间
     */
    @Schema(description = "结束时间", example = "10:00:00")
    private LocalTime endTime;
    
    // ==================== 容量信息 ====================
    
    /**
     * 最大预约数
     */
    @Schema(description = "最大可预约数量", example = "5")
    private Integer maxBookings;
    
    /**
     * 已预约数
     */
    @Schema(description = "已预约数量", example = "2")
    private Integer bookedCount;
    
    /**
     * 剩余可预约数
     */
    @Schema(description = "剩余可预约数量", example = "3")
    private Integer availableCount;
    
    // ==================== 状态信息 ====================
    
    /**
     * 是否可用
     * <p>根据剩余可预约数和时间判断</p>
     */
    @Schema(description = "是否可预约", example = "true")
    private Boolean available;
    
    /**
     * 是否已过期
     * <p>时间槽的结束时间是否已过</p>
     */
    @Schema(description = "是否已过期", example = "false")
    private Boolean expired;
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public TimeSlotDTO() {
    }
    
    // ==================== Getters & Setters ====================
    
    public String getSlotId() {
        return slotId;
    }
    
    public void setSlotId(String slotId) {
        this.slotId = slotId;
    }
    
    public Long getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
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
    
    public Integer getMaxBookings() {
        return maxBookings;
    }
    
    public void setMaxBookings(Integer maxBookings) {
        this.maxBookings = maxBookings;
    }
    
    public Integer getBookedCount() {
        return bookedCount;
    }
    
    public void setBookedCount(Integer bookedCount) {
        this.bookedCount = bookedCount;
    }
    
    public Integer getAvailableCount() {
        return availableCount;
    }
    
    public void setAvailableCount(Integer availableCount) {
        this.availableCount = availableCount;
    }
    
    public Boolean getAvailable() {
        return available;
    }
    
    public void setAvailable(Boolean available) {
        this.available = available;
    }
    
    public Boolean getExpired() {
        return expired;
    }
    
    public void setExpired(Boolean expired) {
        this.expired = expired;
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
     * TimeSlotDTO 构建器
     */
    public static class Builder {
        private final TimeSlotDTO dto = new TimeSlotDTO();
        
        public Builder slotId(String slotId) {
            dto.slotId = slotId;
            return this;
        }
        
        public Builder resourceId(Long resourceId) {
            dto.resourceId = resourceId;
            return this;
        }
        
        public Builder date(LocalDate date) {
            dto.date = date;
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
        
        public Builder maxBookings(Integer maxBookings) {
            dto.maxBookings = maxBookings;
            return this;
        }
        
        public Builder bookedCount(Integer bookedCount) {
            dto.bookedCount = bookedCount;
            return this;
        }
        
        public Builder availableCount(Integer availableCount) {
            dto.availableCount = availableCount;
            return this;
        }
        
        public Builder available(Boolean available) {
            dto.available = available;
            return this;
        }
        
        public Builder expired(Boolean expired) {
            dto.expired = expired;
            return this;
        }
        
        public TimeSlotDTO build() {
            return dto;
        }
    }
}
