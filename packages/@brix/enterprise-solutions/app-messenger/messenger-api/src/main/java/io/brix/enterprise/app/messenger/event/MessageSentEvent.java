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
 * 消息发送成功事件
 * 
 * <p>v3.0 Runtime Shell 架构
 * <p>当消息成功发送时发布此事件
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.event;

import io.brix.enterprise.app.messenger.enums.MessageType;
import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

import java.time.LocalDateTime;

/**
 * 消息发送成功事件
 * 
 * <p>当站内消息成功发送后，系统发布此集成事件。
 * 其他模块可以订阅此事件来执行后续操作，例如：
 * <ul>
 *   <li>更新消息统计</li>
 *   <li>触发推送通知</li>
 *   <li>记录审计日志</li>
 * </ul>
 * 
 * <p>事件类型：IntegrationEvent（跨模块集成事件）
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class MessageSentEvent extends IntegrationEvent {
    
    private static final String SOURCE_MODULE = "brix-app-messenger";
    
    /** 消息ID */
    private String messageId;
    
    /** 租户ID */
    private String tenantId;
    
    /** 发送者ID */
    private String senderId;
    
    /** 接收者ID */
    private String receiverId;
    
    /** 消息类型 */
    private MessageType messageType;
    
    /** 消息标题 */
    private String title;
    
    /** 发送时间 */
    private LocalDateTime sentAt;
    
    /** 业务关联ID */
    private String referenceId;
    
    /** 业务关联类型 */
    private String referenceType;
    
    /**
     * 构造函数
     * 
     * @param messageId     消息ID
     * @param tenantId      租户ID
     * @param senderId      发送者ID
     * @param receiverId    接收者ID
     * @param messageType   消息类型
     * @param title         消息标题
     * @param sentAt        发送时间
     * @param referenceId   业务关联ID
     * @param referenceType 业务关联类型
     */
    public MessageSentEvent(String messageId, String tenantId, String senderId,
                           String receiverId, MessageType messageType, String title,
                           LocalDateTime sentAt, String referenceId, String referenceType) {
        super(SOURCE_MODULE, tenantId);
        this.messageId = messageId;
        this.tenantId = tenantId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.messageType = messageType;
        this.title = title;
        this.sentAt = sentAt;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
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
    
    public String getSenderId() {
        return senderId;
    }
    
    public String getReceiverId() {
        return receiverId;
    }
    
    public MessageType getMessageType() {
        return messageType;
    }
    
    public String getTitle() {
        return title;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public String getReferenceType() {
        return referenceType;
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
        private String senderId;
        private String receiverId;
        private MessageType messageType;
        private String title;
        private LocalDateTime sentAt;
        private String referenceId;
        private String referenceType;
        
        public Builder messageId(String messageId) {
            this.messageId = messageId;
            return this;
        }
        
        public Builder tenantId(String tenantId) {
            this.tenantId = tenantId;
            return this;
        }
        
        public Builder senderId(String senderId) {
            this.senderId = senderId;
            return this;
        }
        
        public Builder receiverId(String receiverId) {
            this.receiverId = receiverId;
            return this;
        }
        
        public Builder messageType(MessageType messageType) {
            this.messageType = messageType;
            return this;
        }
        
        public Builder title(String title) {
            this.title = title;
            return this;
        }
        
        public Builder sentAt(LocalDateTime sentAt) {
            this.sentAt = sentAt;
            return this;
        }
        
        public Builder referenceId(String referenceId) {
            this.referenceId = referenceId;
            return this;
        }
        
        public Builder referenceType(String referenceType) {
            this.referenceType = referenceType;
            return this;
        }
        
        public MessageSentEvent build() {
            return new MessageSentEvent(messageId, tenantId, senderId, receiverId,
                    messageType, title, sentAt, referenceId, referenceType);
        }
    }
}
