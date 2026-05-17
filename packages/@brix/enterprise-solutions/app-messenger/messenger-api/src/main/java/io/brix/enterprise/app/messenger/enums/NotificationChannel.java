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
 * 通知渠道枚举
 * 
 * v3.0 Runtime Shell 架构
 * 定义通知的发送渠道
 * 
 * @author Brix Platform Team
 * @since 3.0.0
 */
package io.brix.enterprise.app.messenger.enums;

/**
 * 通知渠道枚举
 * 
 * <p>定义系统支持的通知发送渠道：
 * <ul>
 *   <li>IN_APP - 站内消息，在应用内展示</li>
 *   <li>PUSH - 推送通知，通过 FCM/APNs 发送</li>
 *   <li>EMAIL - 邮件通知</li>
 *   <li>SMS - 短信通知</li>
 *   <li>WEBHOOK - Webhook 回调</li>
 * </ul>
 */
public enum NotificationChannel {
    
    /**
     * 站内消息
     * 在应用内部展示的消息，用户需要登录应用才能查看
     */
    IN_APP("站内消息"),
    
    /**
     * 推送通知
     * 通过移动设备推送服务（FCM/APNs）发送的通知
     */
    PUSH("推送通知"),
    
    /**
     * 邮件通知
     * 通过电子邮件发送的通知
     */
    EMAIL("邮件通知"),
    
    /**
     * 短信通知
     * 通过短信服务发送的通知
     */
    SMS("短信通知"),
    
    /**
     * Webhook 回调
     * 通过 HTTP Webhook 发送的通知，用于系统集成
     */
    WEBHOOK("Webhook回调");
    
    /**
     * 渠道描述
     */
    private final String description;
    
    NotificationChannel(String description) {
        this.description = description;
    }
    
    /**
     * 获取渠道描述
     * 
     * @return 渠道描述文本
     */
    public String getDescription() {
        return description;
    }
}
