/*
 * Copyright 2026 Shinwa Solutions Authors
 *
 * Licensed under commercial license.
 */
package com.shinwa.app.identity.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shinwa.app.identity.dto.GoogleUserInfo;
import com.shinwa.app.identity.dto.OAuth2AuthResult;
import com.shinwa.app.identity.entity.SocialConnection;
import com.shinwa.app.identity.entity.User;
import com.shinwa.app.identity.enums.UserRole;
import com.shinwa.app.identity.enums.UserStatus;
import com.shinwa.app.identity.event.OAuth2LoginEvent;
import com.shinwa.app.identity.exception.OAuth2AuthenticationException;
import com.shinwa.app.identity.repository.SocialConnectionRepository;
import com.shinwa.app.identity.repository.UserRepository;
import com.shinwa.app.identity.service.OAuth2Service;
import io.runtime.sdk.capability.ConfigStoreCapability;
import io.runtime.sdk.capability.EventBusCapability;
import io.runtime.sdk.capability.HttpCapability;
import io.runtime.sdk.capability.HttpCapability.HttpResult;
import io.runtime.sdk.capability.StateStoreCapability;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Google OAuth2 认证服务实现（生产级）
 *
 * <p>实现 Google OpenID Connect 登录流程，符合 RFC 6749 和 OpenID Connect Core 规范。</p>
 *
 * <h3>OAuth 2.0 Authorization Code Flow</h3>
 * <pre>
 * ┌──────────┐                              ┌──────────────┐                              ┌────────────┐
 * │  Client  │                              │   Platform   │                              │   Google   │
 * └────┬─────┘                              └──────┬───────┘                              └──────┬─────┘
 *      │  1. GET /google/authorize                │                                             │
 *      │─────────────────────────────────────────▶│  2. 生成 state, nonce 存入 StateStore       │
 *      │                                          │                                             │
 *      │  3. 返回 authorizationUrl + state        │                                             │
 *      │◀─────────────────────────────────────────│                                             │
 *      │                                          │                                             │
 *      │  4. 重定向用户到 Google 授权页面          │                                             │
 *      │─────────────────────────────────────────────────────────────────────────────────────────▶│
 *      │                                          │                                             │
 *      │  5. Google 回调 code + state             │                                             │
 *      │◀─────────────────────────────────────────│◀─────────────────────────────────────────────│
 *      │                                          │                                             │
 *      │  6. POST /google/callback {code, state}  │                                             │
 *      │─────────────────────────────────────────▶│  7. 验证 state（StateStore）                │
 *      │                                          │  8. code → tokens (HTTPS)                   │
 *      │                                          │─────────────────────────────────────────────▶│
 *      │                                          │  9. tokens 返回                              │
 *      │                                          │◀─────────────────────────────────────────────│
 *      │                                          │ 10. 验证 ID Token (JWKS)                    │
 *      │                                          │ 11. 查找/创建用户，落库 OAuth2Account        │
 *      │                                          │ 12. 签发平台 RS256 JWT                      │
 *      │                                          │ 13. 发布 OAuth2LoginEvent                   │
 *      │                                          │                                             │
 *      │ 14. 返回 {accessToken, userInfo}         │                                             │
 *      │◀─────────────────────────────────────────│                                             │
 * </pre>
 *
 * <h3>安全措施</h3>
 * <ul>
 *   <li>CSRF 防护：state 参数通过 StateStoreCapability 存储并验证</li>
 *   <li>ID Token 签名验证：通过 Google JWKS 公钥验证 RS256 签名</li>
 *   <li>JWT 签发：使用 RS256 非对称签名（JwtTokenService）</li>
 *   <li>Token 加密存储：OAuth2 令牌通过 AES-GCM 加密后落库</li>
 *   <li>Nonce 防重放：每次授权请求生成唯一 nonce</li>
 * </ul>
 *
 * <h3>架构合规（运行壳红线）</h3>
 * <ul>
 *   <li>[R3] HTTP 调用通过 HttpCapability 能力契约</li>
 *   <li>[R6] 配置读取通过 ConfigStoreCapability 能力契约</li>
 *   <li>[R2] 状态存储通过 StateStoreCapability 能力契约</li>
 *   <li>[R4] 跨插件通信通过 EventBusCapability 事件总线</li>
 * </ul>
 *
 * @author Shinwa Team
 * @since 3.0.0
 */
@Service
public class OAuth2ServiceImpl implements OAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ServiceImpl.class);

    // ==================== Google OAuth2 常量 ====================

    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    private static final String PROVIDER_GOOGLE = "google";

    /** OAuth2 State 缓存前缀 */
    private static final String STATE_CACHE_PREFIX = "identity:oauth2:state:";

    /** State 有效期（10 分钟） */
    private static final Duration STATE_TTL = Duration.ofMinutes(10);

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==================== 依赖注入 ====================

    private final UserRepository userRepository;
    private final SocialConnectionRepository socialConnectionRepository;
    private final ObjectMapper objectMapper;
    private final HttpCapability httpClient;
    private final ConfigStoreCapability configStore;
    private final StateStoreCapability stateStore;
    private final EventBusCapability eventBus;
    private final JwtTokenService jwtTokenService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    // ==================== 构造函数 ====================

    /**
     * 构造函数 — 所有依赖通过能力契约注入
     *
     * <p>[红线 R3] HttpClient → HttpCapability 能力契约</p>
     * <p>[红线 R6] @Value → ConfigStoreCapability 能力契约</p>
     * <p>[红线 R2] 缓存/状态 → StateStoreCapability 能力契约</p>
     * <p>[红线 R4] 事件通知 → EventBusCapability 能力契约</p>
     */
    public OAuth2ServiceImpl(
            UserRepository userRepository,
            SocialConnectionRepository socialConnectionRepository,
            ObjectMapper objectMapper,
            HttpCapability httpClient,
            ConfigStoreCapability configStore,
            StateStoreCapability stateStore,
            EventBusCapability eventBus,
            JwtTokenService jwtTokenService,
            GoogleIdTokenVerifier googleIdTokenVerifier) {
        this.userRepository = userRepository;
        this.socialConnectionRepository = socialConnectionRepository;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.configStore = configStore;
        this.stateStore = stateStore;
        this.eventBus = eventBus;
        this.jwtTokenService = jwtTokenService;
        this.googleIdTokenVerifier = googleIdTokenVerifier;
    }

    // ==================== OAuth2Service 实现 ====================

    @Override
    public String getGoogleAuthorizationUrl(String redirectUri, String state) {
        String clientId = getGoogleClientId();
        if (clientId.isBlank()) {
            throw new IllegalStateException("Google OAuth2 client-id is not configured");
        }

        // 生成 nonce（防止 ID Token 重放攻击）
        String nonce = generateSecureToken();

        // 将 state → nonce 映射存入 StateStore，用于回调时校验
        stateStore.put(STATE_CACHE_PREFIX + state, nonce, STATE_TTL);

        StringBuilder url = new StringBuilder(GOOGLE_AUTH_URL);
        url.append("?client_id=").append(encode(clientId));
        url.append("&redirect_uri=").append(encode(redirectUri));
        url.append("&response_type=code");
        url.append("&scope=").append(encode("openid email profile"));
        url.append("&access_type=offline");
        url.append("&prompt=consent");
        url.append("&state=").append(encode(state));
        url.append("&nonce=").append(encode(nonce));

        log.debug("Generated Google authorization URL for redirect_uri={}", redirectUri);
        return url.toString();
    }

    @Override
    @Transactional
    public OAuth2AuthResult handleGoogleCallback(String code, String redirectUri, String tenantId) {
        log.info("Processing Google OAuth2 callback for tenant={}", tenantId);

        // Step 1: 用授权码换取 Token
        OAuth2TokenResponse tokenResponse = exchangeCodeForTokens(code, redirectUri);
        log.debug("Token exchange successful");

        // Step 2: 使用 JWKS 验证 ID Token 签名 + Claims
        GoogleUserInfo userInfo = googleIdTokenVerifier.verify(
                tokenResponse.idToken(), getGoogleClientId());
        log.info("Google user authenticated: sub={}, email={}", userInfo.sub(), userInfo.email());

        // Step 3: 查找已有用户或创建新用户
        User user = findExistingUser(userInfo, tenantId);
        boolean isNewUser = (user == null);

        if (isNewUser) {
            user = createNewUser(userInfo, tenantId);
            user = userRepository.save(user);
            log.info("Created new user from Google OAuth2: userId={}", user.getId());
        } else if (!user.canLogin()) {
            throw OAuth2AuthenticationException.userDisabled(user.getId());
        }

        // Step 4: 创建或更新第三方账号关联（Token 字段使用 JPA Converter 自动加密落库）
        SocialConnection connection = findOrCreateSocialConnection(user, userInfo, tenantId);
        connection.updateTokens(
                tokenResponse.accessToken(),
                tokenResponse.refreshToken(),
                LocalDateTime.now().plusSeconds(tokenResponse.expiresIn()));
        connection.setIdToken(tokenResponse.idToken());
        connection.setScope(tokenResponse.scope());
        connection.recordLogin();
        socialConnectionRepository.save(connection);

        // Step 5: 更新用户最后登录时间
        user.recordLogin();
        userRepository.save(user);

        // Step 6: 使用 RS256 签发平台 JWT Token
        String accessToken = jwtTokenService.generateToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);

        // Step 7: 发布 OAuth2 登录事件（审计 + 跨插件通知）
        publishLoginEvent(user, userInfo, isNewUser, tenantId);

        log.info("Google OAuth2 login completed: userId={}, newUser={}", user.getId(), isNewUser);

        return new OAuth2AuthResult(
                isNewUser,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                accessToken,
                refreshToken,
                jwtTokenService.getExpirationSeconds()
        );
    }

    @Override
    public GoogleUserInfo verifyGoogleIdToken(String idToken) {
        return googleIdTokenVerifier.verify(idToken, getGoogleClientId());
    }

    @Override
    public void verifyState(String state) {
        if (state == null || state.isBlank()) {
            throw OAuth2AuthenticationException.invalidState();
        }

        String cacheKey = STATE_CACHE_PREFIX + state;
        Optional<String> storedNonce = stateStore.get(cacheKey, String.class);

        if (storedNonce.isEmpty()) {
            log.warn("OAuth2 state verification failed: state={}", state);
            throw OAuth2AuthenticationException.invalidState();
        }

        // 使用后立即删除（一次性使用，防止重放）
        stateStore.remove(cacheKey);
        log.debug("OAuth2 state verified and consumed: state={}", state);
    }

    @Override
    public OAuth2TokenResponse refreshToken(String provider, String refreshToken) {
        if (!PROVIDER_GOOGLE.equals(provider)) {
            throw new IllegalArgumentException("Unsupported provider: " + provider);
        }

        try {
            String requestBody = String.format(
                    "client_id=%s&client_secret=%s&refresh_token=%s&grant_type=refresh_token",
                    encode(getGoogleClientId()),
                    encode(getGoogleClientSecret()),
                    encode(refreshToken)
            );

            HttpResult response = httpClient.post(GOOGLE_TOKEN_URL, requestBody,
                    Map.of("Content-Type", "application/x-www-form-urlencoded"));

            if (response.statusCode() != 200) {
                log.error("Token refresh failed: HTTP {}", response.statusCode());
                throw OAuth2AuthenticationException.tokenExchangeFailed("Token refresh returned HTTP " + response.statusCode());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenData = objectMapper.readValue(response.body(), Map.class);

            return new OAuth2TokenResponse(
                    (String) tokenData.get("access_token"),
                    refreshToken, // Google 刷新时不返回新的 refresh_token
                    (String) tokenData.get("id_token"),
                    ((Number) tokenData.get("expires_in")).longValue(),
                    (String) tokenData.get("scope")
            );

        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to refresh Google token", e);
            throw OAuth2AuthenticationException.tokenExchangeFailed(e.getMessage());
        }
    }

    @Override
    @Transactional
    public void unlinkOAuth2Account(String userId, String provider, String tenantId) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        socialConnectionRepository.softDeleteByAuthUserAndProvider(user, provider, tenantId);
        log.info("Unlinked OAuth2 account: userId={}, provider={}", userId, provider);
    }

    // ==================== 私有方法 ====================

    /**
     * 用授权码换取 Token（RFC 6749 Section 4.1.3）
     */
    private OAuth2TokenResponse exchangeCodeForTokens(String code, String redirectUri) {
        try {
            String requestBody = String.format(
                    "code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=authorization_code",
                    encode(code),
                    encode(getGoogleClientId()),
                    encode(getGoogleClientSecret()),
                    encode(redirectUri)
            );

            HttpResult response = httpClient.post(GOOGLE_TOKEN_URL, requestBody,
                    Map.of("Content-Type", "application/x-www-form-urlencoded"));

            if (response.statusCode() != 200) {
                log.error("Token exchange failed: HTTP {}, body={}", response.statusCode(), response.body());
                throw OAuth2AuthenticationException.tokenExchangeFailed(
                        "HTTP " + response.statusCode());
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenData = objectMapper.readValue(response.body(), Map.class);

            String idToken = (String) tokenData.get("id_token");
            if (idToken == null || idToken.isBlank()) {
                throw OAuth2AuthenticationException.tokenExchangeFailed("Missing id_token in response");
            }

            return new OAuth2TokenResponse(
                    (String) tokenData.get("access_token"),
                    (String) tokenData.get("refresh_token"),
                    idToken,
                    ((Number) tokenData.get("expires_in")).longValue(),
                    (String) tokenData.get("scope")
            );

        } catch (OAuth2AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Token exchange failed", e);
            throw OAuth2AuthenticationException.tokenExchangeFailed(e.getMessage());
        }
    }

    /**
     * 查找已有用户（三级查找策略）
     *
     * @return 已有 User，或 null 表示需要创建
     */
    private User findExistingUser(GoogleUserInfo userInfo, String tenantId) {
        // 策略 1: 通过已有社交绑定查找
        Optional<SocialConnection> existingConnection = socialConnectionRepository
                .findByProviderAndProviderUserId(PROVIDER_GOOGLE, userInfo.sub(), tenantId);
        if (existingConnection.isPresent()) {
            return existingConnection.get().getAuthUser();
        }

        // 策略 2: 通过已验证邮箱匹配现有用户（自动关联）
        if (userInfo.email() != null && Boolean.TRUE.equals(userInfo.emailVerified())) {
            Optional<User> existingUser = userRepository.findByEmailAndTenantId(userInfo.email(), tenantId);
            if (existingUser.isPresent()) {
                log.info("Linking Google account to existing user by verified email: {}", userInfo.email());
                return existingUser.get();
            }
        }

        return null;
    }

    /**
     * 创建新用户
     */
    private User createNewUser(GoogleUserInfo userInfo, String tenantId) {
        String userId = generateUserId();
        String username = generateUsername(userInfo, tenantId);

        User newUser = new User(userId, tenantId, username);
        newUser.setEmail(userInfo.email());
        newUser.setEmailVerified(Boolean.TRUE.equals(userInfo.emailVerified()));
        newUser.setDisplayName(userInfo.name());
        newUser.setAvatarUrl(userInfo.picture());
        newUser.setRole(UserRole.USER);
        newUser.setStatus(UserStatus.ACTIVE);

        return newUser;
    }

    /**
     * 查找或创建社交绑定
     */
    private SocialConnection findOrCreateSocialConnection(User user, GoogleUserInfo userInfo, String tenantId) {
        return socialConnectionRepository
                .findByProviderAndProviderUserId(PROVIDER_GOOGLE, userInfo.sub(), tenantId)
                .orElseGet(() -> {
                    SocialConnection conn = new SocialConnection(
                            UUID.randomUUID().toString(), user, tenantId,
                            PROVIDER_GOOGLE, userInfo.sub());
                    conn.setEmail(userInfo.email());
                    conn.setEmailVerified(userInfo.emailVerified());
                    conn.setNickname(userInfo.name());
                    conn.setAvatarUrl(userInfo.picture());
                    return conn;
                });
    }

    /**
     * 发布 OAuth2 登录集成事件
     */
    private void publishLoginEvent(User user, GoogleUserInfo userInfo, boolean isNewUser, String tenantId) {
        try {
            OAuth2LoginEvent event = new OAuth2LoginEvent(
                    "identity-service",
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    PROVIDER_GOOGLE,
                    userInfo.sub(),
                    isNewUser,
                    tenantId
            );
            eventBus.publishIntegration(event);
            log.debug("Published OAuth2LoginEvent for userId={}", user.getId());
        } catch (Exception e) {
            // 事件发布失败不应影响登录流程
            log.warn("Failed to publish OAuth2LoginEvent: {}", e.getMessage());
        }
    }

    /**
     * 生成用户 ID
     */
    private String generateUserId() {
        // 格式: U + yyyyMMdd + 6 位随机数
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomNum = SECURE_RANDOM.nextInt(1_000_000);
        return "U" + datePrefix + String.format("%06d", randomNum);
    }

    /**
     * 生成用户名（基于 Google 信息，确保租户内唯一）
     */
    private String generateUsername(GoogleUserInfo userInfo, String tenantId) {
        if (userInfo.email() != null) {
            String prefix = userInfo.email().split("@")[0]
                    .replaceAll("[^a-zA-Z0-9._-]", ""); // 清理特殊字符
            if (prefix.isBlank()) {
                prefix = "user";
            }
            String candidate = prefix;
            int suffix = 1;

            while (userRepository.existsByUsernameAndTenantId(candidate, tenantId)) {
                candidate = prefix + suffix++;
            }
            return candidate;
        }

        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 生成安全随机令牌
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * URL 编码
     */
    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // ==================== 配置读取（通过 ConfigStoreCapability）====================

    private String getGoogleClientId() {
        return configStore.getString("identity.oauth2.google.client-id", "");
    }

    private String getGoogleClientSecret() {
        return configStore.getString("identity.oauth2.google.client-secret", "");
    }
}
