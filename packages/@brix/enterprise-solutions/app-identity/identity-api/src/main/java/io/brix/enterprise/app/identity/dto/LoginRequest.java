/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 登录请求 DTO
 *
 * <p>封装用户名密码登录的请求参数。</p>
 *
 * @deprecated Since 3.2.0 — 由 {@code io.brix.platform.auth.web.dto.LoginRequestDto}（platform-auth-web）取代。
 *     仅服务于已废弃的 {@code AuthService}。将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Schema(description = "登录请求参数")
public class LoginRequest {
    
    @Schema(description = "用户名", requiredMode = Schema.RequiredMode.REQUIRED, example = "admin")
    private String username;
    
    @Schema(description = "密码", requiredMode = Schema.RequiredMode.REQUIRED, example = "password123", format = "password")
    private String password;
    
    @Schema(description = "租户ID（可选）", example = "tenant-001")
    private String tenantId;
    
    @Schema(description = "记住我",  example = "false")
    private Boolean rememberMe;
    
    public LoginRequest() {}
    
    public LoginRequest(String username, String password, String tenantId) {
        this.username = username;
        this.password = password;
        this.tenantId = tenantId;
    }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    
    public Boolean getRememberMe() { return rememberMe; }
    public void setRememberMe(Boolean rememberMe) { this.rememberMe = rememberMe; }
}
