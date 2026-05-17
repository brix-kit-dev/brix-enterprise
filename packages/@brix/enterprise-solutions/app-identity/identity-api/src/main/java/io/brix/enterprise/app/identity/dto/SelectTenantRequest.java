/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 租户选择请求 DTO。
 *
 * <p>多租户用户在登录第二阶段提交目标租户选择。
 * 需搭配 Identity Token（Authorization: Bearer）使用。
 *
 * @author Brix Platform Team
 * @since 3.2.0
 * @deprecated Since 3.2.0 — 由 {@code io.brix.platform.auth.web.dto.SelectTenantRequestDto}
 *     （platform-auth-web）取代。将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Schema(description = "租户选择请求参数")
public class SelectTenantRequest {

    @Schema(description = "目标租户 ID", requiredMode = Schema.RequiredMode.REQUIRED, example = "1234567890")
    private String tenantId;

    @Schema(description = "记住选择（设备记忆）", example = "true")
    private Boolean rememberChoice;

    public SelectTenantRequest() {}

    public SelectTenantRequest(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public Boolean getRememberChoice() { return rememberChoice; }
    public void setRememberChoice(Boolean rememberChoice) { this.rememberChoice = rememberChoice; }
}
