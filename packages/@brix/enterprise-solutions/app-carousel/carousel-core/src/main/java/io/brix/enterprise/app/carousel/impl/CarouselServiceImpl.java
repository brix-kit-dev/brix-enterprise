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
 * CarouselService实现类
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.impl;

import io.brix.enterprise.app.carousel.dto.BannerDTO;
import io.brix.enterprise.app.carousel.dto.CarouselDTO;
import io.brix.enterprise.app.carousel.entity.Banner;
import io.brix.enterprise.app.carousel.entity.Carousel;
import io.brix.enterprise.app.carousel.enums.BannerStatus;
import io.brix.enterprise.app.carousel.enums.Platform;
import io.brix.enterprise.app.carousel.repository.BannerRepository;
import io.brix.enterprise.app.carousel.repository.CarouselRepository;
import io.brix.enterprise.app.carousel.service.CarouselService;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.StateStoreCapability;
import io.runtime.sdk.capability.ObservabilityCapability;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 轮播服务实现类
 * 
 * <p>基于Runtime Shell v3.0 Capability Contract模型实现，
 * 通过RuntimeContext访问平台能力。</p>
 */
@Service
public class CarouselServiceImpl implements CarouselService {
    
    private static final String CACHE_PREFIX = "carousel:";
    
    private final RuntimeContext runtimeContext;
    private final CarouselRepository carouselRepository;
    private final BannerRepository bannerRepository;
    
    public CarouselServiceImpl(RuntimeContext runtimeContext,
                               CarouselRepository carouselRepository,
                               BannerRepository bannerRepository) {
        this.runtimeContext = runtimeContext;
        this.carouselRepository = carouselRepository;
        this.bannerRepository = bannerRepository;
    }
    
    /**
     * 获取可观测性能力
     */
    private ObservabilityCapability getLog() {
        return runtimeContext.getObservability();
    }
    
    /**
     * 获取状态存储能力
     */
    private StateStoreCapability getStateStore() {
        return runtimeContext.getStateStore();
    }
    
    // ==================== 展示端接口 ====================
    
    @Override
    public Optional<CarouselDTO> getByCode(String tenantId, String code) {
        String cacheKey = buildCacheKey(tenantId, code);
        
        // 尝试从缓存获取
        StateStoreCapability stateStore = getStateStore();
        Optional<CarouselDTO> cached = stateStore.get(cacheKey, CarouselDTO.class);
        if (cached.isPresent()) {
            return cached;
        }
        
        // 从数据库查询
        Optional<CarouselDTO> result = carouselRepository
                .findByTenantIdAndCodeWithBanners(tenantId, code)
                .map(this::toDTO);
        
        // 缓存结果
        result.ifPresent(dto -> stateStore.put(cacheKey, dto));
        
        return result;
    }
    
    @Override
    public Optional<CarouselDTO> getByCodeAndPlatform(String tenantId, String code, Platform platform) {
        // 获取基本轮播位
        Optional<CarouselDTO> carouselOpt = getByCode(tenantId, code);
        
        if (carouselOpt.isEmpty()) {
            return Optional.empty();
        }
        
        // 过滤Banner按平台
        CarouselDTO carousel = carouselOpt.get();
        if (carousel.getBanners() != null) {
            List<BannerDTO> filteredBanners = carousel.getBanners().stream()
                    .filter(b -> b.getPlatform() == Platform.ALL || b.getPlatform() == platform)
                    .collect(Collectors.toList());
            carousel.setBanners(filteredBanners);
        }
        
        return Optional.of(carousel);
    }
    
    @Override
    public List<BannerDTO> getActiveBanners(String tenantId, String carouselCode) {
        return getActiveBanners(tenantId, carouselCode, Platform.ALL);
    }
    
    @Override
    public List<BannerDTO> getActiveBanners(String tenantId, String carouselCode, Platform platform) {
        // 查询轮播位
        Carousel carousel = carouselRepository.findByTenantIdAndCode(tenantId, carouselCode)
                .orElse(null);
        
        if (carousel == null || !Boolean.TRUE.equals(carousel.getEnabled())) {
            return List.of();
        }
        
        // 查询有效Banner
        List<Banner> banners = bannerRepository.findActiveBanners(
                tenantId, 
                carousel.getId(), 
                BannerStatus.ENABLED,
                LocalDateTime.now(),
                platform
        );
        
        return banners.stream()
                .map(this::toBannerDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void recordClick(Long bannerId, String userId, Platform platform) {
        bannerRepository.incrementClickCount(bannerId);
        getLog().debug("记录Banner点击: bannerId={}, userId={}, platform={}", bannerId, userId, platform);
    }
    
    @Override
    @Transactional
    public void recordView(List<Long> bannerIds) {
        if (bannerIds != null && !bannerIds.isEmpty()) {
            bannerRepository.incrementViewCounts(bannerIds);
            getLog().debug("批量记录Banner展示: count={}", bannerIds.size());
        }
    }
    
    // ==================== 管理端接口 ====================
    
    @Override
    @Transactional
    public CarouselDTO createCarousel(String tenantId, CarouselDTO dto) {
        // 检查编码唯一性
        if (carouselRepository.existsByTenantIdAndCode(tenantId, dto.getCode())) {
            throw new IllegalArgumentException("轮播位编码已存在: " + dto.getCode());
        }
        
        Carousel carousel = Carousel.builder()
                .tenantId(tenantId)
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .position(dto.getPosition())
                .enabled(dto.getEnabled() != null ? dto.getEnabled() : true)
                .autoPlayInterval(dto.getAutoPlayInterval())
                .showIndicator(dto.getShowIndicator())
                .showNavigation(dto.getShowNavigation())
                .build();
        
        carousel = carouselRepository.save(carousel);
        getLog().info("创建轮播位: {} - {}", carousel.getCode(), carousel.getName());
        
        return toDTO(carousel);
    }
    
    @Override
    @Transactional
    public CarouselDTO updateCarousel(Long id, CarouselDTO dto) {
        Carousel carousel = carouselRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("轮播位不存在: " + id));
        
        // 检查编码唯一性
        if (dto.getCode() != null && !dto.getCode().equals(carousel.getCode())) {
            if (carouselRepository.existsByTenantIdAndCodeExcluding(carousel.getTenantId(), dto.getCode(), id)) {
                throw new IllegalArgumentException("轮播位编码已存在: " + dto.getCode());
            }
            carousel.setCode(dto.getCode());
        }
        
        if (dto.getName() != null) {
            carousel.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            carousel.setDescription(dto.getDescription());
        }
        if (dto.getPosition() != null) {
            carousel.setPosition(dto.getPosition());
        }
        if (dto.getEnabled() != null) {
            carousel.setEnabled(dto.getEnabled());
        }
        if (dto.getAutoPlayInterval() != null) {
            carousel.setAutoPlayInterval(dto.getAutoPlayInterval());
        }
        if (dto.getShowIndicator() != null) {
            carousel.setShowIndicator(dto.getShowIndicator());
        }
        if (dto.getShowNavigation() != null) {
            carousel.setShowNavigation(dto.getShowNavigation());
        }
        
        carousel = carouselRepository.save(carousel);
        
        // 清除缓存
        invalidateCache(carousel.getTenantId(), carousel.getCode());
        
        getLog().info("更新轮播位: {}", carousel.getCode());
        return toDTO(carousel);
    }
    
    @Override
    @Transactional
    public void deleteCarousel(Long id) {
        Carousel carousel = carouselRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("轮播位不存在: " + id));
        
        // 删除所有Banner
        bannerRepository.deleteByCarouselId(id);
        
        // 删除轮播位
        carouselRepository.delete(carousel);
        
        // 清除缓存
        invalidateCache(carousel.getTenantId(), carousel.getCode());
        
        getLog().info("删除轮播位: {}", carousel.getCode());
    }
    
    @Override
    @Transactional
    public BannerDTO createBanner(String tenantId, Long carouselId, BannerDTO dto) {
        Carousel carousel = carouselRepository.findById(carouselId)
                .orElseThrow(() -> new IllegalArgumentException("轮播位不存在: " + carouselId));
        
        if (!carousel.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("无权操作此轮播位");
        }
        
        Banner banner = Banner.builder()
                .carousel(carousel)
                .tenantId(tenantId)
                .title(dto.getTitle())
                .subtitle(dto.getSubtitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .imageUrlMobile(dto.getImageUrlMobile())
                .thumbnailUrl(dto.getThumbnailUrl())
                .platform(dto.getPlatform() != null ? dto.getPlatform() : Platform.ALL)
                .status(BannerStatus.DRAFT)
                .actionType(dto.getActionType())
                .actionValue(dto.getActionValue())
                .actionValueApp(dto.getActionValueApp())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .clickCount(0L)
                .viewCount(0L)
                .build();
        
        banner = bannerRepository.save(banner);
        
        // 清除缓存
        invalidateCache(tenantId, carousel.getCode());
        
        getLog().info("添加Banner到轮播位: {} - {}", carousel.getCode(), banner.getTitle());
        return toBannerDTO(banner);
    }
    
    @Override
    @Transactional
    public BannerDTO updateBanner(Long id, BannerDTO dto) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Banner不存在: " + id));
        
        if (dto.getTitle() != null) banner.setTitle(dto.getTitle());
        if (dto.getSubtitle() != null) banner.setSubtitle(dto.getSubtitle());
        if (dto.getDescription() != null) banner.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) banner.setImageUrl(dto.getImageUrl());
        if (dto.getImageUrlMobile() != null) banner.setImageUrlMobile(dto.getImageUrlMobile());
        if (dto.getThumbnailUrl() != null) banner.setThumbnailUrl(dto.getThumbnailUrl());
        if (dto.getPlatform() != null) banner.setPlatform(dto.getPlatform());
        if (dto.getActionType() != null) banner.setActionType(dto.getActionType());
        if (dto.getActionValue() != null) banner.setActionValue(dto.getActionValue());
        if (dto.getActionValueApp() != null) banner.setActionValueApp(dto.getActionValueApp());
        if (dto.getSortOrder() != null) banner.setSortOrder(dto.getSortOrder());
        if (dto.getStartTime() != null) banner.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) banner.setEndTime(dto.getEndTime());
        
        banner = bannerRepository.save(banner);
        
        // 清除缓存
        invalidateCache(banner.getTenantId(), banner.getCarousel().getCode());
        
        getLog().info("更新Banner: {}", banner.getTitle());
        return toBannerDTO(banner);
    }
    
    @Override
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Banner不存在: " + id));
        
        String tenantId = banner.getTenantId();
        String carouselCode = banner.getCarousel().getCode();
        
        bannerRepository.delete(banner);
        
        // 清除缓存
        invalidateCache(tenantId, carouselCode);
        
        getLog().info("删除Banner: {}", banner.getTitle());
    }
    
    @Override
    @Transactional
    public void toggleBannerStatus(Long id, boolean enabled) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Banner不存在: " + id));
        
        banner.setStatus(enabled ? BannerStatus.ENABLED : BannerStatus.DISABLED);
        bannerRepository.save(banner);
        
        // 清除缓存
        invalidateCache(banner.getTenantId(), banner.getCarousel().getCode());
        
        getLog().info("Banner状态变更: {} -> {}", banner.getTitle(), enabled ? "启用" : "禁用");
    }
    
    @Override
    public void refreshCache(String carouselCode) {
        if (carouselCode != null) {
            // 刷新指定轮播位缓存
            // 由于没有租户上下文，这里只能记录日志
            getLog().info("刷新轮播位缓存: {}", carouselCode);
        } else {
            // 刷新所有缓存
            getLog().info("刷新所有轮播位缓存");
        }
    }
    
    /**
     * 构建缓存Key
     */
    private String buildCacheKey(String tenantId, String code) {
        return CACHE_PREFIX + tenantId + ":" + code;
    }
    
    /**
     * 清除缓存
     */
    private void invalidateCache(String tenantId, String code) {
        getStateStore().remove(buildCacheKey(tenantId, code));
    }
    
    /**
     * Carousel实体转DTO
     */
    private CarouselDTO toDTO(Carousel entity) {
        List<BannerDTO> banners = entity.getBanners() != null 
                ? entity.getBanners().stream().map(this::toBannerDTO).collect(Collectors.toList())
                : List.of();
        
        return CarouselDTO.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .position(entity.getPosition())
                .enabled(entity.getEnabled())
                .autoPlayInterval(entity.getAutoPlayInterval())
                .showIndicator(entity.getShowIndicator())
                .showNavigation(entity.getShowNavigation())
                .banners(banners)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
    
    /**
     * Banner实体转DTO
     */
    private BannerDTO toBannerDTO(Banner entity) {
        return BannerDTO.builder()
                .id(entity.getId())
                .carouselId(entity.getCarousel().getId())
                .title(entity.getTitle())
                .subtitle(entity.getSubtitle())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .imageUrlMobile(entity.getImageUrlMobile())
                .thumbnailUrl(entity.getThumbnailUrl())
                .platform(entity.getPlatform())
                .status(entity.getStatus())
                .actionType(entity.getActionType())
                .actionValue(entity.getActionValue())
                .actionValueApp(entity.getActionValueApp())
                .sortOrder(entity.getSortOrder())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .clickCount(entity.getClickCount())
                .viewCount(entity.getViewCount())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
