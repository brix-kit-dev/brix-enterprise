/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

/**
 * Google OAuth2 用户信息 DTO
 * 
 * <p>从 Google ID Token 或 UserInfo 端点解析的用户信息。</p>
 * 
 * @see <a href="https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation">
 *      Google OpenID Connect - Obtaining user profile information</a>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
public record GoogleUserInfo(
    /**
     * Google 用户唯一标识（sub claim）
     * <p>格式如: "114264952847842963234"</p>
     */
    String sub,
    
    /**
     * 用户邮箱
     */
    String email,
    
    /**
     * 邮箱是否已验证
     */
    Boolean emailVerified,
    
    /**
     * 用户全名
     */
    String name,
    
    /**
     * 头像 URL
     */
    String picture,
    
    /**
     * 名（given_name）
     */
    String givenName,
    
    /**
     * 姓（family_name）
     */
    String familyName,
    
    /**
     * 语言区域
     */
    String locale
) {
    /**
     * 从 JSON Map 构造
     */
    public static GoogleUserInfo fromMap(java.util.Map<String, Object> claims) {
        return new GoogleUserInfo(
            (String) claims.get("sub"),
            (String) claims.get("email"),
            (Boolean) claims.get("email_verified"),
            (String) claims.get("name"),
            (String) claims.get("picture"),
            (String) claims.get("given_name"),
            (String) claims.get("family_name"),
            (String) claims.get("locale")
        );
    }
}
