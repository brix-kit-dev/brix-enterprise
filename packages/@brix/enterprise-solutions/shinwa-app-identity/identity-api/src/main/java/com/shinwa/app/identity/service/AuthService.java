/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service;

import com.shinwa.app.identity.dto.LoginRequest;
import com.shinwa.app.identity.dto.LoginResponse;

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
 * <p>从 identity-core 迁移到 identity-api，修正层次错位。</p>
 *
 * @author Shinwa Team
 * @since 3.0.0
 * @see com.shinwa.app.identity.dto.LoginRequest
 * @see com.shinwa.app.identity.dto.LoginResponse
 */
public interface AuthService {
    
    /**
     * 用户名密码登录
     *
     * <p>验证用户凭据并签发 JWT Token。</p>
     *
     * @param request 登录请求，包含用户名和密码
     * @return 登录响应，包含 JWT Token 和用户信息
     * @throws IllegalArgumentException 如果用户名或密码错误
     */
    LoginResponse login(LoginRequest request);
}
