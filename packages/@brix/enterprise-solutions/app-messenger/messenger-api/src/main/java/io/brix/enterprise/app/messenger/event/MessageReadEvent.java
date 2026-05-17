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
/**
 * 消息已读事件
 * 
 * <p>v3.0 Runtime Shell 架构
 * <p>当消息被标记为已读时发布此事件
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

import java.time.LocalDateTime;

/**
 * 消息已读事件
 * 
 * <p>当用户阅读消息后，系统发布此集成事件。
 * 其他模块可以订阅此事件来执行后续操作，例如：
 * <ul>
 *   <li>更新未读计数</li>
 *   <li>发送已读回执</li>
 *   <li>触发后续业务流程</li>
 * </ul>
 * 
 * <p>事件类型：IntegrationEvent（跨模块集成事件）
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class MessageReadEvent extends IntegrationEvent {
    
    private static final String SOURCE_MODULE = "brix-app-messenger";
    
    /** 消息ID */
    private String messageId;
    
    /** 租户ID */
    private String tenantId;
    
    /** 读取者ID（即消息接收者） */
    private String readerId;
    
    /** 消息发送者ID */
    private String senderId;
    
    /** 读取时间 */
    private LocalDateTime readAt;
    
    /**
     * 构造函数
     * 
     * @param messageId 消息ID
     * @param tenantId  租户ID
     * @param readerId  读取者ID
     * @param senderId  发送者ID
     * @param readAt    读取时间
     */
    public MessageReadEvent(String messageId, String tenantId, String readerId,
                           String senderId, LocalDateTime readAt) {
        super(SOURCE_MODULE, tenantId);
        this.messageId = messageId;
        this.tenantId = tenantId;
        this.readerId = readerId;
        this.senderId = senderId;
        this.readAt = readAt;
    }
    
    /**
     * 获取路由键
     * 
     * <p>使用消息ID作为路由键，确保同一消息的事件顺序性
     * 
     * @return 路由键
     */
    @Override
    public String getRoutingKey() {
        return "message." + messageId;
    }
    
    // ==================== Getter 方法 ====================
    
    public String getMessageId() {
        return messageId;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public String getReaderId() {
        return readerId;
    }
    
    public String getSenderId() {
        return senderId;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    /**
     * 构建器
     */
    public static Builder builder() {
        return new Builder();
    }
    
    /**
     * 事件构建器
     */
    public static class Builder {
        private String messageId;
        private String tenantId;
        private String readerId;
        private String senderId;
        private LocalDateTime readAt;
        
        public Builder messageId(String messageId) {
            this.messageId = messageId;
            return this;
        }
        
        public Builder tenantId(String tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public Builder readerId(String readerId) {
            this.readerId = readerId;
            return this;
        }
        
        public Builder senderId(String senderId) {
            this.senderId = senderId;
            return this;
        }
        
        public Builder readAt(LocalDateTime readAt) {
            this.readAt = readAt;
            return this;
        }
        
        public MessageReadEvent build() {
            return new MessageReadEvent(messageId, tenantId, readerId, senderId, readAt);
        }
    }
}
