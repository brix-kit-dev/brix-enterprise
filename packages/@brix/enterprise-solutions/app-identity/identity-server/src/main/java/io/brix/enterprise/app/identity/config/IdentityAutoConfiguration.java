/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import io.brix.enterprise.app.identity.service.PasswordHasher;
import io.brix.enterprise.app.identity.service.impl.BCryptPasswordHasher;
import io.runtime.sdk.capability.PasswordCapability;

/**
 * Identity 模块自动配置类
 * 
 * <p>当 Host 层引入 identity-server 依赖时，此配置类会被自动扫描，
 * 完成模块的组件扫描、JPA 仓库扫描、实体扫描等配置。</p>
 * 
 * <h3>配置内容</h3>
 * <ul>
 *   <li>组件扫描：扫描 io.brix.enterprise.app.identity 包下的所有组件</li>
 *   <li>JPA 仓库：扫描 repository 包下的仓库接口</li>
 *   <li>实体扫描：扫描 entity 包下的 JPA 实体</li>
 *   <li>密码哈希：D4 起优先委托 {@link PasswordCapability}（Layer 2A），
 *       回退到本地 {@link BCryptPasswordHasher}。</li>
 * </ul>
 * 
 * <h3>使用方式</h3>
 * <p>在 Host 的 pom.xml 中添加 identity-server 依赖即可，
 * Spring Boot 会自动发现并加载此配置。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@AutoConfigureAfter(name = {
        // 松耦合：字符串形式避免硬依赖 platform-auth 模块。
        // 确保 PasswordCapabilityAutoConfiguration 先运行，使 PasswordCapability 可被检测到。
        "io.brix.platform.auth.password.PasswordCapabilityAutoConfiguration"
})
@ComponentScan(basePackages = "io.brix.enterprise.app.identity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.identity.repository")
@EntityScan(basePackages = "io.brix.enterprise.app.identity.entity")
public class IdentityAutoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(IdentityAutoConfiguration.class);

    /**
     * 默认构造函数
     * <p>Spring Boot 自动配置不需要额外的 Bean 定义</p>
     */
    public IdentityAutoConfiguration() {
        // 自动配置类，无需额外初始化
    }

    /**
     * D4：当平台 {@link PasswordCapability} 在 ApplicationContext 中可用时，
     * 注册一个 {@code @Primary} 的 {@link PasswordHasher} 适配器，将插件层的
     * 密码哈希请求转发给 Layer 2A 能力。
     *
     * <p>此 Bean 让 {@code UserServiceImpl} / {@code IdentityDataInitializer} 等
     * 既有消费方无需改动即可使用平台统一的 BCrypt 实现，
     * 同时让旧的 {@link BCryptPasswordHasher} 在生产环境不再被实例化（保留作为离线工具）。</p>
     *
     * @see PasswordCapability
     */
    @Bean
    @Primary
    @ConditionalOnBean(PasswordCapability.class)
    @ConditionalOnMissingBean(name = "passwordCapabilityHasher")
    public PasswordHasher passwordCapabilityHasher(PasswordCapability passwordCapability) {
        log.info("[IdentityAutoConfiguration] PasswordHasher 委托给 PasswordCapability (D4 行为变更)");
        return new PasswordHasher() {
            @Override
            public String hash(String rawPassword) {
                return passwordCapability.hash(rawPassword);
            }

            @Override
            public boolean verify(String rawPassword, String hashedPassword) {
                return passwordCapability.verify(rawPassword, hashedPassword);
            }
        };
    }

    /**
     * 注册密码哈希服务 Bean（回退路径）
     *
     * <p>仅当 {@link PasswordCapability} 不可用（例如纯插件单元测试 / 旧 host）时启用，
     * 提供基于纯 Java BCrypt 的本地实现。生产环境请引入 platform-auth 以使用平台能力。</p>
     *
     * @return BCrypt 密码哈希实现（cost factor = 10）
     * @see BCryptPasswordHasher
     * @see PasswordHasher
     * @deprecated Since 3.2.0 — 仅作为 PasswordCapability 缺失时的兜底；将在 4.0.0 与
     *     {@link BCryptPasswordHasher} 一同移除。
     */
    @Bean
    @ConditionalOnMissingBean(PasswordHasher.class)
    @Deprecated(since = "3.2.0", forRemoval = true)
    @SuppressWarnings("removal")
    public PasswordHasher passwordHasher() {
        log.warn("[IdentityAutoConfiguration] 未发现 PasswordCapability，回退到本地 BCryptPasswordHasher。"
                + "请引入 platform-auth 依赖以获得统一的密码能力。");
        return new BCryptPasswordHasher();
    }
}
