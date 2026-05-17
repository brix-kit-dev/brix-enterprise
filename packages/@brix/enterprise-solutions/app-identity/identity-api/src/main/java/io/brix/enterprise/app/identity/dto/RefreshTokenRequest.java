/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 令牌刷新请求 DTO。
 *
 * @author Brix Platform Team
 * @since 3.2.0
 * @deprecated Since 3.2.0 — 由 {@code io.brix.platform.auth.web.dto.RefreshTokenRequestDto}
 *     （platform-auth-web）取代。OAuth2Controller 内部使用其自身的嵌套 record，不依赖此类。
 *     将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Schema(description = "令牌刷新请求参数")
public class RefreshTokenRequest {

    @Schema(description = "刷新令牌值", requiredMode = Schema.RequiredMode.REQUIRED)
    private String refreshToken;

    public RefreshTokenRequest() {}

    public RefreshTokenRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
