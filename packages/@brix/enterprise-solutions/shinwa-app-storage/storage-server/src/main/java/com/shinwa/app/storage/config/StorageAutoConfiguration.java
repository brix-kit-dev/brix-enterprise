package com.shinwa.app.storage.config;

import com.shinwa.app.storage.adapter.LocalStorageAdapter;
import com.shinwa.app.storage.adapter.MinioStorageAdapter;
import com.shinwa.app.storage.adapter.StorageAdapter;
import io.runtime.sdk.context.RuntimeContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 存储模块自动配置
 * 
 * <p>提供存储模块的Spring Boot自动配置：
 * <ul>
 *   <li>组件扫描 - 扫描Controller、Service等组件</li>
 *   <li>JPA配置 - 配置实体扫描和仓储</li>
 *   <li>存储适配器 - 根据配置选择存储后端</li>
 * </ul>
 * 
 * <h3>v3.0 架构合规</h3>
 * <p>适配器实现通过 RuntimeContext 获取 ObservabilityCapability，
 * 遵循 Runtime Shell 架构的能力契约模型。
 * 
 * <h3>配置示例</h3>
 * <pre>
 * storage:
 *   type: local  # 或 minio
 *   local:
 *     base-path: /data/files
 *     base-url: http://localhost:8086/files
 *   minio:
 *     endpoint: http://localhost:9000
 *     access-key: minioadmin
 *     secret-key: minioadmin
 *     bucket: shinwa-files
 * </pre>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 */
@AutoConfiguration
@ComponentScan(basePackages = {
    "com.shinwa.app.storage.controller",
    "com.shinwa.app.storage.impl"
})
@EntityScan(basePackages = "com.shinwa.app.storage.entity")
@EnableJpaRepositories(basePackages = "com.shinwa.app.storage.repository")
public class StorageAutoConfiguration {

    /**
     * 本地存储适配器
     * 当 storage.type=local 时激活
     */
    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
    @ConditionalOnMissingBean(StorageAdapter.class)
    public StorageAdapter localStorageAdapter(
            RuntimeContext context,
            @Value("${storage.local.base-path:./data/files}") String basePath,
            @Value("${storage.local.base-url:http://localhost:8086/files}") String baseUrl) {
        return new LocalStorageAdapter(context, basePath, baseUrl);
    }

    /**
     * MinIO 存储适配器
     * 
     * <p>[红线 R1-4 修复] MinIO 连接配置已移至 {@code brix.infra.minio.*}，
     * 由 {@code infra-adapter-minio} 自动配置 {@link io.runtime.sdk.capability.FileStorageCapability}。
     * 此处仅将 FileStorageCapability 包装为 StorageAdapter 接口。</p>
     * 
     * @param context     运行时上下文
     * @param fileStorage 文件存储能力（由 infra-adapter-minio 自动配置提供）
     * @return 存储适配器实例
     */
    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "minio")
    @ConditionalOnMissingBean(StorageAdapter.class)
    public StorageAdapter minioStorageAdapter(
            RuntimeContext context,
            io.runtime.sdk.capability.FileStorageCapability fileStorage) {
        return new MinioStorageAdapter(context, fileStorage);
    }
}
