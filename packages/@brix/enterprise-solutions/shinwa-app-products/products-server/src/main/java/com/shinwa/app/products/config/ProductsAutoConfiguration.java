package com.shinwa.app.products.config;

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
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "com.shinwa.app.products.controller",
    "com.shinwa.app.products.service"
})
@EntityScan(basePackages = "com.shinwa.app.products.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.products.repository")
public class ProductsAutoConfiguration {

    /**
     * 构造函数
     * 打印加载日志
     */
    public ProductsAutoConfiguration() {
        System.out.println("[Products] 产品模块自动配置已加载 - v3.0");
    }
}
