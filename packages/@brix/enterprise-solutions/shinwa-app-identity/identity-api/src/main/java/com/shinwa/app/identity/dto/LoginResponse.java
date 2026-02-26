/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 登录响应 DTO
 * 
 * <p>封装登录成功后返回的信息，包含 JWT Token 和用户基本信息。</p>
 */
@Schema(description = "登录响应结果")
public class LoginResponse {
    
    @Schema(description = "访问令牌（JWT）", example = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;
    
    @Schema(description = "刷新令牌", example = "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...")
    private String refreshToken;
    
    @Schema(description = "令牌类型", example = "Bearer")
    private String tokenType;
    
    @Schema(description = "过期时间（秒）", example = "3600")
    private long expiresIn;
    
    @Schema(description = "用户ID", example = "U20260128001")
    private String userId;
    
    @Schema(description = "用户名", example = "admin")
    private String username;
    
    @Schema(description = "显示名称", example = "管理员")
    private String displayName;
    
    @Schema(description = "邮箱", example = "admin@shinwa.com")
    private String email;
    
    @Schema(description = "用户角色", example = "ADMIN")
    private String role;
    
    public LoginResponse() {}
    
    public static LoginResponse of(String accessToken, String refreshToken, long expiresIn,
                                    String userId, String username, String displayName, 
                                    String email, String role) {
        LoginResponse resp = new LoginResponse();
        resp.accessToken = accessToken;
        resp.refreshToken = refreshToken;
        resp.tokenType = "Bearer";
        resp.expiresIn = expiresIn;
        resp.userId = userId;
        resp.username = username;
        resp.displayName = displayName;
        resp.email = email;
        resp.role = role;
        return resp;
    }
    
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
