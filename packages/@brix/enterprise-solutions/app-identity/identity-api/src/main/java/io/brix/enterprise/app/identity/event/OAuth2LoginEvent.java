/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.event;

import io.runtime.sdk.event.IntegrationEvent;
import io.runtime.sdk.event.SchemaVersion;

import java.time.LocalDateTime;

/**
 * OAuth2 登录集成事件
 * 
 * <p>当用户通过 OAuth2（如 Google）登录成功后发布此事件，
 * 用于通知其他模块进行审计记录、安全监控等。</p>
 * 
 * <h3>订阅者处理建议</h3>
 * <ul>
 *   <li>audit-service: 记录 OAuth2 登录日志</li>
 *   <li>analytics-service: 更新登录统计</li>
 *   <li>notification-service: 新设备登录提醒</li>
 * </ul>
 * 
 * <h3>幂等处理</h3>
 * <p>消费者应通过 eventId 实现幂等，防止重复处理。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@SchemaVersion(value = 1, minCompatible = 1)
public class OAuth2LoginEvent extends IntegrationEvent {

    private static final long serialVersionUID = 1L;

    private final String userId;
    private final String username;
    private final String email;
    private final String provider;
    private final String externalId;
    private final boolean newUser;
    private final String tenantId;
    private final LocalDateTime loginTime;

    public OAuth2LoginEvent(String source,
                            String userId,
                            String username,
                            String email,
                            String provider,
                            String externalId,
                            boolean newUser,
                            String tenantId) {
                    super(source, tenantId);
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.provider = provider;
        this.externalId = externalId;
        this.newUser = newUser;
        this.tenantId = tenantId;
        this.loginTime = LocalDateTime.now();
    }

    public String getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getProvider() {
        return provider;
    }

    public String getExternalId() {
        return externalId;
    }

    public boolean isNewUser() {
        return newUser;
    }

    public String getTenantId() {
        return tenantId;
    }

    public LocalDateTime getLoginTime() {
        return loginTime;
    }

    @Override
    public String getRoutingKey() {
        return "identity.oauth2.login";
    }

    @Override
    public String toString() {
        return "OAuth2LoginEvent{" +
                "userId='" + userId + '\'' +
                ", provider='" + provider + '\'' +
                ", newUser=" + newUser +
                ", tenantId='" + tenantId + '\'' +
                ", loginTime=" + loginTime +
                '}';
    }
}
