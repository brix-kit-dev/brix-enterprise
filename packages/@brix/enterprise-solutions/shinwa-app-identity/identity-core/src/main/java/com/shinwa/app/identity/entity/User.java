/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity;

import com.shinwa.app.identity.enums.UserRole;
import com.shinwa.app.identity.enums.UserStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 鉴权用户实体 — 最小认证记录
 *
 * <p>映射 {@code auth_user} 表，存储用户的基本认证信息。</p>
 *
 * <h3>域归属</h3>
 * <p>auth_user 本体归 platform-auth (Layer 2.5) 所有。
 * 在 identity 模块中通过 Flyway 初始化引导表（开发阶段），
 * 后续部署由 platform-auth 接管 DDL。</p>
 *
 * <h3>主键策略</h3>
 * <p>VARCHAR(64) 应用生成：格式 "U" + yyyyMMdd + 6位随机数字 (如 U20260128123456)</p>
 *
 * <h3>与身份域的关系</h3>
 * <ul>
 *   <li>{@code identity_user_profile.auth_user_id} → 1:1 扩展画像</li>
 *   <li>{@code identity_social_connection.auth_user_id} → 1:N 第三方绑定</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "auth_user", indexes = {
        @Index(name = "idx_auth_user_username_tenant", columnList = "username, tenant_id"),
        @Index(name = "idx_auth_user_email_tenant", columnList = "email, tenant_id"),
        @Index(name = "idx_auth_user_phone_tenant", columnList = "phone, tenant_id"),
        @Index(name = "idx_auth_user_status", columnList = "status"),
        @Index(name = "idx_auth_user_role", columnList = "role"),
        @Index(name = "idx_auth_user_tenant", columnList = "tenant_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_auth_user_username_tenant", columnNames = {"username", "tenant_id"}),
        @UniqueConstraint(name = "uk_auth_user_email_tenant", columnNames = {"email", "tenant_id"})
})
public class User {

    // ==================== 主键（业务键） ====================

    /**
     * 用户ID（业务主键）
     * <p>应用生成，格式: U20260128123456</p>
     */
    @Id
    @Column(name = "id", length = 64)
    private String id;

    // ==================== 认证信息 ====================

    @Column(name = "username", length = 100, nullable = false)
    private String username;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 32)
    private String phone;

    /** BCrypt 加密存储 */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    // ==================== 基本信息 ====================

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    // ==================== 状态 ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified = false;

    // ==================== 安全 ====================

    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 64)
    private String lastLoginIp;

    // ==================== 快捷角色（非正式 RBAC） ====================

    /**
     * 便捷角色列，用于 JWT 签发时快速取值。
     * <p>正式 RBAC → auth_role / auth_user_role 由 platform-auth 管理。</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 32, nullable = false)
    private UserRole role = UserRole.USER;

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

    // ==================== 预留字段（8 个） ====================

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

    protected User() {
    }

    /**
     * 创建用户
     *
     * @param id       应用生成的用户 ID（如 U20260128123456）
     * @param tenantId 租户 ID
     * @param username 用户名
     */
    public User(String id, String tenantId, String username) {
        this.id = id;
        this.tenantId = tenantId;
        this.username = username;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== 业务方法 ====================

    /**
     * 记录登录成功
     */
    public void recordLogin(String ip) {
        this.lastLoginAt = LocalDateTime.now();
        this.lastLoginIp = ip;
        this.failedLoginCount = 0;
        this.updatedAt = LocalDateTime.now();
    }

    /** 向后兼容（无 IP） */
    public void recordLogin() {
        recordLogin(null);
    }

    /**
     * 记录登录失败
     */
    public void recordLoginFailure() {
        this.failedLoginCount++;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 锁定账户
     */
    public void lock(LocalDateTime until) {
        this.lockedUntil = until;
        this.status = UserStatus.LOCKED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 更新修改时间
     */
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查用户是否可登录
     *
     * @return 如果状态为 ACTIVE、未删除、未被锁定则返回 true
     */
    public boolean canLogin() {
        if (this.deleted) return false;
        if (this.status != UserStatus.ACTIVE) return false;
        if (this.lockedUntil != null && LocalDateTime.now().isBefore(this.lockedUntil)) return false;
        return true;
    }

    /**
     * 软删除
     */
    public void softDelete() {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== Getters and Setters ====================

    public String getId() { return id; }

    public String getTenantId() { return tenantId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public int getFailedLoginCount() { return failedLoginCount; }

    public LocalDateTime getLockedUntil() { return lockedUntil; }

    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) { this.passwordChangedAt = passwordChangedAt; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }

    public String getLastLoginIp() { return lastLoginIp; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isDeleted() { return deleted; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
}
