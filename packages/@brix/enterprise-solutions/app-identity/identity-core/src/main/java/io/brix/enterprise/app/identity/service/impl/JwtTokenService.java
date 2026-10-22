/*
 * Copyright 2026 Brix Platform Authors
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import io.brix.enterprise.app.identity.entity.User;
import io.brix.enterprise.app.identity.exception.JwtSigningException;
import io.brix.enterprise.app.identity.repository.RbacRepository;
import io.runtime.sdk.capability.ConfigStoreCapability;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.*;

/**
 * JWT Token issuance service using RS256 (RSA + SHA-256) algorithm.
 *
 * <p>This service issues JWT tokens for authenticated users. It pairs with
 * {@code platform-auth}'s JwtValidator which performs RS256 public-key verification.</p>
 *
 * <h3>Security Fix — Phase 0.1 (JWT Claim Injection Prevention)</h3>
 * <p>JWT payload is built using Jackson {@link ObjectMapper} instead of {@code String.format}
 * to prevent claim injection attacks. All user-supplied values are properly escaped by
 * the JSON serializer, eliminating the risk of malicious claim injection through crafted
 * usernames, emails, or other user-controlled fields.</p>
 *
 * <h3>Architecture Compliance — Red Line 6</h3>
 * <ul>
 *   <li>All configuration is obtained via {@link ConfigStoreCapability}, no {@code @Value} annotations.</li>
 * </ul>
 *
 * <h3>Configuration Keys</h3>
 * <ul>
 *   <li>{@code identity.jwt.private-key-path} — JWT private key path (default: classpath:keys/private.pem)</li>
 *   <li>{@code identity.jwt.issuer} — JWT issuer (default: brix-auth-center)</li>
 *   <li>{@code identity.jwt.audience} — JWT audience (default: brix-platform-api)</li>
 *   <li>{@code identity.jwt.expiration} — JWT token lifetime in seconds (default: 3600)</li>
 * </ul>
 *
 * <h3>Security Notes</h3>
 * <ul>
 *   <li>Private keys should be stored securely; use Vault or encrypted config center in production.</li>
 *   <li>Configuration can be hot-updated via ConfigStoreCapability at runtime.</li>
 * </ul>
 *
 * @author Brix Platform Team
 * @since 3.0.0
 * @version 3.2.1 — Phase 0.1 JWT Claim injection fix (String.format → ObjectMapper)
 * @deprecated Since 3.2.0 — D4 阶段已停用。JWT 颁发能力下沉到 Layer 2A
 *     {@code io.runtime.sdk.capability.JwtIssuerCapability}（实现 {@code JwtIssuerCapabilityImpl}）。
 *     本类仅服务于仍未迁移的 legacy token 调用，将在 4.0.0 与 legacy JWT 契约一同移除。
 *     新代码请直接注入 {@code JwtIssuerCapability}。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
@Service
public class JwtTokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);

    // ==================== Configuration Key Constants ====================

    /** Configuration key for JWT private key path. */
    private static final String CONFIG_KEY_PRIVATE_KEY_PATH = "identity.jwt.private-key-path";

    /** Configuration key for JWT issuer. */
    private static final String CONFIG_KEY_ISSUER = "identity.jwt.issuer";

    /** Configuration key for JWT audience. */
    private static final String CONFIG_KEY_AUDIENCE = "identity.jwt.audience";

    /** Configuration key for JWT token lifetime in seconds. */
    private static final String CONFIG_KEY_EXPIRATION = "identity.jwt.expiration";

    /** Configuration key for Identity Token lifetime in seconds. */
    private static final String CONFIG_KEY_IDENTITY_TOKEN_EXPIRATION = "identity.jwt.identity-token-expiration";

    // ==================== Default Value Constants ====================

    /** Default private key path. */
    private static final String DEFAULT_PRIVATE_KEY_PATH = "classpath:keys/private.pem";

    /** Default issuer value. */
    private static final String DEFAULT_ISSUER = "brix-auth-center";

    /** Default audience value. */
    private static final String DEFAULT_AUDIENCE = "brix-platform-api";

    /** Default token lifetime in seconds. */
    private static final long DEFAULT_EXPIRATION_SECONDS = 3600L;

    /** Default Identity Token lifetime in seconds (5 minutes). */
    private static final long DEFAULT_IDENTITY_TOKEN_EXPIRATION_SECONDS = 300L;

    // ==================== JWT Claim Key Constants ====================

    /** Claim key: token type (access / identity / refresh). */
    private static final String CLAIM_TOKEN_TYPE = "token_type";

    /** Claim key: token role (actor / subject). */
    private static final String CLAIM_ROLE = "role";

    /** Claim key: tenant ID. */
    private static final String CLAIM_TENANT_ID = "tenant_id";

        /** Error message used when a token would otherwise be issued without tenant isolation. */
        private static final String TENANT_CONTEXT_REQUIRED_MESSAGE =
            "Tenant context is required to issue identity tokens";

    /** Claim key: member ID (B-side actor). */
    private static final String CLAIM_MEMBER_ID = "mid";

    /** Claim key: member type (B-side actor). */
    private static final String CLAIM_MEMBER_TYPE = "mtype";

    /** Claim key: principal ID (C-side subject). */
    private static final String CLAIM_PRINCIPAL_ID = "pid";

    /** Claim key: principal type (C-side subject). */
    private static final String CLAIM_PRINCIPAL_TYPE = "ptype";

    /** Claim key: allowed actions (Identity Token). */
    private static final String CLAIM_ALLOWED_ACTIONS = "allowed_actions";

    /** Token type value: access token. */
    private static final String TOKEN_TYPE_ACCESS = "access";

    /** Token type value: identity token. */
    private static final String TOKEN_TYPE_IDENTITY = "identity";

    /** Token role value: B-side actor. */
    private static final String ROLE_ACTOR = "actor";

    /** Token role value: C-side subject. */
    private static final String ROLE_SUBJECT = "subject";

    /** Allowed actions for Identity Token. */
    private static final List<String> IDENTITY_TOKEN_ACTIONS = List.of("select-tenant", "register-tenant");

    // ==================== Capability Dependencies ====================

    /**
     * Configuration store capability.
     *
     * <p><b>Red Line 6 compliance</b>: all configuration is obtained via ConfigStoreCapability.
     * No direct usage of {@code @Value}, {@code System.getenv()}, or {@code System.getProperty()}.</p>
     */
    private final ConfigStoreCapability configStore;

    /**
     * Jackson ObjectMapper for safe JWT payload serialization.
     *
     * <p><b>Phase 0.1 Security Fix</b>: replaces {@code String.format} to prevent
     * JWT claim injection attacks. All user-supplied values are properly JSON-escaped
     * by the ObjectMapper, eliminating injection vectors through crafted usernames,
     * emails, or other user-controlled fields.</p>
     */
    private final ObjectMapper objectMapper = JsonMapper.builder().configureForJackson2().build();

    // ==================== Configuration Fields (loaded from ConfigStoreCapability at runtime) ====================

    /** JWT private key path. */
    private String privateKeyPath;

    /** JWT issuer. */
    private String issuer;

    /** JWT audience. */
    private String audience;

    /** JWT token lifetime in seconds. */
    private long expirationSeconds;

    /** Identity Token lifetime in seconds. */
    private long identityTokenExpirationSeconds;

    /** RSA private key used for RS256 signing. */
    private PrivateKey privateKey;

    // ==================== Constructor ====================

    /**
     * RBAC repository for loading user roles and permissions from the database.
     *
     * <p>Injected by Spring and used during JWT generation to populate the
     * {@code roles} and {@code permissions} claims with real RBAC data
     * instead of hardcoded defaults.</p>
     */
    private final RbacRepository rbacRepository;

    /**
     * Constructs the JWT token service with the required capabilities.
     *
     * @param configStore    the configuration store capability for reading JWT settings
     * @param rbacRepository the RBAC repository for loading user roles and permissions
     */
    @Autowired
    public JwtTokenService(ConfigStoreCapability configStore, RbacRepository rbacRepository) {
        this.configStore = configStore;
        this.rbacRepository = rbacRepository;
    }

    // ==================== Initialization ====================

    /**
     * Initializes the service by loading configuration from ConfigStoreCapability.
     *
     * <p><b>Architecture note</b>: configuration is loaded during {@code @PostConstruct} phase
     * from ConfigStoreCapability. This allows configuration to originate from any source
     * (environment variables, config center, Vault, etc.) as determined by the Host layer's
     * ConfigStoreCapability implementation.</p>
     */
    @PostConstruct
    public void init() {
        // Load configuration via ConfigStoreCapability (Red Line 6 compliance)
        this.privateKeyPath = configStore.getString(CONFIG_KEY_PRIVATE_KEY_PATH, DEFAULT_PRIVATE_KEY_PATH);
        this.issuer = configStore.getString(CONFIG_KEY_ISSUER, DEFAULT_ISSUER);
        this.audience = configStore.getString(CONFIG_KEY_AUDIENCE, DEFAULT_AUDIENCE);
        this.expirationSeconds = configStore.getLong(CONFIG_KEY_EXPIRATION, DEFAULT_EXPIRATION_SECONDS);
        this.identityTokenExpirationSeconds = configStore.getLong(
                CONFIG_KEY_IDENTITY_TOKEN_EXPIRATION, DEFAULT_IDENTITY_TOKEN_EXPIRATION_SECONDS);

        try {
            this.privateKey = loadPrivateKey(privateKeyPath);
            log.info("[JwtTokenService] RS256 private key loaded from: {}", privateKeyPath);
            log.info("[JwtTokenService] JWT config: issuer={}, audience={}, expiration={}s",
                    issuer, audience, expirationSeconds);
        } catch (Exception e) {
            log.warn("[JwtTokenService] Failed to load private key from {}: {}. " +
                    "JWT signing will not be available.", privateKeyPath, e.getMessage());
        }
    }

    // ==================== Public Methods ====================

    /**
     * Issues a JWT access token for the given user using RS256 algorithm.
     *
     * <p>The token contains the following standard claims:</p>
     * <ul>
     *   <li>{@code sub} — User ID (subject)</li>
     *   <li>{@code username} — Username</li>
     *   <li>{@code tenant_id} — Tenant ID for multi-tenancy support</li>
     *   <li>{@code roles} — User role array</li>
     *   <li>{@code permissions} — Permission array (empty, to be populated by RBAC in Phase 1.6)</li>
     *   <li>{@code email} — User email address</li>
     *   <li>{@code iss} — Token issuer</li>
     *   <li>{@code aud} — Token audience</li>
     *   <li>{@code iat} — Issued-at timestamp (epoch seconds)</li>
     *   <li>{@code exp} — Expiration timestamp (epoch seconds)</li>
     *   <li>{@code jti} — Unique token identifier (UUID) for revocation support</li>
     *   <li>{@code tv} — Token version (for future token format migration)</li>
     * </ul>
     *
     * <p><b>Phase 0.1 Security Fix</b>: JWT payload is built using Jackson {@link ObjectMapper}
     * instead of {@code String.format} to prevent claim injection attacks. All user-supplied
     * values (username, email, etc.) are safely serialized by the JSON serializer.</p>
     *
     * @param user the authenticated user entity
     * @return the signed JWT token string in format: header.payload.signature
     * @throws IllegalStateException if the private key has not been loaded
     * @throws JwtSigningException   if JSON serialization or RSA signing fails
     */
    public String generateToken(User user) {
        if (privateKey == null) {
            throw new IllegalStateException("JWT private key not loaded, cannot sign tokens");
        }

        long now = System.currentTimeMillis() / 1000;
        long exp = now + expirationSeconds;

        // Header: {"alg":"RS256","typ":"JWT"}
        String header = base64UrlEncode("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");

        // Build payload using Jackson ObjectMapper to prevent claim injection attacks.
        // All user-controlled values (username, email, role, tenantId) are properly
        // JSON-escaped, eliminating injection vectors such as:
        //   username = '", "admin": true, "ignore": "'
        // which would have been exploitable with String.format.
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getId());
        claims.put("username", user.getUsername());
        String tenantId = requireTenantId(user.getTenantId());
        claims.put("tenant_id", tenantId);
        claims.put("iss", issuer);
        claims.put("aud", audience);

        // Load roles and permissions from RBAC tables (Phase 1.6)
        List<String> roles = rbacRepository.findActiveRoleCodesByUserIdAndTenantId(user.getId(), tenantId);
        if (roles.isEmpty()) {
            // Fallback to legacy User.role field if no RBAC role assignments exist
            roles = List.of(user.getRole() != null ? user.getRole().name() : "USER");
        }
        claims.put("roles", roles);
        claims.put("permissions", rbacRepository.findActivePermissionCodesByUserIdAndTenantId(user.getId(), tenantId));
        claims.put("email", user.getEmail() != null ? user.getEmail() : "");
        claims.put("tv", 1);
        claims.put("jti", UUID.randomUUID().toString());
        claims.put("iat", now);
        claims.put("exp", exp);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(claims);
        } catch (JacksonException e) {
            throw new JwtSigningException(
                    "Failed to serialize JWT claims to JSON",
                    JwtSigningException.FailureType.SIGNING, e);
        }

        String payload = base64UrlEncode(payloadJson);

        // Sign with RS256
        String signingInput = header + "." + payload;
        String signature = rs256Sign(signingInput);

        return signingInput + "." + signature;
    }

    private static String requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException(TENANT_CONTEXT_REQUIRED_MESSAGE);
        }
        return tenantId;
    }

    // ==================== Phase 2 — Dual-track Token Generation ====================

    /**
     * 签发 B 端 Actor Access Token。
     *
     * <p>包含 {@code mid} / {@code mtype} / {@code role=actor} 声明，
     * 与 C 端 {@link #generateSubjectAccessToken} 互斥（mid ↔ pid 不会同时出现）。</p>
     *
     * @param identityId 全局身份 ID（sys_identity.id）
     * @param email      用户邮箱
     * @param username   用户名
     * @param tenantId   租户 ID
     * @param memberId   租户成员 ID（sys_tenant_member.id）
     * @param memberType 成员类型（OWNER / ADMIN / MEMBER）
     * @param roles      角色编码列表
     * @param permissions 权限编码列表
     * @return 已签名的 JWT Access Token
     * @since 3.2.0
     */
    public String generateActorAccessToken(Long identityId, String email, String username,
                                           Long tenantId, Long memberId, String memberType,
                                           List<String> roles, List<String> permissions) {
        Map<String, Object> claims = buildBaseClaims(String.valueOf(identityId), username, email);
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);
        claims.put(CLAIM_ROLE, ROLE_ACTOR);
        claims.put(CLAIM_TENANT_ID, String.valueOf(tenantId));
        claims.put(CLAIM_MEMBER_ID, String.valueOf(memberId));
        claims.put(CLAIM_MEMBER_TYPE, memberType);
        claims.put("roles", roles != null ? roles : Collections.emptyList());
        claims.put("permissions", permissions != null ? permissions : Collections.emptyList());
        return signToken(claims, expirationSeconds);
    }

    /**
     * 签发 C 端 Subject Access Token。
     *
     * <p>包含 {@code pid} / {@code ptype} / {@code role=subject} 声明，
     * 与 B 端 {@link #generateActorAccessToken} 互斥。</p>
     *
     * @param identityId    全局身份 ID
     * @param email         用户邮箱
     * @param username      用户名
     * @param tenantId      租户 ID
     * @param principalId   租户主体 ID（sys_tenant_principal.id）
     * @param principalType 主体类型（CUSTOMER / GUEST）
     * @param displayName   C 端显示名称
     * @return 已签名的 JWT Access Token
     * @since 3.2.0
     */
    public String generateSubjectAccessToken(Long identityId, String email, String username,
                                             Long tenantId, Long principalId, String principalType,
                                             String displayName) {
        Map<String, Object> claims = buildBaseClaims(String.valueOf(identityId), username, email);
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);
        claims.put(CLAIM_ROLE, ROLE_SUBJECT);
        claims.put(CLAIM_TENANT_ID, String.valueOf(tenantId));
        claims.put(CLAIM_PRINCIPAL_ID, String.valueOf(principalId));
        claims.put(CLAIM_PRINCIPAL_TYPE, principalType);
        if (displayName != null) {
            claims.put("display_name", displayName);
        }
        // C-side: minimal roles/permissions (future: C-side RBAC)
        claims.put("roles", Collections.emptyList());
        claims.put("permissions", Collections.emptyList());
        return signToken(claims, expirationSeconds);
    }

    /**
     * 签发 Identity Token（租户选择令牌）。
     *
     * <p>短命令牌（默认 5 分钟），仅允许 {@code select-tenant} 和 {@code register-tenant} 操作。
     * 用于多租户用户在登录第一阶段验证身份后、选择目标租户前的过渡状态。</p>
     *
     * @param identityId 全局身份 ID
     * @param email      用户邮箱
     * @param username   用户名
     * @return 已签名的 JWT Identity Token
     * @since 3.2.0
     */
    public String generateIdentityToken(Long identityId, String email, String username) {
        Map<String, Object> claims = buildBaseClaims(String.valueOf(identityId), username, email);
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_IDENTITY);
        claims.put(CLAIM_ALLOWED_ACTIONS, IDENTITY_TOKEN_ACTIONS);
        return signToken(claims, identityTokenExpirationSeconds);
    }

    /**
     * 返回 Identity Token 配置的过期秒数。
     *
     * @return Identity Token 有效期（秒）
     * @since 3.2.0
     */
    public long getIdentityTokenExpirationSeconds() {
        return identityTokenExpirationSeconds;
    }

    /**
     * Generates an opaque refresh token.
     *
     * <p>Uses a random UUID combined with the user ID as a non-JWT opaque token.
     * In production, this should be stored in a database for revocation support
     * (planned in Phase 4.3 — refresh token rotation + DB tracking).</p>
     *
     * @param user the user entity
     * @return the opaque refresh token string
     */
    public String generateRefreshToken(User user) {
        return UUID.randomUUID().toString() + "-" + user.getId();
    }

    /**
     * Returns the configured token lifetime in seconds.
     *
     * @return the token expiration duration in seconds
     */
    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    // ==================== Private Methods ====================

    /**
     * Builds common JWT claims shared by all token types.
     *
     * @param sub      subject (user/identity ID)
     * @param username username
     * @param email    email
     * @return mutable ordered map of base claims (without exp/iat which are added by signToken)
     */
    private Map<String, Object> buildBaseClaims(String sub, String username, String email) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", sub);
        claims.put("username", username);
        claims.put("iss", issuer);
        claims.put("aud", audience);
        claims.put("email", email != null ? email : "");
        claims.put("tv", 2);
        claims.put("jti", UUID.randomUUID().toString());
        return claims;
    }

    /**
     * Signs a JWT token with the given claims and expiration.
     *
     * @param claims           the JWT claims map
     * @param expirationSecs   token lifetime in seconds
     * @return the signed JWT string
     */
    private String signToken(Map<String, Object> claims, long expirationSecs) {
        if (privateKey == null) {
            throw new IllegalStateException("JWT private key not loaded, cannot sign tokens");
        }

        long now = System.currentTimeMillis() / 1000;
        claims.put("iat", now);
        claims.put("exp", now + expirationSecs);

        String header = base64UrlEncode("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(claims);
        } catch (JacksonException e) {
            throw new JwtSigningException(
                    "Failed to serialize JWT claims to JSON",
                    JwtSigningException.FailureType.SIGNING, e);
        }
        String payload = base64UrlEncode(payloadJson);
        String signingInput = header + "." + payload;
        return signingInput + "." + rs256Sign(signingInput);
    }

    /**
     * Signs the input string using RS256 (SHA-256 with RSA) algorithm.
     *
     * @param input the content to sign (header.payload)
     * @return the Base64 URL-encoded signature string
     * @throws JwtSigningException if the RSA signature operation fails
     */
    private String rs256Sign(String input) {
        try {
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(privateKey);
            sig.update(input.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = sig.sign();
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        } catch (Exception e) {
            // [R10 Fix] Use domain-specific JwtSigningException instead of RuntimeException
            throw new JwtSigningException(
                "Failed to sign JWT token - RSA signature operation failed",
                JwtSigningException.FailureType.SIGNING, e);
        }
    }

    /**
     * Base64 URL-encodes the given string content (without padding).
     *
     * @param content the string to encode
     * @return the Base64 URL-encoded string without padding characters
     */
    private String base64UrlEncode(String content) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(content.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Loads an RSA private key from the specified path.
     *
     * <p>Supports both classpath and filesystem paths. The private key must be
     * in PKCS#8 PEM format.</p>
     *
     * @param path the private key path (e.g., classpath:keys/private.pem)
     * @return the RSA private key object
     * @throws JwtSigningException if the key file cannot be loaded or parsed
     */
    private PrivateKey loadPrivateKey(String path) {
        try {
            ResourceLoader loader = new DefaultResourceLoader();
            Resource resource = loader.getResource(path);

            try (InputStream is = resource.getInputStream()) {
                String keyContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                keyContent = keyContent
                        .replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s", "");

                byte[] keyBytes = Base64.getDecoder().decode(keyContent);
                PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
                KeyFactory keyFactory = KeyFactory.getInstance("RSA");
                return keyFactory.generatePrivate(spec);
            }
        } catch (Exception e) {
            // [R10 Fix] Use domain-specific JwtSigningException instead of RuntimeException
            throw new JwtSigningException(
                "Failed to load JWT private key - file not found or invalid format",
                JwtSigningException.FailureType.KEY_LOADING, path, e);
        }
    }
}
