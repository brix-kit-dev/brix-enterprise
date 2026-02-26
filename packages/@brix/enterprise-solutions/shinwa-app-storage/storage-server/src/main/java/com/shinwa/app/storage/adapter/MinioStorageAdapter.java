package com.shinwa.app.storage.adapter;

import io.runtime.sdk.capability.FileStorageCapability;
import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.ObservabilityCapability;

import java.io.InputStream;
import java.time.Duration;

/**
 * MinIO 对象存储适配器（委托实现）
 * 
 * <p>[红线 R1-4 修复] 本类不再直接依赖 {@code io.minio.*} SDK 包。
 * 改为委托 {@link FileStorageCapability} 能力契约执行实际操作。
 * {@code FileStorageCapability} 的具体实现由 {@code infra-adapter-minio}
 * 模块在 Host 组装层提供。</p>
 * 
 * <h3>架构变更说明</h3>
 * <ul>
 *   <li><b>变更前</b>：直接 {@code import io.minio.*}，插件与 MinIO SDK 产生硬耦合</li>
 *   <li><b>变更后</b>：委托 {@code FileStorageCapability}，插件仅依赖 runtime-sdk-api 契约</li>
 *   <li><b>实际实现</b>：由 {@code infra-adapter-minio} 中的 {@code MinioFileStorageCapability} 提供</li>
 * </ul>
 * 
 * <h3>配置方式</h3>
 * <p>MinIO 连接配置现由 {@code brix.infra.minio.*} 统一管理，不再需要 storage 模块自行配置。</p>
 * 
 * @author Shinwa Platform Team
 * @since 3.0.0
 * @see FileStorageCapability
 */
public class MinioStorageAdapter implements StorageAdapter {

    private final FileStorageCapability fileStorage;
    private final RuntimeContext context;

    /**
     * 构造函数
     *
     * <p>通过 RuntimeContext 或直接注入获取 {@link FileStorageCapability} 能力实例。</p>
     *
     * @param context     运行时上下文
     * @param fileStorage 文件存储能力（由 infra-adapter-minio 自动配置提供）
     */
    public MinioStorageAdapter(RuntimeContext context, FileStorageCapability fileStorage) {
        this.context = context;
        this.fileStorage = fileStorage;

        getObservability().info("[MinioStorage] 适配器初始化完成（委托 FileStorageCapability）");
    }

    private ObservabilityCapability getObservability() {
        return context.getObservability();
    }

    @Override
    public String upload(String storagePath, InputStream inputStream, String contentType, long fileSize) {
        return fileStorage.upload(storagePath, inputStream, contentType, fileSize);
    }

    @Override
    public InputStream download(String storagePath) {
        return fileStorage.download(storagePath);
    }

    @Override
    public void delete(String storagePath) {
        fileStorage.delete(storagePath);
    }

    @Override
    public boolean exists(String storagePath) {
        return fileStorage.exists(storagePath);
    }

    @Override
    public String generateSignedUrl(String storagePath, Duration expiration) {
        return fileStorage.generateSignedUrl(storagePath, expiration);
    }

    /**
     * 生成 Pre-signed 上传 URL
     * 
     * <p>用于客户端直传，减轻服务器压力。</p>
     * 
     * @param storagePath 存储路径
     * @param expiration  URL 有效期
     * @return 签名上传 URL
     */
    @Override
    public String generatePresignedUploadUrl(String storagePath, Duration expiration) {
        return fileStorage.generatePresignedUploadUrl(storagePath, expiration);
    }

    @Override
    public String getStorageType() {
        return fileStorage.getStorageType();
    }

    @Override
    public void copy(String sourcePath, String targetPath) {
        fileStorage.copy(sourcePath, targetPath);
    }

    @Override
    public long getFileSize(String storagePath) {
        return fileStorage.getFileSize(storagePath);
    }
}
