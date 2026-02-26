/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 用户禁用集成事件
 * 
 * <p>当用户账号被禁用时发布此事件，用于通知其他模块执行相应的业务处理。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>booking-service: 取消该用户的待处理预约</li>
 *   <li>messenger-service: 发送账号禁用通知</li>
 *   <li>audit-service: 记录账号禁用日志</li>
 *   <li>session-service: 强制登出该用户的所有会话</li>
 * </ul>
 * 
 * <h3>幂等处理</h3>
 * <p>消费者应通过 {@code eventId} 或 {@code userId} 实现幂等，防止重复处理。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class UserDisabledEvent extends IntegrationEvent {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private final String userId;
    
    /**
     * 租户ID
     */
    private final String tenantId;
    
    /**
     * 禁用原因
     */
    private final String reason;
    
    /**
     * 禁用时间
     */
    private final LocalDateTime disabledAt;
    
    /**
     * 操作人ID（系统自动禁用时为 null）
     */
    private final String disabledBy;
    
    /**
     * 构造函数
     *
     * @param userId     用户ID
     * @param tenantId   租户ID
     * @param reason     禁用原因
     * @param disabledAt 禁用时间
     * @param disabledBy 操作人ID
     */
    public UserDisabledEvent(String userId, String tenantId, String reason,
                             LocalDateTime disabledAt, String disabledBy) {
        super("shinwa-app-identity");
        this.userId = userId;
        this.tenantId = tenantId;
        this.reason = reason;
        this.disabledAt = disabledAt;
        this.disabledBy = disabledBy;
    }
    
    /**
     * {@inheritDoc}
     * 
     * <p>使用 userId 作为路由键，确保同一用户的事件顺序处理</p>
     */
    @Override
    public String getRoutingKey() {
        return "identity.user." + userId;
    }
    
    // ==================== Getters ====================
    
    public String getUserId() {
        return userId;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public String getReason() {
        return reason;
    }
    
    public LocalDateTime getDisabledAt() {
        return disabledAt;
    }
    
    public String getDisabledBy() {
        return disabledBy;
    }
    
    @Override
    public String toString() {
        return "UserDisabledEvent{" +
                "eventId='" + getEventId() + '\'' +
                ", userId='" + userId + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", reason='" + reason + '\'' +
                ", disabledAt=" + disabledAt +
                ", disabledBy='" + disabledBy + '\'' +
                '}';
    }
}
