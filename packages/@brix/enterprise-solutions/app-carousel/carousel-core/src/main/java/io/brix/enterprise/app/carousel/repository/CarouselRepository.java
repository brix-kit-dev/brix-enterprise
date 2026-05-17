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
 * Carousel仓储接口
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.repository;

import io.brix.enterprise.app.carousel.entity.Carousel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 轮播位仓储接口
 */
@Repository
public interface CarouselRepository extends JpaRepository<Carousel, Long> {
    
    /**
     * 根据租户ID和编码查询
     * 
     * @param tenantId 租户ID
     * @param code 轮播位编码
     * @return 轮播位
     */
    Optional<Carousel> findByTenantIdAndCode(String tenantId, String code);
    
    /**
     * 根据租户ID查询所有轮播位
     * 
     * @param tenantId 租户ID
     * @return 轮播位列表
     */
    List<Carousel> findByTenantId(String tenantId);
    
    /**
     * 根据租户ID和启用状态查询
     * 
     * @param tenantId 租户ID
     * @param enabled 是否启用
     * @return 轮播位列表
     */
    List<Carousel> findByTenantIdAndEnabled(String tenantId, boolean enabled);
    
    /**
     * 检查编码是否存在
     * 
     * @param tenantId 租户ID
     * @param code 编码
     * @return 是否存在
     */
    boolean existsByTenantIdAndCode(String tenantId, String code);
    
    /**
     * 检查编码是否存在（排除指定ID）
     * 
     * @param tenantId 租户ID
     * @param code 编码
     * @param excludeId 排除的ID
     * @return 是否存在
     */
    @Query("SELECT COUNT(c) > 0 FROM Carousel c WHERE c.tenantId = :tenantId AND c.code = :code AND c.id <> :excludeId")
    boolean existsByTenantIdAndCodeExcluding(@Param("tenantId") String tenantId, 
                                             @Param("code") String code, 
                                             @Param("excludeId") Long excludeId);
    
    /**
     * 查询带有Banner的轮播位
     * 
     * @param tenantId 租户ID
     * @param code 编码
     * @return 轮播位
     */
    @Query("SELECT c FROM Carousel c LEFT JOIN FETCH c.banners WHERE c.tenantId = :tenantId AND c.code = :code")
    Optional<Carousel> findByTenantIdAndCodeWithBanners(@Param("tenantId") String tenantId, @Param("code") String code);
}
