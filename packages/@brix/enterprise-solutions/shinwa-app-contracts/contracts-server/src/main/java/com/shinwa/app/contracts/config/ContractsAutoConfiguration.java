package com.shinwa.app.contracts.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.domain.EntityScan;
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
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "com.shinwa.app.contracts.controller",
    "com.shinwa.app.contracts.impl",
    "com.shinwa.app.contracts"  // 包含 ContractsModule
})
@EntityScan(basePackages = "com.shinwa.app.contracts.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.contracts.repository")
public class ContractsAutoConfiguration {

    /**
     * 构造函数
     */
    public ContractsAutoConfiguration() {
        System.out.println("[Contracts] 合同模块自动配置已加载 - v3.0");
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
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
    
    // 【架构约束】RuntimeContext 由 Host 层提供
    // 业务模块不得定义 MockRuntimeContext 绕过 Runtime Shell
    // 开发/测试环境请使用 infra-adapter-simple 模块
}
