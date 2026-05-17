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
package io.brix.enterprise.app.solutions.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Identity 模块独立启动类（仅限开发环境调试使用）
 * 
 * <p>[红线 R5 修复] 此类仅在 {@code dev} Profile 下激活，
 * 生产环境由 Host Shell ({@code host-shell-standalone}) 组装启动。</p>
 * 
 * <h3>架构约束</h3>
 * <ul>
 *   <li>插件模块不应声明独立的 {@code @SpringBootApplication} 入口</li>
 *   <li>此类仅为开发者本地调试保留，需通过 {@code --spring.profiles.active=dev} 激活</li>
 *   <li>已移除 {@code excludeName} 对 SecurityAutoConfiguration 的排除</li>
 *   <li>已移除对 {@code io.brix.platform.common} 的跨层扫描</li>
 * </ul>
 * 
 * <h3>启动方式</h3>
 * <pre>
 * java -jar identity-server.jar --spring.profiles.active=dev
 * </pre>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Profile("dev")
@SpringBootApplication
@ComponentScan(
    basePackages = {
        "io.brix.enterprise.app.solutions.identity",
        "io.brix.enterprise.app.identity"
    }
)
@EntityScan(basePackages = {
    "io.brix.enterprise.app.solutions.identity.entity",
    "io.brix.enterprise.app.identity.entity"
})
@EnableJpaRepositories(basePackages = {
    "io.brix.enterprise.app.solutions.identity.repository",
    "io.brix.enterprise.app.identity.repository"
})
public class IdentityApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(IdentityApplication.class, args);
    }
}
