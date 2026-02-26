/**
 * 消息模块自动配置
 * 
 * v3.0 Runtime Shell 架构
 * Spring Boot 自动配置类
 * 
 * @author Shinwa Team
 * @since 3.0.0
 */
package com.shinwa.app.messenger.config;

import com.shinwa.app.messenger.repository.MessageRepository;
import com.shinwa.app.messenger.repository.MessageTemplateRepository;
import com.shinwa.app.messenger.service.MessageService;
import com.shinwa.app.messenger.service.impl.MessageServiceImpl;
import io.runtime.sdk.context.RuntimeContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
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
    "com.shinwa.app.messenger.controller",
    "com.shinwa.app.messenger.service"
})
@EntityScan(basePackages = "com.shinwa.app.messenger.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.messenger.repository")
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
    
    /**
     * 注册消息服务 Bean
     * 
     * <p>当容器中不存在 MessageService 时自动注册。
     * 通过 RuntimeContext 注入能力契约。
     * 
     * @param context            运行时上下文
     * @param messageRepository  消息仓储
     * @param templateRepository 模板仓储
     * @return 消息服务实例
     */
    @Bean
    @ConditionalOnMissingBean(MessageService.class)
    public MessageService messageService(
            RuntimeContext context,
            MessageRepository messageRepository,
            MessageTemplateRepository templateRepository) {
        log.info("注册 MessageService Bean，使用 RuntimeContext 获取能力契约");
        return new MessageServiceImpl(context, messageRepository, templateRepository);
    }
}
