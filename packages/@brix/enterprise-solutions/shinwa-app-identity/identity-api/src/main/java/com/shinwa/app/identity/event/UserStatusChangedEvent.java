/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 用户状态变更集成事件
 * 
 * <p>当用户状态发生变更（启用/禁用/锁定等）后发布此事件。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>session-service: 强制用户登出</li>
 *   <li>audit-service: 记录状态变更日志</li>
 *   <li>messenger-service: 发送状态变更通知</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class UserStatusChangedEvent extends IntegrationEvent {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private final String userId;
    
    /**
     * 原状态
     */
    private final String oldStatus;
    
    /**
     * 新状态
     */
    private final String newStatus;
    
    /**
     * 变更原因
     */
    private final String reason;
    
    /**
     * 租户ID
     */
    private final String tenantId;
    
    /**
     * 变更时间
     */
    private final LocalDateTime changedAt;
    
    /**
     * 变更操作人ID
     */
    private final String changedBy;
    
    /**
     * 构造函数
     *
     * @param userId    用户ID
     * @param oldStatus 原状态
     * @param newStatus 新状态
     * @param reason    变更原因
     * @param tenantId  租户ID
     * @param changedAt 变更时间
     * @param changedBy 变更操作人ID
     */
    public UserStatusChangedEvent(String userId, String oldStatus, String newStatus,
                                   String reason, String tenantId, 
                                   LocalDateTime changedAt, String changedBy) {
        super("shinwa-app-identity");
        this.userId = userId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.reason = reason;
        this.tenantId = tenantId;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
    }
    
    @Override
    public String getRoutingKey() {
        return "identity.user." + userId;
    }
    
    // ==================== Getters ====================
    
    public String getUserId() {
        return userId;
    }
    
    public String getOldStatus() {
        return oldStatus;
    }
    
    public String getNewStatus() {
        return newStatus;
    }
    
    public String getReason() {
        return reason;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public LocalDateTime getChangedAt() {
        return changedAt;
    }
    
    public String getChangedBy() {
        return changedBy;
    }
}
