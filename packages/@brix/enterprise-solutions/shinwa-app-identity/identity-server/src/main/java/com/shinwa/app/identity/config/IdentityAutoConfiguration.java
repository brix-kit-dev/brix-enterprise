/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.shinwa.app.identity.service.PasswordHasher;
import com.shinwa.app.identity.service.impl.BCryptPasswordHasher;

/**
 * Identity 模块自动配置类
 * 
 * <p>当 Host 层引入 identity-server 依赖时，此配置类会被自动扫描，
 * 完成模块的组件扫描、JPA 仓库扫描、实体扫描等配置。</p>
 * 
 * <h3>配置内容</h3>
 * <ul>
 *   <li>组件扫描：扫描 com.shinwa.app.identity 包下的所有组件</li>
 *   <li>JPA 仓库：扫描 repository 包下的仓库接口</li>
 *   <li>实体扫描：扫描 entity 包下的 JPA 实体</li>
 *   <li>密码哈希：注册 {@link BCryptPasswordHasher} Bean（框架无关的密码加密实现）</li>
 * </ul>
 * 
 * <h3>使用方式</h3>
 * <p>在 Host 的 pom.xml 中添加 identity-server 依赖即可，
 * Spring Boot 会自动发现并加载此配置。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.shinwa.app.identity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.identity.repository")
@EntityScan(basePackages = "com.shinwa.app.identity.entity")
public class IdentityAutoConfiguration {
    
    /**
     * 默认构造函数
     * <p>Spring Boot 自动配置不需要额外的 Bean 定义</p>
     */
    public IdentityAutoConfiguration() {
        // 自动配置类，无需额外初始化
    }

    /**
     * 注册密码哈希服务 Bean
     *
     * <p>提供基于纯 Java BCrypt 实现的 {@link PasswordHasher}，
     * 替代原先 identity-core 对 {@code spring-security-crypto} 的直接依赖。
     * 遵循 v3.0 蓝图约束：插件层不得依赖 Spring 框架库。</p>
     *
     * <p>使用 {@code @ConditionalOnMissingBean} 允许 Host 层或测试环境
     * 提供自定义实现覆盖此默认配置。</p>
     *
     * @return BCrypt 密码哈希实现（cost factor = 10）
     * @see BCryptPasswordHasher
     * @see PasswordHasher
     */
    @Bean
    @ConditionalOnMissingBean(PasswordHasher.class)
    public PasswordHasher passwordHasher() {
        return new BCryptPasswordHasher();
    }
}
