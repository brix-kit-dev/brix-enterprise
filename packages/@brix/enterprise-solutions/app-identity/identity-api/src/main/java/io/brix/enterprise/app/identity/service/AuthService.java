/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service;

import io.brix.enterprise.app.identity.dto.LoginRequest;
import io.brix.enterprise.app.identity.dto.LoginResponse;
import io.brix.enterprise.app.identity.dto.RefreshTokenRequest;
import io.brix.enterprise.app.identity.dto.SelectTenantRequest;

/**
 * 认证服务接口
 * 
 * <p>定义平台认证相关的核心业务契约。</p>
 * 
 * <h3>架构说明</h3>
 * <ul>
 *   <li>此接口定义在 identity-api 层，确保契约与实现分离</li>
 *   <li>实现类位于 identity-core 层</li>
 *   <li>上层模块（如 identity-server）仅依赖此接口</li>
 * </ul>
 * 
 * <h3>v3.2 重构说明</h3>
 * <p>从 identity-core 迁移到 identity-api，修正层次错位。
 * Phase 2 新增 {@link #selectTenant} 和 {@link #refreshToken} 方法，
 * 支持双轨认证体系。</p>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @see io.brix.enterprise.app.identity.dto.LoginRequest
 * @see io.brix.enterprise.app.identity.dto.LoginResponse
 * @deprecated Since 3.2.0 — D3 已删除消费方 {@code AuthController}。认证流程契约迁移到 Layer 2A
 *     {@code io.runtime.sdk.capability.AuthFlowCapability}，HTTP 表面由 {@code platform-auth-web}
 *     的 {@code AuthController} 暴露。本接口将在 4.0.0 与 legacy JWT/DTO 契约一同移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
public interface AuthService {
    
    /**
     * 用户名密码登录（多租户双轨）。
     *
     * <p>Phase 2 新流程：</p>
     * <ol>
     *   <li>若 {@code request.tenantId} 非空 — 走向后兼容的单租户路径</li>
     *   <li>若 {@code request.tenantId} 为空 — 通过 sys_identity 全局验证，
     *       查询活跃的 membership + principalship：
     *       <ul>
     *         <li>只有一个租户角色 → 自动选择，返回 {@code step=COMPLETE}</li>
     *         <li>多个租户角色 → 签发 Identity Token，
     *             返回 {@code step=SELECT_TENANT} + 租户列表</li>
     *       </ul>
     *   </li>
     * </ol>
     *
     * @param request 登录请求，包含用户名/邮箱和密码
     * @return 登录响应（COMPLETE 或 SELECT_TENANT）
     * @throws IllegalArgumentException 如果用户名或密码错误
     */
    LoginResponse login(LoginRequest request);

    /**
     * 选择租户（多步登录第二阶段）。
     *
     * <p>调用方（Controller）负责验证 Identity Token 并提取身份 ID。
     * 此方法根据已验证的身份 ID 和用户选择的租户签发完整 Access Token。</p>
     *
     * @param identityId 从 Identity Token 中提取的全局身份 ID（sys_identity.id）
     * @param request    租户选择请求，包含目标租户 ID
     * @return 包含 Access Token 的完整登录响应（step=COMPLETE）
     * @throws IllegalArgumentException 如果身份不存在或租户不可访问
     * @since 3.2.0
     */
    LoginResponse selectTenant(Long identityId, SelectTenantRequest request);

    /**
     * 刷新令牌。
     *
     * <p>使用 Refresh Token 换取新的 Access Token + Refresh Token。
     * 实现令牌家族旋转机制，检测重放攻击。</p>
     *
     * @param request 包含刷新令牌的请求
     * @return 包含新令牌对的登录响应
     * @throws IllegalArgumentException 如果刷新令牌无效或已过期
     * @since 3.2.0
     */
    LoginResponse refreshToken(RefreshTokenRequest request);
}
