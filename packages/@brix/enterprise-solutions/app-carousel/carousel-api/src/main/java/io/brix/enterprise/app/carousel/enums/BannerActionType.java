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
 * Banner动作类型枚举
 * 
 * <p>定义Banner被点击时的行为类型
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.enums;

/**
 * Banner动作类型枚举
 */
public enum BannerActionType {
    
    /** 无动作 */
    NONE("无动作"),
    
    /** 跳转URL */
    LINK("跳转URL"),
    
    /** 应用内路由 */
    ROUTE("应用内路由"),
    
    /** 弹窗 */
    POPUP("弹窗"),
    
    /** 深度链接 */
    DEEP_LINK("深度链接");
    
    private final String displayName;
    
    BannerActionType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
