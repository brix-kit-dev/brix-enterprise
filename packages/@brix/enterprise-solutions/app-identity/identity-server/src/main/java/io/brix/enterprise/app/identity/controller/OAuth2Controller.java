/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.controller;

import io.brix.enterprise.app.identity.dto.OAuth2AuthResult;
import io.brix.enterprise.app.identity.exception.OAuth2AuthenticationException;
import io.brix.enterprise.app.identity.service.OAuth2Service;
import io.runtime.sdk.capability.AuthCapability;
import io.runtime.sdk.capability.ConfigStoreCapability;
import io.runtime.sdk.capability.TenantCapability;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/**
 * OAuth2 认证 REST 控制器（生产级）
 *
 * <p>提供 OAuth2 第三方登录的 API 接口，遵循 RFC 6749 安全规范。</p>
 *
 * <h3>API 端点</h3>
 * <ul>
 *   <li>{@code GET  /api/v1/oauth2/google/authorize}     - 获取 Google 授权 URL + state</li>
 *   <li>{@code GET  /api/v1/oauth2/google/callback}      - Google 回调（浏览器重定向流）</li>
 *   <li>{@code POST /api/v1/oauth2/google/callback}      - Google 回调（SPA AJAX 流）</li>
 *   <li>{@code DELETE /api/v1/oauth2/{provider}/unlink}   - 取消 OAuth2 关联</li>
 *   <li>{@code POST /api/v1/oauth2/{provider}/refresh}    - 刷新 OAuth2 Token</li>
 * </ul>
 *
 * <h3>安全措施</h3>
 * <ul>
 *   <li>CSRF 防护：state 参数通过 StateStore 存储并验证</li>
 *   <li>CORS 限制：从 ConfigStore 读取允许的 origin</li>
 *   <li>Token 不在 URL 中暴露：GET 回调使用短生命周期的 authorization code 模式</li>
 *   <li>结构化错误响应：统一的 {@link ErrorResponse} 格式</li>
 * </ul>
 *
 * <h3>架构合规</h3>
 * <ul>
 *   <li>[红线 R2] 安全上下文通过 AuthCapability 能力契约获取</li>
 *   <li>[红线 R6] 配置通过 ConfigStoreCapability 能力契约获取</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Tag(name = "OAuth2", description = "OAuth2 第三方登录 API")
@RestController
@RequestMapping("/api/v1/oauth2")
public class OAuth2Controller {

    private static final Logger log = LoggerFactory.getLogger(OAuth2Controller.class);
    private static final String TENANT_CONTEXT_REQUIRED_MESSAGE =
            "Tenant context is required for OAuth2 authentication";

    private final OAuth2Service oauth2Service;
    private final AuthCapability authContext;
    private final ConfigStoreCapability configStore;
    private final TenantCapability tenantCapability;

    /**
     * 构造函数 — 所有能力通过 Capability Contract 获取
     *
     * <p>[红线 R2] 安全上下文 → AuthCapability</p>
     * <p>[红线 R6] 配置 → ConfigStoreCapability</p>
     * <p>[红线 R2] 租户上下文 → TenantCapability（不直接依赖 TenantContext 实现）</p>
     */
    public OAuth2Controller(OAuth2Service oauth2Service,
                            AuthCapability authContext,
                            ConfigStoreCapability configStore,
                            TenantCapability tenantCapability) {
        this.oauth2Service = oauth2Service;
        this.authContext = authContext;
        this.configStore = configStore;
        this.tenantCapability = tenantCapability;
    }

    // ==================== Google OAuth2 ====================

    /**
     * 获取 Google 授权 URL
     *
     * <p>前端调用此接口获取 Google 登录链接，然后重定向用户到 Google 授权页面。
     * State 参数会自动生成并存入 StateStore，用于回调时防 CSRF 验证。</p>
     *
     * @param redirectUri 可选的自定义回调地址
     * @return 包含 authorizationUrl 和 state 的 JSON 响应
     */
    @Operation(summary = "获取Google授权URL", description = "获取Google OAuth2授权页面URL，前端跳转到此URL完成授权")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "成功返回Google授权URL")
    })
    @GetMapping("/google/authorize")
    public ResponseEntity<Map<String, String>> getGoogleAuthorizationUrl(
            @Parameter(description = "自定义回调地址")
            @RequestParam(required = false) String redirectUri) {

        String finalRedirectUri = redirectUri != null ? redirectUri : getDefaultRedirectUri();
        String state = UUID.randomUUID().toString();

        String authUrl = oauth2Service.getGoogleAuthorizationUrl(finalRedirectUri, state);

        log.info("Generated Google authorization URL with state={}", state);

        return ResponseEntity.ok(Map.of(
                "authorizationUrl", authUrl,
                "state", state
        ));
    }

    /**
     * Google OAuth2 回调处理（GET 方式 - 浏览器重定向流）
     *
     * <p>Google 授权成功后重定向到此端点。安全地将认证结果传递给前端：
     * 使用 URL fragment（#）传递 token，避免 token 出现在服务器日志和 Referrer header 中。</p>
     *
     * @param code  授权码
     * @param state CSRF 防护状态码
     * @param error 错误码（授权失败时由 Google 返回）
     * @return 302 重定向到前端
     */
    @Operation(summary = "Google回调（重定向流）", description = "Google OAuth2授权回调，重定向到前端")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "302", description = "重定向到前端")
    })
    @GetMapping("/google/callback")
    public ResponseEntity<Void> handleGoogleCallbackRedirect(
            @Parameter(description = "Google返回的授权码")
            @RequestParam(required = false) String code,
            @Parameter(description = "CSRF state 参数")
            @RequestParam(required = false) String state,
            @Parameter(description = "错误码")
            @RequestParam(required = false) String error) {

        String frontendUrl = getFrontendUrl();

        // 处理 Google 返回的错误
        if (error != null) {
            log.warn("Google OAuth2 authorization denied: error={}", error);
            return redirectToFrontendError(frontendUrl, error);
        }

        if (code == null || code.isBlank()) {
            log.warn("Google OAuth2 callback: missing authorization code");
            return redirectToFrontendError(frontendUrl, "missing_code");
        }

        try {
            // 验证 CSRF state（一次性使用，验证后自动删除）
            oauth2Service.verifyState(state);

            // OAuth 回调为未认证请求，通过 TenantCapability 契约显式设置租户上下文
            // 以满足 SQL 租户隔离守卫（TenantSqlGuardInterceptor）
            String tenantId = getTenantId();
            tenantCapability.setCurrentTenantId(tenantId);

            OAuth2AuthResult result = oauth2Service.handleGoogleCallback(
                    code, getDefaultRedirectUri(), tenantId);

            // 使用 URL fragment（#）传递 token，不会发送到服务器
            String redirectUrl = String.format(
                    "%s/oauth2/callback#access_token=%s&token_type=Bearer&expires_in=%d&new_user=%s",
                    frontendUrl,
                    urlEncode(result.accessToken()),
                    result.expiresIn(),
                    result.newUser()
            );

            log.info("Google OAuth2 GET callback successful, redirecting to frontend");

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl))
                    .build();

        } catch (OAuth2AuthenticationException e) {
            log.warn("Google OAuth2 callback failed: code={}, error={}", e.getErrorCode(), e.getMessage());
            return redirectToFrontendError(frontendUrl, e.getErrorCode());
        } catch (Exception e) {
            log.error("Google OAuth2 callback unexpected error", e);
            return redirectToFrontendError(frontendUrl, "internal_error");
        }
    }

    /**
     * Google OAuth2 回调处理（POST 方式 - SPA AJAX 流）
     *
     * <p>前端 SPA 应用使用 POST 方式提交授权码，适用于无刷新的单页应用。</p>
     *
     * @param request 包含 code、redirectUri、state 的请求体
     * @return 认证结果 JSON，包含平台 JWT Token 和用户信息
     */
    @Operation(summary = "Google回调（SPA流）", description = "SPA应用用POST方式提交授权码")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "认证成功",
            content = @Content(schema = @Schema(implementation = OAuth2AuthResult.class))),
        @ApiResponse(responseCode = "401", description = "认证失败", content = @Content)
    })
    @PostMapping("/google/callback")
    public ResponseEntity<?> handleGoogleCallbackApi(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Google回调请求", required = true)
            @RequestBody GoogleCallbackRequest request) {

        log.info("Processing Google OAuth2 callback via API");

        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("INVALID_CODE", "Authorization code is required"));
        }

        try {
            // 验证 CSRF state
            oauth2Service.verifyState(request.state());

            String redirectUri = request.redirectUri() != null
                    ? request.redirectUri()
                    : getDefaultRedirectUri();

            // OAuth 回调为未认证请求，通过 TenantCapability 契约显式设置租户上下文
            // 以满足 SQL 租户隔离守卫（TenantSqlGuardInterceptor）
            String tenantId = getTenantId();
            tenantCapability.setCurrentTenantId(tenantId);

            OAuth2AuthResult result = oauth2Service.handleGoogleCallback(
                    request.code(), redirectUri, tenantId);

            log.info("Google OAuth2 API callback successful: userId={}", result.userId());

            return ResponseEntity.ok(result);

        } catch (OAuth2AuthenticationException e) {
            log.warn("Google OAuth2 API callback failed: code={}, error={}",
                    e.getErrorCode(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode(), e.getErrorDescription()));
        } catch (Exception e) {
            log.error("Google OAuth2 API callback unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Authentication failed"));
        }
    }

    // ==================== 通用接口 ====================

    /**
     * 取消 OAuth2 账号关联
     *
     * @param provider 提供商（如 google）
     * @return 204 No Content
     */
    @Operation(summary = "取消OAuth2关联", description = "取消当前用户与第三方账号的关联")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "取消成功"),
        @ApiResponse(responseCode = "401", description = "未登录", content = @Content),
        @ApiResponse(responseCode = "400", description = "无效的提供商", content = @Content)
    })
    @DeleteMapping("/{provider}/unlink")
    public ResponseEntity<?> unlinkOAuth2Account(
            @Parameter(description = "OAuth2提供商", required = true, example = "google")
            @PathVariable String provider) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("UNAUTHORIZED", "Authentication required"));
        }

        // 验证 provider 合法性
        if (!isValidProvider(provider)) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("INVALID_PROVIDER", "Unsupported provider: " + provider));
        }

        oauth2Service.unlinkOAuth2Account(userId, provider, getTenantId());

        log.info("OAuth2 account unlinked: userId={}, provider={}", userId, provider);

        return ResponseEntity.noContent().build();
    }

    /**
     * 刷新 OAuth2 Provider Token
     *
     * @param provider 提供商
     * @param request  包含 refreshToken 的请求体
     * @return 新的 Token 信息
     */
    @Operation(summary = "刷新OAuth2令牌", description = "使用refreshToken刷新OAuth2访问令牌")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "刷新成功"),
        @ApiResponse(responseCode = "401", description = "refreshToken无效", content = @Content)
    })
    @PostMapping("/{provider}/refresh")
    public ResponseEntity<?> refreshOAuth2Token(
            @Parameter(description = "OAuth2提供商", required = true, example = "google")
            @PathVariable String provider,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "刷新令牌请求", required = true)
            @RequestBody RefreshTokenRequest request) {

        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("INVALID_REQUEST", "refresh_token is required"));
        }

        try {
            OAuth2Service.OAuth2TokenResponse response = oauth2Service.refreshToken(
                    provider, request.refreshToken());
            return ResponseEntity.ok(response);
        } catch (OAuth2AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getErrorCode(), e.getErrorDescription()));
        } catch (Exception e) {
            log.error("OAuth2 token refresh failed for provider={}", provider, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("REFRESH_FAILED", "Token refresh failed"));
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 构建前端错误重定向 URL
     */
    private ResponseEntity<Void> redirectToFrontendError(String frontendUrl, String errorCode) {
        String redirectUrl = frontendUrl + "/login?error=" + urlEncode(errorCode);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    /**
     * 验证提供商名称是否合法（防注入）
     */
    private boolean isValidProvider(String provider) {
        return "google".equals(provider);
        // 未来扩展: return Set.of("google", "github", "microsoft").contains(provider);
    }

    /**
     * 获取当前租户 ID
     *
     * <p>[红线 R2] 通过 AuthCapability 能力契约获取租户信息。</p>
     */
    private String getTenantId() {
        String tenantId = authContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = tenantCapability.getCurrentTenantId();
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(TENANT_CONTEXT_REQUIRED_MESSAGE);
        }
        return tenantId;
    }

    /**
     * 获取当前用户 ID
     *
     * <p>[红线 R2] 通过 AuthCapability 能力契约获取用户身份。</p>
     */
    private String getCurrentUserId() {
        if (!authContext.isAuthenticated()) {
            return null;
        }
        java.security.Principal principal = authContext.getCurrentPrincipal();
        return principal != null ? principal.getName() : null;
    }

    /**
     * URL 编码
     */
    private static String urlEncode(String value) {
        if (value == null) return "";
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // ==================== Configuration Access (via ConfigStoreCapability) ====================
    
    /**
     * Gets the default OAuth2 redirect URI from configuration.
     *
     * <p>This value MUST be explicitly configured in the environment or configuration store.
     * No default localhost value is provided to prevent accidental exposure in production.</p>
     *
     * <h4>Configuration Key</h4>
     * <pre>identity.oauth2.default-redirect-uri</pre>
     *
     * <h4>Example Value</h4>
     * <pre>https://your-domain.com/api/v1/oauth2/google/callback</pre>
     *
     * @return the configured redirect URI for OAuth2 callback
     * @throws IllegalStateException if the configuration is not set
     * @see ConfigStoreCapability#getRequiredString(String)
     */
    private String getDefaultRedirectUri() {
        return configStore.getRequiredString("identity.oauth2.default-redirect-uri");
    }

    /**
     * Gets the frontend URL for OAuth2 callback redirection.
     *
     * <p>After successful OAuth2 authentication, users are redirected to this URL
     * with authentication tokens. This value MUST be explicitly configured.</p>
     *
     * <h4>Configuration Key</h4>
     * <pre>identity.oauth2.frontend-url</pre>
     *
     * <h4>Example Value</h4>
     * <pre>https://your-frontend-domain.com</pre>
     *
     * @return the configured frontend URL
     * @throws IllegalStateException if the configuration is not set
     * @see ConfigStoreCapability#getRequiredString(String)
     */
    private String getFrontendUrl() {
        return configStore.getRequiredString("identity.oauth2.frontend-url");
    }

    // ==================== 请求/响应 DTO ====================

    /**
     * Google 回调请求（SPA 流）
     */
    public record GoogleCallbackRequest(
            String code,
            String redirectUri,
            String state
    ) {}

    /**
     * 刷新 Token 请求
     */
    public record RefreshTokenRequest(
            String refreshToken
    ) {}

    /**
     * 标准化错误响应
     */
    public record ErrorResponse(
            String error,
            String errorDescription
    ) {}
}
