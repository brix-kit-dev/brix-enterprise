/**
 * Banner数据传输对象
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.dto;

import com.shinwa.app.carousel.enums.BannerActionType;
import com.shinwa.app.carousel.enums.BannerStatus;
import com.shinwa.app.carousel.enums.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Banner数据传输对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BannerDTO {
    
    /** Banner ID */
    private Long id;
    
    /** 轮播位ID */
    private Long carouselId;
    
    /** 租户ID */
    private String tenantId;
    
    /** 标题 */
    private String title;
    
    /** 副标题 */
    private String subtitle;
    
    /** 描述 */
    private String description;
    
    /** 图片URL（PC/Web端） */
    private String imageUrl;
    
    /** 图片URL（移动端） */
    private String imageUrlMobile;
    
    /** 缩略图URL */
    private String thumbnailUrl;
    
    /** 目标平台 */
    private Platform platform;
    
    /** Banner状态 */
    private BannerStatus status;
    
    /** 点击动作类型 */
    private BannerActionType actionType;
    
    /** 动作值-Web端 */
    private String actionValue;
    
    /** 动作值-App端 */
    private String actionValueApp;
    
    /** 排序权重 */
    private Integer sortOrder;
    
    /** 生效开始时间 */
    private LocalDateTime startTime;
    
    /** 生效结束时间 */
    private LocalDateTime endTime;
    
    /** 点击次数 */
    private Long clickCount;
    
    /** 展示次数 */
    private Long viewCount;
    
    /** 创建时间 */
    private LocalDateTime createdAt;
    
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
