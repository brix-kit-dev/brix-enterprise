/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service.impl;

import com.shinwa.app.identity.dto.LoginRequest;
import com.shinwa.app.identity.dto.LoginResponse;
import com.shinwa.app.identity.entity.User;
import com.shinwa.app.identity.repository.UserRepository;
import com.shinwa.app.identity.service.AuthService;
import com.shinwa.app.identity.service.PasswordHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证服务实现
 * 
 * <p>提供用户名密码登录功能，验证成功后签发 RS256 JWT Token。</p>
 */
@Service
public class AuthServiceImpl implements AuthService {
    
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    
    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final JwtTokenService jwtTokenService;
    
    public AuthServiceImpl(UserRepository userRepository, 
                           PasswordHasher passwordHasher,
                           JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.jwtTokenService = jwtTokenService;
    }
    
    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String tenantId = request.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "default";
        }
        
        // 1. 查找用户
        User user = userRepository.findByUsernameAndTenantId(request.getUsername(), tenantId)
                .orElse(null);
        
        // 如果用户名未找到，尝试用邮箱登录
        if (user == null) {
            user = userRepository.findByEmailAndTenantId(request.getUsername(), tenantId)
                    .orElse(null);
        }
        
        if (user == null) {
            log.warn("[Auth] Login failed - user not found: {}", request.getUsername());
            throw new IllegalArgumentException("用户名或密码错误");
        }
        
        // 2. 检查用户状态
        if (!user.canLogin()) {
            log.warn("[Auth] Login failed - user status not active: {} ({})", 
                     request.getUsername(), user.getStatus());
            throw new IllegalArgumentException("账号已禁用或已锁定，请联系管理员");
        }
        
        // 3. 验证密码
        if (!passwordHasher.verify(request.getPassword(), user.getPasswordHash())) {
            log.warn("[Auth] Login failed - wrong password for user: {}", request.getUsername());
            throw new IllegalArgumentException("用户名或密码错误");
        }
        
        // 4. 记录登录时间
        user.recordLogin();
        userRepository.save(user);
        
        // 5. 签发 JWT Token
        String accessToken = jwtTokenService.generateToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);
        
        log.info("[Auth] Login successful: user={}, userId={}", 
                 user.getUsername(), user.getId());
        
        return LoginResponse.of(
                accessToken,
                refreshToken,
                jwtTokenService.getExpirationSeconds(),
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : "USER"
        );
    }
}
