/**
 * 平台类型枚举
 * 
 * <p>定义Banner和轮播位的目标平台
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.enums;

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
