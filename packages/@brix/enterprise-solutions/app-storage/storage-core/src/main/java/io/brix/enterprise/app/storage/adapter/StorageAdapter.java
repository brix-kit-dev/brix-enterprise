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
package io.brix.enterprise.app.storage.adapter;

import java.io.InputStream;
import java.time.Duration;

/**
 * 存储适配器接口
 * 
 * <p>定义文件存储的统一抽象，具体实现位于 storage-server 模块：
 * <ul>
 *   <li>LocalStorageAdapter - 本地文件系统（开发环境）</li>
 *   <li>MinioStorageAdapter - MinIO对象存储（生产环境）</li>
 * </ul>
 * 
 * <h3>设计原则</h3>
 * <ul>
 *   <li>core 模块只定义接口，不包含具体实现</li>
 *   <li>存储路径格式：{tenant_id}/{business_type}/{entity_id}/{file_id}</li>
 *   <li>支持签名URL生成，用于安全的文件访问</li>
 *   <li>支持Pre-signed上传URL，用于客户端直传</li>
 *   <li>存储实现对业务层透明，通过配置切换</li>
 * </ul>
 * 
 * <h3>v3.0 架构合规</h3>
 * <p>本接口遵循 Runtime Shell 架构设计：
 * <ul>
 *   <li>Core 模块只包含纯接口定义</li>
 *   <li>具体实现（MinIO、Local等）移至 Server/Infra 模块</li>
 *   <li>所有实现通过 RuntimeContext 获取 ObservabilityCapability</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
public interface StorageAdapter {

    /**
     * 上传文件
     *
     * @param storagePath 存储路径（相对路径）
     * @param inputStream 文件输入流
     * @param contentType MIME类型
     * @param fileSize 文件大小
     * @return 上传后的完整存储路径
     */
    String upload(String storagePath, InputStream inputStream, String contentType, long fileSize);

    /**
     * 下载文件
     *
     * @param storagePath 存储路径
     * @return 文件输入流
     */
    InputStream download(String storagePath);

    /**
     * 删除文件
     *
     * @param storagePath 存储路径
     */
    void delete(String storagePath);

    /**
     * 检查文件是否存在
     *
     * @param storagePath 存储路径
     * @return 如果存在返回true
     */
    boolean exists(String storagePath);

    /**
     * 生成签名下载URL
     * 
     * <p>生成带签名的临时访问URL，用于安全的文件访问。
     * 签名URL有时效性，过期后无法访问。
     *
     * @param storagePath 存储路径
     * @param expiration URL有效期
     * @return 签名URL
     */
    String generateSignedUrl(String storagePath, Duration expiration);

    /**
     * 生成签名下载URL（默认5分钟有效期）
     *
     * @param storagePath 存储路径
     * @return 签名URL
     */
    default String generateSignedUrl(String storagePath) {
        return generateSignedUrl(storagePath, Duration.ofMinutes(5));
    }

    /**
     * 获取存储类型名称
     *
     * @return 存储类型名称（如：local, minio, s3）
     */
    String getStorageType();

    /**
     * 复制文件
     *
     * @param sourcePath 源路径
     * @param targetPath 目标路径
     */
    void copy(String sourcePath, String targetPath);

    /**
     * 获取文件大小
     *
     * @param storagePath 存储路径
     * @return 文件大小（字节）
     */
    long getFileSize(String storagePath);

    /**
     * 生成Pre-signed上传URL
     * 
     * <p>用于客户端直传模式，减轻服务器压力。
     * 客户端可直接将文件上传到存储后端，无需经过应用服务器。
     * 
     * <h3>典型使用场景</h3>
     * <ul>
     *   <li>头像上传：客户端压缩后直传</li>
     *   <li>大文件上传：减轻服务器带宽压力</li>
     *   <li>移动端上传：优化网络传输</li>
     * </ul>
     *
     * @param storagePath 存储路径
     * @param expiration URL有效期
     * @return 签名上传URL
     */
    String generatePresignedUploadUrl(String storagePath, Duration expiration);

    /**
     * 生成Pre-signed上传URL（默认15分钟有效期）
     *
     * @param storagePath 存储路径
     * @return 签名上传URL
     */
    default String generatePresignedUploadUrl(String storagePath) {
        return generatePresignedUploadUrl(storagePath, Duration.ofMinutes(15));
    }
}
