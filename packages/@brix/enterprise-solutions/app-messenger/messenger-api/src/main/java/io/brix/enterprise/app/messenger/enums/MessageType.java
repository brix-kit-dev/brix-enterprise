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
 * 消息类型枚举
 * 
 * v3.0 Runtime Shell 架构
 * 定义系统支持的消息类型
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.enums;

/**
 * 消息类型枚举
 * 
 * <p>定义系统中不同的消息类型，包括：
 * <ul>
 *   <li>SYSTEM - 系统通知，由系统自动生成</li>
 *   <li>PRIVATE - 私信，用户之间的私密消息</li>
 *   <li>BROADCAST - 广播消息，发送给所有用户</li>
 *   <li>NOTIFICATION - 业务通知，由业务事件触发</li>
 * </ul>
 */
public enum MessageType {
    
    /**
     * 系统通知
     * 由系统自动生成的通知消息，如账户安全提醒、系统维护通知等
     */
    SYSTEM("系统通知"),
    
    /**
     * 私信
     * 用户之间的一对一私密消息
     */
    PRIVATE("私信"),
    
    /**
     * 广播消息
     * 发送给所有用户或特定用户群组的消息
     */
    BROADCAST("广播消息"),
    
    /**
     * 业务通知
     * 由业务事件触发的通知，如订单状态变更、预约提醒等
     */
    NOTIFICATION("业务通知");
    
    /**
     * 类型描述
     */
    private final String description;
    
    MessageType(String description) {
        this.description = description;
    }
    
    /**
     * 获取类型描述
     * 
     * @return 类型描述文本
     */
    public String getDescription() {
        return description;
    }
}
