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
 * 平台类型枚举
 * 
 * <p>定义Banner和轮播位的目标平台
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.enums;

/**
 * 平台类型枚举
 */
public enum Platform {
    
    /** 全平台通用 */
    ALL("全平台"),
    
    /** Web端（PC浏览器） */
    WEB("Web端"),
    
    /** 移动端H5 */
    H5("H5"),
    
    /** iOS App */
    IOS("iOS"),
    
    /** Android App */
    ANDROID("Android"),
    
    /** 小程序 */
    MINI_PROGRAM("小程序");
    
    private final String displayName;
    
    Platform(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
