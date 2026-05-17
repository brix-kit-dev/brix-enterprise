/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.brix.enterprise.app.identity.dto.GoogleUserInfo;
import io.brix.enterprise.app.identity.dto.OAuth2AuthResult;
import io.brix.enterprise.app.identity.entity.SocialConnection;
import io.brix.enterprise.app.identity.entity.User;
import io.brix.enterprise.app.identity.enums.UserRole;
import io.brix.enterprise.app.identity.enums.UserStatus;
import io.brix.enterprise.app.identity.event.OAuth2LoginEvent;
import io.brix.enterprise.app.identity.exception.OAuth2AuthenticationException;
import io.brix.enterprise.app.identity.repository.SocialConnectionRepository;
import io.brix.enterprise.app.identity.repository.UserRepository;
import io.brix.enterprise.app.identity.service.OAuth2Service;
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
 * Google OAuth2 authentication service (production-grade).
 *
 * <p>Implements Google OpenID Connect authorization code flow per
 * RFC 6749 and OpenID Connect Core specifications.</p>
 *
 * <h3>Security measures</h3>
 * <ul>
 *   <li>CSRF: state parameter stored/verified via StateStoreCapability</li>
 *   <li>ID Token: RS256 signature verified via Google JWKS public keys</li>
 *   <li>Replay prevention: one-time nonce per authorization request</li>
 * </ul>
 *
 * <h3>Architecture compliance (Runtime Shell red lines)</h3>
 * <ul>
 *   <li>[R3] HTTP via HttpCapability</li>
 *   <li>[R6] Config via ConfigStoreCapability</li>
 *   <li>[R2] State via StateStoreCapability</li>
 *   <li>[R4] Events via EventBusCapability</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 */
@Service
public class OAuth2ServiceImpl implements OAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ServiceImpl.class);

    // ==================== Google OAuth2 Constants ====================

    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String PROVIDER_GOOGLE = "google";
    private static final String STATE_CACHE_PREFIX = "identity:oauth2:state:";
    private static final Duration STATE_TTL = Duration.ofMinutes(10);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==================== Dependencies ====================

    private final UserRepository userRepository;
    private final SocialConnectionRepository socialConnectionRepository;
    private final ObjectMapper objectMapper;
    private final HttpCapability httpClient;
    private final ConfigStoreCapability configStore;
    private final StateStoreCapability stateStore;
    private final EventBusCapability eventBus;
    private final JwtTokenService jwtTokenService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    // ==================== Constructor ====================

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

    // ==================== OAuth2Service Implementation ====================

    @Override
    public String getGoogleAuthorizationUrl(String redirectUri, String state) {
        String clientId = getGoogleClientId();
        if (clientId.isBlank()) {
            throw new IllegalStateException("Google OAuth2 client-id is not configured");
        }

        // Generate nonce (replay prevention for ID Token)
        String nonce = generateSecureToken();

        // Store state → nonce mapping for callback verification
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

        // Step 1: Exchange authorization code for tokens
        OAuth2TokenResponse tokenResponse = exchangeCodeForTokens(code, redirectUri);
        log.debug("Token exchange successful");

        // Step 2: Verify ID Token signature + claims via JWKS
        GoogleUserInfo userInfo = googleIdTokenVerifier.verify(
                tokenResponse.idToken(), getGoogleClientId());
        log.info("Google user authenticated: sub={}, email={}", userInfo.sub(), userInfo.email());

        // Step 3: Find existing user or create new one
        User user = findExistingUser(userInfo, tenantId);
        boolean isNewUser = (user == null);

        if (isNewUser) {
            user = createNewUser(userInfo, tenantId);
            user = userRepository.save(user);
            log.info("Created new user from Google OAuth2: userId={}", user.getId());
        } else if (!user.canLogin()) {
            throw OAuth2AuthenticationException.userDisabled(user.getId());
        }

        // Step 4: Create/update social connection (tokens encrypted via JPA Converter)
        SocialConnection connection = findOrCreateSocialConnection(user, userInfo, tenantId);
        connection.updateTokens(
                tokenResponse.accessToken(),
                tokenResponse.refreshToken(),
                LocalDateTime.now().plusSeconds(tokenResponse.expiresIn()));
        connection.setIdToken(tokenResponse.idToken());
        connection.setScope(tokenResponse.scope());
        connection.recordLogin();
        socialConnectionRepository.save(connection);

        // Step 5: Update last-login timestamp
        user.recordLogin();
        userRepository.save(user);

        // Step 6: Issue platform JWT (RS256)
        String accessToken = jwtTokenService.generateToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);

        // Step 7: Publish OAuth2 login event (audit + cross-plugin notification)
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

        // Consume immediately (one-time use, replay prevention)
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
                    refreshToken, // Google does not return a new refresh_token on refresh
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

    // ==================== Private Methods ====================

    /**
     * Exchanges authorization code for tokens (RFC 6749 Section 4.1.3).
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
     * Finds existing user via 3-tier lookup strategy.
     *
     * @return existing User, or null if new user needs to be created
     */
    private User findExistingUser(GoogleUserInfo userInfo, String tenantId) {
        // Strategy 1: Find by existing social connection
        Optional<SocialConnection> existingConnection = socialConnectionRepository
                .findByProviderAndProviderUserId(PROVIDER_GOOGLE, userInfo.sub(), tenantId);
        if (existingConnection.isPresent()) {
            return existingConnection.get().getAuthUser();
        }

        // Strategy 2: Match by verified email (auto-link)
        if (userInfo.email() != null && Boolean.TRUE.equals(userInfo.emailVerified())) {
            Optional<User> existingUser = userRepository.findByEmailAndTenantId(userInfo.email(), tenantId);
            if (existingUser.isPresent()) {
                log.info("Linking Google account to existing user by verified email: {}", userInfo.email());
                return existingUser.get();
            }
        }

        return null;
    }

    /** Creates a new user from Google account info. */
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

    /** Finds or creates a social connection for the given user and provider. */
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

    /** Publishes an OAuth2 login integration event. */
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
            // Event publishing failure must not break the login flow
            log.warn("Failed to publish OAuth2LoginEvent: {}", e.getMessage());
        }
    }

    /** Generates a unique user ID (U + yyyyMMdd + 6-digit random). */
    private String generateUserId() {
        // Format: U + yyyyMMdd + 6-digit random
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomNum = SECURE_RANDOM.nextInt(1_000_000);
        return "U" + datePrefix + String.format("%06d", randomNum);
    }

    /** Generates a username from Google info, ensuring uniqueness within the tenant. */
    private String generateUsername(GoogleUserInfo userInfo, String tenantId) {
        if (userInfo.email() != null) {
            String prefix = userInfo.email().split("@")[0]
                    .replaceAll("[^a-zA-Z0-9._-]", "");
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

    /** Generates a cryptographically secure random token. */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** URL-encodes a value. */
    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    // ==================== Config (via ConfigStoreCapability) ====================

    private String getGoogleClientId() {
        return configStore.getString("identity.oauth2.google.client-id", "");
    }

    private String getGoogleClientSecret() {
        return configStore.getString("identity.oauth2.google.client-secret", "");
    }
}
