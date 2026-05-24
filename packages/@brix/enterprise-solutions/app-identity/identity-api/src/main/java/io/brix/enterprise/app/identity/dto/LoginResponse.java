/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Collections;
import java.util.List;

/**
 * 登录响应 DTO
 * 
 * <p>封装登录成功后返回的信息，包含 JWT Token 和用户基本信息。</p>
 * <p>按照 v3.0.9 蓝图契约，包含 roles 和 permissions 列表，
 * 与前端 AuthCapability 契约对齐。</p>
 *
 * <h3>Phase 2 双轨扩展</h3>
 * <p>新增 {@code step} 字段支持多步登录流程：</p>
 * <ul>
 *   <li>{@code COMPLETE} — 已完成认证（单租户 / 自动选择），返回 accessToken</li>
 *   <li>{@code SELECT_TENANT} — 需要用户选择租户，返回 identityToken + tenants 列表</li>
 * </ul>
 *
 * @since 3.2.0 新增 step / identityToken / tenants 字段
 * @deprecated Since 3.2.0 — 由 {@code io.brix.platform.auth.web.dto.LoginResponseDto}（platform-auth-web）取代。
 *     仅服务于已废弃的 {@code AuthService}。将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Schema(description = "登录响应结果")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    /** 登录步骤：完成 — 直接返回 Access Token。 */
    public static final String STEP_COMPLETE = "COMPLETE";

    /** 登录步骤：需要选择租户 — 返回 Identity Token + 租户列表。 */
    public static final String STEP_SELECT_TENANT = "SELECT_TENANT";

    @Schema(description = "登录步骤: COMPLETE 或 SELECT_TENANT", example = "COMPLETE")
    private String step;

    @Schema(description = "身份令牌（仅 SELECT_TENANT 步骤返回，5 分钟有效期）")
    private String identityToken;

    @Schema(description = "可选租户列表（仅 SELECT_TENANT 步骤返回）")
    private List<TenantOptionDTO> tenants;
    
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
    
    @Schema(description = "邮箱", example = "admin@brix.io")
    private String email;
    
    @Schema(description = "用户角色（主角色，向后兼容）", example = "ADMIN")
    private String role;
    
    @Schema(description = "角色列表", example = "[\"ADMIN\", \"USER\"]")
    private List<String> roles;
    
    @Schema(description = "权限列表", example = "[\"booking:read\", \"booking:write\"]")
    private List<String> permissions;

    @Schema(description = "是否需要在本次会话内强制修改密码（Bootstrap / 管理员重置 / 到期轮换场景）",
            example = "false")
    private Boolean mustChangePassword;

    @Schema(description = "是否需要多因素认证挑战（仅在平台管理员与开启 MFA 的账号上为 true）", example = "false")
    private Boolean mfaRequired;

    public LoginResponse() {}

    /**
     * 创建「需要选择租户」的响应（Phase 2 多步登录第一阶段）。
     *
     * @param identityToken 身份令牌（5 分钟有效期）
     * @param tenants       可选租户列表
     * @return 包含租户列表的登录响应
     * @since 3.2.0
     */
    public static LoginResponse selectTenant(String identityToken, List<TenantOptionDTO> tenants) {
        LoginResponse resp = new LoginResponse();
        resp.step = STEP_SELECT_TENANT;
        resp.identityToken = identityToken;
        resp.tenants = tenants;
        resp.tokenType = "Bearer";
        return resp;
    }
    
    public static LoginResponse of(String accessToken, String refreshToken, long expiresIn,
                                    String userId, String username, String displayName, 
                                    String email, String role) {
        return of(accessToken, refreshToken, expiresIn, userId, username, displayName,
                  email, role, role != null ? List.of(role) : Collections.emptyList(),
                  Collections.emptyList());
    }
    
    public static LoginResponse of(String accessToken, String refreshToken, long expiresIn,
                                    String userId, String username, String displayName, 
                                    String email, String role, List<String> roles,
                                    List<String> permissions) {
        LoginResponse resp = new LoginResponse();
        resp.step = STEP_COMPLETE;
        resp.accessToken = accessToken;
        resp.refreshToken = refreshToken;
        resp.tokenType = "Bearer";
        resp.expiresIn = expiresIn;
        resp.userId = userId;
        resp.username = username;
        resp.displayName = displayName;
        resp.email = email;
        resp.role = role;
        resp.roles = roles != null ? roles : Collections.emptyList();
        resp.permissions = permissions != null ? permissions : Collections.emptyList();
        return resp;
    }

    // --- Phase 2 dual-track fields ---

    public String getStep() { return step; }
    public void setStep(String step) { this.step = step; }

    public String getIdentityToken() { return identityToken; }
    public void setIdentityToken(String identityToken) { this.identityToken = identityToken; }

    public List<TenantOptionDTO> getTenants() { return tenants; }
    public void setTenants(List<TenantOptionDTO> tenants) { this.tenants = tenants; }

    // --- existing fields ---
    
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

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    // --- Phase 3 (S2) authentication-flow signals (additive, all fields nullable
    // so that JsonInclude.NON_NULL omits them when not applicable) ---

    public Boolean getMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public Boolean getMfaRequired() { return mfaRequired; }
    public void setMfaRequired(Boolean mfaRequired) { this.mfaRequired = mfaRequired; }
}
