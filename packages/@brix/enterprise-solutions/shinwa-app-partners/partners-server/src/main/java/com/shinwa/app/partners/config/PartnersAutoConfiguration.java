/*
 * Copyright 2026 Shinwa Solutions
 *
 * 合作伙伴模块自动配置
 */
package com.shinwa.app.partners.config;

import com.shinwa.app.partners.impl.PartnerServiceImpl;
import com.shinwa.app.partners.repository.PartnerRepository;
import com.shinwa.app.partners.service.PartnerService;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 合作伙伴模块自动配置
 *
 * <p>Spring Boot 自动配置类，负责初始化合作伙伴模块的所有组件。</p>
 *
 * <h3>配置内容</h3>
 * <ul>
 *   <li>JPA 实体扫描</li>
 *   <li>Repository 扫描</li>
 *   <li>Service Bean 注册</li>
 *   <li>Controller 组件扫描</li>
 * </ul>
 *
 * @author Shinwa Solutions Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "com.shinwa.app.partners.controller",
    "com.shinwa.app.partners.impl"
})
@EntityScan(basePackages = "com.shinwa.app.partners.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.partners.repository")
public class PartnersAutoConfiguration {

    /**
     * 注册合作伙伴服务 Bean
     *
     * @param partnerRepository 合作伙伴仓储
     * @param runtimeContext    运行时上下文
     * @return 合作伙伴服务实例
     */
    @Bean
    @ConditionalOnMissingBean(PartnerService.class)
    public PartnerService partnerService(PartnerRepository partnerRepository, RuntimeContext runtimeContext) {
        return new PartnerServiceImpl(partnerRepository, runtimeContext);
    }
}
