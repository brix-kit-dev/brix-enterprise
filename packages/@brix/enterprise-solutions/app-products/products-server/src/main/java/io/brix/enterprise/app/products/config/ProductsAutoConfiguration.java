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
package io.brix.enterprise.app.products.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 产品模块自动配置类
 *
 * <p>v3.0 Spring Boot 自动配置，用于：
 * <ul>
 *   <li>扫描组件：Controller、Service</li>
 *   <li>扫描实体：Product</li>
 *   <li>扫描仓储：ProductRepository</li>
 * </ul>
 *
 * <p>配置方式：
 * <ul>
 *   <li>独立运行：通过 @SpringBootApplication 自动加载</li>
 *   <li>嵌入运行：通过 META-INF/spring/AutoConfiguration.imports 注册</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "io.brix.enterprise.app.products.controller",
    "io.brix.enterprise.app.products.service"
})
@EntityScan(basePackages = "io.brix.enterprise.app.products.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.products.repository")
public class ProductsAutoConfiguration {

    /**
     * SLF4J logger for the Products auto-configuration.
     *
     * <p><b>Why SLF4J instead of {@code System.out}?</b> The Brix architecture red-line
     * R11.1 forbids direct calls to {@code System.out} / {@code System.err} from
     * production code so that logging is uniformly governed: all output flows through
     * the configured logging backend (level filtering, MDC enrichment with traceId /
     * tenantId, structured JSON appenders, async I/O). Bypassing SLF4J would silently
     * lose tenant context and trace correlation in multi-tenant deployments.</p>
     */
    private static final Logger log = LoggerFactory.getLogger(ProductsAutoConfiguration.class);

    /**
     * Default constructor invoked by Spring Boot when this auto-configuration is
     * activated via {@code META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}.
     * Emits a single INFO log line so operators can confirm the module was loaded.
     */
    public ProductsAutoConfiguration() {
        log.info("[Products] auto-configuration loaded - v3.0");
    }
}
