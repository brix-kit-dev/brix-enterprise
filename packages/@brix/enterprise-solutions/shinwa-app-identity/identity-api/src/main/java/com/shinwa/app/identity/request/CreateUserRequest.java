/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.request;

import com.shinwa.app.identity.enums.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * 创建用户请求
 * 
 * <p>用于接收创建新用户的请求参数，包含用户注册所需的所有信息。</p>
 * 
 * <h3>校验规则</h3>
 * <ul>
 *   <li>用户名: 必填，3-32 字符，仅允许字母、数字、下划线</li>
 *   <li>密码: 必填，8-64 字符</li>
 *   <li>邮箱: 可选，需符合邮箱格式</li>
 *   <li>手机号: 可选，需符合手机号格式</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Schema(description = "创建用户请求")
public class CreateUserRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户名
     * <p>用于登录的唯一标识，仅允许字母、数字、下划线</p>
     */
    @Schema(description = "用户名（登录唯一标识）", requiredMode = Schema.RequiredMode.REQUIRED, 
            example = "new_user", minLength = 3, maxLength = 32)
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 32, message = "用户名长度需要在 3-32 字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名仅允许字母、数字、下划线")
    private String username;
    
    /**
     * 密码
     * <p>登录密码，服务端会进行加密存储</p>
     */
    @Schema(description = "登录密码", requiredMode = Schema.RequiredMode.REQUIRED, 
            format = "password", minLength = 8, maxLength = 64)
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度需要在 8-64 字符之间")
    private String password;
    
    /**
     * 邮箱
     */
    @Schema(description = "邮箱地址", example = "user@shinwa.com")
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
    @Schema(description = "显示名称/昵称", example = "新用户", maxLength = 64)
    @Size(max = 64, message = "昵称长度不能超过 64 字符")
    private String displayName;
    
    /**
     * 用户角色
     * <p>可选，默认为 USER</p>
     */
    @Schema(description = "用户角色（默认 USER）", example = "USER")
    private UserRole role;
    
    // ==================== Getters and Setters ====================
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
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
}
