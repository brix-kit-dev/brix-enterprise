/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service;

import com.shinwa.app.identity.dto.GoogleUserInfo;
import com.shinwa.app.identity.dto.OAuth2AuthResult;

/**
 * OAuth2 认证服务接口
 * 
 * <p>处理 OAuth2 第三方登录的核心业务契约。</p>
 * 
 * <h3>支持的 OAuth2 提供商</h3>
 * <ul>
 *   <li>Google - OpenID Connect</li>
 *   <li>（预留）GitHub、Microsoft、Facebook 等</li>
 * </ul>
 * 
 * <h3>架构说明</h3>
 * <ul>
 *   <li>此接口定义在 identity-api 层，确保契约与实现分离</li>
 *   <li>实现类位于 identity-core 层</li>
 *   <li>上层模块（如 identity-server）仅依赖此接口</li>
 * </ul>
 * 
 * <h3>最佳实践</h3>
 * <ul>
 *   <li>遵循 OAuth 2.0 Authorization Code Flow</li>
 *   <li>使用 PKCE 增强安全性（公开客户端）</li>
 *   <li>验证 ID Token 的签名和 claims</li>
 *   <li>支持账号关联（同一邮箱自动关联）</li>
 * </ul>
 * 
 * <h3>v3.2 重构说明</h3>
 * <p>从 identity-core 迁移到 identity-api，修正层次错位。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public interface OAuth2Service {
    
    /**
     * 生成 Google OAuth2 授权 URL
     *
     * @param redirectUri 回调地址
     * @param state       CSRF 防护状态码
     * @return 授权 URL
     */
    String getGoogleAuthorizationUrl(String redirectUri, String state);
    
    /**
     * 处理 Google OAuth2 回调
     * 
     * <p>业务流程：</p>
     * <ol>
     *   <li>用授权码换取 Token</li>
     *   <li>验证 ID Token 获取用户信息</li>
     *   <li>查找或创建用户</li>
     *   <li>创建/更新 OAuth2 账号关联</li>
     *   <li>签发平台 JWT Token</li>
     * </ol>
     *
     * @param code        授权码
     * @param redirectUri 回调地址（需与授权请求一致）
     * @param tenantId    租户ID
     * @return 认证结果
     */
    OAuth2AuthResult handleGoogleCallback(String code, String redirectUri, String tenantId);
    
    /**
     * 验证 Google ID Token
     *
     * @param idToken ID Token 字符串
     * @return Google 用户信息
     * @throws IllegalArgumentException 如果 Token 无效
     */
    GoogleUserInfo verifyGoogleIdToken(String idToken);
    
    /**
     * 验证 OAuth2 State 参数（CSRF 防护）
     *
     * <p>验证 state 是否与授权请求时生成的一致，验证后立即从缓存中删除（一次性使用）。</p>
     *
     * @param state 回调中携带的 state 参数
     * @throws com.shinwa.app.identity.exception.OAuth2AuthenticationException 如果验证失败
     */
    void verifyState(String state);
    
    /**
     * 刷新 OAuth2 Token
     *
     * @param provider     提供商
     * @param refreshToken Refresh Token
     * @return 新的 Token 信息
     */
    OAuth2TokenResponse refreshToken(String provider, String refreshToken);
    
    /**
     * 取消 OAuth2 账号关联
     *
     * @param userId   用户ID
     * @param provider 提供商
     * @param tenantId 租户ID
     */
    void unlinkOAuth2Account(String userId, String provider, String tenantId);
    
    /**
     * OAuth2 Token 响应
     * 
     * <p>封装 OAuth2 Token 刷新响应数据。</p>
     *
     * @param accessToken  访问令牌
     * @param refreshToken 刷新令牌
     * @param idToken      ID 令牌（OpenID Connect）
     * @param expiresIn    过期时间（秒）
     * @param scope        授权范围
     */
    record OAuth2TokenResponse(
        String accessToken,
        String refreshToken,
        String idToken,
        long expiresIn,
        String scope
    ) {}
}
