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
 * Carousel模块自动配置
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.carousel.config;

import io.brix.enterprise.app.carousel.impl.CarouselServiceImpl;
import io.brix.enterprise.app.carousel.repository.BannerRepository;
import io.brix.enterprise.app.carousel.repository.CarouselRepository;
import io.brix.enterprise.app.carousel.service.CarouselService;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Carousel模块自动配置类
 * 
 * <p>基于Spring Boot自动配置机制，在应用启动时自动注册Carousel模块的相关组件。</p>
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "io.brix.enterprise.app.carousel.controller"
})
@EntityScan(basePackages = "io.brix.enterprise.app.carousel.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.carousel.repository")
public class CarouselAutoConfiguration {
    
    /**
     * 注册CarouselService
     * 
     * @param runtimeContext 运行时上下文
     * @param carouselRepository 轮播位仓储
     * @param bannerRepository Banner仓储
     * @return CarouselService实例
     */
    @Bean
    @ConditionalOnMissingBean
    public CarouselService carouselService(RuntimeContext runtimeContext,
                                           CarouselRepository carouselRepository,
                                           BannerRepository bannerRepository) {
        return new CarouselServiceImpl(runtimeContext, carouselRepository, bannerRepository);
    }
}
