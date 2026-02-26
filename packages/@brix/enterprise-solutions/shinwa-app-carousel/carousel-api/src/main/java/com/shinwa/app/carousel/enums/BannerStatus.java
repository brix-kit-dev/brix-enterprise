/**
 * Banner状态枚举
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.enums;

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
