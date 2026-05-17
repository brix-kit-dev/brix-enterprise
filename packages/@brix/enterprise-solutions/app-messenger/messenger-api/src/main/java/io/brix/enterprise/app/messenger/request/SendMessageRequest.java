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
 * 发送消息请求
 * 
 * v3.0 Runtime Shell 架构
 * 发送站内消息的请求参数
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.request;

import io.brix.enterprise.app.messenger.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 发送消息请求
 * 
 * <p>用于发送站内消息的请求参数对象。
 * 支持两种发送方式：
 * <ul>
 *   <li>直接发送：指定 title 和 content</li>
 *   <li>模板发送：指定 templateCode 和 variables</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    
    /**
     * 接收者ID
     * 消息接收者的用户ID
     */
    @NotBlank(message = "接收者ID不能为空")
    private String receiverId;
    
    /**
     * 消息标题
     * 直接发送时必填
     */
    @Size(max = 200, message = "标题长度不能超过200字符")
    private String title;
    
    /**
     * 消息内容
     * 直接发送时必填
     */
    @Size(max = 5000, message = "内容长度不能超过5000字符")
    private String content;
    
    /**
     * 消息类型
     * 默认为 NOTIFICATION
     */
    @NotNull(message = "消息类型不能为空")
    private MessageType type;
    
    /**
     * 模板编码
     * 使用模板发送时指定
     */
    private String templateCode;
    
    /**
     * 模板变量
     * JSON 格式的变量键值对，如 {"orderNo": "ORD001", "userName": "张三"}
     */
    private String variables;
    
    /**
     * 业务关联ID
     * 可选，关联的业务实体ID
     */
    private String referenceId;
    
    /**
     * 业务关联类型
     * 可选，关联的业务类型
     */
    private String referenceType;
}
