/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;

/**
 * 用户创建集成事件
 * 
 * <p>当新用户创建成功后发布此事件，用于通知其他模块（如通知模块、审计模块）。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>messenger-service: 发送欢迎邮件/短信</li>
 *   <li>audit-service: 记录用户创建日志</li>
 *   <li>analytics-service: 更新用户统计数据</li>
 * </ul>
 * 
 * <h3>幂等处理</h3>
 * <p>消费者应通过 {@code userId} 实现幂等，防止重复处理。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class UserCreatedEvent extends IntegrationEvent {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private final String userId;
    
    /**
     * 用户名
     */
    private final String username;
    
    /**
     * 邮箱
     */
    private final String email;
    
    /**
     * 手机号
     */
    private final String phone;
    
    /**
     * 租户ID
     */
    private final String tenantId;
    
    /**
     * 创建时间
     */
    private final LocalDateTime createdAt;
    
    /**
     * 构造函数
     *
     * @param userId    用户ID
     * @param username  用户名
     * @param email     邮箱
     * @param phone     手机号
     * @param tenantId  租户ID
     * @param createdAt 创建时间
     */
    public UserCreatedEvent(String userId, String username, String email, 
                            String phone, String tenantId, LocalDateTime createdAt) {
        super("shinwa-app-identity");
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.tenantId = tenantId;
        this.createdAt = createdAt;
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
    
    public String getUsername() {
        return username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
