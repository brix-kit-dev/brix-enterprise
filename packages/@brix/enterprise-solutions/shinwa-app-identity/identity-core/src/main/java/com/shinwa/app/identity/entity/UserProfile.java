/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.entity;

import com.shinwa.app.identity.enums.UserType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户画像实体 — 身份域扩展信息
 *
 * <p>存储与「这个人是谁」相关的业务画像数据，与鉴权域 ({@code auth_user}) 通过 FK 关联。</p>
 *
 * <h3>身份类型路由</h3>
 * <ul>
 *   <li>{@code user_type = PATIENT}  → 关联 {@code identity_patient_profile}</li>
 *   <li>{@code user_type = EMPLOYEE} → 关联 {@code identity_employee_profile}</li>
 *   <li>{@code user_type = GENERAL}  → 无子画像表</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Entity
@Table(name = "identity_user_profile", indexes = {
        @Index(name = "idx_identity_profile_tenant", columnList = "tenant_id"),
        @Index(name = "idx_identity_profile_user_type", columnList = "user_type")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_identity_profile_auth_user", columnNames = {"auth_user_id"})
})
public class UserProfile {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    /** 关联 auth_user（一对一） */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auth_user_id", nullable = false, unique = true)
    private User authUser;

    /** 身份类型 */
    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", length = 32, nullable = false)
    private UserType userType = UserType.GENERAL;

    // ==================== 画像信息 ====================

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "gender", length = 16)
    private String gender;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "locale", length = 16)
    private String locale;

    @Column(name = "timezone", length = 64)
    private String timezone;

    @Column(name = "bio", length = 500)
    private String bio;

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

    protected UserProfile() {
    }

    public UserProfile(String id, User authUser, UserType userType, String tenantId) {
        this.id = id;
        this.authUser = authUser;
        this.userType = userType;
        this.tenantId = tenantId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== 业务方法 ====================

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== Getters & Setters ====================

    public String getId() { return id; }
    public User getAuthUser() { return authUser; }
    public UserType getUserType() { return userType; }
    public void setUserType(UserType userType) { this.userType = userType; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getTenantId() { return tenantId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
