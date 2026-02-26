/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.exception;

/**
 * OAuth2 认证异常
 * 
 * <p>OAuth2 认证流程中发生的业务异常，包含结构化错误码和描述信息。</p>
 *
 * <h3>错误码规范</h3>
 * <ul>
 *   <li>{@code INVALID_STATE} - CSRF state 校验失败</li>
 *   <li>{@code INVALID_CODE} - 授权码无效或已过期</li>
 *   <li>{@code TOKEN_EXCHANGE_FAILED} - 用授权码换取 Token 失败</li>
 *   <li>{@code INVALID_ID_TOKEN} - ID Token 验证失败</li>
 *   <li>{@code USER_DISABLED} - 用户已被禁用</li>
 *   <li>{@code PROVIDER_ERROR} - 第三方提供商返回错误</li>
 *   <li>{@code INTERNAL_ERROR} - 内部错误</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
public class OAuth2AuthenticationException extends RuntimeException {

    private final String errorCode;
    private final String errorDescription;

    public OAuth2AuthenticationException(String errorCode, String errorDescription) {
        super(errorDescription);
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
    }

    public OAuth2AuthenticationException(String errorCode, String errorDescription, Throwable cause) {
        super(errorDescription, cause);
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorDescription() {
        return errorDescription;
    }

    // ==================== 工厂方法 ====================

    public static OAuth2AuthenticationException invalidState() {
        return new OAuth2AuthenticationException("INVALID_STATE",
                "CSRF state validation failed. The state parameter does not match.");
    }

    public static OAuth2AuthenticationException invalidCode() {
        return new OAuth2AuthenticationException("INVALID_CODE",
                "Authorization code is missing or invalid.");
    }

    public static OAuth2AuthenticationException tokenExchangeFailed(String detail) {
        return new OAuth2AuthenticationException("TOKEN_EXCHANGE_FAILED",
                "Failed to exchange authorization code for tokens: " + detail);
    }

    public static OAuth2AuthenticationException invalidIdToken(String detail) {
        return new OAuth2AuthenticationException("INVALID_ID_TOKEN",
                "Google ID token verification failed: " + detail);
    }

    public static OAuth2AuthenticationException userDisabled(String userId) {
        return new OAuth2AuthenticationException("USER_DISABLED",
                "User account is disabled: " + userId);
    }

    public static OAuth2AuthenticationException providerError(String provider, String error) {
        return new OAuth2AuthenticationException("PROVIDER_ERROR",
                "OAuth2 provider '" + provider + "' returned error: " + error);
    }

    public static OAuth2AuthenticationException internalError(String detail, Throwable cause) {
        return new OAuth2AuthenticationException("INTERNAL_ERROR",
                "Internal authentication error: " + detail, cause);
    }
}
