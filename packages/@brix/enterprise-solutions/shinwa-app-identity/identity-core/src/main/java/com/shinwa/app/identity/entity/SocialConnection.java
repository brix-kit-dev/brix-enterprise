/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity;

import com.shinwa.app.identity.entity.converter.TokenEncryptionConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 第三方账号绑定实体
 *
 * <p>存储用户与第三方 OAuth2 提供商（Google、GitHub、WeChat 等）的关联信息。</p>
 *
 * <h3>安全措施</h3>
 * <ul>
 *   <li>access_token / refresh_token / id_token 通过 {@link TokenEncryptionConverter}
 *       使用 AES-256-GCM 加密后落库</li>
 *   <li>软删除：解绑时标记 deleted 而非物理删除</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "identity_social_connection", indexes = {
        @Index(name = "idx_social_auth_user", columnList = "auth_user_id"),
        @Index(name = "idx_social_provider", columnList = "provider"),
        @Index(name = "idx_social_tenant", columnList = "tenant_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_social_provider_user",
                columnNames = {"provider", "provider_user_id", "tenant_id"})
})
public class SocialConnection {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** 关联 auth_user */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auth_user_id", nullable = false)
    private User authUser;

    // ==================== 第三方信息 ====================

    @Column(name = "provider", length = 32, nullable = false)
    private String provider;

    @Column(name = "provider_user_id", length = 255, nullable = false)
    private String providerUserId;

    // ==================== 用户信息快照 ====================

    @Column(name = "nickname", length = 100)
    private String nickname;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    // ==================== Token 信息（加密存储）====================

    @Convert(converter = TokenEncryptionConverter.class)
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Convert(converter = TokenEncryptionConverter.class)
    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Convert(converter = TokenEncryptionConverter.class)
    @Column(name = "id_token", columnDefinition = "TEXT")
    private String idToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "scope", length = 512)
    private String scope;

    // ==================== 附加数据 ====================

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private String rawData;

    // ==================== 状态 ====================

    @Column(name = "status", length = 32, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "bound_at", nullable = false)
    private LocalDateTime boundAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // ==================== 多租户 ====================

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    // ==================== 审计字段 ====================

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ==================== 预留字段（8 个）====================

    @Column(name = "ext_varchar_1", length = 255)
    private String extVarchar1;

    @Column(name = "ext_varchar_2", length = 255)
    private String extVarchar2;

    @Column(name = "ext_varchar_3", length = 255)
    private String extVarchar3;

    @Column(name = "ext_varchar_4", length = 255)
    private String extVarchar4;

    @Column(name = "ext_varchar_5", length = 255)
    private String extVarchar5;

    @Column(name = "ext_int_1")
    private Integer extInt1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ext_json_1", columnDefinition = "jsonb")
    private String extJson1;

    @Column(name = "ext_timestamp_1")
    private LocalDateTime extTimestamp1;

    // ==================== 构造函数 ====================

    protected SocialConnection() {
    }

    public SocialConnection(String id, User authUser, String tenantId,
                            String provider, String providerUserId) {
        this.id = id;
        this.authUser = authUser;
        this.tenantId = tenantId;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.boundAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== 业务方法 ====================

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateTokens(String accessToken, String refreshToken, LocalDateTime expiresAt) {
        this.accessToken = accessToken;
        if (refreshToken != null) {
            this.refreshToken = refreshToken;
        }
        this.tokenExpiresAt = expiresAt;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isTokenExpired() {
        if (tokenExpiresAt == null) return true;
        return LocalDateTime.now().plusMinutes(5).isAfter(tokenExpiresAt);
    }

    // ==================== Getters & Setters ====================

    public String getId() { return id; }
    public User getAuthUser() { return authUser; }
    public void setAuthUser(User authUser) { this.authUser = authUser; }
    public String getProvider() { return provider; }
    public String getProviderUserId() { return providerUserId; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
    public LocalDateTime getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public String getTenantId() { return tenantId; }
    public LocalDateTime getBoundAt() { return boundAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
