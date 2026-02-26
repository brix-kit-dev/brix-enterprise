/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.controller;

import com.shinwa.app.identity.dto.LoginRequest;
import com.shinwa.app.identity.dto.LoginResponse;
import com.shinwa.app.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 认证控制器
 * 
 * <p>提供用户登录 API 端点。</p>
 * 
 * <h3>API 端点</h3>
 * <ul>
 *   <li>POST /api/auth/login - 用户名密码登录</li>
 * </ul>
 */
@Tag(name = "Auth", description = "用户认证 API")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    /**
     * 用户名密码登录
     * 
     * <p>返回格式与 platform-auth-web 前端契约一致：</p>
     * <pre>{ success, user: { id, username, email, name, role, provider }, token, refreshToken }</pre>
     * 
     * @param request 登录请求（username, password）
     * @return JWT Token 和用户信息
     */
    @Operation(summary = "用户名密码登录", description = "使用用户名和密码进行认证，返回 JWT Token 和用户信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "登录成功，返回 Token 和用户信息"),
        @ApiResponse(responseCode = "401", description = "认证失败，用户名或密码错误", content = @Content),
        @ApiResponse(responseCode = "500", description = "服务器内部错误", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "登录请求参数", required = true,
                content = @Content(schema = @Schema(implementation = LoginRequest.class)))
            @RequestBody LoginRequest request) {
        try {
            LoginResponse lr = authService.login(request);
            
            // 构建前端期望的 user 对象
            Map<String, Object> user = new LinkedHashMap<>();
            user.put("id", lr.getUserId());
            user.put("username", lr.getUsername());
            user.put("email", lr.getEmail());
            user.put("name", lr.getDisplayName());
            user.put("role", lr.getRole());
            user.put("provider", "local");
            
            // 返回 platform-auth-web 期望的格式
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("user", user);
            body.put("token", lr.getAccessToken());
            body.put("refreshToken", lr.getRefreshToken());
            
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        } catch (Exception e) {
            log.error("[Auth] Login error", e);
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "success", false,
                            "message", "登录服务异常，请稍后重试"
                    ));
        }
    }
}
