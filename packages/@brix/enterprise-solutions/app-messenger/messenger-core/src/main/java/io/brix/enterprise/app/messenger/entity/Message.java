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
 * 消息实体
 * 
 * v3.0 Runtime Shell 架构
 * 站内消息的持久化实体
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.entity;

import io.brix.enterprise.app.messenger.enums.MessageStatus;
import io.brix.enterprise.app.messenger.enums.MessageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 消息实体
 * 
 * <p>站内消息的 JPA 持久化实体，使用 Hibernate 6.x。
 * 
 * <p>表结构设计：
 * <ul>
 *   <li>主键使用业务ID（messageId），便于分布式环境</li>
 *   <li>包含租户ID实现多租户数据隔离</li>
 *   <li>软删除通过 status 字段实现</li>
 * </ul>
 * 
 * <p>索引设计：
 * <ul>
 *   <li>接收者收件箱查询：(tenant_id, receiver_id, status, created_at)</li>
 *   <li>发送者发件箱查询：(tenant_id, sender_id, created_at)</li>
 * </ul>
 */
@Entity
@Table(
    name = "msg_message",
    indexes = {
        @Index(name = "idx_message_inbox", columnList = "tenant_id, receiver_id, status, created_at DESC"),
        @Index(name = "idx_message_outbox", columnList = "tenant_id, sender_id, created_at DESC"),
        @Index(name = "idx_message_reference", columnList = "reference_type, reference_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    /**
     * 消息ID（主键）
     * 使用 UUID 格式的业务ID
     */
    @Id
    @Column(name = "message_id", length = 36, nullable = false)
    private String messageId;
    
    /**
     * 租户ID
     * 多租户数据隔离标识
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 发送者ID
     * 消息发送者的用户ID，系统消息为 "SYSTEM"
     */
    @Column(name = "sender_id", length = 36, nullable = false)
    private String senderId;
    
    /**
     * 发送者名称
     * 发送时记录的发送者显示名称，避免关联查询
     */
    @Column(name = "sender_name", length = 100)
    private String senderName;
    
    /**
     * 接收者ID
     * 消息接收者的用户ID
     */
    @Column(name = "receiver_id", length = 36, nullable = false)
    private String receiverId;
    
    /**
     * 接收者名称
     * 发送时记录的接收者显示名称
     */
    @Column(name = "receiver_name", length = 100)
    private String receiverName;
    
    /**
     * 消息标题
     */
    @Column(name = "title", length = 200, nullable = false)
    private String title;
    
    /**
     * 消息内容
     * 支持富文本，使用 TEXT 类型存储
     */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    /**
     * 消息类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    private MessageType type;
    
    /**
     * 消息状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private MessageStatus status;
    
    /**
     * 业务关联ID
     * 关联的业务实体ID
     */
    @Column(name = "reference_id", length = 36)
    private String referenceId;
    
    /**
     * 业务关联类型
     * 如 ORDER、BOOKING 等
     */
    @Column(name = "reference_type", length = 50)
    private String referenceType;
    
    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * 阅读时间
     * 用户查看消息的时间
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;
}
