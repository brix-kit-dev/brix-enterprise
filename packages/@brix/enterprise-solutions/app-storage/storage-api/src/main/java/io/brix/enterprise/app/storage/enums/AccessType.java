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
 * 存储访问类型枚举
 * 
 * <p>定义文件访问操作类型，用于访问审计日志记录。
 * 所有文件操作都会记录到审计日志中，支持追溯和合规审查。
 * 
 * <h3>审计日志字段</h3>
 * <ul>
 *   <li>操作类型 - 本枚举值</li>
 *   <li>操作人 - 执行操作的用户ID</li>
 *   <li>操作时间 - 操作发生的时间戳</li>
 *   <li>文件ID - 被操作的文件标识</li>
 *   <li>IP地址 - 客户端IP</li>
 *   <li>用户代理 - 浏览器/客户端信息</li>
 * </ul>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
public enum AccessType {

    /**
     * 上传操作
     * 记录新文件上传
     */
    UPLOAD("upload", "上传"),

    /**
     * 下载操作
     * 记录文件下载（获取文件流）
     */
    DOWNLOAD("download", "下载"),

    /**
     * 预览操作
     * 记录文件预览（获取签名URL访问）
     */
    PREVIEW("preview", "预览"),

    /**
     * 删除操作
     * 记录文件删除（软删除）
     */
    DELETE("delete", "删除"),

    /**
     * 查看元数据操作
     * 记录查看文件信息（不含实际文件内容）
     */
    VIEW_METADATA("view_metadata", "查看元数据");

    /**
     * 访问类型编码
     */
    private final String code;

    /**
     * 访问类型描述
     */
    private final String description;

    AccessType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    /**
     * 获取访问类型编码
     *
     * @return 编码值
     */
    public String getCode() {
        return code;
    }

    /**
     * 获取访问类型描述
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
    public static AccessType fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (AccessType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return null;
    }
}
