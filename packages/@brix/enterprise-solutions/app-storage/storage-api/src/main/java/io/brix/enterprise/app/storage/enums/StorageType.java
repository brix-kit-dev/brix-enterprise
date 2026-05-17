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
package io.brix.enterprise.app.storage.enums;

/**
 * 存储类型枚举
 * 
 * <p>定义文件存储后端类型，支持多种存储实现的运行时切换。
 * 
 * <h3>存储后端选择策略</h3>
 * <ul>
 *   <li><b>LOCAL</b> - 本地文件系统，适用于开发环境和单机部署</li>
 *   <li><b>MINIO</b> - MinIO对象存储，适用于私有化部署的生产环境</li>
 *   <li><b>S3</b> - AWS S3，适用于AWS云环境</li>
 *   <li><b>OSS</b> - 阿里云OSS，适用于阿里云环境</li>
 *   <li><b>COS</b> - 腾讯云COS，适用于腾讯云环境</li>
 * </ul>
 * 
 * <h3>配置示例</h3>
 * <pre>
 * storage:
 *   type: minio
 *   minio:
 *     endpoint: http://localhost:9000
 *     access-key: minioadmin
 *     secret-key: minioadmin
 *     bucket: brix-files
 * </pre>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum StorageType {

    /**
     * 本地文件系统
     * 适用于开发环境和单机部署，文件存储在服务器本地磁盘
     */
    LOCAL("local", "本地存储"),

    /**
     * MinIO对象存储
     * 适用于私有化部署的生产环境，S3兼容的分布式对象存储
     */
    MINIO("minio", "MinIO存储"),

    /**
     * AWS S3
     * Amazon Simple Storage Service，适用于AWS云环境
     */
    S3("s3", "AWS S3"),

    /**
     * 阿里云OSS
     * 阿里云对象存储服务，适用于阿里云环境
     */
    OSS("oss", "阿里云OSS"),

    /**
     * 腾讯云COS
     * 腾讯云对象存储服务，适用于腾讯云环境
     */
    COS("cos", "腾讯云COS");

    /**
     * 存储类型编码
     */
    private final String code;

    /**
     * 存储类型描述
     */
    private final String description;

    StorageType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    /**
     * 获取存储类型编码
     *
     * @return 编码值
     */
    public String getCode() {
        return code;
    }

    /**
     * 获取存储类型描述
     *
     * @return 中文描述
     */
    public String getDescription() {
        return description;
    }

    /**
     * 根据编码获取枚举值
     *
     * @param code 编码
     * @return 对应的枚举值，未找到返回null
     */
    public static StorageType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (StorageType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
