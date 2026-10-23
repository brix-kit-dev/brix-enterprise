/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

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
 *   <li>实体扫描：扫描 entity 包下的 JPA 实体（只含本模块自有的 identity_* 表）</li>
 * </ul>
 *
 * <p>本模块不映射 platform-auth 的 auth_* 表，也不提供登录、用户凭证管理或 Token 签发；
 * 这些由平台身份 Owner 负责。</p>
 *
 * <h3>使用方式</h3>
 * <p>在 Host 的 pom.xml 中添加 identity-server 依赖即可，
 * Spring Boot 会自动发现并加载此配置。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = "io.brix.enterprise.app.identity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.identity.repository")
@EntityScan(basePackages = "io.brix.enterprise.app.identity.entity")
public class IdentityAutoConfiguration {

    /**
     * 默认构造函数
     * <p>Spring Boot 自动配置不需要额外的 Bean 定义</p>
     */
    public IdentityAutoConfiguration() {
        // 自动配置类，无需额外初始化
    }
}
