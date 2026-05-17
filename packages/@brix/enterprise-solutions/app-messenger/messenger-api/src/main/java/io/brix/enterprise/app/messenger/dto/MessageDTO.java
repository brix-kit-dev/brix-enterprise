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
 * 消息数据传输对象
 * 
 * v3.0 Runtime Shell 架构
 * 站内消息的完整数据结构
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.dto;

import io.brix.enterprise.app.messenger.enums.MessageStatus;
import io.brix.enterprise.app.messenger.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 消息数据传输对象
 * 
 * <p>用于在服务层和表示层之间传输站内消息数据。
 * 包含消息的所有属性信息，用于列表展示和详情查看。
 * 
 * <p>设计原则：
 * <ul>
 *   <li>不包含敏感信息（如密码等）</li>
 *   <li>字段命名与前端保持一致</li>
 *   <li>支持序列化和反序列化</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    
    /**
     * 消息唯一标识
     * 全局唯一的消息ID，使用 UUID 格式
     */
    private String messageId;
    
    /**
     * 租户ID
     * 多租户隔离标识
     */
    private String tenantId;
    
    /**
     * 发送者ID
     * 消息发送者的用户ID，系统消息为 "SYSTEM"
     */
    private String senderId;
    
    /**
     * 发送者名称
     * 消息发送者的显示名称
     */
    private String senderName;
    
    /**
     * 接收者ID
     * 消息接收者的用户ID
     */
    private String receiverId;
    
    /**
     * 接收者名称
     * 消息接收者的显示名称
     */
    private String receiverName;
    
    /**
     * 消息标题
     * 消息的简短标题，用于列表展示
     */
    private String title;
    
    /**
     * 消息内容
     * 消息的正文内容，支持富文本
     */
    private String content;
    
    /**
     * 消息类型
     * @see MessageType
     */
    private MessageType type;
    
    /**
     * 消息状态
     * @see MessageStatus
     */
    private MessageStatus status;
    
    /**
     * 业务关联ID
     * 与业务实体关联的ID，如订单ID、预约ID等
     */
    private String referenceId;
    
    /**
     * 业务关联类型
     * 关联的业务类型，如 "ORDER"、"BOOKING" 等
     */
    private String referenceType;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 阅读时间
     * 用户查看消息的时间，未读时为 null
     */
    private LocalDateTime readAt;
}
