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
package io.brix.enterprise.app.storage.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;
import lombok.Getter;

/**
 * 头像上传完成事件
 * 
 * <p>当用户头像上传并确认成功后发布此事件。
 * 其他模块可订阅此事件进行后续处理，如：
 * <ul>
 *   <li>Identity模块更新用户头像URL</li>
 *   <li>Messenger模块更新消息中的头像缓存</li>
 *   <li>审计模块记录操作日志</li>
 * </ul>
 * 
 * <p>继承自 {@link IntegrationEvent}，确保事件ID自动生成和事件契约一致性。</p>
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Getter
@SchemaVersion(value = 1, minCompatible = 1)
public class AvatarUploadedEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;
    
    private static final String SOURCE_MODULE = "brix-app-storage";

    /**
     * 租户ID
     */
    private final String tenantId;

    /**
     * 用户ID
     */
    private final String userId;

    /**
     * 原图URL
     */
    private final String originalUrl;

    /**
     * 大尺寸头像URL (256x256)
     */
    private final String largeUrl;

    /**
     * 中尺寸头像URL (128x128)
     */
    private final String mediumUrl;

    /**
     * 小尺寸头像URL (48x48)
     */
    private final String smallUrl;

    /**
     * 文件MIME类型
     */
    private final String contentType;

    /**
     * 文件大小（字节）
     */
    private final Long fileSize;

    /**
     * 构造函数
     */
    public AvatarUploadedEvent(String tenantId, String userId, String originalUrl,
                               String largeUrl, String mediumUrl, String smallUrl,
                               String contentType, Long fileSize) {
        super(SOURCE_MODULE, tenantId);
        this.tenantId = tenantId;
        this.userId = userId;
        this.originalUrl = originalUrl;
        this.largeUrl = largeUrl;
        this.mediumUrl = mediumUrl;
        this.smallUrl = smallUrl;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    /**
     * 获取路由键，用于消息分区
     * 
     * @return 基于用户ID的路由键，保证同一用户的头像事件顺序消费
     */
    @Override
    public String getRoutingKey() {
        return "avatar." + userId;
    }
    
    /**
     * Builder 模式支持
     */
    public static AvatarUploadedEventBuilder builder() {
        return new AvatarUploadedEventBuilder();
    }
    
    /**
     * Builder 类
     */
    public static class AvatarUploadedEventBuilder {
        private String tenantId;
        private String userId;
        private String originalUrl;
        private String largeUrl;
        private String mediumUrl;
        private String smallUrl;
        private String contentType;
        private Long fileSize;
        
        public AvatarUploadedEventBuilder tenantId(String tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public AvatarUploadedEventBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }
        
        public AvatarUploadedEventBuilder originalUrl(String originalUrl) {
            this.originalUrl = originalUrl;
            return this;
        }
        
        public AvatarUploadedEventBuilder largeUrl(String largeUrl) {
            this.largeUrl = largeUrl;
            return this;
        }
        
        public AvatarUploadedEventBuilder mediumUrl(String mediumUrl) {
            this.mediumUrl = mediumUrl;
            return this;
        }
        
        public AvatarUploadedEventBuilder smallUrl(String smallUrl) {
            this.smallUrl = smallUrl;
            return this;
        }
        
        public AvatarUploadedEventBuilder contentType(String contentType) {
            this.contentType = contentType;
            return this;
        }
        
        public AvatarUploadedEventBuilder fileSize(Long fileSize) {
            this.fileSize = fileSize;
            return this;
        }
        
        public AvatarUploadedEvent build() {
            return new AvatarUploadedEvent(tenantId, userId, originalUrl, 
                    largeUrl, mediumUrl, smallUrl, contentType, fileSize);
        }
    }
}
