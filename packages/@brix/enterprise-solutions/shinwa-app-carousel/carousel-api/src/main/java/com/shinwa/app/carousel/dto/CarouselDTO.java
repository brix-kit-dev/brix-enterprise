/**
 * 轮播位数据传输对象
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 轮播位数据传输对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarouselDTO {
    
    /** 轮播位ID */
    private Long id;
    
    /** 租户ID */
    private String tenantId;
    
    /** 轮播位编码（唯一标识） */
    private String code;
    
    /** 轮播位名称 */
    private String name;
    
    /** 轮播位描述 */
    private String description;
    
    /** 位置标识 */
    private String position;
    
    /** 是否启用 */
    private Boolean enabled;
    
    /** 自动轮播间隔（毫秒） */
    private Integer autoPlayInterval;
    
    /** 是否显示指示器 */
    private Boolean showIndicator;
    
    /** 是否显示导航箭头 */
    private Boolean showNavigation;
    
    /** Banner列表 */
    private List<BannerDTO> banners;
    
    /** 创建时间 */
    private LocalDateTime createdAt;
    
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
