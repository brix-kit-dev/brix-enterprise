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

import io.runtime.sdk.context.RuntimeContext;
import io.runtime.sdk.capability.ObservabilityCapability;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

/**
 * 本地文件系统存储适配器
 * 
 * <p>将文件存储在服务器本地磁盘，适用于开发环境和单机部署。
 * 
 * <h3>配置示例</h3>
 * <pre>
 * storage:
 *   type: local
 *   local:
 *     base-path: /data/files
 *     base-url: http://localhost:8086/files
 * </pre>
 * 
 * <h3>注意事项</h3>
 * <ul>
 *   <li>本地存储不支持分布式部署，文件只存在于一台服务器</li>
 *   <li>签名URL在本地存储模式下实际是直接访问URL，无签名验证</li>
 *   <li>生产环境建议使用MinIO等支持签名URL的存储</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
public class LocalStorageAdapter implements StorageAdapter {

    private final String basePath;
    private final String baseUrl;
    private final RuntimeContext context;

    /**
     * 构造函数
     *
     * @param context 运行时上下文
     * @param basePath 本地存储基础路径
     * @param baseUrl 文件访问基础URL
     */
    public LocalStorageAdapter(RuntimeContext context, String basePath, String baseUrl) {
        this.context = context;
        this.basePath = basePath;
        this.baseUrl = baseUrl;
        
        // 确保基础目录存在
        try {
            Files.createDirectories(Path.of(basePath));
            getObservability().info("[LocalStorage] 初始化成功: basePath={}, baseUrl={}", basePath, baseUrl);
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 创建基础目录失败: {}", basePath, e);
            throw new RuntimeException("创建存储目录失败: " + e.getMessage(), e);
        }
    }

    private ObservabilityCapability getObservability() {
        return context.getObservability();
    }

    @Override
    public String upload(String storagePath, InputStream inputStream, String contentType, long fileSize) {
        Path fullPath = Path.of(basePath, storagePath);
        
        try {
            // 创建父目录
            Files.createDirectories(fullPath.getParent());
            
            // 复制文件
            Files.copy(inputStream, fullPath, StandardCopyOption.REPLACE_EXISTING);
            
            getObservability().info("[LocalStorage] 文件上传成功: path={}, size={}", storagePath, fileSize);
            return storagePath;
            
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 文件上传失败: path={}", storagePath, e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public InputStream download(String storagePath) {
        Path fullPath = Path.of(basePath, storagePath);
        
        try {
            if (!Files.exists(fullPath)) {
                getObservability().warn("[LocalStorage] 文件不存在: path={}", storagePath);
                throw new FileNotFoundException("文件不存在: " + storagePath);
            }
            
            // ✅ P0 修复：使用 NIO Files.newInputStream 替代 FileInputStream
            // 这样可以确保在 try-with-resources 中正确关闭资源
            return Files.newInputStream(fullPath);
            
        } catch (FileNotFoundException e) {
            getObservability().error("[LocalStorage] 文件下载失败: path={}", storagePath, e);
            throw new RuntimeException("文件不存在: " + storagePath, e);
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 文件下载失败: path={}", storagePath, e);
            throw new RuntimeException("文件读取失败: " + storagePath, e);
        }
    }

    @Override
    public void delete(String storagePath) {
        Path fullPath = Path.of(basePath, storagePath);
        
        try {
            if (Files.exists(fullPath)) {
                Files.delete(fullPath);
                getObservability().info("[LocalStorage] 文件删除成功: path={}", storagePath);
            } else {
                getObservability().warn("[LocalStorage] 文件不存在，跳过删除: path={}", storagePath);
            }
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 文件删除失败: path={}", storagePath, e);
            throw new RuntimeException("文件删除失败: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        Path fullPath = Path.of(basePath, storagePath);
        return Files.exists(fullPath);
    }

    @Override
    public String generateSignedUrl(String storagePath, Duration expiration) {
        // 本地存储模式下，直接返回访问URL（无签名验证）
        // 生产环境应使用MinIO等支持签名URL的存储
        return baseUrl + "/" + storagePath;
    }

    @Override
    public String generatePresignedUploadUrl(String storagePath, Duration expiration) {
        // 本地存储不支持Pre-signed上传，返回服务端上传URL
        getObservability().warn("[LocalStorage] 本地存储不支持Pre-signed上传URL，请使用服务端上传");
        return baseUrl + "/upload/" + storagePath;
    }

    @Override
    public String getStorageType() {
        return "local";
    }

    @Override
    public void copy(String sourcePath, String targetPath) {
        Path source = Path.of(basePath, sourcePath);
        Path target = Path.of(basePath, targetPath);
        
        try {
            Files.createDirectories(target.getParent());
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            getObservability().info("[LocalStorage] 文件复制成功: source={}, target={}", sourcePath, targetPath);
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 文件复制失败: source={}, target={}", sourcePath, targetPath, e);
            throw new RuntimeException("文件复制失败: " + e.getMessage(), e);
        }
    }

    @Override
    public long getFileSize(String storagePath) {
        Path fullPath = Path.of(basePath, storagePath);
        
        try {
            return Files.size(fullPath);
        } catch (IOException e) {
            getObservability().error("[LocalStorage] 获取文件大小失败: path={}", storagePath, e);
            throw new RuntimeException("获取文件大小失败: " + e.getMessage(), e);
        }
    }
}
