/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 可选租户信息 DTO。
 *
 * <p>在登录第一阶段（多租户用户场景）中,
 * 将用户所属的全部活跃租户以列表形式返回,
 * 供用户选择目标租户。
 *
 * @author Brix Platform Team
 * @since 3.2.0
 * @deprecated Since 3.2.0 — 由 {@code io.brix.platform.auth.web.dto.TenantOptionDto}
 *     （platform-auth-web）取代。将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Schema(description = "可选租户选项")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TenantOptionDTO {

    @Schema(description = "租户 ID", example = "1234567890")
    private String tenantId;

    @Schema(description = "租户编码", example = "acme-corp")
    private String tenantCode;

    @Schema(description = "租户名称", example = "Acme Corporation")
    private String tenantName;

    @Schema(description = "角色类型: actor 或 subject", example = "actor")
    private String roleType;

    @Schema(description = "角色类型标签: B端成员 或 C端主体", example = "B端成员")
    private String roleTypeLabel;

    @Schema(description = "具体角色: OWNER/ADMIN/MEMBER (actor) 或 CUSTOMER/GUEST (subject)", example = "ADMIN")
    private String role;

    @Schema(description = "最近访问时间（ISO 8601）", example = "2025-03-15T08:30:00Z")
    private String lastAccessAt;

    public TenantOptionDTO() {}

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getTenantCode() { return tenantCode; }
    public void setTenantCode(String tenantCode) { this.tenantCode = tenantCode; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }

    public String getRoleTypeLabel() { return roleTypeLabel; }
    public void setRoleTypeLabel(String roleTypeLabel) { this.roleTypeLabel = roleTypeLabel; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getLastAccessAt() { return lastAccessAt; }
    public void setLastAccessAt(String lastAccessAt) { this.lastAccessAt = lastAccessAt; }
}
