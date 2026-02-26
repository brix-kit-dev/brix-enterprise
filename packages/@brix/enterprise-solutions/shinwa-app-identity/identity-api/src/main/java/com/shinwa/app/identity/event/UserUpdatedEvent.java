/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.event;

import io.runtime.sdk.event.IntegrationEvent;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户信息更新集成事件
 * 
 * <p>当用户信息更新成功后发布此事件，用于通知其他模块。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>audit-service: 记录用户信息变更日志</li>
 *   <li>cache-service: 清除用户缓存</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class UserUpdatedEvent extends IntegrationEvent {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private final String userId;
    
    /**
     * 更新的字段列表
     */
    private final List<String> updatedFields;
    
    /**
     * 租户ID
     */
    private final String tenantId;
    
    /**
     * 更新时间
     */
    private final LocalDateTime updatedAt;
    
    /**
     * 更新操作人ID
     */
    private final String updatedBy;
    
    /**
     * 构造函数
     *
     * @param userId        用户ID
     * @param updatedFields 更新的字段列表
     * @param tenantId      租户ID
     * @param updatedAt     更新时间
     * @param updatedBy     更新操作人ID
     */
    public UserUpdatedEvent(String userId, List<String> updatedFields, 
                            String tenantId, LocalDateTime updatedAt, String updatedBy) {
        super("shinwa-app-identity");
        this.userId = userId;
        this.updatedFields = updatedFields;
        this.tenantId = tenantId;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }
    
    @Override
    public String getRoutingKey() {
        return "identity.user." + userId;
    }
    
    // ==================== Getters ====================
    
    public String getUserId() {
        return userId;
    }
    
    public List<String> getUpdatedFields() {
        return updatedFields;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
}
