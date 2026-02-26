/**
 * Carousel模块自动配置
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.carousel.config;

import com.shinwa.app.carousel.impl.CarouselServiceImpl;
import com.shinwa.app.carousel.repository.BannerRepository;
import com.shinwa.app.carousel.repository.CarouselRepository;
import com.shinwa.app.carousel.service.CarouselService;
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
    "com.shinwa.app.carousel.controller"
})
@EntityScan(basePackages = "com.shinwa.app.carousel.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.carousel.repository")
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
