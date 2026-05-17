/*
 * Copyright 2026 Brix Platform Authors
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * This software is proprietary to Brix Platform and is protected by
 * copyright laws and international treaty provisions. Unauthorized
 * reproduction or distribution of this software, or any portion of it,
 * may result in severe civil and criminal penalties.
 *
 * Commercial use requires a valid Brix Enterprise license.
 * See LICENSE-ENTERPRISE for terms and conditions.
 */
/**
 * Banner数据传输对象
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.dto;

import io.brix.enterprise.app.carousel.enums.BannerActionType;
import io.brix.enterprise.app.carousel.enums.BannerStatus;
import io.brix.enterprise.app.carousel.enums.Platform;
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
