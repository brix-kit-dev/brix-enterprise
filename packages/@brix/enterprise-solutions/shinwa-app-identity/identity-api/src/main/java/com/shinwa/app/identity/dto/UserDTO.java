/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.dto;

import com.shinwa.app.identity.enums.UserRole;
import com.shinwa.app.identity.enums.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户信息数据传输对象
 * 
 * <p>用于在服务层和展示层之间传递用户信息，包含用户的所有核心字段。</p>
 * 
 * <h3>使用场景</h3>
 * <ul>
 *   <li>用户详情查询响应</li>
 *   <li>用户列表查询响应</li>
 *   <li>用户创建/修改后的返回值</li>
 * </ul>
 * 
 * <h3>安全说明</h3>
 * <p>本 DTO 不包含密码等敏感信息</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Schema(description = "用户信息数据传输对象")
public class UserDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    // ==================== 基础信息 ====================
    
    /**
     * 用户ID（业务主键，VARCHAR(64)）
     */
    @Schema(description = "主键ID", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private String id;
    
    /**
     * 用户ID
     * <p>业务唯一标识，格式如: U20260128001</p>
     */
    @Schema(description = "用户业务ID", example = "U20260128001", accessMode = Schema.AccessMode.READ_ONLY)
    private String userId;
    
    /**
     * 用户名
     * <p>用于登录的唯一标识</p>
     */
    @Schema(description = "用户名（登录唯一标识）", requiredMode = Schema.RequiredMode.REQUIRED, example = "admin")
    private String username;
    
    /**
     * 租户ID
     */
    @Schema(description = "租户ID", example = "tenant-001")
    private String tenantId;
    
    // ==================== 联系信息 ====================
    
    /**
     * 邮箱
     */
    @Schema(description = "邮箱地址", example = "admin@shinwa.com")
    private String email;
    
    /**
     * 手机号
     */
    @Schema(description = "手机号码", example = "13800138000")
    private String phone;
    
    // ==================== 个人信息 ====================
    
    /**
     * 头像URL
     */
    @Schema(description = "头像图片URL", example = "https://cdn.shinwa.com/avatars/1.png")
    private String avatarUrl;
    
    /**
     * 昵称/显示名称
     */
    @Schema(description = "显示名称/昵称", example = "管理员")
    private String displayName;
    
    // ==================== 状态信息 ====================
    
    /**
     * 用户角色
     */
    @Schema(description = "用户角色", example = "ADMIN")
    private UserRole role;
    
    /**
     * 用户状态
     */
    @Schema(description = "用户状态", example = "ACTIVE")
    private UserStatus status;
    
    // ==================== 时间信息 ====================
    
    /**
     * 创建时间
     */
    @Schema(description = "创建时间", accessMode = Schema.AccessMode.READ_ONLY, example = "2026-01-28T10:30:00")
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @Schema(description = "更新时间", accessMode = Schema.AccessMode.READ_ONLY, example = "2026-01-28T15:45:00")
    private LocalDateTime updatedAt;
    
    /**
     * 最后登录时间
     */
    @Schema(description = "最后登录时间", accessMode = Schema.AccessMode.READ_ONLY, example = "2026-01-28T16:00:00")
    private LocalDateTime lastLoginAt;
    
    // ==================== 构造函数 ====================
    
    /**
     * 默认构造函数
     */
    public UserDTO() {
    }
    
    // ==================== Builder 模式 ====================
    
    /**
     * 创建 Builder
     *
     * @return UserDTO.Builder 实例
     */
    public static Builder builder() {
        return new Builder();
    }
    
    /**
     * UserDTO 构建器
     */
    public static class Builder {
        private final UserDTO instance = new UserDTO();
        
        public Builder id(String id) {
            instance.id = id;
            return this;
        }
        
        public Builder userId(String userId) {
            instance.userId = userId;
            return this;
        }
        
        public Builder username(String username) {
            instance.username = username;
            return this;
        }
        
        public Builder tenantId(String tenantId) {
            instance.tenantId = tenantId;
            return this;
        }
        
        public Builder email(String email) {
            instance.email = email;
            return this;
        }
        
        public Builder phone(String phone) {
            instance.phone = phone;
            return this;
        }
        
        public Builder avatarUrl(String avatarUrl) {
            instance.avatarUrl = avatarUrl;
            return this;
        }
        
        public Builder displayName(String displayName) {
            instance.displayName = displayName;
            return this;
        }
        
        public Builder role(UserRole role) {
            instance.role = role;
            return this;
        }
        
        public Builder status(UserStatus status) {
            instance.status = status;
            return this;
        }
        
        public Builder createdAt(LocalDateTime createdAt) {
            instance.createdAt = createdAt;
            return this;
        }
        
        public Builder updatedAt(LocalDateTime updatedAt) {
            instance.updatedAt = updatedAt;
            return this;
        }
        
        public Builder lastLoginAt(LocalDateTime lastLoginAt) {
            instance.lastLoginAt = lastLoginAt;
            return this;
        }
        
        public UserDTO build() {
            return instance;
        }
    }
    
    // ==================== Getters and Setters ====================
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getAvatarUrl() {
        return avatarUrl;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public UserRole getRole() {
        return role;
    }
    
    public void setRole(UserRole role) {
        this.role = role;
    }
    
    public UserStatus getStatus() {
        return status;
    }
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }
    
    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
