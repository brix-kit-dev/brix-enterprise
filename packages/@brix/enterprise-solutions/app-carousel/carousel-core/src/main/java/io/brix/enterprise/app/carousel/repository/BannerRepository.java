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
 * Banner仓储接口
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.repository;

import io.brix.enterprise.app.carousel.entity.Banner;
import io.brix.enterprise.app.carousel.enums.BannerStatus;
import io.brix.enterprise.app.carousel.enums.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Banner仓储接口
 */
@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    
    /**
     * 根据租户ID和轮播位ID查询
     * 
     * @param tenantId 租户ID
     * @param carouselId 轮播位ID
     * @return Banner列表
     */
    List<Banner> findByTenantIdAndCarouselIdOrderBySortOrderAsc(String tenantId, Long carouselId);
    
    /**
     * 根据租户ID、轮播位ID和状态查询
     * 
     * @param tenantId 租户ID
     * @param carouselId 轮播位ID
     * @param status 状态
     * @return Banner列表
     */
    List<Banner> findByTenantIdAndCarouselIdAndStatusOrderBySortOrderAsc(
            String tenantId, Long carouselId, BannerStatus status);
    
    /**
     * 查询有效的Banner
     * 
     * @param tenantId 租户ID
     * @param carouselId 轮播位ID
     * @param status 状态
     * @param now 当前时间
     * @param platform 平台
     * @return Banner列表
     */
    @Query("""
        SELECT b FROM Banner b 
        WHERE b.tenantId = :tenantId 
          AND b.carousel.id = :carouselId 
          AND b.status = :status
          AND (b.startTime IS NULL OR b.startTime <= :now)
          AND (b.endTime IS NULL OR b.endTime > :now)
          AND (b.platform = :platform OR b.platform = 'ALL')
        ORDER BY b.sortOrder ASC
    """)
    List<Banner> findActiveBanners(@Param("tenantId") String tenantId,
                                   @Param("carouselId") Long carouselId,
                                   @Param("status") BannerStatus status,
                                   @Param("now") LocalDateTime now,
                                   @Param("platform") Platform platform);
    
    /**
     * 查询已过期的Banner
     * 
     * @param now 当前时间
     * @param status 状态
     * @return Banner列表
     */
    @Query("SELECT b FROM Banner b WHERE b.endTime < :now AND b.status = :status")
    List<Banner> findExpiredBanners(@Param("now") LocalDateTime now, @Param("status") BannerStatus status);
    
    /**
     * 增加点击次数
     * 
     * @param id BannerID
     */
    @Modifying
    @Query("UPDATE Banner b SET b.clickCount = b.clickCount + 1 WHERE b.id = :id")
    void incrementClickCount(@Param("id") Long id);
    
    /**
     * 增加展示次数
     * 
     * @param id BannerID
     */
    @Modifying
    @Query("UPDATE Banner b SET b.viewCount = b.viewCount + 1 WHERE b.id = :id")
    void incrementViewCount(@Param("id") Long id);
    
    /**
     * 批量增加展示次数
     * 
     * @param ids BannerID列表
     */
    @Modifying
    @Query("UPDATE Banner b SET b.viewCount = b.viewCount + 1 WHERE b.id IN :ids")
    void incrementViewCounts(@Param("ids") List<Long> ids);
    
    /**
     * 批量更新状态
     * 
     * @param ids BannerID列表
     * @param status 状态
     */
    @Modifying
    @Query("UPDATE Banner b SET b.status = :status, b.updatedAt = :now WHERE b.id IN :ids")
    void updateStatusByIds(@Param("ids") List<Long> ids, 
                          @Param("status") BannerStatus status,
                          @Param("now") LocalDateTime now);
    
    /**
     * 删除轮播位下的所有Banner
     * 
     * @param carouselId 轮播位ID
     */
    @Modifying
    @Query("DELETE FROM Banner b WHERE b.carousel.id = :carouselId")
    void deleteByCarouselId(@Param("carouselId") Long carouselId);
}
