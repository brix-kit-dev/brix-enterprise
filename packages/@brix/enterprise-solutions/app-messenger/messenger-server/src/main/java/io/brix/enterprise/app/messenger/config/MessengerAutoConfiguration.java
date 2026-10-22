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
 * 消息模块自动配置
 * 
 * v3.0 Runtime Shell 架构
 * Spring Boot 自动配置类
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 消息模块自动配置
 * 
 * <p>v3.0 Runtime Shell 架构的自动配置类。
 * 负责扫描和注册模块内的所有组件。
 * 
 * <p>配置内容：
 * <ul>
 *   <li>实体扫描 - 扫描 messenger.entity 包</li>
 *   <li>仓储扫描 - 扫描 messenger.repository 包</li>
 *   <li>组件扫描 - 扫描控制器和服务</li>
 *   <li>服务Bean - 注册 MessageService</li>
 * </ul>
 * 
 * <p>使用 @AutoConfiguration 注解，支持 Spring Boot 3.x 自动配置机制。
 */
@Slf4j
@AutoConfiguration
@ComponentScan(basePackages = {
    "io.brix.enterprise.app.messenger.controller",
    "io.brix.enterprise.app.messenger.service"
})
@EntityScan(basePackages = "io.brix.enterprise.app.messenger.entity")
@EnableJpaRepositories(basePackages = "io.brix.enterprise.app.messenger.repository")
public class MessengerAutoConfiguration {
    
    /**
     * 配置类构造函数
     * 
     * <p>输出模块加载日志
     */
    public MessengerAutoConfiguration() {
        log.info("========================================");
        log.info("  消息通知模块 (Messenger) 自动配置加载");
        log.info("  版本: 3.0.0-SNAPSHOT");
        log.info("  架构: Runtime Shell v3.0");
        log.info("========================================");
    }
}
