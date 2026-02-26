/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.booking.config;

import com.shinwa.app.booking.repository.BookableResourceRepository;
import com.shinwa.app.booking.repository.BookingRepository;
import com.shinwa.app.booking.repository.TimeSlotTemplateRepository;
import com.shinwa.app.booking.service.BookingService;
import com.shinwa.app.booking.service.impl.BookingServiceImpl;
import com.shinwa.app.booking.service.support.BookingServiceSupport;
import com.shinwa.app.booking.service.support.TimeSlotCalculator;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 预约模块自动配置
 * 
 * <p>Spring Boot 自动配置类，用于自动装配预约模块的各项组件。</p>
 * 
 * <h3>自动配置内容</h3>
 * <ul>
 *   <li>JPA 实体扫描：扫描 {@code com.shinwa.app.booking.entity} 包</li>
 *   <li>JPA 仓库扫描：扫描 {@code com.shinwa.app.booking.repository} 包</li>
 *   <li>组件扫描：扫描 {@code com.shinwa.app.booking} 包（包括 Controller）</li>
 *   <li>服务 Bean：注册 {@link BookingService} 实现</li>
 * </ul>
 * 
 * <h3>使用方式</h3>
 * <p>引入 booking-server 依赖后自动生效，无需手动配置。</p>
 * 
 * <h3>条件装配</h3>
 * <p>使用 {@code @ConditionalOnMissingBean} 允许自定义实现覆盖默认配置</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.shinwa.app.booking")
@EntityScan(basePackages = "com.shinwa.app.booking.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.booking.repository")
public class BookingAutoConfiguration {
    
    /**
     * Registers the time slot calculator bean.
     * 
     * <p>时间槽计算器：负责根据模板和规则计算可用时间槽</p>
     *
     * @param runtimeContext           the runtime context for observability
     * @param resourceRepository       the bookable resource repository
     * @param bookingRepository        the booking repository
     * @param timeSlotTemplateRepository the time slot template repository
     * @return the time slot calculator instance
     */
    @Bean
    @ConditionalOnMissingBean(TimeSlotCalculator.class)
    public TimeSlotCalculator timeSlotCalculator(
            RuntimeContext runtimeContext,
            BookableResourceRepository resourceRepository,
            BookingRepository bookingRepository,
            TimeSlotTemplateRepository timeSlotTemplateRepository) {
        return new TimeSlotCalculator(
                runtimeContext,
                resourceRepository,
                bookingRepository,
                timeSlotTemplateRepository
        );
    }
    
    /**
     * Registers the booking service support bean.
     * 
     * <p>预约服务支持类：提供通用辅助方法（缓存失效、DTO转换、用户上下文获取等）</p>
     *
     * @param runtimeContext  the runtime context for capability access
     * @param bookingRepository the booking repository
     * @return the booking service support instance
     */
    @Bean
    @ConditionalOnMissingBean(BookingServiceSupport.class)
    public BookingServiceSupport bookingServiceSupport(
            RuntimeContext runtimeContext,
            BookingRepository bookingRepository) {
        return new BookingServiceSupport(runtimeContext, bookingRepository);
    }
    
    /**
     * Registers the booking service bean.
     * 
     * <p>仅在容器中没有 {@link BookingService} 实现时注册默认实现</p>
     *
     * @param runtimeContext           the runtime context (provided by Runtime Shell)
     * @param bookingRepository        the booking repository
     * @param resourceRepository       the bookable resource repository
     * @param timeSlotCalculator       the time slot calculator for availability computation
     * @param support                  the booking service support for utility operations
     * @return the booking service implementation
     */
    @Bean
    @ConditionalOnMissingBean(BookingService.class)
    public BookingService bookingService(RuntimeContext runtimeContext,
                                          BookingRepository bookingRepository,
                                          BookableResourceRepository resourceRepository,
                                          TimeSlotCalculator timeSlotCalculator,
                                          BookingServiceSupport support) {
        return new BookingServiceImpl(
                runtimeContext,
                bookingRepository,
                resourceRepository,
                timeSlotCalculator,
                support
        );
    }
}
