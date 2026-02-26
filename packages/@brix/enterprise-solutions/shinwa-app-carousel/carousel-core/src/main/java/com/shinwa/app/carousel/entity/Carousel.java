/**
 * 轮播位实体类
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 轮播位实体
 */
@Entity
@Table(name = "carousel", indexes = {
    @Index(name = "idx_carousel_code", columnList = "code"),
    @Index(name = "idx_carousel_tenant", columnList = "tenantId")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Carousel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** 租户ID */
    @Column(nullable = false, length = 64)
    private String tenantId;
    
    /** 轮播位编码 */
    @Column(nullable = false, length = 64)
    private String code;
    
    /** 轮播位名称 */
    @Column(nullable = false, length = 128)
    private String name;
    
    /** 描述 */
    @Column(length = 512)
    private String description;
    
    /** 位置标识 */
    @Column(length = 64)
    private String position;
    
    /** 是否启用 */
    @Column(nullable = false)
    private Boolean enabled = true;
    
    /** 自动轮播间隔（毫秒） */
    private Integer autoPlayInterval;
    
    /** 是否显示指示器 */
    private Boolean showIndicator = true;
    
    /** 是否显示导航箭头 */
    private Boolean showNavigation = true;
    
    /** Banner列表 */
    @OneToMany(mappedBy = "carousel", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<Banner> banners = new ArrayList<>();
    
    /** 创建时间 */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /** 更新时间 */
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
