/**
 * Banner实体类
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.entity;

import com.shinwa.app.carousel.enums.BannerActionType;
import com.shinwa.app.carousel.enums.BannerStatus;
import com.shinwa.app.carousel.enums.Platform;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Banner实体
 */
@Entity
@Table(name = "banner", indexes = {
    @Index(name = "idx_banner_carousel", columnList = "carousel_id"),
    @Index(name = "idx_banner_status", columnList = "status"),
    @Index(name = "idx_banner_platform", columnList = "platform")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Banner {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** 所属轮播位 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carousel_id", nullable = false)
    @ToString.Exclude
    private Carousel carousel;
    
    /** 租户ID */
    @Column(nullable = false, length = 64)
    private String tenantId;
    
    /** 标题 */
    @Column(nullable = false, length = 128)
    private String title;
    
    /** 副标题 */
    @Column(length = 256)
    private String subtitle;
    
    /** 描述 */
    @Column(length = 1024)
    private String description;
    
    /** 图片URL（PC/Web端） */
    @Column(length = 512)
    private String imageUrl;
    
    /** 图片URL（移动端） */
    @Column(length = 512)
    private String imageUrlMobile;
    
    /** 缩略图URL */
    @Column(length = 512)
    private String thumbnailUrl;
    
    /** 目标平台 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Platform platform = Platform.ALL;
    
    /** Banner状态 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BannerStatus status = BannerStatus.DRAFT;
    
    /** 点击动作类型 */
    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private BannerActionType actionType = BannerActionType.NONE;
    
    /** 动作值-Web端 */
    @Column(length = 512)
    private String actionValue;
    
    /** 动作值-App端 */
    @Column(length = 512)
    private String actionValueApp;
    
    /** 排序权重 */
    @Column(nullable = false)
    private Integer sortOrder = 0;
    
    /** 生效开始时间 */
    private LocalDateTime startTime;
    
    /** 生效结束时间 */
    private LocalDateTime endTime;
    
    /** 点击次数 */
    @Column(nullable = false)
    private Long clickCount = 0L;
    
    /** 展示次数 */
    @Column(nullable = false)
    private Long viewCount = 0L;
    
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
    
    /**
     * 检查Banner是否有效
     */
    public boolean isActive() {
        if (status != BannerStatus.ENABLED) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (startTime != null && now.isBefore(startTime)) {
            return false;
        }
        if (endTime != null && now.isAfter(endTime)) {
            return false;
        }
        return true;
    }
}
