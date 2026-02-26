/**
 * 轮播服务接口
 * 
 * <p>v3.0 Runtime Shell 架构
 * <p>迁移自: plugin-carousel
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.service;

import com.shinwa.app.carousel.dto.BannerDTO;
import com.shinwa.app.carousel.dto.CarouselDTO;
import com.shinwa.app.carousel.enums.Platform;

import java.util.List;
import java.util.Optional;

/**
 * 轮播服务接口
 * 
 * <p>提供轮播管理的核心业务能力
 */
public interface CarouselService {
    
    // ==================== 展示端接口 ====================
    
    /**
     * 根据编码获取轮播位配置
     * 
     * @param tenantId 租户ID
     * @param code     轮播位编码
     * @return 轮播位配置
     */
    Optional<CarouselDTO> getByCode(String tenantId, String code);
    
    /**
     * 根据编码和平台获取轮播位配置
     * 
     * @param tenantId 租户ID
     * @param code     轮播位编码
     * @param platform 目标平台
     * @return 轮播位配置
     */
    Optional<CarouselDTO> getByCodeAndPlatform(String tenantId, String code, Platform platform);
    
    /**
     * 获取有效的Banner列表
     * 
     * @param tenantId     租户ID
     * @param carouselCode 轮播位编码
     * @return Banner列表
     */
    List<BannerDTO> getActiveBanners(String tenantId, String carouselCode);
    
    /**
     * 获取指定平台的有效Banner列表
     * 
     * @param tenantId     租户ID
     * @param carouselCode 轮播位编码
     * @param platform     目标平台
     * @return Banner列表
     */
    List<BannerDTO> getActiveBanners(String tenantId, String carouselCode, Platform platform);
    
    /**
     * 记录Banner点击
     * 
     * @param bannerId Banner ID
     * @param userId   用户ID
     * @param platform 平台
     */
    void recordClick(Long bannerId, String userId, Platform platform);
    
    /**
     * 记录Banner展示
     * 
     * @param bannerIds Banner ID列表
     */
    void recordView(List<Long> bannerIds);
    
    // ==================== 管理端接口 ====================
    
    /**
     * 创建轮播位
     * 
     * @param tenantId 租户ID
     * @param carousel 轮播位信息
     * @return 创建的轮播位
     */
    CarouselDTO createCarousel(String tenantId, CarouselDTO carousel);
    
    /**
     * 更新轮播位
     * 
     * @param id       轮播位ID
     * @param carousel 更新信息
     * @return 更新后的轮播位
     */
    CarouselDTO updateCarousel(Long id, CarouselDTO carousel);
    
    /**
     * 删除轮播位
     * 
     * @param id 轮播位ID
     */
    void deleteCarousel(Long id);
    
    /**
     * 创建Banner
     * 
     * @param tenantId   租户ID
     * @param carouselId 轮播位ID
     * @param banner     Banner信息
     * @return 创建的Banner
     */
    BannerDTO createBanner(String tenantId, Long carouselId, BannerDTO banner);
    
    /**
     * 更新Banner
     * 
     * @param id     Banner ID
     * @param banner 更新信息
     * @return 更新后的Banner
     */
    BannerDTO updateBanner(Long id, BannerDTO banner);
    
    /**
     * 删除Banner
     * 
     * @param id Banner ID
     */
    void deleteBanner(Long id);
    
    /**
     * 切换Banner状态
     * 
     * @param id      Banner ID
     * @param enabled 是否启用
     */
    void toggleBannerStatus(Long id, boolean enabled);
    
    /**
     * 刷新缓存
     * 
     * @param carouselCode 轮播位编码，null表示刷新全部
     */
    void refreshCache(String carouselCode);
}
