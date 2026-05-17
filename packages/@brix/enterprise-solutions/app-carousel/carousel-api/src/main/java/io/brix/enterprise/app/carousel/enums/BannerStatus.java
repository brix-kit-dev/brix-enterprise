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
 * Banner状态枚举
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.enums;

/**
 * Banner状态枚举
 */
public enum BannerStatus {
    
    /** 草稿 */
    DRAFT("草稿"),
    
    /** 已启用 */
    ENABLED("已启用"),
    
    /** 已禁用 */
    DISABLED("已禁用"),
    
    /** 已过期 */
    EXPIRED("已过期");
    
    private final String displayName;
    
    BannerStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
