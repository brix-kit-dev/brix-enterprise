/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.dto;

/**
 * OAuth2 认证结果 DTO
 * 
 * <p>OAuth2 登录/注册成功后返回的结果。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public record OAuth2AuthResult(
    /**
     * 是否是新用户（首次通过 OAuth2 登录）
     */
    boolean newUser,
    
    /**
     * 用户ID
     */
    String userId,
    
    /**
     * 用户名
     */
    String username,
    
    /**
     * 邮箱
     */
    String email,
    
    /**
     * 显示名称
     */
    String displayName,
    
    /**
     * 头像URL
     */
    String avatarUrl,
    
    /**
     * 平台签发的 JWT Access Token
     */
    String accessToken,
    
    /**
     * 平台签发的 Refresh Token
     */
    String refreshToken,
    
    /**
     * Access Token 过期时间（秒）
     */
    long expiresIn
) {}
