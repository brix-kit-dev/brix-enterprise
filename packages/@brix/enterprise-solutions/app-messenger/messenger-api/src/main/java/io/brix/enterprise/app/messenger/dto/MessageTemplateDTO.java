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
 * 消息模板数据传输对象
 * 
 * v3.0 Runtime Shell 架构
 * 消息模板的完整数据结构
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.dto;

import io.brix.enterprise.app.messenger.enums.MessageType;
import io.brix.enterprise.app.messenger.enums.NotificationChannel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 消息模板数据传输对象
 * 
 * <p>用于定义消息模板，支持变量替换和多渠道发送。
 * 模板内容中可以使用 ${variableName} 格式的占位符。
 * 
 * <p>示例：
 * <pre>
 * 标题：您的订单 ${orderNo} 已发货
 * 内容：尊敬的 ${userName}，您的订单已于 ${shipDate} 发货...
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageTemplateDTO {
    
    /**
     * 模板ID
     * 全局唯一的模板标识
     */
    private String templateId;
    
    /**
     * 租户ID
     * 多租户隔离标识
     */
    private String tenantId;
    
    /**
     * 模板编码
     * 用于业务调用的模板唯一编码，如 "ORDER_SHIPPED"
     */
    private String templateCode;
    
    /**
     * 模板名称
     * 模板的显示名称
     */
    private String name;
    
    /**
     * 模板描述
     * 模板的详细描述
     */
    private String description;
    
    /**
     * 消息类型
     * 使用该模板发送的消息类型
     */
    private MessageType messageType;
    
    /**
     * 标题模板
     * 支持变量替换的标题模板
     */
    private String titleTemplate;
    
    /**
     * 内容模板
     * 支持变量替换的内容模板
     */
    private String contentTemplate;
    
    /**
     * 支持的通知渠道
     * 该模板支持发送的渠道列表
     */
    private Set<NotificationChannel> channels;
    
    /**
     * 是否启用
     */
    private boolean enabled;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
