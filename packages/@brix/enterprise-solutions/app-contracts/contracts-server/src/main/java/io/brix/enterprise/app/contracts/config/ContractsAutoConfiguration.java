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
package io.brix.enterprise.app.contracts.config;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 合同模块自动配置
 *
 * <p>配置合同模块所需的Bean和组件扫描：
 * <ul>
 *   <li>组件扫描 - Controller、Service等</li>
 *   <li>实体扫描 - JPA实体</li>
 *   <li>仓储扫描 - Spring Data JPA仓储</li>
 * </ul>
 * 
 * <p><b>【架构说明】</b>RuntimeContext 必须由 Host 层提供，
 * 业务模块不得自行创建 Mock 实现绕过 Runtime Shell。
 * 开发/测试环境应使用 infra-adapter-simple 提供的内存实现。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "io.brix.enterprise.app.contracts.controller",
    "io.brix.enterprise.app.contracts.impl",
    "io.brix.enterprise.app.contracts"  // 包含 ContractsModule
})
@EntityScan(basePackages = "io.brix.enterprise.app.contracts.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.contracts.repository")
public class ContractsAutoConfiguration {

    /**
     * SLF4J logger for the Contracts auto-configuration.
     *
     * <p><b>Why SLF4J instead of {@code System.out}?</b> Architecture red-line R11.1
     * forbids {@code System.out} in production code: it bypasses log level filtering,
     * MDC tenant/trace propagation and structured appenders, which breaks production
     * troubleshooting in multi-tenant deployments. SLF4J is the single sanctioned
     * logging facade across the Brix platform.</p>
     */
    private static final Logger log = LoggerFactory.getLogger(ContractsAutoConfiguration.class);

    /**
     * Default constructor invoked by Spring Boot when the contracts module is
     * loaded as an auto-configuration. Emits a single INFO line confirming load.
     */
    public ContractsAutoConfiguration() {
        log.info("[Contracts] auto-configuration loaded - v3.0");
    }

    /**
     * 配置ObjectMapper
     * <p>支持Java 8日期时间类型序列化
     *
     * @return ObjectMapper实例
     */
    @Bean
    @ConditionalOnMissingBean(ObjectMapper.class)
    public ObjectMapper objectMapper() {
        // Jackson 3 supports Java 8 date/time types natively; keep the Jackson 2 defaults
        return JsonMapper.builder().configureForJackson2().build();
    }
    
    // 【架构约束】RuntimeContext 由 Host 层提供
    // 业务模块不得定义 MockRuntimeContext 绕过 Runtime Shell
    // 开发/测试环境请使用 infra-adapter-simple 模块
}
