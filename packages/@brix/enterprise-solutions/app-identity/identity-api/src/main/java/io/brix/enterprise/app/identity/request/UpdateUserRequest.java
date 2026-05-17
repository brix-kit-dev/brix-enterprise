/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * 更新用户请求
 * 
 * <p>用于接收更新用户信息的请求参数，所有字段均为可选。</p>
 * 
 * <h3>更新规则</h3>
 * <ul>
 *   <li>仅传入需要更新的字段</li>
 *   <li>null 值表示不更新该字段</li>
 *   <li>空字符串表示清空该字段（某些字段）</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Schema(description = "更新用户请求")
public class UpdateUserRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 邮箱
     */
    @Schema(description = "邮箱地址", example = "user@brix.io")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    /**
     * 手机号
     */
    @Schema(description = "手机号码", example = "13800138001", pattern = "^1[3-9]\\d{9}$")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    /**
     * 昵称/显示名称
     */
    @Schema(description = "显示名称/昵称", example = "新昵称", maxLength = 64)
    @Size(max = 64, message = "昵称长度不能超过 64 字符")
    private String displayName;
    
    /**
     * 头像URL
     */
    @Schema(description = "头像图片URL", example = "https://cdn.brix.io/avatars/2.png", maxLength = 512)
    @Size(max = 512, message = "头像URL长度不能超过 512 字符")
    private String avatarUrl;
    
    // ==================== Getters and Setters ====================
    
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
    
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public String getAvatarUrl() {
        return avatarUrl;
    }
    
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
